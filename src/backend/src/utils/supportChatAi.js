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

const getProvider = () => {
  // Check explicit env var first
  const envProvider = process.env.SUPPORT_CHAT_PROVIDER;
  let provider = (envProvider || 'groq').toLowerCase().trim();
  
  // Safety check: If provider is ollama but we are likely on a server without local ollama,
  // or if we have a Groq key and want to be sure.
  if (provider === 'ollama' && !process.env.OLLAMA_BASE_URL && process.env.GROQ_API_KEY) {
    console.warn('[AI-DEBUG] Provider was "ollama" but no OLLAMA_BASE_URL found. Falling back to "groq" because GROQ_API_KEY is present.');
    provider = 'groq';
  }

  console.log(`[AI-DEBUG] Final provider choice: "${provider}" (from env: "${envProvider || 'undefined'}")`);
  return provider;
};

const getModelForProvider = (provider) => {
  if (process.env.SUPPORT_CHAT_MODEL) return process.env.SUPPORT_CHAT_MODEL;

  if (provider === 'groq') return 'llama-3.1-8b-instant';
  if (provider === 'openrouter') return 'meta-llama/llama-3.1-8b-instruct';
  if (provider === 'together') return 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';

  // default for others
  return 'llama3.1';
};

  const generateAnswerFromContext = async ({ query, context, conversation = [] }) => {
    const provider = getProvider();
    const model = getModelForProvider(provider);
  
    console.log(`[AI-DEBUG] Using model: "${model}" on provider: "${provider}"`);
  
    // Fallback if no context and no provider key
    if (provider === 'groq' && !process.env.GROQ_API_KEY) {
      console.error('[AI-DEBUG] GROQ_API_KEY is missing from environment variables');
      return "I'm sorry, I'm currently unable to access my knowledge base. Please contact our support team directly at dream60.official@gmail.com for assistance.";
    }
  
      const system =
        'You are Dream60 Assist, the official support chatbot for Dream60 (an auction gaming platform).\n' +
        'Your goal is to help users by answering questions based STRICTLY and ONLY on the provided WEBSITE CONTEXT.\n' +
        'Rules:\n' +
        '1. If the answer is found in the context, provide a clear, concise, and friendly response.\n' +
        '2. If the user asks a question that is NOT covered by the context, you MUST say exactly: "I don\'t have that specific information on the Dream60 website yet. You can contact our support team in the Contact Us section for further assistance."\n' +
        '3. Do NOT make up any information. Do NOT use your own training data about auctions or other platforms.\n' +
        '4. Keep responses professional and localized for Indian users.\n' +
        '5. Only discuss topics like bidding rules, entry fees, prize claims, and participation if they appear in the context.';
  
    const messages = [
      { role: 'system', content: system + `\n\nWEBSITE CONTEXT:\n${context || '(no context provided)'}` },
      ...conversation,
      { role: 'user', content: query },
    ];
  
    const temperature = Number.isFinite(Number(process.env.SUPPORT_CHAT_TEMPERATURE))
      ? Number(process.env.SUPPORT_CHAT_TEMPERATURE)
      : 0.2;
  
    try {
      let reply;
  
      if (provider === 'ollama') {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
        console.log(`[AI-DEBUG] Calling Ollama at ${baseUrl}`);
        reply = await chatWithOllama({ baseUrl, model, messages, temperature });
      } else if (provider === 'groq') {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          throw new Error('GROQ_API_KEY is not configured in environment variables');
        }
        console.log(`[AI-DEBUG] Calling Groq API (key prefix: ${apiKey.substring(0, 6)}...)`);
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
    } catch (err) {
      console.error(`[AI-DEBUG] AI Provider Error (${provider}):`, err.message);
      // Fallback message instead of throwing
      return "I'm having a bit of trouble generating a reply right now. Please try rephrasing your question or check back in a few minutes.";
    }
  };

module.exports = {
  normalizeText,
  chunkText,
  generateAnswerFromContext,
};
