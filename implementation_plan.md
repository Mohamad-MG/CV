# implementation_plan.md

# Ultra 2026 CV Redesign

This document outlines the phased approach to redesigning the CV homepage into a "Luminous Void" Ultra 2026 experience.

## Phase 1: Foundation & "The Hook" (Completed)
- [x] **Concept**: "Luminous Void" - Focus on depth, typography, and negative space.
- [x] **Core Styling**: `ultra_2026.css` with Space Grotesk/Outfit fonts and new design tokens.
- [x] **Core Interaction**: `ultra_2026.js` scroll reveals and parallax.
- [x] **Structure**: `index_ultra_2026.html` skeleton.

## Phase 1.5: Calibration & Polish (Completed)
- [x] **Messaging Refinement**:
    - **Hero**: Changed subtitle to "From fragmented marketing efforts to revenue systems that scale."
    - **Evidence**: Added context to metrics (e.g., "with controlled CAC & attribution").
    - **Connection**: Added "Let’s talk systems, not services."
- [x] **Visual Depth**:
    - **Background**: Implemented `noise-overlay` for texture.
    - **Lighting**: Added 3 distinct `glow-orb` elements (Cyan, Deep Blue, White) with independent breathing animations.
    - **Parallax**: Updated JS to move orbs at different speeds for 3D depth.

## Phase 2: The Narrative (Next Steps)
We are now ready to fill the placeholders with targeted content.

### Upcoming Changes
#### [MODIFY] index_ultra_2026.html
- **01 / The Story**: Implement "From Campaigns to Systems" narrative.
- **02 / Strategic Arsenal**: Design "Frameworks" section (Growth Architecture, etc.).
- **03 / Vision 2026**: Add positioning content.

## Verification Plan
### Manual Verification
- **Visuals**: Check background noise visibility and orb movement smoothness.
- **Content**: Verify new subtitles and metric context lines appear correctly.
- **Responsiveness**: Ensure large typography scales down for mobile.
