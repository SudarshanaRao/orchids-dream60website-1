// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();
const EmailTemplate = require('../models/EmailTemplate');

// Global transporter instance
let transporterInstance = null;
let templateCache = new Map();

// Official Template Slugs from database
const TEMPLATE_SLUGS = {
  OTP: 'otp',
  WELCOME: 'welcome',
  WINNER_RANK_1: 'winner-rank-1',
  WAITING_QUEUE: 'waiting-queue',
  PASSWORD_CHANGED: 'password-changed',
  AUCTION_RESULTS: 'auction-results',
  PRIZE_CLAIM: 'prize-claim',
  SUPPORT_TICKET: 'support-ticket',
  MARKETING: 'marketing'
};

// Official Template IDs from database (Source of Truth)
const TEMPLATE_IDS = {
  OTP: 'd8b8202a-747c-45e2-a24b-ada0c1876bf2',
  WELCOME: '7df3280e-8982-4284-80d8-f92713c6a361',
  WINNER_RANK_1: 'b30cdfbd-a37e-49cc-9155-6456634d2c46',
  WAITING_QUEUE: '66dc01a3-9d2f-4cd7-9f9f-3d8685e3d52e',
  PASSWORD_CHANGED: '33f8ad7d-0550-480a-aa1b-41bd89cb682d',
  AUCTION_RESULTS: '3d0f9f1a-596c-4855-a5f6-2992e9eb728a',
  PRIZE_CLAIM: '2d60f3df-6278-49b1-94e8-e5b67214ce73',
  SUPPORT_TICKET: '9acdff1b-81fb-43a8-8c5a-28d015e6bb81',
  MARKETING: '3d01e12d-b21d-4b7b-83c5-4295048ec487'
};

// Create reusable transporter with pooling for better performance
const createTransporter = () => {
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      pool: true, // Enable connection pooling
      maxConnections: 10, // Increased for better throughput
      maxMessages: Infinity,
      rateDelta: 1000,
      rateLimit: 10, // Increased rate limit
      socketTimeout: 30000, // 30 seconds timeout
      connectionTimeout: 15000, // 15 seconds connection timeout
      greetingTimeout: 15000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
  }
  return transporterInstance;
};

const getPrimaryClientUrl = () => {
  // Always prioritize the environment variables, fallback to test domain
  const raw = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://test.dream60.com';
  // Take first if it's a list (some configs might have multiple)
  return raw.split(',')[0].trim().replace(/\/$/, '');
};


/**
 * Get template from database by template_id with caching
 */
const getTemplateById = async (templateId) => {
  if (!templateId) return null;
  
  const cacheKey = `id:${templateId}`;
  
  // Use cache if available (5 minute TTL)
  const cached = templateCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 300000)) {
    return cached.data;
  }

  try {
    const template = await EmailTemplate.findOne({ 
      template_id: templateId, 
      isActive: true 
    }).lean();
    
    if (template) {
      templateCache.set(cacheKey, { data: template, timestamp: Date.now() });
    }
    return template;
  } catch (error) {
    console.error(`Failed to fetch template by ID "${templateId}":`, error);
    return null;
  }
};

/**
 * Get template from database by name with caching
 */
const getTemplateByName = async (templateName) => {
  if (!templateName) return null;

  // If it looks like a UUID, try fetching by ID first
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(templateName)) {
    return await getTemplateById(templateName);
  }

  const cacheKey = `name:${templateName.toLowerCase()}`;
  
  // Use cache if available (5 minute TTL)
  const cached = templateCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 300000)) {
    return cached.data;
  }

  try {
    let template = null;
    
    // 1. Try by Slug first (Newest method)
    template = await EmailTemplate.findOne({ 
      slug: templateName.toLowerCase(), 
      isActive: true 
    }).lean();

    // 2. Try by Name (Legacy method)
    if (!template) {
      template = await EmailTemplate.findOne({ 
        name: { $regex: new RegExp(`^${templateName}$`, 'i') }, 
        isActive: true 
      }).lean();
    }
    
    if (template) {
      templateCache.set(cacheKey, { data: template, timestamp: Date.now() });
    }
    return template;
  } catch (error) {
    console.error(`Failed to fetch template "${templateName}":`, error);
    return null;
  }
};

/**
 * Replace template variables with actual values
 */
const replaceTemplateVariables = (text, variables) => {
  if (!text || !variables) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value !== undefined && value !== null ? String(value) : '');
  }
  return result;
};

/**
 * Send OTP Email
 */
const sendOtpEmail = async (email, otp, reason = 'Verification') => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const primaryClientUrl = getPrimaryClientUrl();
    
    const template = await getTemplateById(TEMPLATE_IDS.OTP);
    
    if (!template) {
      console.warn(`⚠️ OTP Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.OTP);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: OTP Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendOtpEmailWithTemplate(email, fallbackTemplate, otp, reason);
    }

    return sendOtpEmailWithTemplate(email, template, otp, reason);
  } catch (error) {
    console.error('❌ OTP email error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Helper to send OTP email with a loaded template
 */
const sendOtpEmailWithTemplate = async (email, template, otp, reason) => {
  const transporter = createTransporter();
  const variables = { otp, reason, reason_lower: reason.toLowerCase() };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60 Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, username) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const template = await getTemplateById(TEMPLATE_IDS.WELCOME);
    
    if (!template) {
      console.warn(`⚠️ Welcome Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.WELCOME);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: Welcome Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendWelcomeEmailWithTemplate(email, fallbackTemplate, username);
    }

    return sendWelcomeEmailWithTemplate(email, template, username);
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    return { success: false };
  }
};

/**
 * Helper to send Welcome email with a loaded template
 */
const sendWelcomeEmailWithTemplate = async (email, template, username) => {
  const transporter = createTransporter();
  const primaryClientUrl = getPrimaryClientUrl();
  const variables = { username, dashboard_url: primaryClientUrl };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Prize Claim Winner Email (Rank 1)
 */
const sendPrizeClaimWinnerEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const template = await getTemplateById(TEMPLATE_IDS.WINNER_RANK_1);
    
    if (!template) {
      console.warn(`⚠️ Winner Rank 1 Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.WINNER_RANK_1);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: Winner Rank 1 Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendPrizeClaimWinnerEmailWithTemplate(email, fallbackTemplate, details);
    }

    return sendPrizeClaimWinnerEmailWithTemplate(email, template, details);
  } catch (error) {
    console.error('❌ Winner email error:', error);
    return { success: false };
  }
};

/**
 * Helper to send Prize Claim Winner email with a loaded template
 */
const sendPrizeClaimWinnerEmailWithTemplate = async (email, template, details) => {
  const transporter = createTransporter();
  const { username, auctionName, prizeAmount, claimDeadline, paymentAmount } = details;
  const primaryClientUrl = getPrimaryClientUrl();
  
  const variables = { 
    username, 
    auctionName, 
    prizeAmount: prizeAmount.toLocaleString('en-IN'),
    claimDeadline: new Date(claimDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    paymentAmount: paymentAmount ? paymentAmount.toLocaleString('en-IN') : '',
    claim_url: `${primaryClientUrl}/history`
  };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60 Rewards" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Waiting Queue Email (Rank 2 & 3)
 */
const sendWaitingQueueEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const template = await getTemplateById(TEMPLATE_IDS.WAITING_QUEUE);
    
    if (!template) {
      console.warn(`⚠️ Waiting Queue Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.WAITING_QUEUE);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: Waiting Queue Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendWaitingQueueEmailWithTemplate(email, fallbackTemplate, details);
    }

    return sendWaitingQueueEmailWithTemplate(email, template, details);
  } catch (error) {
    console.error('❌ Queue email error:', error);
    return { success: false };
  }
};

/**
 * Helper to send Waiting Queue email with a loaded template
 */
const sendWaitingQueueEmailWithTemplate = async (email, template, details) => {
  const transporter = createTransporter();
  const { username, auctionName, rank, prizeAmount } = details;
  const primaryClientUrl = getPrimaryClientUrl();
  
  const variables = { 
    username, 
    auctionName, 
    rank,
    prizeAmount: prizeAmount.toLocaleString('en-IN'),
    status_url: `${primaryClientUrl}/history`
  };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60 Updates" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Password Change Email
 */
const sendPasswordChangeEmail = async (email, username) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const template = await getTemplateById(TEMPLATE_IDS.PASSWORD_CHANGED);
    
    if (!template) {
      console.warn(`⚠️ Password Change Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.PASSWORD_CHANGED);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: Password Change Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendPasswordChangeEmailWithTemplate(email, fallbackTemplate, username);
    }

    return sendPasswordChangeEmailWithTemplate(email, template, username);
  } catch (error) {
    console.error('❌ Password email error:', error);
    return { success: false };
  }
};

/**
 * Helper to send Password Change email with a loaded template
 */
const sendPasswordChangeEmailWithTemplate = async (email, template, username) => {
  const transporter = createTransporter();
  const primaryClientUrl = getPrimaryClientUrl();
  
  const variables = { 
    username, 
    reset_url: `${primaryClientUrl}/forgot-password`
  };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60 Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Winners Announcement Email
 */
const sendWinnersAnnouncementEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const template = await getTemplateById(TEMPLATE_IDS.AUCTION_RESULTS);
    
    if (!template) {
      console.warn(`⚠️ Auction Results Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.AUCTION_RESULTS);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: Auction Results Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendWinnersAnnouncementEmailWithTemplate(email, fallbackTemplate, details);
    }

    return sendWinnersAnnouncementEmailWithTemplate(email, template, details);
  } catch (error) {
    console.error('❌ Results email error:', error);
    return { success: false };
  }
};

/**
 * Helper to send Winners Announcement email with a loaded template
 */
const sendWinnersAnnouncementEmailWithTemplate = async (email, template, details) => {
  const transporter = createTransporter();
  const { username, auctionName, prizeAmount, rank } = details;
  const primaryClientUrl = getPrimaryClientUrl();
  
  const variables = { 
    username, 
    auctionName, 
    rank,
    prizeAmount: prizeAmount.toLocaleString('en-IN'),
    status: rank === 1 ? 'Winner' : rank <= 3 ? 'Waiting List' : 'Participation',
    leaderboard_url: `${primaryClientUrl}/history`
  };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60 Results" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Prize Claimed Confirmation Email
 */
const sendPrizeClaimedEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const template = await getTemplateById(TEMPLATE_IDS.PRIZE_CLAIM);
    
    if (!template) {
      console.warn(`⚠️ Prize Claim Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.PRIZE_CLAIM);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: Prize Claim Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendPrizeClaimedEmailWithTemplate(email, fallbackTemplate, details);
    }

    return sendPrizeClaimedEmailWithTemplate(email, template, details);
  } catch (error) {
    console.error('❌ Prize claimed email error:', error);
    return { success: false };
  }
};

/**
 * Helper to send Prize Claimed email with a loaded template
 */
const sendPrizeClaimedEmailWithTemplate = async (email, template, details) => {
  const transporter = createTransporter();
  const { username, auctionName, prizeAmount, claimDate, transactionId, rewardType } = details;
  const primaryClientUrl = getPrimaryClientUrl();
  
  const variables = { 
    username, 
    auctionName, 
    prizeAmount: prizeAmount.toLocaleString('en-IN'),
    claimDate: new Date(claimDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    transactionId: transactionId || 'N/A',
    rewardType: rewardType || 'Cash Prize',
    history_url: `${primaryClientUrl}/history`
  };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60 Rewards" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ [EMAIL] Prize claimed confirmation sent to ${email}`);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Support Receipt Email
 */
const sendSupportReceiptEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const template = await getTemplateById(TEMPLATE_IDS.SUPPORT_TICKET);
    
    if (!template) {
      console.warn(`⚠️ Support Ticket Template not found by ID, trying by slug...`);
      const fallbackTemplate = await getTemplateByName(TEMPLATE_SLUGS.SUPPORT_TICKET);
      if (!fallbackTemplate) {
        console.error(`❌ CRITICAL: Support Ticket Template not found in database!`);
        return { success: false, message: 'Email template not found' };
      }
      return sendSupportReceiptEmailWithTemplate(email, fallbackTemplate, details);
    }

    return sendSupportReceiptEmailWithTemplate(email, template, details);
  } catch (error) {
    console.error('❌ Support email error:', error);
    return { success: false };
  }
};

/**
 * Helper to send Support Receipt email with a loaded template
 */
const sendSupportReceiptEmailWithTemplate = async (email, template, details) => {
  const transporter = createTransporter();
  const { username, topic, ticketId } = details;
  const primaryClientUrl = getPrimaryClientUrl();
  const generatedTicketId = ticketId || 'D60-' + Math.floor(Math.random() * 10000);
  
  const variables = { 
    username: username || 'Valued Player', 
    topic: topic || 'General Inquiry',
    ticketId: generatedTicketId,
    support_url: `${primaryClientUrl}/support`
  };
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlBody = replaceTemplateVariables(template.body, variables);
  
  await EmailTemplate.findOneAndUpdate(
    { template_id: template.template_id },
    { $inc: { usageCount: 1 } }
  );

  const mailOptions = {
    from: `"Dream60 Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Send Custom Email
 */
const sendCustomEmail = async (recipients, subject, body, attachments = [], theme = 'dark') => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    
    // ✅ MODIFIED: We no longer wrap the body in hardcoded HTML. 
    // We use the body as provided, assuming it's either a pure string or a full template.
    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: recipientList.join(', '),
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ''),
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, recipientCount: recipientList.length };
  } catch (error) {
    console.error('❌ Custom email error:', error);
    return { success: false };
  }
};

/**
 * Send email using database template
 */
const sendEmailWithTemplate = async (email, templateName, variables = {}, fallbackSubject = '', fallbackBody = '') => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const primaryClientUrl = getPrimaryClientUrl();
    
    const template = await getTemplateByName(templateName);
    
    let subject, body;
    
    if (template) {
      subject = replaceTemplateVariables(template.subject, variables);
      body = replaceTemplateVariables(template.body, variables);
      
      await EmailTemplate.findOneAndUpdate(
        { template_id: template.template_id },
        { $inc: { usageCount: 1 } }
      );
    } else {
      console.warn(`Template "${templateName}" not found, using fallback.`);
      subject = fallbackSubject;
      body = fallbackBody;
    }

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, usedTemplate: !!template };
  } catch (error) {
    console.error(`❌ Email with template "${templateName}" error:`, error);
    return { success: false, message: error.message };
  }
};

  module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPrizeClaimWinnerEmail,
  sendPrizeClaimedEmail,
  sendWaitingQueueEmail,
  sendPasswordChangeEmail,
  sendWinnersAnnouncementEmail,
  sendSupportReceiptEmail,
  sendCustomEmail,
  sendEmailWithTemplate,
  getTemplateByName,
  replaceTemplateVariables,
  getPrimaryClientUrl,
};
