# Mobile Device Roadmap

## 1) Goal
Enable a high-quality mobile play experience for this platformer in browser environments (Android Chrome, iOS Safari) without rewriting core gameplay.

## 2) Scope
- Touch-first controls that feel responsive and readable.
- Stable performance on mid/low mobile hardware.
- HUD/layout that remains usable on small screens and notched displays.
- Mobile-friendly session flow (quick retry, pause/resume robustness).

## 3) Non-Goals (for initial rollout)
- No native app store packaging in Phase 1.
- No major level/content overhaul solely for mobile.
- No advanced online features (cloud saves, accounts, matchmaking).

## 4) Success Criteria
- New players complete Level 1 on phone without external instructions.
- Controls are visible, legible, and do not obstruct critical action.
- Frame pacing remains stable during normal gameplay on representative devices.
- Audio and input recover correctly after tab/app interruptions.

## 5) Delivery Strategy
Ship in 4 phases, each with a playable checkpoint and explicit exit criteria.

---

## Phase 1 — Mobile Controls MVP (Highest Priority)

### Objectives
- Add touch controls equivalent to keyboard movement/jump/action.
- Ensure controls are reachable with thumbs in landscape play.
- Prevent accidental browser gestures from breaking gameplay flow.

### Features
1. On-screen control overlay:
   - Left: move left/right.
   - Right: jump + ability/action.
2. Input forgiveness tuned for touch:
   - Small jump buffer.
   - Small coyote-time window.
3. Touch-safe interaction behavior:
   - Ignore duplicate taps from multi-touch edge cases.
   - Lock control state while paused/transitioning.

### UX Requirements
- Large tap targets suitable for small screens.
- Minimal opacity so world remains visible.
- Optional toggle in settings/menu to hide overlay (for external controllers).

### Exit Criteria
- Core game is completable on touch-only input.
- No stuck input state when app focus changes.
- No accidental page scroll/zoom during active play area interaction.

### Estimated Effort
- Medium

---

## Phase 2 — Layout, HUD, and Screen Adaptation

### Objectives
- Keep gameplay readable on phone aspect ratios.
- Respect notches/safe areas and avoid control overlap with HUD/notices.

### Features
1. Responsive HUD scaling:
   - Dynamic text/layout scaling by viewport size.
   - Priority rules for what can collapse on smallest widths.
2. Safe-area handling:
   - Keep critical UI away from notches/home indicators.
3. Orientation policy:
   - Default to landscape.
   - Show a lightweight rotate prompt if portrait is detected.

### Exit Criteria
- HUD remains readable at common phone widths.
- Touch controls and HUD never overlap critical action indicators.
- Orientation transitions do not corrupt gameplay state.

### Estimated Effort
- Medium

---

## Phase 3 — Performance and Battery Optimization

### Objectives
- Maintain smooth frame pacing while reducing heat/battery drain.
- Preserve gameplay clarity while scaling down heavy effects.

### Features
1. Performance tiers (auto or manual):
   - High/Medium/Low visual presets.
2. Dynamic effect throttling:
   - Reduce particle density and expensive FX under load.
3. Mobile render safeguards:
   - Cap maximum render scale where needed.
   - Skip non-critical background detail on constrained devices.

### Exit Criteria
- Game remains playable without severe frame drops on target low-end device.
- Device heat increase is acceptable across a 10–15 minute session.
- Visual reductions do not hide hazards or break readability.

### Estimated Effort
- Medium to Large

---

## Phase 4 — Session Flow, PWA, and Polish

### Objectives
- Make the game feel app-like and resilient to real mobile usage patterns.

### Features
1. Short-session loop improvements:
   - Fast retry and fast level restart.
   - Clear continue/resume behavior after interruption.
2. PWA quality-of-life:
   - Installable experience.
   - Standalone/fullscreen-friendly presentation.
3. Accessibility pass:
   - Control size options.
   - High-contrast readability mode.
   - Optional reduced motion profile.

### Exit Criteria
- Interruption/resume works reliably (incoming notifications, tab switches).
- Installed experience launches cleanly and preserves settings.
- Accessibility settings produce visible and meaningful improvements.

### Estimated Effort
- Medium

---

## 6) Validation Matrix
Test each phase on at least:
- 1 low/mid Android phone (Chrome)
- 1 recent iPhone (Safari)
- 1 tablet class device (optional but recommended)

### Core Test Scenarios
- Start, pause, resume, and restart level.
- Repeated jumping and direction changes under pressure.
- Ability activation near screen edges.
- Device rotation and browser focus loss/restore.
- Audio continuity across tab/background transitions.

## 7) Risk Register
1. iOS audio unlock/focus quirks
   - Mitigation: strict user-gesture audio start and robust resume hooks.
2. Touch precision on dense platform sections
   - Mitigation: control sizing options + input forgiveness windows.
3. UI crowding on narrow screens
   - Mitigation: responsive HUD priority/collapse rules.
4. Performance cliffs from FX-heavy scenes
   - Mitigation: performance presets + dynamic FX throttling.

## 8) Suggested Order of Execution
1. Phase 1: Controls MVP
2. Phase 2: Layout/HUD adaptation
3. Phase 3: Performance tuning
4. Phase 4: PWA + polish/accessibility

## 9) Implementation Touchpoints (Planning Only)
Likely files/modules impacted during implementation:
- Input and game loop orchestration in src/main.js
- HUD/layout rendering in src/core/hud-render.js
- Shared constants and sizing in src/core/constants.js
- Entry shell / viewport behavior in game.html and index.html
- Player feedback and visual load balancing in src/core/fx-render.js

This section is informational only to guide planning and task slicing.
