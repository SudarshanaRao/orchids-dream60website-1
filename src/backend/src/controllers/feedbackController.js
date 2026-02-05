const { sendEmailWithTemplate } = require('../utils/emailService');

/**
 * Submit Tester Feedback
 * Sends feedback details to dream60.official@gmail.com
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

    const recipientEmail = 'dream60.official@gmail.com';
    const ticketId = `FB-${Date.now()}`;
    const reporterName = name || 'Anonymous';
    const feedbackTopic = `Tester Feedback - ${type.toUpperCase()}`;

    // Prepare attachments if screenshot exists
    const attachments = screenshot ? [{
      filename: screenshot.originalname || 'screenshot.png',
      content: screenshot.buffer,
      contentType: screenshot.mimetype,
    }] : [];

    const result = await sendEmailWithTemplate(
      recipientEmail,
      'Support Ticket',
      {
        name: reporterName,
        Name: reporterName,
        username: reporterName,
        Username: reporterName,
        email: email || 'Not provided',
        Email: email || 'Not provided',
        type,
        Type: type,
        message,
        Message: message,
        userId: userId || 'Not provided',
        UserId: userId || 'Not provided',
        ticketId,
        TicketId: ticketId,
        topic: feedbackTopic,
        Topic: feedbackTopic
      },
      { fromName: 'Dream60 Feedback', attachments }
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully. Thank you for helping us improve!',
      });
    } else {
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
