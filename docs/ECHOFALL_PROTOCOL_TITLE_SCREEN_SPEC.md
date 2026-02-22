# ECHOFALL PROTOCOL — TITLE SCREEN SPEC

## 0) Compatibility Matrix (Requested Vision)
- **Brand title: `ECHOFALL PROTOCOL`:** **Approved**
- **Dark ruined skyline / cyber-noir mood:** **Target**
- **Subtle green echo-fire ambient layer:** **Target**
- **Large centered logo with glitch personality:** **Target**
- **Simple keyboard-driven main menu:** **Target**
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
- Prefer adding title-screen-specific render/update methods in `Game` class (`updateTitleScreen`, `drawTitleScreen`) and branch early in `step()`/`render()` when in `TITLE` state.

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
- [ ] Title appears on boot before gameplay.
- [ ] Logo remains centered at all supported window scales.
- [ ] Menu navigation wraps correctly (top/bottom).
- [ ] Confirm actions route to expected state.
- [ ] Green fire remains behind menu and never obscures selected option.
- [ ] Glitch flicker does not reduce title readability.
- [ ] Mute toggle works from title/options.
- [ ] No runtime errors when switching TITLE ↔ gameplay repeatedly.

## 12) Future Enhancements (Optional)
- Add animated subtitle variants per unlocked character.
- Add subtle “press start” pulse when idle.
- Add seed-based daily challenge quick entry.
- Add localized text table for menu labels.
