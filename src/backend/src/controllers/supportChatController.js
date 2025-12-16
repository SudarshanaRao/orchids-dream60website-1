const SupportChat = require('../models/SupportChat');
const { randomUUID } = require('crypto');

const sanitizeText = (text = '') => String(text || '').toString().slice(0, 4000);

const startChat = async (req, res) => {
  try {
    const { userId = null, name = null, email = null, initialMessage = '' } = req.body || {};
    const threadId = randomUUID();

    const chat = new SupportChat({
      threadId,
      userId,
      name,
      email,
      messages: [],
      status: 'open',
      lastMessageAt: new Date(),
    });

    if (initialMessage) {
      chat.messages.push({ role: 'user', text: sanitizeText(initialMessage) });
      chat.lastMessageAt = new Date();
    }

    // Add a welcome bot message so the thread always has context
    chat.messages.push({
      role: 'bot',
      text: 'Thanks for reaching out to Dream60! Tell me your question and I will help with bidding, prize claims, or account issues.',
    });

    await chat.save();

    return res.status(201).json({ success: true, data: chat });
  } catch (error) {
    console.error('Error starting support chat:', error);
    return res.status(500).json({ success: false, message: 'Failed to start chat' });
  }
};

const addMessage = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { role = 'user', text, userId = null, name = null, email = null } = req.body || {};

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const chat = await SupportChat.findOne({ threadId });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat thread not found' });
    }

    chat.messages.push({ role: role === 'bot' ? 'bot' : 'user', text: sanitizeText(text) });
    chat.lastMessageAt = new Date();

    // Update basic user info if provided
    if (userId) chat.userId = userId;
    if (name) chat.name = name;
    if (email) chat.email = email;

    await chat.save();

    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error('Error adding chat message:', error);
    return res.status(500).json({ success: false, message: 'Failed to add message' });
  }
};

const getChat = async (req, res) => {
  try {
    const { threadId } = req.params;
    const chat = await SupportChat.findOne({ threadId });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat thread not found' });
    }

    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chat' });
  }
};

module.exports = {
  startChat,
  addMessage,
  getChat,
};
