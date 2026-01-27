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

exports.sendToAirpay = async (req, res) => {
  try {
    const reqBody = req.body;
    const dataObject = {
      buyer_email: reqBody.buyerEmail,
      buyer_firstname: reqBody.buyerFirstName,
      buyer_lastname: reqBody.buyerLastName,
      buyer_address: reqBody.buyerAddress || 'NA',
      buyer_city: reqBody.buyerCity || 'NA',
      buyer_state: reqBody.buyerState || 'NA',
      buyer_country: reqBody.buyerCountry || 'India',
      amount: reqBody.amount,
      orderid: reqBody.orderid,
      buyer_phone: reqBody.buyerPhone,
      buyer_pincode: reqBody.buyerPinCode || '400001',
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

    res.render('sendToAirpay', { 
      mid: AIRPAY_MID, 
      data: encryptedfData, 
      privatekey: privatekey, 
      checksum: checksum, 
      URL: finalUrl,
      fdata: reqBody
    });
  } catch (error) {
    console.error('sendToAirpay error:', error);
    res.status(500).send("Error initiating payment: " + error.message);
  }
};

exports.handleAirpayResponse = async (req, res) => {
  try {
    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    const responseData = req.body.response;
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

    var hashdata = TRANSACTIONID + ':' + APTRANSACTIONID + ':' + AMOUNT + ':' + TRANSACTIONSTATUS + ':' + MESSAGE + ':' + AIRPAY_MID + ':' + AIRPAY_USERNAME;
    
    var txnhash = CRC32.str(hashdata);
    if (req.body.CHMOD === 'upi') {
      txnhash = CRC32.str(TRANSACTIONID + ':' + APTRANSACTIONID + ':' + AMOUNT + ':' + TRANSACTIONSTATUS + ':' + MESSAGE + ':' + AIRPAY_MID + ':' + AIRPAY_USERNAME + ':' + req.body.CUSTOMERVPA);
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
        customVar: CUSTOMVAR
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
    // Re-using the core logic from sendToAirpay but returning JSON for mobile app/frontend
    try {
        const { userId, auctionId, amount, paymentType = 'ENTRY_FEE' } = req.body;
        const orderId = `D60-${Date.now()}`;
        
        await AirpayPayment.create({
            userId,
            auctionId,
            amount,
            orderId,
            status: 'created',
            paymentType
        });

        // For the JSON API, we mimic the logic but return the parameters
        const udata = (AIRPAY_USERNAME + ':|:' + AIRPAY_PASSWORD);
        const privatekey = encryptChecksum(udata, AIRPAY_SECRET);
        
        const dataObject = {
            buyer_email: req.body.email || 'user@dream60.com',
            buyer_firstname: req.body.firstname || 'User',
            buyer_lastname: req.body.lastname || 'D60',
            amount: Number(amount).toFixed(2).toString(),
            orderid: orderId,
            buyer_phone: req.body.phone || '9999999999',
            iso_currency: 'INR',
            currency_code: '356',
            mercid: AIRPAY_MID
        };

        const checksum = checksumcal(dataObject);
        const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
        const encryptedfData = encrypt(JSON.stringify(dataObject), key);

        res.status(200).json({
            success: true,
            data: {
                orderId,
                params: {
                    mercid: AIRPAY_MID,
                    encdata: encryptedfData,
                    privatekey: privatekey,
                    checksum: checksum
                }
            }
        });
    } catch (error) {
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
