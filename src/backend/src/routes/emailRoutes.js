// src/routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const {
  sendEmailToUsers,
  createEmailTemplate,
  getAllEmailTemplates,
  getEmailTemplateById,
  updateEmailTemplate,
    deleteEmailTemplate,
    getPublicEmailTemplates,
  } = require('../controllers/emailController');


/**
 * @swagger
 * tags:
 *   - name: Email Management
 *     description: Admin email management APIs for sending emails and managing templates
 *
 * components:
 *   schemas:
 *     SendEmailRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - recipients
 *         - subject
 *         - body
 *       properties:
 *         user_id:
 *           type: string
 *           example: "admin-user-id-123"
 *           description: Admin user ID for authorization
 *         recipients:
 *           type: array
 *           items:
 *             type: string
 *           example: ["72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c", "abc-123-def-456"]
 *           description: Array of user IDs to send email to
 *         subject:
 *           type: string
 *           example: "Important Announcement: New Features Released!"
 *           description: Email subject line
 *         body:
 *           type: string
 *           example: "<h1>Hello!</h1><p>We have exciting new features for you...</p>"
 *           description: Email body in HTML format
 *         templateId:
 *           type: string
 *           example: "template-uuid-123"
 *           description: Optional template ID if using saved template
 *
 *     SendEmailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Emails sent: 2 succeeded, 0 failed"
 *         data:
 *           type: object
 *           properties:
 *             totalSent:
 *               type: number
 *               example: 2
 *             totalFailed:
 *               type: number
 *               example: 0
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   success:
 *                     type: boolean
 *                   message:
 *                     type: string
 *
 *     EmailTemplate:
 *       type: object
 *       properties:
 *         template_id:
 *           type: string
 *           example: "template-uuid-123"
 *         name:
 *           type: string
 *           example: "Welcome Email Template"
 *         subject:
 *           type: string
 *           example: "Welcome to Dream60!"
 *         body:
 *           type: string
 *           example: "<h1>Welcome!</h1><p>Thank you for joining...</p>"
 *         category:
 *           type: string
 *           enum: [PRIZE_CLAIM, GENERAL, MARKETING, NOTIFICATION, CUSTOM]
 *           example: "MARKETING"
 *         createdBy:
 *           type: string
 *           example: "admin-user-id-123"
 *         isActive:
 *           type: boolean
 *           example: true
 *         usageCount:
 *           type: number
 *           example: 15
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateTemplateRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - name
 *         - subject
 *         - body
 *       properties:
 *         user_id:
 *           type: string
 *           example: "admin-user-id-123"
 *         name:
 *           type: string
 *           example: "Monthly Newsletter"
 *         subject:
 *           type: string
 *           example: "Dream60 Monthly Newsletter - {{month}}"
 *         body:
 *           type: string
 *           example: "<h1>Monthly Newsletter</h1><p>Check out what happened this month...</p>"
 *         category:
 *           type: string
 *           enum: [PRIZE_CLAIM, GENERAL, MARKETING, NOTIFICATION, CUSTOM]
 *           example: "MARKETING"
 *
 *     UpdateTemplateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Updated Template Name"
 *         subject:
 *           type: string
 *           example: "Updated Subject"
 *         body:
 *           type: string
 *           example: "<h1>Updated Body</h1>"
 *         category:
 *           type: string
 *           enum: [PRIZE_CLAIM, GENERAL, MARKETING, NOTIFICATION, CUSTOM]
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /admin/emails/all-templates:
 *   get:
 *     summary: GET ALL EMAIL TEMPLATES (PUBLIC)
 *     description: |
 *       Retrieve all saved email templates with pagination and filtering.
 *       
 *       **Public Feature:**
 *       - No admin user_id required
 *       - Pagination support (page, limit)
 *       - Filter by category
 *       - Filter by active status
 *       - Sorted by creation date (newest first)
 *     tags: [Email Management]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *         description: Results per page (max 100)
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PRIZE_CLAIM, GENERAL, MARKETING, NOTIFICATION, CUSTOM]
 *         description: Filter by category
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmailTemplate'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     pages:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/all-templates', getPublicEmailTemplates);

/**
 * @swagger
 * /admin/emails/send:
 *   post:
 *     summary: SEND EMAIL TO SELECTED USERS
 *     description: |
 *       Send custom emails to selected users individually.
 *       
 *       **Admin Feature:**
 *       - Select multiple users by their user IDs
 *       - Compose custom subject and body
 *       - Optionally use saved templates
 *       - Each user receives individual email
 *       - Tracks success/failure for each recipient
 *       
 *       **Use Cases:**
 *       - Send announcements to specific users
 *       - Marketing campaigns to user segments
 *       - Important notifications
 *       - Prize winner notifications
 *       
 *       **Email Body:**
 *       - Supports full HTML formatting
 *       - Include images, links, styles
 *       - Plain text fallback auto-generated
 *       
 *       **Template Support:**
 *       - Optionally provide templateId to track usage
 *       - Template usage count increments automatically
 *     tags: [Email Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendEmailRequest'
 *           example:
 *             user_id: "admin-user-id-123"
 *             recipients: 
 *               - "72f2d2d2-3f8e-4241-9dfe-a6a3b002bc6c"
 *               - "abc-123-def-456"
 *             subject: "🎉 New Feature Announcement"
 *             body: "<div style='font-family: Arial, sans-serif;'><h1 style='color: #6b3fa0;'>Exciting News!</h1><p>We have launched amazing new features just for you...</p><a href='https://dream60.com' style='background: #6b3fa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Check it out</a></div>"
 *             templateId: "template-uuid-123"
 *     responses:
 *       200:
 *         description: Emails sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SendEmailResponse'
 *             example:
 *               success: true
 *               message: "Emails sent: 2 succeeded, 0 failed"
 *               data:
 *                 totalSent: 2
 *                 totalFailed: 0
 *                 results:
 *                   - email: "user1@example.com"
 *                     success: true
 *                     message: "Custom email sent successfully"
 *                   - email: "user2@example.com"
 *                     success: true
 *                     message: "Custom email sent successfully"
 *       400:
 *         description: Invalid request (missing fields, empty recipients, no valid emails)
 *       401:
 *         description: Unauthorized - Admin user_id required
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 */
router.post('/send', sendEmailToUsers);

/**
 * @swagger
 * /admin/emails/templates:
 *   get:
 *     summary: GET ALL EMAIL TEMPLATES
 *     description: |
 *       Retrieve all saved email templates with pagination and filtering.
 *       
 *       **Features:**
 *       - Pagination support (page, limit)
 *       - Filter by category
 *       - Filter by active status
 *       - Sorted by creation date (newest first)
 *       
 *       **Categories:**
 *       - PRIZE_CLAIM: Templates for prize notifications
 *       - GENERAL: General purpose templates
 *       - MARKETING: Marketing and promotional emails
 *       - NOTIFICATION: System notifications
 *       - CUSTOM: Custom user-created templates
 *       
 *       **Use this endpoint to:**
 *       - Display template library in admin panel
 *       - Select template for email composition
 *       - Manage template collection
 *     tags: [Email Management]
 *     parameters:
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *         example: "admin-user-id-123"
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *         description: Results per page (max 100)
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PRIZE_CLAIM, GENERAL, MARKETING, NOTIFICATION, CUSTOM]
 *         description: Filter by category
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmailTemplate'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     pages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 *   post:
 *     summary: CREATE EMAIL TEMPLATE
 *     description: |
 *       Create a new email template for future use.
 *       
 *       **Template Variables:**
 *       You can use placeholders in subject and body:
 *       - {{username}} - User's name
 *       - {{email}} - User's email
 *       - {{date}} - Current date
 *       - {{month}} - Current month
 *       - Custom variables as needed
 *       
 *       **HTML Body:**
 *       - Full HTML/CSS support
 *       - Inline styles recommended for email compatibility
 *       - Responsive design best practices
 *       
 *       **Use this endpoint to:**
 *       - Save frequently used email formats
 *       - Create template library
 *       - Standardize communications
 *     tags: [Email Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplateRequest'
 *           example:
 *             user_id: "admin-user-id-123"
 *             name: "Welcome Email Template"
 *             subject: "Welcome to Dream60, {{username}}!"
 *             body: "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'><div style='background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%); color: white; padding: 40px; text-align: center;'><h1>Welcome to Dream60! 🎰</h1></div><div style='padding: 40px; background: white;'><p>Hi <strong>{{username}}</strong>,</p><p>Welcome to our auction gaming community! We're excited to have you.</p><ul><li>🎯 Participate in exciting auctions</li><li>🏆 Win amazing prizes</li><li>💰 Track your earnings</li></ul><a href='https://dream60.com' style='display: inline-block; background: #6b3fa0; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px;'>Start Playing</a></div></div>"
 *             category: "GENERAL"
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/EmailTemplate'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/templates', getAllEmailTemplates);
router.post('/templates', createEmailTemplate);

/**
 * @swagger
 * /admin/emails/templates/{template_id}:
 *   get:
 *     summary: GET EMAIL TEMPLATE BY ID
 *     description: |
 *       Retrieve a specific email template by its ID.
 *       
 *       **Use this endpoint to:**
 *       - Load template for editing
 *       - Preview template content
 *       - Use template for email composition
 *     tags: [Email Management]
 *     parameters:
 *       - name: template_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Template UUID
 *         example: "template-uuid-123"
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *         example: "admin-user-id-123"
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EmailTemplate'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: UPDATE EMAIL TEMPLATE
 *     description: |
 *       Update an existing email template.
 *       
 *       **Updatable Fields:**
 *       - name: Template name
 *       - subject: Email subject
 *       - body: Email body HTML
 *       - category: Template category
 *       - isActive: Active status
 *       
 *       **Protected Fields (cannot update):**
 *       - template_id: Template UUID
 *       - createdBy: Creator user ID
 *       - usageCount: Usage counter
 *     tags: [Email Management]
 *     parameters:
 *       - name: template_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Template UUID
 *         example: "template-uuid-123"
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *         example: "admin-user-id-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTemplateRequest'
 *           example:
 *             name: "Updated Welcome Template"
 *             subject: "Welcome to Dream60 - Start Your Journey!"
 *             body: "<h1>Updated content...</h1>"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/EmailTemplate'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: DELETE EMAIL TEMPLATE
 *     description: |
 *       Permanently delete an email template.
 *       
 *       **Warning:**
 *       - This action is permanent and cannot be undone
 *       - Template will be removed from database
 *       - Usage history is not deleted
 *       
 *       **Use this endpoint to:**
 *       - Remove obsolete templates
 *       - Clean up template library
 *     tags: [Email Management]
 *     parameters:
 *       - name: template_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Template UUID
 *         example: "template-uuid-123"
 *       - name: user_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *         example: "admin-user-id-123"
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin privileges required
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.get('/templates/:template_id', getEmailTemplateById);
router.put('/templates/:template_id', updateEmailTemplate);
router.delete('/templates/:template_id', deleteEmailTemplate);

module.exports = router;
