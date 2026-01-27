const express = require('express');
const router = express.Router();
const airpayController = require('../controllers/airpayController');
const { validateTxn, runValidation } = require('../validate/validateTransaction');

// Whitelisting / Manual Testing Routes (Pug Views)
router.get('/txn', airpayController.renderTxn);
router.post('/sendtoairpay', runValidation, airpayController.sendToAirpay);
router.post('/responsefromairpay', airpayController.handleAirpayResponse);

// Success/Failure Whitelist URLs for Airpay
router.post('/success', airpayController.handleAirpaySuccess);
router.post('/failure', airpayController.handleAirpayFailure);

// Application API Routes (JSON)
router.post('/create-order', airpayController.createOrder);
router.post('/response', airpayController.handleResponse);

module.exports = router;
