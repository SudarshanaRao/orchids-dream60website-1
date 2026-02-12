const Admin = require('../models/Admin');
const SupportTicket = require('../models/SupportTicket');
const EmailTemplate = require('../models/EmailTemplate');
const { sendSupportReplyEmail, buildEmailTemplate, getPrimaryClientUrl } = require('../utils/emailService');

// Verify admin helper
const verifyAdmin = async (userId) => {
  if (!userId) return null;
  return Admin.findOne({ admin_id: userId, isActive: true }).lean();
};

/**
 * GET /admin/support/tickets
 * List all support tickets with filters and pagination
 */
const getSupportTickets = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.query.user_id);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { status, category, priority, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      SupportTicket.countDocuments(filter),
    ]);

    // Stats
    const [openCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      stats: { open: openCount, in_progress: inProgressCount, resolved: resolvedCount, closed: closedCount },
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};

/**
 * GET /admin/support/tickets/:ticketId
 * Get single ticket with full details
 */
const getSupportTicketById = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.query.user_id);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId }).lean();
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

/**
 * PATCH /admin/support/tickets/:ticketId/status
 * Update ticket status
 */
const updateTicketStatus = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.query.user_id);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { status, adminNotes, priority } = req.body;
    const update = {};
    if (status) {
      update.status = status;
      if (status === 'resolved' || status === 'closed') update.resolvedAt = new Date();
    }
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (priority) update.priority = priority;

    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { $set: update },
      { new: true }
    ).lean();

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, data: ticket, message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

/**
 * POST /admin/support/tickets/:ticketId/reply
 * Send reply email to user and record it on the ticket
 */
const replyToTicket = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.query.user_id);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { message, templateId, isHtml } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Reply message is required' });

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    let emailHtml;
    if (isHtml && message.includes('<')) {
      // Message is already HTML (from a template) - send it directly
      emailHtml = message;
    } else {
      // Plain text reply - wrap in the branded email template
      const primaryClientUrl = getPrimaryClientUrl();
      emailHtml = buildEmailTemplate({
        primaryClientUrl,
        title: `Re: ${ticket.subject}`,
        status: 'Support Reply',
        bodyHtml: `
          <div style="padding: 30px 40px;">
            <p style="font-size: 16px; color: #e5e7eb; margin-bottom: 16px;">Hi ${ticket.name},</p>
            <div style="font-size: 14px; color: #d1d5db; line-height: 1.8; white-space: pre-wrap;">${message}</div>
            <div style="margin-top: 24px; padding: 16px; background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 12px;">
              <p style="font-size: 12px; color: #a78bfa; margin-bottom: 4px;">Ticket ID: ${ticket.ticketId}</p>
              <p style="font-size: 12px; color: #6b7280;">If you have further questions, please reply to this email or visit our support center.</p>
            </div>
          </div>
        `,
      });
    }

    // Send email from support@dream60.com
    const emailResult = await sendSupportReplyEmail(
      ticket.email,
      `Re: ${ticket.subject} [${ticket.ticketId}]`,
      emailHtml,
      ticket.ticketId
    );

    // Record reply on ticket
    const reply = {
      message,
      sentBy: admin.email || admin.username,
      sentAt: new Date(),
      emailSent: emailResult.success,
      emailMessageId: emailResult.messageId || null,
    };
    ticket.replies.push(reply);

    // Auto-update status to in_progress if it was open
    if (ticket.status === 'open') ticket.status = 'in_progress';

    // If a template was used, increment its usage
    if (templateId) {
      await EmailTemplate.findOneAndUpdate({ template_id: templateId }, { $inc: { usageCount: 1 } });
    }

    await ticket.save();

    res.json({
      success: true,
      message: emailResult.success ? 'Reply sent and recorded' : 'Reply recorded but email failed',
      data: ticket.toObject(),
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
};

/**
 * GET /admin/support/templates
 * Get email templates for suggestions
 */
const getSupportTemplates = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.query.user_id);
    if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const templates = await EmailTemplate.find({ isActive: true })
      .select('template_id name subject body category usageCount')
      .sort({ usageCount: -1 })
      .lean();

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
};

module.exports = {
  getSupportTickets,
  getSupportTicketById,
  updateTicketStatus,
  replyToTicket,
  getSupportTemplates,
};
