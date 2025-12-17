const OpenAI = require('openai');

const getRequiredEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`${key} is not configured`);
  return val;
};

const getOpenAiClient = () => {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');
  return new OpenAI({ apiKey });
};

const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const chunkText = (text, { chunkSize = 1400, overlap = 250 } = {}) => {
  const clean = normalizeText(text);
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(clean.length, start + chunkSize);
    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === clean.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? -1 : dot / denom;
};

const embedTexts = async (texts) => {
  const client = getOpenAiClient();
  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

  const input = Array.isArray(texts) ? texts : [texts];
  const response = await client.embeddings.create({ model, input });
  return response.data.map((d) => d.embedding);
};

const generateAnswerFromContext = async ({ query, context, conversation = [] }) => {
  const client = getOpenAiClient();
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

  const system =
    'You are Dream60 Assist, a support chatbot for the Dream60 website.\n' +
    'You MUST answer ONLY using the provided WEBSITE CONTEXT below.\n' +
    'If the answer is not present in the context, say: "I don\'t have that information on the Dream60 website yet."\n' +
    'Do not use general knowledge. Do not guess. Keep answers concise and helpful.';

  const messages = [
    { role: 'system', content: system + `\n\nWEBSITE CONTEXT:\n${context || '(no context provided)'}` },
    ...conversation,
    { role: 'user', content: query },
  ];

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });

  return completion.choices?.[0]?.message?.content?.trim() || "I don't have that information on the Dream60 website yet.";
};

module.exports = {
  normalizeText,
  chunkText,
  cosineSimilarity,
  embedTexts,
  generateAnswerFromContext,
};
