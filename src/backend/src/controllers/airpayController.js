const crypto = require('crypto');
const CRC32 = require('crc-32');
const AirpayPayment = require('../models/AirpayPayment');
const HourlyAuction = require('../models/HourlyAuction');
const HourlyAuctionJoin = require('../models/HourlyAuctionJoin');
const AuctionHistory = require('../models/AuctionHistory');
const DailyAuction = require('../models/DailyAuction');
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
const iv = crypto.randomBytes(8);
const ivHex = iv.toString('hex');

/**
 * Sync participant data from HourlyAuction to DailyAuction
 * This ensures dailyAuctionConfig.participants stays in sync with hourlyAuction.participants
 */
const syncParticipantToDailyAuction = async (hourlyAuction, participantData) => {
  try {
    // Find the daily auction
    const dailyAuction = await DailyAuction.findOne({ 
      dailyAuctionId: hourlyAuction.dailyAuctionId 
    });
    
    if (!dailyAuction) {
      console.warn(`⚠️ [AIRPAY_SYNC] Daily auction not found: ${hourlyAuction.dailyAuctionId}`);
      return { success: false, message: 'Daily auction not found' };
    }
    
    // Find the matching config entry by hourlyAuctionId
    const configIndex = dailyAuction.dailyAuctionConfig.findIndex(
      config => config.hourlyAuctionId === hourlyAuction.hourlyAuctionId
    );
    
    if (configIndex === -1) {
      console.warn(`⚠️ [AIRPAY_SYNC] Config entry not found for hourlyAuctionId: ${hourlyAuction.hourlyAuctionId}`);
      return { success: false, message: 'Config entry not found' };
    }
    
    // Check if participant already exists in dailyAuctionConfig
    const existingParticipant = dailyAuction.dailyAuctionConfig[configIndex].participants?.find(
      p => p.playerId === participantData.playerId
    );
    
    if (!existingParticipant) {
      // Add participant to dailyAuctionConfig
      if (!dailyAuction.dailyAuctionConfig[configIndex].participants) {
        dailyAuction.dailyAuctionConfig[configIndex].participants = [];
      }
      
      dailyAuction.dailyAuctionConfig[configIndex].participants.push(participantData);
      dailyAuction.dailyAuctionConfig[configIndex].totalParticipants = 
        dailyAuction.dailyAuctionConfig[configIndex].participants.length;
      
      // Update total participants today
      dailyAuction.totalParticipantsToday = (dailyAuction.totalParticipantsToday || 0) + 1;
      
      await dailyAuction.save();
      
      console.log(`✅ [AIRPAY_SYNC] Participant ${participantData.playerUsername} synced to DailyAuction for TimeSlot ${hourlyAuction.TimeSlot}`);
      return { success: true, message: 'Participant synced to DailyAuction' };
    }
    
    console.log(`ℹ [AIRPAY_SYNC] Participant ${participantData.playerUsername} already exists in DailyAuction`);
    return { success: true, message: 'Participant already exists' };
  } catch (error) {
    console.error(`❌ [AIRPAY_SYNC] Error syncing participant:`, error);
    return { success: false, message: error.message };
  }
};

// Helper functions matching documentation EXACTLY as provided in snippets
function decrypt(responsedata, secretKey) {
  let data = responsedata;
  console.log('Decrypt function input', responsedata)
  try {
    const hash = crypto.createHash('sha256').update(data).digest();
    const iv = hash.slice(0, 16);
    console.log('iv', iv);
    const encryptedData = Buffer.from(data.slice(16), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), iv);
    let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
    console.log(decrypted);
    decrypted += decipher.final();
    console.log('decrypted>>>>>>>>>')
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error; // Re-throw for proper handling
  }
}

function encryptChecksum(data, salt) {
  const key = crypto.createHash('sha256').update(`${salt}@${data}`).digest('hex');
  return key;
}

function encrypt(request, secretKey) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(ivHex));
    const raw = Buffer.concat([cipher.update(request, 'utf-8'), cipher.final()]);
    const data = ivHex + raw.toString('base64');
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
  console.log(data + new Date().toISOString().split('T')[0]);
  return calculateChecksumHelper(data + new Date().toISOString().split('T')[0]);
}

function calculateChecksumHelper(data) {
  const checksum = makeEnc(data);
  return checksum;
}

function makeEnc(data) {
  const key = crypto.createHash('sha256').update(data).digest('hex');
  return key;
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

// Helper to sanitize name for Airpay
function sanitizeAirpayName(name) {
    if (!name) return 'User';
    // Remove underscores and replace with spaces, then remove anything not a-z, A-Z, or space
    return name.toString().replace(/_/g, ' ').replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim() || 'User';
}

// Helper to get Airpay redirect data
async function getAirpayRedirectData(reqBody) {
    let buyerDetails = {
        email: reqBody.email || reqBody.buyerEmail,
        firstname: sanitizeAirpayName(reqBody.firstname || reqBody.buyerFirstName),
        lastname: sanitizeAirpayName(reqBody.lastname || reqBody.buyerLastName || 'D60'),
        phone: reqBody.phone || reqBody.buyerPhone,
        address: reqBody.address || reqBody.buyerAddress || 'NA',
        city: reqBody.city || reqBody.buyerCity || 'NA',
        state: reqBody.state || reqBody.buyerState || 'NA',
        country: reqBody.country || reqBody.buyerCountry || 'India',
        pincode: reqBody.pincode || reqBody.buyerPinCode || '400001'
    };

    // If userId is provided, fetch latest details from DB
    const customVarData = reqBody.userId || reqBody.customvar || '';
    const [userId, auctionId, paymentType] = customVarData.split(':');
    
    // Determine the base URL for callbacks/redirects
    const getBaseUrl = () => {
        if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
        
        // Fallback detection logic
        if (process.env.VITE_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') {
            return 'https://prod-api.dream60.com';
        }
        return 'https://dev-api.dream60.com';
    };

    const baseUrl = getBaseUrl();

    if (userId) {
        try {
            const user = await User.findOne({ user_id: userId });
            if (user) {
                buyerDetails.email = user.email || buyerDetails.email || `${user.username}@dream60.com`;
                const nameParts = user.username.trim().split(/\s+/);
                buyerDetails.firstname = sanitizeAirpayName(nameParts[0] || 'User');
                buyerDetails.lastname = sanitizeAirpayName(nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'D60');
                buyerDetails.phone = user.mobile || buyerDetails.phone || '9999999999';
            }
        } catch (err) {
            console.error('Error fetching user for Airpay:', err);
        }
    }

    const dataObject = {
        buyer_email: buyerDetails.email || 'user@dream60.com',
        buyer_firstname: buyerDetails.firstname,
        buyer_lastname: buyerDetails.lastname,
        buyer_address: buyerDetails.address,
        buyer_city: buyerDetails.city,
        buyer_state: buyerDetails.state,
        buyer_country: buyerDetails.country,
        amount: Number(reqBody.amount).toFixed(2).toString(),
        orderid: reqBody.orderid || reqBody.orderId,
        buyer_phone: buyerDetails.phone || '9999999999',
        buyer_pincode: buyerDetails.pincode,
        isocurrency: 'INR',
        currency: '356',
        merchant_id: AIRPAY_MID,
        // Force backend URLs to ensure Airpay POSTs to the API, not the frontend directly
        success_url: `${baseUrl}/api/airpay/success`,
        failure_url: `${baseUrl}/api/airpay/failure`,
        callback_url: `${baseUrl}/api/airpay/webhook`
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

    let accesstoken;
    try {
        const parsedTokenResponse = JSON.parse(accessTokenResponse);
        if (parsedTokenResponse.response) {
            const decryptedTokenData = decrypt(parsedTokenResponse.response, key);
            try {
                const tokenObj = JSON.parse(decryptedTokenData);
                accesstoken = (tokenObj.data && tokenObj.data.access_token) ? tokenObj.data.access_token : tokenObj.access_token;
            } catch (e) {
                const match = decryptedTokenData.match(/"access_token"\s*:\s*"([^"]+)"/);
                if (match) accesstoken = match[1];
            }
        } else {
            accesstoken = (parsedTokenResponse.data && parsedTokenResponse.data.access_token) ? parsedTokenResponse.data.access_token : parsedTokenResponse.access_token;
        }
    } catch (e) {
        console.error('Error parsing token response:', e);
        throw new Error('Failed to parse Airpay token response');
    }
    
    if (!accesstoken) throw new Error('Could not retrieve access token from Airpay response');
    
    let finalUrl = `${PAY_URL}?token=${encodeURIComponent(accesstoken)}`;

    // Combine userId, auctionId, and paymentType into customvar for recovery
    // Format: userId|auctionId|paymentType
    const combinedCustomVar = `${userId || ''}|${reqBody.auctionId || reqBody.hourlyAuctionId || ''}|${reqBody.paymentType || 'ENTRY_FEE'}`;

    return {
        url: finalUrl,
        token: accesstoken,
        params: {
            mercid: AIRPAY_MID,
            data: encryptedfData,
            privatekey: privatekey,
            checksum: checksum,
            customvar: combinedCustomVar,
            token: accesstoken,
            merchant_id: AIRPAY_MID
        },
        dataObject,
        buyerDetails // Pass back fetched details
    };
}

exports.sendToAirpay = async (req, res) => {
  try {
    const redirectData = await getAirpayRedirectData(req.body);
    
    // Ensure record exists in DB
    const { userId, auctionId, hourlyAuctionId, amount, paymentType = 'ENTRY_FEE' } = req.body;
    const resolvedAuctionId = auctionId || hourlyAuctionId;
    const orderId = req.body.orderid || req.body.orderId || `D60-${Date.now()}`;

    if (resolvedAuctionId) {
        await AirpayPayment.findOneAndUpdate(
            { orderId },
            {
                userId: userId || redirectData.params.customvar,
                auctionId: resolvedAuctionId,
                amount: amount || redirectData.dataObject.amount,
                status: 'created',
                paymentType
            },
            { upsert: true, new: true }
        );
    }

    res.render('sendToAirpay', { 
      mid: AIRPAY_MID, 
      data: redirectData.params.data, 
      privatekey: redirectData.params.privatekey, 
      checksum: redirectData.params.checksum, 
      URL: redirectData.url,
      fdata: {
          ...req.body,
          ...redirectData.dataObject,
          orderid: orderId
      }
    });
  } catch (error) {
    console.error('sendToAirpay error:', error);
    res.status(500).send("Error initiating payment: " + error.message);
  }
};

/**
 * Common logic to process Airpay response (used by redirect and webhook handlers)
 */
async function processAirpayPayment(responseData) {
  const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
  const decrypteddata = decrypt(responseData, key);
  console.log('Decrypted Airpay Response (raw):', decrypteddata);
  
  let data = {};
  try {
    // Attempt to extract the data object using the specific regex provided in the demo
    const match = decrypteddata.match(/"data"\s*:\s*\{[^}]*\}/);
    if (match) {
      const nestedObjectString = match[0];
      const parsedData = JSON.parse("{" + nestedObjectString + "}");
      data = parsedData.data;
      console.log('✅ Parsed Airpay Data via Demo Regex:', data);
    } else {
      // Fallback to full JSON parse if regex fails
      const fullData = JSON.parse(decrypteddata);
      data = fullData.data || fullData;
      console.log('✅ Parsed Airpay Data via JSON Fallback:', data);
    }
  } catch (e) {
    console.error('❌ Error parsing Airpay response:', e.message);
    throw new Error('Could not parse Airpay response data: ' + e.message);
  }

  const TRANSACTIONID = data.orderid || data.ORDERID;
  const APTRANSACTIONID = data.ap_transactionid || data.TRANSACTIONID || data.ap_transaction_id;
  const AMOUNT = data.amount || data.AMOUNT;
  const TRANSACTIONSTATUS = (data.transaction_status || data.STATUS || data.transactionstatus || '').toString().toUpperCase();
  const MESSAGE = data.message || data.MESSAGE || '';
  const CUSTOMVAR = data.custom_var || data.CUSTOMVAR || data.customvar;
  const ap_SecureHash = data.ap_securehash;

  // Recovery logic for userId, auctionId, paymentType from customvar (Format: userId|auctionId|paymentType)
  let recoveredUserId, recoveredAuctionId, recoveredPaymentType;
  if (CUSTOMVAR && CUSTOMVAR.includes('|')) {
      const parts = CUSTOMVAR.split('|');
      recoveredUserId = parts[0];
      recoveredAuctionId = parts[1];
      recoveredPaymentType = parts[2];
  }

  // 1. Idempotency Check - Important for Webhook/Redirect overlap
  const existingPayment = await AirpayPayment.findOne({ orderId: TRANSACTIONID });
  if (existingPayment?.status === 'paid') {
      console.log(`ℹ [AIRPAY_PROCESS] Payment ${TRANSACTIONID} already processed as paid. Skipping.`);
      return { 
          payment: existingPayment, 
          data, 
          finalStatus: 'paid', 
          TRANSACTIONID, 
          APTRANSACTIONID, 
          AMOUNT, 
          MESSAGE 
      };
  }

  // 2. Comprehensive Success Logic - Check multiple status fields from Airpay
  const isSuccess = 
    data.transaction_payment_status === 'SUCCESS' || 
    data.transaction_status === 200 || 
    data.transaction_status === '200' || 
    data.STATUS === 'SUCCESS' ||
    TRANSACTIONSTATUS === 'SUCCESS';

  const finalStatus = isSuccess ? 'paid' : 'failed';
  
  console.log(`Airpay status: ${TRANSACTIONSTATUS} (Payment Status: ${data.transaction_payment_status || 'N/A'}) -> Final: ${finalStatus}`);

  const payment = await AirpayPayment.findOneAndUpdate(
    { orderId: TRANSACTIONID },
    { 
      status: finalStatus, 
      airpayTransactionId: APTRANSACTIONID,
      airpayResponse: data,
      paidAt: finalStatus === 'paid' ? (existingPayment?.paidAt || new Date()) : null,
      message: MESSAGE,
      customVar: CUSTOMVAR,
      paymentMethod: data.chmod || data.CHMOD || '',
      bankName: data.bankname || data.BANKNAME || '',
      cardName: data.cardname || data.CARDNAME || '',
      cardNumber: data.cardnumber || data.CARDNUMBER || '',
      vpa: data.customervpa || data.VPA || data.VPAID || '',
      transactionStatus: TRANSACTIONSTATUS,
      transactionDate: data.date || data.TRANSACTIONDATE || data.TRANSDATE || '',
      airpayAmount: AMOUNT,
      userId: recoveredUserId || existingPayment?.userId,
      auctionId: recoveredAuctionId || existingPayment?.auctionId,
      paymentType: recoveredPaymentType || existingPayment?.paymentType || 'ENTRY_FEE',
      amount: AMOUNT || existingPayment?.amount
    },
    { new: true, upsert: true }
  );

  if (payment && finalStatus === 'paid') {
    console.log(`✅ [AIRPAY_PROCESS] Successful payment for order ${TRANSACTIONID}, type ${payment.paymentType}`);
    try {
      if (payment.paymentType === 'ENTRY_FEE') {
        await handleEntryFeeSuccess(payment);
      } else if (payment.paymentType === 'PRIZE_CLAIM') {
        await handlePrizeClaimSuccess(payment);
      }
    } catch (handlerError) {
      console.error(`❌ [AIRPAY_HANDLER_ERROR] Error in success handler:`, handlerError);
    }
  } else if (finalStatus === 'failed') {
    console.warn(`⚠️ [AIRPAY_PROCESS] Payment failed for order ${TRANSACTIONID}: ${MESSAGE}`);
  }

  return {
    payment,
    data,
    finalStatus,
    TRANSACTIONID,
    APTRANSACTIONID,
    AMOUNT,
    MESSAGE
  };
}

exports.handleAirpayResponse = async (req, res) => {
  try {
    console.log('--- Airpay Redirect Response Received ---');
    const responseData = req.body.response || req.query.response;
    
    if (!responseData) {
      console.error('Airpay Error: Missing response data');
      const frontendUrl = getFrontendUrl();
      return res.redirect(`${frontendUrl}/payment/failure?message=${encodeURIComponent('Payment response data missing from Airpay')}`);
    }

    const { payment, data, finalStatus, TRANSACTIONID, APTRANSACTIONID, AMOUNT, MESSAGE } = await processAirpayPayment(responseData);

    // Set cookie for frontend transaction summary
    const txnSummary = {
      orderId: TRANSACTIONID,
      txnId: APTRANSACTIONID,
      amount: AMOUNT,
      status: finalStatus,
      message: MESSAGE,
      method: data.chmod || data.CHMOD || 'airpay',
      upiId: data.customervpa || data.VPA || '',
      bankName: data.bankname || data.BANKNAME || '',
      cardName: data.cardname || data.CARDNAME || '',
      cardNumber: data.cardnumber || data.CARDNUMBER || '',
      auctionId: payment.auctionId,
      hourlyAuctionId: payment.auctionId, // Explicitly set for frontend consistency
      timestamp: new Date().toISOString(),
      transactionTime: data.transaction_time || data.date || data.TRANSACTIONDATE || data.TRANSDATE || ''
    };

    res.cookie('airpay_txn_data', JSON.stringify(txnSummary), { 
      maxAge: 3600000, // 1 hour
      path: '/'
    });

    const frontendUrl = getFrontendUrl();
    const redirectUrl = `${frontendUrl}/payment/result?orderId=${TRANSACTIONID}`;

    console.log(`Redirecting user to: ${redirectUrl}`);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('handleAirpayResponse error:', error);
    res.status(500).send("Error processing payment response: " + error.message);
  }
};

/**
 * Handle Airpay Webhook (S2S notification)
 */
exports.handleAirpayWebhook = async (req, res) => {
  try {
    console.log('--- Airpay Webhook (S2S) Received ---');
    // Airpay S2S often sends data in the same format as the redirect response
    const responseData = req.body.response || req.query.response;
    
    if (!responseData) {
      console.warn('Airpay Webhook Warning: Missing response data in payload', req.body);
      return res.status(400).send('OK'); // Return OK even on error to stop retries if desired, or 400
    }

    await processAirpayPayment(responseData);
    
    console.log('✅ Airpay Webhook processed successfully');
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Airpay Webhook error:', error);
    // Airpay usually expects a 200 OK to stop retries, even if processing failed locally
    res.status(200).send('OK'); 
  }
};

function getFrontendUrl() {
  const allowedOriginsRaw = process.env.CLIENT_URL || '';
  const origins = allowedOriginsRaw.split(',').map(o => o.trim()).filter(Boolean);
  
  let frontendUrl = 'http://localhost:3000';
  if (process.env.VITE_ENVIRONMENT === 'production') {
    frontendUrl = 'https://dream60.com';
  } else if (origins.some(o => o.includes('test.dream60.com'))) {
    frontendUrl = 'https://test.dream60.com';
  } else if (origins.length > 0) {
    frontendUrl = origins[0];
  }
  return frontendUrl;
}

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
        
        // Get the full redirect data including tokenized URL
        const redirectData = await getAirpayRedirectData({
            ...req.body,
            orderId: orderId,
            amount: amount
        });

        await AirpayPayment.create({
            userId,
            auctionId: resolvedAuctionId,
            amount,
            orderId,
            status: 'created',
            paymentType,
            // Store fetched user details in metadata if needed
            message: `Initiated for ${redirectData.buyerDetails.firstname} ${redirectData.buyerDetails.lastname}`
        });

        res.status(200).json({
            success: true,
            data: {
                orderId,
                url: redirectData.url,
                token: redirectData.token,
                params: {
                    mid: AIRPAY_MID,
                    mercid: AIRPAY_MID,
                    merchant_id: AIRPAY_MID,
                    data: redirectData.params.data,
                    encdata: redirectData.params.data,
                    privatekey: redirectData.params.privatekey,
                    checksum: redirectData.params.checksum,
                    customvar: userId,
                    token: redirectData.token,
                    currency: '356',
                    isocurrency: 'INR',
                    success_url: redirectData.dataObject.success_url,
                    failure_url: redirectData.dataObject.failure_url,
                    callback_url: redirectData.dataObject.callback_url
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
  if (!hourlyAuction) {
    console.error(`❌ [AIRPAY_SUCCESS] Hourly auction not found: ${payment.auctionId}`);
    return;
  }

  const user = await User.findOne({ user_id: payment.userId });
  const username = user ? (user.username || user.email || user.mobile) : 'Unknown User';

  const participantData = {
    playerId: payment.userId,
    playerUsername: username,
    entryFee: payment.amount,
    joinedAt: new Date(),
    currentRound: 1,
    isEliminated: false,
    eliminatedInRound: null,
    totalBidsPlaced: 0,
    totalAmountBid: 0,
  };

  if (!hourlyAuction.participants.find(p => p.playerId === payment.userId)) {
    // Add participant to hourly auction
    hourlyAuction.participants.push(participantData);
    hourlyAuction.totalParticipants = hourlyAuction.participants.length;
    
    // Update Round 1 data in rounds array
    if (hourlyAuction.rounds && hourlyAuction.rounds.length > 0 && hourlyAuction.rounds[0]) {
      hourlyAuction.rounds[0].totalParticipants = hourlyAuction.totalParticipants;
    }
    
    await hourlyAuction.save();

    console.log(`✅ [AIRPAY_SUCCESS] User ${username} added to HourlyAuction ${hourlyAuction.hourlyAuctionId}`);

    // Sync to DailyAuction
    try {
      await syncParticipantToDailyAuction(hourlyAuction, participantData);
    } catch (syncError) {
      console.error(`❌ [AIRPAY_SUCCESS] Sync to DailyAuction failed:`, syncError);
    }

    // Create Join record
    await HourlyAuctionJoin.create({
      userId: payment.userId,
      username,
      hourlyAuctionId: payment.auctionId,
      paymentId: payment._id,
      status: 'joined',
    });

    // Create History entry
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
      paymentDetails: payment.airpayResponse
    });

    // Sync user stats
    await syncUserStats(payment.userId);
    console.log(`✅ [AIRPAY_SUCCESS] All operations completed for user ${username}`);
  } else {
    console.log(`ℹ [AIRPAY_SUCCESS] User ${username} already joined auction ${payment.auctionId}`);
  }
}

async function handlePrizeClaimSuccess(payment) {
  try {
    const claimData = {
      upiId: payment.vpa || payment.airpayResponse?.customervpa || 'Airpay Payment',
      paymentReference: payment.airpayTransactionId,
    };

    const updatedEntry = await AuctionHistory.submitPrizeClaim(
      payment.userId,
      payment.auctionId,
      claimData
    );

    if (updatedEntry) {
      // Mark all other pending winners' claims as EXPIRED
      const expireResult = await AuctionHistory.updateMany(
        { 
          hourlyAuctionId: payment.auctionId, 
          prizeClaimStatus: 'PENDING',
          userId: { $ne: payment.userId }
        },
        {
          $set: {
            prizeClaimStatus: 'EXPIRED',
            claimNotes: `Prize claimed by rank ${updatedEntry.finalRank} winner (${updatedEntry.username})`,
            claimedBy: updatedEntry.username,
            claimedByRank: updatedEntry.finalRank,
            claimedAt: updatedEntry.claimedAt
          }
        }
      );

      console.log(`✅ [AIRPAY_PRIZE] Marked ${expireResult.modifiedCount} other winners as EXPIRED`);

      // Immediately update currentEligibleRank to next rank (though usually claimed means it's over)
      const nextRankToUpdate = updatedEntry.finalRank + 1;
      if (nextRankToUpdate <= 3) {
        await AuctionHistory.updateMany(
          { hourlyAuctionId: payment.auctionId, isWinner: true },
          { $set: { currentEligibleRank: nextRankToUpdate } }
        );
      }

      // Sync claim status to HourlyAuction and DailyAuction
      await AuctionHistory.syncClaimStatus(payment.auctionId);

      // Send Prize Claimed confirmation email
      const user = await User.findOne({ user_id: payment.userId });
      if (user && user.email) {
        await sendPrizeClaimedEmail(user.email, {
          username: updatedEntry.username || user.username,
          auctionName: updatedEntry.auctionName || payment.auctionName,
          prizeAmount: updatedEntry.prizeAmountWon || 0,
          claimDate: updatedEntry.claimedAt || new Date(),
          transactionId: payment.airpayTransactionId,
          rewardType: 'Cash Prize',
        });
      }
      
      console.log(`✅ [AIRPAY_PRIZE] Prize claim processed for ${updatedEntry.username}`);
    }
  } catch (error) {
    console.error('❌ [AIRPAY_PRIZE] Error handling prize claim success:', error);
  }
}

/**
 * Get payment status for frontend verification
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const payment = await AirpayPayment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Find auction details if it's an entry fee
    let auctionData = null;
    if (payment.paymentType === 'ENTRY_FEE' && payment.auctionId) {
      const auction = await HourlyAuction.findOne({ hourlyAuctionId: payment.auctionId });
      if (auction) {
        auctionData = {
          auctionName: auction.auctionName,
          timeSlot: auction.TimeSlot,
          prizeValue: auction.prizeValue
        };
      }
    }

    res.status(200).json({
      success: true,
      status: payment.status, // 'created', 'paid', 'failed'
      paymentType: payment.paymentType,
      amount: payment.amount,
      auctionId: payment.auctionId,
      orderId: payment.orderId,
      auctionData
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};