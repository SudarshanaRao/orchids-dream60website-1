const express = require('express');
const router = express.Router();
const airpayController = require('../controllers/airpayController');
const { validateTxn, runValidation } = require('../validate/validateTransaction');

/**
 * @swagger
 * tags:
 *   name: Airpay
 *   description: Airpay payment integration endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
   *     AirpayPayment:
   *       type: object
   *       properties:
   *         _id:
   *           type: string
   *           example: "6751a7a8f1b3e1a31cb91234"
   *         userId:
   *           type: string
   *           example: "673f0b8ebaa3e0a7b15b1234"
   *         auctionId:
   *           type: string
   *           example: "673f0ba1baa3e0a7b15b5678"
   *         amount:
   *           type: number
   *           example: 99.00
   *         currency:
   *           type: string
   *           example: "INR"
   *         orderId:
   *           type: string
   *           example: "D60-1735512345678"
   *         airpayTransactionId:
   *           type: string
   *           example: "123456789"
   *         paymentMethod:
   *           type: string
   *           example: "upi"
   *         bankName:
   *           type: string
   *           example: "ICICI"
   *         cardName:
   *           type: string
   *           example: "VISA"
   *         cardNumber:
   *           type: string
   *           example: "4111********1111"
   *         vpa:
   *           type: string
   *           example: "user@okaxis"
   *         status:
   *           type: string
   *           enum: [created, paid, failed]
   *           example: "paid"
   *         paymentType:
   *           type: string
   *           enum: [ENTRY_FEE, PRIZE_CLAIM]
   *           example: "ENTRY_FEE"
   *         message:
   *           type: string
   *         airpayResponse:
   *           type: object
   *           description: Full decrypted response from Airpay
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
   *           $ref: '#/components/schemas/AirpayPayment'
   *         joined:
   *           type: boolean
   *           example: true
   *         auctionId:
   *           type: string
   *           example: "673f0ba1baa3e0a7b15b5678"
   *         hourlyAuctionId:
   *           type: string
   *           example: "673f0ba1baa3e0a7b15b5678"
   *         finalStatus:
   *           type: string
   *           example: "paid"
   *         message:
   *           type: string
   *           example: "Success"
 *
 *     VerifyPaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Payment verified & user joined auction"
 *         data:
 *           $ref: '#/components/schemas/VerifyPaymentSuccessData'
 *
 *     AirpayOrderData:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *           example: "D60-1735512345678"
 *         url:
 *           type: string
 *           example: "https://payments.airpay.co.in/pay/v4/index.php?token=..."
 *         token:
 *           type: string
 *           example: "abcdef123456"
 *         params:
 *           type: object
 *           properties:
 *             mercid:
 *               type: string
 *             data:
 *               type: string
 *             privatekey:
 *               type: string
 *             checksum:
 *               type: string
 *
 *     AirpayOrderResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/AirpayOrderData'
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
 * /api/airpay/create-order:
 *   post:
 *     summary: Create a new Airpay order
 *     tags: [Airpay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - userId
 *               - auctionId
 *             properties:
 *               amount:
 *                 type: number
 *               userId:
 *                 type: string
 *               auctionId:
 *                 type: string
 *               paymentType:
 *                 type: string
 *                 enum: [ENTRY_FEE, PRIZE_CLAIM]
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AirpayOrderResponse'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-order', airpayController.createOrder);

/**
 * @swagger
 * /api/airpay/sendtoairpay:
 *   post:
 *     summary: Render the redirection form to Airpay
 *     tags: [Airpay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               userId:
 *                 type: string
 *               auctionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Redirection form rendered
 */
router.post('/sendtoairpay', runValidation, airpayController.sendToAirpay);

/**
 * @swagger
 * /api/airpay/responsefromairpay:
 *   post:
 *     summary: Handle response from Airpay (Redirect)
 *     description: Endpoint where Airpay redirects the user after a payment attempt. Receives encrypted payment data.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               merchant_id:
 *                 type: string
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       302:
 *         description: Redirects to frontend success or failure page
 */
router.post('/responsefromairpay', airpayController.handleAirpayResponse);

/**
 * @swagger
 * /api/airpay/webhook:
 *   post:
 *     summary: Airpay Server-to-Server (S2S) Webhook
 *     description: Endpoint for Airpay to notify the server directly about payment status. Receives encrypted payment data via POST.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               merchant_id:
 *                 type: string
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/webhook', airpayController.handleAirpayWebhook);

/**
 * @swagger
 * /api/airpay/success:
 *   all:
 *     summary: Whitelisted success URL for Airpay redirects
 *     description: Receives the POST response from Airpay upon successful payment and processes it.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               merchant_id:
 *                 type: string
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       302:
 *         description: Redirects to frontend success page
 */
router.all('/success', airpayController.handleAirpaySuccess);

/**
 * @swagger
 * /api/airpay/failure:
 *   all:
 *     summary: Whitelisted failure URL for Airpay redirects
 *     description: Receives the POST response from Airpay upon failed payment and processes it.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               merchant_id:
 *                 type: string
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       302:
 *         description: Redirects to frontend failure page
 */
router.all('/failure', airpayController.handleAirpayFailure);

module.exports = router;
