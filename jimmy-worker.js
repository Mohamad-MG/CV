/**
 * 🤖 Jimmy vFinal — Cloudflare Worker (Fixed + Enhanced)
 * Security + Language + Prompt + Normalize + Providers + Router + Retry
 * 
 * DEBUG MODE: Set DEBUG_MODE=true in Cloudflare env to see detailed errors
 */

// ===== RETRY CONFIGURATION =====
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const DEFAULT_GEMINI_TIMEOUT_MS = 15000;  // 15 seconds (was 6.5s)
const DEFAULT_OPENAI_TIMEOUT_MS = 15000;  // 15 seconds (was 8s)

function buildCorsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(payload, status, headers) {
  return new Response(JSON.stringify(payload), { status, headers });
}

function clampNumber(value, min, max, fallback) {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/* =========================
   Language (EN default)
========================= */
function detectLang(body, env) {
  const explicit = (body?.language || "").toLowerCase();
  if (explicit === "ar" || explicit === "en") return explicit;

  const defaultLang = (env.DEFAULT_LANG || "en").toLowerCase() === "ar" ? "ar" : "en";
  const msgs = Array.isArray(body?.messages) ? body.messages : [];
  const lastUser = [...msgs].reverse().find(m => (m?.role || "").toLowerCase() === "user");
  const text = (lastUser?.content || "").toString().trim();

  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasLatin = /[A-Za-z]/.test(text);

  if (hasArabic) return "ar";
  if (hasLatin) return "en";
  return defaultLang;
}

/* =========================
   Messages Normalization
========================= */
function normalizeMessages(body, env) {
  const raw = Array.isArray(body?.messages) ? body.messages : [];

  const maxHistory = clampNumber(
    body?.max_history ?? env.MAX_HISTORY,
    1,
    30,
    16
  );

  const maxChars = clampNumber(
    env.MAX_INPUT_CHARS,
    500,
    8000,
    4000
  );

  const cleaned = raw
    .map(m => {
      const roleRaw = (m?.role || "").toLowerCase();
      let role =
        roleRaw === "user" ? "user" :
          roleRaw === "assistant" || roleRaw === "model" ? "assistant" :
            null;

      const content = (m?.content || "").toString().trim();
      if (!role || !content) return null;

      return { role, content: content.slice(0, maxChars) };
    })
    .filter(Boolean);

  return cleaned.slice(-maxHistory);
}

function countUserTurns(messages) {
  return messages.filter(m => m.role === "user").length;
}

function shouldAllowContact(messages, env) {
  const asked = messages.some(m =>
    m.role === "user" &&
    /واتساب|رقم|مكالمة|تواصل|whatsapp|call|contact/i.test(m.content || "")
  );

  const afterTurns = clampNumber(
    env.CONTACT_AFTER_USER_TURNS,
    1,
    20,
    6
  );

  return asked || countUserTurns(messages) >= afterTurns;
}

/* =========================
   Prompt Builder
========================= */
function getSystemPrompt(env, lang, allowContact) {
  const promptAR = (env.SYSTEM_PROMPT_AR || env.SYSTEM_PROMPT || `
أنت "كابتن جيمي" — المساعد الذكي الرسمي لمحمد جمال.
بتتكلم عربي مصري مختصر وعملي.

قواعد أساسية:
- ردود قصيرة (2-6 سطور).
- ممنوع تقول "أنا نموذج لغوي" أو تذكر أي مزوّد.
- اسأل سؤال متابعة واحد ذكي فقط.
- بدون إيموجيز.

Fact Drip (بدون مبالغة أو اختلاق):
- لما السؤال عن النمو: اذكر 6x (لو ده مثبت عندك فعلاً).
- لما السؤال عن السكيل: اذكر قصة/معلومة قوية (لو مثبتة).
- لما السؤال عن الأنظمة: اشرح طريقة شغل (تشخيص → خطة → تنفيذ → قياس).

التواصل:
- ${allowContact
      ? "مسموح Soft CTA فقط. لو طُلب تواصل، وجهه لزر واتساب/الاتصال في الموقع."
      : "ممنوع تقترح التواصل دلوقتي. كمّل بناء الثقة."
    }
`.trim());

  const promptEN = (env.SYSTEM_PROMPT_EN || env.SYSTEM_PROMPT || `
You are "Captain Jimmy" — Mohamed Gamal's official assistant.
Tone: short, clear, confident.

Rules:
- Keep it 2–6 lines.
- Never mention you're an AI or any provider.
- Ask ONE smart follow-up question.
- No emojis.

Fact drip (no inventing):
- Growth topic → mention 6x (only if verified).
- Scale topic → mention strong proof (only if verified).
- Systems topic → explain the method (diagnose → plan → execute → measure).

Contact:
- ${allowContact
      ? "You may use a soft CTA. If asked to contact, point them to the WhatsApp/Call buttons on the website."
      : "Do NOT suggest contact yet. Keep building trust."
    }
`.trim());

  return lang === "en" ? promptEN : promptAR;
}

/* =========================
   Timeout Helpers
========================= */
function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

async function safeFetch(url, options, timeoutMs) {
  const t = withTimeout(timeoutMs);
  try {
    return await fetch(url, { ...options, signal: t.signal });
  } finally {
    t.cancel();
  }
}

/* =========================
   Retry with Exponential Backoff
========================= */
async function safeFetchWithRetry(url, options, timeoutMs, requestId) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await safeFetch(url, options, timeoutMs);

      // Success or client error (4xx) - don't retry
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }

      // Server error (5xx) - retry with backoff
      console.warn(`[${requestId}] Attempt ${attempt}/${MAX_RETRIES} failed: HTTP ${res.status}`);
      lastError = new Error(`HTTP ${res.status}`);

    } catch (err) {
      console.warn(`[${requestId}] Attempt ${attempt}/${MAX_RETRIES} error: ${err.message}`);
      lastError = err;
    }

    // Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[${requestId}] Waiting ${delay}ms before retry...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/* =========================
   Providers
========================= */
async function callGemini(env, messages, system, temperature, requestId) {
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const timeoutMs = Number(env.GEMINI_TIMEOUT_MS || DEFAULT_GEMINI_TIMEOUT_MS);
  const debugMode = env.DEBUG_MODE === "true" || env.DEBUG_MODE === true;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  };

  if (typeof temperature === "number") {
    payload.generationConfig = { temperature };
  }

  console.log(`[${requestId}] Calling Gemini (${model}), timeout: ${timeoutMs}ms`);

  const res = await safeFetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    timeoutMs,
    requestId
  );

  const text = await res.text();
  if (!res.ok) {
    const errorMsg = `[${requestId}] Gemini error: HTTP ${res.status}`;
    console.error(errorMsg, text);

    if (debugMode) {
      throw new Error(`Gemini API Error (${res.status}): ${text.substring(0, 500)}`);
    }
    throw new Error("Gemini API temporarily unavailable");
  }

  const data = JSON.parse(text);
  console.log(`[${requestId}] Gemini response received`);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenAI(env, messages, system, temperature, requestId) {
  const model = env.OPENAI_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(env.OPENAI_TIMEOUT_MS || DEFAULT_OPENAI_TIMEOUT_MS);
  const debugMode = env.DEBUG_MODE === "true" || env.DEBUG_MODE === true;

  console.log(`[${requestId}] Calling OpenAI (${model}), timeout: ${timeoutMs}ms`);

  const res = await safeFetchWithRetry(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        temperature,
      }),
    },
    timeoutMs,
    requestId
  );

  const text = await res.text();
  if (!res.ok) {
    const errorMsg = `[${requestId}] OpenAI error: HTTP ${res.status}`;
    console.error(errorMsg, text);

    if (debugMode) {
      throw new Error(`OpenAI API Error (${res.status}): ${text.substring(0, 500)}`);
    }
    throw new Error("OpenAI API temporarily unavailable");
  }

  const data = JSON.parse(text);
  console.log(`[${requestId}] OpenAI response received`);
  return data?.choices?.[0]?.message?.content ?? "";
}

/* =========================
   Router (Gemini -> OpenAI)
========================= */
async function routeAI(env, messages, system, temperature, lang, requestId) {
  const primary = (env.PRIMARY_AI || "gemini").toLowerCase();
  const order = primary === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];

  console.log(`[${requestId}] AI routing: order=${order.join("->")}`);

  for (const provider of order) {
    try {
      if (provider === "gemini") {
        if (!env.GEMINI_API_KEY) continue;
        return await callGemini(env, messages, system, temperature, requestId);
      }
      if (provider === "openai") {
        if (!env.OPENAI_API_KEY) continue;
        return await callOpenAI(env, messages, system, temperature, requestId);
      }
    } catch (err) {
      console.error(`[${requestId}] Provider ${provider} failed:`, err.message);
    }
  }

  // All providers failed
  const failMsg = lang === "en"
    ? "All AI services are temporarily unavailable. Please try again in a moment."
    : "كل الأنظمة مشغولة حالياً. جرّب كمان ثواني.";

  throw new Error(failMsg);
}

/* =========================
   Worker Entry
========================= */
export default {
  async fetch(request, env) {
    const headers = buildCorsHeaders();
    const url = new URL(request.url);

    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // Health Check Endpoint
    if (url.pathname === "/health") {
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "vFinal-enhanced",
        providers: {
          gemini: !!env.GEMINI_API_KEY,
          openai: !!env.OPENAI_API_KEY
        },
        config: {
          gemini_timeout_ms: Number(env.GEMINI_TIMEOUT_MS || DEFAULT_GEMINI_TIMEOUT_MS),
          openai_timeout_ms: Number(env.OPENAI_TIMEOUT_MS || DEFAULT_OPENAI_TIMEOUT_MS),
          max_retries: MAX_RETRIES
        }
      };
      return jsonResponse(health, 200, headers);
    }

    // Only POST for chat
    if (request.method !== "POST") {
      return jsonResponse({ response: "Method Not Allowed" }, 405, headers);
    }

    const requestId = generateRequestId();
    console.log(`[${requestId}] New request received`);

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ response: "Invalid JSON", request_id: requestId }, 400, headers);
    }

    const messages = normalizeMessages(body, env);
    if (!messages.length) {
      return jsonResponse({ response: "No messages provided.", request_id: requestId }, 400, headers);
    }

    const lang = detectLang(body, env);
    const allowContact = shouldAllowContact(messages, env);

    console.log(`[${requestId}] Lang: ${lang}, Messages: ${messages.length}, AllowContact: ${allowContact}`);

    if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY) {
      return jsonResponse(
        {
          response: lang === "en" ? "Server misconfigured: no AI keys set." : "إعدادات السيرفر ناقصة: مفيش مفاتيح AI.",
          request_id: requestId
        },
        500,
        headers
      );
    }

    const temperature = clampNumber(
      body?.temperature,
      0,
      1.2,
      Number(env.DEFAULT_TEMPERATURE || 0.6)
    );

    const system = getSystemPrompt(env, lang, allowContact);
    const debugMode = env.DEBUG_MODE === "true" || env.DEBUG_MODE === true;

    try {
      const out = await routeAI(env, messages, system, temperature, lang, requestId);
      console.log(`[${requestId}] Success`);
      return jsonResponse({ response: out, request_id: requestId }, 200, headers);
    } catch (err) {
      console.error(`[${requestId}] Final error:`, err.message);

      const errorResponse = {
        response: err.message,
        request_id: requestId,
        error_type: "service_unavailable"
      };

      // في Debug mode، نضيف تفاصيل أكثر
      const debugMode = env.DEBUG_MODE === "true" || env.DEBUG_MODE === true;
      if (debugMode) {
        errorResponse.debug_info = {
          error_message: err.message,
          error_stack: err.stack,
          providers_available: {
            gemini: !!env.GEMINI_API_KEY,
            openai: !!env.OPENAI_API_KEY
          }
        };
      }

      return jsonResponse(errorResponse, 503, headers);
    }
  },
};
