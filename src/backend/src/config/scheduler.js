// src/config/scheduler.js 
const cron = require('node-cron');
const axios = require('axios');
const webpush = require('web-push');
const { midnightResetAndCreate, syncHourlyStatusToDailyConfig } = require('../controllers/schedulerController');
const HourlyAuction = require('../models/HourlyAuction');
const AuctionHistory = require('../models/AuctionHistory');
const PushSubscription = require('../models/PushSubscription');
const mongoose = require('mongoose');

// ... existing code ...