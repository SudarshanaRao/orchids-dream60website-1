const express = require('express');
const SupportChatMessage = require('../models/SupportChat');

const router = express.Router();

// Save a chat message (user or bot)
router.post('/message', async (req, res) => {
  try {
    const { sessionId, userId, role, message } = req.body;

    if (!sessionId || !role || !message) {
      return res.status(400).json({
        success: false,
        message: 'sessionId, role, and message are required',
      });
    }

    if (!['user', 'bot'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be either "user" or "bot"',
      });
    }

    const now = Date.now();
    const doc = await SupportChatMessage.create({
      sessionId,
      userId: userId || null,
      role,
      message,
      timestamp: now,
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [SUPPORT-CHAT] Error creating message:', error);
    return res.status(500).json({ success: false, message: 'Failed to save message' });
  }
});

// Get a session's messages
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const messages = await SupportChatMessage.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('❌ [SUPPORT-CHAT] Error fetching session messages:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Get all messages for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await SupportChatMessage.find({ userId })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('❌ [SUPPORT-CHAT] Error fetching user messages:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Delete a session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await SupportChatMessage.deleteMany({ sessionId });
    return res.status(200).json({ success: true, message: 'Session messages deleted successfully' });
  } catch (error) {
    console.error('❌ [SUPPORT-CHAT] Error deleting session messages:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete messages' });
  }
});

module.exports = router;
