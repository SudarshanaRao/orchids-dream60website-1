const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpayController');

/**
 * @swagger
 * tags:
 *   name: Razorpay
 *   description: Razorpay payment integration for Dream60 Hourly Auctions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HourlyAuctionOrderRequest:
 *       type: object
 *       required:
 *         - userId 
 *         - hourlyAuctionId
 *       properties:
 *         userId:
 *           type: string
 *           description: MongoDB ObjectId of the user
 *           example: "673f0b8ebaa3e0a7b15b1234"
 *         hourlyAuctionId:
 *           type: string
 *           description: MongoDB ObjectId of the hourly auction
 *           example: "673f0ba1baa3e0a7b15b5678"
 *
 *     HourlyAuctionOrderData:
 *       type: object
 *       properties:
 *         razorpayKeyId:
 *           type: string
 *           description: Public Razorpay key to be used on frontend
 *           example: "rzp_test_ABC123"
 *         orderId:
 *           type: string
 *           description: Razorpay order ID
 *           example: "order_Pq1l3Zl1abCXYZ"
 *         amount:
 *           type: integer
 *           description: Amount in paise
 *           example: 9900
 *         currency:
 *           type: string
 *           example: "INR"
 *         hourlyAuctionId:
 *           type: string
 *           example: "673f0ba1baa3e0a7b15b5678"
 *         paymentDbId:
 *           type: string
 *           description: MongoDB ObjectId of the RazorpayPayment document
 *           example: "6751a7a8f1b3e1a31cb91234"
 *
 *     HourlyAuctionOrderResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Order created for hourly auction"
 *         data:
 *           $ref: '#/components/schemas/HourlyAuctionOrderData'
 *
 *     VerifyPaymentRequest:
 *       type: object
 *       required:
 *         - razorpay_order_id
 *         - razorpay_payment_id
 *         - razorpay_signature
 *       properties:
 *         razorpay_order_id:
 *           type: string
 *           example: "order_Pq1l3Zl1abCXYZ"
 *         razorpay_payment_id:
 *           type: string
 *           example: "pay_Pq1mA1PCD12345"
 *         razorpay_signature:
 *           type: string
 *           example: "f2b01c4ff833e9b6c8c1c1731c4c..."
 *
 *     RazorpayPayment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6751a7a8f1b3e1a31cb91234"
 *         userId:
 *           type: string
 *           example: "673f0b8ebaa3e0a7b15b1234"
 *         hourlyAuctionId:
 *           type: string
 *           example: "673f0ba1baa3e0a7b15b5678"
 *         amount:
 *           type: integer
 *           description: Amount in paise
 *           example: 9900
 *         currency:
 *           type: string
 *           example: "INR"
 *         razorpayOrderId:
 *           type: string
 *           example: "order_Pq1l3Zl1abCXYZ"
 *         razorpayPaymentId:
 *           type: string
 *           example: "pay_Pq1mA1PCD12345"
 *         razorpaySignature:
 *           type: string
 *           example: "f2b01c4ff833e9b6c8c1c1731c4c..."
 *         status:
 *           type: string
 *           enum: [created, paid, failed]
 *           example: "paid"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     VerifyPaymentSuccessData:
 *       type: object
 *       properties:
 *         payment:
 *           $ref: '#/components/schemas/RazorpayPayment'
 *         joined:
 *           type: boolean
 *           example: true
 *         hourlyAuctionId:
 *           type: string
 *           example: "673f0ba1baa3e0a7b15b5678"
 *
 *     VerifyPaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Payment verified & user joined hourly auction"
 *         data:
 *           $ref: '#/components/schemas/VerifyPaymentSuccessData'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/razorpay/hourly/create-order:
 *   post:
 *     summary: Create Razorpay order for Hourly Auction
 *     description: >
 *       Creates a Razorpay order for a specific hourly auction based on its entry fee.
 *       On success, returns order details and the public Razorpay key to be used on the frontend checkout.
 *     tags: [Razorpay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HourlyAuctionOrderRequest'
 *     responses:
 *       201:
 *         description: Razorpay order successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HourlyAuctionOrderResponse'
 *       400:
 *         description: Bad request (missing fields or auction not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/hourly/create-order', razorpayController.createHourlyAuctionOrder);

/**
 * @swagger
 * /api/razorpay/hourly/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment and join user to hourly auction
 *     description: >
 *       Verifies Razorpay payment signature. If valid, marks payment as 'paid'
 *       and joins the user to the corresponding hourly auction (no wallet pattern).
 *     tags: [Razorpay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyPaymentRequest'
 *     responses:
 *       200:
 *         description: Payment verified and user joined the hourly auction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyPaymentResponse'
 *       400:
 *         description: Invalid signature or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/hourly/verify-payment', razorpayController.verifyHourlyAuctionPayment);

/**
 * Prize Claim Payment Routes
 */
router.post('/prize-claim/create-order', razorpayController.createPrizeClaimOrder);
router.post('/prize-claim/verify-payment', razorpayController.verifyPrizeClaimPayment);

module.exports = router;