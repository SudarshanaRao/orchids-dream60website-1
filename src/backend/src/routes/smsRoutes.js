const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

/**
 * @swagger
 * /sms/send-otp:
 *   post:
 *     summary: Send OTP to a mobile number
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send-otp', smsController.sendOtp);

/**
 * @swagger
 * /sms/verify-otp:
 *   post:
 *     summary: Verify OTP for a mobile number
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *             properties:
 *               mobile:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', smsController.verifyOtp);

module.exports = router;
