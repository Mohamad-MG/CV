/**
 * Jimmy AI Worker v2.2.3 – Gemini First / Key Pooling Architecture (2026)
 * =======================================================================
 * Optimized for: Resilience, Speed, and Model Authority.
 * Features: 7-Key Pool, Shuffle/Retry, Latency-Based Failover.
 */

/* ============================================================
   CONFIG
============================================================ */
const WORKER_VERSION = "2.2.5";

const ALLOWED_ORIGINS = [
    "https://mo-gamal.com",
    "https://emarketbank.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

// Gemini Key Pool Secrets (Cloudflare Worker Secrets)
const GEMINI_KEY_POOL = [
    "arabian", "arabw", "Cartonya", "Digimora", "digimoraeg", "mogamal", "qyadat"
];

// Official Model Names (Final 2026 Transition)
const MODELS = {
    DEFAULT: "gemini-2.5-flash",
    ADVANCED: "gemini-2.5-pro",
    FAILOVER: "gemini-3-flash-preview"
};

/* ============================================================
   CORE PROMPT STRINGS
============================================================ */

const CORE_STYLE = `
أنت جيمي. مساعد ذكي وخبير استشاري
نافذة عقل بتفكّر بصوت هادي وواضح.
مش Chatbot، مش Assistant، ومش Sales Rep.

مقياس النجاح الوحيد:
- لو المستخدم حاسس إنه بيكلم نظام → فشل.
- لو حاسس إنه بيكلم إنسان فاهم ورايق → نجاح.
بأختصار: التحدث بطريقة بشرية دارجة وذكية، ممنوع الصياغات الروبوتية.

فلسفة التفاعل:
- Help-First: القيمة أهم من أي شيء.
- Human Before Business: كن لطيفاً، مبادراً، وذكياً.
- Zero Sales Pressure: ممنوع أي CTA تلقائي.

مستوى الذكاء:
- Advanced-Only: ممنوع نصائح عامة أو كلام كورسات.
- الرد لازم يغير زاوية نظر، يختصر تفكير، أو يكشف فخ.

اللغة:
- التزم بلغة المستخدم (مصري طبيعي / خليجي مبسط / US Casual).
- ممنوع خلط اللهجات.
- ممنوع ذكر أي مصطلحات تقنية (AI, Model, Prompt, System).

هيكل الرد:
- الطول: 2 إلى 5 سطور فقط.
- سؤال واحد كحد أقصى بـ 2-3 اختيارات قصيرة.

Diagnose Mode (عند وجود مشكلة):
- سؤال تشخيص واحد فقط (بدون استجواب).
- ركز على: Tracking, Attribution, Funnel leaks, CRO, UX, Retention, Offer.
`.trim();

const WARM_UP_INSTRUCTION = `
Warm-Up Protocol (للتنفيذ في أول رد فقط):
1) ترحيب دافئ غير رسمي.
2) Insight ذكي مرتبط بكلام المستخدم.
3) Options ناعمة لتحديد زاوية الحديث.
`.trim();

const CORE_USER = `
جيمي الأشطر من محمد.. بس إحنا هنا بنعرف الناس على محمد أكتر.
محمد — Growth / Digital Systems Architect.
بيشتغل على الأنظمة قبل القنوات، وعلى القرار قبل التنفيذ.
مكانه: Business × Product × Marketing.

رحلته:
- بدأ بقنوات Ads/SEO ثم انتقل لعمق الـ UX والأرقام.
- Arabian Oud: حقق 6x نمو عضوي + Guinness Record (FY2019) بنتاج أنظمة مش مجرد حملات.
- مؤسس DigiMora وقائد في Qyadat.

عقليته: System Designer. يبدأ من القرار النهائي ويبني النظام اللي يطلعه. 
يقول نعم للمشاكل القابلة للبناء، ولا للحلول السكنية المؤقتة.
`.trim();

const CORE_INDUSTRY = `
إطار فهم السوق (EG / KSA / UAE):
- النمو = (طلب + ثقة + تشغيل + قرار).
- الإعلان Amplifier مش Fixer. لو الـ Offer ضعيف، الإعلانات هتخسرك أسرع.
- السعودية: الثقة والتشغيل المحلي أولاً.
- الإمارات: الخندق في الـ Retention والـ CX.
- مصر: السعر والثقة واللوجستيات (تحدي الـ COD).
- الربح الحقيقي في التكرار (LTV).
`.trim();

/* ============================================================
   GLOBAL HELPERS
============================================================ */

const DECISION_TRIGGERS_AR = [
    /\bROAS\b/i, /\bCAC\b/i, /\bLTV\b/i, /أعمل\s*إيه/i, /اختار\s*إزاي/i, /قرار/i, /ميزانية/i, /خسارة/i,
];

function trimText(text, max = 1200) {
    return text?.length > max ? text.slice(0, max) : text;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function normalizeMessages(messages, maxHistory = 10, maxMsgChars = 1200) {
    return (messages || [])
        .filter(m => m?.content)
        .map(m => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: trimText(String(m.content), maxMsgChars) }],
        }))
        .slice(-maxHistory);
}

function needsAdvancedMode(message) {
    const text = (message || "").trim();
    if (text.length < 10) return false;
    return DECISION_TRIGGERS_AR.some(p => p.test(text));
}

function buildCorsHeaders(origin) {
    const allowed = ALLOWED_ORIGINS.find(o => origin?.startsWith(o)) || ALLOWED_ORIGINS[0];
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

function json(body, status, headers) {
    return new Response(JSON.stringify(body), { status, headers });
}

/* ============================================================
   PROMPT & AI LOGIC
============================================================ */

function getStyleForLocale(locale) {
    const isGulf = /sa|ae|kw|qa|bh|om/i.test(locale);
    let baseStyle = CORE_STYLE;
    if (isGulf) {
        baseStyle += "\nنبرة: هدوء ومرونة ولطافة وحميمية، احترافية عالية، مفردات خليجية خفيفة.";
    } else {
        baseStyle += "\nنبرة: ذكاء مصري، سخرية خفيفة جداً من الألم، عامية مصرية دارجة، سرعة بديهة.";
    }
    return baseStyle;
}

function buildCorePrompt(locale, isFirstMessage = true) {
    const parts = [
        getStyleForLocale(locale),
        CORE_USER,
        CORE_INDUSTRY,
    ];

    if (isFirstMessage) {
        parts.push(WARM_UP_INSTRUCTION);
    } else {
        parts.push("⚠️ التعليمات الهامة: لقد تجاوزنا مرحلة الترحيب. ادخل في حوار ذكي مباشر مع المستخدم وممنوع تكرار أي صيغ ترحيبية سابقة.");
    }

    return parts.join("\n\n");
}

function buildExpertPrompt(advancedKB, locale, expertMsgCount = 0) {
    let expertRules = `
--- Shadow Expert Mode ---
أنت الآن في وضع تشخيص متقدم. تأكد من استخدام المعلومات المتوفرة في الـ Knowledge Base.
ركّز على (لماذا / ماذا) قبل (كيف).
`.trim();

    if (expertMsgCount >= 2) {
        expertRules += `\n- جيمي: قلل التحليل، ركز على "تلخيص + اتجاه عملي واحد". خليك أقصر وأجرأ.`;
    }

    return [
        buildCorePrompt(locale, false),
        expertRules,
        trimText(advancedKB, 12000),
    ].join("\n\n");
}

/* ============================================================
   GEMINI ENGINE (Key Pooling + Retries)
============================================================ */

async function callGemini(apiKey, model, systemPrompt, messages, timeoutMs = 7000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: messages,
                generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
            }),
            signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            return { error: true, status: res.status, details: errBody };
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return { error: false, response: text };

    } catch (err) {
        clearTimeout(timer);
        return { error: true, type: err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK', details: err.message };
    }
}

async function executeAIRequest(env, model, prompt, messages, maxTries = 7) {
    const keyPool = shuffleArray(GEMINI_KEY_POOL);
    let lastError = null;
    let tryCount = 0;

    for (const keyName of keyPool) {
        tryCount++;
        const apiKey = env[keyName];
        if (!apiKey) continue;

        // Try request (default 7s timeout)
        const result = await callGemini(apiKey, model, prompt, messages);

        if (!result.error && result.response) {
            return { response: result.response, model, keyName };
        }

        // Logging specific error types
        console.warn(`[JIMMY_RETRY] try=${tryCount}/${maxTries} key=${keyName} model=${model} error=${result.type || result.status}`);
        lastError = result;

        // High UX responsiveness: If we hit a timeout and reached maxTries, throw specifically
        if (result.type === 'TIMEOUT' && tryCount >= maxTries) {
            const err = new Error("FAST_FAILOVER_TIMEOUT");
            err.details = result;
            throw err;
        }

        if (tryCount >= maxTries) break;

        // If it's a 4xx error (other than 429), it might be a request issue
        if (result.status === 400) break;
    }

    throw new Error(`EXECUTION_FAILED: ${JSON.stringify(lastError)}`);
}

/* ============================================================
   MAIN FETCH HANDLER
============================================================ */

export default {
    async fetch(request, env) {
        const cors = buildCorsHeaders(request.headers.get("Origin"));
        if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

        const url = new URL(request.url);
        if (url.pathname === "/health") return json({ ok: true, version: WORKER_VERSION, provider: "Gemini-Pool" }, 200, cors);
        if (request.method !== "POST" || url.pathname !== "/chat") return json({ error: "Not Found" }, 404, cors);

        try {
            const body = await request.json();
            const rawMessages = body.messages || [];
            if (!rawMessages.length) return json({ error: "Empty messages" }, 400, cors);

            const locale = (request.headers.get("accept-language") || "ar-eg").toLowerCase().startsWith("en") ? "en-us" :
                (/(sa|ae|kw|qa|bh|om)/.test(request.headers.get("accept-language") || "")) ? "ar-gulf" : "ar-eg";

            const expertOnInput = Boolean(body.meta?.expert_on);
            const expertMsgCount = Number(body.meta?.expert_msg_count) || 0;
            const messages = normalizeMessages(rawMessages);
            const lastUserMsg = [...rawMessages].reverse().find(m => m.role === "user")?.content || "";
            const isFirstInteraction = rawMessages.filter(m => m.role === "assistant" || m.role === "model").length === 0;

            let mode = "core";
            let prompt;
            let finalExpertOn = expertOnInput;
            let targetModel = MODELS.DEFAULT;

            // Route Logic
            if (expertOnInput || needsAdvancedMode(lastUserMsg)) {
                const kb = await env.JIMMY_KV?.get("jimmy:kb:advanced");
                if (kb) {
                    mode = "expert";
                    prompt = buildExpertPrompt(kb, locale, expertMsgCount);
                    finalExpertOn = true;
                    targetModel = MODELS.ADVANCED;
                } else {
                    prompt = buildCorePrompt(locale, isFirstInteraction);
                    finalExpertOn = false;
                }
            } else {
                prompt = buildCorePrompt(locale, isFirstInteraction);
                finalExpertOn = false;
            }

            let ai;
            try {
                // Primary Try: Try up to 2 keys before failing over to faster model
                ai = await executeAIRequest(env, targetModel, prompt, messages, 2);
            } catch (err) {
                const isTimeout = err.message === "FAST_FAILOVER_TIMEOUT";
                console.warn(isTimeout ? "Fast Failover triggered by Timeout" : "Primary Route Failed, using Failover model:", err.message);

                // Failover attempt: Can try all keys if necessary as this is the "last resort"
                ai = await executeAIRequest(env, MODELS.FAILOVER, prompt, messages, 7);
            }

            console.log(`[JIMMY_SUCCESS] model=${ai.model} key_name=${ai.keyName}`);

            return json({
                response: ai.response,
                meta: {
                    mode,
                    model: ai.model,
                    expert_on: finalExpertOn,
                    expert_msg_count: finalExpertOn ? expertMsgCount + 1 : 0
                },
            }, 200, cors);

        } catch (err) {
            console.error("Worker Critical Failure:", err);
            return json({ response: "تمام… اديني تفاصيل أكتر وأنا أديك اتجاه عملي.", meta: { error: err.message } }, 200, cors);
        }
    }
};
