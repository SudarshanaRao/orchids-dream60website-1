// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const brandStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background: #0f0a1a; 
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif; 
    margin: 0; 
    padding: 40px 16px; 
    color: #ffffff; 
    -webkit-font-smoothing: antialiased;
  }
  .card { 
    max-width: 580px; 
    margin: 0 auto; 
    background: linear-gradient(180deg, #1a1128 0%, #120d1c 100%); 
    border: 1px solid rgba(139, 92, 246, 0.3); 
    border-radius: 24px; 
    overflow: hidden; 
    box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5), 0 0 100px rgba(139, 92, 246, 0.15); 
  }
  .header { 
    padding: 32px 32px 24px; 
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%);
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    text-align: center;
  }
  .logo-container { 
    display: inline-block;
    margin-bottom: 16px;
  }
  .logo { 
    width: 72px; 
    height: 72px; 
    border-radius: 20px; 
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    box-shadow: 0 16px 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2); 
    margin: 0 auto;
  }
  .logo img { 
    width: 48px; 
    height: 48px; 
  }
  .brand-name { 
    font-weight: 800; 
    font-size: 28px; 
    background: linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px; 
    margin-bottom: 8px;
  }
  .tag { 
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.15) 100%); 
    color: #C4B5FD; 
    font-weight: 700; 
    font-size: 11px; 
    padding: 8px 16px; 
    border-radius: 999px; 
    text-transform: uppercase;
    letter-spacing: 1.2px;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
  .content { 
    padding: 36px 32px; 
    background: transparent; 
  }
  .title { 
    font-size: 26px; 
    font-weight: 800; 
    color: #ffffff; 
    margin: 0 0 12px; 
    line-height: 1.3;
    letter-spacing: -0.5px;
  }
  .text { 
    font-size: 15px; 
    color: #a1a1aa; 
    line-height: 1.7; 
    margin: 0 0 20px; 
  }
  .highlight-box { 
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.08) 100%); 
    border: 1px solid rgba(139, 92, 246, 0.4); 
    border-radius: 16px; 
    padding: 24px; 
    margin: 24px 0; 
    text-align: center;
  }
  .highlight-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #A78BFA;
    margin-bottom: 8px;
    font-weight: 700;
  }
  .highlight-value {
    font-size: 36px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
  }
  .highlight-sub {
    font-size: 13px;
    color: #a1a1aa;
    margin-top: 8px;
  }
  .panel { 
    background: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255, 255, 255, 0.08); 
    border-radius: 14px; 
    padding: 20px 24px; 
    margin: 20px 0; 
  }
  .otp { 
    display: inline-block; 
    padding: 20px 32px; 
    font-size: 42px; 
    font-weight: 800; 
    letter-spacing: 14px; 
    color: #ffffff; 
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.1) 100%); 
    border: 2px solid rgba(139, 92, 246, 0.5); 
    border-radius: 16px; 
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2); 
  }
  .grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); 
    gap: 12px; 
    margin: 24px 0; 
  }
  .stat { 
    background: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255, 255, 255, 0.08); 
    border-radius: 12px; 
    padding: 16px; 
    text-align: center;
  }
  .label { 
    font-size: 10px; 
    text-transform: uppercase; 
    letter-spacing: 1px; 
    color: #71717a; 
    margin-bottom: 6px; 
    font-weight: 600;
  }
  .value { 
    font-size: 18px; 
    font-weight: 700; 
    color: #ffffff; 
    line-height: 1.3;
  }
  .cta { 
    display: inline-block; 
    margin-top: 20px; 
    padding: 16px 32px; 
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); 
    color: #ffffff; 
    text-decoration: none; 
    border-radius: 12px; 
    font-weight: 700; 
    font-size: 14px;
    letter-spacing: 0.5px;
    box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.15); 
    transition: all 0.3s ease;
  }
  .warning-box {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%);
    border: 1px solid rgba(251, 191, 36, 0.4);
    border-radius: 12px;
    padding: 16px 20px;
    margin: 20px 0;
  }
  .warning-box .label { color: #FBBF24; }
  .warning-box .value { color: #FDE68A; font-size: 16px; }
  .success-box {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
    border: 1px solid rgba(34, 197, 94, 0.4);
    border-radius: 12px;
    padding: 16px 20px;
    margin: 20px 0;
  }
  .success-box .label { color: #22C55E; }
  .success-box .value { color: #86EFAC; font-size: 14px; }
  .footer { 
    padding: 24px 32px; 
    border-top: 1px solid rgba(255, 255, 255, 0.06); 
    background: rgba(0, 0, 0, 0.2); 
    font-size: 12px; 
    color: #71717a; 
    text-align: center;
  }
  .footer-links {
    display: flex; 
    justify-content: center;
    gap: 16px; 
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .footer a { 
    color: #A78BFA; 
    font-weight: 600; 
    text-decoration: none; 
  }
  .footer-copy {
    color: #52525b;
    font-size: 11px;
  }
  .divider { 
    color: #3f3f46; 
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
          <div class="logo-container">
            <div class="logo"><img src="${baseUrl}/logo.svg" alt="Dream60" /></div>
          </div>
          <div class="brand-name">Dream60</div>
          <div class="tag">${title}</div>
        </div>
        <div class="content">${bodyHtml}</div>
        <div class="footer">
          <div class="footer-links">
            <a href="${supportHref}" target="_blank" rel="noopener">Help Center</a>
            <span class="divider">•</span>
            <a href="${contactHref}" target="_blank" rel="noopener">Contact</a>
            <span class="divider">•</span>
            <a href="${termsHref}" target="_blank" rel="noopener">Terms</a>
            <span class="divider">•</span>
            <a href="${privacyHref}" target="_blank" rel="noopener">Privacy</a>
          </div>
          <div class="footer-copy">© ${new Date().getFullYear()} Dream60. All rights reserved.</div>
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
      <p class="title">Your Verification Code</p>
      <p class="text">Enter this code to verify your identity. It expires in 10 minutes.</p>
      <div class="highlight-box">
        <div class="highlight-label">One-Time Password</div>
        <div class="otp">${otp}</div>
        <div class="highlight-sub">Do not share this code with anyone</div>
      </div>
      <p class="text" style="color: #71717a; font-size: 13px;">If you didn't request this code, you can safely ignore this email.</p>
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
      <p class="title">Welcome to Dream60, ${username}!</p>
      <p class="text">Your account has been created successfully. You're now ready to compete in live auctions and win amazing prizes!</p>
      <div class="highlight-box">
        <div class="highlight-label">What's Next?</div>
        <div class="highlight-value" style="font-size: 20px;">Start Your First Auction</div>
        <div class="highlight-sub">Join live auctions and compete for prizes</div>
      </div>
      <div class="grid">
        <div class="stat"><div class="label">Compete</div><div class="value">Live Auctions</div></div>
        <div class="stat"><div class="label">Win</div><div class="value">Real Prizes</div></div>
        <div class="stat"><div class="label">Track</div><div class="value">Your Stats</div></div>
      </div>
      <a href="${primaryClientUrl}" class="cta" target="_blank" rel="noopener">Get Started Now</a>
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
    const { username, auctionName, prizeAmount, claimDeadline, email: userEmail, paymentAmount } = details;
    const primaryClientUrl = getPrimaryClientUrl();
    const termsUrl = `${primaryClientUrl}/terms`;

    const bodyHtml = `
      <p class="title">🎉 Congratulations, You Won!</p>
      <p class="text">You have won the prize in ${auctionName}. Claim your prize within the time limit below.</p>
      <div class="highlight-box">
        <div class="highlight-label">Your Prize Amount</div>
        <div class="highlight-value">₹${prizeAmount.toLocaleString('en-IN')}</div>
        <div class="highlight-sub">${auctionName}</div>
      </div>
      ${paymentAmount ? `
      <div class="panel" style="border-color: #FBBF24;">
        <p class="text" style="margin: 0; color: #FBBF24; font-weight: 700;">Action Required: Payment Pending</p>
        <p class="text" style="margin: 5px 0 0; font-size: 14px;">To claim your prize, you need to pay a processing fee of <strong>₹${paymentAmount.toLocaleString('en-IN')}</strong>.</p>
      </div>
      ` : ''}
      <div class="warning-box">
        <div class="label">⏰ Claim Deadline</div>
        <div class="value">${new Date(claimDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      </div>
      <div class="grid">
        <div class="stat"><div class="label">Auction</div><div class="value">${auctionName}</div></div>
        <div class="stat"><div class="label">Prize</div><div class="value">₹${prizeAmount.toLocaleString('en-IN')}</div></div>
        ${userEmail ? `<div class="stat"><div class="label">Email Id</div><div class="value">${userEmail}</div></div>` : ''}
      </div>
      ${!userEmail ? '<div class="warning-box"><div class="label">Action Required</div><div class="value">Add your Email Id in your dashboard to receive the prize.</div></div>' : '<div class="success-box"><div class="label">Payment Info</div><div class="value">Prize will be processed to your Email Id within 24-48 hours.</div></div>'}
      <a href="${primaryClientUrl}/history" class="cta" target="_blank" rel="noopener">${!userEmail ? 'Claim Prize Now' : 'View Dashboard'}</a>
      <p class="text" style="margin-top:20px; font-size: 13px;">If you don't claim within the deadline, the prize moves to the next eligible participant.</p>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dream60 Prize Confirmation',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Prize confirmation', subtitle: 'You are Rank #1', bodyHtml, termsUrl }),
      text: `Hi ${username}, you won ₹${prizeAmount.toLocaleString('en-IN')} in ${auctionName}. ${paymentAmount ? 'Payment required: ₹' + paymentAmount.toLocaleString('en-IN') + '. ' : ''}Claim by ${new Date(claimDeadline).toLocaleString('en-IN')}. ${!userEmail ? 'Add your Email Id in your dashboard.' : 'Prize will be sent to ' + userEmail + ' within 24-48 hours.'} Dashboard: ${primaryClientUrl}/dashboard. Terms: ${termsUrl}`,
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
      <p class="title">🏅 You're In The Waiting Queue!</p>
      <p class="text">Great news! You're in position to win if the current winner doesn't claim their prize.</p>
      <div class="highlight-box">
        <div class="highlight-label">Your Position</div>
        <div class="highlight-value">#${rank}</div>
        <div class="highlight-sub">Waiting for prize allocation</div>
      </div>
      <div class="grid">
        <div class="stat"><div class="label">Auction</div><div class="value">${auctionName}</div></div>
        <div class="stat"><div class="label">Potential Prize</div><div class="value">₹${prizeAmount.toLocaleString('en-IN')}</div></div>
      </div>
      <div class="panel">
        <p class="text" style="margin: 0; color: #a1a1aa;">Stay online! We'll notify you immediately if the prize advances to your position.</p>
      </div>
      <a href="${primaryClientUrl}/history" class="cta" target="_blank" rel="noopener">Track Status</a>
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
      <p class="title">Password Changed Successfully</p>
      <p class="text">Hi ${username}, your Dream60 account password has been updated.</p>
      <div class="success-box">
        <div class="label">✓ Password Updated</div>
        <div class="value">Your new password is now active</div>
      </div>
      <div class="warning-box">
        <div class="label">⚠️ Wasn't You?</div>
        <div class="value">If you didn't make this change, reset your password immediately and contact support.</div>
      </div>
      <a href="${resetUrl}" class="cta" target="_blank" rel="noopener">Reset Password</a>
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
      <p class="title">🏆 Auction Results Are In!</p>
      <p class="text">Congratulations ${username}! Here are your results for ${auctionName}.</p>
      <div class="highlight-box">
        <div class="highlight-label">Your Final Rank</div>
        <div class="highlight-value">#${rank}</div>
        <div class="highlight-sub">Winner - ${auctionName}</div>
      </div>
      <div class="grid">
        <div class="stat"><div class="label">Prize Won</div><div class="value">₹${prizeAmount.toLocaleString('en-IN')}</div></div>
        <div class="stat"><div class="label">Status</div><div class="value" style="color: #22C55E;">Winner</div></div>
      </div>
      <a href="${primaryClientUrl}/history" class="cta" target="_blank" rel="noopener">View Full Results</a>
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
      <p class="title">Support Request Received</p>
      <p class="text">Hi ${username || 'there'}, we've received your request about "${topic || 'your issue'}".</p>
      <div class="highlight-box">
        <div class="highlight-label">Your Ticket ID</div>
        <div class="highlight-value" style="font-size: 24px;">${ticketId || 'Pending'}</div>
        <div class="highlight-sub">Save this for reference</div>
      </div>
      <div class="panel">
        <p class="text" style="margin: 0; color: #a1a1aa;">Our support team will review your request and respond shortly. You can reply directly to this email with additional details.</p>
      </div>
      <a href="${primaryClientUrl}/support" class="cta" target="_blank" rel="noopener">Track Your Request</a>
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
 * @param {Array<Object>} attachments - Optional email attachments
 * @returns {Promise<Object>} - Email send result
 */
const sendCustomEmail = async (recipients, subject, body, attachments = []) => {
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
      attachments: attachments,
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