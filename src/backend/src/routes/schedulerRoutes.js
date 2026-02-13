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
  getHourlyAuctionById,
  getAuctionLeaderboard,
  checkAuctionParticipation,
  forceCompleteAuction,
  getFirstUpcomingProduct,
  syncMasterToAuctions,
  getDailyAuctionByDate,
  recalculateUserStats,
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
 * /scheduler/daily-auction-by-date:
 *   get:
 *     summary: Get daily auction by a specific date
 *     description: |
 *       Returns the daily auction for a given date. Pass the date as a query parameter in YYYY-MM-DD format.
 *       
 *       **Example:** `/scheduler/daily-auction-by-date?date=2026-02-09`
 *     tags: [Scheduler]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-02-09"
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Daily auction retrieved successfully
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
 *                   description: Complete daily auction document for the given date
 *       400:
 *         description: Missing or invalid date parameter
 *       404:
 *         description: No daily auction found for the given date
 *       500:
 *         description: Internal server error
 */
router.get('/daily-auction-by-date', getDailyAuctionByDate);

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

/**
 * @swagger
 * /scheduler/hourly-auction/{hourlyAuctionId}:
 *   get:
 *     summary: Get total data of a particular hourly auction
 *     description: |
 *       Returns complete hourly auction data including all participants, rounds, winners, and summary statistics.
 *       
 *       **What it returns:**
 *       - Complete auction document with all fields
 *       - Summary statistics (total participants, bids, revenue, prize distributed)
 *       - Round-by-round breakdown with stats
 *       - Winner information
 *       
 *       **Use this endpoint to:**
 *       - Get complete data of a specific hourly auction
 *       - View auction analytics and statistics
 *       - Admin dashboard auction details
 *     tags: [Scheduler]
 *     parameters:
 *       - in: path
 *         name: hourlyAuctionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hourly auction UUID
 *         example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *     responses:
 *       200:
 *         description: Hourly auction data retrieved successfully
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
 *                   description: Complete hourly auction document
 *                 summary:
 *                   type: object
 *                   properties:
 *                     hourlyAuctionId:
 *                       type: string
 *                     hourlyAuctionCode:
 *                       type: string
 *                       example: "HA000001"
 *                     auctionName:
 *                       type: string
 *                       example: "Dream Auction 1"
 *                     status:
 *                       type: string
 *                       enum: [UPCOMING, LIVE, COMPLETED, CANCELLED]
 *                     timeSlot:
 *                       type: string
 *                       example: "10:00"
 *                     prizeValue:
 *                       type: number
 *                       example: 10000
 *                     entryFee:
 *                       type: number
 *                       example: 100
 *                     totalParticipants:
 *                       type: number
 *                       example: 50
 *                     totalBids:
 *                       type: number
 *                       example: 200
 *                     totalWinners:
 *                       type: number
 *                       example: 3
 *                     totalRevenue:
 *                       type: number
 *                       example: 5000
 *                     totalPrizeDistributed:
 *                       type: number
 *                       example: 10000
 *                     currentRound:
 *                       type: number
 *                       example: 4
 *                     totalRounds:
 *                       type: number
 *                       example: 4
 *                     roundStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           roundNumber:
 *                             type: number
 *                           status:
 *                             type: string
 *                           totalParticipants:
 *                             type: number
 *                           qualifiedCount:
 *                             type: number
 *                           highestBid:
 *                             type: number
 *                           lowestBid:
 *                             type: number
 *                     winners:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Missing hourlyAuctionId parameter
 *       404:
 *         description: Hourly auction not found
 *       500:
 *         description: Internal server error
 */
router.get('/hourly-auction/:hourlyAuctionId', getHourlyAuctionById);

/**
 * @swagger
 * /scheduler/auction-leaderboard:
 *   get:
 *     summary: Get auction leaderboard for participants
 *     description: |
 *       Returns leaderboard data for each round of an auction.
 *       Only accessible by users who participated in the auction.
 *       
 *       **What it returns:**
 *       - Leaderboard data for each round (sorted by bid amount, then by time)
 *       - Auction summary with prize info and winners
 *       
 *       **Access Control:**
 *       - Only participants can view the leaderboard
 *       - Non-participants receive 403 Forbidden
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
 *         description: Leaderboard retrieved successfully
 *       403:
 *         description: Access denied - user did not participate
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Internal server error
 */
router.get('/auction-leaderboard', getAuctionLeaderboard);

/**
 * @swagger
 * /scheduler/check-participation:
 *   get:
 *     summary: Check if user participated in an auction
 *     description: |
 *       Quick check endpoint for frontend to determine if leaderboard button should be shown.
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
 *         description: Participation status retrieved
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Internal server error
 */
router.get('/check-participation', checkAuctionParticipation);

/**
 * @swagger
 * /scheduler/force-complete/{hourlyAuctionId}:
 *   post:
 *     summary: Force complete an auction with all its rounds
 *     description: |
 *       Manually completes an auction that should have finished.
 *       Completes all rounds, calculates winners, and syncs to daily auction config.
 *       
 *       **Use this endpoint to:**
 *       - Fix auctions that didn't complete automatically
 *       - Manually end a stuck auction
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
 *         description: Auction completed successfully
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Internal server error
 */
router.post('/force-complete/:hourlyAuctionId', forceCompleteAuction);

/**
 * @swagger
 * /scheduler/first-upcoming-product:
 *   get:
 *     summary: Get upcoming product with all images and descriptions
 *     description: |
 *       Returns the upcoming auction's product details including all product images.
 *       Useful for the prize showcase component to display product cards with multiple images.
 *       
 *       **Behavior:**
 *       - If `hourlyAuctionId` is provided, returns that specific upcoming auction
 *       - If no parameter is provided, returns message indicating no upcoming auctions currently
 *       
 *       **Use this endpoint:**
 *       - When user clicks on an upcoming auction in the auction schedule
 *       - To display product details on the prize showcase page
 *     tags: [Scheduler]
 *     parameters:
 *       - in: query
 *         name: hourlyAuctionId
 *         required: false
 *         schema:
 *           type: string
 *         description: UUID of the hourly auction to retrieve. If not provided, returns "No upcoming auctions currently"
 *         example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *     responses:
 *       200:
 *         description: Response with upcoming product data or message
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
 *                   example: "No upcoming auctions currently"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     hourlyAuctionId:
 *                       type: string
 *                       example: "9be58e75-ab01-45fa-bf5a-7dd6340afd82"
 *                     hourlyAuctionCode:
 *                       type: string
 *                       example: "HA000001"
 *                     auctionName:
 *                       type: string
 *                       example: "SMART WATCH"
 *                     prizeValue:
 *                       type: number
 *                       example: 10000
 *                     imageUrl:
 *                       type: string
 *                       example: "https://example.com/product.jpg"
 *                     productImages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           imageUrl:
 *                             type: string
 *                           description:
 *                             type: string
 *                     TimeSlot:
 *                       type: string
 *                       example: "12:00"
 *                     auctionDate:
 *                       type: string
 *                       format: date-time
 *                     Status:
 *                       type: string
 *                       example: "UPCOMING"
 *                     EntryFee:
 *                       type: number
 *                       example: 100
 *       500:
 *         description: Internal server error
 */
router.get('/first-upcoming-product', getFirstUpcomingProduct);

/**
 * @swagger
 * /scheduler/sync-master-to-auctions:
 *   post:
 *     summary: Sync master auction changes to daily and hourly auctions
 *     description: |
 *       Syncs product images, image URL, auction name, prize value, and other config changes
 *       from master auction to existing daily and hourly auctions.
 *       
 *       **Use this endpoint after:**
 *       - Updating product images in admin page
 *       - Changing auction name, prize value, or other config in master auction
 *       - Any master auction config changes that need to reflect in today's auctions
 *       
 *       **What it syncs:**
 *       - productImages (array of images with descriptions)
 *       - imageUrl (main product image)
 *       - auctionName
 *       - prizeValue
 *       - maxDiscount
 *       
 *       **Important:**
 *       - Only syncs to active daily auctions for today or future dates
 *       - Does NOT disturb other values like participants, bids, rounds, status
 *       - Matches auctions by auctionNumber
 *     tags: [Scheduler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - masterId
 *             properties:
 *               masterId:
 *                 type: string
 *                 description: UUID of the master auction to sync from
 *                 example: "b336ea64-b9b1-4abb-9027-5bbbaa02a876"
 *     responses:
 *       200:
 *         description: Master auction changes synced successfully
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
 *                   example: "Master auction changes synced to daily and hourly auctions successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     masterId:
 *                       type: string
 *                       example: "b336ea64-b9b1-4abb-9027-5bbbaa02a876"
 *                     dailyAuctionId:
 *                       type: string
 *                       example: "641ba475-0756-4cf0-bc11-1358b4373c9c"
 *                     dailyAuctionUpdated:
 *                       type: boolean
 *                       example: true
 *                     hourlyAuctionsUpdated:
 *                       type: number
 *                       example: 13
 *                     configsUpdated:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           auctionNumber:
 *                             type: number
 *                             example: 1
 *                           auctionName:
 *                             type: string
 *                             example: "SMART WATCH"
 *                           productImagesCount:
 *                             type: number
 *                             example: 3
 *       400:
 *         description: Missing masterId parameter
 *       404:
 *         description: Master auction or daily auction not found
 *       500:
 *         description: Internal server error
 */
router.post('/sync-master-to-auctions', syncMasterToAuctions);

/**
 * @swagger
 * /scheduler/recalculate-user-stats:
 *   post:
 *     summary: Recalculate auction history stats for ALL users from raw auction data
 *     description: |
 *       Finds ALL distinct users in AuctionHistory and recalculates their stats fresh
 *       by reading each HourlyAuction they participated in. No parameters required.
 *       
 *       **Stats count ALL auction entries** (including IN_PROGRESS), not just COMPLETED.
 *       
 *       **What it recalculates per auction entry:**
 *       - `totalAmountBid` - Sum of actual bids from rounds playersData
 *       - `roundsParticipated` - Count of rounds where user placed a bid
 *       - `totalBidsPlaced` - Count of bids placed across all rounds
 *       - `totalParticipants` - From auction participants array
 *       - `totalAmountSpent` - entryFee + lastRoundBidAmount (only if won AND claimed)
 *       - `isEliminated` / `eliminatedInRound` - From round qualification data
 *       - `lastRoundBidAmount` - From last round's actual bid data
 *       
 *       **What it aggregates per user (stats):**
 *       - `totalAuctions` - Count of ALL auctions (including IN_PROGRESS)
 *       - `totalWins` - Count of completed auctions won
 *       - `totalLosses` - Count of completed auctions lost
 *       - `totalInProgress` - Count of IN_PROGRESS/JOINED auctions
 *       - `totalSpent` - Sum of all entry fees + final round bids for claimed wins
 *       - `totalWon` - Sum of prize amounts for claimed wins only
 *       - `totalClaimed` - Count of prizes claimed
 *       - `winRate` - Win percentage (wins / total auctions)
 *       - `netGain` - totalWon - totalSpent
 *       
 *       **What it syncs to each User profile:**
 *       - totalAuctions, totalWins, totalLosses, totalAmountSpent, totalAmountWon, winRate, netGain
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Stats recalculated and synced for all users
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
 *                   example: "Recalculated stats for 5 users (42 total entries) and synced to user profiles"
 *                 totalUsers:
 *                   type: number
 *                   example: 5
 *                 totalEntriesUpdated:
 *                   type: number
 *                   example: 42
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       username:
 *                         type: string
 *                       entriesRecalculated:
 *                         type: number
 *                       stats:
 *                         type: object
 *                         properties:
 *                           totalAuctions:
 *                             type: number
 *                           totalWins:
 *                             type: number
 *                           totalLosses:
 *                             type: number
 *                           totalInProgress:
 *                             type: number
 *                           totalSpent:
 *                             type: number
 *                           totalWon:
 *                             type: number
 *                           totalClaimed:
 *                             type: number
 *                           winRate:
 *                             type: number
 *                           netGain:
 *                             type: number
 *                       userProfile:
 *                         type: object
 *                         properties:
 *                           totalAuctions:
 *                             type: number
 *                           totalWins:
 *                             type: number
 *                           totalLosses:
 *                             type: number
 *                           totalAmountSpent:
 *                             type: number
 *                           totalAmountWon:
 *                             type: number
 *                           winRate:
 *                             type: number
 *                           netGain:
 *                             type: number
 *       404:
 *         description: No auction history found
 *       500:
 *         description: Internal server error
 */
router.post('/recalculate-user-stats', recalculateUserStats);

module.exports = router;