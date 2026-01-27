# Mohamed Gamal CV Site

## Structure
- `index.html` - main site (English)
- `portfolio/` and `achievements/` - portfolio and achievements pages
- `assets/css/` - shared styles
- `assets/js/` - shared scripts (including the chat widget)
- `assets/docs/mohamed-gamal-cv.pdf` - downloadable CV
- `about-mo.gamal.md` - long-form bio copy
- `jimmy-worker.js` - Cloudflare Worker (engine + config in code)

## Architecture (Code-Configured)
- **Single Source of Truth**: All behavior lives inside `jimmy-worker.js`.
- **No Admin panel, no KV**: Fewer layers and fewer moving parts.
- **Policy Engine**: Enforces max lines + blocks AI mentions + emojis after the model responds.
- **Predictable Latency**: Waterfall with a fixed total timeout and no per-model retries.

## Endpoints
Public:
- `POST /chat`
  - CORS: `*`
  - Returns: `{ response, request_id }` even on errors

Health:
- `GET /health`
  - `config_loaded`
  - `provider_key_present` (booleans only)
  - `provider_in_use`

## Config Location
Edit the `CONFIG` object inside:
- `jimmy-worker.js`

Key fields:
- `system_prompt` (`{ ar, en }`)
- `verified_facts` (`{ ar, en }`)
- `contact_templates` (`{ ar, en }`)
- `identity_templates` (`{ ar, en }`)
- `fallback_messages` (`{ ar, en }`)
- `rules` (`{ max_lines, followup_questions, block_ai_mentions, block_emojis }`)
- `intent_rules` (`{ contact_keywords[], identity_keywords[] }`)
- `model_waterfall` (ordered list of `{ provider, model }`)
- `timeouts` (`{ total_ms }`)
- `temperature` (number)
- `limits` (`{ max_history, max_input_chars }`)

## Notes
- If provider key is missing, `/chat` returns the fallback message.
- Contact templates should not include emojis.
- Policy enforcement runs after the model response.

## Testing (post-deploy)
1) Run 3 requests (AR / EN / Contact).
2) Verify line limits, no AI mentions, no emojis.
3) Check `/health`.

## Repo hygiene (later)
- There are unrelated deletions/asset diffs in the repo. We will ignore them for now and run a cleanup sprint after the chat system stabilizes.

## Language notes
- Arabic pages: `portfolio/index-ar.html`, `achievements/index-ar.html`
- Home is currently English-only; update links if you add an Arabic home page later.
