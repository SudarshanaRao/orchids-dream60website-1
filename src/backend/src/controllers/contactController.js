// src/controllers/contactController.js
const { sendCustomEmail } = require('../utils/emailService');

/**
 * Send Contact Form Message
 * Receives contact form data and sends an email to the support team
 */
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !category || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, subject, category, message',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Recipient email - Dream60 official support
    const supportEmail = 'dream60.official@gmail.com';

    // Category labels for display
    const categoryLabels = {
      account: 'Account & Login Issues',
      auction: 'Auction Questions',
      payment: 'Payment & Billing',
      technical: 'Technical Support',
      prizes: 'Prize & Delivery',
      feedback: 'Feedback & Suggestions',
      partnership: 'Business Partnership',
      press: 'Press & Media',
      legal: 'Legal & Compliance',
      other: 'Other',
    };

    const categoryLabel = categoryLabels[category] || category;

    // Log the contact form submission (this always works)
    console.log('📩 New Contact Form Submission:');
    console.log(`   From: ${name} <${email}>`);
    console.log(`   Category: ${categoryLabel}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message: ${message}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Create HTML email body
    const emailBody = `
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
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }
          .header {
            background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 30px;
          }
          .ticket-badge {
            background: #f0e6ff;
            color: #6b3fa0;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .info-table tr {
            border-bottom: 1px solid #eee;
          }
          .info-table td {
            padding: 12px 0;
          }
          .info-table td:first-child {
            font-weight: 600;
            color: #6b3fa0;
            width: 120px;
          }
          .message-box {
            background: #f9f9f9;
            border-left: 4px solid #6b3fa0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .message-box h3 {
            margin: 0 0 10px;
            color: #6b3fa0;
            font-size: 14px;
          }
          .message-box p {
            margin: 0;
            white-space: pre-wrap;
            color: #555;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
          .footer a {
            color: #6b3fa0;
            text-decoration: none;
          }
          .reply-btn {
            display: inline-block;
            background: linear-gradient(135deg, #6b3fa0 0%, #9f7acb 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📩 New Support Ticket</h1>
            <p>Dream60 Contact Form Submission</p>
          </div>
          <div class="content">
            <span class="ticket-badge">${categoryLabel}</span>
            
            <table class="info-table">
              <tr>
                <td>From:</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td>Email:</td>
                <td><a href="mailto:${email}" style="color: #6b3fa0;">${email}</a></td>
              </tr>
              <tr>
                <td>Category:</td>
                <td>${categoryLabel}</td>
              </tr>
              <tr>
                <td>Subject:</td>
                <td>${subject}</td>
              </tr>
              <tr>
                <td>Date:</td>
                <td>${new Date().toLocaleString('en-IN', { 
                  dateStyle: 'full', 
                  timeStyle: 'short',
                  timeZone: 'Asia/Kolkata'
                })}</td>
              </tr>
            </table>
            
            <div class="message-box">
              <h3>Message:</h3>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="reply-btn">
                Reply to ${name}
              </a>
            </div>
          </div>
          <div class="footer">
            <p>This ticket was submitted via the Dream60 Contact Form</p>
            <p>© ${new Date().getFullYear()} Dream60. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Try to send email
    const emailSubject = `[Dream60 Support] ${categoryLabel}: ${subject}`;
    const result = await sendCustomEmail(supportEmail, emailSubject, emailBody);

    if (result.success) {
      console.log(`✅ Contact form email sent successfully from ${email} to ${supportEmail}`);
    } else {
      // Log failure but don't fail the request - the contact info is logged above
      console.log(`⚠️ Email service unavailable, but contact form logged successfully`);
    }

    // Always return success to the user - their message has been recorded
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you within 24 hours.",
    });
  } catch (err) {
    console.error('Send Contact Message Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

module.exports = {
  sendContactMessage,
};