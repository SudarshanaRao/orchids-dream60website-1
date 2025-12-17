const mongoose = require('mongoose');

const SupportChatKnowledgeChunkSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    // OpenAI embedding vector
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

SupportChatKnowledgeChunkSchema.index({ sourceUrl: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model('SupportChatKnowledgeChunk', SupportChatKnowledgeChunkSchema);
