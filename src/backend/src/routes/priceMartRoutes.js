const express = require('express');
const router = express.Router();
const {
  submitForm,
  getFormCount,
  getAllFormsCSV,
} = require('../controllers/priceMartController');

/**
 * @swagger
 * tags:
 *   - name: PriceMart
 *     description: PriceMart form submissions APIs
 *
 * components:
 *   schemas:
 *     FormSubmission:
 *       type: object 
 *       properties:
 *         serial_No:
 *           type: number
 *           example: 1
 *         restaurant_name:
 *           type: string
 *           example: "Dream Restaurant"
 *         location:
 *           type: string
 *           example: "Hyderabad"
 *         contact_person:
 *           type: string
 *           example: "John Doe - Purchase Manager"
 *         contact_number:
 *           type: string
 *           example: "9876543210"
 *         restaurant_type:
 *           type: array
 *           items:
 *             type: string
 *           example: ["fine_dining"]
 *         restaurant_type_other:
 *           type: string
 *           example: "Buffet style"
 *         use_online:
 *           type: string
 *           example: "yes"
 *         platforms:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Amazon", "Flipkart"]
 *         platforms_other:
 *           type: string
 *           example: "Local supplier"
 *         purchase_frequency:
 *           type: string
 *           example: "weekly"
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           example: ["produce", "dairy"]
 *         categories_other:
 *           type: string
 *           example: "Frozen foods"
 *         experience_rating:
 *           type: number
 *           example: 7
 *         factors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["quality", "price", "speed"]
 *         budget:
 *           type: string
 *           example: "₹4,00,000"
 *         order_advance:
 *           type: string
 *           example: "1 day before"
 *         delivery_slot:
 *           type: string
 *           example: "morning"
 *         recurring:
 *           type: string
 *           example: "yes"
 *         tech_comfort:
 *           type: number
 *           example: 4
 *         payment:
 *           type: array
 *           items:
 *             type: string
 *           example: ["cod", "credit_7"]
 *         improvements:
 *           type: string
 *           example: "Faster delivery, better packaging"
 *         shift_all:
 *           type: string
 *           example: "yes"
 *         comments:
 *           type: string
 *           example: "Great initiative!"
 *         surveyed_by:
 *           type: string
 *           example: "Alice Smith"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-14T12:34:56.789Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-14T12:34:56.789Z"
 */

/**
 * @swagger
 * /priceMart/submit:
 *   post:
 *     summary: SUBMIT A PRIZEMART FORM.
 *     description: Submits the complete PriceMart questionnaire form.
 *     tags: [PriceMart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormSubmission'
 *     responses:
 *       201:
 *         description: Form submitted successfully
 *       400:
 *         description: Invalid form data
 *       500:
 *         description: Server error
 */
router.post('/submit', submitForm);

/**
 * @swagger
 * /priceMart/count:
 *   get:
 *     summary: GET THE COUNT OF FORM SUBMISSIONS.
 *     description: Returns total number of PriceMart form submissions.
 *     tags: [PriceMart]
 *     responses:
 *       200:
 *         description: Successful fetch
 *       500:
 *         description: Server error
 */
router.get('/count', getFormCount);

/**
 * @swagger
 * /priceMart/downloadCSV:
 *   get:
 *     summary: DOWNLOAD ALL PRIZEMART FORM SUBMISSIONS AS A CSV FILE.
 *     description: Exports all form submission data including serial numbers.
 *     tags: [PriceMart]
 *     responses:
 *       200:
 *         description: CSV downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 */
router.get('/downloadCSV', getAllFormsCSV);

module.exports = router;