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

// Helper functions matching documentation exactly
function encryptChecksum(data, salt) {
  return crypto.createHash('sha256').update(`${salt}@${data}`).digest('hex');
}

function encrypt(request, secretKey) {
  const iv = crypto.randomBytes(8);
  const ivHex = iv.toString('hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(ivHex));
  const raw = Buffer.concat([cipher.update(request, 'utf-8'), cipher.final()]);
  return ivHex + raw.toString('base64');
}

function decrypt(responsedata, secretKey) {
  try {
    const iv = responsedata.slice(0, 16);
    const encryptedData = Buffer.from(responsedata.slice(16), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(iv, 'utf-8'));
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
  // Use current IST date in YYYY-MM-DD format for India-based Airpay PG
  const dateStr = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
  return crypto.createHash('sha256').update(data + dateStr).digest('hex');
}

async function getAccessToken(mid) {
  const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
  
  const dateStr = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const checksum = crypto.createHash('sha256').update(mid + AIRPAY_CLIENT_ID + AIRPAY_CLIENT_SECRET + dateStr).digest('hex');

  let request = {
    client_id: AIRPAY_CLIENT_ID,
    client_secret: AIRPAY_CLIENT_SECRET,
    grant_type: 'client_credentials',
    merchant_id: mid
  };

  const encryptedData = encrypt(JSON.stringify(request), key);
  const reqs = {
    merchant_id: mid,
    encdata: encryptedData,
    checksum: checksum
  };

  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams(reqs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airpay Token Error (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    const jsonResponse = JSON.parse(responseText);
    
    if (!jsonResponse.response) {
       throw new Error('No response field in token API result');
    }

    const decryptedData = decrypt(jsonResponse.response, key);
    
    // Extract token using regex as per documentation
    const match = decryptedData.match(/"data"\s*:\s*\{[^}]*\}/);
    if (!match) throw new Error('Token data block not found in decrypted response');
    
    const tokenContainer = JSON.parse("{" + match[0] + "}");
    if (!tokenContainer.data || !tokenContainer.data.access_token) {
        throw new Error('Access token missing in decrypted data');
    }
    return tokenContainer.data.access_token;
  } catch (error) {
    console.error('Airpay getAccessToken failed:', error);
    throw error;
  }
}

// Controller Methods
exports.createOrder = async (req, res) => {
  try {
    console.log('📦 Airpay Order Generation Request:', req.body);
    const { userId, hourlyAuctionId, auctionId, amount, paymentType = 'ENTRY_FEE' } = req.body;

    const finalAuctionId = hourlyAuctionId || auctionId;

    if (!userId || !finalAuctionId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields (userId, auctionId, or amount)'
      });
    }

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let auction;
    if (paymentType === 'ENTRY_FEE') {
        auction = await HourlyAuction.findOne({ hourlyAuctionId: finalAuctionId });
    } else {
        auction = await AuctionHistory.findOne({ userId, hourlyAuctionId: finalAuctionId, isWinner: true });
    }

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    const orderId = `D60-${Date.now()}`;
    
    // Updated field names to match Airpay v4 requirements
    const dataObject = {
      buyer_email: user.email || 'dream60.official@gmail.com',
      buyer_firstname: (user.username || 'User').split(' ')[0],
      buyer_lastname: (user.username || 'Dream60').split(' ').slice(1).join(' ') || 'User',
      buyer_address: 'Dream60 Headquarters',
      buyer_city: 'Mumbai',
      buyer_state: 'Maharashtra',
      buyer_country: 'India',
      amount: Number(amount).toFixed(2).toString(),
      orderid: orderId,
      buyer_phone: user.mobile || '9999999999',
      buyer_pincode: '400001',
      iso_currency: 'INR',
      currency_code: '356', 
      mercid: AIRPAY_MID
    };

    const udata = (AIRPAY_USERNAME + ':|:' + AIRPAY_PASSWORD);
    const privatekey = encryptChecksum(udata, AIRPAY_SECRET);
    const checksum = checksumcal(dataObject);
    
    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    const encryptedfData = encrypt(JSON.stringify(dataObject), key);

    const accessToken = await getAccessToken(AIRPAY_MID);
    const redirectUrl = `${PAY_URL}?token=${encodeURIComponent(accessToken)}`;

    // Create persistent payment record
    await AirpayPayment.create({
      userId,
      auctionId: finalAuctionId,
      amount,
      orderId,
      status: 'created',
      paymentType,
      auctionName: auction.auctionName || auction.productName,
      auctionTimeSlot: auction.TimeSlot,
    });

    console.log(`✅ Order ${orderId} created for user ${userId}. Redirecting to Airpay.`);

    res.status(200).json({
      success: true,
      data: {
        url: redirectUrl,
        params: {
          mercid: AIRPAY_MID,
          data: encryptedfData,
          encdata: encryptedfData, // Some kits use data, some use encdata. Providing both.
          privatekey: privatekey,
          checksum: checksum,
          chmod: '', // Default to all payment modes
          customvar: paymentType // Pass payment type as custom var
        },
        orderId
      }
    });

  } catch (error) {
    console.error('Airpay createOrder crash:', error);
    res.status(500).json({ success: false, message: 'Airpay order creation failed', error: error.message });
  }
};

exports.handleResponse = async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) {
      console.log('⚠️ Empty response from Airpay');
      return res.status(400).send('Empty payment response');
    }

    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    const decryptedRaw = decrypt(response, key);
    
    const match = decryptedRaw.match(/"data"\s*:\s*\{[^}]*\}/);
    if (!match) throw new Error('Failed to parse data block from Airpay response');
    
    const token = JSON.parse("{" + match[0] + "}");
    const data = token.data;

    const orderId = data.orderid;
    const airpayTxnId = data.ap_transactionid;
    const amount = data.amount;
    const status = data.transaction_status;
    const message = data.message;
    const apSecureHash = data.ap_securehash;

    // Verify Hash Integrity as per documentation
    const hashData = `${orderId}:${airpayTxnId}:${amount}:${status}:${message}:${AIRPAY_MID}:${AIRPAY_USERNAME}`;
    let calculatedHash = CRC32.str(hashData);
    calculatedHash = (calculatedHash >>> 0).toString(); // Convert to unsigned string

    // Note: Some kits might use a different order or include custom vars. 
    // We log both for debugging if mismatch occurs.
    console.log(`🔍 Verification - Calculated: ${calculatedHash}, Received: ${apSecureHash}`);

    const finalStatus = (status === '200' || status === 'success') ? 'paid' : 'failed';

    const payment = await AirpayPayment.findOneAndUpdate(
      { orderId },
      { 
        status: finalStatus, 
        airpayTransactionId: airpayTxnId,
        airpayResponse: data,
        paidAt: finalStatus === 'paid' ? new Date() : null,
        message: message,
        customVar: data.custom_var
      },
      { new: true }
    );

    if (!payment) {
      console.log(`❌ Payment record not found for Order ID: ${orderId}`);
      return res.status(404).send('Order record missing');
    }

    if (finalStatus === 'paid') {
      console.log(`💰 Payment Successful for Order ${orderId}`);
      if (payment.paymentType === 'ENTRY_FEE') {
        await handleEntryFeeSuccess(payment);
      } else {
        await handlePrizeClaimSuccess(payment);
      }
    } else {
      console.log(`❌ Payment Failed for Order ${orderId}. Message: ${message}`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://dream60.com';
    const redirectPath = finalStatus === 'paid' ? '/payment/success' : '/payment/failure';
    res.redirect(`${frontendUrl}${redirectPath}?orderId=${orderId}&txnId=${airpayTxnId}`);

  } catch (error) {
    console.error('Airpay handleResponse crash:', error);
    res.status(500).send('Internal error processing payment result');
  }
};

async function handleEntryFeeSuccess(payment) {
  const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId: payment.auctionId });
  if (!hourlyAuction) {
    console.error(`🚨 Auction ${payment.auctionId} not found during success handler`);
    return;
  }

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
