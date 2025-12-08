// src/routes/schedulerRoutes.js
const express = require('express');
const router = express.Router();
const {
  manualTriggerDailyAuction,
  manualTriggerMidnightReset,
  manualTriggerHourlyAuctions,
  getDailyAuction,
  getHourlyAuctions,
  updateHourlyAuctionStatus,
  getLiveHourlyAuction,
  manualTriggerAutoActivate,
  getSchedulerStatus,
  placeBid,
  markAuctionWinners,
  getUserAuctionHistory,
  getAuctionDetails,
} = require('../controllers/schedulerController');

/**
 * @swagger 
 * /scheduler/midnight-reset:
 *   post:
 *     summary: Manually trigger midnight reset and creation workflow
 *     description: |
 *       Executes the complete midnight workflow that normally runs at 00:00 AM daily.
 *       
 *       **What it does:**
 *       1. Resets all daily auctions (sets isActive to false, Status to COMPLETED)
 *       2. Resets all hourly auctions (sets Status to COMPLETED for LIVE/UPCOMING ones)
 *       3. Creates new daily auction for TODAY from active master auction
 *       4. Creates all hourly auctions for TODAY (all with Status UPCOMING)
 *       
 *       **Use this endpoint to:**
 *       - Test the midnight reset workflow without waiting until midnight
 *       - Manually trigger daily auction creation for today
 *       - Reset and restart auction cycle
 *       
 *       **Important:**
 *       - Only works if there's an active master auction (isActive: true)
 *       - Will not create duplicate daily auctions for the same date
 *       - All new auctions start with UPCOMING status
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Midnight workflow completed successfully
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
 *                   example: "Midnight reset and creation workflow completed successfully"
 *                 resetResult:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "All daily and hourly auctions reset successfully"
 *                     dailyAuctionsUpdated:
 *                       type: number
 *                       example: 1
 *                     hourlyAuctionsUpdated:
 *                       type: number
 *                       example: 12
 *                 createResult:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Daily auction and hourly auctions created successfully for today"
 *                     dailyAuction:
 *                       type: object
 *                       description: Created daily auction document
 *                     hourlyAuctions:
 *                       type: object
 *                       properties:
 *                         created:
 *                           type: number
 *                           example: 12
 *                         auctions:
 *                           type: array
 *                           description: Array of created hourly auction documents
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-11-27T00:00:00.000Z"
 *       400:
 *         description: Workflow failed (no active master auction or reset/creation error)
 *       500:
 *         description: Internal server error
 */
router.post('/midnight-reset', manualTriggerMidnightReset);

/**
 * @swagger
 * /scheduler/create-daily-auction:
 *   post:
 *     summary: Manually trigger daily auction creation
 *     description: Creates daily auction from active master auction (normally runs at 12:00 AM daily)
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Daily auction created successfully
 *       400:
 *         description: Error creating auction (no active master or already created)
 *       500:
 *         description: Internal server error
 */
router.post('/create-daily-auction', manualTriggerDailyAuction);

/**
 * @swagger
 * /scheduler/create-hourly-auctions:
 *   post:
 *     summary: Manually trigger hourly auctions creation
 *     description: Creates hourly auctions from today's daily auction
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Hourly auctions created successfully
 *       404:
 *         description: No daily auction found for today
 *       500:
 *         description: Internal server error
 */
router.post('/create-hourly-auctions', manualTriggerHourlyAuctions);

/**
 * @swagger
 * /scheduler/trigger-auto-activate:
 *   post:
 *     summary: Manually trigger auto-activation logic
 *     description: |
 *       Executes the auto-activation logic that normally runs every minute via cron.
 *       This endpoint is useful for testing and debugging the auction state transitions.
 *       
 *       **What it does:**
 *       - Checks all today's auctions and updates their status based on current server time
 *       - Transitions UPCOMING auctions to LIVE when TimeSlot matches current time
 *       - Transitions LIVE auctions through rounds (15-minute intervals)
 *       - Transitions LIVE auctions to COMPLETED after 60 minutes
 *       
 *       **Use this endpoint to:**
 *       - Test auction activation without waiting for cron schedule
 *       - Debug auction state transitions
 *       - Force status updates after manual data changes
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Auto-activation logic executed successfully
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
 *                   example: "Auto-activation logic executed successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-11-24T09:00:00.000Z"
 *       500:
 *         description: Internal server error
 */
router.post('/trigger-auto-activate', manualTriggerAutoActivate);

/**
 * @swagger
 * /scheduler/status:
 *   get:
 *     summary: Get current scheduler status and today's auction schedule
 *     description: |
 *       Returns comprehensive information about the scheduler's current state including:
 *       - Current server time and timezone
 *       - Currently live auction (if any)
 *       - Next upcoming auction
 *       - Statistics for today's auctions (total, by status)
 *       - Complete schedule for all today's auctions
 *       
 *       **Use this endpoint to:**
 *       - Monitor scheduler health and status
 *       - Display live auction information
 *       - Show upcoming auctions to users
 *       - Debug scheduling issues
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Scheduler status retrieved successfully
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
 *                     serverTime:
 *                       type: object
 *                       properties:
 *                         iso:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-11-24T09:30:00.000Z"
 *                         time:
 *                           type: string
 *                           example: "15:00:00"
 *                         date:
 *                           type: string
 *                           example: "24/11/2025"
 *                         timezone:
 *                           type: string
 *                           example: "Asia/Kolkata"
 *                     currentLiveAuction:
 *                       type: object
 *                       nullable: true
 *                       description: Currently live auction (null if no live auction)
 *                     nextUpcomingAuction:
 *                       type: object
 *                       nullable: true
 *                       description: Next upcoming auction (null if none)
 *                       properties:
 *                         hourlyAuctionCode:
 *                           type: string
 *                           example: "HA000001"
 *                         auctionName:
 *                           type: string
 *                           example: "Dream Auction 1"
 *                         TimeSlot:
 *                           type: string
 *                           example: "10:00"
 *                         prizeValue:
 *                           type: number
 *                           example: 10000
 *                     todayStats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 24
 *                         UPCOMING:
 *                           type: number
 *                           example: 10
 *                         LIVE:
 *                           type: number
 *                           example: 1
 *                         COMPLETED:
 *                           type: number
 *                           example: 13
 *                         CANCELLED:
 *                           type: number
 *                           example: 0
 *                     schedule:
 *                       type: array
 *                       description: Complete list of today's auctions
 *                       items:
 *                         type: object
 *                         properties:
 *                           hourlyAuctionCode:
 *                             type: string
 *                             example: "HA000001"
 *                           auctionName:
 *                             type: string
 *                             example: "Dream Auction 1"
 *                           TimeSlot:
 *                             type: string
 *                             example: "09:00"
 *                           Status:
 *                             type: string
 *                             enum: [UPCOMING, LIVE, COMPLETED, CANCELLED]
 *                             example: "LIVE"
 *                           currentRound:
 *                             type: number
 *                             example: 2
 *                           totalRounds:
 *                             type: number
 *                             example: 4
 *                           prizeValue:
 *                             type: number
 *                             example: 10000
 *       500:
 *         description: Internal server error
 */
router.get('/status', getSchedulerStatus);

/**
 * @swagger
 * /scheduler/daily-auction:
 *   get:
 *     summary: Get the latest active daily auction
 *     description: Retrieve the most recent daily auction where isActive is true. If multiple active auctions exist, only the latest one is returned.
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Latest active daily auction retrieved successfully
 *       404:
 *         description: No active daily auction found
 *       500:
 *         description: Internal server error
 */
router.get('/daily-auction', getDailyAuction);

/**
 * @swagger
 * /scheduler/hourly-auctions:
 *   get:
 *     summary: Get all hourly auctions for the latest active daily auction
 *     description: |
 *       Finds the most recent DailyAuction where `isActive` is true and returns ALL HourlyAuction
 *       documents that reference that daily auction (both active and inactive).
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Hourly auctions retrieved successfully
 *       404:
 *         description: No active daily auction found
 *       500:
 *         description: Internal server error
 */
router.get('/hourly-auctions', getHourlyAuctions);

/**
 * @swagger
 * /scheduler/hourly-auctions/{hourlyAuctionId}/status:
 *   patch:
 *     summary: Update hourly auction status
 *     description: Update the status of a specific hourly auction
 *     tags: [Scheduler]
 *     parameters:
 *       - in: path
 *         name: hourlyAuctionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hourly auction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [LIVE, UPCOMING, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Hourly auction not found
 *       500:
 *         description: Internal server error
 */
router.patch('/hourly-auctions/:hourlyAuctionId/status', updateHourlyAuctionStatus);

/**
 * @swagger
 * /scheduler/live-auction:
 *   get:
 *     summary: Get the current live hourly auction
 *     description: Returns only one hourly auction with status LIVE. If multiple live auctions exist, returns the most recently started one.
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Live hourly auction retrieved successfully
 *       404:
 *         description: No live hourly auction found
 *       500:
 *         description: Internal server error
 */
router.get('/live-auction', getLiveHourlyAuction);

/**
 * @swagger
 * /scheduler/place-bid:
 *   post:
 *     summary: Place a bid in the active round
 *     description: |
 *       Allows a participant to place a bid in the currently active round of a live auction.
 *       
 *       **Requirements:**
 *       - User must be a participant (paid entry fee)
 *       - Auction must have status LIVE
 *       - Round must have status ACTIVE
 *       - User must not be eliminated
 *       - User can only place one bid per round
 *       
 *       **Behavior:**
 *       - User can only bid once per round (no updates allowed)
 *       - Bid is added to the rounds[roundNumber].playersData array
 *       - Participant stats (totalBidsPlaced, totalAmountBid) are updated
 *       - totalParticipants count is updated based on playersData length
 *     tags: [Scheduler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playerId
 *               - playerUsername
 *               - auctionValue
 *               - hourlyAuctionId
 *             properties:
 *               playerId:
 *                 type: string
 *                 description: UUID of the player placing the bid
 *                 example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *               playerUsername:
 *                 type: string
 *                 description: Username of the player
 *                 example: "asha"
 *               auctionValue:
 *                 type: number
 *                 description: Amount to bid (must be > 0)
 *                 example: 5000
 *               hourlyAuctionId:
 *                 type: string
 *                 description: UUID of the hourly auction
 *                 example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *     responses:
 *       200:
 *         description: Bid placed successfully
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
 *                   example: "Your bid of ₹5000 has been placed successfully in Round 2!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: string
 *                       example: "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *                     playerUsername:
 *                       type: string
 *                       example: "asha"
 *                     auctionValue:
 *                       type: number
 *                       example: 5000
 *                     roundNumber:
 *                       type: number
 *                       example: 2
 *                     placedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T08:50:00.000Z"
 *                     totalBidsPlaced:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Bad request (missing fields, invalid bid amount, auction not live, round not active, already placed bid in round)
 *       403:
 *         description: Forbidden (not a participant, player eliminated)
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Internal server error
 */
router.post('/place-bid', placeBid);

/**
 * @swagger
 * /scheduler/mark-winners/{hourlyAuctionId}:
 *   post:
 *     summary: Mark winners in auction history (ONLY actual winners)
 *     description: |
 *       Updates the AuctionHistory collection to mark ONLY the actual winners (rank 1, 2, 3) 
 *       after an auction is completed. Non-winners are marked as completed but NOT as winners.
 *       
 *       **What it does:**
 *       - Finds all users who participated in the auction
 *       - Marks ONLY users in the winners array (rank 1-3) with isWinner: true
 *       - Updates their finalRank and prizeAmountWon
 *       - Marks all other participants as completed but isWinner: false
 *       
 *       **Requirements:**
 *       - Auction must have status COMPLETED
 *       - Auction must have winners array populated
 *       
 *       **Use this endpoint:**
 *       - After auction completion to persist winner information
 *       - To update user auction history with accurate results
 *     tags: [Scheduler]
 *     parameters:
 *       - in: path
 *         name: hourlyAuctionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hourly auction UUID
 *     responses:
 *       200:
 *         description: Winners marked successfully in auction history
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
 *                   example: "Auction winners marked successfully in history"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hourlyAuctionId:
 *                       type: string
 *                       example: "abc123-def456-..."
 *                     hourlyAuctionCode:
 *                       type: string
 *                       example: "HA000001"
 *                     winnersMarked:
 *                       type: number
 *                       example: 3
 *                     nonWinnersMarked:
 *                       type: number
 *                       example: 47
 *                     winners:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           username:
 *                             type: string
 *                           rank:
 *                             type: number
 *                           prizeWon:
 *                             type: number
 *       400:
 *         description: Auction not completed or no winners found
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Internal server error
 */
router.post('/mark-winners/:hourlyAuctionId', markAuctionWinners);

/**
 * @swagger
 * /scheduler/user-auction-history:
 *   get:
 *     summary: Get user's auction history from AuctionHistory model
 *     description: |
 *       Retrieves a user's complete auction history from the AuctionHistory collection.
 *       Returns detailed participation data including wins, losses, amounts spent/won, etc.
 *       
 *       **What it returns:**
 *       - Complete list of auctions user participated in
 *       - Aggregated statistics (total auctions, wins, losses, spend, winnings)
 *       - Winner status accurately marked (isWinner: true ONLY for actual winners)
 *       
 *       **Use this endpoint:**
 *       - To display user's auction history in frontend
 *       - To show user statistics and performance
 *       - To track user's participation over time
 *     tags: [Scheduler]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User's UUID
 *     responses:
 *       200:
 *         description: User auction history retrieved successfully
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
 *                   description: Array of auction history entries
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       username:
 *                         type: string
 *                       hourlyAuctionId:
 *                         type: string
 *                       auctionName:
 *                         type: string
 *                       prizeValue:
 *                         type: number
 *                       isWinner:
 *                         type: boolean
 *                         description: True ONLY if user won (rank 1-3)
 *                       finalRank:
 *                         type: number
 *                         nullable: true
 *                         description: User's rank (1-3 for winners, null for non-winners)
 *                       prizeAmountWon:
 *                         type: number
 *                         description: Prize amount (0 for non-winners)
 *                       totalAmountSpent:
 *                         type: number
 *                       totalBidsPlaced:
 *                         type: number
 *                       auctionDate:
 *                         type: string
 *                         format: date-time
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalAuctions:
 *                       type: number
 *                       example: 50
 *                     totalWins:
 *                       type: number
 *                       example: 5
 *                     totalLosses:
 *                       type: number
 *                       example: 45
 *                     totalSpent:
 *                       type: number
 *                       example: 25000
 *                     totalWon:
 *                       type: number
 *                       example: 50000
 *                     winRate:
 *                       type: number
 *                       example: 10
 *                       description: Win percentage
 *                     netGain:
 *                       type: number
 *                       example: 25000
 *                       description: Total won minus total spent
 *       400:
 *         description: Missing userId parameter
 *       500:
 *         description: Internal server error
 */
router.get('/user-auction-history', getUserAuctionHistory);

/**
 * @swagger
 * /scheduler/auction-details:
 *   get:
 *     summary: Get detailed auction data for view details page
 *     description: |
 *       Returns comprehensive round-by-round breakdown of an auction including:
 *       - User's participation in each round
 *       - Participant counts and qualification status
 *       - Highest/lowest bids per round
 *       - Winner information with cascading claim logic
 *       
 *       **Use this endpoint:**
 *       - To display detailed auction history to users
 *       - To show round-by-round performance analysis
 *       - To handle prize claim flows for winners
 *     tags: [Scheduler]
 *     parameters:
 *       - in: query
 *         name: hourlyAuctionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hourly auction UUID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User's UUID
 *     responses:
 *       200:
 *         description: Auction details retrieved successfully
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Auction not found or user did not participate
 *       500:
 *         description: Internal server error
 */
router.get('/auction-details', getAuctionDetails);

module.exports = router;