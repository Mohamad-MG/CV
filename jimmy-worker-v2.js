/**
 * Jimmy AI Worker v2.5.0 – Zero-Bureaucracy Flash-First Architecture
 * ==================================================================
 * Philosophy: Flash tries first. If it needs help, it asks. No counters. No routers.
 * Features: 7-Key Pool, Reactive Upscaling, Latency-Based Failover.
 */

/* ============================================================
   CONFIG
============================================================ */
const WORKER_VERSION = "2.5.1";

const ALLOWED_ORIGINS = [
    "https://mo-gamal.com",
    "https://emarketbank.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

// Gemini Key Pool Secrets
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
- سؤال واحد كحد أقصى بـ 2-3 اختيارات قصيرة.

*** REACTIVE HELP SIGNAL ***
أنت (Flash) الآن. جاوب فوراً بذكاء.
ولكن.. لو السؤال يتطلب "استشارة عميقة" أو "تحليل بيانات" وأنت لا تملك تفاصيل كافية:
توقف واطلب الترقية بكتابة هذا الكود فقط:
<<NEEDS_EXPERT>>
`.trim();

const FIRST_MSG_INSTRUCTION = "ابدأ بترحيب دافئ وقل أنا جيمي شريكك في التفكير.";

const CORE_USER = `
جيمي الأشطر من محمد..بس إحنا هنا بنعرف الناس على محمد أكتر.
    محمد — Growth / Digital Systems Architect.
بيشتغل على الأنظمة قبل القنوات، وعلى القرار قبل التنفيذ.
    مكانه: Business × Product × Marketing.

        رحلته:
- بدأ بقنوات Ads / SEO ثم انتقل لعمق الـ UX والأرقام.
- Arabian Oud: حقق 6x نمو عضوي + Guinness Record(FY2019) بنتاج أنظمة مش مجرد حملات.
- مؤسس DigiMora وقائد في Qyadat.

    عقليته: System Designer.يبدأ من القرار النهائي ويبني النظام اللي يطلعه. 
يقول نعم للمشاكل القابلة للبناء، ولا للحلول السكنية المؤقتة.
`.trim();

const CORE_INDUSTRY = `
إطار فهم السوق(EG / KSA / UAE):
- النمو = (طلب + ثقة + تشغيل + قرار).
- الإعلان Amplifier مش Fixer.لو الـ Offer ضعيف، الإعلانات هتخسرك أسرع.
- السعودية: الثقة والتشغيل المحلي أولاً.
- الإمارات: الخندق في الـ Retention والـ CX.
- مصر: السعر والثقة واللوجستيات(تحدي الـ COD).
- الربح الحقيقي في التكرار(LTV).
`.trim();

/* ============================================================
   GLOBAL HELPERS
============================================================ */

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
        parts.push(FIRST_MSG_INSTRUCTION);
    } else {
        parts.push("⚠️ تجاوزنا الترحيب. ادخل في صلب الموضوع مباشرة.");
    }

    return parts.join("\n\n");
}

function buildExpertPrompt(advancedKB, locale) {
    let expertRules = `
--- Shadow Expert Mode ---
الآن تم استدعاء (Gemini Pro).
أنت هنا لأن (Flash) طلب المساعدة.
استخدم الـ Knowledge Base المرفقة لتقديم إجابة عميقة، عملية، واستراتيجية.
ركّز على (لماذا) و (ماذا) قبل (كيف).
`.trim();

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

async function executeAIRequest(env, model, prompt, messages, { maxTries = 7, allowFastFailover = true, timeoutMs = 7000 } = {}) {
    const keyPool = shuffleArray(GEMINI_KEY_POOL);
    let lastError = null;
    let tryCount = 0;

    for (const keyName of keyPool) {
        tryCount++;
        const apiKey = env[keyName];
        if (!apiKey) continue;

        // Try request
        const result = await callGemini(apiKey, model, prompt, messages, timeoutMs);

        if (!result.error && result.response) {
            return { response: result.response, model, keyName };
        }

        console.warn(`[JIMMY_RETRY] try=${tryCount} key=${keyName} model=${model} err=${result.type || result.status}`);
        lastError = result;

        // Fast Failover: 6s timeout trigger
        if (result.type === 'TIMEOUT' && allowFastFailover) {
            const err = new Error("FAST_FAILOVER_TIMEOUT");
            err.details = result;
            throw err;
        }

        // 400 Bad Request -> Fatal
        if (result.status === 400) {
            const err = new Error("BAD_REQUEST_400");
            err.details = result;
            throw err;
        }

        if (tryCount >= maxTries) break;
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

            const messages = normalizeMessages(rawMessages);
            const isFirstInteraction = rawMessages.filter(m => m.role === "assistant" || m.role === "model").length === 0;

            let mode = "core";
            let prompt = buildCorePrompt(locale, isFirstInteraction);
            let ai;

            // 1) PHASE 1: FLASH ATTEMPT (Default)
            try {
                // High speed timeout (6000ms)
                ai = await executeAIRequest(env, MODELS.DEFAULT, prompt, messages, {
                    maxTries: 7,
                    allowFastFailover: true,
                    timeoutMs: 6000
                });

                // 2) PHASE 2: REACTIVE SELF-ASSESSMENT
                if (ai.response.trim() === "<<NEEDS_EXPERT>>") {
                    console.log("⚡ Reactive Upscale: Flash asked for Expert help.");

                    const kb = await env.JIMMY_KV?.get("jimmy:kb:advanced");
                    if (kb) {
                        mode = "expert";
                        const expertPrompt = buildExpertPrompt(kb, locale);

                        // Silent Upgrade to Pro (Longer timeout: 9000ms)
                        ai = await executeAIRequest(env, MODELS.ADVANCED, expertPrompt, messages, {
                            maxTries: 7,
                            allowFastFailover: true,
                            timeoutMs: 9000
                        });
                    } else {
                        // KB Safe Fallback
                        ai.response = "محتاج تفاصيل أكتر عن نشاطك عشان أقدر أدي إجابة دقيقة.";
                    }
                }

            } catch (err) {
                // Logic Trap Area
                if (err.message === "BAD_REQUEST_400") {
                    return json({ error: "Bad Request", details: err.details }, 400, cors);
                }

                // 3) PHASE 3: FAILOVER (If Flash Died)
                const isTimeout = err.message === "FAST_FAILOVER_TIMEOUT";
                const isFailed = err.message && err.message.startsWith("EXECUTION_FAILED");

                if (isTimeout || isFailed) {
                    console.warn("⚠️ Failover Triggered");

                    // Failover: Use Lighter Prompt (Style + Industry Only) to reduce load
                    const failoverPrompt = [getStyleForLocale(locale), CORE_INDUSTRY].join("\n\n");

                    // Failover to Gemini-3 Preview (Last Resort)
                    ai = await executeAIRequest(env, MODELS.FAILOVER, failoverPrompt, messages, {
                        maxTries: 7,
                        allowFastFailover: false,
                        timeoutMs: 9000
                    });
                } else {
                    throw err;
                }
            }

            console.log(`[JIMMY_SUCCESS] model=${ai.model} key=${ai.keyName}`);

            return json({
                response: ai.response,
                meta: { mode, model: ai.model }, // Minimal meta
            }, 200, cors);

        } catch (err) {
            console.error("Critical:", err);
            return json({ response: "لحظة واحدة.. خليني أرتب أفكاري وأرجع لك.", meta: { error: err.message } }, 200, cors);
        }
    }
};
