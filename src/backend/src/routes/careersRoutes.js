// src/routes/careersRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitApplication } = require('../controllers/careersController');

// Configure multer for memory storage (suitable for small files like resumes)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * tags:
 *   - name: Careers
 *     description: Job application and recruitment APIs
 */

/**
 * @swagger
 * /careers/apply:
 *   post:
 *     summary: SUBMIT JOB APPLICATION
 *     description: Submit a job application with a resume file.
 *     tags: [Careers]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *               - resume
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               experience:
 *                 type: string
 *               portfolio:
 *                 type: string
 *               message:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/apply', upload.single('resume'), submitApplication);

module.exports = router;
