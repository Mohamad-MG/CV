# TODO - Captain Jimmy Hardening (2026-02-15)

## In Progress
- [ ] Validate production behavior on deployed Worker after security hardening.
- [ ] Add optional server-side anti-bot gate (Turnstile or equivalent) before LLM call.

## Done In This Round
- [x] Added a practical implementation checklist with priority order.
- [x] Added runtime-configurable Worker endpoint resolution in `assets/js/jimmy-core.js`.
- [x] Tightened direct-route intent detection in `captain Jemy.js` to reduce accidental routing.
- [x] Improved Worker request validation (content type + payload size guard).
- [x] Improved rate-limit strategy with safer keys + retry-after metadata.
- [x] Refactored motion runtime for performance safety in `assets/js/home-main.js` (RAF throttle + layout caching + hidden-tab interval pause) without changing visual language.
- [x] Added opt-in motion profiler + structured boot pipeline in `assets/js/home-main.js` for measurable tuning across multiple contributors.

## Next
- [ ] Move static external UI assets that are performance-critical to first-party hosting.
- [ ] Add monitoring hooks (request IDs + upstream failure buckets) for incident tracing.
