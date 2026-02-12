// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();
const EmailTemplate = require('../models/EmailTemplate');

const darkBrandStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background-color: #050505; 
    font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
    margin: 0; 
    padding: 20px; 
    color: #ffffff; 
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px 0;
  }
  .card { 
    background-color: #0d0d0d; 
    border: 1px solid rgba(124, 58, 237, 0.2); 
    border-radius: 24px; 
    overflow: hidden; 
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); 
  }
  .header { 
    padding: 40px 40px 30px; 
    text-align: center;
    background: linear-gradient(180deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0) 100%);
  }
  .logo-wrapper {
    margin-bottom: 20px;
  }
  .logo-img {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: linear-gradient(135deg, #7C3AED 0%, #C026D3 100%);
    padding: 12px;
    display: inline-block;
  }
  .brand-text {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -1px;
    margin: 0;
    background: linear-gradient(to right, #ffffff, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .status-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(124, 58, 237, 0.15);
    border: 1px solid rgba(124, 58, 237, 0.3);
    border-radius: 99px;
    color: #a78bfa;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 12px;
  }
  .content { 
    padding: 0 40px 40px; 
  }
  .hero-title { 
    font-size: 28px; 
    font-weight: 800; 
    color: #ffffff; 
    margin-bottom: 16px; 
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .hero-text { 
    font-size: 16px; 
    color: #9ca3af; 
    line-height: 1.6; 
    margin-bottom: 24px; 
  }
  .feature-box { 
    background: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255, 255, 255, 0.08); 
    border-radius: 20px; 
    padding: 32px; 
    margin: 24px 0; 
    text-align: center;
  }
  .feature-label {
    font-size: 13px;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .feature-value {
    font-size: 40px;
    font-weight: 900;
    color: #ffffff;
    margin: 0;
    letter-spacing: -1px;
  }
  .feature-sub {
    font-size: 14px;
    color: #6b7280;
    margin-top: 8px;
  }
  .otp-code { 
    font-family: 'Courier New', monospace;
    font-size: 48px; 
    font-weight: 800; 
    letter-spacing: 12px; 
    color: #ffffff; 
    background: rgba(124, 58, 237, 0.1); 
    border: 2px dashed rgba(124, 58, 237, 0.4); 
    border-radius: 16px; 
    padding: 24px;
    margin: 20px 0;
    display: inline-block;
  }
    .action-button { 
      display: inline-block; 
      padding: 18px 36px; 
      background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); 
      color: #ffffff !important; 
      text-decoration: none; 
      border-radius: 14px; 
      font-weight: 700; 
      font-size: 16px;
      box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
      margin: 20px 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      overflow: hidden;
    }
    .data-table th {
      text-align: left;
      padding: 12px 16px;
      background: rgba(124, 58, 237, 0.1);
      color: #a78bfa;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .data-table td {
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #ffffff;
      font-size: 14px;
    }
    .winner-highlight {
      color: #fbbf24;
      font-weight: 700;
    }

  .info-grid { 
    display: table;
    width: 100%;
    border-collapse: separate;
    border-spacing: 10px;
    margin: 24px -10px;
  }
  .info-cell { 
    display: table-cell;
    background: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255, 255, 255, 0.06); 
    border-radius: 16px; 
    padding: 20px; 
    text-align: center;
    width: 33.33%;
  }
  .info-label { 
    font-size: 11px; 
    color: #6b7280; 
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px; 
    font-weight: 600;
  }
  .info-value { 
    font-size: 16px; 
    font-weight: 700; 
    color: #ffffff; 
  }
  .alert-box {
    border-radius: 16px;
    padding: 20px;
    margin: 24px 0;
  }
  .alert-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  .alert-success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .alert-title {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .alert-warning .alert-title { color: #f59e0b; }
  .alert-success .alert-title { color: #10b981; }
  .alert-desc {
    font-size: 13px;
    color: #9ca3af;
    line-height: 1.4;
  }
  .footer { 
    padding: 40px; 
    background-color: #080808;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  .footer-nav {
    margin-bottom: 24px;
  }
  .footer-link { 
    color: #6b7280; 
    font-size: 13px;
    text-decoration: none; 
    margin: 0 12px;
  }
  .footer-link:hover {
    color: #7c3aed;
  }
  .copyright {
    color: #4b5563;
    font-size: 12px;
  }
  /* Winner Special Styling */
  .winner-card {
    border: 2px solid #fbbf24;
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.15);
  }
  .winner-header {
    background: linear-gradient(180deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0) 100%);
  }
  .winner-badge {
    background: #fbbf24;
    color: #000;
    padding: 6px 16px;
    border-radius: 99px;
    font-weight: 800;
    font-size: 12px;
    text-transform: uppercase;
    margin-top: 12px;
    display: inline-block;
  }
  .winner-amount {
    color: #fbbf24;
  }
`;

const lightBrandStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background-color: #f3f4f6; 
    font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
    margin: 0; 
    padding: 20px; 
    color: #1f2937; 
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px 0;
  }
  .card { 
    background-color: #ffffff; 
    border: 1px solid rgba(124, 58, 237, 0.2); 
    border-radius: 24px; 
    overflow: hidden; 
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); 
  }
  .header { 
    padding: 40px 40px 30px; 
    text-align: center;
    background: linear-gradient(180deg, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0) 100%);
  }
  .logo-wrapper {
    margin-bottom: 20px;
  }
  .logo-emoji {
    font-size: 64px;
    line-height: 1;
    display: inline-block;
  }
  .brand-text {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -1px;
    margin: 0;
    background: linear-gradient(to right, #7c3aed, #c026d3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .status-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(124, 58, 237, 0.1);
    border: 1px solid rgba(124, 58, 237, 0.2);
    border-radius: 99px;
    color: #7c3aed;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 12px;
  }
  .content { 
    padding: 0 40px 40px; 
  }
  .hero-title { 
    font-size: 28px; 
    font-weight: 800; 
    color: #1f2937; 
    margin-bottom: 16px; 
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .hero-text { 
    font-size: 16px; 
    color: #6b7280; 
    line-height: 1.6; 
    margin-bottom: 24px; 
  }
  .feature-box { 
    background: #f9fafb; 
    border: 1px solid #e5e7eb; 
    border-radius: 20px; 
    padding: 32px; 
    margin: 24px 0; 
    text-align: center;
  }
  .feature-label {
    font-size: 13px;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .feature-value {
    font-size: 40px;
    font-weight: 900;
    color: #1f2937;
    margin: 0;
    letter-spacing: -1px;
  }
  .feature-sub {
    font-size: 14px;
    color: #9ca3af;
    margin-top: 8px;
  }
  .otp-code { 
    font-family: 'Courier New', monospace;
    font-size: 48px; 
    font-weight: 800; 
    letter-spacing: 12px; 
    color: #7c3aed; 
    background: rgba(124, 58, 237, 0.08); 
    border: 2px dashed rgba(124, 58, 237, 0.3); 
    border-radius: 16px; 
    padding: 24px;
    margin: 20px 0;
    display: inline-block;
  }
    .action-button { 
      display: inline-block; 
      padding: 18px 36px; 
      background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); 
      color: #ffffff !important; 
      text-decoration: none; 
      border-radius: 14px; 
      font-weight: 700; 
      font-size: 16px;
      box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
      margin: 20px 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #f9fafb;
      border-radius: 12px;
      overflow: hidden;
    }
    .data-table th {
      text-align: left;
      padding: 12px 16px;
      background: rgba(124, 58, 237, 0.08);
      color: #7c3aed;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .data-table td {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
      font-size: 14px;
    }
    .winner-highlight {
      color: #d97706;
      font-weight: 700;
    }

  .info-grid { 
    display: table;
    width: 100%;
    border-collapse: separate;
    border-spacing: 10px;
    margin: 24px -10px;
  }
  .info-cell { 
    display: table-cell;
    background: #f9fafb; 
    border: 1px solid #e5e7eb; 
    border-radius: 16px; 
    padding: 20px; 
    text-align: center;
    width: 33.33%;
  }
  .info-label { 
    font-size: 11px; 
    color: #9ca3af; 
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px; 
    font-weight: 600;
  }
  .info-value { 
    font-size: 16px; 
    font-weight: 700; 
    color: #1f2937; 
  }
  .alert-box {
    border-radius: 16px;
    padding: 20px;
    margin: 24px 0;
  }
  .alert-warning {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  .alert-success {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .alert-title {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .alert-warning .alert-title { color: #d97706; }
  .alert-success .alert-title { color: #059669; }
  .alert-desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
  }
  .footer { 
    padding: 40px; 
    background-color: #f9fafb;
    text-align: center;
    border-top: 1px solid #e5e7eb;
  }
  .footer-nav {
    margin-bottom: 24px;
  }
  .footer-link { 
    color: #6b7280; 
    font-size: 13px;
    text-decoration: none; 
    margin: 0 12px;
  }
  .footer-link:hover {
    color: #7c3aed;
  }
  .copyright {
    color: #9ca3af;
    font-size: 12px;
  }
  /* Winner Special Styling */
  .winner-card {
    border: 2px solid #fbbf24;
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.15);
  }
  .winner-header {
    background: linear-gradient(180deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0) 100%);
  }
  .winner-badge {
    background: #fbbf24;
    color: #000;
    padding: 6px 16px;
    border-radius: 99px;
    font-weight: 800;
    font-size: 12px;
    text-transform: uppercase;
    margin-top: 12px;
    display: inline-block;
  }
  .winner-amount {
    color: #d97706;
  }
`;

const activeBrandStyles = darkBrandStyles;

// Global transporter instances
let transporterInstance = null;
let supportTransporterInstance = null;
let contactTransporterInstance = null;
let templateCache = new Map();

// Create reusable transporter with pooling for better performance
  const createTransporter = () => {
    if (!transporterInstance) {
      const port = parseInt(process.env.EMAIL_PORT || '465');
      transporterInstance = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.zoho.in',
        port,
        secure: port === 465,
      pool: true,
      maxConnections: 10,
      maxMessages: Infinity,
      rateDelta: 1000,
      rateLimit: 10,
      socketTimeout: 30000,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporterInstance;
};

// Create support transporter using noreply@dream60.com credentials
const createSupportTransporter = () => {
  if (!supportTransporterInstance) {
    const port = parseInt(process.env.EMAIL_PORT || '465');
    supportTransporterInstance = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.zoho.in',
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: Infinity,
      rateDelta: 1000,
      rateLimit: 10,
      socketTimeout: 30000,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      auth: {
        user: process.env.EMAIL_SUPPORT_USER,
        pass: process.env.EMAIL_SUPPORT_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return supportTransporterInstance;
};

// Create contact transporter using support@dream60.com (EMAIL_CONTACT_USER)
const createContactTransporter = () => {
  if (!contactTransporterInstance) {
    const port = parseInt(process.env.EMAIL_PORT || '465');
    contactTransporterInstance = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.zoho.in',
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: Infinity,
      rateDelta: 1000,
      rateLimit: 10,
      socketTimeout: 30000,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      auth: {
        user: process.env.EMAIL_CONTACT_USER,
        pass: process.env.EMAIL_CONTACT_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return contactTransporterInstance;
};

const getPrimaryClientUrl = () => {
  // Always prioritize the environment variables, fallback to test domain
  const raw = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://test.dream60.com';
  // Take first if it's a list (some configs might have multiple)
  return raw.split(',')[0].trim().replace(/\/$/, '');
};

const buildEmailTemplate = ({ primaryClientUrl, title, status, bodyHtml, isWinner = false }) => {
  const baseUrl = primaryClientUrl;
  const termsHref = `${baseUrl}/terms`;
  const privacyHref = `${baseUrl}/privacy`;
  const supportHref = `${baseUrl}/support`;
  const contactHref = `${baseUrl}/contact`;
  const logoUrl = `${baseUrl}/icons/icon-192x192.png`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>${activeBrandStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="card ${isWinner ? 'winner-card' : ''}">
          <div class="header ${isWinner ? 'winner-header' : ''}">
            <div class="logo-wrapper">
              <div class="logo-img">
                <img src="${logoUrl}" alt="D60" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
            </div>
            <h1 class="brand-text">Dream60</h1>
            ${isWinner ? `<div class="winner-badge">CHAMPION</div>` : `<div class="status-badge">${status || title}</div>`}
          </div>
          <div class="content">
            ${bodyHtml}
          </div>
          <div class="footer">
            <div class="footer-nav">
              <a href="${supportHref}" class="footer-link">Help</a>
              <a href="${contactHref}" class="footer-link">Contact</a>
              <a href="${termsHref}" class="footer-link">Terms</a>
              <a href="${privacyHref}" class="footer-link">Privacy</a>
            </div>
            <p class="copyright">© ${new Date().getFullYear()} Dream60. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get template from database by name with caching
 */
const getTemplateByName = async (templateName) => {
  const cacheKey = templateName.toLowerCase();
  const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Use cache if available (5 minute TTL)
  const cached = templateCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 300000)) {
    return cached.data;
  }

  try {
    let template = null;
    const escapedName = escapeRegex(templateName);
    const exactMatchQuery = {
      $or: [
        { name: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
        { slug: { $regex: new RegExp(`^${escapedName}$`, 'i') } }
      ],
      isActive: true
    };

    // Special handling for OTP verification
    if (cacheKey === 'otp verification') {
      template = await EmailTemplate.findOne({ 
        $or: [
          { _id: '6970bbcb23cce053a4f63b55' },
          ...exactMatchQuery.$or
        ],
        isActive: true 
      }).lean();
    } else {
      template = await EmailTemplate.findOne(exactMatchQuery).lean();
    }

    if (!template) {
      template = await EmailTemplate.findOne({
        $or: [
          { name: { $regex: new RegExp(escapedName, 'i') } },
          { slug: { $regex: new RegExp(escapedName, 'i') } }
        ],
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
 * Supports both {{variable}} and [variable] formats (database templates use [Name] style)
 */
const replaceTemplateVariables = (text, variables) => {
  if (!text || !variables) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const val = value !== undefined && value !== null ? String(value) : '';
    // Support {{variable}} format
    const bracesRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(bracesRegex, val);
    // Support [variable] format (used in database templates)
    const bracketsRegex = new RegExp(`\\[${key}\\]`, 'gi');
    result = result.replace(bracketsRegex, val);
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
    const template = await getTemplateByName('OTP Verification');

    if (!template) {
      console.warn('Template "OTP Verification" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const variables = { 
      otp, OTP: otp,
      reason, Reason: reason,
      reason_lower: reason.toLowerCase()
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
  } catch (error) {
    console.error('❌ OTP email error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, username) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const primaryClientUrl = getPrimaryClientUrl();
    
    const template = await getTemplateByName('Welcome Email');

    if (!template) {
      console.warn('Template "Welcome Email" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const variables = { 
      username, Username: username, name: username, Name: username,
      dashboard_url: primaryClientUrl 
    };
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
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    return { success: false };
  }
};

/**
 * Send Prize Claim Winner Email (Rank 1)
 */
const sendPrizeClaimWinnerEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const { username, auctionName, prizeAmount, claimDeadline, paymentAmount } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    
    // DB template name: "Prize Winner (Rank #1)"
    const template = await getTemplateByName('Prize Winner (Rank #1)');

    if (!template) {
      console.warn('Template "Prize Winner (Rank #1)" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const variables = { 
      username, Username: username, name: username, Name: username,
      auctionName, AuctionName: auctionName,
      prizeAmount: prizeAmount.toLocaleString('en-IN'),
      PrizeAmount: prizeAmount.toLocaleString('en-IN'),
      claimDeadline: new Date(claimDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      ClaimDeadline: new Date(claimDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      paymentAmount: paymentAmount ? paymentAmount.toLocaleString('en-IN') : '',
      PaymentAmount: paymentAmount ? paymentAmount.toLocaleString('en-IN') : '',
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
  } catch (error) {
    console.error('❌ Winner email error:', error);
    return { success: false };
  }
};

/**
 * Send Waiting Queue Email (Rank 2 & 3)
 */
const sendWaitingQueueEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const { username, auctionName, rank, prizeAmount } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    
    // DB template name: "Waiting Queue (Rank #2 & #3)"
    const template = await getTemplateByName('Waiting Queue (Rank #2 & #3)');

    if (!template) {
      console.warn('Template "Waiting Queue (Rank #2 & #3)" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const variables = { 
      username, Username: username, name: username, Name: username,
      auctionName, AuctionName: auctionName,
      rank, Rank: rank,
      prizeAmount: prizeAmount.toLocaleString('en-IN'),
      PrizeAmount: prizeAmount.toLocaleString('en-IN'),
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
  } catch (error) {
    console.error('❌ Queue email error:', error);
    return { success: false };
  }
};

/**
 * Send Password Change Email
 */
const sendPasswordChangeEmail = async (email, username) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const primaryClientUrl = getPrimaryClientUrl();
    
    const template = await getTemplateByName('Password Changed');

    if (!template) {
      console.warn('Template "Password Changed" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const variables = { 
      username, Username: username, name: username, Name: username,
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
  } catch (error) {
    console.error('❌ Password email error:', error);
    return { success: false };
  }
};

/**
 * Send Winners Announcement Email
 */
const sendWinnersAnnouncementEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const { username, auctionName, prizeAmount, rank } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    
    const template = await getTemplateByName('Auction Results');

    if (!template) {
      console.warn('Template "Auction Results" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const status = rank === 1 ? 'Winner' : rank <= 3 ? 'Waiting List' : 'Participation';
    const variables = { 
      username, Username: username, name: username, Name: username,
      auctionName, AuctionName: auctionName,
      rank, Rank: rank,
      prizeAmount: prizeAmount.toLocaleString('en-IN'),
      PrizeAmount: prizeAmount.toLocaleString('en-IN'),
      status, Status: status,
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
  } catch (error) {
    console.error('❌ Results email error:', error);
    return { success: false };
  }
};

/**
 * Send Prize Claimed Confirmation Email
 */
const sendPrizeClaimedEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const { username, auctionName, prizeAmount, claimDate, transactionId, rewardType, paymentAmount } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    
    // DB template name: "Prize claim"
    const template = await getTemplateByName('Prize claim');

    if (!template) {
      console.warn('Template "Prize claim" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const formattedDate = new Date(claimDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const formattedPayment = paymentAmount ? paymentAmount.toLocaleString('en-IN') : '0';
    const variables = { 
      username, Username: username, name: username, Name: username,
      auctionName, AuctionName: auctionName,
      prizeAmount: prizeAmount.toLocaleString('en-IN'),
      PrizeAmount: prizeAmount.toLocaleString('en-IN'),
      claimDate: formattedDate, ClaimDate: formattedDate,
      transactionId: transactionId || 'N/A', TransactionId: transactionId || 'N/A',
      rewardType: rewardType || 'Amazon Voucher', RewardType: rewardType || 'Amazon Voucher',
      paymentAmount: formattedPayment, PaymentAmount: formattedPayment,
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
  } catch (error) {
    console.error('❌ Prize claimed email error:', error);
    return { success: false };
  }
};

/**
 * Send Support Receipt Email
 * DB template name: "Support Request Received"
 */
const sendSupportReceiptEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_SUPPORT_USER || !process.env.EMAIL_SUPPORT_PASSWORD) {
      console.warn('⚠️ Support email credentials (EMAIL_SUPPORT_USER) not configured.');
      return { success: false, message: 'Support email service not configured' };
    }

    const transporter = createSupportTransporter();
    const { username, topic, ticketId } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    const generatedTicketId = ticketId || 'D60-' + Math.floor(Math.random() * 10000);
    const displayName = username || 'Valued Player';
    const displayTopic = topic || 'General Inquiry';
    
    // DB template name: "Support Request Received"
    const template = await getTemplateByName('Support Request Received');

    if (!template) {
      console.warn('Template "Support Request Received" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const variables = { 
      username: displayName, Username: displayName, name: displayName, Name: displayName,
      topic: displayTopic, Topic: displayTopic,
      ticketId: generatedTicketId, TicketId: generatedTicketId,
      support_url: `${primaryClientUrl}/support`
    };
    const subject = replaceTemplateVariables(template.subject, variables);
    const htmlBody = replaceTemplateVariables(template.body, variables);

    await EmailTemplate.findOneAndUpdate(
      { template_id: template.template_id },
      { $inc: { usageCount: 1 } }
    );

    const mailOptions = {
        from: `"Dream60 Support" <${process.env.EMAIL_SUPPORT_USER}>`,
        to: email,
        subject: subject,
        html: htmlBody,
      };

      const supportTransporter = createSupportTransporter();
      const info = await supportTransporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Support email error:', error);
      return { success: false };
    }
  };

/**
 * Send Custom Email
 */
const sendCustomEmail = async (recipients, subject, body, attachments = []) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

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
 * Send Amazon Voucher Email
 * DB template name: "amazon voucher"
 * Variables: {{username}}, {{voucherAmount}}, {{giftCardCode}}, {{paymentAmount}}, {{redeemLink}}
 */
const sendAmazonVoucherEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const { username, voucherAmount, giftCardCode, paymentAmount, redeemLink } = details;
    
    const template = await getTemplateByName('amazon voucher');

    if (!template) {
      console.warn('Template "amazon voucher" not found.');
      return { success: false, message: 'Email template not found' };
    }

    const variables = { 
      username, Username: username, name: username, Name: username,
      voucherAmount: voucherAmount ? voucherAmount.toLocaleString('en-IN') : '0',
      VoucherAmount: voucherAmount ? voucherAmount.toLocaleString('en-IN') : '0',
      giftCardCode: giftCardCode || 'N/A',
      GiftCardCode: giftCardCode || 'N/A',
      paymentAmount: paymentAmount ? paymentAmount.toLocaleString('en-IN') : '0',
      PaymentAmount: paymentAmount ? paymentAmount.toLocaleString('en-IN') : '0',
      redeemLink: redeemLink || 'https://www.amazon.in/gc/balance',
      redeem_link: redeemLink || 'https://www.amazon.in/gc/balance'
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
    console.log(`✅ [EMAIL] Amazon voucher sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Amazon voucher email error:', error);
    return { success: false };
  }
};

/**
 * Send email using database template
 */
  const sendEmailWithTemplate = async (email, templateName, variables = {}, options = {}) => {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️ Email credentials not configured.');
        return { success: false, message: 'Email service not configured' };
      }

      const transporter = createTransporter();
      const template = await getTemplateByName(templateName);

      if (!template) {
        console.warn(`Template "${templateName}" not found.`);
        return { success: false, message: 'Email template not found' };
      }

      const subject = replaceTemplateVariables(template.subject, variables);
      const body = replaceTemplateVariables(template.body, variables);

      await EmailTemplate.findOneAndUpdate(
        { template_id: template.template_id },
        { $inc: { usageCount: 1 } }
      );

      const mailOptions = {
        from: `"${options.fromName || 'Dream60'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        attachments: options.attachments || [],
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, usedTemplate: true };
    } catch (error) {
      console.error(`❌ Email with template "${templateName}" error:`, error);
      return { success: false, message: error.message };
    }
  };


/**
 * Send Support Reply Email from support@dream60.com
 */
const sendSupportReplyEmail = async (toEmail, subject, htmlBody, ticketId) => {
  try {
    if (!process.env.EMAIL_CONTACT_USER || !process.env.EMAIL_CONTACT_PASSWORD) {
      console.warn('⚠️ Contact email credentials (EMAIL_CONTACT_USER) not configured.');
      return { success: false, message: 'Contact email service not configured' };
    }

    const transporter = createContactTransporter();
    const mailOptions = {
      from: `"Dream60 Support" <${process.env.EMAIL_CONTACT_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlBody,
      text: htmlBody.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL] Support reply sent to ${toEmail} for ticket ${ticketId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Support reply email error:', error);
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
  sendAmazonVoucherEmail,
  sendEmailWithTemplate,
  sendSupportReplyEmail,
  getTemplateByName,
  replaceTemplateVariables,
  buildEmailTemplate,
  getPrimaryClientUrl,
  brandStyles: activeBrandStyles,
};
