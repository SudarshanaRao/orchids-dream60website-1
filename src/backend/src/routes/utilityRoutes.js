// src/routes/utilityRoutes.js 
const express = require('express');
const router = express.Router();
const { getServerTime, getPlatformStats } = require('../controllers/utilityController');

/**
 * @swagger
 * tags:
 *   - name: Utility
 *     description: Utility APIs for system operations and server information
 *
 * components:
 *   schemas:
 *     ServerTimeData:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: number
 *           description: Unix timestamp in milliseconds
 *           example: 1732608000000
 *         iso:
 *           type: string
 *           description: ISO 8601 formatted datetime
 *           example: "2025-11-26T09:00:00.000Z"
 *         hour:
 *           type: number
 *           description: Current hour (0-23) in server timezone
 *           example: 14
 *         minute:
 *           type: number
 *           description: Current minute (0-59)
 *           example: 30
 *         second:
 *           type: number
 *           description: Current second (0-59)
 *           example: 45
 *         date:
 *           type: string
 *           description: Localized date string
 *           example: "11/26/2025"
 *         time:
 *           type: string
 *           description: Localized time string (HH:MM:SS format)
 *           example: "14:30:45"
 *         timezone:
 *           type: string
 *           description: Server timezone
 *           example: "Asia/Kolkata"
 *         offset:
 *           type: string
 *           description: Timezone offset from UTC
 *           example: "+05:30"
 */

/**
 * @swagger
 * /utility/server-time:
 *   get:
 *     summary: GET CURRENT SERVER TIME
 *     description: |
 *       Returns the current server timestamp and time components in multiple formats.
 *       Useful for time synchronization between client and server.
 *       
 *       **What it returns:**
 *       - Unix timestamp (milliseconds)
 *       - ISO 8601 formatted datetime
 *       - Individual time components (hour, minute, second)
 *       - Localized date and time strings
 *       - Server timezone information
 *       
 *       **Use this endpoint to:**
 *       - Synchronize client-server time
 *       - Display auction countdowns accurately
 *       - Handle timezone conversions
 *       - Debug time-related issues
 *       - Calculate time differences
 *       
 *       **Important:**
 *       - Server uses Asia/Kolkata timezone (IST - UTC+5:30)
 *       - All auction times are based on server time
 *       - Use timestamp for precise time calculations
 *     tags: [Utility]
 *     responses:
 *       200:
 *         description: Server time retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServerTimeData'
 *             example:
 *               success: true
 *               data:
 *                 timestamp: 1732608645000
 *                 iso: "2025-11-26T09:00:45.000Z"
 *                 hour: 14
 *                 minute: 30
 *                 second: 45
 *                 date: "11/26/2025"
 *                 time: "14:30:45"
 *                 timezone: "Asia/Kolkata"
 *                 offset: "+05:30"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve server time"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/server-time', getServerTime);
router.get('/platform-stats', getPlatformStats);

module.exports = router;