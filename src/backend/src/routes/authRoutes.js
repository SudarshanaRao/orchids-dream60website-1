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
  sendVerificationOtp,
    checkEmail,
    checkMobile,
    checkUsername,
  } = require('../controllers/authController');

/**
 * @swagger
 * /auth/send-verification-otp:
 *   post:
 *     summary: SEND VERIFICATION OTP (e.g. for profile changes)
 *     tags: [Authentication, Email Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, mobile]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send-verification-otp', sendVerificationOtp);

/**
 * @swagger
 * /auth/check-email:
 *   post:
 *     summary: Check if email is already registered
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email check result
 */
router.post('/check-email', checkEmail);

/**
 * @swagger
 * /auth/check-mobile:
 *   post:
 *     summary: Check if mobile is already registered
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mobile check result
 */
router.post('/check-mobile', checkMobile);

/**
 * @swagger
 * /auth/check-username:
 *   post:
 *     summary: Check if username is already taken
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Username check result
 */
router.post('/check-username', checkUsername);

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User registration, login and password recovery
 *   - name: Email Integration
 *     description: Gmail integration for sending OTP and welcome emails
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
 *           description: Unique username for the user
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *           description: 10-digit mobile number
 *         password:
 *           type: string
 *           example: Dream@123
 *           description: Strong password with letters, numbers and special characters
 *         confirmPassword:
 *           type: string
 *           example: Dream@123
 *           description: Must match password field
 *         email:
 *           type: string
 *           example: "player@gmail.com"
 *           description: Valid email address (optional). If provided, a welcome email will be sent via Gmail.
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
 *           example: "player@gmail.com"
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
 *           description: Mobile number to send OTP (provide mobile OR email, not both)
 *         email:
 *           type: string
 *           example: "player@gmail.com"
 *           description: Email address to send OTP via Gmail (provide mobile OR email, not both)
 *       description: |
 *         **Gmail Integration:** When email is provided, OTP will be sent via Gmail using nodemailer.
 *         
 *         **Email Template Features:**
 *         - Beautiful HTML template with purple gradient theme
 *         - 6-digit OTP code displayed prominently
 *         - 10-minute expiry information
 *         - Security warnings and support contact
 *         - Mobile-responsive design
 *         
 *         **Email Configuration Required:**
 *         - EMAIL_HOST=smtp.gmail.com
 *         - EMAIL_PORT=587
 *         - EMAIL_USER=your_email@gmail.com
 *         - EMAIL_PASSWORD=your_app_password (from Google App Passwords)
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
 *           description: Mobile number used to send OTP
 *         email:
 *           type: string
 *           example: "player@gmail.com"
 *           description: Email address used to send OTP
 *         otp:
 *           type: string
 *           example: "483251"
 *           description: 6-digit OTP code received via email or SMS
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
 *           description: Mobile number of the user
 *         email:
 *           type: string
 *           example: "player@gmail.com"
 *           description: Email address of the user
 *         newPassword:
 *           type: string
 *           example: NewPass123
 *           description: New password to set after OTP verification
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
 *           example: "player@gmail.com"
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
 *           example: "OTP sent via email successfully"
   *         otp:
   *           type: string
   *           description: No longer returned in response for security
   *         emailSent:

 *           type: boolean
 *           example: true
 *           description: Indicates if email was sent successfully via Gmail
 *
 *     WelcomeEmailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "User registered successfully. Welcome email sent."
 *         user:
 *           $ref: '#/components/schemas/UserObject'
 *         emailSent:
 *           type: boolean
 *           example: true
 *           description: Indicates if welcome email was sent via Gmail
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: REGISTER NEW USER WITH GMAIL WELCOME EMAIL
 *     tags: [Authentication, Email Integration]
 *     description: |
 *       Register a new user account. If an email address is provided, a beautifully formatted welcome email will be sent via Gmail.
 *       
 *       **Welcome Email Features:**
 *       - Purple gradient theme matching Dream60 branding
 *       - Personalized greeting with username
 *       - Platform feature highlights
 *       - Call-to-action button to start playing
 *       - Mobile-responsive HTML design
 *       - Support contact information
 *       
 *       **Email Content Includes:**
 *       - Welcome message with user's name
 *       - List of key features (auctions, prizes, statistics)
 *       - Link to start playing
 *       - Contact support information
 *       
 *       **Gmail Configuration:**
 *       Requires EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD environment variables.
 *       Uses Gmail SMTP (smtp.gmail.com:587) with App Password authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *           examples:
 *             withEmail:
 *               summary: Registration with email (triggers welcome email)
 *               value:
 *                 username: "DreamPlayer123"
 *                 mobile: "9876543210"
 *                 password: "Dream@123"
 *                 confirmPassword: "Dream@123"
 *                 email: "player@gmail.com"
 *             withoutEmail:
 *               summary: Registration without email (no email sent)
 *               value:
 *                 username: "Player456"
 *                 mobile: "9123456789"
 *                 password: "Secure@456"
 *                 confirmPassword: "Secure@456"
 *     responses:
 *       201:
 *         description: User registered successfully. Welcome email sent if email provided.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WelcomeEmailResponse'
 *             example:
 *               success: true
 *               message: "User registered successfully. Welcome email sent to player@gmail.com"
 *               user:
 *                 user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                 username: "DreamPlayer123"
 *                 mobile: "9876543210"
 *                 email: "player@gmail.com"
 *                 preferences: {}
 *               emailSent: true
 *       400:
 *         description: Validation error or missing required fields
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Password and confirm password do not match"
 *       409:
 *         description: Duplicate username, mobile, or email already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Username already exists"
 */
router.post('/signup', signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: LOGIN EXISTING USER
 *     tags: [Authentication]
 *     description: |
 *       Authenticate user with mobile number, email, or username along with password.
 *       Returns user details upon successful authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             emailLogin:
 *               summary: Login with email
 *               value:
 *                 identifier: "player@gmail.com"
 *                 password: "Dream@123"
 *             mobileLogin:
 *               summary: Login with mobile
 *               value:
 *                 identifier: "9876543210"
 *                 password: "Dream@123"
 *             usernameLogin:
 *               summary: Login with username
 *               value:
 *                 identifier: "DreamPlayer123"
 *                 password: "Dream@123"
 *     responses:
 *       200:
 *         description: Login successful (returns user)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             example:
 *               success: true
 *               message: "Login successful"
 *               user:
 *                 user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                 username: "DreamPlayer123"
 *                 mobile: "9876543210"
 *                 email: "player@gmail.com"
 *       400:
 *         description: User not found or invalid credentials
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid credentials"
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: SEND OTP VIA GMAIL
 *     tags: [Authentication, Email Integration]
 *     description: |
 *       Generate and send a 6-digit OTP code for password recovery.
 *       
 *       **Gmail Integration:**
 *       When email is provided, OTP is sent via Gmail using a beautifully formatted HTML template.
 *       
 *       **OTP Email Features:**
 *       - Purple gradient theme matching Dream60 branding
 *       - Large, prominent 6-digit OTP code display
 *       - 10-minute expiry timer information
 *       - Security warnings about unauthorized requests
 *       - Mobile-responsive design with gradient backgrounds
 *       - Support contact information
 *       
 *       **Email Template Details:**
 *       - Subject: "Your Dream60 OTP Code"
 *       - From: "Dream60 <your_email@gmail.com>"
 *       - HTML + Plain text fallback versions
 *       - Professional layout with header, content, and footer
 *       
 *       **OTP Behavior:**
 *       - Development mode: OTP returned in API response for testing
 *       - Production mode: OTP only sent via email (not in response)
 *       - Valid for 10 minutes (MongoDB TTL index)
 *       - Automatically deleted after verification
 *       
 *       **Gmail SMTP Configuration:**
 *       ```
 *       EMAIL_HOST=smtp.gmail.com
 *       EMAIL_PORT=587
 *       EMAIL_USER=your_email@gmail.com
 *       EMAIL_PASSWORD=your_app_password_here
 *       ```
 *       
 *       **Setup Gmail App Password:**
 *       1. Go to https://myaccount.google.com/apppasswords
 *       2. Generate new app password for "Mail"
 *       3. Copy 16-character password
 *       4. Add to EMAIL_PASSWORD in .env file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *           examples:
 *             emailOTP:
 *               summary: Send OTP via Gmail (recommended)
 *               value:
 *                 email: "player@gmail.com"
 *             mobileOTP:
 *               summary: Send OTP via mobile (SMS integration needed)
 *               value:
 *                 mobile: "9876543210"
 *     responses:
 *       200:
 *         description: OTP generated and sent via Gmail successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
   *             example:
   *               success: true
   *               message: "OTP sent to player@gmail.com via email"
   *               emailSent: true

 *       400:
 *         description: Missing mobile or email parameter
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Please provide mobile or email"
 *       500:
 *         description: Email service error (check Gmail configuration)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Failed to send email. Please check email configuration."
 */
router.post('/send-otp', forgotPassword);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: VERIFY OTP CODE
 *     tags: [Authentication]
 *     description: |
 *       Verify the OTP code sent via email or SMS. OTP must match and be within 10-minute validity period.
 *       Upon successful verification, OTP is deleted from database to prevent reuse.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *           examples:
 *             emailOTP:
 *               summary: Verify OTP sent via email
 *               value:
 *                 email: "player@gmail.com"
 *                 otp: "483251"
 *             mobileOTP:
 *               summary: Verify OTP sent via mobile
 *               value:
 *                 mobile: "9876543210"
 *                 otp: "867392"
 *     responses:
 *       200:
 *         description: OTP verified successfully. OTP deleted from database.
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
 *                   example: "OTP verified successfully"
 *             example:
 *               success: true
 *               message: "OTP verified successfully"
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             examples:
 *               invalidOTP:
 *                 summary: Incorrect OTP code
 *                 value:
 *                   success: false
 *                   message: "Invalid OTP"
 *               expiredOTP:
 *                 summary: OTP expired (>10 minutes)
 *                 value:
 *                   success: false
 *                   message: "OTP has expired. Please request a new one."
 */
router.post('/verify-otp', verifyOtp);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: RESEND OTP VIA GMAIL
 *     tags: [Authentication, Email Integration]
 *     description: |
 *       Resend OTP if the previous one was not received or expired. Generates a new OTP and sends via Gmail.
 *       
 *       **Email Integration:**
 *       Uses the same beautiful HTML email template as /auth/send-otp with updated OTP code.
 *       
 *       **Features:**
 *       - Generates fresh 6-digit OTP
 *       - Sends via Gmail with HTML template
 *       - Replaces previous OTP in database
 *       - New 10-minute validity period
 *       
 *       **Use Cases:**
 *       - User didn't receive original OTP email
 *       - Original OTP expired (>10 minutes)
 *       - Email was accidentally deleted
 *       - User entered wrong email initially
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *           examples:
 *             resendEmail:
 *               summary: Resend OTP to email via Gmail
 *               value:
 *                 email: "player@gmail.com"
 *             resendMobile:
 *               summary: Resend OTP to mobile
 *               value:
 *                 mobile: "9876543210"
 *     responses:
 *       200:
 *         description: New OTP generated and sent via Gmail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             example:
 *               success: true
 *               message: "OTP resent to player@gmail.com via email"
 *               otp: "729483"
 *               emailSent: true
 *       400:
 *         description: Missing mobile or email parameter
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Please provide mobile or email"
 */
router.post('/resend-otp', resendOtp);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: RESET PASSWORD AFTER OTP VERIFICATION
 *     description: |
 *       Reset user password after successful OTP verification.
 *       
 *       **Workflow:**
 *       1. User requests OTP via /auth/send-otp (receives OTP via Gmail)
 *       2. User verifies OTP via /auth/verify-otp
 *       3. User resets password via this endpoint
 *       
 *       **Important:** OTP must be verified first via /auth/verify-otp before calling this endpoint.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           examples:
 *             emailReset:
 *               summary: Reset password using email
 *               value:
 *                 email: "player@gmail.com"
 *                 newPassword: "NewSecure@123"
 *             mobileReset:
 *               summary: Reset password using mobile
 *               value:
 *                 mobile: "9876543210"
 *                 newPassword: "NewSecure@123"
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
 *             example:
 *               success: true
 *               message: "Password reset successful. You can now login with your new password."
 *       400:
 *         description: Missing parameters or validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Please provide mobile/email and new password"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "User not found"
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /auth/update-password:
 *   post:
 *     summary: UPDATE PASSWORD (LOGGED IN USER)
 *     description: |
 *       Update password for logged-in user. Requires old password verification.
 *       Different from /auth/reset-password which is for forgotten passwords using OTP.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *           example:
 *             user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *             oldPassword: "OldPass@123"
 *             newPassword: "NewSecure@456"
 *             confirmPassword: "NewSecure@456"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Password updated successfully"
 *       400:
 *         description: Missing or invalid input (passwords don't match)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "New password and confirm password do not match"
 *       403:
 *         description: Old password incorrect
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Old password is incorrect"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "User not found"
 */
router.post('/update-password', updatePassword);

module.exports = router;