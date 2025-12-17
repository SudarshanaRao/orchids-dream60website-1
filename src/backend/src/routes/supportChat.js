const express = require('express');
const SupportChatMessage = require('../models/SupportChat');
const SupportChatKnowledgeChunk = require('../models/SupportChatKnowledgeChunk');
const {
  cosineSimilarity,
  embedTexts,
  generateAnswerFromContext,
} = require('../utils/supportChatAi');

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

// AI chat endpoint (OpenAI + Dream60 website knowledge)
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

    // Load website knowledge chunks
    const chunks = await SupportChatKnowledgeChunk.find({})
      .select('sourceUrl content embedding')
      .lean();

    let context = '';
    let sources = [];

    if (chunks.length > 0) {
      // Embed user query and retrieve top-k chunks by cosine similarity
      const [queryEmbedding] = await embedTexts([message]);

      const scored = chunks
        .map((c) => ({
          sourceUrl: c.sourceUrl,
          content: c.content,
          score: cosineSimilarity(queryEmbedding, c.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      sources = Array.from(new Set(scored.map((s) => s.sourceUrl)));
      context = scored
        .map((s) => `Source: ${s.sourceUrl}\n${s.content}`)
        .join('\n\n---\n\n');
    }

    // Provide short conversation history for coherence (last 6 messages)
    const historyDocs = await SupportChatMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(6)
      .lean();

    const conversation = historyDocs
      .reverse()
      .map((m) => ({
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

    // Provide a clear error when OpenAI key isn't configured
    if (msg.includes('OPENAI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI chatbot is not configured (missing OPENAI_API_KEY).',
      });
    }

    return res.status(500).json({ success: false, message: 'Failed to generate reply' });
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
