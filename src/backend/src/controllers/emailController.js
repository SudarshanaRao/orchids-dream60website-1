// src/controllers/emailController.js
const User = require('../models/user');
const EmailTemplate = require('../models/EmailTemplate');
const { sendCustomEmail } = require('../utils/emailService');

/**
 * Send Email to Selected Users
 */
const sendEmailToUsers = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { recipients, subject, body, templateId, theme } = req.body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required and must not be empty',
      });
    }

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required',
      });
    }

    // Fetch user emails from user_ids
    const users = await User.find({ user_id: { $in: recipients }, isDeleted: false });
    const emails = users.map(u => u.email).filter(e => e);

    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid email addresses found for selected users',
      });
    }

    // Send emails with theme support
    const results = [];
    for (const email of emails) {
      const result = await sendCustomEmail(email, subject, body, [], theme || 'dark');
      results.push({
        email,
        success: result.success,
        message: result.message,
      });
    }

    // Update template usage count if template was used
    if (templateId) {
      await EmailTemplate.findOneAndUpdate(
        { template_id: templateId },
        { $inc: { usageCount: 1 } }
      );
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Emails sent: ${successCount} succeeded, ${failureCount} failed`,
      data: {
        totalSent: successCount,
        totalFailed: failureCount,
        results,
      },
    });
  } catch (err) {
    console.error('Send Email to Users Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create Email Template
 */
const createEmailTemplate = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { name, subject, body, category } = req.body;

    // Validate required fields
    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Name, subject, and body are required',
      });
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      body,
      category: category || 'CUSTOM',
      createdBy: adminUser.user_id,
    });

    return res.status(201).json({
      success: true,
      message: 'Email template created successfully',
      data: template,
    });
  } catch (err) {
    console.error('Create Email Template Error:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map((v) => v.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get All Email Templates
 */
const getAllEmailTemplates = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { page = 1, limit = 20, category, isActive } = req.query;
    
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (typeof isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }

    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (p - 1) * l;

    const [templates, total] = await Promise.all([
      EmailTemplate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .lean(),
      EmailTemplate.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: templates,
      meta: {
        total,
        page: p,
        limit: l,
        pages: Math.ceil(total / l),
      },
    });
  } catch (err) {
    console.error('Get All Email Templates Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get Email Template by ID
 */
const getEmailTemplateById = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { template_id } = req.params;

    const template = await EmailTemplate.findOne({ template_id }).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error('Get Email Template By ID Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update Email Template
 */
const updateEmailTemplate = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { template_id } = req.params;
    const updates = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updates.template_id;
    delete updates.createdBy;
    delete updates.usageCount;

    const template = await EmailTemplate.findOneAndUpdate(
      { template_id },
      updates,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email template updated successfully',
      data: template,
    });
  } catch (err) {
    console.error('Update Email Template Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Email Template
 */
const deleteEmailTemplate = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { template_id } = req.params;

    const template = await EmailTemplate.findOneAndDelete({ template_id });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email template deleted successfully',
    });
  } catch (err) {
    console.error('Delete Email Template Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

  /**
   * Get Public Email Templates (No Admin Check)
   */
  const getPublicEmailTemplates = async (req, res) => {
    try {
      const { page = 1, limit = 20, category, isActive } = req.query;
      
      const query = {};
      
      if (category) {
        query.category = category;
      }
      
      if (typeof isActive !== 'undefined') {
        query.isActive = isActive === 'true';
      }

      const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const p = Math.max(parseInt(page, 10) || 1, 1);
      const skip = (p - 1) * l;

      const [templates, total] = await Promise.all([
        EmailTemplate.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l)
          .lean(),
        EmailTemplate.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: templates,
        meta: {
          total,
          page: p,
          limit: l,
          pages: Math.ceil(total / l),
        },
      });
    } catch (err) {
      console.error('Get Public Email Templates Error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  module.exports = {
    sendEmailToUsers,
    createEmailTemplate,
    getAllEmailTemplates,
    getEmailTemplateById,
    updateEmailTemplate,
    deleteEmailTemplate,
    getPublicEmailTemplates,
  };

