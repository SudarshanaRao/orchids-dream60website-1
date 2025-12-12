// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const brandStyles = `
  * { box-sizing: border-box; }
  body { 
    background: linear-gradient(135deg, #f8f4ff 0%, #f0e8ff 50%, #f4efff 100%); 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
    margin: 0; 
    padding: 32px 16px; 
    color: #1a0d2e; 
  }
  .card { 
    max-width: 640px; 
    margin: 0 auto; 
    background: #ffffff; 
    border: 2px solid #e9deff; 
    border-radius: 20px; 
    overflow: hidden; 
    box-shadow: 0 24px 60px rgba(107, 63, 160, 0.16), 0 8px 20px rgba(107, 63, 160, 0.08); 
  }
  .header { 
    padding: 28px 32px; 
    border-bottom: 2px solid #f0e8ff; 
    background: linear-gradient(135deg, #faf7ff 0%, #f3edff 50%, #f7f4ff 100%); 
  }
  .brand { 
    display: flex; 
    align-items: center; 
    gap: 16px; 
    margin-bottom: 14px;
  }
  .logo { 
    width: 52px; 
    height: 52px; 
    border-radius: 16px; 
    background: linear-gradient(135deg, #6B3FA0 0%, #8456BC 50%, #9F7ACB 100%); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    box-shadow: 0 12px 32px rgba(107, 63, 160, 0.32), 0 4px 12px rgba(107, 63, 160, 0.16); 
  }
  .logo img { 
    width: 34px; 
    height: 34px; 
  }
  .brand-name { 
    font-weight: 900; 
    font-size: 22px; 
    color: #2b1c42; 
    letter-spacing: -0.3px; 
    line-height: 1.2;
  }
  .brand-tagline { 
    font-size: 13px; 
    color: #7960a0; 
    margin-top: 4px; 
    font-weight: 500;
  }
  .tag { 
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    background: linear-gradient(135deg, #f0e8ff 0%, #efe6ff 100%); 
    color: #5a2d91; 
    font-weight: 800; 
    font-size: 12px; 
    padding: 8px 16px; 
    border-radius: 999px; 
    box-shadow: 0 4px 12px rgba(90, 45, 145, 0.12);
    border: 1px solid #e6deff;
  }
  .content { 
    padding: 32px; 
    background: #ffffff; 
  }
  .title { 
    font-size: 24px; 
    font-weight: 900; 
    color: #1a0d2e; 
    margin: 0 0 16px; 
    line-height: 1.3;
    letter-spacing: -0.5px;
  }
  .text { 
    font-size: 16px; 
    color: #3d2e5b; 
    line-height: 1.7; 
    margin: 0 0 16px; 
  }
  .panel { 
    background: linear-gradient(135deg, #faf8ff 0%, #f5f2ff 100%); 
    border: 2px solid #ede5ff; 
    border-radius: 16px; 
    padding: 20px 24px; 
    margin: 20px 0; 
    box-shadow: 0 4px 16px rgba(107, 63, 160, 0.06);
  }
  .otp { 
    display: inline-block; 
    padding: 18px 28px; 
    font-size: 36px; 
    font-weight: 900; 
    letter-spacing: 12px; 
    color: #2b1c42; 
    background: linear-gradient(135deg, #ffffff 0%, #f8f5ff 100%); 
    border: 3px solid #e0d5fa; 
    border-radius: 16px; 
    box-shadow: 0 8px 24px rgba(107, 63, 160, 0.12), inset 0 2px 0 rgba(255,255,255,0.9); 
  }
  .grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
    gap: 14px; 
    margin: 20px 0; 
  }
  .stat { 
    background: linear-gradient(135deg, #faf8ff 0%, #f5f2ff 100%); 
    border: 2px solid #ede5ff; 
    border-radius: 14px; 
    padding: 16px; 
    box-shadow: 0 4px 12px rgba(107, 63, 160, 0.05);
  }
  .label { 
    font-size: 11px; 
    text-transform: uppercase; 
    letter-spacing: 0.8px; 
    color: #8268a8; 
    margin-bottom: 8px; 
    font-weight: 700;
  }
  .value { 
    font-size: 20px; 
    font-weight: 900; 
    color: #1a0d2e; 
    line-height: 1.3;
  }
  .cta { 
    display: inline-block; 
    margin-top: 16px; 
    padding: 16px 28px; 
    background: linear-gradient(135deg, #6B3FA0 0%, #8456BC 50%, #9F7ACB 100%); 
    color: #ffffff; 
    text-decoration: none; 
    border-radius: 14px; 
    font-weight: 800; 
    font-size: 15px;
    box-shadow: 0 16px 36px rgba(107, 63, 160, 0.32), 0 4px 12px rgba(107, 63, 160, 0.16); 
    transition: all 0.3s ease;
  }
  .footer { 
    padding: 20px 32px; 
    border-top: 2px solid #f0e8ff; 
    background: linear-gradient(135deg, #faf8ff 0%, #f5f2ff 100%); 
    font-size: 13px; 
    color: #6b5487; 
    display: flex; 
    gap: 12px; 
    align-items: center; 
    flex-wrap: wrap; 
  }
  .footer a { 
    color: #6B3FA0; 
    font-weight: 700; 
    text-decoration: none; 
  }
  .divider { 
    color: #d1c2ea; 
    font-weight: 300;
  }
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
  const baseUrl = primaryClientUrl;
  const termsHref = termsUrl || `${baseUrl}/terms`;
  const privacyHref = `${baseUrl}/privacy`;
  const supportHref = `${baseUrl}/support`;
  const contactHref = `${baseUrl}/contact`;

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
            <div class="logo"><img src="${baseUrl}/logo.svg" alt="Dream60" /></div>
            <div>
              <div class="brand-name">Dream60</div>
              <div class="brand-tagline">${subtitle}</div>
            </div>
          </div>
          <div class="tag">${title}</div>
        </div>
        <div class="content">${bodyHtml}</div>
        <div class="footer">
          <a href="mailto:${process.env.EMAIL_USER}">Support</a>
          <span class="divider">•</span>
          <a href="${supportHref}" target="_blank" rel="noopener">Help Center</a>
          <span class="divider">•</span>
          <a href="${contactHref}" target="_blank" rel="noopener">Contact</a>
          <span class="divider">•</span>
          <a href="${termsHref}" target="_blank" rel="noopener">Terms</a>
          <span class="divider">•</span>
          <a href="${privacyHref}" target="_blank" rel="noopener">Privacy</a>
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

const sendPasswordChangeEmail = async (email, username) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;
    const resetUrl = `${primaryClientUrl}/forgot-password`;

    const bodyHtml = `
      <p class="title">Your password was updated</p>
      <p class="text">Hi ${username}, your Dream60 password has just been changed.</p>
      <div class="panel"><div class="label">If this wasn't you</div><div class="value">Reset immediately and contact support.</div></div>
      <a href="${resetUrl}" class="cta" target="_blank" rel="noopener">Reset password</a>
      <p class="text" style="margin-top:12px;">Need help? Reply to this email or reach us from the Help Center.</p>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dream60 password changed',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Security alert', subtitle: 'Password change confirmation', bodyHtml, termsUrl }),
      text: `Hi ${username}, your Dream60 password was changed. If this wasn't you, reset it now: ${resetUrl}. Support: ${process.env.EMAIL_USER}. Terms: ${termsUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password change email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Password change email sent successfully',
    };
  } catch (error) {
    console.error('❌ Password change email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send password change email',
    };
  }
};

const sendWinnersAnnouncementEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const { username, auctionName, prizeAmount, rank } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;

    const bodyHtml = `
      <p class="title">Results for ${auctionName}</p>
      <p class="text">Congratulations ${username}, here are your results.</p>
      <div class="grid">
        <div class="stat"><div class="label">Your Rank</div><div class="value">#${rank}</div></div>
        <div class="stat"><div class="label">Prize</div><div class="value">₹${prizeAmount.toLocaleString('en-IN')}</div></div>
        <div class="stat"><div class="label">Status</div><div class="value">Winner</div></div>
      </div>
      <a href="${primaryClientUrl}/dashboard" class="cta" target="_blank" rel="noopener">View results</a>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Dream60 Results: ${auctionName}`,
      html: buildEmailTemplate({ primaryClientUrl, title: 'Winners announced', subtitle: 'Auction completed', bodyHtml, termsUrl }),
      text: `Hi ${username}, winners are announced for ${auctionName}. Your rank: ${rank}. Prize: ₹${prizeAmount.toLocaleString('en-IN')}. Dashboard: ${primaryClientUrl}/dashboard. Terms: ${termsUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Winners announcement email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Winners announcement email sent successfully',
    };
  } catch (error) {
    console.error('❌ Winners announcement email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send winners announcement email',
    };
  }
};

const sendSupportReceiptEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const { username, topic, ticketId } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;

    const bodyHtml = `
      <p class="title">We received your request</p>
      <p class="text">Hi ${username || 'there'}, thanks for reaching out about ${topic || 'your issue'}.</p>
      <div class="panel"><div class="label">Ticket ID</div><div class="value">${ticketId || 'Pending'}</div></div>
      <p class="text">Our support team will respond shortly. You can reply to this email with more details.</p>
      <a href="${primaryClientUrl}/support" class="cta" target="_blank" rel="noopener">Track support</a>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dream60 support ticket received',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Support request', subtitle: 'We are on it', bodyHtml, termsUrl }),
      text: `Hi ${username || 'there'}, we received your request about ${topic || 'your issue'}. Ticket: ${ticketId || 'Pending'}. Track at ${primaryClientUrl}/support. Terms: ${termsUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Support receipt email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Support receipt email sent successfully',
    };
  } catch (error) {
    console.error('❌ Support receipt email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send support receipt email',
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
  sendPasswordChangeEmail,
  sendWinnersAnnouncementEmail,
  sendSupportReceiptEmail,
  sendCustomEmail,
};