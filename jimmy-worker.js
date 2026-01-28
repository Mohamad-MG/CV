const CACHE_TTL_MS = 60_000;
const DEFAULT_LIMITS = {
  rulesChars: 2500,
  userChars: 6000,
  marketChars: 7000,
  maxHistory: 10,
  maxMsgChars: 1200,
};

const GEMINI_MODELS_PRIORITY = [
  "gemini-3-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const cache = {
  items: new Map(),
};

function nowMs() {
  return Date.now();
}

function buildCorsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function getKv(env) {
  return env.JIMMY_KV || env.JIMMY_BRAINS || env.KV || null;
}

function trimText(text, maxChars) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

function getLocale(request, body) {
  const bodyLang = (body && body.language ? String(body.language) : "").toLowerCase();
  const headerLang = (request.headers.get("accept-language") || "").toLowerCase();

  const raw = bodyLang || headerLang;
  if (!raw) return "en-us";

  if (raw.startsWith("ar")) {
    if (/(sa|ae|kw|qa|bh|om|ye)/.test(raw)) return "ar-gulf";
    return "ar-eg";
  }

  if (raw.startsWith("en")) return "en-us";
  return "en-us";
}

async function getBrain(env, key) {
  const kv = getKv(env);
  if (!kv) {
    throw new Error("MISSING_KV_BINDING");
  }

  const cached = cache.items.get(key);
  const age = cached ? nowMs() - cached.fetchedAt : Infinity;
  if (cached && age <= CACHE_TTL_MS) {
    return { value: cached.value, cache: "hit", ageMs: age };
  }

  const value = await kv.get(key);
  cache.items.set(key, { value, fetchedAt: nowMs() });
  return { value, cache: "miss", ageMs: 0 };
}

function parseStyle(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("INVALID_STYLE_JSON");
  }
}

function buildSystemPrompt(style, brains, locale) {
  if (!style || !style.rules_text) {
    throw new Error("MISSING_STYLE_RULES");
  }

  const limits = style.limits || {};
  const rulesChars = Number(limits.rules_chars || DEFAULT_LIMITS.rulesChars);
  const userChars = Number(limits.user_chars || DEFAULT_LIMITS.userChars);
  const marketChars = Number(limits.market_chars || DEFAULT_LIMITS.marketChars);

  const rulesText = trimText(String(style.rules_text), rulesChars);
  const userBrain = trimText(String(brains.user || ""), userChars);
  const marketBrain = trimText(String(brains.market || ""), marketChars);
  const mode = style.mode ? String(style.mode) : "default";

  const parts = [
    `MODE: ${mode}`,
    `LOCALE: ${locale}`,
    `STYLE_RULES:\n${rulesText}`,
  ];

  if (userBrain) {
    parts.push(`USER_BRAIN:\n${userBrain}`);
  }

  if (marketBrain) {
    parts.push(`MARKET_BRAIN:\n${marketBrain}`);
  }

  return parts.join("\n\n");
}

function normalizeMessages(messages, maxHistory, maxMsgChars) {
  const cleaned = (messages || [])
    .map((m) => {
      if (!m || !m.content) return null;
      const role = m.role === "user" ? "user" : "model";
      return {
        role,
        parts: [{ text: trimText(String(m.content), maxMsgChars) }],
      };
    })
    .filter(Boolean);

  return cleaned.slice(-maxHistory);
}

function buildModelPriority(env) {
  const envModel = (env.GEMINI_MODEL || "").trim();
  if (!envModel) return GEMINI_MODELS_PRIORITY;
  const ordered = [envModel, ...GEMINI_MODELS_PRIORITY];
  return Array.from(new Set(ordered));
}

async function callGeminiWithFallback(env, payload, timeoutMs) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }

  const models = buildModelPriority(env);

  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API Error: ${res.status} - ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Gemini returned empty response");
      }

      console.log(`Gemini model used: ${model}`);
      return text;
    } catch (err) {
      console.warn(
        `Gemini model skipped: ${model}`,
        err && err.message ? err.message : err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("All Gemini models failed");
}

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/probe/flush") {
      cache.items.clear();
      return jsonResponse({ ok: true, cache: "cleared" }, 200, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/probe/brains") {
      try {
        const user = await getBrain(env, "jimmy:kb:user");
        const market = await getBrain(env, "jimmy:kb:market");
        const styleRaw = await getBrain(env, "jimmy:style");
        const style = parseStyle(styleRaw.value);

        return jsonResponse(
          {
            ok: true,
            cache_ttl_ms: CACHE_TTL_MS,
            lengths: {
              user: user.value ? String(user.value).length : 0,
              market: market.value ? String(market.value).length : 0,
              style: styleRaw.value ? String(styleRaw.value).length : 0,
            },
            cache: {
              user: user.cache,
              market: market.cache,
              style: styleRaw.cache,
            },
            style_valid: Boolean(style && style.rules_text),
          },
          200,
          corsHeaders
        );
      } catch (err) {
        console.error("Probe Error:", err);
        return jsonResponse(
          { ok: false, error: err.message || "probe_error" },
          500,
          corsHeaders
        );
      }
    }

    if (request.method !== "POST" || url.pathname !== "/chat") {
      return jsonResponse({ response: "Method Not Allowed" }, 405, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return jsonResponse(
        { response: "طلب غير صالح (JSON غير صحيح)" },
        400,
        corsHeaders
      );
    }

    if (!Array.isArray(body?.messages)) {
      return jsonResponse(
        { response: "طلب غير صالح (messages مفقودة)" },
        400,
        corsHeaders
      );
    }

    try {
      const locale = getLocale(request, body);
      const maxHistory = Number(env.MAX_HISTORY || DEFAULT_LIMITS.maxHistory);
      const maxMsgChars = Number(env.MAX_MSG_CHARS || DEFAULT_LIMITS.maxMsgChars);
      const timeoutMs = Number(env.PROVIDER_TIMEOUT_MS || 12000);

      const userBrain = await getBrain(env, "jimmy:kb:user");
      const marketBrain = await getBrain(env, "jimmy:kb:market");
      const styleRaw = await getBrain(env, "jimmy:style");
      const style = parseStyle(styleRaw.value);

      const systemPrompt = buildSystemPrompt(
        style,
        { user: userBrain.value, market: marketBrain.value },
        locale
      );

      const contents = normalizeMessages(body.messages, maxHistory, maxMsgChars);
      if (!contents.length) {
        return jsonResponse(
          { response: "الرسالة فارغة" },
          400,
          corsHeaders
        );
      }

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: body.temperature ?? 0.6,
          maxOutputTokens: 800,
        },
      };

      const responseText = await callGeminiWithFallback(env, payload, timeoutMs);
      return jsonResponse({ response: responseText }, 200, corsHeaders);
    } catch (err) {
      console.error("Worker Error:", err);

      if (err && err.message === "MISSING_GEMINI_API_KEY") {
        return jsonResponse(
          { response: "الخدمة غير مفعلة حالياً. برجاء التواصل عبر واتساب." },
          503,
          corsHeaders
        );
      }

      if (err && err.message === "MISSING_STYLE_RULES") {
        return jsonResponse(
          { response: "Configuration error: missing style rules." },
          500,
          corsHeaders
        );
      }

      if (err && err.message === "MISSING_KV_BINDING") {
        return jsonResponse(
          { response: "Configuration error: missing KV binding." },
          500,
          corsHeaders
        );
      }

      if (err && err.message === "INVALID_STYLE_JSON") {
        return jsonResponse(
          { response: "Configuration error: invalid style JSON." },
          500,
          corsHeaders
        );
      }

      return jsonResponse(
        { response: "معلش، في مشكلة تقنية صغيرة دلوقتي. ممكن تجرب تاني كمان شوية؟" },
        500,
        corsHeaders
      );
    }
  },
};
