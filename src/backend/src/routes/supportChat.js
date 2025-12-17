const express = require('express');
const SupportChatMessage = require('../models/SupportChat');
const SupportChatKnowledgeChunk = require('../models/SupportChatKnowledgeChunk');
const { generateAnswerFromContext } = require('../utils/supportChatAi');

const router = express.Router();

const saveMessage = async ({ sessionId, userId, role, message }) => {
  const now = Date.now();
  return SupportChatMessage.create({
    sessionId,
    userId: userId || null,
    role,
    message,
    timestamp: now,
  });
};

// Save a chat message (user or bot) (legacy endpoint)
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

    const doc = await saveMessage({ sessionId, userId, role, message });
    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [SUPPORT-CHAT] Error creating message:', error);
    return res.status(500).json({ success: false, message: 'Failed to save message' });
  }
});

// AI chat endpoint (Open-source models only)
router.post('/ask', async (req, res) => {
  try {
    const { sessionId, userId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: 'sessionId and message are required',
      });
    }

    // Persist the user message
    await saveMessage({ sessionId, userId, role: 'user', message });

      // Retrieve top chunks via MongoDB text search (free; no embeddings)
      // If indexes aren't created yet, fall back to a simple regex search.
      let chunks = [];

      try {
        chunks = await SupportChatKnowledgeChunk.find(
          { $text: { $search: message } },
          { score: { $meta: 'textScore' } }
        )
          .select('sourceUrl content')
          .sort({ score: { $meta: 'textScore' } })
          .limit(6)
          .lean();
      } catch (e) {
        const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const terms = String(message || '')
          .split(/\s+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 3)
          .slice(0, 6);

        if (terms.length > 0) {
          const regex = new RegExp(terms.map(escapeRegExp).join('|'), 'i');
          chunks = await SupportChatKnowledgeChunk.find({ content: regex })
            .select('sourceUrl content')
            .limit(6)
            .lean();
        }
      }

    const sources = Array.from(new Set(chunks.map((c) => c.sourceUrl)));
    const context = chunks
      .map((c) => `Source: ${c.sourceUrl}\n${c.content}`)
      .join('\n\n---\n\n');

    // Provide short conversation history for coherence (last 6 messages)
    const historyDocs = await SupportChatMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(6)
      .lean();

    const conversation = historyDocs.reverse().map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.message,
    }));

    const reply = await generateAnswerFromContext({
      query: message,
      context,
      conversation,
    });

    await saveMessage({ sessionId, userId, role: 'bot', message: reply });

    return res.status(200).json({
      success: true,
      data: {
        reply,
        sources,
      },
    });
  } catch (error) {
    const msg = String(error?.message || error);
    console.error('❌ [SUPPORT-CHAT] /ask error:', msg);

    // Common missing-key messages
    if (
      msg.includes('GROQ_API_KEY') ||
      msg.includes('OPENROUTER_API_KEY') ||
      msg.includes('TOGETHER_API_KEY') ||
      msg.includes('SUPPORT_CHAT_OPENAI_COMPAT_API_KEY')
    ) {
      return res.status(503).json({
        success: false,
        message: `AI chatbot is not configured (${msg}).`,
      });
    }

    return res.status(500).json({ success: false, message: 'Failed to generate reply' });
  }
});

// Get a session's messages
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const messages = await SupportChatMessage.find({ sessionId }).sort({ timestamp: 1 }).lean();

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

    const messages = await SupportChatMessage.find({ userId }).sort({ timestamp: 1 }).lean();

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
