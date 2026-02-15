# Motion Guardrails (Do Not Break Visual Language)

## Goal
Preserve the existing motion identity while improving runtime performance and maintainability.

## Non-Negotiables
- Keep the current visual rhythm, timing character, and reveal hierarchy.
- No motion feature removal unless explicitly requested.
- Any performance change must be behavior-preserving first, then measurable.

## Engineering Rules
- Prefer `requestAnimationFrame`-throttled handlers for pointer/scroll-driven effects.
- Cache layout reads (`getBoundingClientRect`) and refresh them on `resize/scroll`, not every pointer frame.
- Pause non-critical intervals/loops when the tab is hidden.
- Keep heavy effects disabled on `mobile-lite` and `prefers-reduced-motion`.
- Avoid adding global listeners without a clear need.

## Code Ownership Zones
- `assets/js/home-main.js`: motion orchestration and section-level interactions.
- `assets/js/nebula-background.js`: ambient canvas/neural background runtime.
- `assets/css/home-main.css`: motion styling, transitions, keyframes.

## PR Checklist (Motion Changes)
- [ ] Visual parity checked on desktop.
- [ ] Visual parity checked on mobile.
- [ ] No jank introduced during scroll/pointer interactions.
- [ ] Added/updated comments only where logic is non-obvious.
- [ ] No hardcoded environment values in motion runtime.

## Profiling Switch (Opt-In)
- Add `?mg_profile_motion=1` to the page URL, or set `localStorage.setItem('mg_profile_motion','1')`.
- Inspect `console` tables under `[MG]` groups for boot timing and 8s runtime counters.
