// src/controllers/careersController.js
const { sendEmailWithTemplate } = require('../utils/emailService');

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

    const ticketId = `CAREER-${Date.now()}`;
    const applicationTopic = `Career Application - ${role}`;
    const attachments = [
      {
        filename: resumeFile.originalname,
        content: resumeFile.buffer
      }
    ];

    const result = await sendEmailWithTemplate(
      recruitmentEmail,
      'Support Ticket',
      {
        name,
        Name: name,
        username: name,
        Username: name,
        email,
        Email: email,
        phone: phone || 'Not provided',
        Phone: phone || 'Not provided',
        role,
        Role: role,
        experience: experience || 'Not specified',
        Experience: experience || 'Not specified',
        portfolio: portfolio || 'Not provided',
        Portfolio: portfolio || 'Not provided',
        message: message || 'No message provided.',
        Message: message || 'No message provided.',
        ticketId,
        TicketId: ticketId,
        topic: applicationTopic,
        Topic: applicationTopic
      },
      { fromName: 'Dream60 Careers', attachments }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to submit application. Please try again later.'
      });
    }

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
