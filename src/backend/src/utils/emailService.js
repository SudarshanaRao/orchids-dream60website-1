// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const brandStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background-color: #221432; 
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
    background-color: #3A2257; 
    border: 1px solid rgba(159, 122, 203, 0.2); 
    border-radius: 24px; 
    overflow: hidden; 
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); 
  }
  .header { 
    padding: 40px 40px 30px; 
    text-align: center;
    background: linear-gradient(180deg, rgba(159, 122, 203, 0.1) 0%, rgba(159, 122, 203, 0) 100%);
  }
  .logo-wrapper {
    margin-bottom: 20px;
  }
  .logo-img {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: transparent;
    padding: 0;
    display: inline-block;
  }
  .brand-text {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -1px;
    margin: 0;
    color: #ffffff;
  }
  .status-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(159, 122, 203, 0.15);
    border: 1px solid rgba(159, 122, 203, 0.3);
    border-radius: 99px;
    color: #C8B3E5;
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
    color: #B99FD9; 
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
    color: #9F7ACB;
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
    color: #B99FD9;
    margin-top: 8px;
  }
  .otp-code { 
    font-family: 'Courier New', monospace;
    font-size: 48px; 
    font-weight: 800; 
    letter-spacing: 12px; 
    color: #ffffff; 
    background: rgba(159, 122, 203, 0.1); 
    border: 2px dashed rgba(159, 122, 203, 0.4); 
    border-radius: 16px; 
    padding: 24px;
    margin: 20px 0;
    display: inline-block;
  }
    .action-button { 
      display: inline-block; 
      padding: 18px 36px; 
      background: linear-gradient(135deg, #9F7ACB 0%, #6B3FA0 100%); 
      color: #ffffff !important; 
      text-decoration: none; 
      border-radius: 14px; 
      font-weight: 700; 
      font-size: 16px;
      box-shadow: 0 10px 15px -3px rgba(107, 63, 160, 0.3);
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
      background: rgba(159, 122, 203, 0.1);
      color: #C8B3E5;
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
    color: #B99FD9; 
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
    color: #B99FD9;
    line-height: 1.4;
  }
  .footer { 
    padding: 40px; 
    background-color: #221432;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  .footer-nav {
    margin-bottom: 24px;
  }
  .footer-link { 
    color: #B99FD9; 
    font-size: 13px;
    text-decoration: none; 
    margin: 0 12px;
  }
  .footer-link:hover {
    color: #9F7ACB;
  }
  .copyright {
    color: #6B3FA0;
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
  const logoUrl = `https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/1811a3c1-620a-4c8b-a119-34f19f40817b/logo-1-1767714888861.png?width=400&height=400&resize=contain`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>${brandStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="card ${isWinner ? 'winner-card' : ''}">
          <div class="header ${isWinner ? 'winner-header' : ''}">
            <div class="logo-wrapper">
              <img src="${logoUrl}" alt="Dream60" class="logo-img" />
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

    const bodyHtml = `
      <h2 class="hero-title">${reason} Code</h2>
      <p class="hero-text">Use the verification code below to complete your ${reason.toLowerCase()} process. This code will expire in 10 minutes.</p>
      <div style="text-align: center; margin: 32px 0;">
        <div class="otp-code">${otp}</div>
        <p class="feature-sub">Security Team: Never share this code with anyone.</p>
      </div>
      <div class="alert-box alert-warning">
        <div class="alert-title">Didn't request this?</div>
        <div class="alert-desc">If you didn't attempt this action, please ignore this email or contact support if you suspect unauthorized access.</div>
      </div>
    `;

    const mailOptions = {
      from: `"Dream60 Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[Dream60] ${reason} Code: ${otp}`,
      html: buildEmailTemplate({ primaryClientUrl, title: 'Security Verification', status: reason, bodyHtml }),
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

    const bodyHtml = `
      <h2 class="hero-title">Welcome to the Arena, ${username}!</h2>
      <p class="hero-text">Your Dream60 account is verified and ready. You've just joined India's most innovative auction platform where strategy leads to victory.</p>
      
      <div class="info-grid">
        <div class="info-cell">
          <div class="info-label">STRATEGIZE</div>
          <div class="info-value">Unique Low Bids</div>
        </div>
        <div class="info-cell">
          <div class="info-label">COMPETE</div>
          <div class="info-value">Live Rounds</div>
        </div>
        <div class="info-cell">
          <div class="info-label">CONQUER</div>
          <div class="info-value">Premium Prizes</div>
        </div>
      </div>

      <div class="feature-box">
        <div class="feature-label">Your Journey Starts Now</div>
        <p class="hero-text" style="font-size: 14px; margin-bottom: 0;">Participate in live auctions every hour and win amazing Amazon vouchers by placing the highest unique bids.</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${primaryClientUrl}" class="action-button">Launch Dashboard</a>
      </div>

      <div class="alert-box alert-success">
        <div class="alert-title">Pro Tip</div>
        <div class="alert-desc">The key to winning is uniqueness. Try to find the highest amount that no one else is bidding!</div>
      </div>
    `;

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Dream60 - Your Journey Begins!',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Welcome', status: 'Onboarding Complete', bodyHtml }),
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

    const bodyHtml = `
      <h2 class="hero-title">Victory is Yours, ${username}!</h2>
      <p class="hero-text">You've secured the top spot in <strong>${auctionName}</strong>. Your strategic bidding has paid off!</p>
      
      <div class="feature-box">
        <div class="feature-label">Grand Prize</div>
        <div class="feature-value winner-amount">₹${prizeAmount.toLocaleString('en-IN')}</div>
        <div class="feature-sub">Winner of ${auctionName}</div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th colspan="2">Auction Summary</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Auction Name</td>
            <td>${auctionName}</td>
          </tr>
          <tr>
            <td>Final Rank</td>
            <td class="winner-highlight">#1 (Winner)</td>
          </tr>
          <tr>
            <td>Prize Value</td>
            <td class="winner-highlight">₹${prizeAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      ${paymentAmount ? `
      <div class="alert-box alert-warning">
        <div class="alert-title">Processing Fee Required</div>
        <div class="alert-desc">To release your prize, a processing fee of <strong>₹${paymentAmount.toLocaleString('en-IN')}</strong> must be paid.</div>
      </div>
      ` : ''}

      <div class="alert-box alert-success" style="text-align: center;">
        <div class="alert-title">CLAIM DEADLINE</div>
        <div class="alert-desc" style="font-size: 18px; font-weight: 800; color: #10b981;">
          ${new Date(claimDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${primaryClientUrl}/history" class="action-button" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #000000 !important;">Claim Your Prize Now</a>
      </div>
    `;

    const mailOptions = {
      from: `"Dream60 Rewards" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🏆 Congratulations! You Won ₹' + prizeAmount.toLocaleString('en-IN'),
      html: buildEmailTemplate({ primaryClientUrl, title: 'Victory', status: 'Winner Announced', bodyHtml, isWinner: true }),
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

    const bodyHtml = `
      <h2 class="hero-title">So Close! You're Next In Line.</h2>
      <p class="hero-text">You've achieved an impressive <strong>Rank #${rank}</strong> in ${auctionName}. You are currently in the waiting queue.</p>
      
      <div class="feature-box">
        <div class="feature-label">Your Rank</div>
        <div class="feature-value">#${rank}</div>
        <div class="feature-sub">Potential Prize: ₹${prizeAmount.toLocaleString('en-IN')}</div>
      </div>

      <div class="alert-box alert-success">
        <div class="alert-title">Why am I in a queue?</div>
        <div class="alert-desc">If the winner above you fails to claim their prize within the deadline, it will be automatically offered to you. Stay tuned!</div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${primaryClientUrl}/history" class="action-button">Check Live Status</a>
      </div>
    `;

    const mailOptions = {
      from: `"Dream60 Updates" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Auction Update: You are Rank #' + rank,
      html: buildEmailTemplate({ primaryClientUrl, title: 'Queue Update', status: 'Waiting List', bodyHtml }),
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

    const bodyHtml = `
      <h2 class="hero-title">Security Update</h2>
      <p class="hero-text">Hi ${username}, the password for your Dream60 account has been successfully changed.</p>
      
      <div class="alert-box alert-success">
        <div class="alert-title">Password Changed</div>
        <div class="alert-desc">If this was you, you can safely ignore this email.</div>
      </div>

      <div class="alert-box alert-warning">
        <div class="alert-title">Wasn't you?</div>
        <div class="alert-desc">If you didn't change your password, please reset it immediately to secure your account.</div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${primaryClientUrl}/forgot-password" class="action-button">Reset Password</a>
      </div>
    `;

    const mailOptions = {
      from: `"Dream60 Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Security Alert: Password Changed',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Security', status: 'Account Update', bodyHtml }),
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

    const bodyHtml = `
      <h2 class="hero-title">Results are out for ${auctionName}!</h2>
      <p class="hero-text">The competition was fierce, and the results are finally in. Here is how you performed:</p>
      
      <div class="feature-box">
        <div class="feature-label">Your Final Rank</div>
        <div class="feature-value">Rank #${rank}</div>
        <div class="feature-sub">Auction: ${auctionName}</div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th colspan="2">Auction Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Auction Name</td>
            <td>${auctionName}</td>
          </tr>
          <tr>
            <td>Your Rank</td>
            <td class="${rank === 1 ? 'winner-highlight' : ''}">#${rank}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td>${rank === 1 ? 'Winner' : rank <= 3 ? 'Waiting List' : 'Participation'}</td>
          </tr>
          <tr>
            <td>Prize Pool</td>
            <td>₹${prizeAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${primaryClientUrl}/history" class="action-button">View Full Leaderboard</a>
      </div>
    `;

    const mailOptions = {
      from: `"Dream60 Results" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Auction Results: ' + auctionName,
      html: buildEmailTemplate({ primaryClientUrl, title: 'Results', status: 'Auction Closed', bodyHtml, isWinner: rank === 1 }),
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Results email error:', error);
    return { success: false };
  }
};

/**
 * Send Support Receipt Email
 */
const sendSupportReceiptEmail = async (email, details) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false };

    const transporter = createTransporter();
    const { username, topic, ticketId } = details;
    const primaryClientUrl = getPrimaryClientUrl();

    const bodyHtml = `
      <h2 class="hero-title">We've Received Your Request</h2>
      <p class="hero-text">Hi ${username || 'Valued Player'}, thank you for reaching out. Our team is already looking into your inquiry.</p>
      
      <div class="feature-box">
        <div class="feature-label">Ticket ID</div>
        <div class="feature-value" style="font-size: 28px;">#${ticketId || 'D60-' + Math.floor(Math.random() * 10000)}</div>
        <div class="feature-sub">Topic: ${topic || 'General Inquiry'}</div>
      </div>

      <p class="hero-text" style="font-size: 14px; text-align: center;">We usually respond within 24 hours. You can track your ticket or add more details in the support center.</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${primaryClientUrl}/support" class="action-button">Visit Support Center</a>
      </div>
    `;

    const mailOptions = {
      from: `"Dream60 Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Support Request Received [#' + ticketId + ']',
      html: buildEmailTemplate({ primaryClientUrl, title: 'Support', status: 'Ticket Created', bodyHtml }),
    };

    const info = await transporter.sendMail(mailOptions);
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
