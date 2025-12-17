/*
  Purge AI-generated Support Chat data.
  - Deletes all SupportChatMessage docs with role="bot"
  - Deletes all SupportChatKnowledgeChunk docs

  Usage:
    node src/backend/src/scripts/purgeSupportChatAI.js
*/

const path = require('path');

// Ensure we load the backend env (src/backend/.env)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const SupportChatMessage = require('../models/SupportChat');
const SupportChatKnowledgeChunk = require('../models/SupportChatKnowledgeChunk');

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

  const bot = await SupportChatMessage.deleteMany({ role: 'bot' });
  const chunks = await SupportChatKnowledgeChunk.deleteMany({});

  console.log('✅ Deleted bot messages:', bot.deletedCount);
  console.log('✅ Deleted knowledge chunks:', chunks.deletedCount);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Purge failed:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
