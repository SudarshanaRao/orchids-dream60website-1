const crypto = require('crypto');
const AirpayPayment = require('../models/AirpayPayment');
const HourlyAuction = require('../models/HourlyAuction');
const HourlyAuctionJoin = require('../models/HourlyAuctionJoin');
const AuctionHistory = require('../models/AuctionHistory');
const User = require('../models/user');
const { syncUserStats } = require('./userController');
const { sendPrizeClaimedEmail } = require('../utils/emailService');

const AIRPAY_SECRET = process.env.AIRPAY_SECRET;
const AIRPAY_MID = process.env.AIRPAY_MID;
const AIRPAY_CLIENT_ID = process.env.AIRPAY_CLIENT_ID;
const AIRPAY_CLIENT_SECRET = process.env.AIRPAY_CLIENT_SECRET;
const AIRPAY_USERNAME = process.env.AIRPAY_USERNAME;
const AIRPAY_PASSWORD = process.env.AIRPAY_PASSWORD;

const TOKEN_URL = "https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/token.php";
const PAY_URL = 'https://payments.airpay.co.in/pay/v4/index.php';

// Helpers from attachments
function encryptChecksum(data, salt) {
  return crypto.createHash('sha256').update(`${salt}@${data}`).digest('hex');
}

function encrypt(request, secretKey, ivHex) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(ivHex, 'hex'));
  const raw = Buffer.concat([cipher.update(request, 'utf-8'), cipher.final()]);
  return ivHex + raw.toString('base64');
}

function decrypt(responsedata, secretKey) {
  try {
    const hash = crypto.createHash('sha256').update(responsedata).digest();
    const iv = hash.slice(0, 16);
    const encryptedData = Buffer.from(responsedata.slice(16), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), iv);
    let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
    decrypted += decipher.final();
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
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
  return calculateChecksumHelper(data + new Date().toISOString().split('T')[0]);
}

function calculateChecksumHelper(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function getAccessToken(mid) {
  const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
  
  let request = {
    client_id: AIRPAY_CLIENT_ID,
    client_secret: AIRPAY_CLIENT_SECRET,
    grant_type: 'client_credentials',
    merchant_id: mid
  };

  const iv = crypto.randomBytes(8);
  const ivHex = iv.toString('hex');
  const encryptedData = encrypt(JSON.stringify(request), key, ivHex);

  const reqs = {
    merchant_id: request.merchant_id,
    encdata: encryptedData,
    checksum: checksumcal(request)
  };

  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams(reqs),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseText = await response.text();
    const jsonResponse = JSON.parse(responseText);
    
    if (!jsonResponse.response) {
       throw new Error('No response in token call');
    }

    const decryptedData = decrypt(jsonResponse.response, key);
    
    // Extract token
    const match = decryptedData.match(/"data"\s*:\s*\{[^}]*\}/);
    if (!match) throw new Error('Token data not found in response');
    
    const tokenData = JSON.parse("{" + match[0] + "}");
    return tokenData.data.access_token;
  } catch (error) {
    console.error('Error getting Airpay access token:', error);
    throw error;
  }
}

// Controller Methods
exports.createOrder = async (req, res) => {
  try {
    const { userId, auctionId, amount, paymentType = 'ENTRY_FEE' } = req.body;

    if (!userId || !auctionId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findOne({ user_id: userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let auction;
    if (paymentType === 'ENTRY_FEE') {
        auction = await HourlyAuction.findOne({ hourlyAuctionId: auctionId });
    } else {
        auction = await AuctionHistory.findOne({ userId, hourlyAuctionId: auctionId, isWinner: true });
    }

    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });

    const orderId = `D60-${Date.now()}`;
    
    const dataObject = {
      buyer_email: user.email || 'dream60.official@gmail.com',
      buyer_firstname: user.username.split(' ')[0] || 'User',
      buyer_lastname: user.username.split(' ')[1] || 'Dream60',
      buyer_address: 'Dream60 Headquarters',
      buyer_city: 'Mumbai',
      buyer_state: 'Maharashtra',
      buyer_country: 'India',
      amount: amount.toString(),
      orderid: orderId,
      buyer_phone: user.mobile || '9999999999',
      buyer_pincode: '400001',
      iso_currency: 'INR',
      currency_code: '356', // INR ISO code
      merchant_id: AIRPAY_MID
    };

    const udata = (AIRPAY_USERNAME + ':|:' + AIRPAY_PASSWORD);
    const privatekey = encryptChecksum(udata, AIRPAY_SECRET);
    const checksum = checksumcal(dataObject);
    
    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    const iv = crypto.randomBytes(8);
    const ivHex = iv.toString('hex');
    const encryptedfData = encrypt(JSON.stringify(dataObject), key, ivHex);

    const accessToken = await getAccessToken(AIRPAY_MID);
    const redirectUrl = `${PAY_URL}?token=${encodeURIComponent(accessToken)}`;

    // Create payment record
    await AirpayPayment.create({
      userId,
      auctionId,
      amount,
      orderId,
      status: 'created',
      paymentType,
      auctionName: auction.auctionName || auction.productName,
      auctionTimeSlot: auction.TimeSlot,
    });

    res.status(200).json({
      success: true,
      data: {
        url: redirectUrl,
        params: {
          mid: AIRPAY_MID,
          data: encryptedfData,
          privatekey: privatekey,
          checksum: checksum
        },
        orderId
      }
    });

  } catch (error) {
    console.error('Airpay createOrder error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.handleResponse = async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) return res.status(400).send('No response received');

    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    const decryptedData = decrypt(response, key);
    
    const match = decryptedData.match(/"data"\s*:\s*\{[^}]*\}/);
    if (!match) throw new Error('Response data not found');
    
    const token = JSON.parse("{" + match[0] + "}");
    const data = token.data;

    const orderId = data.orderid;
    const airpayTxnId = data.ap_transactionid;
    const status = data.transaction_status === 'success' ? 'paid' : 'failed';

    const payment = await AirpayPayment.findOneAndUpdate(
      { orderId },
      { 
        status, 
        airpayTransactionId: airpayTxnId,
        airpayResponse: data,
        paidAt: status === 'paid' ? new Date() : null,
        message: data.message,
        customVar: data.custom_var
      },
      { new: true }
    );

    if (!payment) return res.status(404).send('Payment record not found');

    // Handle business logic on success
    if (status === 'paid') {
      if (payment.paymentType === 'ENTRY_FEE') {
        await handleEntryFeeSuccess(payment);
      } else {
        await handlePrizeClaimSuccess(payment);
      }
    }

    // Redirect to frontend success/failure page
    const frontendUrl = process.env.FRONTEND_URL || 'https://dream60.com';
    const redirectPath = status === 'paid' ? '/payment/success' : '/payment/failure';
    res.redirect(`${frontendUrl}${redirectPath}?orderId=${orderId}&txnId=${airpayTxnId}`);

  } catch (error) {
    console.error('Airpay handleResponse error:', error);
    res.status(500).send('Error processing payment response');
  }
};

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
      razorpayPaymentId: payment.orderId, // using orderId as reference
    });

    await syncUserStats(payment.userId);
  }
}

async function handlePrizeClaimSuccess(payment) {
  const updatedEntry = await AuctionHistory.submitPrizeClaim(
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
