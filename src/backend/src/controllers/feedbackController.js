const { sendCustomEmail, sendSupportReceiptEmail, buildEmailTemplate, getPrimaryClientUrl, brandStyles } = require('../utils/emailService');

/**
 * Submit Tester Feedback
 * 1. Sends full feedback details to support@dream60.com from info@dream60.com
 * 2. Sends "Support Ticket Received" template to user from noreply@dream60.com
 */
const submitFeedback = async (req, res) => {
  try {
    const { name, email, type, message, userId } = req.body;
    const screenshot = req.file;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Feedback type and message are required',
      });
    }

    const ticketId = `FB-${Date.now()}`;
    const reporterName = name || 'Anonymous';
    const feedbackTopic = `Tester Feedback - ${type.toUpperCase()}`;
    const primaryClientUrl = getPrimaryClientUrl();

    // Prepare attachments if screenshot exists
    const attachments = screenshot ? [{
      filename: screenshot.originalname || 'screenshot.png',
      content: screenshot.buffer,
      contentType: screenshot.mimetype,
    }] : [];

    // 1. Send full details to support@dream60.com from info@dream60.com
    const adminEmailBody = buildEmailTemplate({
      primaryClientUrl,
      title: feedbackTopic,
      status: 'NEW FEEDBACK',
      bodyHtml: `
        <h2 class="hero-title">${feedbackTopic}</h2>
        <p class="hero-text">A new feedback submission has been received from the tester portal.</p>
        <table class="data-table">
          <tr><th>Field</th><th>Details</th></tr>
          <tr><td>Ticket ID</td><td>${ticketId}</td></tr>
          <tr><td>Name</td><td>${reporterName}</td></tr>
          <tr><td>Email</td><td>${email || 'Not provided'}</td></tr>
          <tr><td>User ID</td><td>${userId || 'Not provided'}</td></tr>
          <tr><td>Type</td><td>${type.toUpperCase()}</td></tr>
          <tr><td>Message</td><td>${message}</td></tr>
          <tr><td>Submitted At</td><td>${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
        </table>
        ${screenshot ? '<p class="hero-text">A screenshot has been attached to this email.</p>' : ''}
      `,
    });

    const adminResult = await sendCustomEmail(
      'support@dream60.com',
      `[${ticketId}] ${feedbackTopic} from ${reporterName}`,
      adminEmailBody,
      attachments
    );

    // 2. Send "Support Ticket Received" template to user from noreply@dream60.com
    let userResult = { success: true };
    if (email) {
      userResult = await sendSupportReceiptEmail(email, {
        username: reporterName,
        topic: feedbackTopic,
        ticketId,
      });
    }

    if (adminResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully. Thank you for helping us improve!',
      });
    } else {
      console.error('Failed to send admin feedback email:', adminResult);
      return res.status(500).json({
        success: false,
        message: 'Failed to send feedback email. Please try again later.',
      });
    }
  } catch (err) {
    console.error('Submit Feedback Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  submitFeedback,
};
