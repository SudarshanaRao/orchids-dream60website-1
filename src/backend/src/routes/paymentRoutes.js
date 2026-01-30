const express = require('express');
const router = express.Router();
const airpayController = require('../controllers/airpayController');

/**
 * @swagger
 * /api/payments/status:
 *   get:
 *     summary: Get payment status for any provider (Unified)
 *     tags: [Payments]
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

module.exports = router;
