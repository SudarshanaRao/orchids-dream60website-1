// src/routes/adminRoutes.js 
const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getUserStatistics,
  getAllUsersAdmin,
  getAllMasterAuctionsWithConfig,
  createMasterAuctionAdmin,
  getAllMasterAuctionsAdmin,
  updateMasterAuctionAdmin,
  deleteMasterAuctionAdmin,
} = require('../controllers/adminController');

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin panel APIs for managing Dream60 platform
 *
 * components:
 *   schemas:
 *     AdminLoginRequest:
 *       type: object
 *       required:
 *         - identifier
 *         - password
 *       properties:
 *         identifier:
 *           type: string
 *           example: "dream60@gmail.com"
 *         password:
 *           type: string
 *           example: "Dharsh@2003"
 *
 *     AdminLoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Admin login successful"
 *         user:
 *           type: object
 *           properties:
 *             user_id:
 *               type: string
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             userType:
 *               type: string
 *               example: "ADMIN"
 *
 *     UserStatistics:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalUsers:
 *               type: number
 *             activeUsers:
 *               type: number
 *             deletedUsers:
 *               type: number
 *             adminUsers:
 *               type: number
 *         activity:
 *           type: object
 *           properties:
 *             totalAuctions:
 *               type: number
 *             totalWins:
 *               type: number
 *             totalAmountSpent:
 *               type: number
 *             totalAmountWon:
 *               type: number
 *
 *     RoundConfig:
 *       type: object
 *       required:
 *         - round
 *         - duration
 *         - roundCutoffPercentage
 *         - topBidAmountsPerRound
 *       properties:
 *         round:
 *           type: number
 *           example: 1
 *           description: Round number
 *         duration:
 *           type: number
 *           example: 15
 *           description: Duration in minutes
 *         roundCutoffPercentage:
 *           type: number
 *           example: 40
 *           description: Percentage of players to eliminate
 *         topBidAmountsPerRound:
 *           type: number
 *           example: 3
 *           description: Number of top bids to display
 *
 *     DailyAuctionConfig:
 *       type: object
 *       required:
 *         - auctionNumber
 *         - TimeSlot
 *         - auctionName
 *         - prizeValue
 *         - Status
 *         - maxDiscount
 *         - EntryFee
 *         - minEntryFee
 *         - maxEntryFee
 *         - roundCount
 *         - roundConfig
 *       properties:
 *         auctionNumber:
 *           type: number
 *           example: 1
 *           description: Sequential auction number for the day
 *         TimeSlot:
 *           type: string
 *           example: "12:00"
 *           description: Time slot for the auction (HH:MM format)
 *         auctionName:
 *           type: string
 *           example: "iPhone 14 Pro"
 *           description: Name of the auction item
 *         imageUrl:
 *           type: string
 *           example: "https://example.com/image.jpg"
 *           description: URL of the auction item image
 *         prizeValue:
 *           type: number
 *           example: 65000
 *           description: Value of the prize in rupees
 *         Status:
 *           type: string
 *           enum: [UPCOMING, LIVE, COMPLETED, CANCELLED]
 *           example: "UPCOMING"
 *           description: Current status of the auction
 *         maxDiscount:
 *           type: number
 *           example: 10
 *           description: Maximum discount percentage
 *         EntryFee:
 *           type: string
 *           enum: [RANDOM, MANUAL]
 *           example: "RANDOM"
 *           description: Entry fee type
 *         minEntryFee:
 *           type: number
 *           example: 20
 *           description: Minimum entry fee in rupees
 *         maxEntryFee:
 *           type: number
 *           example: 80
 *           description: Maximum entry fee in rupees
 *         roundCount:
 *           type: number
 *           example: 4
 *           description: Total number of rounds
 *         roundConfig:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoundConfig'
 *           description: Configuration for each round
 *
 *     MasterAuctionRequest:
 *       type: object
 *       required:
 *         - totalAuctionsPerDay
 *         - dailyAuctionConfig
 *       properties:
 *         totalAuctionsPerDay:
 *           type: number
 *           example: 10
 *           description: Total number of auctions per day (1-24)
 *         isActive:
 *           type: boolean
 *           example: true
 *           description: Whether this master auction is active
 *         dailyAuctionConfig:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DailyAuctionConfig'
 *           description: Array of daily auction configurations
 *
 *     MasterAuctionUpdateRequest:
 *       type: object
 *       properties:
 *         totalAuctionsPerDay:
 *           type: number
 *           example: 10
 *           description: Total number of auctions per day (1-24)
 *         isActive:
 *           type: boolean
 *           example: true
 *           description: Whether this master auction is active
 *         dailyAuctionConfig:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DailyAuctionConfig'
 *           description: Array of daily auction configurations
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: ADMIN LOGIN
 *     description: Login with hardcoded admin credentials (dream60@gmail.com / Dharsh@2003)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginRequest'
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLoginResponse'
 *       401:
 *         description: Invalid admin credentials
 *       500:
 *         description: Server error
 */
router.post('/login', adminLogin);

/**
 * @swagger
 * /admin/statistics:
 *   get:
 *     summary: GET USER STATISTICS
 *     description: Get comprehensive user statistics for admin dashboard (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserStatistics'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/statistics', getUserStatistics);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: GET ALL USERS (ADMIN)
 *     description: Get detailed list of all users with pagination (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: includeDeleted
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/users', getAllUsersAdmin);

/**
 * @swagger
 * /admin/master-auctions:
 *   get:
 *     summary: GET ALL MASTER AUCTIONS (ADMIN)
 *     description: Get all master auctions with pagination (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Master auctions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 *   post:
 *     summary: CREATE MASTER AUCTION (ADMIN)
 *     description: Create a new master auction (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterAuctionRequest'
 *     responses:
 *       201:
 *         description: Master auction created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/master-auctions', getAllMasterAuctionsAdmin);
router.post('/master-auctions', createMasterAuctionAdmin);

/**
 * @swagger
 * /admin/master-auctions/all-with-config:
 *   get:
 *     summary: GET ALL AUCTIONS WITH DAILY CONFIG (ADMIN)
 *     description: Returns all daily auction configs from all active master auctions. No parameters required. Sorted by time slot.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: All auction configs retrieved successfully
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
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/master-auctions/all-with-config', getAllMasterAuctionsWithConfig);

/**
 * @swagger
 * /admin/master-auctions/{master_id}:
 *   put:
 *     summary: UPDATE MASTER AUCTION (ADMIN)
 *     description: Update an existing master auction with complete configuration (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: master_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Master auction ID to update
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterAuctionUpdateRequest'
 *           example:
 *             totalAuctionsPerDay: 10
 *             isActive: true
 *             dailyAuctionConfig:
 *               - auctionNumber: 1
 *                 TimeSlot: "12:00"
 *                 auctionName: "iPhone 14 Pro"
 *                 imageUrl: "https://example.com/iphone.jpg"
 *                 prizeValue: 65000
 *                 Status: "UPCOMING"
 *                 maxDiscount: 10
 *                 EntryFee: "RANDOM"
 *                 minEntryFee: 20
 *                 maxEntryFee: 80
 *                 roundCount: 4
 *                 roundConfig:
 *                   - round: 1
 *                     duration: 15
 *                     roundCutoffPercentage: 40
 *                     topBidAmountsPerRound: 3
 *     responses:
 *       200:
 *         description: Master auction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       404:
 *         description: Master auction not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: DELETE MASTER AUCTION (ADMIN)
 *     description: Delete a master auction (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: master_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Master auction deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       404:
 *         description: Master auction not found
 *       500:
 *         description: Server error
 */
router.put('/master-auctions/:master_id', updateMasterAuctionAdmin);
router.delete('/master-auctions/:master_id', deleteMasterAuctionAdmin);

module.exports = router;