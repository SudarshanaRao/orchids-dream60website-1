const mongoose = require('mongoose');

const SupportChatKnowledgeChunkSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    // Legacy field (previously OpenAI embeddings). Kept optional for backward compatibility.
    embedding: { type: [Number], required: false },
  },
  { timestamps: true }
);

SupportChatKnowledgeChunkSchema.index({ sourceUrl: 1, chunkIndex: 1 }, { unique: true });
SupportChatKnowledgeChunkSchema.index({ content: 'text' });

module.exports = mongoose.model('SupportChatKnowledgeChunk', SupportChatKnowledgeChunkSchema);
