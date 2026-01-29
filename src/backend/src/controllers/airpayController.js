const crypto = require('crypto');
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

/**
 * Sync participant data from HourlyAuction to DailyAuction
 * This ensures dailyAuctionConfig.participants stays in sync with hourlyAuction.participants
 */
const syncParticipantToDailyAuction = async (hourlyAuction, participantData) => {
  try {
    const dailyAuction = await DailyAuction.findOne({ 
      dailyAuctionId: hourlyAuction.dailyAuctionId 
    });
    
    if (!dailyAuction) {
      console.warn(`⚠️ [AIRPAY_SYNC] Daily auction not found: ${hourlyAuction.dailyAuctionId}`);
      return { success: false, message: 'Daily auction not found' };
    }
    
    const configIndex = dailyAuction.dailyAuctionConfig.findIndex(
      config => config.hourlyAuctionId === hourlyAuction.hourlyAuctionId
    );
    
    if (configIndex === -1) {
      console.warn(`⚠️ [AIRPAY_SYNC] Config entry not found for hourlyAuctionId: ${hourlyAuction.hourlyAuctionId}`);
      return { success: false, message: 'Config entry not found' };
    }
    
    const existingParticipant = dailyAuction.dailyAuctionConfig[configIndex].participants?.find(
      p => p.playerId === participantData.playerId
    );
    
    if (!existingParticipant) {
      if (!dailyAuction.dailyAuctionConfig[configIndex].participants) {
        dailyAuction.dailyAuctionConfig[configIndex].participants = [];
      }
      
      dailyAuction.dailyAuctionConfig[configIndex].participants.push(participantData);
      dailyAuction.dailyAuctionConfig[configIndex].totalParticipants = 
        dailyAuction.dailyAuctionConfig[configIndex].participants.length;
      
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

// Airpay Helpers
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

// Helper to sanitize name for Airpay
function sanitizeAirpayName(name) {
    if (!name) return 'User';
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

    const combinedCustomVar = `${userId || ''}:${reqBody.auctionId || reqBody.hourlyAuctionId || ''}:${reqBody.paymentType || 'ENTRY_FEE'}`;

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
        buyerDetails
    };
}

exports.sendToAirpay = async (req, res) => {
  try {
    const redirectData = await getAirpayRedirectData(req.body);
    
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

exports.renderTxn = (req, res) => {
  res.render('txn', { fdata: {} });
};

exports.handleAirpayResponse = async (req, res) => {
  try {
    console.log('--- Airpay Response Received ---');
    const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');
    
    const responseData = req.body.response || req.query.response;
    
    if (!responseData) {
      console.error('Airpay Error: Missing response data');
      const frontendUrl = process.env.VITE_ENVIRONMENT === 'production' ? 'https://dream60.com' : 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/failure?message=${encodeURIComponent('Payment response data missing from Airpay')}`);
    }

    const decrypteddata = decrypt(responseData, key);
    const match = decrypteddata.match(/"data"\s*:\s*\{[^}]*\}/);
    if (!match) throw new Error('No match found for "data" key in response.');

    let token = JSON.parse("{" + match[0] + "}");
    const data = token.data;

    const TRANSACTIONID = data.orderid;
    const APTRANSACTIONID = data.ap_transactionid;
    const AMOUNT = data.amount;
    const TRANSACTIONSTATUS = data.transaction_status;
    const MESSAGE = data.message;
    const CUSTOMVAR = data.custom_var;

    let recoveredUserId = '';
    let recoveredAuctionId = '';
    let recoveredPaymentType = 'ENTRY_FEE';

    if (CUSTOMVAR && CUSTOMVAR.includes(':')) {
      const parts = CUSTOMVAR.split(':');
      recoveredUserId = parts[0];
      recoveredAuctionId = parts[1];
      recoveredPaymentType = parts[2] || 'ENTRY_FEE';
    } else if (CUSTOMVAR) {
      recoveredUserId = CUSTOMVAR;
    }

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
        paymentMethod: data.chmod || '',
        bankName: data.bankname || '',
        cardName: data.cardname || '',
        cardNumber: data.cardnumber || '',
        vpa: data.customervpa || '',
        ...(recoveredUserId && { userId: recoveredUserId }),
        ...(recoveredAuctionId && { auctionId: recoveredAuctionId }),
        ...(recoveredPaymentType && { paymentType: recoveredPaymentType }),
        amount: AMOUNT
      },
      { new: true, upsert: true }
    );

    if (payment && finalStatus === 'paid') {
      console.log(`✅ [AIRPAY_RESPONSE] Processing successful payment for order ${TRANSACTIONID}, type ${payment.paymentType}`);
      
      if (!payment.userId || !payment.auctionId) {
          console.error(`❌ [AIRPAY_RESPONSE] Missing userId or auctionId for payment:`, {
              orderId: TRANSACTIONID,
              userId: payment.userId,
              auctionId: payment.auctionId
          });
      } else {
          if (payment.paymentType === 'ENTRY_FEE') {
            await handleEntryFeeSuccess(payment);
          } else {
            await handlePrizeClaimSuccess(payment);
          }
      }
    }

    const txnSummary = {
      orderId: TRANSACTIONID,
      txnId: APTRANSACTIONID,
      amount: AMOUNT,
      status: finalStatus,
      message: MESSAGE,
      method: data.chmod || 'airpay',
      upiId: data.customervpa || '',
      bankName: data.bankname || '',
      cardName: data.cardname || '',
      cardNumber: data.cardnumber || '',
      auctionId: payment?.auctionId,
      timestamp: new Date().toISOString()
    };

    res.cookie('airpay_txn_data', JSON.stringify(txnSummary), { 
      maxAge: 3600000,
      path: '/'
    });

    const frontendUrl = process.env.VITE_ENVIRONMENT === 'production' ? 'https://dream60.com' : 'http://localhost:3000';
    const redirectUrl = finalStatus === 'paid' 
      ? `${frontendUrl}/payment/success?txnId=${TRANSACTIONID}&amount=${AMOUNT}&auctionId=${payment?.auctionId}`
      : `${frontendUrl}/payment/failure?txnId=${TRANSACTIONID}&message=${encodeURIComponent(MESSAGE)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('handleAirpayResponse error:', error);
    res.status(500).send("Error processing payment response");
  }
};

exports.handleAirpaySuccess = exports.handleAirpayResponse;
exports.handleAirpayFailure = exports.handleAirpayResponse;

exports.createOrder = async (req, res) => {
    try {
        const { userId, auctionId, hourlyAuctionId, amount, paymentType = 'ENTRY_FEE' } = req.body;
        const resolvedAuctionId = auctionId || hourlyAuctionId;
        
        if (!resolvedAuctionId) {
            return res.status(400).json({ success: false, message: "auctionId or hourlyAuctionId is required" });
        }

        const orderId = `D60-${Date.now()}`;
        
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

async function handleEntryFeeSuccess(payment) {
  const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId: payment.auctionId });
  if (!hourlyAuction) {
    console.error(`❌ [AIRPAY_SUCCESS] Hourly auction not found: ${payment.auctionId}`);
    return;
  }

  let user = null;
  let username = 'Unknown User';
  try {
    user = await User.findOne({ user_id: payment.userId });
    if (user) {
      username = user.username || user.email || user.mobile || 'Unknown User';
    }
  } catch (err) {
    console.error(`❌ [AIRPAY_SUCCESS] Error looking up user:`, err);
  }

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
    hourlyAuction.participants.push(participantData);
    hourlyAuction.totalParticipants = hourlyAuction.participants.length;
    
    if (hourlyAuction.rounds && hourlyAuction.rounds.length > 0 && hourlyAuction.rounds[0]) {
      hourlyAuction.rounds[0].totalParticipants = hourlyAuction.totalParticipants;
    }
    
    await hourlyAuction.save();
    console.log(`✅ [AIRPAY_SUCCESS] User ${username} added to HourlyAuction ${hourlyAuction.hourlyAuctionId}`);

    try {
      await syncParticipantToDailyAuction(hourlyAuction, participantData);
    } catch (syncError) {
      console.error(`❌ [AIRPAY_SUCCESS] Sync to DailyAuction failed:`, syncError);
    }
  } else {
    console.log(`ℹ️ [AIRPAY_SUCCESS] User ${username} already exists as participant in ${payment.auctionId}`);
  }

  try {
    const existingJoin = await HourlyAuctionJoin.findOne({
      userId: payment.userId,
      hourlyAuctionId: payment.auctionId,
    });

    if (!existingJoin) {
      await HourlyAuctionJoin.create({
        userId: payment.userId,
        username,
        hourlyAuctionId: payment.auctionId,
        paymentId: payment._id,
        status: 'joined',
      });
      console.log(`✅ [AIRPAY_SUCCESS] HourlyAuctionJoin record created for ${username}`);
    }
  } catch (err) {
    console.error(`❌ [AIRPAY_SUCCESS] Failed to create Join record:`, err);
  }

  try {
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
      paymentMethod: payment.paymentMethod || 'airpay',
      razorpayPaymentId: payment.orderId, 
      paymentDetails: payment.airpayResponse
    });
    console.log(`✅ [AIRPAY_SUCCESS] AuctionHistory entry created/updated for ${username}`);
  } catch (err) {
    console.error(`❌ [AIRPAY_SUCCESS] Failed to create AuctionHistory entry:`, err);
  }

  try {
    await syncUserStats(payment.userId);
    console.log(`✅ [AIRPAY_SUCCESS] User stats synced for ${username}`);
  } catch (err) {
    console.error(`❌ [AIRPAY_SUCCESS] User stats sync failed:`, err);
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
      console.log(`✅ [AIRPAY_PRIZE] Prize claim submitted for ${updatedEntry.username} (Rank ${updatedEntry.finalRank})`);

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

      const nextRankToUpdate = updatedEntry.finalRank + 1;

      if (nextRankToUpdate <= 3) {
        await AuctionHistory.updateMany(
          { hourlyAuctionId: payment.auctionId, isWinner: true },
          { $set: { currentEligibleRank: nextRankToUpdate } }
        );

        const nextWinnerUpdate = await AuctionHistory.updateOne(
          {
            hourlyAuctionId: payment.auctionId,
            finalRank: nextRankToUpdate,
            isWinner: true,
            prizeClaimStatus: 'PENDING'
          },
          {
            $set: {
              currentEligibleRank: nextRankToUpdate,
              claimWindowStartedAt: new Date(),
              claimDeadline: new Date(Date.now() + 15 * 60 * 1000)
            }
          }
        );
        
        if (nextWinnerUpdate.modifiedCount > 0) {
          console.log(`✅ [AIRPAY_PRIZE] Rank ${nextRankToUpdate} winner can now claim immediately`);
        }
      }

      try {
        await AuctionHistory.syncClaimStatus(payment.auctionId);
        console.log(`✅ [AIRPAY_PRIZE] Claim status synced to auctions`);
      } catch (syncError) {
        console.error(`❌ [AIRPAY_PRIZE] Sync claim status failed:`, syncError);
      }

      try {
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
          console.log(`✅ [AIRPAY_PRIZE] Confirmation email sent to ${user.email}`);
        }
      } catch (emailError) {
        console.error('⚠️ [AIRPAY_PRIZE] Failed to send prize claimed email:', emailError);
      }
    }
  } catch (error) {
    console.error('❌ [AIRPAY_PRIZE] Error handling prize claim success:', error);
  }
}

module.exports = {
  createOrder: exports.createOrder,
  sendToAirpay: exports.sendToAirpay,
  handleAirpayResponse: exports.handleAirpayResponse,
  handleAirpaySuccess: exports.handleAirpayResponse,
  handleAirpayFailure: exports.handleAirpayResponse,
  handleResponse: exports.handleAirpayResponse,
  renderTxn: exports.renderTxn,
};
