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
     *         transactionStatus:
     *           type: string
     *           example: "200"
     *         transactionDate:
     *           type: string
     *           example: "2024-12-30"
     *         airpayAmount:
     *           type: string
     *           example: "99.00"
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
 * /api/airpay/status:
 *   get:
 *     summary: Get Airpay payment status
 *     tags: [Airpay]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/status', airpayController.getPaymentStatus);

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
 *     summary: Handle response from Airpay (Legacy/Redirect)
 *     description: Endpoint where Airpay redirects the user after a payment attempt. Receives encrypted payment data. Processes the payment and redirects to the frontend results page.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - merchant_id
 *               - response
 *             properties:
 *               merchant_id:
 *                 type: string
 *                 example: "339005"
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay (AES-256-CBC with first 16 chars as IV)
 *     responses:
 *       302:
 *         description: Redirects to frontend results page (e.g., /payment/result?orderId=XXX)
 */
router.post('/responsefromairpay', airpayController.handleAirpayResponse);

/**
 * @swagger
 * /api/airpay/webhook:
 *   post:
 *     summary: Airpay Server-to-Server (S2S) Webhook
 *     description: Endpoint for Airpay to notify the server directly about payment status. Receives encrypted payment data via POST. Ensures idempotency by checking if the payment was already processed via redirect.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - merchant_id
 *               - response
 *             properties:
 *               merchant_id:
 *                 type: string
 *                 example: "339005"
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       200:
 *         description: OK (stops Airpay retries)
 */
router.post('/webhook', airpayController.handleAirpayWebhook);

/**
 * @swagger
 * /api/airpay/success:
 *   all:
 *     summary: Backend Success URL for Airpay Redirects
 *     description: The official success_url provided to Airpay. Receives the encrypted POST response, decrypts it, updates the DB (joins user to auction), and redirects the user to the frontend result page.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - merchant_id
 *               - response
 *             properties:
 *               merchant_id:
 *                 type: string
 *                 example: "339005"
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       302:
 *         description: Redirects to frontend results page (/payment/result?orderId=XXX)
 */
router.all('/success', airpayController.handleAirpaySuccess);

/**
 * @swagger
 * /api/airpay/failure:
 *   all:
 *     summary: Backend Failure URL for Airpay Redirects
 *     description: The official failure_url provided to Airpay. Receives the encrypted POST response, logs the failure, and redirects the user to the frontend result page.
 *     tags: [Airpay]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - merchant_id
 *               - response
 *             properties:
 *               merchant_id:
 *                 type: string
 *                 example: "339005"
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       302:
 *         description: Redirects to frontend results page (/payment/result?orderId=XXX)
 */
router.all('/failure', airpayController.handleAirpayFailure);

// ============================================================
// AIRPAY REFUND API ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/airpay/refund:
 *   post:
 *     summary: Initiate refund for one or more transactions
 *     description: |
 *       Process partial or full refund for Airpay transactions.
 *       Requires admin privileges. Supports batch refunds.
 *     tags: [Airpay]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID for authorization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactions
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - ap_transactionid
 *                     - amount
 *                   properties:
 *                     ap_transactionid:
 *                       type: string
 *                       description: Airpay transaction reference number
 *                       example: "10265"
 *                     amount:
 *                       type: string
 *                       description: Refund amount (can be partial)
 *                       example: "100.00"
 *           example:
 *             transactions:
 *               - ap_transactionid: "10265"
 *                 amount: "100.00"
 *               - ap_transactionid: "10264"
 *                 amount: "10.00"
 *     responses:
 *       200:
 *         description: Refund request processed
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
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ap_transactionid:
 *                             type: string
 *                           amount:
 *                             type: string
 *                           success:
 *                             type: string
 *                             enum: ["true", "false"]
 *                           message:
 *                             type: string
 *                           refund_id:
 *                             type: string
 *             example:
 *               success: true
 *               message: "success"
 *               data:
 *                 transactions:
 *                   - ap_transactionid: 10265
 *                     amount: "100.00"
 *                     success: "false"
 *                     message: "Refund can not be performed. Refund already initiated."
 *                     refund_id: "12071"
 *                   - ap_transactionid: "10264"
 *                     success: "true"
 *                     message: "Transaction accepted for refund"
 *                     refund_id: "12076"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - admin privileges required
 *       500:
 *         description: Server error
 */
router.post('/refund', airpayController.processRefund);

/**
 * @swagger
 * /api/airpay/refundable-payments:
 *   get:
 *     summary: Get list of payments eligible for refund
 *     description: Returns paginated list of successful payments that can be refunded
 *     tags: [Airpay]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID for authorization
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by orderId, userId, or airpayTransactionId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: paid
 *         description: Payment status filter
 *     responses:
 *       200:
 *         description: List of refundable payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AirpayPayment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/refundable-payments', airpayController.getRefundablePayments);

/**
 * @swagger
 * /api/airpay/refund-history:
 *   get:
 *     summary: Get refund history
 *     description: Returns paginated list of all refund attempts
 *     tags: [Airpay]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID for authorization
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of refund attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     refunds:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/AirpayPayment'
 *                           - type: object
 *                             properties:
 *                               refundRequested:
 *                                 type: boolean
 *                               refundRequestedAt:
 *                                 type: string
 *                                 format: date-time
 *                               refundAmount:
 *                                 type: number
 *                               refundStatus:
 *                                 type: string
 *                                 enum: [initiated, completed, failed]
 *                               refundId:
 *                                 type: string
 *                               refundMessage:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/refund-history', airpayController.getRefundHistory);

module.exports = router;
