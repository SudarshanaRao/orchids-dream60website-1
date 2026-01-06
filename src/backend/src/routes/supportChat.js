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
    const { sessionId, userId, message } = req.body || {};
    console.log(`[SUPPORT-CHAT] Incoming /ask. Session: ${sessionId}, Message: "${message}"`);

    if (!sessionId || !message) {
      console.warn('⚠️ [SUPPORT-CHAT] /ask missing sessionId or message');
      return res.status(400).json({
        success: false,
        message: 'sessionId and message are required',
      });
    }

    // Persist the user message
    await saveMessage({ sessionId, userId, role: 'user', message });

    // Retrieve chunks with a more robust search
    let chunks = [];
    console.log(`[SUPPORT-CHAT] Searching knowledge base for: "${message}"`);
    
    // 1. Try text search first
    try {
      chunks = await SupportChatKnowledgeChunk.find(
        { $text: { $search: message } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(8)
        .lean();
      
      console.log(`[SUPPORT-CHAT] Text search found ${chunks.length} chunks`);
    } catch (e) {
      console.warn(`[SUPPORT-CHAT] Text search failed (index might be missing): ${e.message}`);
      // 2. Fallback to regex if text search fails or index is missing
      const searchTerms = String(message).toLowerCase().split(/\s+/).filter(t => t.length > 2);
      if (searchTerms.length > 0) {
        const regex = new RegExp(searchTerms.join('|'), 'i');
        chunks = await SupportChatKnowledgeChunk.find({ content: regex })
          .limit(8)
          .lean();
        console.log(`[SUPPORT-CHAT] Regex fallback found ${chunks.length} chunks`);
      }
    }

    const context = chunks
      .map((c) => c.content)
      .join('\n\n---\n\n');
    
    const sources = [...new Set(chunks.map(c => c.sourceUrl))];

    // Provide conversation history
    const historyDocs = await SupportChatMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const conversation = historyDocs.reverse().map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.message,
    }));

    console.log(`[SUPPORT-CHAT] Generating answer using provider...`);
    
    const reply = await generateAnswerFromContext({
      query: message,
      context,
      conversation,
    });

    console.log(`[SUPPORT-CHAT] Generated reply length: ${reply.length}`);

    await saveMessage({ sessionId, userId, role: 'bot', message: reply });

    return res.status(200).json({
      success: true,
      data: {
        reply,
        sources,
      },
    });
    } catch (error) {
      console.error('❌ [SUPPORT-CHAT] /ask error:', error);
      
      // More specific error message for certain failures
      let message = 'Failed to generate reply. Our team has been notified.';
      if (error.message.includes('API key') || error.message.includes('configured')) {
        message = 'AI service is currently not configured properly. Please contact support.';
      } else if (error.message.includes('fetch') || error.message.includes('connect')) {
        message = 'Network error while reaching AI service. Please try again.';
      }

      return res.status(500).json({ 
        success: false, 
        message: message,
        error: error.message
      });
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
