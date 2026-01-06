// src/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contactController');

/**
 * @swagger
 * tags:
 *   - name: Contact
 *     description: Contact form and support ticket APIs
 *
 * components:
 *   schemas:
 *     ContactMessageRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - subject
 *         - category
 *         - message
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *           description: Full name of the sender
 *         email:
 *           type: string
 *           example: "john@example.com"
 *           description: Email address of the sender
 *         subject:
 *           type: string
 *           example: "Payment Issue"
 *           description: Subject of the message
 *         category:
 *           type: string
 *           example: "payment"
 *           description: Category of the inquiry
 *         message:
 *           type: string
 *           example: "I'm having trouble with my payment..."
 *           description: The message content
 *         recipientEmail:
 *           type: string
 *           example: "support@dream60.com"
 *           description: Optional recipient email override
 *
 *     ContactMessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Your message has been sent successfully"
 */

/**
 * @swagger
 * /contact/send-message:
 *   post:
 *     summary: SEND CONTACT FORM MESSAGE
 *     description: |
 *       Submit a contact form message. The message will be sent via email to the support team.
 *       
 *       **Use Cases:**
 *       - Customer support inquiries
 *       - Payment issues
 *       - Technical support
 *       - General feedback
 *       - Business partnerships
 *       
 *       **Categories:**
 *       - account: Account & Login Issues
 *       - auction: Auction Questions
 *       - payment: Payment & Billing
 *       - technical: Technical Support
 *       - prizes: Prize & Delivery
 *       - feedback: Feedback & Suggestions
 *       - partnership: Business Partnership
 *       - press: Press & Media
 *       - legal: Legal & Compliance
 *       - other: Other
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactMessageRequest'
 *           example:
 *             name: "John Doe"
 *             email: "john@example.com"
 *             subject: "Payment not reflecting in account"
 *             category: "payment"
 *             message: "I made a payment of ₹100 for the auction but it's not showing in my account. Transaction ID: TXN12345678"
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactMessageResponse'
 *             example:
 *               success: true
 *               message: "Your message has been sent successfully. We'll get back to you within 24 hours."
 *       400:
 *         description: Invalid request - missing required fields
 *       500:
 *         description: Server error - failed to send email
 */
router.post('/send-message', sendContactMessage);

module.exports = router;
