const express = require('express');
const router = express.Router();
const { submitFeedback } = require('../controllers/feedbackController');

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit tester feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [idea, suggestion, error, issue]
 *               message:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/', submitFeedback);

module.exports = router;
