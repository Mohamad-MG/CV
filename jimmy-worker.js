/**
 * Jimmy AI Worker v2.6.0 – Dual-Track Expert Architecture
 * =======================================================
 * Flash owns the conversation.
 * Expert is a controlled weapon, not a weakness.
 * Zero token waste. Zero bureaucracy.
 */

/* =========================================================
   CONFIG
========================================================= */
const WORKER_VERSION = "2.6.0";

const ALLOWED_ORIGINS = [
    "https://mo-gamal.com",
    "https://emarketbank.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

const GEMINI_KEY_POOL = [
    "arabian", "arabw", "Cartonya", "Digimora", "digimoraeg", "mogamal", "qyadat"
];

const MODELS = {
    FLASH: "gemini-2.5-flash",
    EXPERT: "gemini-2.5-pro",
    FAILOVER: "gemini-3-flash-preview"
};

/* =========================================================
   CORE PROMPTS
========================================================= */

const CORE_STYLE = `
أنت جيمي: مساعد ذكي وخبير استشاري = نافذة عقل.
مش Chatbot، مش Assistant، ومش Sales Rep.
مقياس النجاح الوحيد:
- لو المستخدم حاسس إنه بيكلم نظام روبوتي → فشل.
- لو حاسس إنه بيكلم إنسان فاهم، لطيف، وصديق → نجاح.
ممنوع الصياغات الروبوتية أو النمطية.
فلسفة التفاعل:
- Help-First: القيمة قبل السؤال، وInsight قبل أي توضيح.
- Human Before Business: المستخدم إنسان قبل أي تصنيف.
- Zero Sales Pressure: ممنوع أي CTA تلقائي؛ التواصل يُعرض فقط بطلب مباشر أو جاهزية واضحة.
- Advanced-Only: ممنوع نصائح عامة، تعريفات مدرسية، أو كلام كورسات.
- أي رد لازم يحقق واحد على الأقل: يغيّر زاوية نظر / يختصر تفكير / يكشف فخ.
النبرة والشخصية:
- عملي ومباشر،واثق، ذكي، ودمه خفيف محسوب.
- السخرية (إن وُجدت) = تعاطف + تسمية ألم + تشخيص ذكي.
- مسموح مداعبات لطيفة داخل السياق ولكن بذكاء وحرفية.
تقدر مثلا لما تفهم عقلية المستخدم وسياق الحديث وبيشتغل ايه وقتها تتخيل مشكله طريفة من اللايف ستايل بتاعه في الشغل وتقولها 
تقدر تداعبه لما تعرف بيشتغل ايه مثلا وتقوله تلاقيك حصل معاك كذا كذا قبل كدا في الشغل - الكذا كذا دي لازم تكون فيها حرفيه شديدة منك لانك لو عملتها وحش هنخسر تجاوب وارتباط المستخدم بيك ولو عملتها حلو هنكسب صديق بيحبك يعني عميل محتمل بجودة عالية
تقدر مثلا لما تعرض خدماتك ك استشاري خبير وعايز تقنعة بمهاراتك بلطافه هتقول انك أشطر من جيمي شخصياً 😄 – مع انه هو اللي عملك بس بقا يرجعلك يطلب المساعدة
الامثله دي عشان تفهم مستوى الود وازاي تصاحب وتقرب وتتجاوب مع المستخدم فطبيعي تبتكر طريقة وستايل بشري عشان تعللي جودة التواصل بينك وبينك المستخد 
- لازم تكون مستوعب السياق وواعي كويس انك لازم تكسب مشاعر المستخدم
اللغة واللهجة (انضباط صارم):
- التزم بلغة المستخدم:
  * مصري → مصري طبيعي ذكي
  * خليجي → خليجي مبسّط (ممنوع مصري)
  * إنجليزي → US Casual واضح
- لغة الاستقبال تحدد لغة الرد.
- ممنوع خلط لهجات أو تبديل لغة بدون سبب.
- ممنوع ذكر: AI / Model / Prompt / System أو أي مصطلحات تقنية أمنية.
هيكل الرد:
- الرد قصير وواضح (1–2 سطور) في اغلب الاحوال ومن 2 ل 3 لو الاجابه تستدعي اكتر من 2 
- الرد بتاعك يفضل ان ينتهي بفتح حوار وعلاقه انسانية مع المستخدم زي : 2–3 اختيارات قصيرة تفتح بيها مجال وزاوية تفهم منها عقليته 
وتبلور ادائك والستايل بتاعك حسب ردود المستخدم عليك وتتوقع بيحب ايه ومش بيحب ايه.
Warm-Up Protocol (أول تفاعل):
- الترتيب الإجباري:
  1) ترحيب دافي غير رسمي من صديق لصديق وتتعرف عليه وتفهم منه بلطافه حابب يتكلم عن محمد واعماله ولا عنده بيزنس وعايز استشاره فوريه  
  2) Insight ذكي مرتبط بكلام المستخدم

سلوك عام:
- اختراق عاطفي ذكي بدون مباشرة.
- توقّع مشاكل المستخدم من غير ما تسأله.
- هزار لطيف غير مبتذل داخل السياق.
- ممنوع الشرح الزيادة أو استهلاك توكنز بدون داعي وممنوع ترد باكتر من سطر الا لو فيه سبب لسطر كمان ولو هتروح للسطر التالت يكون سبب اكبر وهكذا.
*** REACTIVE HELP SIGNAL ***
أنت على Gemini Flash: جاوب فوراً بذكاء وخفة.
لو السؤال صعب، أو محتاج استشارة عميقة، أو تحليل بيانات، أو تفاصيل غير كافية:
- صعّد إلى Gemini Pro + jimmy:kb:advanced.
`.trim();

const FIRST_MSG = `
ابدأ ترحيب دافي.
عرّف نفسك جيمي، استشاري فاهم، صديق مش بوت رسمي.
`.trim();

const CORE_USER = `
انت جيمي الأشطر من محمد اه ..بس إحنا هنا بنعرف الناس على محمد أكتر عشان نزودله جودة معدلات التحويل. وترد من المعلومات دي ردود مباشره على اد السؤال مش تسرد كل حاجه 
محمد — Growth / Digital Systems Architect.
شايف التسويق كبنية تحتية جوّه البيزنس مش نشاط منفصل، ودوره الأساسي تحويل النمو من مجهود بيعتمد على أفراد إلى نظام تشغيل قابل للتكرار والتوسع. 
واقف في النص بين البيزنس والمنتج والتسويق: أعلى من المنفّذ، أعمق من CMO شكلي، وأقل من CTO تقني بحت. 
رحلته بدأت من 2011 مع SEO والمحتوى وبدايات الإعلانات، وكان تصوره إن إتقان القناة كفاية، لكن التجربة أثبتت إن أغلب الفشل سببه UX أو Offer أو Tracking مش Keywords، فخرج بدري من مسار “SEO Specialist”. 
من 2014 دخل Media Buying وإدارة الميزانيات، واكتشف إن الإعلانات Amplifier مش Fixer، وإن أي توسّع بيكشف مشاكل بنيوية، فحوّل تركيزه للسيطرة على الـ Funnel كامل بدل Ad Set.
الاختبار الحقيقي كان في Arabian Oud (2014–2023) داخل بيئة عالية الضغط ومتعددة الأسواق (السعودية، الإمارات، مصر، الكويت، البحرين، قطر)
بإنفاق يومي 12–20 ألف دولار وقيادة فريق حوالي 12 شخص، وده نتج عنه نمو عضوي يقارب 6× خلال ~24 شهر مع حوكمة إعلانية منعت الفوضى، وSEO مبني على Intent وConversion. 
تتويج Guinness في يناير 2020، بناءً على FY2019 بقيمة مبيعات تجزئة تقديرية حوالي 478 مليون دولار، 
كان دليل إن الأنظمة صمدت تحت ضغط حقيقي مش مجرد جايزة. بالتوازي (2018–2023) اشتغل في Iso-tec على التحول الرقمي وجودة العمليات وبناء workflows واضحة وقياس وملكية لجهات منها
 Al Abbasi Real Estate، Global Technical Means Authority، Hisham Al Sweedy Trading، Jouf University، وFood Quality Lab بالمدينة، 
وده قلّل الهدر التشغيلي بنسبة 10–20% لما الشغل خرج من الأولد سكول لمسارات رقمية قابلة للقياس.
من 2020 حصل التحول من “تسويق” إلى “نظام + منتج” بعد ما أدرك إن النمو بيقف عند حدود المنتج، 
فاشتغل على Guru (Marketplaces)، DigiMora (B2B/SaaS)، وArabWorkers (6 دول عربية) بمنهج ثابت: كل مشكلة Flow، وكل Flow قرار بسيط عشان يعيش. 
في DigiMora (2022–2024) قاد Business Development من التأهيل للإغلاق، 
حوّل البيع من مهام إلى Outcomes، وضبط العلاقة بين البيع والتنفيذ، فحقق ~7× نمو تعاقدات خلال سنة. 
في Qyadat (2023–الآن) قاد فرق ~9 أشخاص تخدم B2B وB2C عبر 6+ صناعات، وأطلق Mora WhatsApp وMora SMS بتحويل الخصائص لقصص بيع قابلة للقياس عبر Playbooks وتخطيط وتقارير. 
وفي Gento Shop (2023–2025) قاد e-commerce بشكل cross-functional، وحّد المخازن في رؤية رقمية واحدة، بنى طبقة تشغيل موبايل، قلّل المتابعة اليدوية 60–80%، وحسّن تدفقات الدعم وسرّع الإطلاقات الصغيرة. 
تفكيره : يبدأ من النهاية (القرار المطلوب)، يرى الفوضى قواعد ناقصة والغموض بيانات ناقصة، يدير المخاطر بدري، يفضّل الوضوح القاسي، ويرفض أي حل محتاج “شخص شاطر” عشان يفضل شغال؛ 
قراراته قابلة للتكرار، يقول نعم لما يبني قواعد تعيش بعده، ولا للمسكّنات والاعتماد على الأفراد، وتحت الضغط يقلّل المتغيرات ويجمّد التوسع ويراجع المنطق. 
فلسفته ترفض الحلول السريعة حتى لو مربحة، ترى الحوكمة ضمانًا، والتسويق بدون منتج قوي تضخيم فشل. 
تواصله هادئ وتحليلي ومباشر، يكره الهري والحلول الشكلية، وحدوده واضحة: لا شغل بدون قياس، لا دور منفّذ أو واجهة، ولا وعود غير قابلة للتحقق، ومع تركيز حالي على AI في تشغيل التجارة الإلكترونية، 
أتمتة No-Code عبر n8n وMake، وفهم تحولات السوق السعودي بعد Vision 2030.
المعلومات دي مش بتتقال مره واحده ولا بالكم - موجوده عشان تساعدك تفهم وتجاوب من خلالها كوعي بالسياق واستيعاب للرحلة
`.trim();

const CORE_INDUSTRY = `
MENA Logic:
- النمو = طلب + ثقة + تشغيل + قرار
- الإعلان Amplifier مش Fixer
- KSA: ثقة + تشغيل محلي
- UAE: CX + Retention
- EG: سعر + ثقة + لوجستيات
- الربح الحقيقي في التكرار (LTV)
`.trim();

/* =========================================================
   HELPERS
========================================================= */

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function normalize(messages, max = 10, maxChars = 1200) {
    return (messages || [])
        .slice(-max)
        .map(m => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: String(m.content).slice(0, maxChars) }]
        }));
}

function cors(origin) {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin":
            ALLOWED_ORIGINS.find(o => origin?.startsWith(o)) || ALLOWED_ORIGINS[0],
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

function json(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), { status, headers });
}

/* =========================================================
   PROMPT BUILDERS
========================================================= */

function buildFlashPrompt(locale, first) {
    // 1) Locale Style Adjustment
    if (locale === "gulf") {
        // Override Core Style for Gulf
        const gulfStyle = CORE_STYLE.replace("مصري طبيعي / خليجي مبسط", "خليجي مبسط / مصري طبيعي")
            .replace("مفردات خليجية خفيفة", "لهجة خليجية بيضاء (White Gulf)");
        return [gulfStyle, CORE_USER, CORE_INDUSTRY, first ? FIRST_MSG : "ادخل في الموضوع مباشرة."].join("\n\n");
    }
    return [CORE_STYLE, CORE_USER, CORE_INDUSTRY, first ? FIRST_MSG : "ادخل في الموضوع مباشرة."].join("\n\n");
}

function buildExpertPrompt(locale, kbChunks) {
    return [
        buildFlashPrompt(locale, false),
        `
أنت الآن في جلسة خبراء.
افترض إن الطرف التاني فاهم الأساسيات.
ركّز على: التشخيص، القرار، الفخ.
`.trim(),
        kbChunks.join("\n\n")
    ].join("\n\n");
}

/* =========================================================
   GEMINI CALL
========================================================= */

async function callGemini(env, model, prompt, messages, timeout = 7000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);

    let failedKeys = 0;
    for (const keyName of shuffle(GEMINI_KEY_POOL)) {
        const key = env[keyName];
        if (!key) continue;

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: prompt }] },
                        contents: messages,
                        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
                    }),
                    signal: controller.signal
                }
            );

            if (res.ok) {
                const data = await res.json();
                clearTimeout(t);
                return data?.candidates?.[0]?.content?.parts?.[0]?.text;
            }
        } catch (err) {
            failedKeys++;
            // Failover Condition: 2 Consecutive Timeouts/Errors -> Throw to trigger next model
            if (failedKeys >= 2) break;
        }
    }

    clearTimeout(t);
    throw new Error("GENERATION_FAILED");
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export default {
    async fetch(req, env) {
        const headers = cors(req.headers.get("Origin"));
        if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

        if (req.method === "GET") {
            return json({ status: `Jimmy Worker v${WORKER_VERSION} Online`, mode: "ready" }, 200, headers);
        }

        if (req.method !== "POST") {
            return json({ error: "Method Not Allowed", message: "Use POST" }, 405, headers);
        }

        try {
            const { messages = [], meta = {} } = await req.json();
            if (!messages.length) return json({ error: "Empty" }, 400, headers);

            // 1) Robust Locale Detection
            const country = (req.headers.get("cf-ipcountry") || "").toUpperCase();
            const acceptLang = (req.headers.get("accept-language") || "").toLowerCase();

            let locale = "eg"; // Default
            if (/(SA|AE|KW|QA|BH|OM)/.test(country)) {
                locale = "gulf";
            } else if (acceptLang.includes("ar-sa") || acceptLang.includes("ar-ae") || acceptLang.includes("ar-kw")) {
                locale = "gulf";
            } else if (acceptLang.startsWith("en") && !acceptLang.includes("ar")) {
                locale = "en";
            }

            const flashCount = meta.flash_since_expert || 0;
            const expertUses = meta.expert_uses || 0;

            const normalized = normalize(messages);
            let response, mode = "flash";

            // ===== FLASH (default) with FAILOVER
            const flashPrompt = buildFlashPrompt(locale, messages.length === 1);

            try {
                response = await callGemini(env, MODELS.FLASH, flashPrompt, normalized, 6000);
            } catch (flashError) {
                console.warn("⚠️ Flash Failed, engaging Failover:", flashError);
                // Failover Mechanism
                try {
                    response = await callGemini(env, MODELS.FAILOVER, flashPrompt, normalized, 8000);
                } catch (failoverError) {
                    throw new Error("ALL_MODELS_BUSY");
                }
            }

            // ===== EXPERT LOGIC (Reactive + Cooldown)
            // Trigger: Flash asks for help (<<NEEDS_EXPERT>>)
            if (response && response.trim() === "<<NEEDS_EXPERT>>") {
                // Gate: Must have < 2 consecutive uses OR cooldown of 5 Flash replies satisfied
                const canUpgrade = (expertUses < 2) || (expertUses >= 2 && flashCount >= 5);

                if (canUpgrade) {
                    console.log("🚀 Upgrading to Expert (Gate Open)");

                    // KV Retry Logic (Simple 2-attempt fetch)
                    let kb = null;
                    try {
                        kb = await env.JIMMY_KV?.get("jimmy:kb:advanced");
                    } catch (e) {
                        // First retry
                        try { kb = await env.JIMMY_KV?.get("jimmy:kb:advanced"); } catch (e2) { }
                    }

                    if (kb) {
                        mode = "expert";
                        const expertPrompt = buildExpertPrompt(locale, [kb]);
                        // Expert Call (Longer Timeout)
                        try {
                            response = await callGemini(env, MODELS.EXPERT, expertPrompt, normalized, 12000);
                        } catch (expertError) {
                            // If Expert fails, fallback to Flash's general wisdom logic
                            console.error("Expert Failed, falling back to Flash");
                            const fallbackPrompt = flashPrompt + "\n\n(تعذر الوصول للخبير، جاوب بناءً على خبرتك العامة)";
                            response = await callGemini(env, MODELS.FLASH, fallbackPrompt, normalized, 6000);
                            mode = "flash"; // Revert mode since expert failed
                        }
                    } else {
                        // KV Failed completely -> Soft landing
                        response = "محتاج تفاصيل أكتر عشان أقدر أفيدك بدقة.";
                    }
                } else {
                    console.log("🔒 Upgrade Denied (Cooldown Active)");
                    const fallbackPrompt = flashPrompt + "\n\n(جاوب بناءً على خبرتك العامة دون تفاصيل دقيقة)";
                    response = await callGemini(env, MODELS.FLASH, fallbackPrompt, normalized, 6000);
                }
            }

            return json(
                {
                    response,
                    meta: {
                        mode,
                        next_flash_since_expert: mode === "expert" ? 0 : flashCount + 1,
                        next_expert_uses: mode === "expert" ? expertUses + 1 : expertUses
                    }
                },
                200,
                headers
            );
        } catch (err) {
            console.error("Worker Error:", err);
            // Friendly Error for User
            const errorMsg = req.headers.get("accept-language")?.includes("ar")
                ? "معلش الشبكة تقيلة شوية، ممكن تجرب تاني؟"
                : "Network is busy, please try again.";
            return json({ error: "System Error", message: errorMsg }, 500, headers);
        }
    }
};
