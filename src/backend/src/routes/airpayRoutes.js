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
 *       400:
 *         description: Invalid request parameters
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
