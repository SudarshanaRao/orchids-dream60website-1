const { sendCustomEmail } = require('../utils/emailService');

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
    const subject = `🚀 [TESTER FEEDBACK] ${type.toUpperCase()} - ${name || 'Anonymous'}`;
    
    // Determine color based on type
    const typeColors = {
      idea: '#10B981',      // Green
      suggestion: '#3B82F6', // Blue
      error: '#EF4444',      // Red
      issue: '#F59E0B',      // Amber
    };
    const typeColor = typeColors[type] || '#8B5CF6';

    const bodyHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #1a1128 0%, #120d1c 100%); padding: 32px; text-align: center; border-bottom: 4px solid ${typeColor};">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">New Tester Feedback</h1>
          <div style="display: inline-block; margin-top: 12px; padding: 6px 16px; background-color: ${typeColor}; color: #ffffff; border-radius: 999px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
            ${type}
          </div>
        </div>
        
        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h3 style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Reporter Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${name || 'Anonymous'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>User ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-family: monospace; font-size: 12px; color: #111827;">${userId || 'Not provided'}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Feedback Message</h3>
            <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 20px; border-radius: 8px; color: #111827; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>

          ${screenshot ? `
            <div style="margin-bottom: 24px;">
              <h3 style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Attached Media</h3>
              <p style="font-size: 13px; color: #4b5563;">An image reference was attached to this feedback.</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">This feedback was automatically generated from the Dream60 Tester Portal.</p>
          </div>
        </div>
      </div>
    `;

    // Prepare attachments if screenshot exists
    const attachments = screenshot ? [{
      filename: screenshot.originalname || 'screenshot.png',
      content: screenshot.buffer,
      contentType: screenshot.mimetype,
    }] : [];

    const result = await sendCustomEmail(recipientEmail, subject, bodyHtml, attachments);

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
