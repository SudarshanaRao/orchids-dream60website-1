// src/controllers/contactController.js
const { sendEmailWithTemplate } = require('../utils/emailService');

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

    const ticketId = `D60-${Math.floor(10000 + Math.random() * 90000)}`;
    const submittedAt = new Date().toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });

    const result = await sendEmailWithTemplate(
      supportEmail,
      'Support Ticket',
      {
        name,
        Name: name,
        username: name,
        Username: name,
        email,
        Email: email,
        subject,
        Subject: subject,
        category: categoryLabel,
        Category: categoryLabel,
        message,
        Message: message,
        ticketId,
        TicketId: ticketId,
        topic: subject,
        Topic: subject,
        submittedAt,
        SubmittedAt: submittedAt
      },
      { fromName: 'Dream60 Support' }
    );

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