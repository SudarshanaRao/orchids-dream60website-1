const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushNotificationController');

// Generate VAPID keys (run once)
router.post('/generate-vapid-keys', pushController.generateVAPIDKeys);

// Get VAPID public key
router.get('/vapid-public-key', pushController.getVAPIDPublicKey);

// Subscribe to push notifications
router.post('/subscribe', pushController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', pushController.unsubscribe);

// Send notification to specific user
router.post('/send-to-user', pushController.sendToUser);

// Send notification to all participants
router.post('/send-to-all', pushController.sendToAllParticipants);

module.exports = router;
