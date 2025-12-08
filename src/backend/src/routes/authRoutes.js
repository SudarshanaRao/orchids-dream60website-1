// src/routes/authRoutes.js 
const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  updatePassword,
} = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User registration, login and password recovery
 *
 * components:
 *   schemas:
 *     SignupRequest:
 *       type: object
 *       required:
 *         - username
 *         - mobile
 *         - password
 *         - confirmPassword
 *       properties:
 *         username:
 *           type: string
 *           example: DreamPlayer
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         password:
 *           type: string
 *           example: Dream@123
 *         confirmPassword:
 *           type: string
 *           example: Dream@123
 *         email:
 *           type: string
 *           example: "user@example.com"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - identifier
 *         - password
 *       properties:
 *         identifier:
 *           type: string
 *           description: Can be a mobile number, email, or username.
 *           example: "purnakothapalli148@gmail.com"
 *         password:
 *           type: string
 *           description: User password.
 *           example: "Dream@123"
 *       description: Provide the identifier (mobile, email, or username) and the password to log in.
 *
 *     OTPRequest:
 *       type: object
 *       properties:
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           example: "user@dream60.com"
 *
 *     VerifyOtpRequest:
 *       type: object
 *       required:
 *         - otp
 *         - (mobile or email)
 *       properties:
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         otp:
 *           type: string
 *           example: "483251"
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - newPassword
 *         - (mobile or email)
 *       properties:
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         newPassword:
 *           type: string
 *           example: NewPass123
 *
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - oldPassword
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         user_id:
 *           type: string
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         oldPassword:
 *           type: string
 *           example: "OldPass123"
 *         newPassword:
 *           type: string
 *           example: "NewPass123"
 *         confirmPassword:
 *           type: string
 *           example: "NewPass123"
 *
 *     UserObject:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         username:
 *           type: string
 *           example: "Player123"
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         preferences:
 *           type: object
 *
 *     AuthSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login successful"
 *         user:
 *           $ref: '#/components/schemas/UserObject'
 *
 *     OTPResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "OTP generated"
 *         otp:
 *           type: string
 *           example: "483251"
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: REGISTER NEW USER
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         description: Validation error or missing fields
 *       409:
 *         description: Duplicate (username/mobile/email) conflict
 */
router.post('/signup', signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: LOGIN EXISTING USER
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful (returns user)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         description: User not found or invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: SEND OTP
 *     tags: [Authentication]
 *     description: Generates an OTP for the provided mobile or email. In development mode the OTP is returned in the response for testing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP generated (OTP returned in response for dev)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *       400:
 *         description: Missing mobile/email
 */
router.post('/send-otp', forgotPassword);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: VERIFY OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: OTP verified
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
 *                   example: "OTP verified"
 *       400:
 *         description: OTP not found/invalid or expired
 */
router.post('/verify-otp', verifyOtp);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: RESEND OTP 
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP resent (OTP returned in response for dev)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *       400:
 *         description: Missing mobile/email
 */
router.post('/resend-otp', resendOtp);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: RESET PASSWORD AFTER OTP VERIFICATION
 *     description:
 *       Resets the user's password using mobile or email **after OTP verification** is successfully completed in the previous step.
 *       Only `mobile` (or `email`) and `newPassword` are required.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: "Password reset successful"
 *       400:
 *         description: Missing parameters
 *       404:
 *         description: User not found
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /auth/update-password:
 *   post:
 *     summary: UPDATE PASSWORD
 *     description: Update an existing user's password. Provide `user_id`, `oldPassword`, `newPassword` and `confirmPassword`.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Missing or invalid input
 *       403:
 *         description: Old password incorrect
 *       404:
 *         description: User not found
 */
router.post('/update-password', updatePassword);

module.exports = router;
