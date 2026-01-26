# Mohamed Gamal CV Site

## Structure
- `index.html` - main site (English)
- `portfolio/` and `achievements/` - portfolio and achievements pages
- `assets/css/` - shared styles
- `assets/js/` - shared scripts
- `assets/docs/mohamed-gamal-cv.pdf` - downloadable CV
- `about-mo.gamal.md` - long-form bio copy
- `assets/captain-jimmy-prompt.txt` - Jimmy system prompt reference
- `jimmy-worker.js` - Cloudflare Worker (dynamic Jimmy config)
- `admin.html` - control panel (GitHub Pages)

## Architecture (Non-negotiable)
- Worker = engine only (routing, security, providers, normalization).
- No system prompt hardcoded in the Worker.
- On every `/chat` request, Worker loads KV config and builds:
  `system_prompt = system_role + "\n\n" + knowledge_base`.

## Endpoints
- `POST /chat`
  - Public
  - CORS: `*`
  - Reads KV on every request

- `GET /admin`
- `POST /admin`
  - Private
  - CORS allowlist: `https://emarketbank.github.io`
  - Authorization: `Authorization: Bearer ADMIN_TOKEN`
  - Origin not allowed → `403`
  - Missing/invalid token → `401`

## KV config
- Binding: `JIMMY_KV`
- Key: `jimmy:config`

Schema (JSON):
- `system_role` (string, required)
- `knowledge_base` (string, optional)
- `active_model` (string, optional: `gemini:<model>` or `openai:<model>`)
- `version` (number, optional)
- `updated_at` (ISO string, optional)
- `updated_by` (string, optional)

Active model is whitelisted. If value is not in allowlist, it is ignored and falls back to `PRIMARY_AI`.
You can override allowlist with `ALLOWED_MODELS` (comma-separated).

## Admin panel
- Hosted at: `https://emarketbank.github.io/CV/admin.html`
- Fields:
  - System Role / Instructions
  - Knowledge Base
  - Active Model (optional)
- Save writes directly to KV. Changes are live immediately.

## Behavior rules (write inside system_role)
- Responses are short.
- One follow-up question only.
- No contact suggestion unless the user asks.
- No hallucinated numbers or titles.
- Use KB facts only when directly relevant.

## System Role Template (Arabic)
أنت "جيمي" — المساعد الرسمي لمحمد جمال.
بتتكلم عربي مصري، هادي، مباشر، من غير تنظير.

قواعد الرد:
- 2 إلى 6 سطور فقط.
- سؤال متابعة واحد فقط في آخر سطر.
- ممنوع ذكر أي مزود/موديل/AI.
- ممنوع إيموجيز.
- ممنوع تقترح تواصل إلا لو المستخدم طلب صراحة.

قاعدة الحقائق:
- استخدم معلومات الـ Knowledge Base فقط لو السؤال له علاقة مباشرة.
- لو مش متأكد: قول "مش متأكد" واطلب معلومة واحدة.

## Knowledge Base Template (Arabic)
حقائق مؤكدة عن محمد جمال (استخدمها فقط عند الارتباط بالسؤال):
- [ضع الحقائق المؤكدة هنا بنقاط قصيرة]
- [أرقام مؤكدة فقط]

ممنوعات:
- أي منصب/رقم/إنجاز غير مؤكد.
- ممنوع ذكر كل الأرقام مرة واحدة.

## Testing (post-deploy)
- Run 3 requests (AR / EN / Contact) and review Worker logs.

## Language notes
- Arabic pages: `portfolio/index-ar.html`, `achievements/index-ar.html`
- Home is currently English-only; update links if you add an Arabic home page later.
