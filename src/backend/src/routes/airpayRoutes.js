const express = require('express');
const router = express.Router();
const airpayController = require('../controllers/airpayController');

/**
 * @swagger
 * /api/airpay/create-order:
 *   post:
 *     summary: Create an Airpay payment order
 *     description: Initializes a payment order for either an auction entry fee or a prize claim.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The unique ID of the user making the payment
 *               hourlyAuctionId:
 *                 type: string
 *                 description: The ID of the hourly auction
 *               auctionId:
 *                 type: string
 *                 description: Alias for hourlyAuctionId
 *               amount:
 *                 type: number
 *                 description: The amount to be paid in INR
 *               paymentType:
 *                 type: string
 *                 enum: [ENTRY_FEE, PRIZE_CLAIM]
 *                 default: ENTRY_FEE
 *                 description: The type of payment being made
 *               username:
 *                 type: string
 *                 description: The name of the user (optional)
 *     responses:
 *       200:
 *         description: Order created successfully. Returns a redirect URL and necessary form parameters.
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
 *                     url:
 *                       type: string
 *                     params:
 *                       type: object
 *                     orderId:
 *                       type: string
 *       400:
 *         description: Bad Request - Missing required fields or invalid data
 *       404:
 *         description: Not Found - User or Auction not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/create-order', airpayController.createOrder);

/**
 * @swagger
 * /api/airpay/response:
 *   post:
 *     summary: Handle Airpay payment response
 *     description: Webhook/Redirect endpoint that receives payment status from Airpay.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               response:
 *                 type: string
 *                 description: Encrypted response data from Airpay
 *     responses:
 *       302:
 *         description: Redirects to the frontend success or failure page.
 */
router.post('/response', airpayController.handleResponse);

module.exports = router;
