const { sendEmailWithTemplate, sendSupportReceiptEmail } = require('../utils/emailService');

/**
 * Submit Tester Feedback
 * 1. Sends "Tester Feedback Notification" template to support@dream60.com from info@dream60.com
 * 2. Sends "Support Request Received" template to user from noreply@dream60.com
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
    const feedbackType = type.toUpperCase();
    const submittedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    // Prepare attachments if screenshot exists
    const attachments = screenshot ? [{
      filename: screenshot.originalname || 'screenshot.png',
      content: screenshot.buffer,
      contentType: screenshot.mimetype,
    }] : [];

    // 1. Send "Tester Feedback Notification" template to support@dream60.com from info@dream60.com
    const adminResult = await sendEmailWithTemplate(
      'support@dream60.com',
      'Tester Feedback Notification',
      {
        ticketId, TicketId: ticketId,
        name: reporterName, Name: reporterName, username: reporterName, Username: reporterName,
        email: email || 'Not provided', Email: email || 'Not provided',
        userId: userId || 'Not provided', UserId: userId || 'Not provided',
        type: feedbackType, Type: feedbackType, feedbackType, FeedbackType: feedbackType,
        message, Message: message,
        submittedAt, SubmittedAt: submittedAt,
        hasScreenshot: screenshot ? 'Yes' : 'No',
      },
      {
        fromName: 'Dream60 Feedback',
        attachments,
      }
    );

    // 2. Send "Support Request Received" template to user from noreply@dream60.com
    if (email) {
      await sendSupportReceiptEmail(email, {
        username: reporterName,
        topic: `Tester Feedback - ${feedbackType}`,
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
