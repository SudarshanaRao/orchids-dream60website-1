// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const brandStyles = `
  * { box-sizing: border-box; }
  body { background: #f3ecff; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #120c1c; }
  .card { max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e6e0f5; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 45px rgba(104, 51, 168, 0.14); }
  .header { padding: 20px 24px; border-bottom: 1px solid #ece7fb; background: linear-gradient(135deg, #f7f2ff, #f0e8ff); }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #53317B, #6B3FA0, #8456BC); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(83, 49, 123, 0.25); }
  .logo img { width: 30px; height: 30px; }
  .brand-name { font-weight: 800; font-size: 18px; color: #3a2257; letter-spacing: 0.3px; }
  .brand-tagline { font-size: 12px; color: #6f5b8f; margin-top: 2px; }
  .tag { display: inline-flex; align-items: center; gap: 8px; background: #efe6ff; color: #5a2d91; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 999px; margin-top: 14px; }
  .content { padding: 24px; background: #ffffff; }
  .title { font-size: 20px; font-weight: 800; color: #2b1c42; margin: 0 0 12px; }
  .text { font-size: 15px; color: #3a3150; line-height: 1.6; margin: 0 0 12px; }
  .panel { background: #f8f5ff; border: 1px solid #e7def9; border-radius: 12px; padding: 16px; margin: 16px 0; }
  .otp { display: inline-block; padding: 14px 22px; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #2b1c42; background: #f3edff; border: 1px solid #e0d5fa; border-radius: 14px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }
  .stat { background: #f8f5ff; border: 1px solid #e7def9; border-radius: 12px; padding: 12px; }
  .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; color: #6f5b8f; margin-bottom: 6px; }
  .value { font-size: 18px; font-weight: 800; color: #27183f; }
  .cta { display: inline-block; margin-top: 12px; padding: 13px 20px; background: linear-gradient(135deg, #6B3FA0, #8456BC); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; box-shadow: 0 12px 30px rgba(104, 51, 168, 0.24); }
  .footer { padding: 16px 24px; border-top: 1px solid #ece7fb; background: #f8f5ff; font-size: 13px; color: #62507f; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .footer a { color: #5c2f92; font-weight: 700; text-decoration: none; }
  .divider { color: #c7b8e6; }
`;

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const getPrimaryClientUrl = () => {
  const raw = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://test.dream60.com';
  return raw.split(',')[0].trim().replace(/\/$/, '');
};

const buildEmailTemplate = ({ primaryClientUrl, title, subtitle, bodyHtml, termsUrl }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>${brandStyles}</style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">
            <div class="logo"><img src="${primaryClientUrl}/logo.svg" alt="Dream60" /></div>
            <div>
              <div class="brand-name">Dream60</div>
              <div class="brand-tagline">${subtitle}</div>
            </div>
          </div>
          <div class="tag">${title}</div>
        </div>
        <div class="content">${bodyHtml}</div>
        <div class="footer">
          <a href="mailto:${process.env.EMAIL_USER}">Contact support</a>
          <span class="divider">•</span>
          <a href="${termsUrl}" target="_blank" rel="noopener">Terms &amp; Conditions</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send OTP Email
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} - Email send result
 */
const sendOtpEmail = async (email, otp) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;

    const bodyHtml = `
      <p class="title">Your verification code</p>
      <p class="text">Use this one-time password to continue. It expires in 10 minutes.</p>
      <div class="panel"><span class="otp">${otp}</span></div>
      <p class="text">If you did not request this code, you can safely ignore this email.</p>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dream60: Your One-Time Password',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Account Security', subtitle: 'Secure verification code', bodyHtml, termsUrl }),
      text: `Your one-time password is ${otp}. It is valid for 10 minutes. If you did not request it, ignore this email. Support: ${process.env.EMAIL_USER}. Terms: ${termsUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'OTP email sent successfully',
    };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send email',
    };
  }
};

/**
 * Send Welcome Email
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<Object>} - Email send result
 */
const sendWelcomeEmail = async (email, username) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;

    const bodyHtml = `
      <p class="title">Welcome, ${username}</p>
      <p class="text">Thank you for joining Dream60. Your account is ready to use.</p>
      <div class="grid">
        <div class="stat"><div class="label">Compete</div><div class="value">Live auctions</div></div>
        <div class="stat"><div class="label">Track</div><div class="value">Bids & wins</div></div>
        <div class="stat"><div class="label">Updates</div><div class="value">Real-time alerts</div></div>
      </div>
      <a href="${primaryClientUrl}" class="cta" target="_blank" rel="noopener">Go to Dream60</a>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Dream60',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Account Created', subtitle: 'You are all set', bodyHtml, termsUrl }),
      text: `Hi ${username}, welcome to Dream60. Visit ${primaryClientUrl} to start. Support: ${process.env.EMAIL_USER}. Terms: ${termsUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Welcome email sent successfully',
    };
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send welcome email',
    };
  }
};

/**
 * Send Prize Claim Winner Email (Rank 1)
 * @param {string} email - Recipient email address
 * @param {Object} details - Prize details
 * @returns {Promise<Object>} - Email send result
 */
const sendPrizeClaimWinnerEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const { username, auctionName, prizeAmount, claimDeadline, upiId } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;

    const bodyHtml = `
      <p class="title">Congratulations on winning</p>
      <p class="text">Here are your prize details. Claim within 30 minutes.</p>
      <div class="panel">
        <div class="label">Prize Amount</div>
        <div class="value">₹${prizeAmount.toLocaleString('en-IN')}</div>
        <div class="text" style="margin:8px 0 0;">${auctionName}</div>
      </div>
      <div class="panel" style="background:#fff8ed; border-color:#f9e0b8; color:#8a4b00;">
        <div class="label" style="color:#b77713;">Claim deadline</div>
        <div class="value" style="color:#8a4b00;">${new Date(claimDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      </div>
      <div class="grid">
        <div class="stat"><div class="label">Auction</div><div class="value">${auctionName}</div></div>
        <div class="stat"><div class="label">Prize</div><div class="value">₹${prizeAmount.toLocaleString('en-IN')}</div></div>
        ${upiId ? `<div class="stat"><div class="label">UPI ID</div><div class="value">${upiId}</div></div>` : ''}
      </div>
      ${!upiId ? '<p class="text" style="color:#b91c1c; font-weight:700;">Add your UPI ID in your dashboard to receive the prize.</p>' : '<p class="text" style="color:#15803d; font-weight:700;">We will transfer the prize to your UPI ID within 24-48 hours.</p>'}
      <a href="${primaryClientUrl}/dashboard" class="cta" target="_blank" rel="noopener">${!upiId ? 'Claim prize' : 'View dashboard'}</a>
      <p class="text" style="margin-top:14px; color:#4b3a63; font-size:13px;">If the claim window closes, the prize moves to the next eligible participant.</p>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dream60 Prize Confirmation',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Prize confirmation', subtitle: 'You are Rank #1', bodyHtml, termsUrl }),
      text: `Hi ${username}, you won ₹${prizeAmount.toLocaleString('en-IN')} in ${auctionName}. Claim by ${new Date(claimDeadline).toLocaleString('en-IN')}. ${!upiId ? 'Add your UPI ID in your dashboard.' : 'Prize will be sent to ' + upiId + ' within 24-48 hours.'} Dashboard: ${primaryClientUrl}/dashboard. Terms: ${termsUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Prize claim winner email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Prize claim winner email sent successfully',
    };
  } catch (error) {
    console.error('❌ Prize claim winner email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send prize claim winner email',
    };
  }
};

/**
 * Send Waiting Queue Email (Rank 2 & 3)
 * @param {string} email - Recipient email address
 * @param {Object} details - Prize details
 * @returns {Promise<Object>} - Email send result
 */
const sendWaitingQueueEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const { username, auctionName, rank, prizeAmount } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;

    const bodyHtml = `
      <p class="title">You are next in line</p>
      <p class="text">Stay signed in. If the current winner does not claim, the prize moves to you.</p>
      <div class="panel">
        <div class="label">Your Position</div>
        <div class="value">#${rank}</div>
        <div class="text" style="margin-top:6px; color:#6f5b8f;">Waiting queue for prize allocation</div>
      </div>
      <div class="grid">
        <div class="stat"><div class="label">Auction</div><div class="value">${auctionName}</div></div>
        <div class="stat"><div class="label">Potential Prize</div><div class="value">₹${prizeAmount.toLocaleString('en-IN')}</div></div>
      </div>
      <p class="text" style="margin:12px 0 0;">We will notify you if the prize advances to your position.</p>
      <a href="${primaryClientUrl}/dashboard" class="cta" target="_blank" rel="noopener">View dashboard</a>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Dream60 Auction Update: Position ${rank}`,
      html: buildEmailTemplate({ primaryClientUrl, title: 'Auction update', subtitle: `Position ${rank}`, bodyHtml, termsUrl }),
      text: `Hi ${username}, you are in position ${rank} for ${auctionName}. Potential prize: ₹${prizeAmount.toLocaleString('en-IN')}. We will notify you if the prize advances to you. Dashboard: ${primaryClientUrl}/dashboard. Terms: ${termsUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Waiting queue email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Waiting queue email sent successfully',
    };
  } catch (error) {
    console.error('❌ Waiting queue email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send waiting queue email',
    };
  }
};

/**
 * Send Custom Email
 * @param {string|Array<string>} recipients - Email address(es)
 * @param {string} subject - Email subject
 * @param {string} body - Email body (HTML)
 * @returns {Promise<Object>} - Email send result
 */
const sendCustomEmail = async (recipients, subject, body) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();

    // Convert recipients to array if it's a string
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: recipientList.join(', '),
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Custom email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Custom email sent successfully',
      recipientCount: recipientList.length,
    };
  } catch (error) {
    console.error('❌ Custom email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send custom email',
    };
  }
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPrizeClaimWinnerEmail,
  sendWaitingQueueEmail,
  sendCustomEmail,
};