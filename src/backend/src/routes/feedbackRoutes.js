const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitFeedback } = require('../controllers/feedbackController');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit tester feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               screenshot:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/', upload.single('screenshot'), submitFeedback);

module.exports = router;
