/**
 * Jimmy AI Worker v2.2.3 – Gemini First / Key Pooling Architecture (2026)
 * =======================================================================
 * Optimized for: Resilience, Speed, and Model Authority.
 * Features: 7-Key Pool, Shuffle/Retry, Latency-Based Failover.
 */

/* ============================================================
   CONFIG
============================================================ */
const WORKER_VERSION = "2.4.0";

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
- سؤال واحد كحد أقصى بـ 2-3 اختيارات قصيرة.

*** REACTIVE HELP LOGIC ***
أنت الديفولت (Flash). جاوب بذكاء وسرعة.
لكن، لو وجدت السؤال "استشارة بيزنس معقدة" (Pricing, Funnel Strategy, Growth) وأنت لا تملك تفاصيل كافية للرد بمستوى "خبير":
توقف واطلب المساعدة فوراً بكتابة الكلمة دي بس:
<<NEEDS_EXPERT>>
`.trim();

const WARM_UP_INSTRUCTION = `
Warm-Up Protocol (للتنفيذ في أول رد فقط):
1) ترحيب دافئ غير رسمي.
2) Insight ذكي مرتبط بكلام المستخدم.
3) Options ناعمة لتحديد زاوية الحديث.
`.trim();

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

// Legacy Function (Kept for reference, logic moved to Smart Router)
function needsAdvancedMode(message) {
    return false;
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
--- Shadow Expert Mode-- -
    أنت الآن في وضع تشخيص متقدم.تأكد من استخدام المعلومات المتوفرة في الـ Knowledge Base.
ركّز على(لماذا / ماذا) قبل(كيف).
`.trim();

    if (expertMsgCount >= 2) {
        expertRules += `\n - جيمي: قلل التحليل، ركز على "تلخيص + اتجاه عملي واحد".خليك أقصر وأجرأ.`;
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

async function executeAIRequest(env, model, prompt, messages, { maxTries = 7, allowFastFailover = true, timeoutMs = 7000 } = {}) {
    const keyPool = shuffleArray(GEMINI_KEY_POOL);
    let lastError = null;
    let tryCount = 0;

    for (const keyName of keyPool) {
        tryCount++;
        const apiKey = env[keyName];
        if (!apiKey) continue;

        // Try request (dynamic timeout)
        const result = await callGemini(apiKey, model, prompt, messages, timeoutMs);

        if (!result.error && result.response) {
            return { response: result.response, model, keyName };
        }

        // Logging specific error types
        console.warn(`[JIMMY_RETRY] try=${tryCount}/${maxTries} key=${keyName} model=${model} error=${result.type || result.status}`);
        lastError = result;

        // 1) Timeout -> Fast Failover (ONLY if allowed)
        if (result.type === 'TIMEOUT' && allowFastFailover) {
            const err = new Error("FAST_FAILOVER_TIMEOUT");
            err.details = result;
            throw err;
        }

        // 2) 400 Bad Request -> Break immediately (don't retry, don't failover)
        if (result.status === 400) {
            const err = new Error("BAD_REQUEST_400");
            err.details = result;
            throw err;
        }

        // 3) For 429/Network errors, continue trying other keys up to maxTries
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

            const expertOnInput = Boolean(body.meta?.expert_on);
            const expertMsgCount = Number(body.meta?.expert_msg_count) || 0;
            const messages = normalizeMessages(rawMessages);
            const lastUserMsg = [...rawMessages].reverse().find(m => m.role === "user")?.content || "";
            const isFirstInteraction = rawMessages.filter(m => m.role === "assistant" || m.role === "model").length === 0;

            let mode = "core";
            let prompt = buildCorePrompt(locale, isFirstInteraction);
            let finalExpertOn = expertOnInput;
            let finalModel = MODELS.DEFAULT;

            // 1) STRICT WARM-UP (First 5 User Requests = ALWAYS Flash)
            const userMsgCount = rawMessages.filter(m => m.role === "user").length;
            const isWarmupPhase = userMsgCount <= 5;

            // 2) EXECUTE FLASH (Default)
            let ai;
            try {
                // Flash uses standard timeout (6000ms) for speed
                ai = await executeAIRequest(env, MODELS.DEFAULT, prompt, messages, {
                    maxTries: 7,
                    allowFastFailover: true,
                    timeoutMs: 6000
                });

                // 3) REACTIVE UPSCALING (Only outside warmup)
                // If Flash screams that it needs help (<<NEEDS_EXPERT>>) AND we are allowed to switch
                // Note: We check if Upscale is needed
                if (!isWarmupPhase && !expertOnInput && ai.response.includes("<<NEEDS_EXPERT>>")) {
                    console.log("⚡ Reactive Upscale Triggered: Flash requested Expert help.");

                    const kb = await env.JIMMY_KV?.get("jimmy:kb:advanced");
                    if (kb) {
                        mode = "expert";
                        finalExpertOn = true;
                        finalModel = MODELS.ADVANCED; // Switch to Pro
                        prompt = buildExpertPrompt(kb, locale, expertMsgCount);

                        // Re-execute with Pro (Longer timeout 9000ms)
                        ai = await executeAIRequest(env, finalModel, prompt, messages, {
                            maxTries: 7,
                            allowFastFailover: true,
                            timeoutMs: 9000
                        });
                    } else {
                        // KB Fail-safe: Polite fallback if KB is missing or error
                        ai.response = "عفواً، النقطة دي محتاجة تفاصيل أكتر عن إطار العمل عشان أقدر أفيدك بدقة. ممكن توضح أكتر؟";
                    }
                }

            } catch (err) {
                // 1) Trap: 400 Bad Request -> Return error to client, DO NOT Failover
                if (err.message === "BAD_REQUEST_400") {
                    console.error("Critical 400 Error:", err.details);
                    return json({ error: "Bad Request to Provider", details: err.details }, 400, cors);
                }

                // 2) Check eligibility for failover
                const isTimeout = err.message === "FAST_FAILOVER_TIMEOUT";
                const isExecutionFailed = err.message && err.message.startsWith("EXECUTION_FAILED");

                if (isTimeout || isExecutionFailed) {
                    console.warn(isTimeout ? "Fast Failover triggered by Timeout" : "All Keys Failed, using Failover model");

                    // Failover Attempt: Disable Fast Failover (try harder), standard maxTries, Timeout 9s (Give it time to work)
                    ai = await executeAIRequest(env, MODELS.FAILOVER, prompt, messages, { maxTries: 7, allowFastFailover: false, timeoutMs: 9000 });
                } else {
                    // Logic error or unhandled case -> Re-throw to outer catch
                    throw err;
                }
            }

            console.log(`[JIMMY_SUCCESS] model=${ai.model} key=${ai.keyName} upscale=${finalModel === MODELS.ADVANCED}`);

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
