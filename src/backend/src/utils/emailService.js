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

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
};
