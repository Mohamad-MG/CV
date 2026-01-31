/**
 * Jimmy AI Worker v2.9.0 – Conversion-Optimized Architecture
 * ===========================================================
 * Flash owns the conversation.
 * Expert is surgical with consent validation.
 * Contact flow = unified template, zero friction.
 * Nudge = permission-based, never pushy.
 */

/* =========================================================
  CONFIG
========================================================= */
const WORKER_VERSION = "2.9.2";

const ALLOWED_ORIGINS = [
    "https://mo-gamal.com",
    "https://emarketbank.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

const GEMINI_KEY_POOL = [
    "arabian",
    "arabw",
    "Cartonya",
    "Digimora",
    "digimoraeg",
    "mogamal",
    "qyadat",
];

const MODELS = {
    FLASH: "gemini-2.5-flash",
    EXPERT: "gemini-2.5-pro",
    FAILOVER: "gemini-3-flash-preview",
};

/* =========================================================
  UNIFIED CONTACT TEMPLATES (100% consistent)
========================================================= */
const CONTACT_TEMPLATES = {
    "ar-eg": `محمد هيكون سعيد يسمع منك! 😊

تحب مكالمة ولا واتساب؟
📞 مكالمة: tel:+201555141282
🧾 للنسخ: 00201555141282
💬 واتساب: https://wa.me/201555141282`,

    "ar-sa": `محمد يسعد يسمع منك! 😊

تفضل مكالمة أو واتساب؟
📞 اتصال: tel:+201555141282
🧾 للنسخ: 00201555141282
💬 واتساب: https://wa.me/201555141282`,

    en: `Mohamed would love to hear from you! 😊

Prefer a call or WhatsApp?
📞 Call: tel:+201555141282
🧾 To copy: 00201555141282
💬 WhatsApp: https://wa.me/201555141282`,

    // Neutral Arabic (for Levant/Maghreb/unknown)
    ar: `محمد يسعد يسمع منك! 😊

تفضل مكالمة أو واتساب؟
📞 مكالمة: tel:+201555141282
🧾 للنسخ: 00201555141282
💬 واتساب: https://wa.me/201555141282`,

    // Gulf fallback (kept for backward compatibility)
    gulf: `محمد يسعد يسمع منك! 😊

تفضل مكالمة أو واتساب؟
📞 اتصال: tel:+201555141282
🧾 للنسخ: 00201555141282
💬 واتساب: https://wa.me/201555141282`,
};

/* =========================================================
  PORTFOLIO TEMPLATES (Zero-variation portfolio responses)
========================================================= */
const PORTFOLIO_TEMPLATES = {
    "ar-eg": `اتفضل! 🌐

🔗 البورتفوليو: https://mo-gamal.com
📄 السيرة الذاتية (PDF): https://mo-gamal.com/Mohamed-Gamal-CV.pdf

لو عندك أي سؤال وانا هنا! 😊`,

    "ar-sa": `تفضل! 🌐

🔗 الموقع: https://mo-gamal.com
📄 السيرة الذاتية (PDF): https://mo-gamal.com/Mohamed-Gamal-CV.pdf

أي استفسار أنا جاهز! 😊`,

    en: `Here you go! 🌐

🔗 Portfolio: https://mo-gamal.com
📄 Resume (PDF): https://mo-gamal.com/Mohamed-Gamal-CV.pdf

Any questions, I'm here! 😊`,

    // Neutral Arabic
    ar: `تفضل! 🌐

🔗 الموقع: https://mo-gamal.com
📄 السيرة الذاتية (PDF): https://mo-gamal.com/Mohamed-Gamal-CV.pdf

أي سؤال أنا جاهز! 😊`,

    // Gulf fallback
    gulf: `تفضل! 🌐

🔗 الموقع: https://mo-gamal.com
📄 السيرة الذاتية (PDF): https://mo-gamal.com/Mohamed-Gamal-CV.pdf

أي استفسار أنا جاهز! 😊`,
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
- Help-First: القيمة قبل السؤال، وInsight من سطر واحد قبل أي توضيح.
- Human Before Business: المستخدم إنسان قبل أي تصنيف.
- Zero Sales Pressure: ممنوع أي CTA تلقائي؛ التواصل يُعرض فقط بطلب مباشر أو جاهزية واضحة.
- Advanced-Only: ممنوع نصائح عامة، تعريفات مدرسية، أو كلام كورسات.
- أي رد لازم يحقق واحد على الأقل: يغيّر زاوية نظر / يختصر تفكير / يكشف فخ.

النبرة والشخصية:
- عملي ومباشر، واثق، ذكي، ودمه خفيف محسوب.
- السخرية (إن وُجدت) = تعاطف + تسمية ألم + تشخيص ذكي.
- مسموح مداعبات لطيفة داخل السياق ولكن بذكاء وحرفية.
- لو فهمت عقلية المستخدم وسياق عمله، تقدر تتخيل مشكلة طريفة من الـ lifestyle بتاعه وتذكرها بذكاء.
- لما تعرض استشارة خبير، تقدر تقول بلطف إنك "أشطر من جيمي شخصياً 😄 – مع إنه اللي عملني بس بقا يرجعلي يطلب المساعدة".
- لازم تكسب مشاعر المستخدم مش بس attention.

اللغة واللهجة (انضباط صارم):
- التزم بلغة المستخدم:
  * مصري → مصري طبيعي ذكي
  * خليجي → خليجي مبسّط (ممنوع مصري)
  * إنجليزي → US Casual واضح
- لغة الاستقبال تحدد لغة الرد.
- ممنوع خلط لهجات أو تبديل لغة بدون سبب.
- ممنوع ذكر: AI / Model / Prompt / System أو أي مصطلحات تقنية أمنية.

هيكل الرد:
- الرد قصير وواضح (1–2 سطور) ويفضل من سطر واحد.
- ممنوع تزيد عن سطرين إلا لو الموضوع فعلاً محتاج سطر تالت.
- الرد يفضل ينتهي بفتح حوار: سؤال ذكي أو اختيارين يكشفوا عقلية المستخدم.

Warm-Up Protocol (أول تفاعل):
- الترتيب الإجباري:
  1) ترحيب دافي غير رسمي 
  2) تعريف بسيط: "أنا جيمي، مساعد محمد الذكي"
  3) سؤال واحد ذكي يكشف النية: "جاي تتعرف على محمد؟ ولا عندك مشروع وحابب استشارة سريعة؟"

سلوك عام:
- اختراق عاطفي ذكي بدون مباشرة.
- توقّع مشاكل المستخدم من غير ما تسأله.
- هزار لطيف غير مبتذل داخل السياق.
- ممنوع الشرح الزائد أو استهلاك توكنز بدون داعي.

CRITICAL - Contact Requests:
- ممنوع تعرض أرقام أو تواصل إلا لو المستخدم طلب صريح.
- لو طلب تواصل، استخدم القالب الموحد فقط (من CONTACT_TEMPLATES).
- ممنوع variation أو improvisation في التواصل.
`.trim();

const FIRST_MSG = `
ابدأ ترحيب دافي.
عرّف نفسك جيمي، مساعد محمد الذكي.
اسأل سؤال ذكي يكشف النية: جاي يتعرف على محمد؟ ولا عنده حاجة محددة؟
`.trim();

const CORE_USER = `
أنت جيمي وهو محمد.
أنت الأشطر من محمد (في الاستشارات العميقة) 😄 ..بس إحنا هنا بنعرف الناس على محمد أكتر عشان نزود معدلات التحويل.
ترد من المعلومات دي ردود مباشرة على قد السؤال – مش تسرد كل حاجة وخلاص بدون وعي.

محمد — Growth / Digital Systems Architect.
شايف التسويق كبنية تحتية جوّه البيزنس مش نشاط منفصل، ودوره الأساسي تحويل النمو من مجهود بيعتمد على أفراد إلى نظام تشغيل قابل للتكرار والتوسع.
واقف في النص بين البيزنس والمنتج والتسويق: أعلى من المنفّذ، أعمق من CMO شكلي، وأقل من CTO تقني بحت.

رحلته بدأت من 2011 مع SEO والمحتوى وبدايات الإعلانات، وكان تصوره إن إتقان القناة كفاية، لكن التجربة أثبتت إن أغلب الفشل سببه UX أو Offer أو Tracking مش Keywords، فخرج من مسار "SEO Specialist".

من 2014 دخل Media Buying وإدارة الميزانيات، واكتشف إن الإعلانات Amplifier مش Fixer، وإن أي توسّع بيكشف مشاكل بنيوية، فحوّل تركيزه للسيطرة على الـ Funnel كامل بدل Ad Set.

الاختبار الحقيقي كان في Arabian Oud (2014–2023) داخل بيئة عالية الضغط ومتعددة الأسواق (السعودية، الإمارات، مصر، الكويت، البحرين، قطر)
بإنفاق يومي 12–20 ألف دولار وقيادة فريق حوالي 12 شخص، وده نتج عنه نمو عضوي يقارب 6× خلال ~24 شهر مع حوكمة إعلانية منعت الفوضى، وSEO مبني على Intent وConversion.

تتويج Guinness في يناير 2020، بناءً على FY2019 بقيمة مبيعات تجزئة تقديرية حوالي 478 مليون دولار، كان دليل إن الأنظمة صمدت تحت ضغط حقيقي.

بالتوازي (2018–2023) اشتغل في Iso-tec على التحول الرقمي وجودة العمليات وبناء workflows واضحة، وده قلّل الهدر التشغيلي بنسبة 10–20%.

من 2020 حصل التحول من "تسويق" إلى "نظام + منتج"، فاشتغل على Guru (Marketplaces)، Mora SMS (B2B/SaaS)، Mora WhatsApp (6 دول عربية).

في DigiMora (2022–2024) قاد Business Development وحقق ~7× نمو تعاقدات خلال سنة.

في Qyadat (2023–الآن) قاد فرق ~9 أشخاص تخدم B2B وB2C عبر 6+ صناعات.

وفي Gento Shop (2023–2025) قاد e-commerce بشكل cross-functional، قلّل المتابعة اليدوية 60–80%.

تفكيره: يبدأ من النهاية (القرار المطلوب)، يرى الفوضى قواعد ناقصة والغموض بيانات ناقصة، يدير المخاطر بدري، يفضّل الوضوح القاسي، ويرفض أي حل محتاج "شخص شاطر" عشان يفضل شغال.

فلسفته ترفض الحلول السريعة حتى لو مربحة، ترى الحوكمة ضمانًا، والتسويق بدون منتج قوي تضخيم فشل.

تركيز حالي على: AI في تشغيل التجارة الإلكترونية، أتمتة No-Code عبر n8n وMake، وفهم تحولات السوق السعودي بعد Vision 2030.

**المعلومات دي مش بتتقال مرة واحدة - موجودة بس عشان تساعدك تفهم وتجاوب من خلالها كوعي بالسياق، مش كوبي-بيست.
`.trim();

const CORE_INDUSTRY = `
البرو مود (Expert Mode) - بيتم تفعيله لما العميل يطلب استشارة advanced أو يوافق عليها.
بتحلل السؤال، ترجع ببريف من سطر + سؤال من اختيارين.
لما تستقبل الإجابة، بيتفعل Gemini Pro وتجاوب بعمق.
بعد ريكويستين برو، ترجع للفلاش وتكمل دردشة.
بعد 5 ريكويست فلاش، تبدأ بلطافة تقنعه يكلم محمد مباشرة.

أنت عقل استشاري خبير عالي التخصص لأسواق مصر والسعودية والإمارات.
دورك: تشخيص الحالات المعقدة، كشف الفخاخ، تحسين معدلات النمو وعوائد التسويق والتجارة الإلكترونية.
مهمتك: تحويل أي مشكلة إلى قرار واضح أو سؤال تشخيص ذكي.
أي رد لا يغيّر قرار ولا يزيد وضوح = فشل.

① عقل القرار والتشخيص (Anti-Illusion Growth)
- أي نمو لا يمر على Contribution + Payback + Cash Cycle = نمو وهمي مهما كان ROAS.
- ROAS ثابت والربح واقع = الكسر غالبًا في COD/RTO/Returns/Payments/Logistics مش في Ads.
- High Traffic + Low CVR = ثقة مكسورة / احتكاك / وعد إعلاني كاذب.
- أي قرار ميزانية بدون CAPI/S2S + Dedup + Match Quality = قمار.
- Conversion Lag جزء من التكلفة؛ الحكم بدري يقتل حملات صح.
- Marketing منفصل عن Ops = لوحات حلوة وبيزنس بيخسر.

② من الطلب للإيراد (Demand → Cash)
- الإعلان نظام: Creative + Page + Offer + Proof + Ops + Payments.
- Proof داخل الرحلة (Reviews/سياسات/شحن) أقوى من Reach ومؤثرين.
- SEO اللي يبيع = Category & Intent Pages قبل المدونات.
- UX قرار مالي: سرعة موبايل، وضوح منتج، شحن/إرجاع قبل Checkout.
- الخصم يعالج أعراض ضعف الثقة ويقتل البراند على المدى.

③ واقع MENA + التشغيل
- KSA: توطين كامل + Proof + خفض RTO قبل أي توسع.
- UAE: CAC عالي طبيعي؛ الفوز في Segmentation + CX + Retention.
- EG: COD مرحلي + Wallets + تنفيذ محلي.
- BNPL (Tabby/Tamara) يرفع AOV ويقلل COD.
- واتساب قناة تشغيل: Confirm → Convert → Retain مش شات.
`.trim();

const RHYTHM_GUARD = `
خليك طبيعي.
ممنوع سرد طويل من غير سبب.
لو هتسأل: سؤال واحد ذكي يكفي.
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
        .map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: String(m.content).slice(0, maxChars) }],
        }));
}

function cors(origin) {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin":
            ALLOWED_ORIGINS.find((o) => origin?.startsWith(o)) || ALLOWED_ORIGINS[0],
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

function json(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), { status, headers });
}

function detectLocale(req) {
    const country = (req.headers.get("cf-ipcountry") || "").toUpperCase();
    const acceptLang = (req.headers.get("accept-language") || "").toLowerCase();

    // Precise locale from Accept-Language (ar-eg, ar-sa preferred)
    if (acceptLang.includes("ar-eg")) return "ar-eg";
    if (acceptLang.includes("ar-sa") || acceptLang.includes("ar-ae") || acceptLang.includes("ar-kw")) return "ar-sa";

    // Country-based Gulf detection
    if (/(SA|AE|KW|QA|BH|OM)/.test(country)) return "ar-sa";

    // English
    if (acceptLang.startsWith("en") && !acceptLang.includes("ar")) return "en";

    // Generic Arabic (non-Gulf, non-Egypt) → neutral Arabic to avoid tone mismatch
    if (acceptLang.startsWith("ar")) return "ar";

    // Default Egyptian (only if no Arabic signal detected)
    return "ar-eg";
}

function clampFlashResponse(text, maxChars = 900, maxLines = 4) {
    if (!text) return text;
    let out = String(text).trim();

    // Remove accidental meta/system artifacts (phrases only, not individual words)
    out = out.replace(/\b(As an AI|AI model|system prompt|AI assistant|language model)\b/gi, "");
    // Remove single "prompt" or "model" ONLY when followed by technical context
    out = out.replace(/\b(prompt|model)\s+(engineering|training|parameter)/gi, "");

    // Clamp by lines
    const lines = out
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    if (lines.length > maxLines) out = lines.slice(0, maxLines).join("\n").trim();

    // Clamp by chars (with smart word-boundary detection)
    if (out.length > maxChars) {
        // Find last space before maxChars to avoid cutting mid-word
        let cutPoint = maxChars;
        const lastSpace = out.lastIndexOf(" ", maxChars);
        const lastNewline = out.lastIndexOf("\n", maxChars);

        // Use the furthest valid break point
        cutPoint = Math.max(lastSpace, lastNewline);

        // If no space found in reasonable range, hard cut
        if (cutPoint < maxChars * 0.8) cutPoint = maxChars;

        out = out.slice(0, cutPoint).trim();

        // Add ellipsis or question mark if no sentence ending
        if (!/[.!؟…]$/.test(out)) {
            out += out.includes("؟") || /[\u0600-\u06FF]/.test(out) ? "…" : "...";
        }
    }

    return out;
}

function lastUserText(messages = []) {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.role === "user") return String(messages[i]?.content || "").trim();
    }
    return "";
}

// ✅ FIX #3: Enhanced intent detection with comprehensive patterns
function wantsConsult(text = "") {
    const t = text.toLowerCase();
    return /استشار|استشاره|استشارة|محتاج رأيك|عايز رأيك|عايز مساعده|عايز مساعدة|تحليل|استراتيجي|خطة|تقييم|تشخيص|consult|advice|strategy|analy|audit|review|help me|need expert/i.test(t);
}

// Portfolio intent detection (higher priority than contact)
function wantsPortfolio(text = "") {
    const t = text.toLowerCase();
    return /(لينك|link).*(بورتفوليو|موقع|portfolio|website|site|cv|سيرة|سيره|page|profile|bio|resume|mo-gamal|mo gamal)/i.test(t) ||
        /(بورتفوليو|موقع|portfolio|website|site|page|profile|cv|bio|resume|السيرة|البروفايل).*(لينك|link)/i.test(t) ||
        /\b(site|page|profile|cv|resume|bio|الموقع|السيرة|البروفايل|mo-gamal|mo gamal)\b/i.test(t);
}

// ✅ FIX #3: Contact intent with portfolio exclusion
function wantsContact(text = "") {
    const t = text.toLowerCase();

    // Portfolio requests have priority (pass original text, not lowercased)
    if (wantsPortfolio(text)) return false;

    // LinkedIn is contact intent ("لينكدإن" or "لينك محمد")
    const isLinkedInOrPersonal = /لينكدإن|linkedin|لينك محمد|mohamed.*link|link.*mohamed/i.test(t);

    return /عايز أكلم|ابغى اتواصل|ابغا اتواصل|كيف أتواصل|أتكلم مع محمد|أتواصل مع محمد|رقمك|رقم محمد|واتساب|واتس|مكالمة|اتصال|تواصل|ايميل|بريد|contact mohamed|talk to mohamed|reach mohamed|get in touch|phone|whatsapp|call|email/i.test(t) || isLinkedInOrPersonal;
}

function isAffirmative(text = "") {
    const t = text.toLowerCase().trim();
    return /^(yes|yeah|yep|ok|okay|sure|go on|go ahead|proceed|تمام|ماشي|ايوه|أيوه|ايوا|اه|نعم|تمام كده|كمل|طيب|يلا|هات)$/i.test(t);
}

// ✅ FIX #2: Validate probe response is meaningful (not just "ok")
function isSubstantiveResponse(text = "") {
    const t = text.toLowerCase().trim();

    // Too short = not substantive
    if (t.length < 5) return false;

    // Just affirmatives = not substantive (even if repeated)
    if (/^(yes|ok|تمام|ماشي|ايوه|اه|نعم|طيب|يلا|هات|sure|yep|yeah)$/i.test(t)) return false;

    // Word diversity check (prevent "تمام تمام تمام تمام")
    const uniqueWords = new Set(t.split(/\s+/));
    if (uniqueWords.size < 3) return false;

    // CRITICAL: Must contain business outcomes OR marketing mechanics keywords
    // Business outcomes: sales, orders, visits, checkout, conversions, etc.
    const hasBusinessOutcomes = /مبيعات|طلبات|زيارات|سلة|checkout|تحويل|conversion|مرتجعات|returns|شحن|shipping|عملاء|customers|orders|sales|visits|cart/i.test(t);

    // Marketing mechanics: ROAS, CAC, ads, SEO, tracking, budget, etc.
    const hasMarketingMechanics = /إعلان|اعلان|ربح|ميزانية|تسويق|تشغيل|متجر|منتج|صفحة|حملة|استهداف|ads|profit|budget|marketing|operations|store|product|landing|campaign|targeting|roas|cac|cvr|seo|tracking|pixels|analytics/i.test(t);

    if (!hasBusinessOutcomes && !hasMarketingMechanics) return false;

    // Has keywords AND reasonable length = substantive
    return t.length >= 10;
}

/* =========================================================
  PROMPT BUILDERS
========================================================= */

function buildFlashPrompt(locale, first, nudgeMohamed = false) {
    const tail = first ? FIRST_MSG : "ادخل في الموضوع مباشرة.";

    const localeHint =
        locale === "gulf"
            ? "لهجتك خليجي أبيض مبسّط. ممنوع مصري."
            : locale === "en"
                ? "Respond in US casual English. No Arabic."
                : "لهجتك مصري طبيعي ذكي. ممنوع خليجي.";

    // ✅ FIX #4: Permission-based nudge with contextual reason
    const nudge = nudgeMohamed
        ? locale === "en"
            ? "If the discussion needs account access, sensitive data, or detailed analytics, gently suggest: 'This might need Mohamed directly—would it help to connect?'"
            : "لو الموضوع محتاج دخول حسابات أو أرقام خاصة أو تفاصيل حساسة، اقترح بلطف: 'ممكن ده يحتاج محمد نفسه—تحب تتواصل معاه؟'"
        : "";

    return [CORE_STYLE, localeHint, CORE_USER, RHYTHM_GUARD, tail, nudge].join("\n\n");
}

function buildProbePrompt(locale) {
    return [
        buildFlashPrompt(locale, false),
        `
لو المستخدم وافق على الاستشارة أو طلبها:
- جاوب بجملة واحدة تؤكد الفهم.
- اسأل سؤال واحد من شقّين (اختيارين واضحين).
- لو عرضت الاستشارة أو طلبت تأكيد، أضف في آخر الرد الرمز <<OFFER_CONSULT>>.
`.trim(),
    ].join("\n\n");
}

function buildExpertPrompt(locale) {
    return [
        buildFlashPrompt(locale, false),
        `
أنت الآن في جلسة خبراء.
افترض إن الطرف التاني فاهم الأساسيات.
ركّز على: التشخيص، القرار، الفخ.
خليك مركز ومش مطوّل من غير داعي.
`.trim(),
        CORE_INDUSTRY,
    ].join("\n\n");
}

/* =========================================================
  GEMINI CALL
========================================================= */

async function callGemini(env, model, prompt, messages, timeout = 7000, gen = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);

    let failedKeys = 0;

    const generationConfig = {
        temperature: 0.65,
        maxOutputTokens: 400,  // Increased for fuller responses
        ...gen,
    };

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
                        generationConfig,
                    }),
                    signal: controller.signal,
                }
            );

            if (res.ok) {
                const data = await res.json();
                clearTimeout(t);
                return data?.candidates?.[0]?.content?.parts?.[0]?.text;
            }
        } catch (err) {
            failedKeys++;
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

            const locale = detectLocale(req);

            const flashCount = meta.flash_since_expert || 0;
            const expertUses = meta.expert_uses || 0;
            const awaitingProbe = Boolean(meta.awaiting_probe);
            const consultOffered = Boolean(meta.consult_offered);

            const normalized = normalize(messages);
            const userText = lastUserText(messages);
            let response;
            let mode = "flash";

            const canUpgrade = expertUses < 2;
            const shouldNudgeMohamed = flashCount >= 5;

            let nextAwaitingProbe = false;
            let nextConsultOffered = consultOffered;

            // ===== PORTFOLIO REQUEST (Highest Priority - Zero Variation)
            if (wantsPortfolio(userText)) {
                const template = PORTFOLIO_TEMPLATES[locale] || PORTFOLIO_TEMPLATES.ar;

                return json(
                    {
                        response: template,
                        meta: {
                            mode: "portfolio",
                            flash_since_expert: flashCount,
                            expert_uses: expertUses,
                            awaiting_probe: false,
                            consult_offered: consultOffered,
                        },
                    },
                    200,
                    headers
                );
            }

            // ===== CONTACT REQUEST (Second Priority)
            // ✅ FIX #1: Unified template, zero variation
            if (wantsContact(userText)) {
                const template = CONTACT_TEMPLATES[locale] || CONTACT_TEMPLATES.ar;

                return json(
                    {
                        response: template,
                        meta: {
                            mode: "contact",
                            flash_since_expert: flashCount,
                            expert_uses: expertUses,
                            awaiting_probe: false,
                            consult_offered: consultOffered,
                        },
                    },
                    200,
                    headers
                );
            }

            // ===== PROBE → EXPERT UPGRADE
            // ✅ FIX #2: Validate response is substantive before upgrading
            if (awaitingProbe) {
                if (canUpgrade && isSubstantiveResponse(userText)) {
                    mode = "expert";
                    const expertPrompt = buildExpertPrompt(locale);
                    response = await callGemini(env, MODELS.EXPERT, expertPrompt, normalized, 12000, {
                        temperature: 0.6,
                        maxOutputTokens: 520,
                    });
                } else {
                    // Either not substantive or cooldown active → Flash
                    const flashPrompt = buildFlashPrompt(locale, false, shouldNudgeMohamed);
                    response = await callGemini(env, MODELS.FLASH, flashPrompt, normalized, 6000, {
                        temperature: 0.65,
                        maxOutputTokens: 320,
                    });
                    response = clampFlashResponse(response);  // Use improved defaults
                    mode = "flash";
                }
                nextAwaitingProbe = false;
            }
            // ===== CONSULT REQUEST
            else if (wantsConsult(userText) || (consultOffered && isAffirmative(userText))) {
                const probePrompt = buildProbePrompt(locale);
                response = await callGemini(env, MODELS.FLASH, probePrompt, normalized, 6000, {
                    temperature: 0.6,
                    maxOutputTokens: 280,
                });
                response = clampFlashResponse(response);  // Use improved defaults
                mode = "flash";
                nextAwaitingProbe = true;
                nextConsultOffered = true;
            }
            // ===== FLASH (default) with FAILOVER
            else {
                const flashPrompt = buildFlashPrompt(locale, messages.length === 1, shouldNudgeMohamed);
                try {
                    response = await callGemini(env, MODELS.FLASH, flashPrompt, normalized, 6000, {
                        temperature: 0.65,
                        maxOutputTokens: 320,
                    });
                } catch (flashError) {
                    console.warn("⚠️ Flash Failed, engaging Failover:", flashError);
                    try {
                        response = await callGemini(env, MODELS.FAILOVER, flashPrompt, normalized, 8000, {
                            temperature: 0.65,
                            maxOutputTokens: 380,
                        });
                    } catch {
                        throw new Error("ALL_MODELS_BUSY");
                    }
                }
                response = clampFlashResponse(response);  // Use improved defaults
            }

            // Strip internal token
            const offered = /<<OFFER_CONSULT>>/i.test(response || "");
            if (offered) {
                response = response.replace(/<<OFFER_CONSULT>>/gi, "").trim();
                nextConsultOffered = true;
            }

            const nextFlashSinceExpert = mode === "expert" ? 0 : flashCount + 1;
            const nextExpertUses = mode === "expert" ? expertUses + 1 : expertUses;

            return json(
                {
                    response,
                    meta: {
                        mode,
                        flash_since_expert: nextFlashSinceExpert,
                        expert_uses: nextExpertUses,
                        awaiting_probe: nextAwaitingProbe,
                        consult_offered: nextConsultOffered,
                    },
                },
                200,
                headers
            );
        } catch (err) {
            console.error("Worker Error:", err);

            const acceptLang = (req.headers.get("accept-language") || "").toLowerCase();
            const isAr = acceptLang.includes("ar");

            const errorMsg = isAr
                ? "فيه ضغط بسيط دلوقتي… جرّب تاني كمان لحظة."
                : "Slight traffic right now—try again in a moment.";

            return json({ error: "System Error", message: errorMsg }, 500, headers);
        }
    },
};
