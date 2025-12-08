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
 *           type: object
 */
/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: GET ALL USERS
 *     description: Returns all non-deleted users. No parameters required.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: GET CURRENT USER'S FULL DETAILS.
 *     description: Provide `user_id` as a **query** parameter or in the request body to fetch user details.
 *     tags: [Users]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID (user_id)
 *     responses:
 *       200:
 *         description: Successful fetch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
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
 *     summary: GET CURRENT USER'S PROFILE INFO.
 *     description: Provide `user_id` as a **query** parameter or in the request body to fetch user profile.
 *     tags: [Users]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID (user_id)
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
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
 *     summary: UPDATE USER NOTIFICATIONS PREFERENCES
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *               emailNotifications:
 *                 type: boolean
 *               smsNotifications:
 *                 type: boolean
 *               bidAlerts:
 *                 type: boolean
 *               winNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *     summary: SOFT DELETE USER ACCOUNT
 *     tags: [Users]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID (user_id)
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *     summary: UPDATE USER'S MOBILE OR EMAIL
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMobileRequest'
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
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: User not found
 *       409:
 *         description: Mobile number or email already in use
 */
router.put('/updateUserDetails', ensureUserId, updateMobile);

module.exports = router;
