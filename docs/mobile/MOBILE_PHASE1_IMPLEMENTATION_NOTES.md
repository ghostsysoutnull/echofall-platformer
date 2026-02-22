# Mobile Phase 1 Implementation Notes

## Purpose
Translate the Phase 1 sprint tickets into concrete implementation touchpoints for this codebase, without changing architecture more than necessary.

Related planning docs:
- `docs/mobile/MOBILE_DEVICE_ROADMAP.md`
- `docs/mobile/MOBILE_PHASE1_SPRINT_TASKS.md`

## Architecture Snapshot (Relevant to Phase 1)
- `src/main.js`
  - Owns input binding, game loop state, pause/transition state, and gameplay action handling.
  - Best location for touch state machine and action mapping integration.
- `src/core/hud-render.js`
  - Owns HUD/notices rendering.
  - Can host lightweight touch overlay rendering if kept minimal.
- `src/core/constants.js`
  - Holds gameplay and tuning constants (already includes jump/coyote constants).
  - Best place for touch tuning defaults and overlay sizing constants.
- `game.html`
  - Owns canvas shell and top-level page behavior.
  - Best place for viewport/safe interaction meta and touch-action defaults.

---

## Ticket-to-Module Mapping

### MOB-101 — Touch Input Mapping Layer

### Primary Touchpoints
- `src/main.js`

### Suggested Implementation Notes
1. Add a dedicated touch input state object on `Game` (separate from `keyDown`, but with controlled bridging).
2. Normalize touch intents into existing actions:
   - Left/Right movement intent
   - Jump press intent (edge-triggered)
   - Action/ability press intent (edge-triggered)
3. Keep action resolution in one place in the update loop so keyboard and touch share downstream behavior.
4. Ensure `touchend`/`touchcancel` clear all active touch intents.

### Integration Guardrails
- Do not fork movement physics for touch; only feed the same action pipeline.
- Prefer deterministic priority if both keyboard and touch are active.

### Validation Hooks
- Add temporary debug text/flags (if needed) to verify intent transitions under multi-touch.

---

### MOB-102 — On-Screen Control Overlay (Landscape)

### Primary Touchpoints
- `src/core/hud-render.js`
- `src/main.js`
- `src/core/constants.js`

### Suggested Implementation Notes
1. Define control geometry constants (button sizes, margins, cluster positions) in `constants.js`.
2. In `main.js`, resolve touch points against button hit zones and emit intents.
3. In `hud-render.js`, draw a minimal translucent overlay for buttons only when touch mode is active and enabled.
4. Keep rendering and hit testing driven by one shared geometry source to avoid drift.

### Integration Guardrails
- Preserve existing HUD notice readability; overlay should sit low and avoid top information lanes.
- Keep visual design minimal (no feature creep: no radial menus, no extra gesture UIs in Phase 1).

### Validation Hooks
- Visual check on narrow and wide landscape widths for overlap with player and hazard readability.

---

### MOB-103 — Browser Gesture and Focus-Safe Input Handling

### Primary Touchpoints
- `game.html`
- `src/main.js`

### Suggested Implementation Notes
1. Add/confirm mobile viewport and interaction-safe page behavior in `game.html`.
2. Ensure active gameplay surface suppresses unintended browser scroll/zoom interactions.
3. In `main.js`, centralize input reset on:
   - visibility/focus loss
   - pause transitions
   - level transitions where stale input is risky
4. Handle `touchcancel` as a first-class reset event.

### Integration Guardrails
- Prevent blanket passive behavior that blocks needed interaction handling.
- Keep page-level changes limited to game surface safety; avoid global browser behavior changes outside game context.

### Validation Hooks
- Manual scenario: app switch, return, immediate control input; no ghost movement.

---

### MOB-104 — Touch Forgiveness Tuning (MVP)

### Primary Touchpoints
- `src/core/constants.js`
- `src/main.js`

### Suggested Implementation Notes
1. Introduce touch-specific tuning values (or multipliers) for:
   - jump buffer
   - coyote time
2. Apply tuning conditionally when touch mode is active.
3. Keep defaults close to existing values; use minimal deltas first.
4. Include one internal place for tuning reads to avoid scattered magic numbers.

### Integration Guardrails
- Avoid changing global feel for keyboard users.
- Keep tunables explicit and reversible.

### Validation Hooks
- A/B quick test with same level segment: keyboard baseline vs touch-tuned behavior.

---

### MOB-105 — Mobile Control Overlay Toggle

### Primary Touchpoints
- `src/main.js`
- `src/core/hud-render.js`

### Suggested Implementation Notes
1. Add runtime toggle state on `Game` for overlay visibility.
2. Keep toggle behavior independent of input backend so external controls remain valid.
3. Ensure state survives level reload/reset paths in current session.
4. Surface minimal on-screen or settings-path feedback that toggle changed.

### Integration Guardrails
- No broad menu redesign in Phase 1.
- Do not block keyboard usage when overlay is hidden.

### Validation Hooks
- Repeated toggle across level changes and pause/resume cycles.

---

### MOB-106 — QA Matrix and Regression Pass

### Primary Touchpoints
- Test execution process + lightweight notes update in docs

### Suggested Implementation Notes
1. Run manual matrix from `docs/mobile/MOBILE_PHASE1_SPRINT_TASKS.md`.
2. Record pass/fail by scenario and device/browser.
3. Log known issues with severity:
   - Blocker: touch-only completion impossible
   - Major: frequent missed actions or sticky input
   - Minor: visual overlap/polish

### Integration Guardrails
- Keep scope to Phase 1 behavior only.
- Defer Phase 2+ findings unless they block MVP completion.

---

## Cross-Cutting State Rules
- Input reset must occur on all interruption boundaries.
- Touch and keyboard can coexist, but action resolution order must be deterministic.
- Overlay visibility state and touch capability state are separate concerns.

## Recommended Implementation Sequence (Code-Level)
1. Add touch state model in `src/main.js` (MOB-101 foundation).
2. Add shared control geometry constants in `src/core/constants.js`.
3. Add hit testing and intent mapping in `src/main.js`.
4. Add overlay rendering in `src/core/hud-render.js`.
5. Add focus/gesture hardening in `game.html` + input reset hooks in `src/main.js`.
6. Add tuning gates for touch forgiveness in `src/core/constants.js` + `src/main.js`.
7. Add overlay toggle state path in `src/main.js` and visibility use in `hud-render.js`.
8. Run QA matrix and document known issues.

## Definition of Done Checklist (Implementation View)
- [ ] Touch events map cleanly into existing action pipeline.
- [ ] Overlay buttons render and match hit zones.
- [ ] Focus loss and touch cancel always clear active input state.
- [ ] Touch tuning improves playability without keyboard regression.
- [ ] Overlay toggle works across pause/restart/level transitions.
- [ ] Android Chrome + iOS Safari sanity passes complete.

## Deferred to Phase 2+
- Safe-area-aware full HUD reflow
- Orientation prompt and portrait UX handling
- Performance tier controls and dynamic FX throttling
- Accessibility depth options (beyond Phase 1 baseline)
