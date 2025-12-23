// src/controllers/careersController.js
const { sendCustomEmail } = require('../utils/emailService');

/**
 * Handle Career Application Submission
 * Receives application data and sends an email to the recruitment team
 */
const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, role, experience, portfolio, message } = req.body;
    const resumeFile = req.file;

    // Validate required fields
    if (!name || !email || !role || !resumeFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, role, and resume are required.',
      });
    }

    // Recipient email - Dream60 recruitment
    const recruitmentEmail = 'dream60.official@gmail.com';

    // Log the application submission
    console.log('📄 New Career Application Submission:');
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Create HTML email body
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
          .header { background: #6b3fa0; padding: 20px; color: white; text-align: center; }
          .content { padding: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #6b3fa0; display: block; }
          .value { margin-top: 5px; }
          .footer { background: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Application</h1>
            <p>Role: ${role}</p>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Applicant Name:</span>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <span class="label">Email Address:</span>
              <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="field">
              <span class="label">Phone Number:</span>
              <div class="value">${phone || 'Not provided'}</div>
            </div>
            <div class="field">
              <span class="label">Experience:</span>
              <div class="value">${experience || 'Not specified'}</div>
            </div>
            <div class="field">
              <span class="label">Portfolio/LinkedIn:</span>
              <div class="value">${portfolio ? `<a href="${portfolio}">${portfolio}</a>` : 'Not provided'}</div>
            </div>
            <div class="field">
              <span class="label">Cover Letter / Message:</span>
              <div class="value" style="white-space: pre-wrap;">${message || 'No message provided.'}</div>
            </div>
          </div>
          <div class="footer">
            <p>Submitted via Dream60 Careers Form</p>
            <p>© ${new Date().getFullYear()} Dream60</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Try to send email with attachment
    // Note: nodemailer transporter.sendMail supports attachments
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Dream60 Careers" <${process.env.EMAIL_USER}>`,
      to: recruitmentEmail,
      subject: `[Career Application] ${role} - ${name}`,
      html: emailBody,
      attachments: [
        {
          filename: resumeFile.originalname,
          content: resumeFile.buffer
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Career application email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: "Application submitted successfully! We'll review it and get back to you.",
    });
  } catch (err) {
    console.error('Submit Application Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

module.exports = {
  submitApplication,
};
