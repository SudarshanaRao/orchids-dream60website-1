// src/controllers/contactController.js
const nodemailer = require('nodemailer');
const { sendEmailWithTemplate, sendSupportReceiptEmail, buildEmailTemplate, getPrimaryClientUrl } = require('../utils/emailService');
const SupportTicket = require('../models/SupportTicket');

/**
 * Send Contact Form Message
 * Receives contact form data, saves a support ticket to DB, and sends email to support@dream60.com
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

    // Recipient email
    const supportEmail = 'support@dream60.com';

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
      support: 'Support',
      other: 'Other',
    };

    const categoryLabel = categoryLabels[category] || category;

    const ticketId = `D60-${Math.floor(10000 + Math.random() * 90000)}`;
    const submittedAt = new Date().toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });

    // Determine source based on category
    const source = category === 'support' ? 'support_form' : 'contact_form';

    // Determine priority based on category
    let priority = 'medium';
    if (['payment', 'account'].includes(category)) priority = 'high';
    if (['feedback', 'partnership', 'press'].includes(category)) priority = 'low';

    // Look up userId if user is logged in (by email)
    let userId = null;
    try {
      const User = require('../models/user');
      const existingUser = await User.findOne({ email: email.toLowerCase() }).select('_id').lean();
      if (existingUser) userId = existingUser._id;
    } catch (e) {
      // Non-critical - proceed without userId
    }

    // Save support ticket to database
    let savedTicket = null;
    try {
      savedTicket = await SupportTicket.create({
        ticketId,
        userId,
        name,
        email,
        subject,
        category,
        message,
        status: 'open',
        priority,
        source,
        emailSent: false
      });
      console.log(`📝 Support ticket ${ticketId} saved to database`);
    } catch (dbErr) {
      console.error('⚠️ Failed to save support ticket to DB:', dbErr.message);
    }

    // Log the submission
    console.log('📩 New Support Ticket:');
    console.log(`   Ticket ID: ${ticketId}`);
    console.log(`   From: ${name} <${email}>`);
    console.log(`   Category: ${categoryLabel}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Source: ${source}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Send email to support@dream60.com
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
      console.log(`✅ Support email sent to ${supportEmail} for ticket ${ticketId}`);
      // Update ticket emailSent status
      if (savedTicket) {
        await SupportTicket.updateOne({ _id: savedTicket._id }, { emailSent: true });
      }
    } else {
      console.log(`⚠️ Email service unavailable for ticket ${ticketId}, but ticket saved to DB`);
    }

    // Send auto-confirmation email to the user via noreply@dream60.com
    try {
      const confirmResult = await sendSupportReceiptEmail(email, {
        username: name,
        topic: subject,
        ticketId
      });
      if (confirmResult.success) {
        console.log(`✅ Auto-confirmation email sent to ${email} for ticket ${ticketId}`);
      } else {
        console.log(`⚠️ Failed to send confirmation email to ${email}: ${confirmResult.message || 'unknown error'}`);
      }
    } catch (confirmErr) {
      console.error('⚠️ Error sending confirmation email to user:', confirmErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you within 24 hours.",
      ticketId
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
