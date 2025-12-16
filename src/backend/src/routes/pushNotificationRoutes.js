const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushNotificationController');

/**
 * @swagger
 * tags:
 *   name: Push Notifications
 *   description: Web Push Notifications API for real-time user engagement
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PushSubscription:
 *       type: object
 *       required:
 *         - userId
 *         - subscription
 *       properties:
 *         userId:
 *           type: string
 *           description: User's MongoDB ObjectId
 *           example: "507f1f77bcf86cd799439011"
 *         subscription:
 *           type: object
 *           properties:
 *             endpoint:
 *               type: string
 *               description: Push service endpoint URL
 *               example: "https://fcm.googleapis.com/fcm/send/..."
 *             keys:
 *               type: object
 *               properties:
 *                 p256dh:
 *                   type: string
 *                   description: Public key for encryption
 *                 auth:
 *                   type: string
 *                   description: Authentication secret
 *     
 *     NotificationPayload:
 *       type: object
 *       required:
 *         - userId
 *         - title
 *         - body
 *       properties:
 *         userId:
 *           type: string
 *           description: Target user's MongoDB ObjectId
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: string
 *           description: Notification title
 *           example: "New Auction Starting!"
 *         body:
 *           type: string
 *           description: Notification message body
 *           example: "A new auction round is starting in 5 minutes"
 *         url:
 *           type: string
 *           description: Optional URL to navigate when notification is clicked
 *           example: "/auction/12345"
 *     
 *     BroadcastNotification:
 *       type: object
 *       required:
 *         - title
 *         - body
 *       properties:
 *         title:
 *           type: string
 *           description: Notification title
 *           example: "System Announcement"
 *         body:
 *           type: string
 *           description: Notification message body
 *           example: "Maintenance scheduled for tonight at 2 AM"
 *         url:
 *           type: string
 *           description: Optional URL to navigate when notification is clicked
 *           example: "/announcements"
 */

/**
 * @swagger
 * /push-notification/generate-vapid-keys:
 *   post:
 *     summary: Generate VAPID keys for push notifications
 *     description: Generates a new pair of VAPID (Voluntary Application Server Identification) keys. Run once and save to .env file.
 *     tags: [Push Notifications]
 *     responses:
 *       200:
 *         description: VAPID keys generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 vapidKeys:
 *                   type: object
 *                   properties:
 *                     publicKey:
 *                       type: string
 *                       description: Public VAPID key (share with client)
 *                     privateKey:
 *                       type: string
 *                       description: Private VAPID key (keep secret on server)
 *                 message:
 *                   type: string
 *                   example: "Add these keys to your .env file as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY"
 *       500:
 *         description: Failed to generate VAPID keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post('/generate-vapid-keys', pushController.generateVAPIDKeys);

/**
 * @swagger
 * /push-notification/vapid-public-key:
 *   get:
 *     summary: Get VAPID public key
 *     description: Retrieves the VAPID public key needed for client-side subscription
 *     tags: [Push Notifications]
 *     responses:
 *       200:
 *         description: VAPID public key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 publicKey:
 *                   type: string
 *                   description: VAPID public key
 *                   example: "BJjclSQIyTTACC-uR5mguO80S3yjeLcG21ZxbwbW1DtGOqEksCSXzoN1kQWcGtuiezNjOR65szY3mafhmyUWcUE"
 *       500:
 *         description: VAPID public key not configured
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "VAPID public key not configured"
 */
router.get('/vapid-public-key', pushController.getVAPIDPublicKey);

/**
 * @swagger
 * /push-notification/subscribe:
 *   post:
 *     summary: Subscribe user to push notifications
 *     description: Registers a user's device for receiving push notifications
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PushSubscription'
 *     responses:
 *       200:
 *         description: Successfully subscribed to push notifications
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
 *                   example: "Push subscription created successfully"
 *       400:
 *         description: Invalid request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User ID and subscription are required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 */
router.post('/subscribe', pushController.subscribe);

/**
 * @swagger
 * /push-notification/unsubscribe:
 *   post:
 *     summary: Unsubscribe from push notifications
 *     description: Deactivates a user's push notification subscription
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - endpoint
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User's MongoDB ObjectId
 *                 example: "507f1f77bcf86cd799439011"
 *               endpoint:
 *                 type: string
 *                 description: Push subscription endpoint to deactivate
 *                 example: "https://fcm.googleapis.com/fcm/send/..."
 *     responses:
 *       200:
 *         description: Successfully unsubscribed from push notifications
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
 *                   example: "Push subscription deactivated successfully"
 *       400:
 *         description: Invalid request - missing required fields
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.post('/unsubscribe', pushController.unsubscribe);

/**
 * @swagger
 * /push-notification/send-to-user:
 *   post:
 *     summary: Send push notification to specific user
 *     description: Sends a push notification to all active subscriptions of a specific user
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationPayload'
 *     responses:
 *       200:
 *         description: Notification sent successfully
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
 *                   example: "Notification sent to 2 out of 2 subscriptions"
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       endpoint:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: Invalid request - missing required fields
 *       404:
 *         description: No active subscriptions found for user
 *       500:
 *         description: Internal server error
 */
router.post('/send-to-user', pushController.sendToUser);

/**
 * @swagger
 * /push-notification/send-to-all:
 *   post:
 *     summary: Send push notification to all participants
 *     description: Broadcasts a push notification to all active subscribers
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BroadcastNotification'
 *     responses:
 *       200:
 *         description: Broadcast notification sent successfully
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
 *                   example: "Notification sent to 45 out of 50 subscribers"
 *                 totalSubscriptions:
 *                   type: integer
 *                   example: 50
 *                 successfulSends:
 *                   type: integer
 *                   example: 45
 *                 failedSends:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Invalid request - missing required fields
 *       404:
 *         description: No active subscriptions found
 *       500:
 *         description: Internal server error
 */
router.post('/send-to-all', pushController.sendToAllParticipants);

// Send to selected user IDs (admin-only preferred)
router.post('/send-to-selected', pushController.sendToSelectedUsers);

module.exports = router;