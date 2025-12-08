// src/routes/utilityRoutes.js 
const express = require('express');
const router = express.Router();
const { getServerTime } = require('../controllers/utilityController');

/**
 * @swagger
 * /utility/server-time:
 *   get:
 *     summary: Get current server time
 *     description: Returns the current server timestamp and time components
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: number
 *                       description: Unix timestamp in milliseconds
 *                     iso:
 *                       type: string
 *                       description: ISO 8601 formatted datetime
 *                     hour:
 *                       type: number
 *                       description: Current hour (0-23)
 *                     minute:
 *                       type: number
 *                       description: Current minute (0-59)
 *                     second:
 *                       type: number
 *                       description: Current second (0-59)
 *                     date:
 *                       type: string
 *                       description: Localized date string
 *                     time:
 *                       type: string
 *                       description: Localized time string
 *       500:
 *         description: Internal server error
 */
router.get('/server-time', getServerTime);

module.exports = router;
