const express = require('express');
const router = express.Router();
const { submitPrizeClaim, cancelPrizeClaim } = require('../controllers/prizeClaimController');

/**
 * @swagger
 * tags:
 *   - name: Prize Claim
 *     description: Prize claim management for auction winners with priority queue system
 *
 * components:
 *   schemas:
 *     PrizeClaimEntry:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *         username:
 *           type: string
 *           example: "asha"
 *         hourlyAuctionId:
 *           type: string
 *           example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *         auctionName:
 *           type: string
 *           example: "iPhone 14 Pro"
 *         prizeValue:
 *           type: number
 *           example: 65000
 *         finalRank:
 *           type: number
 *           example: 1
 *           description: Winner's rank (1, 2, or 3)
 *         prizeAmountWon:
 *           type: number
 *           example: 45000
 *           description: Prize amount won based on rank
 *         prizeClaimStatus:
 *           type: string
 *           enum: [PENDING, CLAIMED, EXPIRED]
 *           example: "PENDING"
 *         claimDeadline:
 *           type: string
 *           format: date-time
 *           example: "2025-11-26T10:30:00.000Z"
 *           description: Deadline to claim prize (30 minutes from win)
 *         remainingProductFees:
 *           type: number
 *           example: 20000
 *           description: Remaining fees to be paid to claim prize
 *         claimUpiId:
 *           type: string
 *           example: "winner@paytm"
 *           description: UPI ID for prize transfer
 *         claimedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-11-26T10:15:00.000Z"
 *         lastRoundBidAmount:
 *           type: number
 *           example: 45000
 *           description: User's last round bid amount
 *         auctionDate:
 *           type: string
 *           format: date
 *           example: "2025-11-26"
 *         TimeSlot:
 *           type: string
 *           example: "09:00"
 *
 *     SubmitPrizeClaimRequest:
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
 *
 *     ProcessQueuesResult:
 *       type: object
 *       properties:
 *         processed:
 *           type: number
 *           example: 5
 *           description: Number of auctions processed
 *         advanced:
 *           type: number
 *           example: 2
 *           description: Number of times prize advanced to next rank
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               hourlyAuctionId:
 *                 type: string
 *               action:
 *                 type: string
 *               fromRank:
 *                 type: number
 *               toRank:
 *                 type: number
 */

/**
 * @swagger
 * /api/v1/prize-claim/pending:
 *   get:
 *     summary: GET PENDING PRIZE CLAIMS FOR A USER
 *     description: |
 *       Returns all pending prize claims for a specific user (any rank 1-3).
 *       Sorted by deadline (earliest first) to prioritize urgent claims.
 *       
 *       **Use this endpoint to:**
 *       - Display pending prize claims to the user
 *       - Show claim deadlines and remaining time
 *       - Enable prize claim submission flow
 *     tags: [Prize Claim]
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
 *         description: Pending claims retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrizeClaimEntry'
 *             example:
 *               success: true
 *               data:
 *                 - userId: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *                   username: "asha"
 *                   hourlyAuctionId: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *                   auctionName: "iPhone 14 Pro"
 *                   prizeValue: 65000
 *                   finalRank: 1
 *                   prizeAmountWon: 45000
 *                   prizeClaimStatus: "PENDING"
 *                   claimDeadline: "2025-11-26T10:30:00.000Z"
 *                   remainingProductFees: 20000
 *                   lastRoundBidAmount: 45000
 *                   auctionDate: "2025-11-26"
 *                   TimeSlot: "09:00"
 *       400:
 *         description: Missing userId parameter
 *       500:
 *         description: Server error
 */
router.get('/pending', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // ✅ Find all pending prize claims for this user (any rank 1-3)
    const pendingClaims = await AuctionHistory.find({
      userId,
      isWinner: true,
      prizeClaimStatus: 'PENDING',
    }).sort({ claimDeadline: 1 }); // Sort by deadline (earliest first)

    return res.status(200).json({
      success: true,
      data: pendingClaims,
    });
  } catch (error) {
    console.error('Error fetching pending prize claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending prize claims',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/prize-claim/submit:
 *   post:
 *     summary: SUBMIT PRIZE CLAIM
 *     description: |
 *       Submit prize claim with UPI ID and optional payment reference for remaining fees.
 *       
 *       **Requirements:**
 *       - User must be a winner (rank 1-3) with PENDING claim status
 *       - Claim must be within the 30-minute deadline
 *       - UPI ID must be in valid format (username@provider)
 *       
 *       **What it does:**
 *       - Validates UPI ID format
 *       - Marks prize claim as CLAIMED
 *       - Records claim timestamp and payment details
 *       - Updates claimUpiId and remainingFeesPaid status
 *       
 *       **Prize claim flow:**
 *       1. User wins auction (assigned rank 1-3)
 *       2. 30-minute claim window starts
 *       3. User submits UPI ID + pays remaining fees
 *       4. Prize transferred to UPI ID within 24-48 hours
 *     tags: [Prize Claim]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitPrizeClaimRequest'
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
 *                   $ref: '#/components/schemas/PrizeClaimEntry'
 *       400:
 *         description: Invalid input (missing fields, invalid UPI format, claim expired, or not pending)
 *       404:
 *         description: Auction history entry not found
 *       500:
 *         description: Server error
 */
// Submit prize claim (delegates to controller so statuses are synced)
router.post('/submit', submitPrizeClaim);

// Cancel current winner's claim and advance to next winner immediately
router.post('/cancel', cancelPrizeClaim);

/**
 * @swagger
 * /api/v1/prize-claim/process-queues:
 *   post:
 *     summary: PROCESS PRIORITY CLAIM QUEUES (CRON JOB)
 *     description: |
 *       Automatically advances prizes to next rank when current rank fails to claim within 30 minutes.
 *       This endpoint is designed to be called by a cron job but can also be triggered manually.
 *       
 *       **How priority queue works:**
 *       1. Rank 1 winner has 30 minutes to claim
 *       2. If Rank 1 fails, prize advances to Rank 2 (new 30-minute window)
 *       3. If Rank 2 fails, prize advances to Rank 3 (new 30-minute window)
 *       4. If all ranks fail, prize is marked as EXPIRED
 *       
 *       **What it does:**
 *       - Checks all pending claims for expired deadlines
 *       - Advances to next rank when deadline passes
 *       - Updates prizeClaimStatus and claimDeadline
 *       - Logs all rank transitions
 *       
 *       **Use this endpoint:**
 *       - Via cron job (recommended: every 1 minute)
 *       - Manual trigger for testing or recovery
 *     tags: [Prize Claim]
 *     responses:
 *       200:
 *         description: Claim queues processed successfully
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
 *                   example: "Claim queues processed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProcessQueuesResult'
 *             example:
 *               success: true
 *               message: "Claim queues processed successfully"
 *               data:
 *                 processed: 5
 *                 advanced: 2
 *                 details:
 *                   - hourlyAuctionId: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *                     action: "ADVANCED"
 *                     fromRank: 1
 *                     toRank: 2
 *                   - hourlyAuctionId: "abc123-def456-ghi789"
 *                     action: "ADVANCED"
 *                     fromRank: 2
 *                     toRank: 3
 *       500:
 *         description: Server error
 */
router.post('/process-queues', async (req, res) => {
  try {
    const result = await AuctionHistory.processClaimQueues();

    console.log(`✅ [PRIORITY-CLAIM-API] Processed ${result.processed} auctions, advanced ${result.advanced} to next rank`);

    return res.status(200).json({
      success: true,
      message: 'Claim queues processed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error processing claim queues:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process claim queues',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/prize-claim/history/{hourlyAuctionId}:
 *   get:
 *     summary: GET PRIZE CLAIM DETAILS FOR AUCTION
 *     description: |
 *       Returns prize claim information for a specific auction.
 *       Can filter by userId to get only that user's claim details.
 *       Shows complete claim history including all ranks and their statuses.
 *       
 *       **Use this endpoint to:**
 *       - Display prize claim status to users
 *       - Show which rank currently has claim priority
 *       - Track prize claim history for audit purposes
 *     tags: [Prize Claim]
 *     parameters:
 *       - name: hourlyAuctionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Hourly auction UUID
 *         example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional - Filter by specific user's UUID
 *         example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *     responses:
 *       200:
 *         description: Prize claim history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrizeClaimEntry'
 *             example:
 *               success: true
 *               data:
 *                 - userId: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *                   username: "asha"
 *                   hourlyAuctionId: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *                   auctionName: "iPhone 14 Pro"
 *                   finalRank: 1
 *                   prizeAmountWon: 45000
 *                   prizeClaimStatus: "CLAIMED"
 *                   claimedAt: "2025-11-26T10:15:00.000Z"
 *                   claimUpiId: "winner@paytm"
 *                 - userId: "abc-123-def-456"
 *                   username: "player2"
 *                   hourlyAuctionId: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *                   auctionName: "iPhone 14 Pro"
 *                   finalRank: 2
 *                   prizeAmountWon: 15000
 *                   prizeClaimStatus: "PENDING"
 *                   claimDeadline: "2025-11-26T11:00:00.000Z"
 *       500:
 *         description: Server error
 */
router.get('/history/:hourlyAuctionId', async (req, res) => {
  try {
    const { hourlyAuctionId } = req.params;
    const { userId } = req.query;

    const query = { hourlyAuctionId };
    if (userId) {
      query.userId = userId;
    }

    const claims = await AuctionHistory.find(query).sort({ finalRank: 1 });

    return res.status(200).json({
      success: true,
      data: claims,
    });
  } catch (error) {
    console.error('Error fetching prize claim history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prize claim history',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/prize-claim/expire-unclaimed:
 *   post:
 *     summary: EXPIRE UNCLAIMED PRIZES (SCHEDULER ENDPOINT)
 *     description: |
 *       Manually trigger expiration of unclaimed prizes that have passed their deadlines.
 *       This endpoint is typically called by the scheduler but can be triggered manually.
 *       
 *       **What it does:**
 *       - Finds all PENDING claims with expired deadlines
 *       - Marks them as EXPIRED
 *       - Logs expired prize count
 *       
 *       **Use this endpoint:**
 *       - Via scheduler (recommended: daily or hourly)
 *       - Manual trigger for testing or cleanup
 *       - After processing queues to finalize expirations
 *     tags: [Prize Claim]
 *     responses:
 *       200:
 *         description: Unclaimed prizes expired successfully
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
 *                   example: "Expired 3 unclaimed prizes"
 *                 data:
 *                   type: object
 *                   properties:
 *                     expiredCount:
 *                       type: number
 *                       example: 3
 *             example:
 *               success: true
 *               message: "Expired 3 unclaimed prizes"
 *               data:
 *                 expiredCount: 3
 *       500:
 *         description: Server error
 */
router.post('/expire-unclaimed', async (req, res) => {
  try {
    const result = await AuctionHistory.expireUnclaimedPrizes();

    return res.status(200).json({
      success: true,
      message: `Expired ${result.modifiedCount} unclaimed prizes`,
      data: {
        expiredCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error expiring unclaimed prizes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to expire unclaimed prizes',
      error: error.message,
    });
  }
});

module.exports = router;