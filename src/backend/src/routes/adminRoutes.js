// src/routes/adminRoutes.js 
const express = require('express');
const router = express.Router();
const {
  adminLogin,
  sendAdminSignupOtp,
  adminSignup,
  getUserStatistics,
  getAllUsersAdmin,
  getAllMasterAuctionsWithConfig,
  createMasterAuctionAdmin,
  getAllMasterAuctionsAdmin,
  updateMasterAuctionAdmin,
  deleteMasterAuctionAdmin,
  deleteDailyAuctionSlot,
  getPushSubscriptionStats,
  deletePushSubscriptionAdmin,
  getAnalyticsData,
  updateUserSuperAdminStatus,
  setSuperAdminByEmail,
} = require('../controllers/adminController');

const {
  refreshWoohooProducts,
  getDbProducts,
  getEligibleWinners,
  sendVoucher,
  getIssuedVouchers,
  getWoohooBalance,
  getWoohooTransactions,
  getWoohooCategories,
  getWoohooProducts,
  getWoohooProductDetails,
  getWoohooOrderStatus,
  getWoohooOrderCards,
  resendVoucherEmail,
  syncVoucherStatus
} = require('../controllers/adminVoucherController');

const {
  getSmsTemplates,
  getSmsBalance,
  getUsersForSms,
  getRecentAuctions,
  sendSmsToUsers,
  sendBulkSmsToFilter,
  getFilterStats,
  getRestTemplates,
  createRestTemplate,
  deleteRestTemplate,
  getSenderIds,
  getSmsReports,
  getSmsStatus,
} = require('../controllers/adminSmsController');

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
 *
 *     SmsTemplate:
 *       type: object
 *       properties:
 *         TemplateId:
 *           type: string
 *           example: "100"
 *         TemplateName:
 *           type: string
 *           example: "Welcome Template"
 *         Message:
 *           type: string
 *           example: "Welcome to Dream60! Your OTP is {otp}"
 *         CreatedDate:
 *           type: string
 *           format: date-time
 *
 *     SmsSenderId:
 *       type: object
 *       properties:
 *         SenderId:
 *           type: string
 *           example: "FINPGS"
 *         Status:
 *           type: string
 *           example: "Active"
 *
 *     SmsSendRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         userIds:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user IDs to send SMS to
 *         mobileNumbers:
 *           type: array
 *           items:
 *             type: string
 *           description: List of mobile numbers to send SMS to
 *         message:
 *           type: string
 *           description: Custom message to send
 *         templateKey:
 *           type: string
 *           description: Template key (internal or rest_ID)
 *         senderId:
 *           type: string
 *           description: Sender ID to use
 *
 *     SmsBulkSendRequest:
 *       type: object
 *       required:
 *         - filter
 *         - message
 *       properties:
 *         filter:
 *           type: string
 *           enum: [all, active_players, winners, never_played]
 *         message:
 *           type: string
 *         templateKey:
 *           type: string
 *         senderId:
 *           type: string
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

router.post('/send-signup-otp', sendAdminSignupOtp);

router.post('/signup', adminSignup);

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

/**
 * @swagger
 * /admin/master-auctions/{master_id}/slots/{auction_number}:
 *   delete:
 *     summary: DELETE AUCTION SLOT (ADMIN)
 *     description: Delete a specific auction slot from master auction's dailyAuctionConfig (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: master_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Master auction ID
 *       - name: auction_number
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         description: Auction number to delete
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Auction slot deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       404:
 *         description: Master auction or auction slot not found
 *       500:
 *         description: Server error
 */
router.delete('/master-auctions/:master_id/slots/:auction_number', deleteDailyAuctionSlot);

/**
 * @swagger
 * /admin/push-subscriptions:
 *   get:
 *     summary: GET PUSH SUBSCRIPTION STATISTICS (ADMIN)
 *     description: Get statistics about PWA vs Web push notification subscriptions (requires admin user_id)
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
 *         description: Push subscription statistics retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalActive:
 *                           type: number
 *                           example: 150
 *                         totalInactive:
 *                           type: number
 *                           example: 25
 *                         pwaCount:
 *                           type: number
 *                           example: 80
 *                         webCount:
 *                           type: number
 *                           example: 70
 *                     pwaUsers:
 *                       type: array
 *                       description: List of users with PWA subscriptions
 *                       items:
 *                         type: object
 *                         properties:
 *                           subscriptionId:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           deviceType:
 *                             type: string
 *                             example: PWA
 *                     webUsers:
 *                       type: array
 *                       description: List of users with Web subscriptions
 *                       items:
 *                         type: object
 *                         properties:
 *                           subscriptionId:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           deviceType:
 *                             type: string
 *                             example: Web
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/push-subscriptions', getPushSubscriptionStats);
router.delete('/push-subscriptions/:subscriptionId', deletePushSubscriptionAdmin);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: GET ANALYTICS DATA (ADMIN)
 *     description: Get comprehensive analytics for daily auction activity with date filtering (requires admin user_id)
 *     tags: [Admin]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *       - name: date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to get analytics for (YYYY-MM-DD format). Defaults to today.
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/analytics', getAnalyticsData);

router.put('/users/super-admin', updateUserSuperAdminStatus);

router.post('/set-super-admin', setSuperAdminByEmail);

// Voucher Management Routes
/**
 * @swagger
 * tags:
 *   - name: Voucher Management
 *     description: Woohoo voucher management APIs for admin panel
 */

/**
 * @swagger
 * /admin/vouchers/eligible-winners:
 *   get:
 *     summary: GET ELIGIBLE WINNERS FOR VOUCHER
 *     description: Get list of winners who have claimed their prize and paid, eligible for voucher distribution
 *     tags: [Voucher Management]
 *     responses:
 *       200:
 *         description: Eligible winners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       hourlyAuctionId:
 *                         type: string
 *                       prizeClaimStatus:
 *                         type: string
 *                         example: "CLAIMED"
 *                       remainingFeesPaid:
 *                         type: boolean
 *                         example: true
 *                       userEmail:
 *                         type: string
 *                       userMobile:
 *                         type: string
 *                       userName:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/vouchers/eligible-winners', getEligibleWinners);

/**
 * @swagger
 * /admin/vouchers/send:
 *   post:
 *     summary: SEND VOUCHER TO WINNER
 *     description: Send a Woohoo gift voucher to a winner via the Woohoo API
 *     tags: [Voucher Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - claimId
 *               - sku
 *               - amount
 *             properties:
 *               claimId:
 *                 type: string
 *                 description: The claim ID from AuctionHistory
 *                 example: "507f1f77bcf86cd799439011"
   *               sku:
   *                 type: string
   *                 description: Woohoo product SKU (e.g., Amazon gift card SKU)
   *                 example: "CNPIN"
   *               amount:
   *                 type: number
   *                 description: Voucher amount in INR
   *                 example: 10
   *     responses:
   *       200:
   *         description: Voucher order placed successfully
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
   *                   example: "Voucher order placed successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     _id:
   *                       type: string
   *                     woohooOrderId:
   *                       type: string
   *                       example: "3182427590"
   *                     status:
   *                       type: string
   *                       enum: [processing, complete, failed]
 *       400:
 *         description: Missing required fields or voucher already issued
 *       404:
 *         description: Winner or user not found
 *       500:
 *         description: Woohoo API error
 */
router.post('/vouchers/send', sendVoucher);

/**
 * @swagger
 * /admin/vouchers/issued:
 *   get:
 *     summary: GET ALL ISSUED VOUCHERS
 *     description: Get list of all vouchers that have been issued
 *     tags: [Voucher Management]
 *     responses:
 *       200:
 *         description: Issued vouchers retrieved successfully
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       claimId:
 *                         type: string
 *                       woohooOrderId:
 *                         type: string
 *                       sku:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [processing, complete, failed]
 *                       cardNumber:
 *                         type: string
 *                       cardPin:
 *                         type: string
 *                       expiry:
 *                         type: string
 *                         format: date-time
 *                       sentToUser:
 *                         type: boolean
 *                       userName:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/vouchers/issued', getIssuedVouchers);

/**
 * @swagger
 * /admin/vouchers/woohoo-balance:
 *   get:
 *     summary: GET WOOHOO ACCOUNT BALANCE
 *     description: Get the current SVC (Stored Value Card) balance from Woohoo
 *     tags: [Voucher Management]
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
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
 *                   description: Woohoo account balance data
 *       500:
 *         description: Woohoo API error
 */
router.get('/vouchers/woohoo-balance', getWoohooBalance);

/**
 * @swagger
 * /admin/vouchers/woohoo-transactions:
 *   get:
 *     summary: GET WOOHOO TRANSACTION HISTORY
 *     description: Get transaction history from Woohoo API
 *     tags: [Voucher Management]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                   description: List of Woohoo transactions
 *       500:
 *         description: Woohoo API error
 */
router.get('/vouchers/woohoo-transactions', getWoohooTransactions);
router.get('/vouchers/refresh-products', refreshWoohooProducts);
router.get('/vouchers/db-products', getDbProducts);

/**
 * @swagger
 * /admin/vouchers/woohoo-categories:
 *   get:
 *     summary: GET WOOHOO PRODUCT CATEGORIES
 *     description: Get all available gift card categories from Woohoo
 *     tags: [Voucher Management]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Woohoo API error
 */
router.get('/vouchers/woohoo-categories', getWoohooCategories);

/**
 * @swagger
 * /admin/vouchers/woohoo-products/{categoryId}:
 *   get:
 *     summary: GET PRODUCTS BY CATEGORY
 *     description: Get all products (gift cards) in a specific Woohoo category
 *     tags: [Voucher Management]
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Woohoo category ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                     properties:
 *                       sku:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: object
 *                       images:
 *                         type: array
 *       400:
 *         description: Category ID is required
 *       500:
 *         description: Woohoo API error
 */
router.get('/vouchers/woohoo-products/:categoryId', getWoohooProducts);

/**
 * @swagger
 * /admin/vouchers/woohoo-product/{sku}:
 *   get:
 *     summary: GET PRODUCT DETAILS BY SKU
 *     description: Get detailed information about a specific Woohoo product
 *     tags: [Voucher Management]
 *     parameters:
 *       - name: sku
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product SKU
 *         example: "AMAZON_GC"
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
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
 *                     sku:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: object
 *                     images:
 *                       type: array
 *       400:
 *         description: SKU is required
 *       500:
 *         description: Woohoo API error
 */
router.get('/vouchers/woohoo-product/:sku', getWoohooProductDetails);

/**
 * @swagger
 * /admin/vouchers/woohoo-order-status/{orderId}:
 *   get:
 *     summary: GET WOOHOO ORDER STATUS
 *     description: Get the current status of a Woohoo order
 *     tags: [Voucher Management]
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Woohoo order ID
 *     responses:
 *       200:
 *         description: Order status retrieved successfully
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
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PROCESSING, COMPLETE, FAILED]
 *       400:
 *         description: Order ID is required
 *       500:
 *         description: Woohoo API error
 */
router.get('/vouchers/woohoo-order-status/:orderId', getWoohooOrderStatus);

/**
 * @swagger
 * /admin/vouchers/woohoo-order-cards/{orderId}:
 *   get:
 *     summary: GET ACTIVATED CARDS FOR ORDER
 *     description: Get the activated gift card details for a completed Woohoo order
 *     tags: [Voucher Management]
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Woohoo order ID
 *     responses:
 *       200:
 *         description: Card details retrieved successfully
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
 *                     properties:
 *                       cardNumber:
 *                         type: string
 *                       cardPin:
 *                         type: string
 *                       expiry:
 *                         type: string
 *                         format: date-time
 *                       activationUrl:
 *                         type: string
 *       400:
 *         description: Order ID is required
 *       500:
 *         description: Woohoo API error
 */
router.get('/vouchers/woohoo-order-cards/:orderId', getWoohooOrderCards);

/**
 * @swagger
 * /admin/vouchers/{voucherId}/resend-email:
 *   post:
 *     summary: RESEND VOUCHER EMAIL
 *     description: Resend the voucher details email to the winner
 *     tags: [Voucher Management]
 *     parameters:
 *       - name: voucherId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher ID from database
 *     responses:
 *       200:
 *         description: Email sent successfully
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
 *                   example: "Voucher email sent successfully"
 *       400:
 *         description: Voucher ID is required or voucher not complete
 *       404:
 *         description: Voucher or user not found
 *       500:
 *         description: Email sending error
 */
router.post('/vouchers/:voucherId/resend-email', resendVoucherEmail);

/**
 * @swagger
 * /admin/vouchers/{voucherId}/sync:
 *   post:
 *     summary: SYNC VOUCHER STATUS WITH WOOHOO
 *     description: Sync the local voucher status with Woohoo API and update card details if order is complete
 *     tags: [Voucher Management]
 *     parameters:
 *       - name: voucherId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher ID from database
 *     responses:
 *       200:
 *         description: Voucher status synced successfully
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
 *                   example: "Voucher status synced successfully"
 *                 data:
 *                   type: object
 *                   description: Updated voucher data
 *       400:
 *         description: Voucher ID is required
 *       404:
 *         description: Voucher not found
 *       500:
 *         description: Sync error
 */
router.post('/vouchers/:voucherId/sync', syncVoucherStatus);

/**
 * @swagger
 * tags:
 *   - name: SMS Management
 *     description: SMS Country and internal SMS management APIs
 */

/**
 * @swagger
 * /admin/sms/rest/templates:
 *   get:
 *     summary: GET REST TEMPLATES
 *     description: Get all SMS templates from SMS Country account
 *     tags: [SMS Management]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SmsTemplate'
 *   post:
 *     summary: CREATE REST TEMPLATE
 *     description: Create a new SMS template in SMS Country account
 *     tags: [SMS Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateName, message]
 *             properties:
 *               user_id:
 *                 type: string
 *               templateName:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template created successfully
 */
router.get('/sms/rest/templates', getRestTemplates);
router.post('/sms/rest/templates', createRestTemplate);

/**
 * @swagger
 * /admin/sms/rest/templates/{templateId}:
 *   delete:
 *     summary: DELETE REST TEMPLATE
 *     description: Delete an SMS template from SMS Country account
 *     tags: [SMS Management]
 *     parameters:
 *       - name: templateId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 */
router.delete('/sms/rest/templates/:templateId', deleteRestTemplate);

/**
 * @swagger
 * /admin/sms/rest/sender-ids:
 *   get:
 *     summary: GET SENDER IDS
 *     description: Get all approved Sender IDs from SMS Country account
 *     tags: [SMS Management]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sender IDs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SmsSenderId'
 */
router.get('/sms/rest/sender-ids', getSenderIds);

/**
 * @swagger
 * /admin/sms/rest/reports:
 *   get:
 *     summary: GET SMS REPORTS
 *     description: Get detailed SMS delivery reports from SMS Country
 *     tags: [SMS Management]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: fromDate
 *         in: query
 *         schema:
 *           type: string
 *       - name: toDate
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 */
router.get('/sms/rest/reports', getSmsReports);

/**
 * @swagger
 * /admin/sms/rest/status/{messageId}:
 *   get:
 *     summary: GET SMS STATUS
 *     description: Get status of a specific SMS message
 *     tags: [SMS Management]
 *     parameters:
 *       - name: messageId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 */
router.get('/sms/rest/status/:messageId', getSmsStatus);

/**
 * @swagger
 * /admin/sms/send:
 *   post:
 *     summary: SEND SMS
 *     description: Send custom or template-based SMS to specific users or mobile numbers
 *     tags: [SMS Management]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SmsSendRequest'
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *       403:
 *         description: Admin access required
 */
router.post('/sms/send', sendSmsToUsers);

/**
 * @swagger
 * /admin/sms/send-bulk:
 *   post:
 *     summary: SEND BULK SMS
 *     description: Send bulk SMS to users matching a specific filter
 *     tags: [SMS Management]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SmsBulkSendRequest'
 *     responses:
 *       200:
 *         description: Bulk SMS sent successfully
 *       403:
 *         description: Admin access required
 */
router.post('/sms/send-bulk', sendBulkSmsToFilter);

router.get('/sms/templates', getSmsTemplates);
router.get('/sms/balance', getSmsBalance);
router.get('/sms/users', getUsersForSms);
router.get('/sms/auctions', getRecentAuctions);
router.get('/sms/filter-stats', getFilterStats);

module.exports = router;
