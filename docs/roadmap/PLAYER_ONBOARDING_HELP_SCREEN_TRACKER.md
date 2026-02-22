# Player Onboarding + Pause Help Screen Tracker

Last updated: 2026-02-22
Owner: Gameplay/UI
Status: Implemented (Polish Complete)

## 1) Initial Vision

Make the game friendlier for first-time players by introducing a strong, readable, 90s vaporwave help screen that appears immediately after starting from the title screen.

This screen should also serve as the in-game pause/help screen.

### Experience Goals

- New players see controls before gameplay begins.
- Any key closes onboarding help and starts/resumes play quickly.
- `P` always brings the help screen back during gameplay.
- Visual style feels distinctly retro-futuristic (90s vaporwave) while keeping text readable.

## 2) Confirmed Requirements

- After `START` on title screen, show help screen before active gameplay.
- Pressing any key on that help screen closes it and jumps into game.
- Pressing `P` in gameplay shows that help screen again (as pause/help).
- Help content must list all player-facing keys.
- Screen can replace the current pause panel.

## 3) Proposed Visual Direction (Concept 1)

Working concept: **Neon Boot Sequence**

- Full-screen overlay with scanline feel.
- Vaporwave palette: deep navy, magenta, cyan, sunset accents.
- Big heading + two-column control map.
- Bottom prompt: "PRESS ANY KEY TO DEPLOY".
- Reused in pause mode with pause context label.

## 4) Player-Facing Key List (to display)

Core movement and actions:

- Move: `Arrow Left/Right` or `A` / `D`
- Down: `Arrow Down` or `S`
- Jump: `Space` or `Arrow Up`
- Skills: `Q`, `W`, `E`
- Character switch: `1`, `2`

Game flow and utility:

- Pause/Help: `P`
- Restart level: `R`
- Prev/Next level: `N`, `M`
- Mute: `X`
- Music volume: `9` / `0`

Notes:
- Debug-only keys stay excluded from this player-facing screen.

## 5) Implementation Plan

### A. State + Input Flow

- [x] Add onboarding-help state transition after title `START`.
- [x] Gate gameplay start until any key confirms help screen.
- [x] Route `P` to open same help overlay while playing.
- [x] Make any key close overlay and resume gameplay.

### B. Rendering

- [x] Build reusable full-screen help/pause overlay renderer.
- [x] Apply vaporwave styling (grid/scanline/glow treatment).
- [x] Ensure readability and contrast on all backgrounds.

### C. Replace Existing Pause Panel

- [x] Retire current compact pause panel.
- [x] Use new help overlay as the only pause UI.

### D. QA + Docs

- [ ] Verify title -> help -> game flow.
- [ ] Verify in-game `P` open/close behavior.
- [ ] Verify every listed key is accurate to runtime inputs.
- [x] Update docs after implementation lands.

## 6) Progress Snapshot

- Vision defined: ✅
- Requirements captured: ✅
- Visual direction selected: ✅ (pending final approval)
- Code changes started: ✅
- QA started: 🟡 In progress (manual checks ongoing)

## 7) Decision Log

- 2026-02-22: Tracker created to establish baseline scope and implementation status.
- 2026-02-22: Preferred concept set to "Neon Boot Sequence" (can be changed before implementation).
- 2026-02-22: First pass implemented: START opens onboarding help, any key resumes, P opens same help as pause.
- 2026-02-22: Readability pass: switched pause/help overlay to regular fonts and higher-contrast colors.
- 2026-02-22: Layout polish: aligned control columns and shortened key labels to prevent overlap.
- 2026-02-22: Prompt polish: added solid footer rectangle + animated light sweep behind "PRESS ANY KEY" text.

## 8) Open Questions

- Should title `CONTINUE` also route through onboarding help (first time each session), or only `START`?
- Should audio/control utility keys (`X`, `9`, `0`) be grouped under an "Options" subsection visually?
- Do we want a tiny "PAUSED" label variant when opened from `P` so users understand context instantly?
