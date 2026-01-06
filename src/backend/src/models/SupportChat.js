const mongoose = require('mongoose');

const SupportChatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, default: null, index: true },
    role: { type: String, enum: ['user', 'bot'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportChatMessage', SupportChatMessageSchema);
