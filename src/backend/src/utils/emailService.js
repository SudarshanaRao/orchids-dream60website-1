// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service for sending OTP and other emails
 */

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send OTP Email
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} - Email send result
 */
const sendOtpEmail = async (email, otp) => {
  try {
    // Skip email sending if credentials are not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Dream60 OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .header {
              background: rgba(255, 255, 255, 0.1);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              background: white;
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background: linear-gradient(135deg, #e6dbfb 0%, #c8b3e5 100%);
              border: 3px solid #6b3fa0;
              border-radius: 10px;
              padding: 25px;
              margin: 30px 0;
              display: inline-block;
            }
            .otp-code {
              font-size: 42px;
              font-weight: bold;
              color: #6b3fa0;
              letter-spacing: 8px;
              margin: 0;
            }
            .message {
              font-size: 16px;
              color: #555;
              margin: 20px 0;
            }
            .warning {
              font-size: 14px;
              color: #d4183d;
              margin-top: 20px;
              font-weight: 500;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #777;
            }
            .footer a {
              color: #6b3fa0;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎰 Dream60</h1>
            </div>
            <div class="content">
              <p class="message">
                You requested a password reset. Use the OTP code below to verify your identity:
              </p>
              <div class="otp-box">
                <p class="otp-code">${otp}</p>
              </div>
              <p class="message">
                This OTP is valid for <strong>10 minutes</strong>.
              </p>
              <p class="warning">
                ⚠️ If you didn't request this, please ignore this email or contact support.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Dream60. All rights reserved.</p>
              <p>Need help? <a href="mailto:${process.env.EMAIL_USER}">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your Dream60 OTP code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
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
    // Skip email sending if credentials are not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Dream60! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .header {
              background: rgba(255, 255, 255, 0.1);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 600;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .welcome-text {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .feature-list {
              background: #f9f9f9;
              border-left: 4px solid #6b3fa0;
              padding: 20px;
              margin: 20px 0;
            }
            .feature-list li {
              margin: 10px 0;
              font-size: 15px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
              color: white;
              text-decoration: none;
              padding: 15px 40px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎰 Welcome to Dream60!</h1>
            </div>
            <div class="content">
              <p class="welcome-text">
                Hi <strong>${username}</strong>,
              </p>
              <p class="welcome-text">
                Welcome to Dream60! We're excited to have you join our auction gaming community.
              </p>
              <div class="feature-list">
                <p><strong>Get started with these features:</strong></p>
                <ul>
                  <li>🎯 Participate in exciting auctions</li>
                  <li>🏆 Win amazing prizes</li>
                  <li>💰 Track your wins and earnings</li>
                  <li>📊 View detailed statistics</li>
                </ul>
              </div>
              <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="cta-button">Start Playing Now</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Dream60. All rights reserved.</p>
              <p>Need help? <a href="mailto:${process.env.EMAIL_USER}">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${username},\n\nWelcome to Dream60! We're excited to have you join our auction gaming community.\n\nGet started now at: ${process.env.CLIENT_URL || 'http://localhost:3000'}\n\nBest regards,\nDream60 Team`,
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

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Congratulations! You Won the Auction - Claim Your Prize Now!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .header {
              background: rgba(255, 255, 255, 0.1);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 600;
            }
            .trophy {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .prize-box {
              background: linear-gradient(135deg, #e6dbfb 0%, #c8b3e5 100%);
              border: 3px solid #6b3fa0;
              border-radius: 10px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }
            .prize-amount {
              font-size: 36px;
              font-weight: bold;
              color: #6b3fa0;
              margin: 10px 0;
            }
            .deadline-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .deadline-box strong {
              color: #d4183d;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: 600;
              color: #6b3fa0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
              color: white;
              text-decoration: none;
              padding: 15px 40px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="trophy">🏆</div>
              <h1>YOU WON!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px;">
                Hi <strong>${username}</strong>,
              </p>
              <p>
                Congratulations! You are the <strong>FIRST WINNER</strong> of the auction!
              </p>
              <div class="prize-box">
                <div style="font-size: 16px; color: #6b3fa0; margin-bottom: 10px;">You've Won</div>
                <div class="prize-amount">₹${prizeAmount.toLocaleString('en-IN')}</div>
                <div style="font-size: 14px; color: #555; margin-top: 10px;">${auctionName}</div>
              </div>
              
              <div class="deadline-box">
                <strong>⏰ IMPORTANT:</strong> You have <strong>30 minutes</strong> to claim your prize!<br>
                <strong>Deadline:</strong> ${new Date(claimDeadline).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </div>

              <div style="margin: 20px 0;">
                <div class="info-item">
                  <span class="info-label">Prize Amount:</span>
                  <span>₹${prizeAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Auction:</span>
                  <span>${auctionName}</span>
                </div>
                ${upiId ? `
                <div class="info-item">
                  <span class="info-label">UPI ID:</span>
                  <span>${upiId}</span>
                </div>
                ` : ''}
              </div>

              ${!upiId ? `
              <p style="color: #d4183d; font-weight: 600;">
                ⚠️ Please log in to the platform and submit your UPI ID to complete the prize claim process.
              </p>
              ` : `
              <p style="color: #22c55e; font-weight: 600;">
                ✅ Your prize claim has been submitted. The prize will be transferred to your UPI ID within 24-48 hours.
              </p>
              `}

              <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
                  ${!upiId ? 'Claim Prize Now' : 'View Dashboard'}
                </a>
              </p>

              <p style="font-size: 14px; color: #777;">
                If you don't claim within the deadline, the prize will be offered to the next rank winner.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Dream60. All rights reserved.</p>
              <p>Need help? <a href="mailto:${process.env.EMAIL_USER}">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Congratulations ${username}! You won ₹${prizeAmount.toLocaleString('en-IN')} in the ${auctionName} auction!\n\nYou have 30 minutes to claim your prize. Deadline: ${new Date(claimDeadline).toLocaleString('en-IN')}\n\n${!upiId ? 'Please log in to claim your prize: ' + (process.env.CLIENT_URL || 'http://localhost:3000') : 'Your prize will be transferred to ' + upiId + ' within 24-48 hours.'}`,
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

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎊 You're in Position ${rank} - Waiting Queue for ${auctionName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .header {
              background: rgba(255, 255, 255, 0.1);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .medal {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .rank-box {
              background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
              border: 3px solid #ffc107;
              border-radius: 10px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }
            .rank-number {
              font-size: 48px;
              font-weight: bold;
              color: #f59e0b;
              margin: 10px 0;
            }
            .info-box {
              background: #f0f9ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: 600;
              color: #6b3fa0;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="medal">${rank === 2 ? '🥈' : '🥉'}</div>
              <h1>You're in the Waiting Queue!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px;">
                Hi <strong>${username}</strong>,
              </p>
              <p>
                Congratulations on your excellent performance! You secured <strong>${rank === 2 ? 'Second' : 'Third'} Position</strong> in the auction.
              </p>
              <div class="rank-box">
                <div style="font-size: 16px; color: #f59e0b; margin-bottom: 10px;">Your Position</div>
                <div class="rank-number">#${rank}</div>
                <div style="font-size: 14px; color: #555; margin-top: 10px;">Waiting Queue</div>
              </div>
              
              <div class="info-box">
                <strong>📋 What This Means:</strong><br>
                You're in the <strong>priority waiting queue</strong>. If the current winner (Rank ${rank - 1}) doesn't claim their prize within 30 minutes, the prize opportunity will advance to you!
              </div>

              <div style="margin: 20px 0;">
                <div class="info-item">
                  <span class="info-label">Auction:</span>
                  <span>${auctionName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Your Rank:</span>
                  <span>#${rank}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Potential Prize:</span>
                  <span>₹${prizeAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p style="font-size: 14px; color: #555;">
                <strong>💡 Next Steps:</strong><br>
                • Stay tuned for notifications<br>
                • Keep your UPI ID ready<br>
                • Check your dashboard regularly<br>
                • You'll be notified if the prize advances to your rank
              </p>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600;">
                  View Dashboard
                </a>
              </p>

              <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
                Thank you for participating in Dream60 auctions!
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Dream60. All rights reserved.</p>
              <p>Need help? <a href="mailto:${process.env.EMAIL_USER}">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${username}, You secured Position #${rank} in the ${auctionName} auction!\n\nYou're in the priority waiting queue. If Rank ${rank - 1} doesn't claim within 30 minutes, the prize opportunity (₹${prizeAmount.toLocaleString('en-IN')}) will advance to you!\n\nStay tuned for notifications. View your dashboard: ${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
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