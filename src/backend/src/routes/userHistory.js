const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AuctionHistory = require('../models/AuctionHistory');
const RazorpayPayment = require('../models/RazorpayPayment');
const AirpayPayment = require('../models/AirpayPayment');
const HourlyAuction = require('../models/HourlyAuction');
const DailyAuction = require('../models/DailyAuction');
const { getUserVoucherTransactions } = require('../controllers/adminVoucherController');
const { sendVoucherRevealOtp, verifyVoucherRevealOtp } = require('../controllers/voucherOtpController');

/**
 * @swagger
 * tags:
 *   - name: User History
 *     description: User auction history and statistics APIs
 *
 * components:
 *   schemas:
 *     UserParticipationData:
 *       type: object
 *       properties:
 *         playerId:
 *           type: string
 *           example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *         playerUsername:
 *           type: string
 *           example: "asha"
 *         entryFee:
 *           type: number
 *           example: 99
 *         joinedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-26T08:30:00.000Z"
 *         isEliminated:
 *           type: boolean
 *           example: false
 *         eliminatedInRound:
 *           type: number
 *           nullable: true
 *           example: null
 *         totalBidsPlaced:
 *           type: number
 *           example: 4
 *         totalAmountBid:
 *           type: number
 *           example: 25000
 *         totalAmountSpent:
 *           type: number
 *           example: 25099
 *         roundsParticipated:
 *           type: array
 *           items:
 *             type: number
 *           example: [1, 2, 3, 4]
 *
 *     AuctionHistoryEntry:
 *       type: object
 *       properties:
 *         hourlyAuctionId:
 *           type: string
 *           example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *         dailyAuctionId:
 *           type: string
 *           example: "abc-123-def-456"
 *         auctionDate:
 *           type: string
 *           format: date
 *           example: "2025-11-26"
 *         auctionName:
 *           type: string
 *           example: "iPhone 14 Pro"
 *         prizeValue:
 *           type: number
 *           example: 65000
 *         TimeSlot:
 *           type: string
 *           example: "09:00"
 *         userParticipation:
 *           $ref: '#/components/schemas/UserParticipationData'
 *         isWinner:
 *           type: boolean
 *           example: true
 *           description: True ONLY if user won (rank 1-3)
 *         userWon:
 *           type: boolean
 *           example: true
 *         userRank:
 *           type: number
 *           nullable: true
 *           example: 1
 *           description: User's rank (1-3 for winners, null for non-winners)
 *         prizeAmountWon:
 *           type: number
 *           example: 45000
 *           description: Prize amount (0 for non-winners)
 *         finalRank:
 *           type: number
 *           nullable: true
 *           example: 1
 *         prizeClaimStatus:
 *           type: string
 *           enum: [PENDING, CLAIMED, EXPIRED, null]
 *           example: "CLAIMED"
 *         claimDeadline:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-11-26T10:00:00.000Z"
 *         claimedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-11-26T09:45:00.000Z"
 *         remainingProductFees:
 *           type: number
 *           nullable: true
 *           example: 20000
 *         claimUpiId:
 *           type: string
 *           nullable: true
 *           example: "winner@paytm"
 *         remainingFeesPaid:
 *           type: boolean
 *           example: true
 *         lastRoundBidAmount:
 *           type: number
 *           example: 45000
 *         completedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-26T10:00:00.000Z"
 *
 *     UserStatistics:
 *       type: object
 *       properties:
 *         totalAuctions:
 *           type: number
 *           example: 50
 *           description: Total auctions participated in
 *         totalWins:
 *           type: number
 *           example: 5
 *           description: Number of auctions won (rank 1-3)
 *         totalLosses:
 *           type: number
 *           example: 45
 *           description: Number of auctions lost
 *         totalSpent:
 *           type: number
 *           example: 25000
 *           description: Total amount spent (entry fees + bids)
 *         totalWon:
 *           type: number
 *           example: 50000
 *           description: Total prize money won
 *         winRate:
 *           type: number
 *           example: 10
 *           description: Win percentage (totalWins / totalAuctions * 100)
 *         netGain:
 *           type: number
 *           example: 25000
 *           description: Total won minus total spent
 *
 *     ClaimPrizeRequest:
 *       type: object
 *       required:
 *         - userId
 *         - hourlyAuctionId
 *         - upiId
 *       properties:
 *         userId:
 *           type: string
 *           example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *         hourlyAuctionId:
 *           type: string
 *           example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *         upiId:
 *           type: string
 *           example: "winner@paytm"
 *           description: Valid UPI ID format (username@provider)
 *         paymentReference:
 *           type: string
 *           example: "TXN123456789"
 *           description: Optional payment reference for remaining fees
 */

/**
 * @swagger
 * /api/v1/user/auction-history:
 *   get:
 *     summary: GET USER'S AUCTION HISTORY
 *     description: |
 *       Retrieves complete auction history for a specific user from the AuctionHistory collection.
 *       Returns detailed participation data including wins, losses, amounts spent/won, and prize claim status.
 *       
 *       **What it returns:**
 *       - Complete list of auctions user participated in (sorted by date, most recent first)
 *       - Detailed participation data for each auction
 *       - Aggregated statistics (total auctions, wins, losses, spend, winnings)
 *       - Winner status accurately marked (isWinner: true ONLY for actual winners with rank 1-3)
 *       - Prize claim information for won auctions
 *       
 *       **Use this endpoint to:**
 *       - Display user's auction history in frontend
 *       - Show user statistics and performance
 *       - Track user's participation over time
 *       - Enable prize claim flows for winners
 *     tags: [User History]
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User's UUID
 *         example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *     responses:
 *       200:
 *         description: Auction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuctionHistoryEntry'
 *                     totalAuctions:
 *                       type: number
 *                       example: 50
 *                     totalWins:
 *                       type: number
 *                       example: 5
 *                     totalLosses:
 *                       type: number
 *                       example: 45
 *             example:
 *               success: true
 *               data:
 *                 history:
 *                   - hourlyAuctionId: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *                     dailyAuctionId: "abc-123-def-456"
 *                     auctionDate: "2025-11-26"
 *                     auctionName: "iPhone 14 Pro"
 *                     prizeValue: 65000
 *                     TimeSlot: "09:00"
 *                     userParticipation:
 *                       playerId: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *                       playerUsername: "asha"
 *                       entryFee: 99
 *                       joinedAt: "2025-11-26T08:30:00.000Z"
 *                       isEliminated: false
 *                       eliminatedInRound: null
 *                       totalBidsPlaced: 4
 *                       totalAmountBid: 45000
 *                       totalAmountSpent: 45099
 *                       roundsParticipated: [1, 2, 3, 4]
 *                     isWinner: true
 *                     userWon: true
 *                     userRank: 1
 *                     prizeAmountWon: 45000
 *                     finalRank: 1
 *                     prizeClaimStatus: "CLAIMED"
 *                     claimDeadline: "2025-11-26T10:00:00.000Z"
 *                     claimedAt: "2025-11-26T09:45:00.000Z"
 *                     remainingProductFees: 20000
 *                     claimUpiId: "winner@paytm"
 *                     remainingFeesPaid: true
 *                     lastRoundBidAmount: 45000
 *                     completedAt: "2025-11-26T10:00:00.000Z"
 *                   - hourlyAuctionId: "def-456-ghi-789"
 *                     auctionDate: "2025-11-25"
 *                     auctionName: "MacBook Pro"
 *                     prizeValue: 120000
 *                     TimeSlot: "14:00"
 *                     userParticipation:
 *                       playerId: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *                       playerUsername: "asha"
 *                       entryFee: 99
 *                       totalBidsPlaced: 3
 *                       totalAmountBid: 15000
 *                       totalAmountSpent: 15099
 *                     isWinner: false
 *                     userWon: false
 *                     userRank: null
 *                     prizeAmountWon: 0
 *                     finalRank: null
 *                 totalAuctions: 2
 *                 totalWins: 1
 *                 totalLosses: 1
 *       400:
 *         description: Missing userId parameter
 *       500:
 *         description: Server error
 */
router.get('/auction-history', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // Find all auction history entries for this user, sorted by date (most recent first)
    // Include ALL statuses (JOINED, IN_PROGRESS, COMPLETED) so totalAuctions is accurate
    const historyEntries = await AuctionHistory.find({
      userId: userId
    }).sort({ auctionDate: -1, TimeSlot: -1 }).lean();

    console.log(`📊 [AUCTION-HISTORY] Found ${historyEntries.length} completed auctions for user ${userId}`);

    // Transform data to match frontend expectations
    const history = historyEntries.map((entry) => {
      return {
        // Auction identifiers
        hourlyAuctionId: entry.hourlyAuctionId,
        dailyAuctionId: entry.dailyAuctionId,
        
        // Auction details
        auctionDate: entry.auctionDate,
        auctionName: entry.auctionName,
        prizeValue: entry.prizeValue,
        TimeSlot: entry.TimeSlot,
        
        // User participation data
        userParticipation: {
          playerId: entry.userId,
          playerUsername: entry.username,
          entryFee: entry.entryFeePaid,
          joinedAt: entry.joinedAt,
          isEliminated: entry.isEliminated,
          eliminatedInRound: entry.eliminatedInRound,
          totalBidsPlaced: entry.totalBidsPlaced,
          totalAmountBid: entry.totalAmountBid,
          totalAmountSpent: entry.totalAmountSpent,
          roundsParticipated: entry.roundsParticipated,
        },
        
        // Winner information
        isWinner: entry.isWinner,
        userWon: entry.isWinner,
        userRank: entry.finalRank,
        prizeAmountWon: entry.prizeAmountWon,
        finalRank: entry.finalRank,
        
        // Prize claim information (for winners)
        prizeClaimStatus: entry.prizeClaimStatus,
        claimDeadline: entry.claimDeadline,
        claimedAt: entry.claimedAt,
        remainingProductFees: entry.remainingProductFees,
        claimUpiId: entry.claimUpiId,
        remainingFeesPaid: entry.remainingFeesPaid,
        lastRoundBidAmount: entry.lastRoundBidAmount,
        
        // Timestamps
        completedAt: entry.completedAt,
      };
    });

    // Calculate statistics
    const totalWins = history.filter((h) => h.isWinner).length;
    const totalLosses = history.filter((h) => !h.isWinner).length;

    return res.status(200).json({
      success: true,
      data: {
        history,
        totalAuctions: history.length,
        totalWins,
        totalLosses,
      },
    });
  } catch (error) {
    console.error('❌ [AUCTION-HISTORY] Error fetching auction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch auction history',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/user/claim-prize:
 *   post:
 *     summary: SUBMIT PRIZE CLAIM FOR WINNER
 *     description: |
 *       Submit prize claim for a winner (any rank: 1, 2, or 3).
 *       Winner must provide UPI ID and pay remaining product fees to claim prize.
 *       
 *       **Requirements:**
 *       - User must be a winner (rank 1-3) with PENDING claim status
 *       - Claim must be within the 30-minute deadline
 *       - UPI ID must be in valid format (username@provider)
 *       
 *       **What it does:**
 *       - Validates winner status and claim eligibility
 *       - Marks prize claim as CLAIMED
 *       - Records UPI ID for prize transfer
 *       - Updates claim timestamp and payment reference
 *       - Marks remainingFeesPaid as true
 *       
 *       **Prize claim flow:**
 *       1. User wins auction (assigned rank 1-3)
 *       2. 30-minute claim window starts automatically
 *       3. User submits this endpoint with UPI ID
 *       4. User pays remaining product fees via Razorpay
 *       5. Prize transferred to UPI ID within 24-48 hours
 *       
 *       **Priority Queue:**
 *       - If current rank fails to claim within 30 minutes, prize advances to next rank
 *       - Order: Rank 1 → Rank 2 → Rank 3 → Expired
 *     tags: [User History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClaimPrizeRequest'
 *           example:
 *             userId: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *             hourlyAuctionId: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *             upiId: "winner@paytm"
 *             paymentReference: "TXN123456789"
 *     responses:
 *       200:
 *         description: Prize claim submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Prize claim submitted successfully"
 *                 data:
 *                   type: object
 *                   description: Updated auction history entry with claim details
 *             example:
 *               success: true
 *               message: "Prize claim submitted successfully"
 *               data:
 *                 userId: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *                 hourlyAuctionId: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *                 prizeClaimStatus: "CLAIMED"
 *                 claimedAt: "2025-11-26T09:45:00.000Z"
 *                 claimUpiId: "winner@paytm"
 *                 remainingFeesPaid: true
 *       400:
 *         description: Invalid input (missing fields, claim not pending, or claim expired)
 *       404:
 *         description: Auction history entry not found or user is not a winner
 *       500:
 *         description: Server error
 */
router.post('/claim-prize', async (req, res) => {
  try {
    const { userId, hourlyAuctionId, upiId, paymentReference } = req.body;

    // Validation
    if (!userId || !hourlyAuctionId || !upiId) {
      return res.status(400).json({
        success: false,
        message: 'userId, hourlyAuctionId, and upiId are required',
      });
    }

    // Submit prize claim using AuctionHistory model method
    const updated = await AuctionHistory.submitPrizeClaim(userId, hourlyAuctionId, {
      upiId,
      paymentReference: paymentReference || null,
    });

    console.log(`🎁 [CLAIM-PRIZE] Prize claimed by user ${userId} for auction ${hourlyAuctionId}`);

    return res.status(200).json({
      success: true,
      message: 'Prize claim submitted successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ [CLAIM-PRIZE] Error submitting prize claim:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('not pending') || error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit prize claim',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/user/stats:
 *   get:
 *     summary: GET USER'S AUCTION STATISTICS
 *     description: |
 *       Returns aggregated auction statistics for a specific user.
 *       Provides quick overview of user's performance across all auctions.
 *       
 *       **Statistics included:**
 *       - Total auctions participated in
 *       - Total wins (rank 1-3)
 *       - Total losses
 *       - Total amount spent (entry fees + bids)
 *       - Total prize money won
 *       - Win rate percentage
 *       - Net gain (total won - total spent)
 *       
 *       **Use this endpoint to:**
 *       - Display user dashboard statistics
 *       - Show user performance metrics
 *       - Calculate ROI and win rates
 *       - Enable leaderboard features
 *     tags: [User History]
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User's UUID
 *         example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserStatistics'
 *             example:
 *               success: true
 *               data:
 *                 totalAuctions: 50
 *                 totalWins: 5
 *                 totalLosses: 45
 *                 totalSpent: 25000
 *                 totalWon: 50000
 *                 winRate: 10
 *                 netGain: 25000
 *       400:
 *         description: Missing userId parameter
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const stats = await AuctionHistory.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ [USER-STATS] Error fetching user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /user/transactions:
 *   get:
 *     summary: Get user payment transactions
 *     description: Returns entry fee and prize claim Razorpay payments for the user
 *     tags: [User History]
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transactions fetched successfully
 */
const mapPayment = (payment, auctionMeta = {}, dailyMeta = {}) => {
  const paymentType = payment.paymentType || 'ENTRY_FEE';

  // Source of truth for product worth: DailyAuction prizeValue (when available)
  let resolvedProductValue = payment.productValue ?? null;
  if (paymentType === 'PRIZE_CLAIM' && dailyMeta?.prizeValue !== undefined && dailyMeta?.prizeValue !== null) {
    resolvedProductValue = dailyMeta.prizeValue;
  }

  // Handle both Razorpay and Airpay fields
  const orderId = payment.razorpayOrderId || payment.orderId;
  const paymentId = payment.razorpayPaymentId || payment.airpayTransactionId;
  const paymentMethod = payment.paymentMethod || payment.paymentDetails?.method || null;

  return {
    id: payment._id,
    paymentType,
    amount: payment.amount,
    currency: payment.currency || 'INR',
    status: payment.status,
    orderId,
    paymentId,
    auctionId: payment.auctionId,
    auctionName: payment.auctionName || dailyMeta.auctionName || auctionMeta.auctionName || null,
    timeSlot: payment.auctionTimeSlot || payment.productTimeSlot || dailyMeta.timeSlot || auctionMeta.timeSlot || null,
    roundNumber: payment.roundNumber || null,
    productName: payment.productName || payment.auctionName || dailyMeta.auctionName || auctionMeta.auctionName || null,
    productTimeSlot: payment.productTimeSlot || payment.auctionTimeSlot || dailyMeta.timeSlot || auctionMeta.timeSlot || null,
    productValue: resolvedProductValue,
    prizeWorth: resolvedProductValue,
    productImage: payment.productImage ?? null,
    paidAt: payment.paidAt,
    paymentMethod,
    paymentDetails: payment.paymentDetails || {
      bankName: payment.bankName,
      cardName: payment.cardName,
      cardNumber: payment.cardNumber,
      vpa: payment.vpa,
      message: payment.message
    },
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

router.get('/transactions', async (req, res) => {
  try {
    const { userId } = req.query;
    const status = req.query.status || 'paid';

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // Fetch both Razorpay and Airpay payments
    const [razorpayPayments, airpayPayments] = await Promise.all([
      RazorpayPayment.find({ userId, status }).sort({ createdAt: -1 }).lean(),
      AirpayPayment.find({ userId, status }).sort({ createdAt: -1 }).lean()
    ]);

    // Combine and sort by createdAt descending
    const allPayments = [...razorpayPayments, ...airpayPayments].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    const auctionIds = [...new Set(allPayments.map(p => p.auctionId).filter(Boolean))];
    const auctionMap = {};

      if (auctionIds.length > 0) {
        const auctions = await HourlyAuction.find({ hourlyAuctionId: { $in: auctionIds } })
          .select('hourlyAuctionId auctionName TimeSlot')
          .lean();

        auctions.forEach((a) => {
          auctionMap[a.hourlyAuctionId] = {
            auctionName: a.auctionName,
            timeSlot: a.TimeSlot,
          };
        });
      }

      // Resolve product worth from DailyAuction (dailyAuctions) when available
      const dailyMap = {};
      if (auctionIds.length > 0) {
        const dailyDocs = await DailyAuction.find({ 'dailyAuctionConfig.hourlyAuctionId': { $in: auctionIds } })
          .select('dailyAuctionConfig.hourlyAuctionId dailyAuctionConfig.auctionName dailyAuctionConfig.prizeValue dailyAuctionConfig.TimeSlot')
          .lean();

        dailyDocs.forEach((doc) => {
          (doc.dailyAuctionConfig || []).forEach((cfg) => {
            if (!cfg?.hourlyAuctionId) return;
            if (!auctionIds.includes(cfg.hourlyAuctionId)) return;
            dailyMap[cfg.hourlyAuctionId] = {
              auctionName: cfg.auctionName,
              timeSlot: cfg.TimeSlot,
              prizeValue: cfg.prizeValue,
            };
          });
        });
      }

    const mapped = allPayments.map((p) => {
      const auctionMeta = auctionMap[p.auctionId] || {};
      const dailyMeta = dailyMap[p.auctionId] || {};
      return mapPayment(p, auctionMeta, dailyMeta);
    });

    const entryFees = mapped.filter((m) => m.paymentType === 'ENTRY_FEE');
    const prizeClaims = mapped.filter((m) => m.paymentType === 'PRIZE_CLAIM');
    const voucherTransactions = mapped.filter((m) => m.paymentType === 'VOUCHER');

    const entryAmount = entryFees.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const prizeAmount = prizeClaims.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const voucherAmount = voucherTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const prizeWorth = prizeClaims.reduce((sum, t) => sum + (Number(t.productValue) || 0), 0);
    const voucherWorth = prizeClaims.reduce((sum, t) => sum + (Number(t.productValue) || 0), 0) + voucherTransactions.reduce((sum, t) => sum + (Number(t.productValue) || 0), 0);

    const summary = {
      entryAmount,
      prizeAmount,
      voucherAmount,
      prizeWorth,
      voucherWorth,
      totalProductWorth: mapped.reduce((sum, t) => sum + (Number(t.productValue) || 0), 0),
      totalPaid: entryAmount + prizeAmount + voucherAmount,
      netValue: voucherWorth - (entryAmount + prizeAmount + voucherAmount),
      totalTransactions: mapped.length,
    };

    return res.status(200).json({
      success: true,
      data: {
        entryFees,
        prizeClaims,
        voucherTransactions,
        summary,
      },
    });
  } catch (error) {
    console.error('❌ [USER-TRANSACTIONS] Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user transactions',
      error: error.message,
    });
  }
});

router.get('/transactions/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({
        success: false,
        message: 'userId and transaction id are required',
      });
    }

    const query = {
      userId,
      $or: [
        { razorpayOrderId: id },
        { razorpayPaymentId: id },
        { orderId: id },
        { airpayTransactionId: id },
      ],
    };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or.push({ _id: id });
    }

    // Try finding in Razorpay first, then Airpay
    let payment = await RazorpayPayment.findOne(query).lean();
    if (!payment) {
      payment = await AirpayPayment.findOne(query).lean();
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

      let auctionMeta = {};
      if (payment.auctionId) {
        const auction = await HourlyAuction.findOne({ hourlyAuctionId: payment.auctionId })
          .select('hourlyAuctionId auctionName TimeSlot')
          .lean();
        if (auction) {
          auctionMeta = {
            auctionName: auction.auctionName,
            timeSlot: auction.TimeSlot,
          };
        }
      }

      let dailyMeta = {};
      if (payment.auctionId) {
        const dailyDoc = await DailyAuction.findOne({ 'dailyAuctionConfig.hourlyAuctionId': payment.auctionId })
          .select('dailyAuctionConfig.hourlyAuctionId dailyAuctionConfig.auctionName dailyAuctionConfig.prizeValue dailyAuctionConfig.TimeSlot')
          .lean();

        const cfg = (dailyDoc?.dailyAuctionConfig || []).find((c) => c?.hourlyAuctionId === payment.auctionId);
        if (cfg) {
          dailyMeta = {
            auctionName: cfg.auctionName,
            timeSlot: cfg.TimeSlot,
            prizeValue: cfg.prizeValue,
          };
        }
      }

      return res.status(200).json({
        success: true,
        data: mapPayment(payment, auctionMeta, dailyMeta),
      });
  } catch (error) {
    console.error('❌ [USER-TRANSACTION-DETAIL] Error fetching transaction detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction detail',
      error: error.message,
    });
  }
});

// User voucher transactions endpoint (returns masked data)
router.get('/voucher-transactions', getUserVoucherTransactions);

/**
 * @swagger
 * /user/voucher/{voucherId}/send-reveal-otp:
 *   post:
 *     summary: SEND OTP FOR VOUCHER CODE REVEAL
 *     description: Send an OTP to the user's registered mobile to reveal the full voucher code. Limited to 3 reveals per day.
 *     tags: [User History]
 *     parameters:
 *       - name: voucherId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher ID from database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID requesting the reveal
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     mobile:
 *                       type: string
 *                       description: Last 4 digits of mobile
 *       400:
 *         description: Missing fields or voucher not complete
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Voucher or user not found
 *       429:
 *         description: Daily reveal limit reached
 *       500:
 *         description: Server error
 */
router.post('/voucher/:voucherId/send-reveal-otp', sendVoucherRevealOtp);

/**
 * @swagger
 * /user/voucher/{voucherId}/verify-reveal-otp:
 *   post:
 *     summary: VERIFY OTP AND REVEAL VOUCHER CODE
 *     description: Verify the OTP and return the full voucher card number, PIN, and activation URL.
 *     tags: [User History]
 *     parameters:
 *       - name: voucherId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher ID from database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID requesting the reveal
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP received via SMS
 *     responses:
 *       200:
 *         description: Voucher code revealed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Voucher code revealed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cardNumber:
 *                       type: string
 *                     cardPin:
 *                       type: string
 *                     activationUrl:
 *                       type: string
 *                     expiry:
 *                       type: string
 *                       format: date-time
 *                     revealsRemaining:
 *                       type: number
 *       400:
 *         description: Invalid or expired OTP
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Voucher or user not found
 *       429:
 *         description: Daily reveal limit reached
 *       500:
 *         description: Server error
 */
router.post('/voucher/:voucherId/verify-reveal-otp', verifyVoucherRevealOtp);

module.exports = router;
