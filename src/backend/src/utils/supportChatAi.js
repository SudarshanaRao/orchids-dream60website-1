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

const getRequiredEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`${key} is not configured`);
  return val;
};

const assertFetch = () => {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available. Use Node.js 18+ for AI chat.');
  }
};

const chatWithOpenAiCompatible = async ({ baseUrl, apiKey, model, messages, temperature = 0.2, extraHeaders = {} }) => {
  assertFetch();

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data?.choices?.[0]?.message?.content?.trim();
};

const chatWithOllama = async ({ baseUrl, model, messages, temperature = 0.2 }) => {
  assertFetch();

  // Ollama uses its own chat API shape
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature,
      },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data?.message?.content?.trim();
};

const getProvider = () => String(process.env.SUPPORT_CHAT_PROVIDER || 'ollama').toLowerCase();

const getModelForProvider = (provider) => {
  if (process.env.SUPPORT_CHAT_MODEL) return process.env.SUPPORT_CHAT_MODEL;

  if (provider === 'groq') return 'llama-3.1-8b-instant';
  if (provider === 'openrouter') return 'meta-llama/llama-3.1-8b-instruct';
  if (provider === 'together') return 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';

  // ollama default (you must have this model pulled locally)
  return 'llama3.1';
};

const generateAnswerFromContext = async ({ query, context, conversation = [] }) => {
  const provider = getProvider();
  const model = getModelForProvider(provider);

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

  const temperature = Number.isFinite(Number(process.env.SUPPORT_CHAT_TEMPERATURE))
    ? Number(process.env.SUPPORT_CHAT_TEMPERATURE)
    : 0.2;

  let reply;

  if (provider === 'ollama') {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    reply = await chatWithOllama({ baseUrl, model, messages, temperature });
  } else if (provider === 'groq') {
    const apiKey = getRequiredEnv('GROQ_API_KEY');
    reply = await chatWithOpenAiCompatible({
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey,
      model,
      messages,
      temperature,
    });
  } else if (provider === 'openrouter') {
    const apiKey = getRequiredEnv('OPENROUTER_API_KEY');
    reply = await chatWithOpenAiCompatible({
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey,
      model,
      messages,
      temperature,
      // Optional but recommended by OpenRouter
      extraHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.FRONTEND_URL || process.env.CLIENT_URL || '',
        'X-Title': 'Dream60 Support Chat',
      },
    });
  } else if (provider === 'together') {
    const apiKey = getRequiredEnv('TOGETHER_API_KEY');
    reply = await chatWithOpenAiCompatible({
      baseUrl: 'https://api.together.xyz/v1',
      apiKey,
      model,
      messages,
      temperature,
    });
  } else if (provider === 'openai_compat') {
    const apiKey = getRequiredEnv('SUPPORT_CHAT_OPENAI_COMPAT_API_KEY');
    const baseUrl = getRequiredEnv('SUPPORT_CHAT_OPENAI_COMPAT_BASE_URL');
    reply = await chatWithOpenAiCompatible({ baseUrl, apiKey, model, messages, temperature });
  } else {
    throw new Error(`Unsupported SUPPORT_CHAT_PROVIDER: ${provider}`);
  }

  return reply || "I don't have that information on the Dream60 website yet.";
};

module.exports = {
  normalizeText,
  chunkText,
  generateAnswerFromContext,
};
