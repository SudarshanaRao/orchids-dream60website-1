const { sendCustomEmail } = require('../utils/emailService');

/**
 * Submit Tester Feedback
 * Sends feedback details to dream60.official@gmail.com
 */
const submitFeedback = async (req, res) => {
  try {
    const { name, email, type, message, userId } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Feedback type and message are required',
      });
    }

    const recipientEmail = 'dream60.official@gmail.com';
    const subject = `Tester Feedback: ${type.toUpperCase()} - ${name || 'Anonymous'}`;
    
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #8B5CF6; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">New Tester Feedback</h2>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Name:</strong> ${name || 'Anonymous'}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>User ID:</strong> ${userId || 'Not provided'}</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          This feedback was submitted via the Dream60 Tester Page.
        </p>
      </div>
    `;

    const result = await sendCustomEmail(recipientEmail, subject, bodyHtml);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully. Thank you!',
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
