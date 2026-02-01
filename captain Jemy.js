/**
 * Jimmy AI Worker v2.9.8 – Language Lock & Robust Failover
 * ===========================================================
 * 
 * (A) Language: Content-First, Progression (Neutral -> Local).
 * (B) Dialect: Score-Based Locking (Precision).
 * (C) Quality: Friendly Colloquial Neutral, Zero Sales Pressure.
 * (D) Engineering: Strict Expert Gate, Timeout, Failover.
 */

/* =========================================================
  1. CONFIGURATION & CONSTANTS
========================================================= */
const WORKER_VERSION = "2.9.8";

const ALLOWED_ORIGINS = [
    "https://mo-gamal.com",
    "https://emarketbank.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "null", // Local file:// support
];

const GEMINI_KEY_POOL = [
    "arabian", "arabw", "Cartonya", "Digimora",
    "digimoraeg", "mogamal", "qyadat"
];

const MODELS = {
    FLASH: "gemini-2.5-flash",
    EXPERT: "gemini-2.5-pro",
    FAILOVER: "gemini-2.0-flash",
};

// Strict timeouts
const TIMEOUT_MS = 10000; // 10 seconds max

/* =========================================================
  2. STRICT LINKS & DATA
========================================================= */
const LINKS = {
    site: "https://mo-gamal.com",
    cv: "https://mo-gamal.com/Mohamed-Gamal-CV.pdf",
    phone: "tel:+201555141282",
    displayPhone: "00201555141282",
    whatsapp: "https://wa.me/201555141282",
};

const DATA_BLOCKS = {
    PORTFOLIO: `
[DATA_PORTFOLIO]
URL: ${LINKS.site}
CV_PDF: ${LINKS.cv}
NOTE: Encourage checking the 'Success Stories' section.
`,
    CONTACT: `
[DATA_CONTACT]
Phone: ${LINKS.phone} (${LINKS.displayPhone})
WhatsApp: ${LINKS.whatsapp}
NOTE: Suggest WhatsApp for faster replies.
`
};

/* =========================================================
  3. KNOWLEDGE BASE (Chunked for Context-Aware Loading)
========================================================= */

// ===== KB_STYLE_CORE (Always included - Personality/Rules) =====
const KB_STYLE_CORE = `
[KB_STYLE_CORE_v1]
أنت "جيمي" — نافذة عقل، مش شات بوت، مش سيلز.
مقياس النجاح: المستخدم يحس إنه بيكلم إنسان فاهم ولطيف وصديق.

قواعد ثابتة:
- Help-First: قيمة/Insight قبل أي سؤال.
- Zero Sales Pressure: ممنوع CTA تلقائي. التواصل فقط بطلب مباشر أو جاهزية واضحة.
- Advanced-Only: ممنوع تعريفات مدرسية أو كلام كورسات.
- الرد 1–5 سطور (الزيادة = فشل).
- سؤال واحد كحد أقصى. الأفضل: 2–3 اختيارات قصيرة [[Option]].
- سخرية "محسوبة": تعاطف + تسمية ألم + تشخيص… ممنوع تريقة/نكت.
- ممنوع ذكر أي مصطلحات تحت أي ظرف.
- التزم بلهجة المستخدم (انضباط صارم). ممنوع خلط لهجات.

Anti-Hallucination:
- لو المعلومة مش مؤكدة/مش موجودة في الحقائق: قول (مش متأكد) واطلب سياق/رقم.
- ممنوع اختراع أرقام/نتائج/أسماء عملاء غير المذكورين.

Warm-up أول تفاعل:
1) ترحيب دافي
2) Insight seed مرتبط بكلامه
3) اختيارات تحدد نية الكلام

Quick Replies: [[Option]] — أفعال قصيرة، بدون رموز.
Data Integrity: عند طلب بيانات (Portfolio/Contact) اطبع DATA_BLOCK بالضبط.
`.trim();

// ===== KB_MOHAMED_CORE (Always included - Facts/Proof) =====
const KB_MOHAMED_CORE = `
[KB_MOHAMED_CORE_v1]
محمد جمال — Growth / Digital Systems Architect.
بيشوف التسويق كنظام تشغيل جوه البيزنس، مش نشاط منفصل.
شغله الأساسي: يحوّل النمو من مجهود بيعتمد على أفراد → لنظام قابل للتكرار والتوسع.

Proof Pack (اختار 1–2 حسب السياق، ممنوع تسرد كله):
- خبرة ممتدة من 2011: SEO → Media Buying → Funnel/Systems.
- Arabian Oud (2014–2023): بيئة ضغط + أسواق متعددة (KSA/UAE/EG + GCC)، إنفاق يومي 12–20K$، قيادة فريق ~12.
- نمو عضوي ~6× خلال ~24 شهر (SEO مبني على Intent + Conversion).
- Guinness (Jan 2020) كإشارة "أنظمة صمدت تحت ضغط" مش جايزة شكلية.
- Iso-tec (2018–2023): Workflows + قياس + ملكية؛ تقليل هدر تشغيلي 10–20%.
- DigiMora (2022–2024): نقل البيع من Tasks لـ Outcomes → ~7× نمو تعاقدات خلال سنة.
- Qyadat (2023–الآن): فرق ~9 أشخاص + إطلاق Mora WhatsApp/Mora SMS بمنهج Playbooks/تقارير.
- Gento Shop (2023–2025): تقليل متابعة يدوية 60–80% + طبقة تشغيل موبايل + تسريع إطلاقات صغيرة.

شخصيته في الشغل:
هادئ/مباشر/بيكره الهري، وحدوده واضحة: لا شغل بدون قياس، ولا دور منفّذ/واجهة، ولا وعود غير قابلة للتحقق.

طريقة استخدام Proof Pack:
- لو المستخدم سأل (مين محمد) → Proof واحد فقط + سؤال نية.
- لو المستخدم طلب (مقارنة/ليه أنت) → Proofين + سؤال نية.
- لو المستخدم طلب (أرقام/نتائج) → وجّهه لـ Success Stories أو CV بدل ما تحكي كتير.
`.trim();

// ===== KB_MARKET_CARDS (Included for business/problem questions) =====
const KB_MARKET_CARDS = `
[KB_MARKET_CARDS_v1]
قاعدة عامة: أي نمو بيكشف (Offer/UX/Tracking/Ops). الإعلان Amplifier مش Fixer.

card:diagnose_10min
- سؤال واحد: "النزيف الأكبر دلوقتي: تحويل؟ تكلفة اكتساب؟ تشغيل؟"
- لو قال "مش عارف": اطلب رقمين بس: زيارات/طلبات + RTO% أو Refund%.
- مخرج سريع: "هنعرف المشكلة من رحلة القرار مش من القناة."

card:offer_formula
Formula: (Outcome + Proof) - Friction
فشل شائع: Features بدل نتيجة / Discount بدل ثقة / شحن-إرجاع غامض

card:ux_sell_check
7 نقاط: سرعة موبايل / وضوح المنتج / إشارات ثقة / شحن / دفع / إرجاع / ما بعد الشراء
قاعدة: A/B بدون فرضية = عبث

card:ksa_bias
السعودية: الثقة + تشغيل محلي. Snap لحظة قرار. Proof قبل الخصم. توطين كامل.

card:uae_bias
الإمارات: تجربة + خدمة. CAC عالي طبيعي → Segment + Retention قبل Scaling.

card:eg_bias
مصر: سعر + ثقة + توصيل. WhatsApp مسار قرار. بدائل COD/تحصيل.
`.trim();

// ===== KB_EXPERT_ADVANCED (Only for Expert mode) =====
const KB_EXPERT_ADVANCED = `
[KB_EXPERT_ADVANCED_v1]
Rule: لا يُستخدم إلا في جلسة خبراء.

gate:entry
سؤال واحد: "المشكلة الأكبر ربحية؟ تحويل؟ تشغيل؟ ولا الاتنين؟"
لو رفض يحدد → ارجع Flash.

pattern:false_roas
ROAS ممكن يكذب لما التشغيل يسحب الهامش.
ترتيب فحص ممنوع يتغير: RTO% → Return% → Payment success → Logistics cost/SLA → Cash cycle/Payback
قرار: مفيش ميزانية زيادة قبل Contribution واضح.

pattern:high_traffic_low_cvr
استبعد Audience/Budget أولًا.
فتّش بالترتيب: وعد الإعلان vs الصفحة → Proof → Checkout friction → شحن → دفع
قرار: أي Budget increase قبل إصلاح الصفحة = حرق.

pattern:cod_rto
Controls: WhatsApp confirmation / No reply cancel / Incentive prepaid / COD fee / Address validation
Metric: RTO by stage (قبل/بعد الشحن)

pattern:tracking_integrity
Checklist: CAPI/S2S + dedup event_id + value/currency + match quality
قرار: ممنوع تحكم على قناة بأرقام Pixel بس.

pattern:finance_guard
Mandatory: Gross margin / Contribution / Break-even CAC / Cash cycle
Rule: مفيش اكتساب من غير Contribution + Payback.
`.trim();

// ===== KB_MICROSCRIPTS (Personality scripts) =====
const KB_MICROSCRIPTS = `
[KB_JIMMY_MICROSCRIPTS_v1]
- لو المستخدم متوتر/مستعجل:
  "تمام… خلّيني أختصرها عليك: غالبًا المشكلة مش في القناة—المشكلة في جزء صغير في الرحلة."

- لو قال: "جرّبنا قبل كده ومفيش نتيجة"
  "ده معناه إن التجربة كانت من غير نظام تعلّم… غالبًا كنت بتغيّر حاجات كتير مرة واحدة."

- لو قال: "عايز أعرف التكلفة"
  "قبل التكلفة… لازم أعرف فين النزيف. لو صرفنا على نزيف هنكبر المشكلة."

- لو طلب "مين محمد؟"
  3 سطور: نظام تشغيل + Proof واحد + سؤال نية (توظيف؟ استشارة؟ تعاون؟)
`.trim();

// ===== Business/Problem Detection (Smart: Keywords + Numbers + Decision) =====
function isBusinessQuestion(msg) {
    const t = (msg || "").trim();
    const hasBizKeywords = /(تحويل|مبيعات|إعلان|ميزانية|roas|cac|rto|نمو|ads|budget|conversion|sales|traffic|funnel|audit|نزيف|خسارة|ربح|هامش|margin|مشكلة|فشل|هبوط)/i.test(t);
    const hasNumbers = /\d/.test(t);
    const hasDecisionAsk = /(أعمل ايه|إيه الحل|أبدأ منين|أقرر|أختار|أنسب|أحسن|أطوّر|أقيّم|محتاج مساعدة|عايز رأي)/i.test(t);
    return hasBizKeywords || (hasNumbers && hasDecisionAsk) || hasDecisionAsk;
}

/* =========================================================
  4. HELPERS & UTILITIES
========================================================= */

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

// Scrub control tokens from text
function scrub(text) {
    return String(text || "")
        .substring(0, 1500)
        .replace(/\[\s*(SYSTEM|INJECTION|CTX)[^\]]*\]/gi, "");
}

function normalizeMessages(msgs, max = 8) {
    return msgs.slice(-max).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: scrub(m.content) }]
    }));
}

function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...headers }
    });
}

// --- LANGUAGE & DIALECT ENGINES ---

function detectLanguage(text) {
    // Rule: First reply matches user script.
    // If any Arabic char exists -> Arabic. Else -> English.
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
    return arabicPattern.test(text) ? "ar" : "en";
}

function shouldSwitchLanguage(text, currentLang) {
    if (text.length < 5) return false;

    const arChars = (text.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
    const enChars = (text.match(/[a-zA-Z]/g) || []).length;
    const total = arChars + enChars;

    if (total === 0) return false;

    // Switch to AR if > 70% Arabic
    if (currentLang === "en" && (arChars / total > 0.7)) return "ar";

    // Switch to EN if > 70% English
    if (currentLang === "ar" && (enChars / total > 0.7)) return "en";

    return false;
}

function detectDialectScore(text) {
    const t = text.toLowerCase();

    // Score 2 (Strong)
    const egStrong = /(عايز|عاوز|دلوقتي|يا معلم|إزاي|كده)/g;
    const gulfStrong = /(أبغى|ابغى|ما أبي|الحين|شلون|طال عمرك|وايد)/g;

    // Score 1 (Weak/Common)
    const egWeak = /(مش|إيه|ليه|بص|طب|يعني|امتى)/g;
    const gulfWeak = /(وش|زين|مره|ما عليك)/g;

    let sE = 0, sG = 0;

    // Count matches
    sE += ((t.match(egStrong) || []).length * 2);
    sE += ((t.match(egWeak) || []).length * 1);

    sG += ((t.match(gulfStrong) || []).length * 2);
    sG += ((t.match(gulfWeak) || []).length * 1);

    return { egypt: sE, gulf: sG };
}

function isSubstantive(text) {
    const t = text.trim();
    if (t.length > 15) return true;
    const hasMetric = /\d/.test(t) && /(%|\$|k|m|ريال|جنية|جنيه|دولار|roas|cpa|ctr)/i.test(t);
    return hasMetric;
}

function safetyClamp(text) {
    if (!text) return "";
    let clean = text.replace(/\b(As an AI large language model|I am an AI)\b/gi, "");
    // Cap at ~400 words equivalent (approx 2000 chars)
    return clean.length > 2200 ? clean.substring(0, 2197) + "..." : clean;
}

function sanitizeQuickReply(text) {
    return text.replace(/[\u{1F600}-\u{1F64F}]/gu, "")
        .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F]/g, "")
        .trim();
}

/* =========================================================
  5. PROMPT BUILDERS (Context-Aware KB Loading)
========================================================= */

function buildInstruction(lang, dialect, isFirst, options = {}) {
    const { isBusinessQ = false, isExpert = false } = options;

    // Language instruction
    let langInstruction = "";
    if (lang === "en") {
        langInstruction = "LANGUAGE: English (US Casual Professional). No Arabic.";
    } else {
        if (dialect === "egypt") {
            langInstruction = "LANGUAGE: Arabic (Professional Egyptian Dialect - مصري احترافي).";
        } else if (dialect === "gulf") {
            langInstruction = "LANGUAGE: Arabic (Professional Gulf White Dialect - خليجي أبيض).";
        } else {
            langInstruction = "LANGUAGE: Arabic (Friendly Neutral Colloquial - عامية بيضا لطيفة). Avoid MSA/Fusha.";
        }
    }

    const flow = isFirst
        ? "⚠️ STARTUP: Use 'WARM-UP PROTOCOL'. Welcome -> Insight -> Intent."
        : "⚠️ FLOW: Concise (1-5 lines). Direct.";

    // ===== Build KB Chunks =====
    let kbChunks = [];

    // Always include STYLE + MOHAMED
    kbChunks.push(KB_STYLE_CORE);
    kbChunks.push(KB_MOHAMED_CORE);

    // Add MICROSCRIPTS for first message OR business questions (keeps charisma)
    if (isFirst || isBusinessQ) {
        kbChunks.push(KB_MICROSCRIPTS);
    }

    // Add MARKET_CARDS for business questions
    if (isBusinessQ) {
        kbChunks.push(KB_MARKET_CARDS);
    }

    // Add EXPERT arsenal for expert mode
    if (isExpert) {
        kbChunks.push(KB_EXPERT_ADVANCED);
    }

    return `
${kbChunks.join("\n\n")}

[FLOW]
${flow}

[LANGUAGE LOCK]
${langInstruction}
`.trim();
}

/* =========================================================
  6. MAIN HANDLER
========================================================= */

export default {
    async fetch(req, env) {
        const origin = req.headers.get("Origin");

        // === HARD ORIGIN GATE (P0 Security) ===
        // Block requests without Origin header
        if (!origin) return json({ error: "Forbidden" }, 403);

        // Parse and validate origin
        let reqOrigin = origin;
        try { reqOrigin = new URL(origin).origin; } catch { return json({ error: "Forbidden" }, 403); }

        // Block if origin not in allowlist (BEFORE any processing/key usage)
        if (!ALLOWED_ORIGINS.includes(reqOrigin)) {
            return json({ error: "Forbidden" }, 403);
        }

        // Build CORS headers (only for allowed origins)
        const corsHeaders = {
            "Access-Control-Allow-Origin": reqOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Vary": "Origin"
        };

        if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);

        try {
            const body = await req.json();
            const messages = body.messages || [];
            // Treat frontend meta.mode mostly as a hint, except for session state
            const previousMeta = body.meta || {};

            // Sanitize lastMsg: DoS guard + strip control tokens
            const rawLastMsg = messages.length ? messages[messages.length - 1].content : "";
            const lastMsg = String(rawLastMsg || "")
                .substring(0, 2000)
                .replace(/\[\s*(SYSTEM|INJECTION|CTX)[^\]]*\]/gi, "");

            const isFirstMessage = messages.length <= 1;

            // --- 1. LANGUAGE & DIALECT STATE ---
            let sessionLang = previousMeta.session_lang;
            let sessionDialect = previousMeta.session_dialect || "neutral";
            let dialectLock = previousMeta.dialect_lock || false;
            let obsCount = previousMeta.observations_count || 0;

            if (!sessionLang) {
                // First interaction: define base language
                sessionLang = detectLanguage(lastMsg);
                if (sessionLang === "en") dialectLock = true;
            } else {
                // Check if user forcefully switched language
                const newLang = shouldSwitchLanguage(lastMsg, sessionLang);
                if (newLang) {
                    sessionLang = newLang;
                    if (sessionLang === "ar") {
                        // Reset dialect if switching back to Arabic
                        sessionDialect = "neutral";
                        dialectLock = false;
                        obsCount = 0;
                    } else {
                        dialectLock = true; // Lock English
                    }
                }
            }

            // Progressive Dialect Logic
            if (sessionLang === "ar" && !dialectLock) {
                const scores = detectDialectScore(lastMsg);
                const diffE = scores.egypt - scores.gulf;
                const diffG = scores.gulf - scores.egypt;

                // Lock if: strong score (>=3) OR clear difference (>=2)
                if (scores.egypt >= 3 || diffE >= 2) {
                    sessionDialect = "egypt";
                    dialectLock = true;
                    obsCount = 0; // Reset on lock
                } else if (scores.gulf >= 3 || diffG >= 2) {
                    sessionDialect = "gulf";
                    dialectLock = true;
                    obsCount = 0; // Reset on lock
                } else {
                    obsCount++;
                    // Lock neutral after 4 observations to stop oscillation
                    if (obsCount >= 4) {
                        sessionDialect = "neutral";
                        dialectLock = true;
                        obsCount = 0; // Reset on lock
                    }
                }
            }

            // --- 2. INTENT & MODE LOGIC (Strict Gate) ---
            const wantsPortfolio = /(portfolio|بورتفوليو|سابقة أعمال|أعمالك|projects\b)/i.test(lastMsg);
            const wantsContact = /(contact|تواصل|رقم|واتس|هاتف|مكالمة|call|phone|hire)/i.test(lastMsg);
            const wantsDeepAudit = /(audit|analyze|analysis|فحص|تحليل|قيم|تقييم)/i.test(lastMsg);

            // Intent conflict detection
            const dataIntent = wantsPortfolio || wantsContact;
            const intentConflict = wantsDeepAudit && dataIntent;

            // Calculate Mode (Backend Authority)
            let expertUses = previousMeta.expert_uses || 0;
            const flashCount = previousMeta.flash_count || 0;
            const isSubstantiveMsg = isSubstantive(lastMsg);

            // Default to Flash
            let targetMode = "flash";

            // Mode decision:
            // 1. Conflict → force Flash to resolve
            // 2. Deep audit OR continuing expert → Expert (max 2 uses total)
            if (intentConflict) {
                targetMode = "flash"; // Force flash to resolve intent order
            } else {
                const continueExpert = previousMeta.mode === "expert" && isSubstantiveMsg;
                if ((wantsDeepAudit || continueExpert) && expertUses < 2) {
                    targetMode = "expert";
                }
            }

            // --- 3. PROMPT GENERATION (Context-Aware KB) ---
            const isBusinessQ = isBusinessQuestion(lastMsg);
            let systemPrompt = buildInstruction(sessionLang, sessionDialect, isFirstMessage, {
                isBusinessQ: isBusinessQ,
                isExpert: targetMode === "expert"
            });
            let selectedModel = MODELS.FLASH;

            if (targetMode === "expert") {
                systemPrompt += `\n\nYou are now in Expert Mode. Provide deep, structured analysis.`;
                selectedModel = MODELS.EXPERT;
            } else {
                // Flash Mode
                if (intentConflict) {
                    // Conflict resolution prompt
                    systemPrompt += `\n\nInstruction: User asked for analysis + contact/portfolio together. Ask which to do first in 2-3 lines. Provide [[options]] like [[ابعت التواصل]] [[نبدأ التحليل]].`;
                } else if (previousMeta.mode === "expert" && !isSubstantiveMsg) {
                    // User was in expert but sent short msg - ask for details
                    systemPrompt += `\n\nInstruction: User was in deep analysis but sent a short message. Ask for specific numbers/context in 2 lines. Provide [[options]] like [[ابعت الأرقام]] [[قول الهدف]].`;
                } else {
                    // Normal injections
                    if (wantsPortfolio) systemPrompt += `\n\n[INJECTION]: Wants Portfolio. PRINT THIS EXACTLY: ${DATA_BLOCKS.PORTFOLIO}`;
                    if (wantsContact) systemPrompt += `\n\n[INJECTION]: Wants Contact. PRINT THIS EXACTLY: ${DATA_BLOCKS.CONTACT}`;
                }
            }

            // --- 4. FETCH EXECUTION (With Failover) ---
            let responseText = "";
            const keys = shuffle(GEMINI_KEY_POOL);
            let success = false;

            async function tryGenerate(model, apiKey) {
                const payload = {
                    contents: normalizeMessages(messages),
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        temperature: targetMode === "expert" ? 0.7 : 0.5,
                        maxOutputTokens: targetMode === "expert" ? 800 : 512,
                    }
                };

                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });

                    if (res.status === 200) {
                        const data = await res.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        // Log if blocked (no candidates)
                        if (!text && !data.candidates?.length) {
                            console.warn("Blocked or empty response:", data.promptFeedback);
                        }
                        return text || null;
                    }
                    if (res.status === 400) console.error(`400 Error:`, await res.text());
                    return null;
                } catch (e) {
                    return null;
                } finally {
                    clearTimeout(id); // P0 Fix: Always clear timeout
                }
            }

            // A. Try Primary Model (Flash or Expert)
            for (const k of keys) {
                const apiKey = env[k];
                if (!apiKey) continue;
                responseText = await tryGenerate(selectedModel, apiKey);
                if (responseText) {
                    success = true;
                    break;
                }
            }

            // B. Failover (If primary failed, try all keys with fallback model)
            if (!success) {
                console.warn("Primary model failed. Attempting Failover...");
                for (const k of keys) {
                    const apiKey = env[k];
                    if (!apiKey) continue;
                    responseText = await tryGenerate(MODELS.FAILOVER, apiKey);
                    if (responseText) { success = true; break; }
                }
            }

            if (!responseText) throw new Error("Service Unavailable");

            // --- 5. POST PROCESS ---
            responseText = safetyClamp(responseText);

            // Quick Replies
            const quickReplies = [];
            const badgeRegex = /\[\[(.*?)\]\]/g;
            let match;
            while ((match = badgeRegex.exec(responseText)) !== null) {
                const opt = sanitizeQuickReply(match[1]);
                if (opt && quickReplies.length < 3) quickReplies.push(opt);
            }
            responseText = responseText.replace(badgeRegex, "").trim();

            const nextExpertUses = targetMode === "expert" ? expertUses + 1 : expertUses;

            return json({
                response: responseText,
                meta: {
                    worker_version: WORKER_VERSION,
                    mode: targetMode,
                    expert_uses: nextExpertUses,
                    flash_count: flashCount + 1,
                    session_lang: sessionLang,
                    session_dialect: sessionDialect,
                    dialect_lock: dialectLock,
                    observations_count: obsCount,
                    quickReplies: quickReplies
                }
            }, 200, corsHeaders);

        } catch (err) {
            return json({ error: "System Busy", details: "Retrying neural link..." }, 503, corsHeaders);
        }
    }
};
