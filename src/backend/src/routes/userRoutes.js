// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getMe,
  getProfile,
  updatePreferences,
  deleteMe,
  updateMobile,
  syncAllUserStats,
} = require('../controllers/userController');

/**
 * NOTE:
 * - Controllers accept user_id from query, body, params or header (X-User-Id).
 * - For convenience the routes below will enforce user_id presence (either in query, body, params or header). 
 */

/**
 * tiny middleware: ensure user_id exists (in query OR body OR params OR X-User-Id header)
 */
const ensureUserId = (req, res, next) => {
  const userId =
    (req.query && req.query.user_id) ||
    (req.body && req.body.user_id) ||
    (req.params && req.params.user_id) ||
    (req.headers && (req.headers['x-user-id'] || req.headers['x_user_id']));

  if (!userId) {
    return res.status(400).json({
      success: false,
      message:
        'user_id is required. Provide it as query param, request body, url param, or X-User-Id header',
    });
  }

  req.resolvedUserId = userId;
  next();
};

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User account management APIs
 *
 * components:
 *   schemas:
 *     UserStats:
 *       type: object
 *       properties:
 *         totalAuctions:
 *           type: number
 *           example: 14
 *           description: Total auctions participated in
 *         totalWins:
 *           type: number
 *           example: 11
 *           description: Number of auctions won
 *         totalLosses:
 *           type: number
 *           example: 3
 *           description: Number of auctions lost
 *         totalSpent:
 *           type: number
 *           example: 36197
 *           description: Total amount spent on auctions
 *         totalWon:
 *           type: number
 *           example: 110000
 *           description: Total prize money won
 *         winRate:
 *           type: number
 *           example: 79
 *           description: Win percentage
 *         netGain:
 *           type: number
 *           example: 73803
 *           description: Total won minus total spent
 *
 *     UserPreferences:
 *       type: object
 *       properties:
 *         emailNotifications:
 *           type: boolean
 *           example: true
 *           description: Enable/disable email notifications
 *         smsNotifications:
 *           type: boolean
 *           example: true
 *           description: Enable/disable SMS notifications
 *         bidAlerts:
 *           type: boolean
 *           example: true
 *           description: Enable/disable bid alerts
 *         winNotifications:
 *           type: boolean
 *           example: true
 *           description: Enable/disable win notifications
 *
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 64e91cf5c13e5b6ff230e2ad
 *         user_id:
 *           type: string
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d479
 *         username:
 *           type: string
 *           example: dream_user
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           example: "user@dream60.com"
 *         preferences:
 *           $ref: '#/components/schemas/UserPreferences'
 *         stats:
 *           $ref: '#/components/schemas/UserStats'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-20T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-26T14:30:00.000Z"
 *
 *     UpdatePreferencesRequest:
 *       type: object
 *       required:
 *         - user_id
 *       properties:
 *         user_id:
 *           type: string
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         emailNotifications:
 *           type: boolean
 *           example: true
 *         smsNotifications:
 *           type: boolean
 *           example: false
 *         bidAlerts:
 *           type: boolean
 *           example: true
 *         winNotifications:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users
 *     description: |
 *       Returns all non-deleted users in the system.
 *       No authentication or parameters required.
 *       
 *       **Use this endpoint to:**
 *       - Get list of all users
 *       - Admin user management
 *       - User search and filtering
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               data:
 *                 - user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                   username: "player1"
 *                   mobile: "9876543210"
 *                   email: "player1@dream60.com"
 *                   preferences:
 *                     emailNotifications: true
 *                     smsNotifications: true
 *                     bidAlerts: true
 *                     winNotifications: true
 *                   stats:
 *                     totalAuctions: 14
 *                     totalWins: 11
 *                     totalLosses: 3
 *                     totalSpent: 36197
 *                     totalWon: 110000
 *                     winRate: 79
 *                     netGain: 73803
 *       500:
 *         description: Server error
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user full details
 *     description: |
 *       Fetches complete user details including profile information and statistics.
 *       Provide `user_id` as a query parameter, request body, URL param, or X-User-Id header.
 *       
 *       **What it returns:**
 *       - User profile (username, email, mobile)
 *       - User preferences (notification settings)
 *       - User statistics (auctions, wins, losses, spending, earnings)
 *       - Account metadata (creation date, last updated)
 *       
 *       **Use this endpoint to:**
 *       - Display user profile page
 *       - Show user dashboard with stats
 *       - Update UI with latest user information
 *       - Sync user data after login
 *     tags: [Users]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID (user_id)
 *         example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               user:
 *                 user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                 username: "asha"
 *                 mobile: "9876543210"
 *                 email: "asha@dream60.com"
 *                 preferences:
 *                   emailNotifications: true
 *                   smsNotifications: true
 *                   bidAlerts: true
 *                   winNotifications: true
 *                 stats:
 *                   totalAuctions: 14
 *                   totalWins: 11
 *                   totalLosses: 3
 *                   totalSpent: 36197
 *                   totalWon: 110000
 *                   winRate: 79
 *                   netGain: 73803
 *                 createdAt: "2025-11-20T10:30:00.000Z"
 *                 updatedAt: "2025-11-26T14:30:00.000Z"
 *       400:
 *         description: Missing user_id
 *       404:
 *         description: User not found
 */
router.get('/me', ensureUserId, getMe);

/**
 * @swagger
 * /auth/me/profile:
 *   get:
 *     summary: Get current user profile info
 *     description: |
 *       Fetches user profile information (lighter version of /auth/me).
 *       Provide `user_id` as a query parameter, request body, URL param, or X-User-Id header.
 *       
 *       **Use this endpoint to:**
 *       - Quick profile lookup
 *       - Display user info in headers/navbars
 *       - User verification
 *     tags: [Users]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID (user_id)
 *         example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               user:
 *                 user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                 username: "asha"
 *                 mobile: "9876543210"
 *                 email: "asha@dream60.com"
 *       400:
 *         description: Missing user_id
 *       404:
 *         description: User not found
 */
router.get('/me/profile', ensureUserId, getProfile);

/**
 * @swagger
 * /auth/me/preferences:
 *   put:
 *     summary: Update user notification preferences
 *     description: |
 *       Updates user's notification preferences.
 *       All notification settings are optional - only provided fields will be updated.
 *       
 *       **Preference options available:**
 *       
 *       - emailNotifications - Receive email notifications
 *       - smsNotifications - Receive SMS notifications
 *       - bidAlerts - Get alerts when auction bids are placed
 *       - winNotifications - Get notified when you win auctions
 *       
 *       **Use this endpoint to:**
 *       - Allow users to customize their notification settings
 *       - Enable/disable specific notification channels
 *       - Update communication preferences
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePreferencesRequest'
 *           example:
 *             user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *             emailNotifications: true
 *             smsNotifications: false
 *             bidAlerts: true
 *             winNotifications: true
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *                   example: "Preferences updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Missing user_id or validation error
 *       404:
 *         description: User not found
 */
router.put('/me/preferences', ensureUserId, updatePreferences);

/**
 * @swagger
 * /auth/me:
 *   delete:
 *     summary: Soft delete user account
 *     description: |
 *       Performs a soft delete on user account (marks as deleted but doesn't remove from database).
 *       User data is retained for audit purposes but account becomes inaccessible.
 *       
 *       **What happens:**
 *       - Account is marked as deleted
 *       - User cannot login anymore
 *       - User data is retained for historical records
 *       - Auction history is preserved
 *       
 *       **Use this endpoint to:**
 *       - Allow users to delete their account
 *       - Implement GDPR compliance
 *       - Handle account closure requests
 *     tags: [Users]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID (user_id)
 *         example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: "Account deleted successfully"
 *       400:
 *         description: Missing user_id
 *       404:
 *         description: User not found
 */
router.delete('/me', ensureUserId, deleteMe);

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateMobileRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - isMobile
 *         - isEmail
 *         - identifier
 *       properties:
 *         user_id:
 *           type: string
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         isMobile:
 *           type: boolean
 *           example: true
 *           description: Set true to update mobile number
 *         isEmail:
 *           type: boolean
 *           example: false
 *           description: Set true to update email address
 *         identifier:
 *           type: string
 *           example: "9876543210"
 *           description: New mobile number or email address to update
 */

/**
 * @swagger
 * /auth/updateUserDetails:
 *   put:
 *     summary: Update user mobile or email
 *     description: |
 *       Updates user's mobile number or email address.
 *       Use flags to specify which field to update.
 *       
 *       **Requirements:**
 *       - Either isMobile or isEmail must be true (not both)
 *       - identifier must be valid mobile number (10 digits) or email format
 *       - Mobile/email must not already exist for another user
 *       
 *       **Use this endpoint to:**
 *       - Allow users to update contact information
 *       - Change mobile number after verification
 *       - Update email address
 *       - Maintain up-to-date user records
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMobileRequest'
 *           examples:
 *             updateMobile:
 *               summary: Update mobile number
 *               value:
 *                 user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                 isMobile: true
 *                 isEmail: false
 *                 identifier: "9876543210"
 *             updateEmail:
 *               summary: Update email address
 *               value:
 *                 user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                 isMobile: false
 *                 isEmail: true
 *                 identifier: "newemail@dream60.com"
 *     responses:
 *       200:
 *         description: Mobile number or email updated successfully
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
 *                   example: "Mobile number updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               message: "Mobile number updated successfully"
 *               user:
 *                 user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                 username: "asha"
 *                 mobile: "9876543210"
 *                 email: "asha@dream60.com"
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: User not found
 *       409:
 *         description: Mobile number or email already in use
 */
router.put('/updateUserDetails', ensureUserId, updateMobile);

/**
 * @swagger
 * /auth/sync-user-stats:
 *   post:
 *     summary: Sync all user statistics from auction history
 *     description: |
 *       Admin endpoint to sync user statistics (totalAuctions, totalWins, totalAmountSpent, totalAmountWon) 
 *       from AuctionHistory to User model for all users.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User stats synced successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Synced 50 users successfully"
 *               data:
 *                 totalUsers: 50
 *                 updated: 48
 *                 errors: 2
 *       500:
 *         description: Server error
 */
router.post('/sync-user-stats', syncAllUserStats);

module.exports = router;