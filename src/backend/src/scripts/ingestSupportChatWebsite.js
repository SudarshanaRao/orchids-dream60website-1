/**
 * Polyfill for undici / fetch (Node.js)
 */
const { File } = require('node:buffer');
global.File = File;

/*
  Ingest Dream60 website pages into MongoDB for the Support Chat AI.
  ...
*/

const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

// Load .env even when this script is executed from a different working directory.
// Priority: current working dir → backend root → project root.
const loadEnv = () => {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),

    // __dirname = src/backend/src/scripts
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../.env.local'),

    // project root
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../../.env.local'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
    }
  }
};

loadEnv();

const cheerio = require('cheerio');
const { connectDB } = require('../config/db');
const SupportChatKnowledgeChunk = require('../models/SupportChatKnowledgeChunk');
const { chunkText, normalizeText } = require('../utils/supportChatAi');


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

  const docs = chunks.map((content, idx) => ({
    sourceUrl: url,
    chunkIndex: idx,
    content,
  }));

  if (docs.length > 0) {
    await SupportChatKnowledgeChunk.insertMany(docs, { ordered: false });
  }

  return { url, chunks: chunks.length, stored: docs.length };
};

const main = async () => {
  const urls = getUrlsToIngest();
  if (urls.length === 0) {
    console.error('No URLs to ingest. Set FRONTEND_URL/CLIENT_URL or SUPPORT_CHAT_INGEST_URLS.');
    process.exit(1);
  }

  await connectDB();
  await SupportChatKnowledgeChunk.syncIndexes();

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
