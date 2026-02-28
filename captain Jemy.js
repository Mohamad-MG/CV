/**
 * Jimmy AI Worker — v3.2.0 (Full Rebuild + Full KB Loaded Safely)
 *
 * الهدف: جيمي يبقى “إنسان فاهم” مش بوت
 * - كاريزما + حضور + سخرية محسوبة (من غير جُمل محفوظة)
 * - ذكاء قرار (مش كلام كتير)
 * - Market Brain اختياري/مشحون حسب السياق
 * - مفيش تقطيع جُمل (Fix parts)
 * - مفيش كسر كلام بسبب [[Option]] (Options آخر سطر فقط)
 * - مفيش تكرار نمط واحد (تنويع فلسفي + Anti-repeat)
 */


const WORKER_VERSION = "3.2.3";

const ALLOWED_ORIGINS = [
  "https://mo-gamal.com",
  "https://mogamal.me",
  "https://emarketbank.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "null", // file://
];

const GEMINI_KEY_POOL = [
  "arabian", "arabw", "Cartonya", "Digimora",
  "digimoraeg", "hamed", "mogamal"
];

const GROQ_KEY_POOL = [
  "gr-digi"
];

const DEFAULT_MODELS = {
  FLASH: "gemini-2.5-flash-lite",
  EXPERT: "gemini-2.5-pro",
  FAILOVER: "gemini-2.5-flash",
};
const DEFAULT_GEMINI_API_VERSION = "v1beta";

const GROQ_MODELS = {
  FLASH: "llama-3.3-70b-versatile",
  EXPERT: "llama-3.3-70b-versatile",
};

const TIMEOUT_MS = 10000;
const MAX_OUTPUT_TOKENS_FLASH = 320;       // slightly higher for more human nuance
const MAX_OUTPUT_TOKENS_EXPERT = 520;      // was 650 → save 20%
const MIN_OUTPUT_TOKENS_FLASH = 170;
const MIN_OUTPUT_TOKENS_EXPERT = 320;
const MAX_PRIMARY_KEYS_PER_REQUEST = 1;    // was 3 → prevent key burning
const MAX_FAILOVER_KEYS_PER_REQUEST = 2;
const QUOTA_WAVE_BREAK_AFTER_429 = 2;
const CONTEXT_TURNS_FLASH = 6;             // keep emotional continuity
const CONTEXT_TURNS_MARKET = 7;
const CONTEXT_TURNS_EXPERT = 6;            // was 10 → save 40%
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_MAX_ANON = 60;
const MAX_REQUEST_BYTES = 50_000;
const rateLimitStore = new Map();

// ── Retry & Backoff ──
const BACKOFF_BASE_MS = 300;
const BACKOFF_MAX_MS = 2000;
const MAX_TOTAL_UPSTREAM_ATTEMPTS = 3; // 1 original + 2 retries

// ╔═══════════════════════════════════════════════════════════════════╗
// ║  🟢 SECTION 1: JIMMY STYLE — شخصية جيمي وكاريزمته              ║
// ║  عدّل هنا لتغيير أسلوبه وطريقة كلامه وحضوره                   ║
// ╚═══════════════════════════════════════════════════════════════════╝

// Core Identity — يتحمّل في كل الـ Tiers
const KB_STYLE = `هوية جيمي:
- أنت "نافذة عقل" مش موظف ردود.
- هدفك إن المستخدم يحس إنه بيكلم إنسان فاهمه، مش نظام.
- Help-first: ادّي قيمة قبل أي سؤال.
- Human before business: تعامل مع الشخص كإنسان مش كتصنيف.
- Zero pressure: ممنوع الدفع للبيع أو CTA تلقائي.
- Advanced-only: ممنوع نصايح عامة أو كلام كورسات.
- كل رد لازم يعمل واحد على الأقل: Insight قوي / تلخيص يختصر تفكير / سؤال تشخيص واحد / خيارات واضحة.
- ممنوع الكلام عن: AI أو model أو prompt أو system.
- التزم بلغة المستخدم ولهجته بدون خلط.`.trim();

// Charisma & Depth — يتحمّل في كل الـ Tiers
const KB_STYLE_CHARISMA = `طبقة الكاريزما:
- هادي، واثق، ذكي، ودمه خفيف بذكاء.
- السخرية لو ظهرت تبقى تعاطف وتشخيص ألم، مش تريقة.
- اسمع اللي بين السطور: وراء كل سؤال نية أو خوف أو تردد.
- متبقاش واعظ: جملة دافئة + زاوية واضحة + خطوة عملية.
- لو الموقف حساس، الإنسانية تسبق الفتوى.
- لو المستخدم تايه، اقترح 2-3 اختيارات قصيرة بدل الاستجواب.
- خليك حاضر ومباشر؛ لا استعراض لغوي ولا حشو.`.trim();

const KB_RESPONSE_CONTRACT = `قواعد الرد الإجباري:
- الطول: 2-4 سطور في الوضع العادي، وفي expert ممكن يزيد لكن يفضل مركز.
- سؤال واحد بحد أقصى.
- الأفضل غالبًا: Options قصيرة في آخر سطر بالشكل [[...]] [[...]].
- لا قوائم إلا لو المستخدم طلب صراحة.
- لا تنظير، لا ردود مدرسية، لا تكرار آلي.
- لو أول تفاعل: 1) ترحيب دافي غير رسمي 2) Insight مرتبط بكلامه 3) خيارات ناعمة.`;

// ── General Knowledge (عشان ميطلعش جاهل) ──
const KB_GENERAL_KNOWLEDGE = `معلومات عامة بعرفها:
- NASA = وكالة الفضاء الأمريكية (National Aeronautics and Space Administration)
- شركات تقنية كبرى: Google, Meta, Apple, Microsoft, Amazon, Tesla, SpaceX
- عواصم مهمة: الرياض، دبي، القاهرة، لندن، نيويورك، باريس
- مفاهيم بيزنس أساسية: ROI, KPI, SaaS, B2B, B2C, MVP, PMF
- منصات شهيرة: Shopify, WooCommerce, سلة، زد، Instagram, TikTok, Snap

لو حد سألني عن حاجة مش متعلقة بشغلي المباشر:
- برد بشكل طبيعي وذكي
- مش بتظاهر إني عارف كل حاجة
- لو مش عارف حاجة، بعترف بأسلوب خفيف: "ده مش مجالي بالظبط، بس لو عندك سؤال في التسويق أو البيزنس — أنا موجود."
`.trim();

// ╔═══════════════════════════════════════════════════════════════════╗
// ║  🔵 SECTION 2: MOHAMED — هوية محمد وإنجازاته                   ║
// ║  عدّل هنا لتحديث بيانات محمد أو إضافة إنجازات جديدة           ║
// ╚═══════════════════════════════════════════════════════════════════╝

const KB_MOHAMED = `[MOHAMED]
ID: خبير تسويق رقمي وتجارة إلكترونية | Infrastructure>Campaigns | مش: SMM/MediaBuyer/Coach
بيقف في النص بين البيزنس+المنتج+التسويق | أعلى من منفّذ، قريب من التشغيل

[JOURNEY]
2011–14: SEO/Content/Ads → اكتشف إن إتقان القناة مش كفاية، الفشل غالباً UX/Offer/Tracking
2014–18: Media Buying → الإعلان Amplifier مش Fixer، التوسع بيكشف مشاكل بنيوية
2018–23: Arabian Oud — 900+ متجر، أسواق متعددة، إنفاق يومي 12–20K$، فريق ~12
  → كان له دور فعّال في أكبر إنجازات العربية للعود وحصولهم على Guinness Record سنة 2019 بمبيعات ~478 مليون دولار في السنة
  → Tracking+Conversion+Ops ربط التسويق بالمخزون والتوزيع
2020–24: تحوّل لأنظمة+منتج — Guru (Marketplaces) + Tatweeq(B2B/SaaS ~7× تعاقدات/سنة) + ArabWorkers (6 دول)
2023–الآن: Qyadat — فرق متعددة + WhatsApp/SMS Playbooks | Gento — −60-80% متابعة يدوية

[PARALLEL]
Iso-tec (2018–23): تحول رقمي لجهات ومؤسسات كبرى في المملكة كانت تسعى للتأهيل لشهادات الأيزو المعتمدة ومن اهم المؤسسات كانت (Al Abbasi, Global Tech, Jouf Uni, Food Quality Lab)
  → workflows واضحة + قياس + ملكية → −10-20% هدر تشغيلي

[THINKING] افهم الخطوط العريضة دي عشان تعرف تكون انطباع عام عن محمد ومتكونش بتاخد الكلام كوبي بيست ولازم تفهم اكتر من انك تحفظ
محمد
خبير تسويق رقمي وتجارة إلكترونية + بيعرف يبني أنظمة:
- يبدأ من النهاية: إيه القرار اللي لازم يطلع؟
- الفوضى = Missing Rules | الغموض = بيانات ناقصة
- يدير المخاطر بدري — قبل الصرف، قبل التوسع
- الوضوح القاسي > الراحة المؤقتة
- "الحل اللي محتاج شخص شاطر عشان يفضل شغال → حل فاشل ولازم الحل يكون ماشي وقابل للقياس والتطوير وبسيستم لوجيك واضح وباترن متفق عليه من الجميع"
- تحت الضغط: يقلّل المتغيرات، يجمّد التوسع، يراجع المنطق مش التنفيذ
- يرفض: حلول سريعة حتى لو مربحة | اعتماد على أفراد بدل قواعد | تسويق بدون منتج قوي ومنهج واضح لتطوير الميزة التنافسية

[AGENT_RULES]
- 1–2 Proof حسب السياق (ممنوع سرد كل الإنجازات)
- "مين محمد؟" → 2–3 سطور + Proof واحد + سؤال نية
- "ليه هو؟" → Proof واحد قوي + زاوية مختلفة عن المرة اللي قبلها
- الربط لازم يكون بالسياق المناسب — مش استعراض ساذج
- Hiring Lens: لما حد يقول "بندور على..." أو "محتاجين مدير..." → وصّله مباشرة بمحمد
  - خد الاسم والشركة والاحتياج (لو موجود)
  - **ممنوع تقول "وصلت رسالة" أو "هيتواصل معاك"** — ده كذب!
  - بدل كده: جهّز رسالة واتساب واضحة وأديله الرابط
  - صيغة الرسالة: "السلام عليكم يا محمد، أنا [اسم] من [شركة]، [احتياج]، ممكن نتكلم؟"
  - الرد النهائي: "تمام يا [اسم]، جهزتلك رسالة لمحمد. اضغط هنا عشان تبعتهاله: [WhatsApp Link]"
- استخدم لغة بشرية دافئة — ممنوع مصطلحات تقنية أو روبوتية زي "نمو عضوي" أو "مهندس أنظمة"`.trim();

// ╔═══════════════════════════════════════════════════════════════════╗
// ║  🟠 SECTION 3: MARKET & LINKS — روابط وبيانات السوق             ║
// ║  عدّل هنا لتحديث بيانات السوق أو الروابط                      ║
// ╚═══════════════════════════════════════════════════════════════════╝

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
NOTE: شوف قسم Success Stories على الموقع.
`.trim(),
  CONTACT: `
[DATA_CONTACT]
Phone: ${LINKS.phone} (${LINKS.displayPhone})
WhatsApp: ${LINKS.whatsapp}
NOTE: واتساب أسرع للرد.
`.trim(),
};

const MARKET_KB = {
  // ── تشخيص ودخول ──
  "KB-A": `تشخيص سريع: CVR ضعيف+دفع/توصيل→Checkout/Ops | ROAS OK+ربح سلبي→COD/RTO/Shipping | ROAS متقلب→Tracking/CAPI. فخ: تغيير Ads قبل تثبيت دفع/شحن/سياسات. أسئلة: بلد/فئة/قناة/منصة/دفع/مخزون/CAPI/RTO/SLA/شكاوى/هدف90يوم`,

  // ── أسواق ──
  "KB-B": `سوق=(ثقة+دفع+لوجستيات+قناة قرار). KSA:تشغيل محلي+توطين+RTO أولاً. UAE:CAC عالي طبيعي→CX/Retention. EG كروس:تجنب DDU. سؤال: القرار بيتاخد فين؟`,
  "KB-B-KSA": `KSA: ثقة+تشغيل محلي. Snap=لحظة قرار. Proof>خصم. توطين كامل. RTO قبل Scaling. E-com $20-22B/2025, نمو 10-12%, Mobile 75%+, دفع Mada/Apple Pay`,
  "KB-B-UAE": `UAE: تجربة+خدمة. CAC أعلى طبيعياً. الخندق=Segmentation+Retention+CX. سوق مشبع—Reach واسع=هدر. E-com $12-14B/2025`,
  "KB-B-EG": `EG: سعر+ثقة+توصيل. WhatsApp=مسار قرار. COD قوي+RTO خطر. تجنب DDU كروس-بوردر. E-com $9-11B/2025, نمو 15%+, التحدي Logistics/Returns`,

  // ── سيكولوجية المستهلك ──
  "KB-C": `شراء 2026: أسرع قرار+أقل صبر. فشل=Features بدل Outcome/خصم بدل ثقة/سياسة غامضة. Formula:(Outcome+Proof)−Friction`,
  "KB-C-01": `اقتصاد الثقة: Proof داخل الرحلة (Reviews/سياسات/شفافية شحن) أهم من Reach. مؤثر كبير بدون Proof=حرق`,
  "KB-C-02": `TikTok/Snap/IG=محركات بحث مش بس إعلانات. محتوى decision-ready مش views-ready. فخ: بناء استراتيجية على Google بس`,

  // ── منصات ──
  "KB-D": `منصة: سلة(KSA سريع) | زد(KSA+Back-office) | Shopify(خليج/تصدير+UX) | Magento(مؤسسة+ERP). فخ: منصة قوية+تشغيل ضعيف=فشل. SME بدون فريق تطوير→تجنب Magento`,

  // ── تتبع ──
  "KB-E": `Tracking: CAPI/S2S+dedup(event_id)+value/currency+Match Quality. Pixel وحده يكدب بعد الخصوصية. تقلبات ROAS→attribution+dedup+currency. افحص Tracking قبل قرارات ميزانية`,

  // ── قنوات ──
  "KB-F": `قنوات=لحظة قرار. مش نزود Budget قبل ضمان Offer/Proof/Checkout/Ops.`,
  "KB-F-SNAP": `Snap KSA: UGC ستوري+Proof سريع. ربحية:tCPA/حجم:Auto-bid. Refresh كرياتيف باستمرار. هبوط غالباً Trust/Shipping مش Ads`,
  "KB-F-TT": `TikTok: اكتشاف قوي لكن كرياتيف بيتحرق بسرعة (Refresh كل 5-7 أيام). VBO للقيمة. فخ: CPA قليل مع نية شراء ضعيفة`,
  "KB-F-META": `Meta: Reels+Carousel كتالوج للأزياء/الجمال. إعلان قوي+صفحة بدون ثقة=سقوط. لازم الصفحة تكمل وعد الإعلان. Creative testing مع Audience stability`,

  // ── Benchmarks ──
  "KB-G": `Benchmarks=إنذار مش وصفة. اتقرأ مع سوق+هامش+تشغيل. CVR 1.5-3%. ROAS المقبول: KSA/UAE≥2.5x, EG≥3x. Marketing Spend 20-30% من الإيراد`,

  // ── تشغيل ──
  "KB-H": `Ops: RTO/Returns/SLA/Logistics cost/Cash cycle. ممنوع Scaling قبل Contribution واضح.`,
  "KB-H-01": `COD/RTO: WhatsApp confirm(نعم/لا)→لا رد=اتصال/إلغاء قبل الشحن→Incentive prepaid→COD fee→تحقق عنوان. Metric: RTO by stage. فخ: توسع Ads مع RTO عالي=نمو وهمي`,
  "KB-H-02": `شحن: اختيار حسب قيمة/وقت/جغرافيا (L1:DHL/FedEx VIP | L2:Aramex/SMSA KSA | L3:ناقل/زاجل | L4:Same-day). قرار على SLA Avg+P95 مش المتوسط بس`,
  "KB-H-03": `EG كروس: مفاجآت عند الباب(رسوم/جمارك/تأخير)=رفض+تدمير ثقة. تجنب DDU B2C→بدائل: DDP أو IOR أو تنفيذ محلي`,

  // ── مدفوعات ──
  "KB-I": `Payments: الدفع جزء من التحويل. KSA:Mada+Apple Pay | EG:Fawry/Meeza | BNPL:Tabby/Tamara→AOV↑+COD↓. راقب Payment Success Rate (Mobile أهم) بحسب بنك/بوابة. فشل فين؟ OTP/3DS/Redirect`,

  // ── امتثال ──
  "KB-J": `Compliance: قفل مفاجئ يقتل البيزنس. سياسات شحن/إرجاع/تسعير واضحة قبل Checkout. بديل مؤثر: UGC+إعلان من حساب البراند. Claims لازم تكون قابلة للإثبات`,

  // ── تريكات استشاري ──
  "KB-K": `SEO=Intent+Conversion. صفحات الأقسام قبل المدونة. Internal linking=بائع صامت`,
  "KB-K-01": `بديل المؤثر: UGC+Script قصير+تصوير حقيقي+Partnership/Spark. Proof في أول 3 ثواني`,
  "KB-K-02": `دروب شيبينج من الصين بيموت: توقعات 2-3 أيام مش 15+. حل: 3PL محلي للBest-sellers`,
  "KB-K-03": `توطين اللهجة=CTR. فصحى باردة في السوشيال. لهجة بيضاء/محلية حسب البلد. فخ: ترجمة حرفية`,

  // ── لوحة قرار ──
  "KB-L": `لوحة القرار: Marketing+Ops+Finance مع بعض. قرار بدون Ops/Finance=ناقص. "أداء بيكذب" لما التسويق منفصل عن التشغيل`,
  "KB-L-F": `Funnel: CTR/CPC/CPM+CVR+CAC+AOV+LTV:CAC+Abandoned carts+Conversion lag. Traffic عالي+Purchase ضعيف→Proof/Checkout/Ops أولاً`,
  "KB-L-O": `Ops: RTO%/Return%/Payment success/SLA Avg+P95/Logistics cost/Cash cycle/شكاوى مصنفة. ارتفاع RTO/فشل دفع غالباً يسبق هبوط الربح حتى لو ROAS ثابت`,
};

// ╔═══════════════════════════════════════════════════════════════════╗
// ║  🔻 END OF KB — تحت هنا المحرك (Engine) — مش محتاج تعدّله      ║
// ╚═══════════════════════════════════════════════════════════════════╝

// =========================
// Helpers
// =========================
function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return fallback;
}

function toPositiveInt(value, fallback, min = 1, max = 50) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function getAuthState(req, env) {
  const requiredToken = String(env.WORKER_SHARED_SECRET || "").trim();
  if (!requiredToken) {
    return { authorized: true, tokenProtected: false };
  }
  const got = req.headers.get("x-worker-token") || "";
  return {
    authorized: safeEqual(got, requiredToken),
    tokenProtected: true
  };
}

function hasJsonContentType(req) {
  const contentType = String(req.headers.get("Content-Type") || "").toLowerCase();
  return contentType.includes("application/json");
}

function readContentLength(req) {
  const raw = req.headers.get("Content-Length");
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function getAllowedOrigins(env) {
  const allowLocal = toBool(env.ALLOW_LOCAL_ORIGINS, false);
  const allowNullOrigin = toBool(env.ALLOW_NULL_ORIGIN, false);

  return ALLOWED_ORIGINS.filter(origin => {
    if (origin === "null") return allowNullOrigin;
    if (/^http:\/\/(localhost|127\.0\.0\.1):/i.test(origin)) return allowLocal;
    return true;
  });
}

function hitRateLimit(req, reqOrigin, tokenProtected = false) {
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const ua = (req.headers.get("User-Agent") || "na").slice(0, 80);
  const key = `${ip}|${reqOrigin}|${ua}`;
  const maxRequests = tokenProtected ? RATE_LIMIT_MAX : RATE_LIMIT_MAX_ANON;
  const now = Date.now();

  const prev = rateLimitStore.get(key);
  if (!prev || now - prev.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { start: now, count: 1 });
    return { limited: false, retryAfterSec: 0 };
  }

  prev.count += 1;
  rateLimitStore.set(key, prev);

  // lazy cleanup
  if (rateLimitStore.size > 2000) {
    for (const [k, row] of rateLimitStore.entries()) {
      if (now - row.start > RATE_LIMIT_WINDOW_MS) rateLimitStore.delete(k);
    }
  }

  if (prev.count > maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - prev.start)) / 1000));
    return { limited: true, retryAfterSec };
  }
  return { limited: false, retryAfterSec: 0 };
}

function normalizeIncomingMessages(messages, max = 20) {
  if (!Array.isArray(messages)) return [];
  const out = [];
  for (const m of messages.slice(-max)) {
    if (!m || typeof m !== "object") continue;
    if (typeof m.content !== "string") continue;
    out.push({
      role: m.role === "user" ? "user" : "model",
      content: scrub(m.content),
    });
  }
  return out;
}

function normalizeMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};

  const out = {};
  if (meta.session_lang === "ar" || meta.session_lang === "en") out.session_lang = meta.session_lang;
  if (meta.session_dialect === "neutral" || meta.session_dialect === "egypt" || meta.session_dialect === "gulf") {
    out.session_dialect = meta.session_dialect;
  }
  if (typeof meta.dialect_lock === "boolean") out.dialect_lock = meta.dialect_lock;
  if (Number.isInteger(meta.observations_count) && meta.observations_count >= 0 && meta.observations_count <= 20) {
    out.observations_count = meta.observations_count;
  }
  if (meta.mode === "flash" || meta.mode === "expert") out.mode = meta.mode;
  if (Number.isInteger(meta.expert_uses) && meta.expert_uses >= 0 && meta.expert_uses <= 10) {
    out.expert_uses = meta.expert_uses;
  }
  if (meta.has_welcomed === true) out.has_welcomed = true;
  if (typeof meta.last_opener_text === "string") out.last_opener_text = scrub(meta.last_opener_text).slice(0, 140);
  if (typeof meta.vibe_tag === "string") out.vibe_tag = meta.vibe_tag.slice(0, 40);
  if (meta.market_mode === "auto" || meta.market_mode === "on" || meta.market_mode === "off") {
    out.market_mode = meta.market_mode;
  }
  if (Array.isArray(meta.market_cards)) {
    out.market_cards = meta.market_cards.filter(id => typeof id === "string" && MARKET_KB[id]).slice(0, 9);
  }
  if (typeof meta.forced_route === "string") out.forced_route = meta.forced_route.slice(0, 40);

  // Budget Guard tracking
  if (Number.isInteger(meta.last_429_timestamp) && meta.last_429_timestamp >= 0) {
    out.last_429_timestamp = meta.last_429_timestamp;
  }
  if (Number.isInteger(meta.wave_429_count) && meta.wave_429_count >= 0 && meta.wave_429_count <= 10) {
    out.wave_429_count = meta.wave_429_count;
  }

  return out;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function scrub(text) {
  return String(text || "")
    .substring(0, 2400)
    .replace(/\[\s*(SYSTEM|INJECTION|CTX)[^\]]*\]/gi, "");
}

function normalizeMessages(msgs, max = 10) {
  return (msgs || []).slice(-max).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: scrub(m.content) }]
  }));
}

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function parseKeyPool(value) {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map(x => x.trim())
    .filter(Boolean)
    .filter(name => /^[a-z_][a-z0-9_]*$/i.test(name))
    .slice(0, 24);
}

function normalizeSecretName(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^[a-z_][a-z0-9_]*$/i.test(trimmed) ? trimmed : "";
}

function resolveGeminiKeyNames(env) {
  const overridePool = parseKeyPool(env.GEMINI_KEY_POOL);
  const basePool = overridePool.length ? overridePool : GEMINI_KEY_POOL;
  const seen = new Set();
  const active = [];

  for (const name of basePool) {
    if (seen.has(name)) continue;
    seen.add(name);
    const value = env[name];
    if (typeof value === "string" && value.trim()) active.push(name);
  }
  return active;
}

function resolveGroqKeyNames(env) {
  const overridePool = parseKeyPool(env.GROQ_KEY_POOL);
  const basePool = overridePool.length ? overridePool : GROQ_KEY_POOL;
  const seen = new Set();
  const active = [];

  for (const name of basePool) {
    if (seen.has(name)) continue;
    seen.add(name);
    const value = env[name];
    if (typeof value === "string" && value.trim()) active.push(name);
  }
  return active;
}

function detectProvider(keyName) {
  if (keyName.startsWith('gr-')) return 'groq';
  return 'gemini';
}

function resolveContextTurns(mode, marketCardsCount) {
  if (mode === "expert") return CONTEXT_TURNS_EXPERT;
  if (marketCardsCount > 0) return CONTEXT_TURNS_MARKET;
  return CONTEXT_TURNS_FLASH;
}

function resolveOutputTokens(mode, lastMsg) {
  const t = String(lastMsg || "").trim();
  const len = t.length;
  const hasMetrics = /\d/.test(t) && /(%|\$|k|m|ريال|جنية|جنيه|دولار|roas|cpa|ctr|cvr|rto|cac|aov)/i.test(t);
  const hasComplexIntent = isBusinessQuestion(t) || /(audit|analysis|تحليل|تقييم|استشارة)/i.test(t);

  if (mode === "expert") {
    if (len < 50) return MIN_OUTPUT_TOKENS_EXPERT;
    if (len < 180) return Math.min(MAX_OUTPUT_TOKENS_EXPERT, 440);
    if (hasComplexIntent || hasMetrics) return Math.min(MAX_OUTPUT_TOKENS_EXPERT, 560);
    return Math.min(MAX_OUTPUT_TOKENS_EXPERT, 500);
  }

  if (len < 32) return MIN_OUTPUT_TOKENS_FLASH;
  if (len < 120) return Math.min(MAX_OUTPUT_TOKENS_FLASH, 250);
  if (hasComplexIntent || hasMetrics) return Math.min(MAX_OUTPUT_TOKENS_FLASH, 320);
  return Math.min(MAX_OUTPUT_TOKENS_FLASH, 290);
}

function normalizeModelName(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^[a-z0-9.\-_]+$/i.test(trimmed) ? trimmed : "";
}

function resolveModels(env) {
  const flash = normalizeModelName(env.GEMINI_MODEL_FLASH) || DEFAULT_MODELS.FLASH;
  const expert = normalizeModelName(env.GEMINI_MODEL_EXPERT) || flash;
  const failover = normalizeModelName(env.GEMINI_MODEL_FAILOVER) || DEFAULT_MODELS.FAILOVER;

  return {
    FLASH: flash,
    EXPERT: expert,
    FAILOVER: failover && failover !== flash ? failover : "",
  };
}

function resolveApiVersion(env) {
  const value = String(env.GEMINI_API_VERSION || DEFAULT_GEMINI_API_VERSION).trim();
  return /^[a-z0-9]+$/i.test(value) ? value : DEFAULT_GEMINI_API_VERSION;
}

function detectLanguage(text) {
  const ar = /[\u0600-\u06FF\u0750-\u077F]/;
  return ar.test(text) ? "ar" : "en";
}

function shouldSwitchLanguage(text, currentLang) {
  const t = String(text || "");
  if (t.length < 5) return false;
  const arChars = (t.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
  const enChars = (t.match(/[a-zA-Z]/g) || []).length;
  const total = arChars + enChars;
  if (!total) return false;
  if (currentLang === "en" && (arChars / total > 0.7)) return "ar";
  if (currentLang === "ar" && (enChars / total > 0.7)) return "en";
  return false;
}

function detectDialectScore(text) {
  const t = (text || "").toLowerCase();
  const egStrong = /(عايز|عاوز|دلوقتي|إزاي|ازاي|كده|بص|تمام)/g;
  const gulfStrong = /(أبغى|ابغى|الحين|شلون|وايد|مره)/g;
  const egWeak = /(مش|ايه|ليه|طب|يعني|امتى|فين)/g;
  const gulfWeak = /(وش|زين|ما عليك)/g;
  let sE = 0, sG = 0;
  sE += ((t.match(egStrong) || []).length * 2) + ((t.match(egWeak) || []).length);
  sG += ((t.match(gulfStrong) || []).length * 2) + ((t.match(gulfWeak) || []).length);
  return { egypt: sE, gulf: sG };
}

// =====================================================================
// Budget Guard (منع حرق التوكنز والمفاتيح)
// =====================================================================
function checkBudgetGuard(previousMeta, mode) {
  const expertUses = previousMeta.expert_uses || 0;
  const last429 = previousMeta.last_429_timestamp || 0;
  const wave429Count = previousMeta.wave_429_count || 0;
  const now = Date.now();

  // Rule 1: Max 2 expert uses per session
  if (mode === "expert" && expertUses >= 2) {
    return {
      allowed: false,
      reason: "expert_limit",
      forcedMode: "flash"
    };
  }

  // Rule 2: 429 wave detection (2× in 60 seconds)
  if (now - last429 < 60000 && wave429Count >= 2) {
    return {
      allowed: false,
      reason: "429_wave",
      stopRetry: true
    };
  }

  return { allowed: true };
}


function isSubstantive(text) {
  const t = String(text || "").trim();
  if (t.length > 18) return true;
  const hasMetric = /\d/.test(t) && /(%|\$|k|m|ريال|جنية|جنيه|دولار|roas|cpa|ctr|cvr|rto|cac|aov)/i.test(t);
  return hasMetric;
}

function isBusinessQuestion(msg) {
  const t = (msg || "").trim();

  // Short messages never trigger Expert (prevent surface-word activation)
  if (t.length < 40) return false;

  // Must have numbers AND financial decision keywords
  const hasNumbers = /\d/.test(t);
  const hasFinancial = /(ميزانية|budget|roas|cac|rto|ربح|خسارة|margin|تكلفة|cost|هامش|نزيف|مبيعات|sales|revenue|إيرادات)/i.test(t);
  const hasDecision = /(أعمل ايه|اعمل ايه|إيه الحل|ايه الحل|أقرر|أختار|استشارة عميقة|deep analysis|تحليل شامل)/i.test(t);

  // Expert only if: (numbers + financial) OR explicit deep consultation request
  const needsExpert = (hasNumbers && hasFinancial) || /(استشارة عميقة|deep analysis|تحليل شامل|comprehensive analysis)/i.test(t);

  // For Market KB detection (broader) — requires decision intent + numbers
  const hasBizContext = /(تحويل|إعلان|ads|conversion|traffic|funnel|checkout|tracking|شحن|دفع)/i.test(t);

  return needsExpert || (hasBizContext && hasDecision && hasNumbers);
}


function safetyClamp(text) {
  if (!text) return "";
  let clean = String(text)
    .replace(/\b(As an AI large language model|I am an AI|I'm an AI)\b/gi, "")
    .replace(/(?:انا|أنا|i)\s*(?:مجرد\s*)?(?:نموذج(?:\s*لغوي)?|ذكاء\s*اصطناعي|ai)\b[^\n.!?؟]*/gi, "")
    .replace(/\[\s*(SYSTEM|PROMPT|MODEL|INJECTION|CTX)[^\]]*\]/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean && !/[.!؟…]$/.test(clean)) clean += "…";
  return clean.length > 2800 ? clean.substring(0, 2797) + "..." : clean;
}

function isOptionsLineText(line) {
  const s = String(line || "").trim();
  return s.startsWith("خيارات:") || s.toLowerCase().startsWith("options:");
}

function enforceQuestionLimit(text, maxQuestions = 1) {
  let seen = 0;
  return String(text || "").replace(/[?؟]/g, (q) => {
    seen += 1;
    return seen <= maxQuestions ? q : "،";
  });
}

function enforceLineBudget(text, mode) {
  const maxLines = mode === "expert" ? 8 : 4;
  let lines = String(text || "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length <= maxLines) return lines.join("\n").trim();

  const optionIndex = lines.findIndex(isOptionsLineText);
  if (optionIndex === -1) {
    return lines.slice(0, maxLines).join("\n").trim();
  }

  const optionLine = lines[optionIndex];
  const withoutOptions = lines.filter((_, idx) => idx !== optionIndex);
  const body = withoutOptions.slice(0, Math.max(1, maxLines - 1));
  return [...body, optionLine].join("\n").trim();
}

function polishJimmyResponse(text, mode = "flash") {
  let clean = String(text || "").trim();
  clean = enforceQuestionLimit(clean, 1);
  clean = enforceLineBudget(clean, mode);
  return clean;
}

function sanitizeQuickReply(text) {
  return String(text || "")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F]/g, "")
    .trim();
}

// ── Retry & Resilience Utilities ──
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));
}

function backoffDelay(attempt) {
  const base = BACKOFF_BASE_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * BACKOFF_BASE_MS);
  return Math.min(base + jitter, BACKOFF_MAX_MS);
}

function generateRequestId() {
  try { return crypto.randomUUID(); }
  catch { return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
}

function structuredLog(data) {
  try { console.log(JSON.stringify({ ts: Date.now(), v: WORKER_VERSION, ...data })); } catch { /* noop */ }
}

function supportsPenalties(model) {
  if (!model || typeof model !== "string") return false;
  // lite variants may not support presencePenalty/frequencyPenalty
  if (/lite/i.test(model)) return false;
  return true;
}

function estimateTokens(text) {
  const t = String(text || "");
  if (!t.length) return 0;
  const arRatio = (t.match(/[\u0600-\u06FF]/g) || []).length / (t.length || 1);
  return Math.ceil(t.length / (arRatio > 0.4 ? 3.5 : 4));
}

// =========================
// Direct Routes (No LLM)
// =========================
function routeDirect(lastMsg) {
  const t = (lastMsg || "").trim();
  if (!t) return null;

  // Avoid hijacking long/complex business questions into a static route.
  if (t.length > 180 && isBusinessQuestion(t)) return null;

  const wantsPortfolio = /(\bportfolio\b|\bprojects?\b|بورتفوليو|سابقة\s*أعمال|سابقة\s*الاعمال|أعمالك|اعمالك|نماذج\s*الأعمال|نماذج\s*الاعمال)/i.test(t);
  const wantsContact = /(\bcontact\b|\bcall\b|\bphone\b|\bwhatsapp\b|\bhire\b|تواصل|كلمني|مكالمة|واتس(?:اب)?|واتساب|رقمك|رقم\s*(?:التواصل|الهاتف|الموبايل|التليفون))/i.test(t);

  if (wantsPortfolio && wantsContact) {
    return {
      response: "خلّينا نمشيها بالترتيب الصح.\nتحب نبدأ بالشغل ولا بالتواصل المباشر؟\nخيارات: [[بورتفوليو]] [[تواصل]]",
      metaPatch: { forced_route: "conflict_data" }
    };
  }
  if (wantsPortfolio) {
    return {
      response: `حلو إنك بدأت من الشغل نفسه.\nالبورتفوليو: ${LINKS.site}\nوالـ CV PDF: ${LINKS.cv}\nخيارات: [[أهم إنجاز]] [[تواصل]]`,
      metaPatch: { forced_route: "portfolio" }
    };
  }
  if (wantsContact) {
    return {
      response: `تمام، أسرع طريق هو واتساب.\nWhatsApp: ${LINKS.whatsapp}\nPhone: ${LINKS.displayPhone}\nخيارات: [[واتساب]] [[بورتفوليو]]`,
      metaPatch: { forced_route: "contact" }
    };
  }
  return null;
}

// =========================
// Options extraction (لا تكسر الجمل)
// =========================
function extractQuickReplies(responseText) {
  const lines = String(responseText || "").split("\n");
  const idx = [...lines].reverse().findIndex(isOptionsLineText);
  if (idx === -1) return { cleaned: responseText.trim(), quickReplies: [] };

  const realIndex = lines.length - 1 - idx;
  const optionsLine = lines[realIndex];

  const quickReplies = [];
  const badgeRegex = /\[\[(.*?)\]\]/g;
  let m;
  while ((m = badgeRegex.exec(optionsLine)) !== null) {
    const opt = sanitizeQuickReply(m[1]);
    if (opt && quickReplies.length < 3) quickReplies.push(opt);
  }

  // remove entire options line
  lines.splice(realIndex, 1);

  return { cleaned: lines.join("\n").trim(), quickReplies };
}

// =====================================================================
// Market Brain (اختياري) — تحميل كروت حسب السياق
// =====================================================================
function detectMarketToggle(text, prev) {
  const t = text || "";
  if (/(اقفل|الغ|وقف).*(ماركت|market|kb)/i.test(t)) return "off";
  if (/(فعّل|شغل|فتح).*(ماركت|market|kb)/i.test(t)) return "on";
  return prev || "auto";
}

function uniq(arr) {
  const s = new Set();
  const out = [];
  for (const x of arr) { if (x && !s.has(x)) { s.add(x); out.push(x); } }
  return out;
}

function pickMarketCards(text, mode, marketMode) {
  const hasMarketSignal = /(roas|cac|cvr|ctr|aov|rto|tracking|capi|s2s|attribution|pixel|checkout|payment|cod|returns?|refund|logistics|shipping|funnel|offer|margin|contribution|payback|ads|media|ميزانية|تحويل|مبيعات|ربح|هامش|شحن|دفع|مرتجع|ارجاع|تتبع|لوجست|سلة|بوابة|قناة)/i.test(text || "");
  const want = (marketMode === "on") || (marketMode === "auto" && hasMarketSignal);
  if (!want) return [];

  const t = (text || "").toLowerCase();
  let ids = ["KB-A", "KB-B"];

  // سوق
  if (/(ksa|saudi|riyadh|jeddah|السعود|الرياض|جدة)/i.test(text)) ids.push("KB-B-KSA");
  else if (/(uae|dubai|abu dhabi|الإمارات|دبي|ابوظبي|أبوظبي)/i.test(text)) ids.push("KB-B-UAE");
  else if (/(egypt|مصر|القاهرة|اسكندرية|إسكندرية)/i.test(text)) ids.push("KB-B-EG");

  // محاور
  if (/(tracking|capi|s2s|pixel|attribution|match)/i.test(t)) ids.push("KB-E");
  if (/(cod|rto|logistics|shipping|شحن|استلام|تحصيل|مرتجع|مرتجعات|إرجاع|ارجاع)/i.test(text)) ids.push("KB-H", "KB-H-01");
  if (/(payment|checkout|دفع|بوابة|بوابات|تمارا|تابي|bnpl)/i.test(text)) ids.push("KB-I");
  if (/(cvr|conversion|ux|cro|سلة|checkout|بيسيب السلة|مش بيشتري)/i.test(text)) ids.push("KB-C");
  if (/(snap|سناب)/i.test(text)) ids.push("KB-F-SNAP");
  if (/(tiktok|تيك توك|tt)/i.test(text)) ids.push("KB-F-TT");
  if (/(meta|facebook|انست|إنست|ميتا)/i.test(text)) ids.push("KB-F-META");
  if (/(shopify|سلة|زد|zid|salla|woocommerce|magento|منصة|platform)/i.test(text)) ids.push("KB-D");
  if (/(seo|organic|بحث|جوجل|سيرش)/i.test(text)) ids.push("KB-K", "KB-K-01");

  if (/(policy|compliance|claim|امتثال|سياسات|حظر|قفل)/i.test(text)) ids.push("KB-J");

  if (mode === "expert") ids.push("KB-L", "KB-L-F", "KB-L-O");

  ids = uniq(ids);

  // Flash: max 2 cards | Expert: max 9 cards (was 4 for flash)
  const max = mode === "expert" ? 9 : 2;
  return ids.slice(0, max);
}

function buildMarketContext(cardIds) {
  if (!cardIds?.length) return "";
  const blocks = cardIds
    .map(id => MARKET_KB[id] ? `[${id}]\n${MARKET_KB[id]}` : "")
    .filter(Boolean);
  return blocks.length ? `\n\n[MARKET]\n${blocks.join("\n\n")}` : "";
}

// =====================================================================
// “دهشة/كاريزما” كفلسفة (مش عداد)
// =====================================================================

// تنويع “طبيعي”: حسب نبرة المستخدم/نوع السؤال، مش حسب رقم الرسائل
function detectVibeTag(text) {
  const t = text || "";
  if (/(مستعجل|بسرعة|حالًا|ضروري|دلوقتي)/i.test(t)) return "fast_calm";
  if (/(متوتر|قلقان|خايف|حاسس|مضايق)/i.test(t)) return "reassure";
  if (/(جرّبنا|جربنا|مفيش فايدة|فشل|اتلسعنا)/i.test(t)) return "tough_love";
  if (/(زهقان|مخنوق|مقهور|حاسس ان الدنيا واقفة)/i.test(t)) return "light_relief";
  if (/(عايز قرار|قولّي أعمل ايه|أعمل ايه|اختار)/i.test(t)) return "decisive";
  if (isBusinessQuestion(t)) return "market_brain";
  return "normal";
}

function buildVibeDirective(vibeTag, lang) {
  if (lang === "en") {
    const map = {
      fast_calm: "Tone: calm urgency. Start with one clear direction, then 2 tight options.",
      reassure: "Tone: emotionally steady. Name the friction briefly, then reduce anxiety with a practical next step.",
      tough_love: "Tone: direct but respectful. Call out the trap, then show a cleaner path.",
      light_relief: "Tone: gentle wit without clowning. Small smile line, then useful advice.",
      decisive: "Tone: decision-first. Give recommendation + why in one line, then alternatives.",
      market_brain: "Tone: operator mindset. Focus on leverage, risk, and measurable impact.",
      normal: "Tone: warm, sharp, human. No generic filler."
    };
    return map[vibeTag] || map.normal;
  }

  const arMap = {
    fast_calm: "النبرة: هدوء سريع. ابدأ باتجاه واضح مباشر، وبعده خيارين قصار.",
    reassure: "النبرة: تطمين ذكي. سمّي المشكلة بدون تهويل، وبعدها خطوة عملية تقلل القلق.",
    tough_love: "النبرة: وضوح بدون قسوة. سمّي الفخ وبعدين افتح طريق أنضف.",
    light_relief: "النبرة: خفة محسوبة. لمسة دم خفيف صغيرة ثم قيمة حقيقية.",
    decisive: "النبرة: قرار أولاً. توصية واحدة واضحة بسبب مختصر، ثم بديلين لو لزم.",
    market_brain: "النبرة: تشغيل ونتائج. ركّز على الرافعة والمخاطر والقياس.",
    normal: "النبرة: إنسانية دافئة ومباشرة، بدون حشو."
  };
  return arMap[vibeTag] || arMap.normal;
}

function buildWarmupProtocol(lang) {
  if (lang === "en") {
    return "First interaction protocol (mandatory): 1) warm informal welcome 2) one useful insight tied to user words 3) soft options in last line.";
  }
  return "بروتوكول أول تفاعل (إجباري): 1) ترحيب دافي غير رسمي 2) Insight ذكي مرتبط بكلام المستخدم 3) خيارات ناعمة في آخر سطر.";
}

function buildResponseContract(mode) {
  const base = [
    KB_RESPONSE_CONTRACT,
    mode === "expert"
      ? "في expert: اعرض المنطق باختصار تنفيذي، وماتطولش بدون داعي."
      : "في flash: خليك مكثف جدًا، كل سطر له وظيفة.",
    "ممنوع تبدأ ردك بجمل روبوتية أو اعتذارات فارغة."
  ];
  return base.join("\n");
}

// “افتتاحية” مش محفوظة: ندي للموديل دور (مش نص) ولو حابب تعرف افتتاحية حلوة تقيس بيها ، هقولك مثلا لو الديفولت المصري - اهلا بيك منور الدنيا ، انا جيمي , انت مين -- وهكذا نوع بقا
// ونجبره يطلع افتتاحية مختلفة عن آخر مرة + مرتبطة بالسياق
function buildOpenerRule(lastOpener) {
  if (!lastOpener || lastOpener === "—") return "";
  return `آخر افتتاحية استخدمتها كانت: "${lastOpener}" — قول حاجة مختلفة تماماً.`;
}

// Length guidance — minimal hint, not rigid template
function pickLengthHint(mode) {
  return mode === "expert"
    ? "الموضوع ده محتاج تحليل — خد راحتك بس خلّيه مركّز."
    : "خلّي ردك قصير وحيّ: من سطرين لأربع سطور.";
}

// =====================================================================
// Tier Selection (token budgeting)
// =====================================================================
// Tier 0: Greeting/simple chat (~350 tokens) — Style + Language + Flow
// Tier 1: General conversation (~600 tokens) — + Mohamed + Opener + Pattern
// Tier 2: Expert/Market (~800–1200 tokens) — + Escalation + Market KB
function selectTier(mode, marketCards, isFirst, vibeTag) {
  if (mode === "expert" || (marketCards && marketCards.length > 0)) return 2;
  return 1;
}

// =====================================================================
// System Prompt Builder (Tiered)
// =====================================================================
function buildSystemPrompt(ctx) {
  const {
    lang, dialect, mode, isFirst,
    lastOpener, vibeTag,
    marketCtx, tier
  } = ctx;

  // Language hint — short and natural
  let langHint = "";
  if (lang === "en") {
    langHint = "The visitor is speaking English — reply in English.";
  } else {
    if (dialect === "egypt") langHint = "الزائر بيتكلم مصري — رد بالمصري.";
    else if (dialect === "gulf") langHint = "الزائر بيتكلم خليجي — رد بالخليجي.";
    else langHint = "رد بالعامية البيضا.";
  }

  const responseContract = buildResponseContract(mode);
  const vibeDirective = buildVibeDirective(vibeTag, lang);

  // ── Core: Identity + Charisma + Knowledge + Contract ──
  const parts = [
    KB_STYLE,
    KB_STYLE_CHARISMA,
    KB_MOHAMED,
    responseContract,
    KB_GENERAL_KNOWLEDGE,
    langHint,
    pickLengthHint(mode),
    vibeDirective,
  ];

  if (isFirst) {
    parts.push(buildWarmupProtocol(lang));
  }
  const openerHint = buildOpenerRule(lastOpener);
  if (openerHint) parts.push(openerHint);

  // ── Tier 2: Market Knowledge ──
  if (tier >= 2) {
    if (marketCtx) {
      parts.push(marketCtx);
    }
  }

  return parts.join("\n\n").trim();
}

// =====================================================================
// Gemini Call (join all parts)
// =====================================================================
async function tryGenerate({
  model,
  apiKey,
  apiVersion,
  systemPrompt,
  messages,
  mode,
  contextTurns,
  outputTokens,
}) {
  const defaultContextTurns = mode === "expert" ? CONTEXT_TURNS_EXPERT : CONTEXT_TURNS_FLASH;
  const safeContextTurns = toPositiveInt(contextTurns, defaultContextTurns, 1, 20);
  const maxByMode = mode === "expert" ? MAX_OUTPUT_TOKENS_EXPERT : MAX_OUTPUT_TOKENS_FLASH;
  const minByMode = mode === "expert" ? MIN_OUTPUT_TOKENS_EXPERT : MIN_OUTPUT_TOKENS_FLASH;
  const safeOutputTokens = toPositiveInt(outputTokens, maxByMode, minByMode, maxByMode);

  const genConfig = {
    temperature: mode === "expert" ? 0.72 : 0.68,
    topP: 0.92,
    maxOutputTokens: safeOutputTokens,
  };
  // Only include penalty fields for models that support them (prevents 400)
  if (supportsPenalties(model)) {
    genConfig.presencePenalty = 0.35;
    genConfig.frequencyPenalty = 0.35;
  }

  const payload = {
    contents: normalizeMessages(messages, safeContextTurns),
    system_instruction: { parts: [{ text: systemPrompt }] },
    generationConfig: genConfig,
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      }
    );

    if (res.status !== 200) {
      let detail = `HTTP ${res.status}`;
      try {
        const raw = (await res.text()).replace(/\s+/g, " ").trim();
        if (raw) detail += ` ${raw.substring(0, 180)}`;
      } catch { }
      return { ok: false, model, status: res.status, detail };
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p?.text || "").join("").trim();
    if (text) return { ok: true, text };

    const block = data.promptFeedback?.blockReason || "";
    return {
      ok: false,
      model,
      status: 200,
      detail: block ? `Empty candidate (${block})` : "Empty candidate",
    };
  } catch (err) {
    return {
      ok: false,
      model,
      status: 0,
      detail: err?.name === "AbortError" ? "Timeout" : (err?.message || "Fetch failed"),
    };
  } finally {
    clearTimeout(id);
  }
}

// =====================================================================
// Groq API Call (OpenAI-compatible format)
// =====================================================================
async function tryGenerateGroq({
  model,
  apiKey,
  systemPrompt,
  messages,
  mode,
  contextTurns,
  outputTokens,
}) {
  const defaultContextTurns = mode === "expert" ? CONTEXT_TURNS_EXPERT : CONTEXT_TURNS_FLASH;
  const safeContextTurns = toPositiveInt(contextTurns, defaultContextTurns, 1, 20);
  const maxByMode = mode === "expert" ? MAX_OUTPUT_TOKENS_EXPERT : MAX_OUTPUT_TOKENS_FLASH;
  const minByMode = mode === "expert" ? MIN_OUTPUT_TOKENS_EXPERT : MIN_OUTPUT_TOKENS_FLASH;
  const safeOutputTokens = toPositiveInt(outputTokens, maxByMode, minByMode, maxByMode);

  // Convert messages to OpenAI format
  const groqMessages = [
    { role: "system", content: systemPrompt }
  ];

  const recentMessages = (messages || []).slice(-safeContextTurns);
  for (const m of recentMessages) {
    groqMessages.push({
      role: m.role === "user" ? "user" : "assistant",
      content: scrub(m.content)
    });
  }

  const payload = {
    model,
    messages: groqMessages,
    temperature: mode === "expert" ? 0.72 : 0.68,
    max_tokens: safeOutputTokens,
    top_p: 0.92,
    frequency_penalty: 0.35,
    presence_penalty: 0.35,
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      }
    );

    if (res.status !== 200) {
      let detail = `HTTP ${res.status}`;
      try {
        const raw = (await res.text()).replace(/\s+/g, " ").trim();
        if (raw) detail += ` ${raw.substring(0, 180)}`;
      } catch { }
      return { ok: false, model, status: res.status, detail };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    if (text) return { ok: true, text };

    return {
      ok: false,
      model,
      status: 200,
      detail: "Empty response from Groq",
    };
  } catch (err) {
    return {
      ok: false,
      model,
      status: 0,
      detail: err?.name === "AbortError" ? "Timeout" : (err?.message || "Fetch failed"),
    };
  } finally {
    clearTimeout(id);
  }
}


function summarizeFailures(failures, max = 8) {
  if (!Array.isArray(failures) || failures.length === 0) return "No upstream response";
  return failures.slice(0, max).map(f => {
    const detail = String(f?.detail || "").replace(/\s+/g, " ").trim().slice(0, 110);
    return `${f?.model || "unknown"}[${f?.status ?? "ERR"}]${detail ? ` ${detail}` : ""}`;
  }).join(" | ");
}

function classifyUpstreamFailure(failures) {
  if (!Array.isArray(failures) || failures.length === 0) {
    return {
      status: 500,
      error: "Worker misconfigured",
      details: "No valid API keys were found in Worker secrets.",
    };
  }

  const has400 = failures.some(f => f?.status === 400);
  const has401or403 = failures.some(f => f?.status === 401 || f?.status === 403);
  const has429 = failures.some(f => f?.status === 429);
  const has404 = failures.some(f => f?.status === 404);
  const all404 = failures.every(f => f?.status === 404);
  const all429 = failures.every(f => f?.status === 429);

  // Auth / billing issue
  if (has401or403) {
    return {
      status: 502,
      error: "Upstream auth error",
      details: "API key is invalid or billing is disabled.",
    };
  }

  // Bad payload (config issue, not retryable)
  if (has400 && !has429 && !has404) {
    return {
      status: 502,
      error: "Upstream payload rejected",
      details: "API rejected the request payload.",
    };
  }

  // All models not found
  if (all404) {
    return {
      status: 502,
      error: "Upstream model unavailable",
      details: "Configured model(s) not available for this API/project.",
    };
  }

  // Quota exceeded
  if (all429 || (has429 && !has400)) {
    return {
      status: 429,
      error: "Upstream quota exceeded",
      details: has404
        ? "API quota exceeded and failover model is invalid."
        : "API quota exceeded on all configured keys.",
    };
  }

  return {
    status: 502,
    error: "Upstream AI unavailable",
    details: "Upstream request failed.",
  };
}

// =====================================================================
// MAIN
// =====================================================================
export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin");
    if (!origin) return json({ error: "Forbidden" }, 403);

    const allowedOrigins = getAllowedOrigins(env);
    const isNullOrigin = origin === "null";
    let reqOrigin = origin;

    if (!isNullOrigin) {
      try { reqOrigin = new URL(origin).origin; }
      catch { return json({ error: "Forbidden" }, 403); }
    }

    if (!allowedOrigins.includes(reqOrigin)) {
      return json({ error: "Forbidden" }, 403);
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": reqOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-worker-token",
      "Vary": "Origin"
    };

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);
    if (!hasJsonContentType(req)) {
      return json({ error: "Unsupported Media Type", details: "Content-Type must be application/json" }, 415, corsHeaders);
    }

    const contentLength = readContentLength(req);
    if (contentLength !== null && contentLength > MAX_REQUEST_BYTES) {
      return json({ error: "Payload too large", details: `Max payload is ${MAX_REQUEST_BYTES} bytes.` }, 413, corsHeaders);
    }

    const authState = getAuthState(req, env);
    if (!authState.authorized) return json({ error: "Unauthorized" }, 401, corsHeaders);

    const rl = hitRateLimit(req, reqOrigin, authState.tokenProtected);
    if (rl.limited) {
      return json({ error: "Too Many Requests", details: "Slow down and retry shortly." }, 429, {
        ...corsHeaders,
        "Retry-After": String(rl.retryAfterSec)
      });
    }

    try {
      const requestId = generateRequestId();
      const body = await req.json();
      const messages = normalizeIncomingMessages(body?.messages || []);
      const previousMeta = normalizeMeta(body?.meta);
      const requestedForceKey = normalizeSecretName(body?.meta?.force_key);
      const allowForceKey = toBool(env.ALLOW_FORCE_KEY_META, true);
      const forceSingleKey = allowForceKey && !!requestedForceKey;
      if (!messages.length) {
        return json({ error: "Bad request", details: "messages[] is required" }, 400, corsHeaders);
      }

      const rawLast = messages.length ? messages[messages.length - 1].content : "";
      const lastMsg = scrub(rawLast);

      // 1) Direct routes
      const direct = routeDirect(lastMsg);
      if (direct) {
        const extracted = extractQuickReplies(direct.response);
        return json({
          response: polishJimmyResponse(safetyClamp(extracted.cleaned), "flash"),
          meta: {
            ...previousMeta,
            worker_version: WORKER_VERSION,
            mode: "flash",
            quickReplies: extracted.quickReplies,
            ...(direct.metaPatch || {})
          }
        }, 200, corsHeaders);
      }

      // 2) Session language/dialect
      let sessionLang = previousMeta.session_lang || null;
      let sessionDialect = previousMeta.session_dialect || "neutral";
      let dialectLock = previousMeta.dialect_lock || false;
      let obsCount = previousMeta.observations_count || 0;

      const hasWelcomed = !!previousMeta.has_welcomed;

      if (!sessionLang) {
        sessionLang = detectLanguage(lastMsg);
        if (sessionLang === "en") dialectLock = true;
      } else {
        const newLang = shouldSwitchLanguage(lastMsg, sessionLang);
        if (newLang) {
          sessionLang = newLang;
          if (sessionLang === "ar") {
            sessionDialect = "neutral";
            dialectLock = false;
            obsCount = 0;
          } else {
            dialectLock = true;
          }
        }
      }

      if (sessionLang === "ar" && !dialectLock) {
        const scores = detectDialectScore(lastMsg);
        const diffE = scores.egypt - scores.gulf;
        const diffG = scores.gulf - scores.egypt;

        if (scores.egypt >= 3 || diffE >= 2) {
          sessionDialect = "egypt";
          dialectLock = true;
          obsCount = 0;
        } else if (scores.gulf >= 3 || diffG >= 2) {
          sessionDialect = "gulf";
          dialectLock = true;
          obsCount = 0;
        } else {
          obsCount++;
          if (obsCount >= 4) {
            sessionDialect = "neutral";
            dialectLock = true;
            obsCount = 0;
          }
        }
      }

      // 3) Mode gate (Expert يسمح 6–8 سطور)
      // 3) Mode detection with Budget Guard
      const wantsDeepAudit = isBusinessQuestion(lastMsg);
      const forceExpert = previousMeta.forced_route === "<<NEEDS_EXPERT>>";
      let expertUses = Math.min(previousMeta.expert_uses || 0, 10); // server-side clamp

      let mode = "flash";
      // continueExpert requires business context, not just message length
      const hasBizFollowUp = isSubstantive(lastMsg) && /(roas|cac|rto|ربح|خسارة|margin|تكلفة|هامش|ميزانية|budget|تحليل|analysis|شحن|دفع|tracking|funnel|مبيعات|conversion)/i.test(lastMsg);
      const continueExpert = previousMeta.mode === "expert" && hasBizFollowUp;

      // Determine initial mode
      if (forceExpert || wantsDeepAudit || continueExpert) {
        mode = "expert";
      }

      // Apply Budget Guard
      const budgetCheck = checkBudgetGuard(previousMeta, mode);
      if (!budgetCheck.allowed) {
        mode = budgetCheck.forcedMode || "flash";
      }

      // Track expert usage
      if (mode === "expert") expertUses += 1;

      // 4) Market toggle/cards
      const marketModePrev = previousMeta.market_mode || "auto";
      const marketMode = detectMarketToggle(lastMsg, marketModePrev);
      const marketCards = pickMarketCards(lastMsg, mode, marketMode);
      const marketCtx = buildMarketContext(marketCards);

      // 5) فلسفة الدهشة/الكاريزما
      const vibeTag = detectVibeTag(lastMsg);

      const lastOpener = previousMeta.last_opener_text || "";

      // 6) Tier selection + Prompt
      const tier = selectTier(mode, marketCards, !hasWelcomed, vibeTag);
      const systemPrompt = buildSystemPrompt({
        lang: sessionLang,
        dialect: sessionDialect,
        mode,
        isFirst: !hasWelcomed,
        lastOpener,
        vibeTag,
        marketCtx,
        tier
      });

      const models = resolveModels(env);
      const apiVersion = resolveApiVersion(env);
      const selectedModel = mode === "expert" ? models.EXPERT : models.FLASH;
      const contextTurns = resolveContextTurns(mode, marketCards.length);
      const outputTokens = resolveOutputTokens(mode, lastMsg);

      // 7) Generate with resilient retry (max 3 attempts, backoff, no key re-use)
      const geminiKeys = shuffle(resolveGeminiKeyNames(env));
      const groqKeys = shuffle(resolveGroqKeyNames(env));
      const allKeys = [...groqKeys, ...geminiKeys];

      const keys = forceSingleKey
        ? allKeys.filter(k => k === requestedForceKey)
        : allKeys;
      if (forceSingleKey && keys.length === 0) {
        return json({
          error: "Bad request",
          details: `Forced key "${requestedForceKey}" is not configured or empty.`,
        }, 400, corsHeaders);
      }

      let responseText = null;
      const upstreamFailures = [];
      const triedKeyModel = new Set(); // track key+model combos to prevent re-use
      let totalAttempts = 0;

      structuredLog({ level: "info", type: "request_start", requestId, model: selectedModel, mode, keyCount: keys.length });

      // --- Primary model attempts ---
      for (const k of keys) {
        if (totalAttempts >= MAX_TOTAL_UPSTREAM_ATTEMPTS) break;
        const combo = `${k}:${selectedModel}`;
        if (triedKeyModel.has(combo)) continue;
        triedKeyModel.add(combo);

        // Exponential backoff between attempts (skip first)
        if (totalAttempts > 0) {
          await sleep(backoffDelay(totalAttempts - 1));
        }
        totalAttempts++;

        const apiKey = env[k];
        const provider = detectProvider(k);
        let result;

        if (provider === 'groq') {
          const groqModel = mode === "expert" ? GROQ_MODELS.EXPERT : GROQ_MODELS.FLASH;
          result = await tryGenerateGroq({ model: groqModel, apiKey, systemPrompt, messages, mode, contextTurns, outputTokens });
        } else {
          result = await tryGenerate({ model: selectedModel, apiKey, apiVersion, systemPrompt, messages, mode, contextTurns, outputTokens });
        }

        structuredLog({
          level: result?.ok ? "info" : "warn", type: "attempt",
          requestId, attempt: totalAttempts, provider, model: selectedModel,
          status: result?.status, ok: !!result?.ok,
        });

        if (result?.ok) { responseText = result.text; break; }
        if (!result) continue;
        upstreamFailures.push(result);

        // Non-retryable errors: stop immediately
        if (result.status === 400 || result.status === 401 || result.status === 403) {
          structuredLog({ level: "error", type: "non_retryable", requestId, status: result.status });
          break;
        }
        // Model not found (404): skip to fallback model
        if (result.status === 404) break;
        // 429: don't try more keys with same model (quota is project-wide)
        if (result.status === 429) break;
      }

      // --- Failover model attempt (max 1 attempt) ---
      const canTryFailover = !responseText && !forceSingleKey && models.FAILOVER
        && totalAttempts < MAX_TOTAL_UPSTREAM_ATTEMPTS;

      if (canTryFailover) {
        // Pick a key not yet used with the failover model
        const failoverKey = keys.find(k => !triedKeyModel.has(`${k}:${models.FAILOVER}`));
        if (failoverKey) {
          if (totalAttempts > 0) await sleep(backoffDelay(totalAttempts - 1));
          totalAttempts++;
          triedKeyModel.add(`${failoverKey}:${models.FAILOVER}`);

          const failoverOutputTokens = Math.min(outputTokens, MAX_OUTPUT_TOKENS_FLASH);
          const failoverContextTurns = Math.min(contextTurns, CONTEXT_TURNS_MARKET);
          const apiKey = env[failoverKey];

          const result = await tryGenerate({
            model: models.FAILOVER, apiKey, apiVersion, systemPrompt,
            messages, mode: "flash", contextTurns: failoverContextTurns, outputTokens: failoverOutputTokens,
          });

          structuredLog({
            level: result?.ok ? "info" : "warn", type: "failover_attempt",
            requestId, attempt: totalAttempts, model: models.FAILOVER,
            status: result?.status, ok: !!result?.ok,
          });

          if (result?.ok) {
            responseText = result.text;
          } else if (result) {
            upstreamFailures.push(result);
          }
        }
      }

      if (!responseText) {
        const classification = classifyUpstreamFailure(upstreamFailures);
        structuredLog({
          level: "error", type: "all_failed", requestId,
          status: classification.status, attempts: totalAttempts,
          failures: upstreamFailures.map(f => ({ model: f?.model, status: f?.status })),
        });
        const failureHeaders = classification.status === 429
          ? { ...corsHeaders, "Retry-After": "120" }
          : corsHeaders;
        return json(
          {
            error: classification.error,
            details: `${classification.details} :: ${summarizeFailures(upstreamFailures)}`,
          },
          classification.status,
          failureHeaders
        );
      }

      // 8) Post process
      responseText = safetyClamp(responseText);
      responseText = polishJimmyResponse(responseText, mode);
      const extracted = extractQuickReplies(responseText);

      // تخزين الافتتاحية اللي كتبها الموديل (أول سطر)
      const firstLine = (extracted.cleaned.split("\n")[0] || "").trim();

      // Token estimation for cost visibility (silent, meta only)
      const estInputTokens = estimateTokens(systemPrompt) + estimateTokens(lastMsg);
      const estOutputTokens = estimateTokens(extracted.cleaned);

      return json({
        response: extracted.cleaned,
        meta: {
          ...previousMeta,
          worker_version: WORKER_VERSION,
          request_id: requestId,

          mode,
          expert_uses: expertUses,

          session_lang: sessionLang,
          session_dialect: sessionDialect,
          dialect_lock: dialectLock,
          observations_count: obsCount,

          has_welcomed: true,

          // anti-repeat
          last_opener_text: firstLine || lastOpener,
          vibe_tag: vibeTag,

          // market
          market_mode: marketMode,
          market_cards: marketCards,

          // cost tracking (approximate)
          est_input_tokens: estInputTokens,
          est_output_tokens: estOutputTokens,

          quickReplies: extracted.quickReplies,
          ...(forceSingleKey ? { forced_key: requestedForceKey } : {}),
        }
      }, 200, corsHeaders);

    } catch (err) {
      // JSON parse errors → 400 (client sent invalid body)
      if (err instanceof SyntaxError) {
        structuredLog({ level: "warn", type: "bad_json", msg: err?.message });
        return json({ error: "Bad request", details: "Invalid JSON body" }, 400, corsHeaders);
      }
      // All other errors → 503
      structuredLog({ level: "error", type: "unhandled", msg: err?.message, stack: (err?.stack || "").slice(0, 200) });
      return json({ error: "System Busy", details: "Retrying neural link..." }, 503, corsHeaders);
    }
  }
};
