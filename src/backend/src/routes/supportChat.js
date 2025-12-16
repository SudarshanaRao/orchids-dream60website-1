import express from 'express';
import SupportChat from '../models/SupportChat.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { sessionId, role, message } = req.body;
    const userId = req.user?.userId || null;

    if (!sessionId || !role || !message) {
      return res.status(400).json({
        success: false,
        message: 'sessionId, role, and message are required'
      });
    }

    if (!['user', 'bot'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be either "user" or "bot"'
      });
    }

    const chatMessage = await SupportChat.createMessage({
      sessionId,
      userId,
      role,
      message
    });

    return res.status(201).json({
      success: true,
      data: chatMessage
    });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save message'
    });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    const messages = await SupportChat.getMessagesBySession(sessionId);

    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching session messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const messages = await SupportChat.getMessagesByUser(userId);

    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    await SupportChat.deleteSessionMessages(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Session messages deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete messages'
    });
  }
});

export default router;
