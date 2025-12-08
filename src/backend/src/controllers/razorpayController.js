const Razorpay = require('razorpay');
const crypto = require('crypto');
const https = require('https');
const RazorpayPayment = require('../models/RazorpayPayment');
const HourlyAuction = require('../models/HourlyAuction');
const HourlyAuctionJoin = require('../models/HourlyAuctionJoin');
const AuctionHistory = require('../models/AuctionHistory');
const DailyAuction = require('../models/DailyAuction');
const User = require('../models/user');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// UUID validation helper function 
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Fetch server time from API using native https module
const fetchServerTime = async () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'dev-api.dream60.com',
      path: '/utility/server-time',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success && parsed.data) {
            console.log('Server time fetched successfully:', {
              hour: parsed.data.hour,
              minute: parsed.data.minute,
              second: parsed.data.second,
              iso: parsed.data.iso,
            });
            resolve(parsed.data);
          } else {
            throw new Error('Invalid server time response');
          }
        } catch (error) {
          console.error('Error parsing server time:', error);
          // Fallback to system time
          const now = new Date();
          resolve({
            hour: now.getHours(),
            minute: now.getMinutes(),
            second: now.getSeconds(),
            timestamp: now.getTime(),
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error fetching server time:', error);
      // Fallback to system time
      const now = new Date();
      resolve({
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        timestamp: now.getTime(),
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      // Fallback to system time on timeout
      const now = new Date();
      resolve({
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        timestamp: now.getTime(),
      });
    });

    req.end();
  });
};

// User clicks "Join & Pay" for a specific hourly auction
exports.createHourlyAuctionOrder = async (req, res) => {
  try {
    const { userId, hourlyAuctionId, amount, currency = 'INR', username } = req.body;

    // Validate required fields
    if (!userId || !hourlyAuctionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'userId, hourlyAuctionId and amount are required'
      });
    }

    // Validate userId is a valid UUID
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId must be a valid UUID format'
      });
    }

    // Validate hourlyAuctionId is a valid UUID
    if (!isValidUUID(hourlyAuctionId)) {
      return res.status(400).json({
        success: false,
        message: 'hourlyAuctionId must be a valid UUID format'
      });
    }

    // ✅ CRITICAL FIX: Fetch actual user data from database for mobile number
    let actualUser = null;
    try {
      actualUser = await User.findOne({ user_id: userId });
      if (!actualUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }
      console.log('✅ [USER_DATA] Fetched from database:', {
        userId,
        username: actualUser.username,
        email: actualUser.email,
        mobile: actualUser.mobile
      });
    } catch (userLookupError) {
      console.error('❌ [USER_DATA] Error looking up user:', userLookupError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user data'
      });
    }

    // Check if hourly auction exists
    const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId });
    
    if (!hourlyAuction) {
      return res.status(404).json({
        success: false,
        message: 'Hourly auction not found'
      });
    }

    // Check if auction is LIVE (participants can only join during LIVE status, Round 1)
    if (hourlyAuction.Status !== 'LIVE') {
      return res.status(400).json({
        success: false,
        message: 'Auction is not currently live. You can only join during the first 15 minutes of each hour when the auction is active.'
      });
    }

    // Check if current round is Round 1 (participants can only join in Round 1)
    if (hourlyAuction.currentRound !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Join window closed. You can only join within the first 15 minutes of the auction (Round 1).'
      });
    }

    // Fetch server time from API for accurate time-based validation
    const serverTime = await fetchServerTime();
    const currentMinute = serverTime.minute;

    console.log('Validating join window:', {
      serverTime: `${serverTime.hour}:${String(currentMinute).padStart(2, '0')}:${serverTime.second}`,
      currentMinute,
      isWithinWindow: currentMinute < 15,
      auctionTimeSlot: hourlyAuction.TimeSlot,
      auctionStatus: hourlyAuction.Status,
      currentRound: hourlyAuction.currentRound,
    });

    // Time-based validation: Only allow joining in minutes 0-14
    if (currentMinute >= 15) {
      return res.status(400).json({
        success: false,
        message: 'Join window closed. You can only join within the first 15 minutes of each hour.',
        debug: {
          currentMinute,
          serverTime: `${serverTime.hour}:${String(currentMinute).padStart(2, '0')}:${serverTime.second}`,
          allowedMinutes: '0-14',
        }
      });
    }

    // Check if user has already joined this auction
    const existingParticipant = hourlyAuction.participants.find(
      p => p.playerId === userId
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this auction'
      });
    }

    // Store amount in rupees, but send to Razorpay in paise
    const amountInRupees = Number(amount);
    const amountInPaise = Math.round(amountInRupees * 100);

    const receipt = `D60-${Date.now()}`; // always < 40 chars

    const options = {
      amount: amountInPaise,
      currency,
      receipt,
      // ✅ Add actual user data in notes for Razorpay
      notes: {
        userId: actualUser.user_id,
        username: actualUser.username,
        email: actualUser.email || '',
        mobile: actualUser.mobile || '',
        hourlyAuctionId,
        auctionTimeSlot: hourlyAuction.TimeSlot
      }
    };

    const order = await razorpay.orders.create(options);

    const paymentDoc = await RazorpayPayment.create({
      userId, // UUID string
      auctionId: hourlyAuctionId, // UUID string - store with auctionId field name for compatibility
      amount: amountInRupees, // Store in rupees
      currency,
      razorpayOrderId: order.id,
      status: 'created',
      orderResponse: order
    });

    console.log('Razorpay order created successfully:', {
      userId,
      username: actualUser.username,
      mobile: actualUser.mobile, // ✅ Log actual mobile from database
      hourlyAuctionId,
      orderId: order.id,
      amountInRupees,
      amountInPaise,
      timeSlot: hourlyAuction.TimeSlot,
      currentRound: hourlyAuction.currentRound,
      serverTime: `${serverTime.hour}:${String(currentMinute).padStart(2, '0')}:${serverTime.second}`,
      currentMinute
    });

    // ✅ Return actual user data for frontend to use in Razorpay prefill
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        hourlyAuctionId,
        paymentId: paymentDoc._id,
        // ✅ Send actual user data for prefill
        userInfo: {
          name: actualUser.username,
          email: actualUser.email || '',
          contact: actualUser.mobile || ''
        }
      }
    });

  } catch (error) {
    console.error("createHourlyAuctionOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message
    });
  }
};

exports.verifyHourlyAuctionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      username,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay params',
      });
    }

    // 1. Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // mark failed
      await RazorpayPayment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'failed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true }
      );

      console.error('Invalid payment signature for order:', razorpay_order_id);

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // 2. Mark payment as paid
    const payment = await RazorpayPayment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // ✅ CRITICAL FIX: Look up actual username from User model
    let actualUsername = null;
    try {
      const user = await User.findOne({ user_id: payment.userId });
      if (user) {
        // Priority: username > email > mobile > fallback
        actualUsername = user.username || user.email || user.mobile || null;
        console.log('✅ [USERNAME] Fetched from database:', {
          userId: payment.userId,
          actualUsername,
          providedUsername: username
        });
      } else {
        console.error('❌ [USERNAME] User not found in database:', {
          userId: payment.userId,
          providedUsername: username
        });
      }
    } catch (userLookupError) {
      console.error('❌ [USERNAME] Error looking up user:', userLookupError);
    }

    // ✅ CRITICAL: If database lookup failed, use provided username as fallback
    // But log a warning since this shouldn't happen in production
    if (!actualUsername) {
      actualUsername = username || 'Unknown User';
      console.warn('⚠️ [USERNAME] Using fallback username:', {
        userId: payment.userId,
        fallbackUsername: actualUsername,
        providedUsername: username
      });
    }

    console.log('Payment verified successfully:', {
      userId: payment.userId,
      username: actualUsername,
      auctionId: payment.auctionId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountInRupees: payment.amount
    });

    // 3. Find the hourly auction by auctionId (UUID)
    const hourlyAuction = await HourlyAuction.findOne({ 
      hourlyAuctionId: payment.auctionId 
    });

    if (!hourlyAuction) {
      console.error('Hourly auction not found:', payment.auctionId);
      return res.status(404).json({
        success: false,
        message: 'Hourly auction not found',
      });
    }

    // 4. Verify auction is still in Round 1 and LIVE
    if (hourlyAuction.Status !== 'LIVE' || hourlyAuction.currentRound !== 1) {
      console.warn('Payment verified but auction no longer accepting participants:', {
        status: hourlyAuction.Status,
        currentRound: hourlyAuction.currentRound
      });
      return res.status(400).json({
        success: false,
        message: 'Join window has closed. Auction is no longer accepting new participants.',
      });
    }

    // 5. Check if user already exists in participants
    const existingParticipant = hourlyAuction.participants.find(
      p => p.playerId === payment.userId
    );

    if (!existingParticipant) {
      // Add participant to hourly auction with ACTUAL username from database
      const participantData = {
        playerId: payment.userId,
        playerUsername: actualUsername, // ✅ Use actual username from database
        entryFee: payment.amount, // Already in rupees
        joinedAt: new Date(),
        currentRound: 1,
        isEliminated: false,
        eliminatedInRound: null,
        totalBidsPlaced: 0,
        totalAmountBid: 0,
      };

      hourlyAuction.participants.push(participantData);
      
      // Update total participants count
      hourlyAuction.totalParticipants = hourlyAuction.participants.length;
      
      // Update Round 1 data in rounds array
      if (hourlyAuction.rounds.length > 0 && hourlyAuction.rounds[0]) {
        hourlyAuction.rounds[0].totalParticipants = hourlyAuction.totalParticipants;
      }
      
      await hourlyAuction.save();

      console.log('Participant added to hourly auction:', {
        auctionCode: hourlyAuction.hourlyAuctionCode,
        auctionId: payment.auctionId,
        userId: payment.userId,
        username: actualUsername, // ✅ Log actual username
        totalParticipants: hourlyAuction.totalParticipants,
        entryFeeInRupees: payment.amount,
        timeSlot: hourlyAuction.TimeSlot,
        currentRound: hourlyAuction.currentRound
      });
    } else {
      console.log('User already exists as participant:', {
        auctionId: payment.auctionId,
        userId: payment.userId,
        username: actualUsername // ✅ Log actual username
      });
    }

    // 6. Create HourlyAuctionJoin record for tracking (with actual username)
    const existingJoin = await HourlyAuctionJoin.findOne({
      userId: payment.userId,
      hourlyAuctionId: payment.auctionId,
    });

    if (!existingJoin) {
      await HourlyAuctionJoin.create({
        userId: payment.userId,
        username: actualUsername, // ✅ Use actual username
        hourlyAuctionId: payment.auctionId,
        paymentId: payment._id,
        status: 'joined',
      });

      console.log('HourlyAuctionJoin record created:', {
        userId: payment.userId,
        username: actualUsername, // ✅ Log actual username
        auctionId: payment.auctionId,
        status: 'joined'
      });
    } else {
      console.log('HourlyAuctionJoin record already exists:', {
        userId: payment.userId,
        username: actualUsername, // ✅ Log actual username
        auctionId: payment.auctionId
      });
    }

    // ✅ 7. Create AuctionHistory entry for tracking user's auction participation
    try {
      await AuctionHistory.createEntry({
        userId: payment.userId,
        username: actualUsername, // ✅ Use actual username
        hourlyAuctionId: payment.auctionId,
        dailyAuctionId: hourlyAuction.dailyAuctionId,
        auctionDate: hourlyAuction.auctionDate,
        auctionName: hourlyAuction.auctionName,
        prizeValue: hourlyAuction.prizeValue,
        TimeSlot: hourlyAuction.TimeSlot,
        entryFeePaid: payment.amount,
      });
      
      console.log('✅ [AUCTION_HISTORY] Entry created for user:', {
        userId: payment.userId,
        username: actualUsername, // ✅ Log actual username
        auctionId: payment.auctionId,
        auctionCode: hourlyAuction.hourlyAuctionCode,
      });
    } catch (historyError) {
      // Log error but don't fail the payment verification
      console.error('❌ [AUCTION_HISTORY] Failed to create entry:', historyError);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified & user joined hourly auction',
      data: {
        payment,
        joined: true,
        hourlyAuctionId: payment.auctionId,
        hourlyAuctionCode: hourlyAuction.hourlyAuctionCode,
        totalParticipants: hourlyAuction.totalParticipants,
        username: actualUsername, // ✅ Return actual username
        timeSlot: hourlyAuction.TimeSlot,
        currentRound: hourlyAuction.currentRound,
      },
    });
  } catch (error) {
    console.error('verifyHourlyAuctionPayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

/**
 * Create Razorpay order for prize claim payment
 * POST /api/razorpay/prize-claim/create-order
 * User pays the lastRoundBidAmount to claim their prize
 */
exports.createPrizeClaimOrder = async (req, res) => {
  try {
    const { userId, hourlyAuctionId, amount, currency = 'INR', username } = req.body;

    // Validate required fields
    if (!userId || !hourlyAuctionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'userId, hourlyAuctionId and amount are required'
      });
    }

    // Validate userId is a valid UUID
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId must be a valid UUID format'
      });
    }

    // Validate hourlyAuctionId is a valid UUID
    if (!isValidUUID(hourlyAuctionId)) {
      return res.status(400).json({
        success: false,
        message: 'hourlyAuctionId must be a valid UUID format'
      });
    }

    // ✅ CRITICAL FIX: Fetch actual user data from database for mobile number
    let actualUser = null;
    try {
      actualUser = await User.findOne({ user_id: userId });
      if (!actualUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }
      console.log('✅ [PRIZE_CLAIM_USER_DATA] Fetched from database:', {
        userId,
        username: actualUser.username,
        email: actualUser.email,
        mobile: actualUser.mobile
      });
    } catch (userLookupError) {
      console.error('❌ [PRIZE_CLAIM_USER_DATA] Error looking up user:', userLookupError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user data'
      });
    }

    // Find the auction history entry
    const historyEntry = await AuctionHistory.findOne({ 
      userId, 
      hourlyAuctionId,
      isWinner: true 
    });
    
    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Winner entry not found for this user and auction'
      });
    }

    // Check if already claimed
    if (historyEntry.prizeClaimStatus === 'CLAIMED') {
      return res.status(400).json({
        success: false,
        message: 'Prize has already been claimed'
      });
    }

    // Check if expired
    if (historyEntry.claimDeadline && new Date() > historyEntry.claimDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Prize claim deadline has expired'
      });
    }

    // Validate amount matches lastRoundBidAmount
    const expectedAmount = historyEntry.lastRoundBidAmount || 0;
    if (Number(amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount must be ₹${expectedAmount} (your final round bid amount)`
      });
    }

    // Store amount in rupees, but send to Razorpay in paise
    const amountInRupees = Number(amount);
    const amountInPaise = Math.round(amountInRupees * 100);

    const receipt = `PRIZE-${Date.now()}`; // always < 40 chars

    const options = {
      amount: amountInPaise,
      currency,
      receipt,
      // ✅ Add actual user data in notes for Razorpay
      notes: {
        userId: actualUser.user_id,
        username: actualUser.username,
        email: actualUser.email || '',
        mobile: actualUser.mobile || '',
        hourlyAuctionId,
        paymentType: 'PRIZE_CLAIM',
        rank: historyEntry.finalRank,
        prizeValue: historyEntry.prizeAmountWon
      }
    };

    const order = await razorpay.orders.create(options);

    const paymentDoc = await RazorpayPayment.create({
      userId,
      auctionId: hourlyAuctionId,
      amount: amountInRupees,
      currency,
      razorpayOrderId: order.id,
      status: 'created',
      orderResponse: order,
      paymentType: 'PRIZE_CLAIM' // Mark this as a prize claim payment
    });

    console.log('Prize claim Razorpay order created:', {
      userId,
      username: actualUser.username,
      mobile: actualUser.mobile, // ✅ Log actual mobile from database
      hourlyAuctionId,
      orderId: order.id,
      amountInRupees,
      amountInPaise,
      rank: historyEntry.finalRank,
      prizeValue: historyEntry.prizeAmountWon
    });

    // ✅ Return actual user data for frontend to use in Razorpay prefill
    return res.status(201).json({
      success: true,
      message: "Prize claim order created successfully",
      data: {
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        hourlyAuctionId,
        paymentId: paymentDoc._id,
        rank: historyEntry.finalRank,
        prizeValue: historyEntry.prizeAmountWon,
        // ✅ Send actual user data for prefill
        userInfo: {
          name: actualUser.username,
          email: actualUser.email || '',
          contact: actualUser.mobile || ''
        }
      }
    });

  } catch (error) {
    console.error("createPrizeClaimOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create prize claim order",
      error: error.message
    });
  }
};

/**
 * Verify prize claim payment and update auction history
 * POST /api/razorpay/prize-claim/verify-payment
 */
exports.verifyPrizeClaimPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      username,
      upiId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay params',
      });
    }

    if (!username || !upiId) {
      return res.status(400).json({
        success: false,
        message: 'Username and UPI ID are required',
      });
    }

    // 1. Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // mark failed
      await RazorpayPayment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'failed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true }
      );

      console.error('Invalid prize claim payment signature:', razorpay_order_id);

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // 2. Mark payment as paid
    const payment = await RazorpayPayment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    console.log('Prize claim payment verified:', {
      userId: payment.userId,
      username,
      auctionId: payment.auctionId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountInRupees: payment.amount
    });

    // 3. Update auction history with prize claim
    const claimData = {
      upiId: upiId.trim(),
      paymentReference: razorpay_payment_id,
    };
    
    const updatedEntry = await AuctionHistory.submitPrizeClaim(
      payment.userId,
      payment.auctionId,
      claimData
    );

    // ✅ NEW: Mark ALL other pending winners' claims as EXPIRED
    // This ensures other winners in queue know the prize has been claimed
    const expireResult = await AuctionHistory.updateMany(
      { 
        hourlyAuctionId: payment.auctionId, 
        prizeClaimStatus: 'PENDING',
        userId: { $ne: payment.userId } // Exclude the current user who just claimed
      },
      {
        $set: {
          prizeClaimStatus: 'EXPIRED',
          claimNotes: `Prize claimed by rank ${updatedEntry.finalRank} winner (${updatedEntry.username})`,
          // ✅ NEW: Store who claimed the prize for other winners to see
          claimedBy: updatedEntry.username,
          claimedByRank: updatedEntry.finalRank,
          claimedAt: updatedEntry.claimedAt
        }
      }
    );

    console.log(`✅ [PRIZE_CLAIM_UPDATE] Marked ${expireResult.modifiedCount} other winners as EXPIRED`);
    
    // ✅ NEW: Immediately update currentEligibleRank to next rank (no delay)
    // This allows the next winner to claim immediately without waiting for cron job
    const nextRankToUpdate = updatedEntry.finalRank + 1;
    if (nextRankToUpdate <= 3) {
      const nextWinnerUpdate = await AuctionHistory.updateOne(
        {
          hourlyAuctionId: payment.auctionId,
          finalRank: nextRankToUpdate,
          isWinner: true,
          prizeClaimStatus: 'PENDING' // Only update if still pending
        },
        {
          $set: {
            currentEligibleRank: nextRankToUpdate,
            claimWindowStartedAt: new Date(), // Start their 30-minute window NOW
            claimDeadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
          }
        }
      );
      
      if (nextWinnerUpdate.modifiedCount > 0) {
        console.log(`✅ [IMMEDIATE_QUEUE_ADVANCE] Rank ${nextRankToUpdate} winner can now claim immediately (no delay)`);
      }
    }

    const getRankSuffix = (rank) => {
      if (rank === 1) return '1st';
      if (rank === 2) return '2nd';
      if (rank === 3) return '3rd';
      return `${rank}th`;
    };

    console.log(`✅ [PRIZE_CLAIM] Prize claimed and payment verified for ${username} (${getRankSuffix(updatedEntry.finalRank)} place)`);
    console.log(`     💰 Final round bid amount: ₹${updatedEntry.lastRoundBidAmount || 0}`);
    console.log(`     💳 UPI ID: ${updatedEntry.claimUpiId}`);
    console.log(`     🎯 Prize amount: ₹${updatedEntry.prizeAmountWon || 0}`);
    console.log(`     ⏰ Other ${expireResult.modifiedCount} winner(s) marked as EXPIRED`);

    return res.status(200).json({
      success: true,
      message: `Prize claimed successfully! Payment of ₹${payment.amount} received.`,
      data: {
        payment,
        claimed: true,
        hourlyAuctionId: payment.auctionId,
        rank: updatedEntry.finalRank,
        prizeAmount: updatedEntry.prizeAmountWon,
        upiId: updatedEntry.claimUpiId,
        claimedAt: updatedEntry.claimedAt,
        claimedBy: updatedEntry.username,
        claimedByRank: updatedEntry.finalRank,
        username,
      },
    });
  } catch (error) {
    console.error('verifyPrizeClaimPayment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify prize claim payment',
      error: error.message,
    });
  }
};

module.exports = {
  createHourlyAuctionOrder: exports.createHourlyAuctionOrder,
  verifyHourlyAuctionPayment: exports.verifyHourlyAuctionPayment,
  createPrizeClaimOrder: exports.createPrizeClaimOrder,
  verifyPrizeClaimPayment: exports.verifyPrizeClaimPayment,
};