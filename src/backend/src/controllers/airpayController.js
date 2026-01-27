const crypto = require('crypto');
const CRC32 = require('crc-32');
const AirpayPayment = require('../models/AirpayPayment');
const HourlyAuction = require('../models/HourlyAuction');
const HourlyAuctionJoin = require('../models/HourlyAuctionJoin');
const AuctionHistory = require('../models/AuctionHistory');
const User = require('../models/user');
const { syncUserStats } = require('./userController');
const { sendPrizeClaimedEmail } = require('../utils/emailService');

const AIRPAY_SECRET = process.env.AIRPAY_SECRET;
const AIRPAY_MID = process.env.AIRPAY_MERCHANT_ID;
const AIRPAY_CLIENT_ID = process.env.AIRPAY_CLIENT_ID;
const AIRPAY_CLIENT_SECRET = process.env.AIRPAY_CLIENT_SECRET;
const AIRPAY_USERNAME = process.env.AIRPAY_USERNAME;
const AIRPAY_PASSWORD = process.env.AIRPAY_PASSWORD;

const TOKEN_URL = "https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/token.php";
const PAY_URL = 'https://payments.airpay.co.in/pay/v4/index.php';

const keyHash = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
const ivFixed = crypto.randomBytes(8).toString('hex'); // Used in some kit versions

// Helper functions matching documentation EXACTLY as provided in snippets
function decrypt(responsedata, secretKey) {
  let data = responsedata;
  try {
    const hash = crypto.createHash('sha256').update(data).digest();
    const iv = hash.slice(0, 16);
    const encryptedData = Buffer.from(data.slice(16), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), iv);
    let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
    decrypted += decipher.final();
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

function encryptChecksum(data, salt) {
  const key = crypto.createHash('sha256').update(`${salt}@${data}`).digest('hex');
  return key;
}

function encrypt(request, secretKey) {
  // Using the ivHex logic from the snippet
  const ivLocal = crypto.randomBytes(8).toString('hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(ivLocal));
  const raw = Buffer.concat([cipher.update(request, 'utf-8'), cipher.final()]);
  const data = ivLocal + raw.toString('base64');
  return data;
}

function checksumcal(postData) {
  const sortedData = {};
  Object.keys(postData).sort().forEach(function(key) {
      sortedData[key] = postData[key];
  });

  let data = '';
  for (const value of Object.values(sortedData)) {
      data += value;
  }
  const dateStr = new Date().toISOString().split('T')[0];
  return crypto.createHash('sha256').update(data + dateStr).digest('hex');
}

async function sendPostData(tokenUrl, postData) {
  try {
      const response = await fetch(tokenUrl, {
          method: 'POST',
          body: new URLSearchParams(postData),
      });
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const responseData = await response.text();
      return responseData;
  } catch (error) {
      console.error('Error sending POST request:', error);
      return null;
  }
}

// Rendering Methods for Airpay Whitelisting & Standard Integration
exports.renderTxn = (req, res) => {
  res.render('txn', { title: 'Airpay Transaction' });
};

// Helper to get Airpay redirect data
async function getAirpayRedirectData(reqBody) {
    const dataObject = {
        buyer_email: reqBody.email || reqBody.buyerEmail || 'user@dream60.com',
        buyer_firstname: reqBody.firstname || reqBody.buyerFirstName || 'User',
        buyer_lastname: reqBody.lastname || reqBody.buyerLastName || 'D60',
        buyer_address: reqBody.address || reqBody.buyerAddress || 'NA',
        buyer_city: reqBody.city || reqBody.buyerCity || 'NA',
        buyer_state: reqBody.state || reqBody.buyerState || 'NA',
        buyer_country: reqBody.country || reqBody.buyerCountry || 'India',
        amount: Number(reqBody.amount).toFixed(2).toString(),
        orderid: reqBody.orderid || reqBody.orderId,
        buyer_phone: reqBody.phone || reqBody.buyerPhone || '9999999999',
        buyer_pincode: reqBody.pincode || reqBody.buyerPinCode || '400001',
        iso_currency: reqBody.isocurrency || 'INR',
        currency_code: reqBody.currency || '356',
        merchant_id: AIRPAY_MID
    };

    const udata = (AIRPAY_USERNAME + ':|:' + AIRPAY_PASSWORD);
    const privatekey = encryptChecksum(udata, AIRPAY_SECRET);
    const checksum = checksumcal(dataObject);
    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    const encryptedfData = encrypt(JSON.stringify(dataObject), key);

    let request = {
       client_id: AIRPAY_CLIENT_ID,
       client_secret: AIRPAY_CLIENT_SECRET,
       grant_type: 'client_credentials',
       merchant_id: AIRPAY_MID
     };

    const encryptedData = encrypt(JSON.stringify(request), key);
    const reqs = {
       merchant_id: AIRPAY_MID,
       encdata: encryptedData,
       checksum: checksumcal(request)
     };

    let accessTokenResponse = await sendPostData(TOKEN_URL, reqs);
    if (!accessTokenResponse) throw new Error("Failed to get access token");

    const parsedTokenResponse = JSON.parse(accessTokenResponse);
    const decryptedTokenData = decrypt(parsedTokenResponse.response, key);
    
    const match = decryptedTokenData.match(/"data"\s*:\s*\{[^}]*\}/);
    if (!match) throw new Error('No match found for "data" key in token response.');
    
    let tokenObj = JSON.parse("{" + match[0] + "}");
    let accesstoken = tokenObj.data.access_token;
    
    let finalUrl = `${PAY_URL}?token=${encodeURIComponent(accesstoken)}`;

    return {
        url: finalUrl,
        params: {
            mercid: AIRPAY_MID,
            data: encryptedfData,
            privatekey: privatekey,
            checksum: checksum,
            customvar: reqBody.userId || reqBody.customvar || ''
        },
        dataObject
    };
}

exports.sendToAirpay = async (req, res) => {
  try {
    const redirectData = await getAirpayRedirectData(req.body);

    res.render('sendToAirpay', { 
      mid: AIRPAY_MID, 
      data: redirectData.params.data, 
      privatekey: redirectData.params.privatekey, 
      checksum: redirectData.params.checksum, 
      URL: redirectData.url,
      fdata: req.body
    });
  } catch (error) {
    console.error('sendToAirpay error:', error);
    res.status(500).send("Error initiating payment: " + error.message);
  }
};

exports.handleAirpayResponse = async (req, res) => {
  try {
    console.log('--- Airpay Response Received ---');
    console.log('Method:', req.method);
    console.log('Body Keys:', Object.keys(req.body));
    console.log('Query Keys:', Object.keys(req.query));

    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    
    // Check both body and query for 'response'
    const responseData = req.body.response || req.query.response;
    
    if (!responseData) {
      console.error('Airpay Error: Missing response data in both body and query');
      const frontendUrl = process.env.VITE_ENVIRONMENT === 'production' ? 'https://dream60.com' : 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/failure?message=${encodeURIComponent('Payment response data missing from Airpay')}`);
    }

    const decrypteddata = decrypt(responseData, key);
    
    const match = decrypteddata.match(/"data"\s*:\s*\{[^}]*\}/);
    if (!match) throw new Error('No match found for "data" key in response.');

    let token = JSON.parse("{" + match[0] + "}");
    const data = token.data;

    var TRANSACTIONID = data.orderid;
    var APTRANSACTIONID = data.ap_transactionid;
    var AMOUNT = data.amount;
    var TRANSACTIONSTATUS = data.transaction_status;
    var MESSAGE = data.message;
    var ap_SecureHash = data.ap_securehash;
    var CUSTOMVAR = data.custom_var;

    // Additional fields from req.body or req.query (Airpay sends these in POST body or GET query)
    var PAYMENT_METHOD = req.body.CHMOD || req.query.CHMOD || '';
    var BANK_NAME = req.body.BANKNAME || req.query.BANKNAME || '';
    var CARD_NAME = req.body.CARDNAME || req.query.CARDNAME || '';
    var CARD_NUMBER = req.body.CARDNUMBER || req.query.CARDNUMBER || '';
    var UPI_ID = req.body.CUSTOMERVPA || req.query.CUSTOMERVPA || '';

    var hashdata = TRANSACTIONID + ':' + APTRANSACTIONID + ':' + AMOUNT + ':' + TRANSACTIONSTATUS + ':' + MESSAGE + ':' + AIRPAY_MID + ':' + AIRPAY_USERNAME;
    
    var txnhash = CRC32.str(hashdata);
    if (PAYMENT_METHOD === 'upi') {
      txnhash = CRC32.str(TRANSACTIONID + ':' + APTRANSACTIONID + ':' + AMOUNT + ':' + TRANSACTIONSTATUS + ':' + MESSAGE + ':' + AIRPAY_MID + ':' + AIRPAY_USERNAME + ':' + UPI_ID);
    }
    txnhash = (txnhash >>> 0);

    // Business Logic Integration
    const finalStatus = (TRANSACTIONSTATUS === '200') ? 'paid' : 'failed';
    const payment = await AirpayPayment.findOneAndUpdate(
      { orderId: TRANSACTIONID },
      { 
        status: finalStatus, 
        airpayTransactionId: APTRANSACTIONID,
        airpayResponse: data,
        paidAt: finalStatus === 'paid' ? new Date() : null,
        message: MESSAGE,
        customVar: CUSTOMVAR,
        paymentMethod: PAYMENT_METHOD,
        bankName: BANK_NAME,
        cardName: CARD_NAME,
        cardNumber: CARD_NUMBER,
        vpa: UPI_ID
      },
      { new: true }
    );

    if (payment && finalStatus === 'paid') {
      if (payment.paymentType === 'ENTRY_FEE') {
        await handleEntryFeeSuccess(payment);
      } else {
        await handlePrizeClaimSuccess(payment);
      }
    }

    // Set cookie for frontend transaction summary
    const txnSummary = {
      orderId: TRANSACTIONID,
      txnId: APTRANSACTIONID,
      amount: AMOUNT,
      status: finalStatus,
      message: MESSAGE,
      method: PAYMENT_METHOD,
      upiId: UPI_ID,
      bankName: BANK_NAME,
      cardName: CARD_NAME,
      cardNumber: CARD_NUMBER,
      timestamp: new Date().toISOString()
    };

    res.cookie('airpay_txn_data', JSON.stringify(txnSummary), { 
      maxAge: 3600000, // 1 hour
      path: '/'
    });

    const frontendUrl = process.env.VITE_ENVIRONMENT === 'production' ? 'https://dream60.com' : 'http://localhost:3000';
    const redirectUrl = finalStatus === 'paid' 
      ? `${frontendUrl}/payment/success?txnId=${TRANSACTIONID}&amount=${AMOUNT}`
      : `${frontendUrl}/payment/failure?txnId=${TRANSACTIONID}&message=${encodeURIComponent(MESSAGE)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('handleAirpayResponse error:', error);
    res.status(500).send("Error processing payment response");
  }
};

exports.handleAirpaySuccess = exports.handleAirpayResponse;
exports.handleAirpayFailure = exports.handleAirpayResponse;

// Original API Methods (Maintained for backward compatibility and internal app use)
exports.createOrder = async (req, res) => {
    try {
        const { userId, auctionId, hourlyAuctionId, amount, paymentType = 'ENTRY_FEE' } = req.body;
        const resolvedAuctionId = auctionId || hourlyAuctionId;
        
        if (!resolvedAuctionId) {
            return res.status(400).json({ success: false, message: "auctionId or hourlyAuctionId is required" });
        }

        const orderId = `D60-${Date.now()}`;
        
        await AirpayPayment.create({
            userId,
            auctionId: resolvedAuctionId,
            amount,
            orderId,
            status: 'created',
            paymentType
        });

        // Get the full redirect data including tokenized URL
        const redirectData = await getAirpayRedirectData({
            ...req.body,
            orderId: orderId,
            amount: amount
        });

        res.status(200).json({
            success: true,
            data: {
                orderId,
                url: redirectData.url,
                params: {
                    mid: AIRPAY_MID,
                    mercid: AIRPAY_MID,
                    data: redirectData.params.data,
                    encdata: redirectData.params.data,
                    privatekey: redirectData.params.privatekey,
                    checksum: redirectData.params.checksum,
                    customvar: userId
                }
            }
        });
    } catch (error) {
        console.error('Airpay createOrder error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.handleResponse = exports.handleAirpayResponse; // Alias

async function handleEntryFeeSuccess(payment) {
  const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId: payment.auctionId });
  if (!hourlyAuction) return;

  const user = await User.findOne({ user_id: payment.userId });
  const username = user ? user.username : 'Unknown User';

  const participantData = {
    playerId: payment.userId,
    playerUsername: username,
    entryFee: payment.amount,
    joinedAt: new Date(),
    currentRound: 1,
    isEliminated: false,
    totalBidsPlaced: 0,
    totalAmountBid: 0,
  };

  if (!hourlyAuction.participants.find(p => p.playerId === payment.userId)) {
    hourlyAuction.participants.push(participantData);
    hourlyAuction.totalParticipants = hourlyAuction.participants.length;
    await hourlyAuction.save();

    await HourlyAuctionJoin.create({
      userId: payment.userId,
      username,
      hourlyAuctionId: payment.auctionId,
      paymentId: payment._id,
      status: 'joined',
    });

    await AuctionHistory.createEntry({
      userId: payment.userId,
      username,
      hourlyAuctionId: hourlyAuction.hourlyAuctionId,
      dailyAuctionId: hourlyAuction.dailyAuctionId,
      auctionDate: hourlyAuction.auctionDate,
      auctionName: hourlyAuction.auctionName,
      prizeValue: hourlyAuction.prizeValue,
      TimeSlot: hourlyAuction.TimeSlot,
      entryFeePaid: payment.amount,
      paymentMethod: 'airpay',
      razorpayPaymentId: payment.orderId, 
    });

    await syncUserStats(payment.userId);
  }
}

async function handlePrizeClaimSuccess(payment) {
  await AuctionHistory.submitPrizeClaim(
    payment.userId,
    payment.auctionId,
    {
      upiId: payment.airpayResponse?.custom_var || 'Airpay Payment',
      paymentReference: payment.airpayTransactionId,
    }
  );

  const user = await User.findOne({ user_id: payment.userId });
  if (user && user.email) {
    await sendPrizeClaimedEmail(user.email, {
      username: user.username,
      auctionName: payment.auctionName,
      prizeAmount: payment.amount,
      claimDate: new Date(),
      transactionId: payment.airpayTransactionId,
      rewardType: 'Cash Prize',
    });
  }
}
