const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'bot'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const SupportChatSchema = new mongoose.Schema(
  {
    threadId: {
      type: String,
      unique: true,
      default: () => randomUUID(),
    },
    userId: { type: String, default: null },
    name: { type: String, default: null },
    email: { type: String, default: null },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    metadata: { type: Object, default: {} },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportChat', SupportChatSchema);
