/*
  Ingest Dream60 website pages into MongoDB for the Support Chat AI.

  Usage (from src/backend):
    node src/scripts/ingestSupportChatWebsite.js

  Env:
    OPENAI_API_KEY (required)
    FRONTEND_URL or CLIENT_URL (recommended)
    SUPPORT_CHAT_INGEST_URLS (optional comma-separated full URLs)
*/

require('dotenv').config();
const cheerio = require('cheerio');
const { connectDB } = require('../config/db');
const SupportChatKnowledgeChunk = require('../models/SupportChatKnowledgeChunk');
const { chunkText, embedTexts, normalizeText } = require('../utils/supportChatAi');

const getDefaultUrls = () => {
  const base = (process.env.FRONTEND_URL || process.env.CLIENT_URL || '').replace(/\/$/, '');
  if (!base) return [];
  return [
    `${base}/`,
    `${base}/support`,
    `${base}/rules`,
    `${base}/participation`,
    `${base}/terms`,
    `${base}/privacy`,
    `${base}/contact`,
  ];
};

const getUrlsToIngest = () => {
  const env = String(process.env.SUPPORT_CHAT_INGEST_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return env.length > 0 ? env : getDefaultUrls();
};

const extractPageText = async (url) => {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available. Use Node.js 18+ for ingestion.');
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'Dream60SupportChatIngest/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe').remove();

  const text = normalizeText($('body').text());
  return text;
};

const ingestUrl = async (url) => {
  const text = await extractPageText(url);
  const chunks = chunkText(text);

  // Replace prior chunks for the same URL
  await SupportChatKnowledgeChunk.deleteMany({ sourceUrl: url });

  // Embed in batches to avoid request limits
  const batchSize = 48;
  let created = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await embedTexts(batch);

    const docs = batch.map((content, idx) => ({
      sourceUrl: url,
      chunkIndex: i + idx,
      content,
      embedding: embeddings[idx],
    }));

    await SupportChatKnowledgeChunk.insertMany(docs, { ordered: false });
    created += docs.length;
  }

  return { url, chunks: chunks.length, stored: created };
};

const main = async () => {
  const urls = getUrlsToIngest();
  if (urls.length === 0) {
    console.error('No URLs to ingest. Set FRONTEND_URL/CLIENT_URL or SUPPORT_CHAT_INGEST_URLS.');
    process.exit(1);
  }

  await connectDB();

  console.log(`🔎 Ingesting ${urls.length} pages into SupportChatKnowledgeChunk...`);
  const results = [];

  for (const url of urls) {
    console.log(`➡️  ${url}`);
    // eslint-disable-next-line no-await-in-loop
    const r = await ingestUrl(url);
    results.push(r);
    console.log(`✅ Stored ${r.stored}/${r.chunks} chunks`);
  }

  console.log('✅ Done:', results);
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
