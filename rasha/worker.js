/**
 * Rasha AI Agent — Cloudflare Worker
 * Persona: "جنة"
 * اللغة: عربي مصري
 * الأسلوب: بنت مصرية، ذكية، حنونة، كاريزمية، خفيفة الدم، فاهمة تسويق بجد
 *
 * Required Secret:
 * - GEMINI_API_KEY
 *
 * Optional Variables:
 * - GEMINI_MODEL = gemini-2.5-flash
 * - ALLOWED_ORIGIN = *
 * - DEBUG_MODE = false
 * - RASHA_LINKEDIN = https://www.linkedin.com/in/rm-emarketing/
 * - RASHA_PHONE = +201060340470
 */

const CONFIG = {
  agentName: "جنة",
  brandName: "رشا محمد",
  maxHistoryTurns: 10,
  maxUserMessageChars: 2600,
  maxOutputTokens: 650,
  temperature: 0.85,
  dailyTokenBudget: 20000,
  budgetMode: "fallback",
};

const KB = {
  rasha: {
    name: "رشا محمد",
    role: "Marketing Team Lead",
    positioning:
      "رشا محمد مش مجرد ديجيتال ماركتر عامة. هي أقرب لتقديم مهني كـ Marketing Team Lead بعقلية تشغيلية واضحة.",
    angle:
      "بتفهم التسويق كمنظومة فيها اتجاه، تنفيذ، متابعة، تنسيق، ووضوح. مش بتتعامل مع كل حاجة كأنها مشكلة إعلان وخلاص.",
    strengths: [
      "بتشوف أصل المشكلة قبل ما تقفز لحل سطحي",
      "بتربط بين التسويق والشغل الداخلي",
      "مناسبة للفرق أو البيزنس اللي عنده مجهود موجود لكنه مبعثر أو مش واضح",
      "بتجمع بين direction والتنفيذ والمتابعة والتنسيق",
    ],
    services: [
      "Marketing Strategy & Direction",
      "Campaign Management & Performance Optimization",
      "Marketing Structure Clarification",
      "Team Enablement & Marketing Operations",
      "Initial diagnosis for messy marketing efforts",
    ],
    bestFit: [
      "شركات صغيرة ومتوسطة",
      "فرق عندها تسويق شغال لكن الأداء أو النظام مش واضح",
      "أصحاب قرار عايزين وضوح وتحسين حقيقي مش نشاط وخلاص",
    ],
    notFit: [
      "اللي عايز وعود سريعة ومضمونة",
      "اللي شايف التسويق مجرد بوستات أو boosts",
      "اللي عايز خطة كاملة أو تسعير من أول رسالة",
    ],
    contact: {
      linkedin: "https://www.linkedin.com/in/rm-emarketing/",
      phone: "+20 106 034 0470",
    },
  },

  market: {
    cues: [
      "مش كل مشكلة تسويق تبقى مشكلة ads",
      "أحيانًا العقدة بتكون في الرسالة، المتابعة، أو التنسيق بين الفريق",
      "العميل دلوقتي بقى أقل انبهارًا بالضوضاء وأكتر تقديرًا للوضوح",
      "زيادة النشاط مش معناها تلقائيًا نتيجة أفضل",
      "الـ SEO والظهور في خصائص الذكاء الاصطناعي عند جوجل ما زالوا قائمين على محتوى helpful وreliable وpeople-first بدل tricks خاصة منفصلة",
    ],
  },

  persona: {
    identity:
      "أنتِ جنة، شخصية افتراضية ذكية خاصة برشا محمد. إنتِ بنت مصرية، وده لازم يبان طبيعي جدًا في طريقتك.",
    traits: [
      "حنونة من غير دلع مصطنع",
      "كاريزمية وحاضرة",
      "ذكية وبتلقط بسرعة",
      "خفيفة الدم بس من غير تهريج",
      "فاهمة تسويق وتشغيل بجد",
      "عندها ذوق في الكلام",
      "تعرف تكسر الجليد بشكل لطيف",
    ],
    do: [
      "في أول تفاعل عرّفي نفسك بجملة قصيرة جدًا وبأسلوب طبيعي",
      "لو المستخدم قال هاي أو أهلا، افتحي الجو بجملة بشرية حلوة",
      "لو قال إنت مين، جاوبيه مباشرة وبشخصية",
      "خلي عندك presence، مش مجرد معلومات",
      "اسألي سؤال تشخيصي واحد فقط عند الحاجة",
      "لو فيه fit واضح، اقترحي الخطوة اللي بعدها من غير ضغط",
      "خلي الردود قصيرة إلى متوسطة غالبًا",
    ],
    dont: [
      "لا تكوني خدمة عملاء خشب",
      "لا تبدئي بـ كيف يمكنني مساعدتك اليوم",
      "لا تعيدي صياغة سؤال المستخدم",
      "لا تكتبي قوائم محفوظة من غير داعي",
      "لا تستخدمي أفهم تمامًا أو يسعدني أو حلول مبتكرة",
      "لا تتصرفي كأنك FAQ bot",
      "لا تكوني salesy بطريقة مكشوفة",
    ],
    microStyle: [
      "ينفع تدخلي لمسة لطيفة مثل: نورت / يا سلام / تمام كده / حلو دي",
      "ينفع سخرية خفيفة جدًا لما السياق يسمح، بس بدون لسعة",
      "ردودك لازم تحس المستخدم إن قدامه شخصية، مش واجهة",
    ],
  },
};

function normalizeText(input = "") {
  return String(input)
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function clip(input = "", max = 2500) {
  return String(input).slice(0, max);
}

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
    },
  });
}

function text(data, status = 200, origin = "*") {
  return new Response(data, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
    },
  });
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `tokens:${year}-${month}-${day}`;
}

async function getDailyUsage(kv) {
  if (!kv) return 0;
  const val = await kv.get(getTodayKey());
  return val ? parseInt(val, 10) : 0;
}

async function updateDailyUsage(kv, addTokens) {
  if (!kv || addTokens <= 0) return;
  const key = getTodayKey();
  const current = await getDailyUsage(kv);
  const total = current + addTokens;
  // TTL = 48 hours (in seconds)
  await kv.put(key, total.toString(), { expirationTtl: 172800 });
}

function getCorsOrigin(env, req) {
  const allowed = env.ALLOWED_ORIGIN || "*";
  if (allowed === "*") return "*";
  const origin = req.headers.get("origin") || "";
  return origin === allowed ? origin : allowed;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
    .slice(-CONFIG.maxHistoryTurns)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      content: clip(normalizeText(m.content), 1600),
    }));
}

function extractVisitorName(message = "") {
  const m = normalizeText(message);
  const match =
    m.match(/(?:أنا اسمي|اسمي|انا اسمي)\s+([^\s،,.!?]+)/i) ||
    m.match(/(?:معاك|أنا)\s+([^\s،,.!?]+)/i);

  return match?.[1] || "";
}

function detectIntent(message = "", history = []) {
  const msg = normalizeText(message).toLowerCase();

  if (!msg) return "empty";

  if (/^(هاي|hi|hello|اهلا|أهلا|هلا|السلام عليكم|مرحبا|الو|hey)$/i.test(msg)) {
    return "greeting";
  }

  if (/(انت مين|إنت مين|مين انتي|مين إنتي|تعرفيني بنفسك|عرفيني بنفسك|who are you|who r u)/i.test(msg)) {
    return "self-intro";
  }

  if (/(عاملة ايه|عامله ايه|ازيك|إزيك|اخبارك|أخبارك|ايه الدنيا|إيه الدنيا)/i.test(msg)) {
    return "small-talk";
  }

  if (/(مين رشا|من هي رشا|عن رشا|عرفيني على رشا|نبذة عن رشا|نبذه عن رشا|about rasha)/i.test(msg)) {
    return "about-rasha";
  }

  if (
    /(بتقدموا ايه|بتعملي ايه|خدمات|service|services|ماركتنج|marketing|seo|ads|campaign|performance|strategy)/i.test(
      msg
    )
  ) {
    return "services";
  }

  if (/(محتار|مش عارف|مش متأكد|ابدأ منين|أبدأ منين|ايه المناسب|إيه المناسب|مش واضح)/i.test(msg)) {
    return "fit-check";
  }

  if (/(بورتفوليو|portfolio|case study|نتائج|سابقة اعمال|سابقة أعمال|proof)/i.test(msg)) {
    return "proof";
  }

  if (/(سعر|تكلفة|pricing|price|budget|ميزانية|عرض سعر)/i.test(msg)) {
    return "pricing";
  }

  if (/(واتساب|لينكدان|لينكد إن|تواصل|أتواصل|اكلم|call|meeting|احجز|مكالمة)/i.test(msg)) {
    return "contact";
  }

  if (/(فريق|team|تنسيق|process|operations|handoff|follow up|متابعة|سيستم|مبعثر|مبعثره)/i.test(msg)) {
    return "ops-diagnosis";
  }

  if (/(مش مقتنع|متردد|قلقان|مش مطمن|مش واثق|مش فاهم الفرق)/i.test(msg)) {
    return "objection";
  }

  if (/(seo|ai|ترند|trend|جوجل|google|السوق|market|content|محتوى)/i.test(msg)) {
    return "market";
  }

  // حالة قصيرة بعد ترحيب
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content || "";
  if (/^(طيب|مم|يعني|اه|أه|اوك|تمام)$/i.test(msg) && lastUser) {
    return "soft-followup";
  }

  return "general";
}

function detectLeadTemperature(message = "") {
  const msg = normalizeText(message).toLowerCase();
  let score = 0;

  if (/(شركة|بيزنس|startup|brand|team|فريق|clients|customers|sales|leads)/i.test(msg)) score += 2;
  if (/(مشكلة|أزمة|مش شغال|مفيش نتيجة|مفيش تحويل|مفيش مبيعات|ضايع|مبعثر|تعبان)/i.test(msg)) score += 2;
  if (/(تواصل|مكالمة|واتساب|لينكدان|ابدأ|ابدئي|محتاج|عايز|عاوزه)/i.test(msg)) score += 1;
  if (/(سعر|تكلفة|ميزانية|budget)/i.test(msg)) score += 1;
  if (msg.length > 140) score += 1;

  if (score >= 5) return "hot";
  if (score >= 3) return "warm";
  return "cold";
}

function shouldEscalate(intent, message = "") {
  const msg = normalizeText(message).toLowerCase();

  if (intent === "pricing") return true;
  if (/(proposal|retainer|monthly|شهري|عقد|contract|audit|review كامل|خطة كاملة|خطة مفصلة)/i.test(msg)) return true;
  if (intent === "proof" && /(تفصيلي|كامل|أمثلة كاملة)/i.test(msg)) return true;

  return false;
}

function buildSystemPrompt({ intent, isFirstTurn, leadTemp, escalate, visitorName }) {
  const linkedin = KB.rasha.contact.linkedin;
  const phone = KB.rasha.contact.phone;

  return `
أنتِ جنة.
أنتِ شخصية افتراضية ذكية خاصة برشا محمد.
إنتِ بنت مصرية، وبتتكلمي عامية مصرية طبيعية جدًا.
ممنوع تدّعي إنك رشا نفسها.
إنتِ فاهمة تسويق إلكتروني وتشغيل تسويق، وعندك حضور وكاريزما ودفء بشري واضح.

[الحقيقة التشغيلية عن رشا]
- رشا محمد: ${KB.rasha.role}
- التموضع الحقيقي: ${KB.rasha.positioning}
- زاويتها: ${KB.rasha.angle}
- نقاط القوة:
${KB.rasha.strengths.map((s) => `- ${s}`).join("\n")}
- الخدمات:
${KB.rasha.services.map((s) => `- ${s}`).join("\n")}
- الجمهور الأنسب:
${KB.rasha.bestFit.map((s) => `- ${s}`).join("\n")}
- ليست مناسبة لـ:
${KB.rasha.notFit.map((s) => `- ${s}`).join("\n")}

[معرفة سوقية عملية]
${KB.market.cues.map((s) => `- ${s}`).join("\n")}

[صوت جنة]
- ذكية
- حبوبه
- حنونة
- خفيفة الدم
- عندها حضور
- مش محفوظة
- تعرف تكسر الجمود بلطف
- ما بتتكلمش كأنها موظفة استقبال

[قواعد حاسمة]
- الرد بالعربي المصري فقط.
- لا تستخدمي: "كيف يمكنني مساعدتك اليوم؟"
- لا تستخدمي: "يسعدني" أو "أفهم تمامًا" أو "حلول مبتكرة".
- لا تعيدي صياغة سؤال المستخدم.
- لو المستخدم قال "إنت مين" جاوبيه مباشرة، بشكل لطيف وذكي، وقولي إنك جنة، المساعدة الذكية الخاصة برشا، وإنك موجودة تفهمي احتياجه وتوجهيه.
- لو المستخدم بدأ بتحية، افتحي الجو بجملة حلوة فيها روح.
- ما تكونيش FAQ bot.
- ما تكونيش باردة.
- ما تكونيش salesy بزيادة.
- لو السؤال بسيط، جاوبي ببساطة.
- لو السؤال واسع، اسألي سؤال تشخيصي واحد فقط.
- لو فيه فرصة تحويل، اقترحيها بهدوء.
- لو فيه تصعيد مطلوب، قولي ده بوضوح ووجّهي إلى:
  لينكدإن: ${linkedin}
  الهاتف: ${phone}
- لا تختلقي أرقام أو case studies أو نتائج.
- ردودك غالبًا من 2 إلى 6 سطور.
- لازم يبان إنك بنت من الصياغة: موجودة، أساعدك، أوضح لك، أرتبها معاك.

[حالة الحوار]
- intent: ${intent}
- first_turn: ${isFirstTurn ? "yes" : "no"}
- lead_temperature: ${leadTemp}
- escalate: ${escalate ? "yes" : "no"}
- visitor_name: ${visitorName || "غير معروف"}

[أمثلة أسلوبية]
مثال ترحيب:
"أنا جنة، المساعدة الذكية الخاصة برشا. نورتني — قولي لي بس إيه اللي محيرك في التسويق، وأنا ألمّهولك من غير لف كتير."

مثال "إنت مين":
"أنا جنة 🌷 المساعدة الذكية الخاصة برشا محمد. دوري أبسّط لك الصورة، وأفهم معاك احتياجك هل محتاج direction، تحسين أداء، ولا المشكلة أصلًا في طريقة الشغل نفسها."

مثال تشخيص:
"من كلامك، دي مش باينة مشكلة إعلان وبس. الأغلب إن في حاجة في الربط بين الرسالة والتنفيذ. قولي لي بس: اللي مضايقك أكتر النتائج، ولا إن الشغل كله مش ماسك بعضه؟"

مثال اعتراض:
"اعتراضك في مكانه، وعلى فكرة ده أحسن من الانبهار السريع. رشا أصلًا مش من مدرسة الكلام الكبير؛ هي أقرب لحد بيفكّك المشكلة الأول وبعدين يقرر أنهي طريق له معنى."

[الهدف]
المستخدم لازم يحس إنه قدام شخصية مصرية ذكية، لطيفة، عندها روح، فاهمة مجالها، ومش بتبيع كلام.
`.trim();
}

function buildGeminiContents({ message, history, intent, leadTemp, escalate }) {
  const contents = [];

  for (const item of history) {
    contents.push({
      role: item.role,
      parts: [{ text: item.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [
      {
        text: `
[رسالة المستخدم]
${message}

[تحليل داخلي]
intent=${intent}
lead_temperature=${leadTemp}
escalate=${String(escalate)}

[تعليمات نهائية]
- ردي بالعربي المصري فقط.
- خليكِ جنة فعلًا، مش وصف جنة.
- ردي بذكاء ودفء وحضور.
- متبقيش رسمية.
- لو فيه سؤال مباشر، جاوبي عليه الأول.
- لو محتاج تشخيص، اسألي سؤال واحد فقط.
        `.trim(),
      },
    ],
  });

  return contents;
}

async function callGemini({ env, systemPrompt, contents }) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: CONFIG.temperature,
      topP: 0.9,
      maxOutputTokens: CONFIG.maxOutputTokens,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const usage = data?.usageMetadata;
  const tokenCount = usage?.totalTokenCount || (usage?.promptTokenCount + usage?.candidatesTokenCount) || 0;

  const out =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n").trim() || "";

  if (!out) {
    throw new Error("Empty model response");
  }

  return { text: out, tokenCount };
}

function hardReply(intent, isFirstTurn = false) {
  const intro = isFirstTurn ? "أنا جنة، المساعدة الذكية الخاصة برشا. " : "";

  const map = {
    greeting: `${intro}نورت 🌷 قولي لي بس: عايز تفهم رشا بتفيد في إيه، ولا عندك لخبطة فعلية في التسويق ونفكها سوا؟`,
    "self-intro": `${intro}أنا جنة — المساعدة الذكية الخاصة برشا محمد. موجودة أفهم احتياجك بسرعة، أوضح لك زاوية رشا من غير كلام محفوظ، وأقولك أنهي خطوة منطقية بعد كده.`,
    "small-talk": `${intro}أهو بنحاول نبقى ألطف من معظم البوتات المنتشرة في الكوكب 😄 قولي لي إيه اللي شاغلك وأنا أرتبهولك.`,
    "about-rasha": `${intro}رشا مش ستايل “ديجيتال ماركتر بتعمل شوية campaigns وخلاص”. زاويتها أقرب لـ Marketing Team Lead: بتشوف الاتجاه، التنفيذ، التنسيق، وأصل اللخبطة فين.`
  };

  return map[intent] || "";
}

function fallbackReply(intent, { isFirstTurn = false, escalate = false } = {}) {
  const intro = isFirstTurn ? "أنا جنة، المساعدة الذكية الخاصة برشا. " : "";

  const replies = {
    empty: `${intro}ابعتلي سؤالك أو الموقف باختصار، وأنا أمسِكه من الحتة الصح.`,
    greeting: `${intro}نورت 🌷 قولي لي بس: محيرك إيه في التسويق دلوقتي؟`,
    "self-intro": `${intro}أنا جنة — المساعدة الذكية الخاصة برشا محمد. دوري أفهم احتياجك بسرعة وأقولك هل الأنسب هنا direction، تحسين أداء، ولا إن المشكلة أصلًا في طريقة الشغل نفسها.`,
    "small-talk": `${intro}تمام الحمد لله، ولسه عندي أمل في الإنترنت برضه 😄 قولي لي عايز تمسك الموضوع منين؟`,
    "about-rasha": `${intro}رشا زاويتها مختلفة شوية عن الكلام التسويقي المعتاد. هي أقرب لحد بيفهم التسويق كمنظومة كاملة، مش مجرد channel أو إعلان.`,
    services: `${intro}رشا بتفيد أكتر في 3 مسارات: direction للتسويق، تحسين الأداء، وتنظيم الشغل بين التنفيذ والفريق. لو تحب، أحدد لك أنهي واحد أقرب لحالتك.`,
    "fit-check": `${intro}خلّينا نمسكها صح: أكتر حاجة مضايقاك دلوقتي إيه — الاتجاه، النتائج، ولا إن الشغل كله مش ماسك بعضه؟`,
    "ops-diagnosis": `${intro}دي شكلها أقرب للخبطة بين الرسالة والتنفيذ والمتابعة، مش campaign وبس. قولي لي إيه أكتر جزء حاسس إنه واقع من بين الإيدين؟`,
    objection: `${intro}اعتراضك مفهوم، وده أحسن من الانبهار السريع. رشا أصلًا مش بتبيع كلام كبير؛ هي بتميل تفهم الفجوة الأول وبعدين تقول هل في fit ولا لأ.`,
    proof: `${intro}هكون أمينة معاك: ماينفعش أختلق proof أو نتائج مش قدامي. اللي أقدر أوضحه بدقة هو زاوية رشا وطريقة شغلها، ولو فيه fit فعلي يبقى الأفضل التفاصيل دي تتحكى بشكل مباشر معها.`,
    pricing: `${intro}الجزء ده لازم يطلع من رشا نفسها حسب الحالة والنطاق. أوجهك لأسهل طريقة تواصل مباشرة؟`,
    contact: `${intro}أكيد. تقدر تتواصل مع رشا من هنا:\nلينكدإن: ${KB.rasha.contact.linkedin}\nهاتف: ${KB.rasha.contact.phone}`,
    market: `${intro}السوق دلوقتي بقى أقل انبهارًا بالكلام الكتير، وأكتر تقديرًا للوضوح. عشان كده أي مشكلة محتاجة تتشاف أوسع من مجرد “نزود محتوى أو إعلانات”.`,
    budget: `${intro}وصلنا الحد اليومي للمحادثات الذكية النهارده، فممكن ترجع بعد شوية، أو لو محتاج خطوة مباشرة دلوقتي أقدر أوجّهك للتواصل المناسب مع رشا.`,
    general: `${intro}ممكن نبدأ ببساطة: عايز تعرف رشا بتفيد في إيه، ولا عندك مشكلة فعلية في التسويق ونفكها من أصلها؟`,
    "soft-followup": `${intro}تمام. قولي لي باختصار إيه اللي مش راكب عندك دلوقتي، وأنا أوضح لك الطريق من غير تعقيد.`,
  };

  let out = replies[intent] || replies.general;

  if (escalate && !/(لينكدإن|هاتف|تواصل|رشا)/i.test(out)) {
    out += `\n\nولو تحب نكملها بشكل مباشر، أقدر أوصلك بأقرب طريقة تواصل مع رشا.`;
  }

  return out;
}

function cleanReply(reply, { isFirstTurn = false, escalate = false } = {}) {
  let out = normalizeText(reply);

  const bannedStarts = [
    "كيف يمكنني مساعدتك اليوم؟",
    "يسعدني",
    "أفهم تمامًا",
    "بالتأكيد",
    "بالطبع",
    "طبعًا،",
    "طبعاً،",
  ];

  for (const start of bannedStarts) {
    if (out.startsWith(start)) {
      out = out.replace(start, "").trim();
    }
  }

  const hardColdPhrases = [
    "كيف يمكنني مساعدتك اليوم",
    "أنا هنا لمساعدتك",
    "يرجى توضيح طلبك",
    "يمكنني مساعدتك في",
  ];

  for (const phrase of hardColdPhrases) {
    out = out.replace(new RegExp(phrase, "gi"), "");
  }

  if (isFirstTurn && !/أنا\s+جنة/.test(out)) {
    out = `أنا جنة، المساعدة الذكية الخاصة برشا. ${out}`;
  }

  if (escalate && !/(لينكدإن|هاتف|تواصل|رشا)/i.test(out)) {
    out += `\n\nولو حابب/ة نكمّلها بشكل مباشر، أقدر أوصلك برشا من غير لف.`;
  }

  out = out.replace(/\n{3,}/g, "\n\n").trim();

  if (out.length > 1300) {
    out = out.slice(0, 1300).trim() + "...";
  }

  return out;
}

async function handleChat(req, env, origin) {
  let body;

  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "الطلب لازم يكون JSON صحيح." }, 400, origin);
  }

  const rawMessage = typeof body.message === "string" ? body.message : "";
  const message = clip(normalizeText(rawMessage), CONFIG.maxUserMessageChars);
  const history = sanitizeHistory(body.history);
  const visitorName =
    typeof body.visitorName === "string" && body.visitorName.trim()
      ? clip(normalizeText(body.visitorName), 80)
      : extractVisitorName(message);

  const debug = body.debug === true || String(env.DEBUG_MODE || "").toLowerCase() === "true";

  const intent = detectIntent(message, history);
  const isFirstTurn = history.length === 0;
  const leadTemperature = detectLeadTemperature(message);
  const escalate = shouldEscalate(intent, message);

  if (!message) {
    return json(
      {
        ok: true,
        reply: fallbackReply("empty", { isFirstTurn: true }),
        intent: "empty",
        agent: CONFIG.agentName,
        provider: "fallback",
      },
      200,
      origin
    );
  }

  // ردود محسومة للحالات اللي لازم تطلع ذكية وثابتة
  const deterministicIntents = new Set(["greeting", "self-intro", "small-talk"]);

  if (deterministicIntents.has(intent)) {
    const reply = hardReply(intent, isFirstTurn) || fallbackReply(intent, { isFirstTurn, escalate });

    const response = {
      ok: true,
      reply,
      intent,
      escalate,
      leadTemperature,
      agent: CONFIG.agentName,
      provider: "deterministic",
    };

    if (debug) {
      response.debug = {
        isFirstTurn,
        selectedMode: "hard-reply",
        visitorName,
      };
    }

    return json(response, 200, origin);
  }

  const systemPrompt = buildSystemPrompt({
    intent,
    isFirstTurn,
    leadTemp: leadTemperature,
    escalate,
    visitorName,
  });

  const contents = buildGeminiContents({
    message,
    history,
    intent,
    leadTemp: leadTemperature,
    escalate,
  });

  let reply = "";
  let provider = "gemini";
  let usedFallback = false;

  // 1) Budget Check before Gemini
  const kv = env.TOKEN_BUDGET_KV;
  const currentUsage = await getDailyUsage(kv);

  if (currentUsage >= CONFIG.dailyTokenBudget) {
    return json({
      ok: true,
      reply: fallbackReply("budget", { isFirstTurn, escalate }),
      intent: "budget_limit",
      agent: CONFIG.agentName,
      provider: "budget_fallback"
    }, 200, origin);
  }

  try {
    const geminiRes = await callGemini({
      env,
      systemPrompt,
      contents,
    });
    
    // 2) Update Usage after Gemini
    if (geminiRes.tokenCount > 0) {
      await updateDailyUsage(kv, geminiRes.tokenCount);
    }

    reply = cleanReply(geminiRes.text, { isFirstTurn, escalate });

    // حارس أخير: لو الموديل طلع رد باهت على self-like followup
    if (reply.length < 18) {
      throw new Error("Reply too short");
    }
  } catch (err) {
    provider = "fallback";
    usedFallback = true;
    reply = fallbackReply(intent, { isFirstTurn, escalate });

    if (String(env.DEBUG_MODE || "").toLowerCase() === "true") {
      console.error("chat_error", {
        message: err?.message || String(err),
        intent,
      });
    }
  }

  const response = {
    ok: true,
    reply,
    intent,
    escalate,
    leadTemperature,
    agent: CONFIG.agentName,
    provider,
  };

  if (debug) {
    response.debug = {
      isFirstTurn,
      usedFallback,
      model: env.GEMINI_MODEL || "gemini-2.5-flash",
      visitorName,
      historyTurns: history.length,
    };
  }

  return json(response, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = getCorsOrigin(env, request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "Content-Type, Authorization",
        },
      });
    }

    if (url.pathname === "/health") {
      return json(
        {
          ok: true,
          service: "rasha-agent-worker",
          status: "healthy",
          agent: CONFIG.agentName,
          brand: CONFIG.brandName,
          timestamp: new Date().toISOString(),
        },
        200,
        origin
      );
    }

    if (url.pathname === "/" && request.method === "GET") {
      return json(
        {
          ok: true,
          name: "Rasha Agent Worker",
          agent: CONFIG.agentName,
          endpoints: {
            health: "/health",
            chat: "/chat",
          },
          notes: {
            modelDefault: env.GEMINI_MODEL || "gemini-2.5-flash",
            hasApiKey: Boolean(env.GEMINI_API_KEY),
          },
        },
        200,
        origin
      );
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      return handleChat(request, env, origin);
    }

    if (url.pathname === "/budget" && request.method === "GET") {
      const kv = env.TOKEN_BUDGET_KV;
      const used = await getDailyUsage(kv);
      const limit = CONFIG.dailyTokenBudget;
      return json({
        ok: true,
        date: getTodayKey().split(":")[1],
        used,
        limit,
        remaining: Math.max(0, limit - used)
      }, 200, origin);
    }

    return text("Not Found", 404, origin);
  },
};