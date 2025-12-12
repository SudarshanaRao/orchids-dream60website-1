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

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dream60: Your One-Time Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            body { background: #f5f5f7; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
            .card { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .header { padding: 24px 24px 16px; border-bottom: 1px solid #e2e8f0; }
            .brand { font-weight: 700; font-size: 20px; letter-spacing: 0.5px; color: #4b0082; }
            .subtitle { margin: 4px 0 0; color: #475569; font-size: 14px; }
            .content { padding: 24px; }
            .code { display: inline-block; padding: 14px 20px; font-size: 28px; font-weight: 700; color: #111827; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; letter-spacing: 6px; }
            .note { margin: 16px 0 8px; font-size: 14px; color: #0f172a; }
            .small { font-size: 13px; color: #475569; margin-top: 8px; }
            .footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; background: #f8fafc; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
            .footer a { color: #4b0082; text-decoration: none; font-weight: 600; }
            .divider { color: #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">Dream60</div>
              <p class="subtitle">Secure verification code</p>
            </div>
            <div class="content">
              <p>Use this one-time password to continue.</p>
              <div class="code">${otp}</div>
              <p class="note">Valid for 10 minutes.</p>
              <p class="small">If you did not request this code, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <a href="mailto:${process.env.EMAIL_USER}">Contact support</a>
              <span class="divider">•</span>
              <a href="${termsUrl}" target="_blank" rel="noopener">Terms &amp; Conditions</a>
            </div>
          </div>
        </body>
        </html>
      `,
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

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Dream60',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            body { background: #f5f5f7; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
            .card { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .header { padding: 24px 24px 12px; border-bottom: 1px solid #e2e8f0; }
            .brand { font-weight: 700; font-size: 20px; letter-spacing: 0.5px; color: #4b0082; }
            .subtitle { margin: 6px 0 0; color: #475569; font-size: 14px; }
            .content { padding: 24px; }
            .section { margin-bottom: 16px; }
            .list { padding: 0; margin: 12px 0; list-style: none; }
            .list li { padding: 8px 0; font-size: 14px; color: #0f172a; }
            .cta { display: inline-block; margin-top: 12px; padding: 12px 20px; background: #4b0082; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; }
            .footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; background: #f8fafc; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
            .footer a { color: #4b0082; text-decoration: none; font-weight: 600; }
            .divider { color: #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">Dream60</div>
              <p class="subtitle">Welcome, ${username}</p>
            </div>
            <div class="content">
              <div class="section">
                <p>Thank you for joining Dream60. Your account is ready to use.</p>
              </div>
              <div class="section">
                <p style="font-weight:600; margin: 0 0 8px;">What you can do next:</p>
                <ul class="list">
                  <li>Enter live auctions and compete for prizes.</li>
                  <li>Track your entries, bids, and winnings in one place.</li>
                  <li>Receive timely updates on auction windows.</li>
                </ul>
              </div>
              <a href="${primaryClientUrl}" class="cta" target="_blank" rel="noopener">Go to Dream60</a>
            </div>
            <div class="footer">
              <a href="mailto:${process.env.EMAIL_USER}">Contact support</a>
              <span class="divider">•</span>
              <a href="${termsUrl}" target="_blank" rel="noopener">Terms &amp; Conditions</a>
            </div>
          </div>
        </body>
        </html>
      `,
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

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Dream60 Prize Confirmation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            body { background: #f5f5f7; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
            .card { max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .header { padding: 24px 24px 12px; border-bottom: 1px solid #e2e8f0; }
            .brand { font-weight: 700; font-size: 20px; letter-spacing: 0.5px; color: #4b0082; }
            .subtitle { margin: 6px 0 0; color: #475569; font-size: 14px; }
            .content { padding: 24px; }
            .highlight { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; }
            .amount { font-size: 24px; font-weight: 700; color: #111827; margin: 8px 0; }
            .label { font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; }
            .info { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
            .info div { padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
            .deadline { margin: 16px 0; padding: 14px 16px; border: 1px solid #f59e0b; background: #fffbeb; border-radius: 10px; color: #92400e; }
            .cta { display: inline-block; margin-top: 12px; padding: 12px 20px; background: #4b0082; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; }
            .footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; background: #f8fafc; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
            .footer a { color: #4b0082; text-decoration: none; font-weight: 600; }
            .divider { color: #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">Dream60</div>
              <p class="subtitle">Prize confirmation</p>
            </div>
            <div class="content">
              <p>Hi ${username},</p>
              <p>Congratulations on winning the auction. Please review the prize details below.</p>
              <div class="highlight">
                <div class="label">Prize Amount</div>
                <div class="amount">₹${prizeAmount.toLocaleString('en-IN')}</div>
                <div style="margin-top:8px; color:#475569;">${auctionName}</div>
              </div>
              <div class="deadline">
                Claim within 30 minutes. Deadline: ${new Date(claimDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
              <div class="info">
                <div><span class="label">Auction</span><br />${auctionName}</div>
                <div><span class="label">Prize</span><br />₹${prizeAmount.toLocaleString('en-IN')}</div>
                ${upiId ? `<div><span class="label">UPI ID</span><br />${upiId}</div>` : ''}
              </div>
              ${!upiId ? '<p style="color:#b91c1c; font-weight:600; margin:12px 0 0;">Add your UPI ID in your dashboard to receive the prize.</p>' : '<p style="color:#15803d; font-weight:600; margin:12px 0 0;">We will transfer the prize to your UPI ID within 24-48 hours.</p>'}
              <a href="${primaryClientUrl}/dashboard" class="cta" target="_blank" rel="noopener">${!upiId ? 'Claim prize' : 'View dashboard'}</a>
              <p style="margin-top:16px; color:#475569; font-size:13px;">If the claim window closes, the prize moves to the next eligible participant.</p>
            </div>
            <div class="footer">
              <a href="mailto:${process.env.EMAIL_USER}">Contact support</a>
              <span class="divider">•</span>
              <a href="${termsUrl}" target="_blank" rel="noopener">Terms &amp; Conditions</a>
            </div>
          </div>
        </body>
        </html>
      `,
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

    const mailOptions = {
      from: `"Dream60" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Dream60 Auction Update: Position ${rank}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            body { background: #f5f5f7; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
            .card { max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .header { padding: 24px 24px 12px; border-bottom: 1px solid #e2e8f0; }
            .brand { font-weight: 700; font-size: 20px; letter-spacing: 0.5px; color: #4b0082; }
            .subtitle { margin: 6px 0 0; color: #475569; font-size: 14px; }
            .content { padding: 24px; }
            .panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; }
            .label { font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; }
            .value { font-size: 24px; font-weight: 700; color: #111827; margin-top: 6px; }
            .info { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
            .info div { padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
            .cta { display: inline-block; margin-top: 12px; padding: 12px 20px; background: #4b0082; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; }
            .footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; background: #f8fafc; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
            .footer a { color: #4b0082; text-decoration: none; font-weight: 600; }
            .divider { color: #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">Dream60</div>
              <p class="subtitle">Auction update</p>
            </div>
            <div class="content">
              <p>Hi ${username},</p>
              <p>You are currently in position ${rank} for this auction. If the current winner does not claim in time, the prize moves to you.</p>
              <div class="panel">
                <div class="label">Your Position</div>
                <div class="value">#${rank}</div>
                <div style="margin-top:8px; color:#475569;">Waiting queue for prize allocation</div>
              </div>
              <div class="info">
                <div><span class="label">Auction</span><br />${auctionName}</div>
                <div><span class="label">Potential Prize</span><br />₹${prizeAmount.toLocaleString('en-IN')}</div>
              </div>
              <p style="margin:12px 0 0; color:#0f172a;">Stay signed in and keep your payment details ready. We will notify you if the prize advances to your position.</p>
              <a href="${primaryClientUrl}/dashboard" class="cta" target="_blank" rel="noopener">View dashboard</a>
            </div>
            <div class="footer">
              <a href="mailto:${process.env.EMAIL_USER}">Contact support</a>
              <span class="divider">•</span>
              <a href="${termsUrl}" target="_blank" rel="noopener">Terms &amp; Conditions</a>
            </div>
          </div>
        </body>
        </html>
      `,
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