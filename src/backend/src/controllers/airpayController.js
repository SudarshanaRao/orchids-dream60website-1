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
const ivFixed = crypto.randomBytes(8).toString('hex'); // Used in some kit versions

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
    
    console.log(`ℹ️ [AIRPAY_SYNC] Participant ${participantData.playerUsername} already exists in DailyAuction`);
    return { success: true, message: 'Participant already exists' };
  } catch (error) {
    console.error(`❌ [AIRPAY_SYNC] Error syncing participant:`, error);
    return { success: false, message: error.message };
  }
};

// Helper functions matching documentation EXACTLY as provided in snippets
function decrypt(responsedata, secretKey) {
  let data = responsedata;
  try {
    const iv = data.slice(0, 16);
    const encryptedData = Buffer.from(data.slice(16), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(iv, 'utf-8'));
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

exports.handleAirpayResponse = async (req, res) => {
  try {
    console.log('--- Airpay Response Received ---');
    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    
    // Check both body and query for 'response'
    const responseData = req.body.response || req.query.response;
    
    if (!responseData) {
      console.error('Airpay Error: Missing response data');
      const frontendUrl = process.env.VITE_ENVIRONMENT === 'production' ? 'https://dream60.com' : 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/failure?message=${encodeURIComponent('Payment response data missing from Airpay')}`);
    }

    const decrypteddata = decrypt(responseData, key);
    console.log('Decrypted Airpay Response (raw):', decrypteddata);
    
    let data = {};
    try {
      // Try parsing as direct JSON first (common in newer versions)
      data = JSON.parse(decrypteddata);
      if (data.data) data = data.data; // Handle if still wrapped in "data"
    } catch (e) {
      // Fallback to existing regex extraction for older XML/Partial JSON formats
      const match = decrypteddata.match(/"data"\s*:\s*\{[^}]*\}/);
      if (match) {
        let token = JSON.parse("{" + match[0] + "}");
        data = token.data;
      } else {
        throw new Error('Could not parse Airpay response data');
      }
    }

    // Support both lowercase and all-caps keys from Airpay
    const TRANSACTIONID = data.orderid || data.ORDERID;
    const APTRANSACTIONID = data.ap_transactionid || data.TRANSACTIONID;
    const AMOUNT = data.amount || data.AMOUNT;
    const TRANSACTIONSTATUS = (data.transaction_status || data.STATUS || '').toString();
    const MESSAGE = data.message || data.MESSAGE || '';
    const CUSTOMVAR = data.custom_var || data.CUSTOMVAR;

    // Recover userId, auctionId, paymentType from CUSTOMVAR if possible
    // Format: userId|auctionId|paymentType or userId:auctionId:paymentType
    let recoveredUserId = '';
    let recoveredAuctionId = '';
    let recoveredPaymentType = 'ENTRY_FEE';

    if (CUSTOMVAR) {
      const separator = CUSTOMVAR.includes('|') ? '|' : (CUSTOMVAR.includes(':') ? ':' : null);
      if (separator) {
        const parts = CUSTOMVAR.split(separator);
        recoveredUserId = parts[0];
        recoveredAuctionId = parts[1];
        recoveredPaymentType = parts[2] || 'ENTRY_FEE';
      } else {
        recoveredUserId = CUSTOMVAR;
      }
    }

    // Business Logic Integration - Check for '200' or 'SUCCESS'
    const finalStatus = (TRANSACTIONSTATUS === '200' || TRANSACTIONSTATUS.toUpperCase() === 'SUCCESS') ? 'paid' : 'failed';
    
    console.log(`Airpay status: ${TRANSACTIONSTATUS} -> Final: ${finalStatus}`);

    // Use upsert to ensure record exists even if not created during initiation
    const payment = await AirpayPayment.findOneAndUpdate(
      { orderId: TRANSACTIONID },
      { 
        status: finalStatus, 
        airpayTransactionId: APTRANSACTIONID,
        airpayResponse: data,
        paidAt: finalStatus === 'paid' ? new Date() : null,
        message: MESSAGE,
        customVar: CUSTOMVAR,
        paymentMethod: data.chmod || data.CHMOD || '',
        bankName: data.bankname || data.BANKNAME || '',
        cardName: data.cardname || data.CARDNAME || '',
        cardNumber: data.cardnumber || data.CARDNUMBER || '',
        vpa: data.customervpa || data.VPA || '',
        // Update recovered fields if they were missing or if it's an upsert
        ...(recoveredUserId && { userId: recoveredUserId }),
        ...(recoveredAuctionId && { auctionId: recoveredAuctionId }),
        ...(recoveredPaymentType && { paymentType: recoveredPaymentType }),
        amount: AMOUNT // Ensure amount is set
      },
      { new: true, upsert: true }
    );

    if (payment && finalStatus === 'paid') {
      console.log(`Processing successful payment for order ${TRANSACTIONID}, type ${payment.paymentType}`);
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
      method: data.chmod || data.CHMOD || 'airpay',
      upiId: data.customervpa || data.VPA || '',
      bankName: data.bankname || data.BANKNAME || '',
      cardName: data.cardname || data.CARDNAME || '',
      cardNumber: data.cardnumber || data.CARDNUMBER || '',
      auctionId: payment.auctionId,
      timestamp: new Date().toISOString()
    };

    res.cookie('airpay_txn_data', JSON.stringify(txnSummary), { 
      maxAge: 3600000, // 1 hour
      path: '/'
    });

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

    const redirectUrl = finalStatus === 'paid' 
      ? `${frontendUrl}/payment/success?txnId=${TRANSACTIONID}&amount=${AMOUNT}&auctionId=${payment.auctionId}`
      : `${frontendUrl}/payment/failure?txnId=${TRANSACTIONID}&message=${encodeURIComponent(MESSAGE)}`;

    console.log(`Redirecting user to: ${redirectUrl}`);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('handleAirpayResponse error:', error);
    res.status(500).send("Error processing payment response: " + error.message);
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
                    isocurrency: 'INR'
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
    console.log(`ℹ️ [AIRPAY_SUCCESS] User ${username} already joined auction ${payment.auctionId}`);
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