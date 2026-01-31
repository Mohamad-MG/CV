/**
 * Jimmy AI Worker v2.8.0 – Enhanced Dual-Track + Personality Engine
 * ==================================================================
 * Flash owns the conversation with personality awareness.
 * Expert is surgical: consult → probe → execute.
 * Contact requests = instant, zero friction.
 * Zero token waste. Maximum conversion intelligence.
 */

/* =========================================================
  CONFIG
========================================================= */
const WORKER_VERSION = "2.8.0";

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

التعامل مع طلبات التواصل:
- لو قال "عايز أكلم محمد" أو "How to contact" → فوراً اعرض:
  📞 واتساب: +201555141282
  💼 لينكد إن: linkedin.com/in/mohamadgamal
- ممنوع تأخير أو مقاومة طلب التواصل.
- ممنوع تقول "خلينا نكمل أول" أو "قبل ما نتواصل".
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

  // Gulf countries
  if (/(SA|AE|KW|QA|BH|OM)/.test(country)) return "gulf";
  
  // Accept-Language header checks
  if (acceptLang.includes("ar-sa") || acceptLang.includes("ar-ae") || acceptLang.includes("ar-kw")) return "gulf";
  
  // Generic Arabic from Gulf (fallback)
  if (/(SA|AE|KW|QA|BH|OM)/.test(country) && acceptLang.startsWith("ar")) return "gulf";
  
  // English
  if (acceptLang.startsWith("en") && !acceptLang.includes("ar")) return "en";
  
  // Default Egyptian
  return "eg";
}

function clampFlashResponse(text, maxChars = 520, maxLines = 2) {
  if (!text) return text;
  let out = String(text).trim();

  // Remove accidental meta/system artifacts
  out = out.replace(/\b(As an AI|AI model|system prompt|prompt|model)\b/gi, "");

  // Clamp by lines
  const lines = out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > maxLines) out = lines.slice(0, maxLines).join("\n").trim();

  // Clamp by chars
  if (out.length > maxChars) {
    out = out.slice(0, maxChars).trim();
    if (!/[.!؟…]$/.test(out)) out += "؟";
  }

  return out;
}

function lastUserText(messages = []) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return String(messages[i]?.content || "").trim();
  }
  return "";
}

function wantsConsult(text = "") {
  const t = text.toLowerCase();
  return /استشار|استشاره|استشارة|محتاج رأيك|عايز رأيك|عايز مساعده|عايز مساعدة|تحليل|استراتيجي|خطة|تقييم|تشخيص|consult|advice|strategy|analy|audit|review|help me/i.test(t);
}

function wantsContact(text = "") {
  const t = text.toLowerCase();
  return /عايز أكلم|ابغى اتواصل|كيف أتواصل|أتكلم مع محمد|contact mohamed|talk to mohamed|reach mohamed|get in touch/i.test(t);
}

function isAffirmative(text = "") {
  const t = text.toLowerCase().trim();
  return /^(yes|yeah|yep|ok|okay|sure|go on|go ahead|proceed|تمام|ماشي|ايوه|أيوه|ايوا|اه|تمام كده|كمل|طيب)$/i.test(t);
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

  const nudge = nudgeMohamed
    ? "لو لسه محتاج عمق أعلى، اقترح بلطافة إنه يتواصل مع محمد مباشرة: واتساب +201555141282 أو LinkedIn."
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
    maxOutputTokens: 220,
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

      // ===== CONTACT REQUEST (Highest Priority)
      if (wantsContact(userText)) {
        const contactMsg = locale === "en"
          ? "Perfect! Here's how to reach Mohamed:\n📞 WhatsApp: +201555141282\n💼 LinkedIn: linkedin.com/in/mohamadgamal"
          : "تمام! تقدر تتواصل مع محمد من هنا:\n📞 واتساب: +201555141282\n💼 لينكد إن: linkedin.com/in/mohamadgamal";
        
        return json(
          {
            response: contactMsg,
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
      if (awaitingProbe) {
        if (canUpgrade) {
          mode = "expert";
          const expertPrompt = buildExpertPrompt(locale);
          response = await callGemini(env, MODELS.EXPERT, expertPrompt, normalized, 12000, {
            temperature: 0.6,
            maxOutputTokens: 520,
          });
        } else {
          const flashPrompt = buildFlashPrompt(locale, false, shouldNudgeMohamed);
          response = await callGemini(env, MODELS.FLASH, flashPrompt, normalized, 6000, {
            temperature: 0.65,
            maxOutputTokens: 240,
          });
          response = clampFlashResponse(response, 520, 2);
          mode = "flash";
        }
        nextAwaitingProbe = false;
      } 
      // ===== CONSULT REQUEST
      else if (wantsConsult(userText) || (consultOffered && isAffirmative(userText))) {
        const probePrompt = buildProbePrompt(locale);
        response = await callGemini(env, MODELS.FLASH, probePrompt, normalized, 6000, {
          temperature: 0.6,
          maxOutputTokens: 200,
        });
        response = clampFlashResponse(response, 520, 2);
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
            maxOutputTokens: 220,
          });
        } catch (flashError) {
          console.warn("⚠️ Flash Failed, engaging Failover:", flashError);
          try {
            response = await callGemini(env, MODELS.FAILOVER, flashPrompt, normalized, 8000, {
              temperature: 0.65,
              maxOutputTokens: 260,
            });
          } catch {
            throw new Error("ALL_MODELS_BUSY");
          }
        }
        response = clampFlashResponse(response, 520, 2);
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
