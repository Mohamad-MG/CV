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
 *
 * الملف: jimmy-worker-v3.2.0.js
 *
 * ملاحظة: المحتوى المعلوماتي في مقدمة الملف كان مكتوب Markdown.
 * تم تحويله لتعليق JavaScript للحفاظ عليه بدون أي حذف.
 */
/**
 * Jimmy AI Worker v3.2.0 — Full Rebuild (KB محفوظة بالكامل + كاريزما غير نمطية)
 * ============================================================================
 * Fixes:
 * - No cut sentences: join ALL Gemini parts
 * - No broken sentences: options ONLY last line, removed as whole line
 * - No boring repetition: style rules تمنع الجُمل المحفوظة + تنويع "فلسفي" حسب السياق
 * - Market Brain optional: تحميل KB market حسب السؤال (مش دايمًا)
 * - Direct routes: Portfolio/Contact بدون LLM
 * - Origin "null" supported
 */

const WORKER_VERSION = "3.2.1";

const ALLOWED_ORIGINS = [
  "https://mo-gamal.com",
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
  "digimoraeg", "mogamal", "qyadat"
];

const DEFAULT_MODELS = {
  FLASH: "gemini-2.0-flash",
  EXPERT: "gemini-2.0-flash",  // Using flash for both until 2.0-pro is stable
  FAILOVER: "",
};
const DEFAULT_GEMINI_API_VERSION = "v1beta";

const TIMEOUT_MS = 10000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_MAX_ANON = 60;
const MAX_REQUEST_BYTES = 50_000;
const rateLimitStore = new Map();

// =====================================================================
// EDITABLE CONTENT ZONE (عدّل هنا فقط: ستايل/شخصية/معلومات محمد/الماركت)
// =====================================================================
// ملاحظة أداء: الـ IIFE بيتنفذ مرة واحدة وقت تحميل الـ Worker فقط (مش لكل Request).
const CONTENT = (() => {
  // =========================
  // روابط مؤكدة (Direct)
  // =========================
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

  // =====================================================================
  // KB — محمّلة بالكامل (بس متضغطَة: أقل توكينز + نفس المعنى)
  // =====================================================================

  /**
   * KB — Compressed Structured Shorthand (v3.2.1)
   * Same semantics, ~60% fewer tokens.
   */
  const KB_STYLE_FULL_MIN = `[JIMMY_STYLE]
ROLE: نافذة عقل (مش Chatbot/Assistant/Sales)
SUCCESS: يحس بإنسان فاهم ✅ | يحس بنظام ❌
PHILOSOPHY: Help-First(قيمة قبل سؤال) | Human>Business | Simple>Clever
TONE: بني آدم(مش روبوت/AI) | خفة دم Level2(تخفيف جمود, مش إهانة) | حضور واثق(قصير+رأي, بدون تبرير/اعتذار زائد) | لا نمط واحد(ممنوع تكرار افتتاحيات/إيقاع)
RESPONSE: Flash=2-4 سطور | Expert=6-8 سطور(تحليل مركز) | سؤال واحد أو Options
OPTIONS_FORMAT: آخر سطر فقط: خيارات: [[...]] [[...]] [[...]]
TRUST: Anti-hallucination(قول مش متأكد) | Zero sales pressure(CTA بطلب فقط)
EXPERT_MODE: بطلب واضح/سياق عميق فقط | هدف=قرار مش محتوى
BANNED: كلام AI/Prompt/Model | تكرار جمل/افتتاحيات | استجواب | Options داخل الجمل`.trim();

  const KB_MOHAMED_FULL_MIN = `[MOHAMED]
ID: Growth Systems Architect | Infrastructure>Campaigns | NOT:SMM/MediaBuyer/Coach
POSITION: بين البيزنس+البرودكت+التسويق | أعلى من منفذ، أقرب للتشغيل
PROOF:
  ArabianOud: ضغط عالي+أسواق متعددة+~6×organic/24mo+Guinness Jan2020
  Isotec: workflows+قياس+ملكية→−10-20%هدر
  Tatweeq: Tasks→Outcomes→~7×تعاقدات/سنة
  Qyadat: فرق+إطلاق WhatsApp/SMS+Playbooks
  Gento: −60-80%متابعة يدوية+تسريع إطلاقات
THINK: Marketing=OS | يبدأ من قرار العميل | لا وعود بدون قياس | Finance/Ops/Tracking قبل Scale | يرفض سلوك سام
AGENT_RULES: 1-2 Proof حسب السياق(ممنوع سرد كله) | "مين محمد؟"→2-3 سطور+Proof+سؤال نية | "ليه هو؟"→Proofين+زاوية مختلفة`.trim();

  const MARKET_KB = {
    "KB-A": `تشخيص سريع: CVR ضعيف+دفع/توصيل→Checkout/Ops | ROAS OK+ربح سلبي→COD/RTO/Shipping | ROAS متقلب→Tracking/CAPI. فخ: تغيير Ads قبل تثبيت دفع/شحن/سياسات. أسئلة: بلد/فئة/قناة/منصة/دفع/مخزون/CAPI/RTO/SLA/شكاوى/هدف90يوم`,
    "KB-B": `سوق=(ثقة+دفع+لوجستيات+قناة قرار). KSA:تشغيل محلي+توطين+RTO أولاً. UAE:CAC عالي طبيعي→CX/Retention. EG كروس:تجنب DDU. سؤال: القرار بيتاخد فين؟`,
    "KB-B-KSA": `KSA: ثقة+تشغيل محلي. Snap=لحظة قرار. Proof>خصم. توطين كامل. RTO قبل Scaling.`,
    "KB-B-UAE": `UAE: تجربة+خدمة. CAC أعلى طبيعياً. الخندق=Segmentation+Retention+CX.`,
    "KB-B-EG": `EG: سعر+ثقة+توصيل. WhatsApp=مسار قرار. COD قوي+RTO خطر. تجنب DDU كروس-بوردر.`,
    "KB-C": `شراء 2026: أسرع قرار+أقل صبر. فشل=Features بدل Outcome/خصم بدل ثقة/سياسة غامضة. Formula:(Outcome+Proof)−Friction`,
    "KB-C-01": `نقص Proof→CAC↑+CVR↓. Proof قبل الخصم.`,
    "KB-C-02": `TikTok/Snap/IG=نية شراء. محتوى decision-ready مش views-ready.`,
    "KB-D": `منصة: سرعة إطلاق→Hosted | مرونة→Open source. فخ: منصة قوية+تشغيل ضعيف=فشل.`,
    "KB-E": `Tracking: CAPI/S2S+dedup(event_id)+value/currency+Match Quality. Pixel وحده يكدب. تقلبات→attribution+dedup+currency.`,
    "KB-F": `قنوات=لحظة قرار. مش نزود Budget قبل ضمان Offer/Proof/Checkout/Ops.`,
    "KB-F-SNAP": `Snap KSA: قرار سريع. Creative مباشر+Proof. هبوط غالباً Trust/Shipping مش Ads.`,
    "KB-F-TT": `TikTok: UGC+Problem→Proof→Action. Views بدون صفحة تبيع=حرق.`,
    "KB-F-META": `Meta: Retarget+Proof+Creative testing. فخ: Audience tinkering قبل تثبيت صفحة/دفع.`,
    "KB-G": `Benchmarks=إنذار مش وصفة. اتقرأ مع سوق+هامش+تشغيل.`,
    "KB-H": `Ops: RTO/Returns/SLA/Logistics cost/Cash cycle. ممنوع Scaling قبل Contribution واضح.`,
    "KB-H-01": `COD/RTO: WhatsApp confirm/No reply cancel/Incentive prepaid/COD fee/Address validation. Metric: RTO by stage.`,
    "KB-H-02": `شحن: Cheapest carrier ممكن يرفع RTO ويقتل الربح.`,
    "KB-H-03": `EG كروس: مفاجآت عند الباب(رسوم/جمارك/تأخير)=رفض+تدمير ثقة.`,
    "KB-I": `Payments: Success Rate(موبايل)+محلي+BNPL(Tabby/Tamara)→AOV↑+COD↓.`,
    "KB-J": `Compliance: قفل مفاجئ يقتل البيزنس. Claims+سياسات نظيفة.`,
    "KB-K": `SEO=Intent+Conversion. SEO بدون Conversion=تضخيم فشل.`,
    "KB-K-01": `On-page: سرعة موبايل+بنية+سكيما+FAQ+Proof.`,
    "KB-K-02": `Content: Problem→Proof→How→CTA ناعم. قرار مش مقال.`,
    "KB-K-03": `Tech SEO: Indexing/Canonical/404/Redirects. أساسيات قبل hacks.`,
    "KB-L": `لوحة القرار: Marketing+Ops+Finance مع بعض. قرار بدون Ops/Finance=ناقص.`,
    "KB-L-F": `Funnel: Sessions→ATC→Checkout→Purchase+CVR+AOV+Refund/Return. Traffic عالي+Purchase ضعيف→Proof/Checkout/Ops أولاً.`,
    "KB-L-O": `Ops: RTO%/Return%/Payment success/SLA Avg+P95/Logistics cost/Cash cycle. ممنوع زيادة ميزانية قبل Contribution+Payback.`,
  };
  return {
    LINKS,
    DATA_BLOCKS,
    KB_STYLE_FULL_MIN,
    KB_MOHAMED_FULL_MIN,
    MARKET_KB,
  };
})();

const {
  LINKS,
  DATA_BLOCKS,
  KB_STYLE_FULL_MIN,
  KB_MOHAMED_FULL_MIN,
  MARKET_KB,
} = CONTENT;
// =====================================================================
// END EDITABLE CONTENT ZONE
// =====================================================================

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
  return [...arr].sort(() => Math.random() - 0.5);
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

function isSubstantive(text) {
  const t = String(text || "").trim();
  if (t.length > 18) return true;
  const hasMetric = /\d/.test(t) && /(%|\$|k|m|ريال|جنية|جنيه|دولار|roas|cpa|ctr|cvr|rto|cac|aov)/i.test(t);
  return hasMetric;
}

function isBusinessQuestion(msg) {
  const t = (msg || "").trim();
  const hasBiz = /(تحويل|مبيعات|إعلان|ميزانية|roas|cac|rto|نمو|ads|budget|conversion|sales|traffic|funnel|audit|تحليل|قيم|تقييم|نزيف|خسارة|ربح|هامش|margin|offer|checkout|tracking|capi|s2s|logistics|شحن|دفع|مرتجع|إرجاع|سلة)/i.test(t);
  const hasDecision = /(أعمل ايه|اعمل ايه|إيه الحل|ايه الحل|أبدأ منين|ابدا منين|أقرر|أختار|احسن|أطوّر|اطور|أقيّم|محتاج مساعدة|عايز رأي|استشارة)/i.test(t);
  return hasBiz || hasDecision || (/\d/.test(t) && hasDecision);
}

function safetyClamp(text) {
  if (!text) return "";
  let clean = String(text)
    .replace(/\b(As an AI large language model|I am an AI)\b/gi, "")
    .trim();
  if (clean && !/[.!؟…]$/.test(clean)) clean += "…";
  return clean.length > 2800 ? clean.substring(0, 2797) + "..." : clean;
}

function sanitizeQuickReply(text) {
  return String(text || "")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F]/g, "")
    .trim();
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
    return { response: "تحب أبدأ بإيه؟\nخيارات: [[بورتفوليو]] [[تواصل]]", metaPatch: { forced_route: "conflict_data" } };
  }
  if (wantsPortfolio) return { response: DATA_BLOCKS.PORTFOLIO, metaPatch: { forced_route: "portfolio" } };
  if (wantsContact) return { response: DATA_BLOCKS.CONTACT, metaPatch: { forced_route: "contact" } };
  return null;
}

// =========================
// Options extraction (لا تكسر الجمل)
// =========================
function extractQuickReplies(responseText) {
  const lines = String(responseText || "").split("\n");
  const isOptionsLine = (l) => {
    const s = l.trim();
    return s.startsWith("خيارات:") || s.toLowerCase().startsWith("options:");
  };

  const idx = [...lines].reverse().findIndex(isOptionsLine);
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
  const want = (marketMode === "on") || (marketMode === "auto" && isBusinessQuestion(text));
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

  // Flash أقل / Expert أكتر
  const max = mode === "expert" ? 9 : 4;
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
  if (/(عايز قرار|قولّي أعمل ايه|أعمل ايه|اختار)/i.test(t)) return "decisive";
  if (isBusinessQuestion(t)) return "market_brain";
  return "normal";
}

// “افتتاحية” مش محفوظة: ندي للموديل دور (مش نص)
// ونجبره يطلع افتتاحية مختلفة عن آخر مرة + مرتبطة بالسياق
function buildOpenerRule(lastOpener, vibeTag) {
  return `
[OPENER_RULE]
اكتب افتتاحية واحدة سطر واحد فقط.
الافتتاحية لازم:
- تكون جديدة (ممنوع تكرار افتتاحية آخر مرة: "${lastOpener || "—"}")
- مرتبطة بالسياق الحالي (tag=${vibeTag})
- من غير جملة محفوظة أو قالب مشهور
`.trim();
}

// Pattern routing (اختلاف الإيقاع)
function pickPattern(vibeTag, mode) {
  const base = {
    normal: "تفهّم سريع + Insight عملي + سؤال واحد أو Option.",
    fast_calm: "سطر تهدئة + Insight مختصر + قرار واحد.",
    reassure: "سطر احتواء + Insight صغير + سؤال واحد.",
    tough_love: "Reframe صريح بس لطيف + سبب واحد + اختبار صغير.",
    decisive: "قرار واحد واضح + سبب واحد + Option.",
    market_brain: "تشخيص سريع + مخاطرة + قرار واحد + Option.",
  }[vibeTag] || "Insight + سؤال واحد.";

  return mode === "expert"
    ? `${base} (Expert: 6–8 سطور، تحليل مركز، بدون تنظير).`
    : `${base} (Flash: 2–4 سطور).`;
}

// =====================================================================
// Tier Selection (token budgeting)
// =====================================================================
// Tier 0: Greeting/simple chat (~350 tokens) — Style + Language + Flow
// Tier 1: General conversation (~600 tokens) — + Mohamed + Opener + Pattern
// Tier 2: Expert/Market (~800–1200 tokens) — + Escalation + Market KB
function selectTier(mode, marketCards, isFirst, vibeTag) {
  if (mode === "expert" || (marketCards && marketCards.length > 0)) return 2;
  if (isFirst && vibeTag === "normal") return 0;
  return 1;
}

// =====================================================================
// System Prompt Builder (Tiered)
// =====================================================================
function buildSystemPrompt(ctx) {
  const {
    lang, dialect, mode, isFirst,
    lastOpener, vibeTag, patternRule,
    marketCtx, tier
  } = ctx;

  let langLock = "";
  if (lang === "en") {
    langLock = "LANGUAGE: English only. No Arabic.";
  } else {
    if (dialect === "egypt") langLock = "LANGUAGE: Arabic Egyptian (مصري). ممنوع إنجليزي.";
    else if (dialect === "gulf") langLock = "LANGUAGE: Arabic Gulf (خليجي أبيض). ممنوع إنجليزي.";
    else langLock = "LANGUAGE: Arabic colloquial (عامية بيضا). ممنوع إنجليزي.";
  }

  const flow = isFirst
    ? "أول تفاعل: افتتاحية + Insight + سؤال نية واحد."
    : "رد مختصر يزود وضوح/قرار.";

  const lengthRule = mode === "expert"
    ? "[LENGTH] 6–8 سطور (مركّز)."
    : "[LENGTH] 2–4 سطور.";

  // ── Tier 0: Core Style + Language + Flow ──
  const parts = [
    KB_STYLE_FULL_MIN,
    `[FLOW] ${flow}`,
    lengthRule,
    `[LANGUAGE_LOCK] ${langLock}`,
  ];

  // ── Tier 1+: Add Mohamed Brain + Opener + Pattern + Non-negotiables ──
  if (tier >= 1) {
    parts.splice(1, 0, KB_MOHAMED_FULL_MIN); // after style, before flow
    if (isFirst) {
      parts.push(buildOpenerRule(lastOpener, vibeTag));
    }
    parts.push(`[PATTERN] ${patternRule}`);
    parts.push(`[NON_NEGOTIABLES] ممنوع تكرار جمل/افتتاحيات | ممنوع كلام AI/Prompt/Model | Humor≤Level2 | نقد محمد≤Level1 | "أنا أشطر" مسموح بدون هز صورة محمد`);
  }

  // ── Tier 2: Add Expert Escalation + Market KB ──
  if (tier >= 2) {
    if (mode === "expert") {
      parts.push(`[ADVANCED_ESCALATION] لو السؤال ادفانسد: ادّي قرارك بثقة + سطر لطيف عن إن محمد ممكن يأكد. غيّر الصياغة كل مرة.`);
    }
    if (marketCtx) {
      parts.push(marketCtx);
    }
  }

  return parts.join("\n\n").trim();
}

// =====================================================================
// Gemini Call (join all parts)
// =====================================================================
async function tryGenerate({ model, apiKey, apiVersion, systemPrompt, messages, mode }) {
  const payload = {
    contents: normalizeMessages(messages),
    system_instruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: mode === "expert" ? 0.7 : 0.62,
      topP: 0.9,
      maxOutputTokens: mode === "expert" ? 900 : 520,
      // تقليل التكرار
      presencePenalty: 0.35,
      frequencyPenalty: 0.35,
    }
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
      details: "No valid Gemini API keys were found in Worker secrets.",
    };
  }

  const has429 = failures.some(f => f?.status === 429);
  const has404 = failures.some(f => f?.status === 404);
  const only429or404 = failures.every(f => f?.status === 429 || f?.status === 404);
  const all404 = failures.every(f => f?.status === 404);

  if (all404) {
    return {
      status: 500,
      error: "Upstream model misconfigured",
      details: "Configured model is not available for this API/project.",
    };
  }

  if (has429 && only429or404) {
    return {
      status: 429,
      error: "Upstream quota exceeded",
      details: has404
        ? "Gemini quota exceeded and failover model is invalid."
        : "Gemini quota exceeded on all configured keys.",
    };
  }

  return {
    status: 502,
    error: "Upstream AI unavailable",
    details: "Gemini upstream request failed.",
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
      const body = await req.json();
      const messages = normalizeIncomingMessages(body?.messages || []);
      const previousMeta = normalizeMeta(body?.meta);
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
          response: safetyClamp(extracted.cleaned),
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
      const wantsDeepAudit = /(audit|analyze|analysis|فحص|تحليل|قيم|تقييم|استشارة ادفانسد)/i.test(lastMsg);
      let expertUses = previousMeta.expert_uses || 0;

      let mode = "flash";
      const continueExpert = previousMeta.mode === "expert" && isSubstantive(lastMsg);

      if ((wantsDeepAudit || continueExpert) && expertUses < 2) mode = "expert";
      if (mode === "expert") expertUses += 1;

      // 4) Market toggle/cards
      const marketModePrev = previousMeta.market_mode || "auto";
      const marketMode = detectMarketToggle(lastMsg, marketModePrev);
      const marketCards = pickMarketCards(lastMsg, mode, marketMode);
      const marketCtx = buildMarketContext(marketCards);

      // 5) فلسفة الدهشة/الكاريزما
      const vibeTag = detectVibeTag(lastMsg);
      const patternRule = pickPattern(vibeTag, mode);

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
        patternRule,
        marketCtx,
        tier
      });

      const models = resolveModels(env);
      const apiVersion = resolveApiVersion(env);
      const selectedModel = mode === "expert" ? models.EXPERT : models.FLASH;

      // 7) Generate (failover)
      const keys = shuffle(GEMINI_KEY_POOL);
      let responseText = null;
      const upstreamFailures = [];

      for (const k of keys) {
        const apiKey = env[k];
        if (!apiKey) continue;
        const result = await tryGenerate({
          model: selectedModel,
          apiKey,
          apiVersion,
          systemPrompt,
          messages,
          mode
        });
        if (result?.ok) {
          responseText = result.text;
          break;
        }
        if (result) upstreamFailures.push(result);
      }

      const primaryOnlyQuota = upstreamFailures.length > 0 && upstreamFailures.every(f => f?.status === 429);
      const canTryFailover = !!models.FAILOVER && !primaryOnlyQuota;

      if (!responseText && canTryFailover) {
        for (const k of keys) {
          const apiKey = env[k];
          if (!apiKey) continue;
          const result = await tryGenerate({
            model: models.FAILOVER,
            apiKey,
            apiVersion,
            systemPrompt,
            messages,
            mode: "flash"
          });
          if (result?.ok) {
            responseText = result.text;
            break;
          }
          if (result) upstreamFailures.push(result);
        }
      }

      if (!responseText) {
        const classification = classifyUpstreamFailure(upstreamFailures);
        return json(
          {
            error: classification.error,
            details: `${classification.details} :: ${summarizeFailures(upstreamFailures)}`,
          },
          classification.status,
          corsHeaders
        );
      }

      // 8) Post process
      responseText = safetyClamp(responseText);
      const extracted = extractQuickReplies(responseText);

      // تخزين الافتتاحية اللي كتبها الموديل (أول سطر)
      const firstLine = (extracted.cleaned.split("\n")[0] || "").trim();

      return json({
        response: extracted.cleaned,
        meta: {
          ...previousMeta,
          worker_version: WORKER_VERSION,

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

          quickReplies: extracted.quickReplies,
        }
      }, 200, corsHeaders);

    } catch (err) {
      return json({ error: "System Busy", details: "Retrying neural link..." }, 503, corsHeaders);
    }
  }
};
