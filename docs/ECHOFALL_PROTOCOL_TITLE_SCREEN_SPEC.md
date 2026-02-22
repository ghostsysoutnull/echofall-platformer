# ECHOFALL PROTOCOL — TITLE SCREEN SPEC

## 0) Compatibility Matrix (Requested Vision)
- **Brand title: `ECHOFALL PROTOCOL`:** **Approved**
- **Dark ruined skyline / cyber-noir mood:** **Implemented (Iteration 1)**
- **Subtle green echo-fire ambient layer:** **Implemented (Iteration 1)**
- **Large centered logo with glitch personality:** **Implemented (Iteration 1)**
- **Simple keyboard-driven main menu:** **Implemented (Iteration 1)**
- **Retro readability first (pixel/mono style):** **Required**
- **Fast load, no blocking transitions:** **Required**

## 1) Screen Identity
- **Screen Name:** ECHOFALL PROTOCOL TITLE
- **Purpose:** Entry point before gameplay loop; establish tone and route to start/continue/options.
- **Design Pillars:**
  - Immediate identity (big, readable logo).
  - Atmosphere without hurting legibility.
  - Minimal friction to start playing.

## 2) Visual Direction
- **Backdrop:** dark layered skyline/ruin silhouettes with low-motion parallax.
- **Mood Lighting:** cyan + green accents over charcoal base.
- **Foreground FX:** faint scanline pass + drifting ember/fire particles.
- **Logo Treatment:**
  - Line 1: `ECHOFALL` (large, primary).
  - Line 2: `PROTOCOL` (smaller, tracking/spaced look).
  - Occasional micro-glitch flicker (short, infrequent, never unreadable).
- **Readability Rule:** menu text contrast must always exceed FX contrast.

## 3) Layout Blueprint (320x180 Canvas)
- **Top/Center Band:** title lockup centered horizontally.
- **Mid-Lower Band:** vertical menu stack centered.
- **Bottom Strip:** compact input hints and version string.

Suggested anchors:
- Logo origin: y ~ 38–56
- Menu origin: y ~ 108
- Footer hints: y ~ 170

## 4) Menu Structure (MVP)
- `START`
- `CONTINUE` (disabled/hidden if no progress)
- `LEVEL SELECT`
- `OPTIONS`

Navigation:
- `ArrowUp/ArrowDown` = move selection
- `Enter/Space` = confirm
- `Esc` = back (for submenus)

Selection styling:
- Selected item rendered as bracketed state: `[ START ]`
- Non-selected items plain text.

## 5) Ambient Animation Spec
### 5.1 Green Echo-Fire
- Spawn from lower screen edge in soft columns.
- Color range: mint/lime/emerald (no pure neon white for long duration).
- Motion: upward drift + slight lateral sway.
- Opacity: taper with height and life.
- Density should remain below UI-clutter threshold.

### 5.2 Glitch Flicker
- Trigger every ~2.5–5.0 seconds with random jitter.
- Duration 2–4 frames max.
- Affects logo only (position wobble, tiny channel split, or alpha stutter).

### 5.3 Background Movement
- Slow parallax silhouette drift (very low amplitude).
- No camera shake on title screen.

### 5.4 Rooftop Demo Runner (Title-Only)
- Add one small background "demo player" actor to illustrate gameplay on the title screen.
- Behavior loop:
  1. Spawn on rooftop lane and run horizontally.
  2. Jump between rooftop gaps with simple arc.
  3. Fall below skyline/floor line when missing the lane.
  4. Warp from lower screen back to rooftop start and repeat.
- Visual style:
  - Silhouette/pixel look matching title palette.
  - Optional tiny cyan/green warp flash on re-entry.
  - Must remain behind menu/logo readability priority.
- Scope constraints:
  - Title screen only (`TITLE` state), never active during gameplay.
  - Non-interactive actor (no collisions, no score/state side effects).
  - Keep subtle motion; actor should not compete with menu focus.
- Spawn density:
  - MVP: exactly 1 actor.
  - Optional later: max 2 actors with staggered phase.

## 6) Audio Direction
- **Ambient Bed:** low synth drone with sparse metallic pings.
- **UI SFX:**
  - Navigate: short data-blip tick.
  - Confirm: lower, fuller confirmation tone.
- **Mix Priority:** UI feedback must be clearly audible over ambient.

## 7) State & Flow
- New game state: `TITLE`.
- Initial boot path: `TITLE` → selection result.
- `START`: begins run from level 0 default setup.
- `CONTINUE`: restores most recent checkpoint/session state if present.
- `LEVEL SELECT`: opens existing level navigation screen or minimal selector.
- `OPTIONS`: audio + controls toggles.

## 8) Technical Hooks (Planned Integration)
- **Main loop / state routing:** `src/main.js`
- **HUD/text helpers reuse:** `src/core/hud-render.js`
- **Background drawing reuse:** `src/core/background-render.js`
- **Audio/UI SFX hooks:**
  - `audio/audio-engine.js`
  - `audio/sfx.js`

Implementation note:
- Iteration 1 uses title-screen-specific methods in `Game` class (`updateTitleScreen`, `drawTitleScreen`) and early branch in `step()`/`render()` when in `TITLE` state.
- Demo runner should be integrated into the same title pipeline (`updateTitleScreen` / `drawTitleScreen`) with isolated title-only state.

## 9) Performance Budget
- Maintain 60 FPS on baseline target machine.
- Title FX budget:
  - Fire particles: cap ~120–180 active.
  - Glitch pass: tiny O(1) overlay work per frame except glitch bursts.
- Avoid allocations in inner loops when practical.

## 10) Accessibility & UX
- Keep text size readable at integer canvas scaling.
- Respect mute toggle on title screen.
- Keyboard-only flow must be fully usable.
- If `CONTINUE` unavailable, show disabled style rather than dead action.

## 11) QA Checklist
- [x] Title appears on boot before gameplay.
- [x] Logo remains centered at all supported window scales.
- [x] Menu navigation wraps correctly (top/bottom).
- [x] Confirm actions route to expected state.
- [x] Green fire remains behind menu and never obscures selected option.
- [x] Glitch flicker does not reduce title readability.
- [x] Mute toggle works from title/options.
- [x] Game over flow returns to TITLE screen.
- [x] Return from game-over triggers title re-entry sting + logo pulse.
- [ ] Re-entry subtitle appears for ~1–2 seconds after game-over return.
- [x] Rooftop demo runner appears only in TITLE and loops run/jump/fall/warp.
- [x] Demo runner never overlaps critical menu readability zones.
- [ ] No runtime errors when switching TITLE ↔ gameplay repeatedly.

## 13) Iteration Log

### Iteration 1 — MVP Title Screen (Implemented)
**Implemented in code:**
- Added `TITLE` state routing in `Game.step()` / `Game.render()`.
- Added `drawTitleScreen()` and `updateTitleScreen()` in `src/main.js`.
- Added centered logo (`ECHOFALL` / `PROTOCOL`) with periodic glitch jitter.
- Added ambient green echo-fire particle layer.
- Added keyboard-driven menu with modes:
  - Main (`START`, `CONTINUE` disabled, `LEVEL SELECT`, `OPTIONS`)
  - Level select submenu
  - Options submenu (`MUTE`, `MUSIC`, `BACK`)
- Added title input handling with UI tones and boot-to-title flow.

**Deferred / next steps:**
- Validate repeated transitions TITLE ↔ gameplay with long runtime soak.
- Add true `CONTINUE` persistence source (save/checkpoint-backed).
- Consider background-render module reuse for title parallax unification.
- Add optional branded subtitle/credits line if desired.

### Iteration 2 — Post-Game-Over Routing Fix (Implemented)
**Implemented in code:**
- Fixed post-game-over reset flow to return to `TITLE` state instead of dropping directly into gameplay.
- Reset title-menu selection state after game-over reset for deterministic landing.

**Deferred / next steps:**
- `CONTINUE` remains intentionally deferred and still disabled until persistence is implemented.

### Iteration 3 — Title Re-entry Feedback (Implemented)
**Implemented in code:**
- Added post-game-over title re-entry sting (short layered tones) on first title update after reset.
- Added brief logo pulse/glow effect synced to re-entry to reinforce transition feedback.

**Deferred / next steps:**
- Optional: add a distinct re-entry subtitle line (e.g., “SYSTEM RECOVERED”) for 1–2 seconds.

### Iteration 4 — Re-entry Subtitle (Planned)
**Goal:**
- Add a distinct subtitle line on title re-entry after game-over (example: `SYSTEM RECOVERED`) for ~1–2 seconds.

**Acceptance criteria:**
- Subtitle only appears on title re-entry path (not on first boot).
- Subtitle fades/pulses without reducing menu readability.
- Subtitle auto-clears within ~1–2 seconds and does not block input.

**Notes:**
- Keep this additive to existing re-entry sting + logo pulse.

### Iteration 5 — Rooftop Demo Runner (Implemented)
**Implemented in code:**
- Added one title-only demo runner actor in `titleScreen` state.
- Implemented loop behavior: `run → jump → fall → warp` with automatic re-entry.
- Added subtle warp beam/flash and low-contrast silhouette rendering.
- Kept implementation isolated to title methods (`updateTitleScreen` / `drawTitleScreen`) with no gameplay coupling.

**Notes:**
- Runner is intentionally small/subtle to preserve menu and logo readability.

## 14) Next Steps (Priority)
1. **Iteration 4 implementation:** re-entry subtitle (`SYSTEM RECOVERED`) with timed fade.
2. **Stability pass:** validate repeated TITLE ↔ gameplay transitions for runtime safety.
3. **Continue system (deferred):** add persistence-backed `CONTINUE` and enable menu item.
4. **Polish:** optional subtitle variants/credits once flow is stable.

## 12) Future Enhancements (Optional)
- Add animated subtitle variants per unlocked character.
- Add subtle “press start” pulse when idle.
- Add seed-based daily challenge quick entry.
- Add localized text table for menu labels.
