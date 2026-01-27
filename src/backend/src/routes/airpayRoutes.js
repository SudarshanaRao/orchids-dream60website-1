const express = require('express');
const router = express.Router();
const airpayController = require('../controllers/airpayController');

router.post('/create-order', airpayController.createOrder);
router.post('/response', airpayController.handleResponse);

module.exports = router;
