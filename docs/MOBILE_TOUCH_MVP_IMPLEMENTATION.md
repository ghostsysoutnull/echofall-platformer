# Mobile Touch MVP — Implementation Notes

## Objective
Implement low-risk mobile controls for quick on-device playtesting while preserving desktop behavior.

## What Was Implemented

### 1) On-screen touch controls (MVP)
- Added an in-canvas control overlay for touch-capable devices:
  - Left / Right movement
  - Jump
  - Action (`Q` skill)
- Overlay is shown only when touch is available and touch controls are enabled.

### 2) Touch-to-existing-input mapping
- Touch controls write into the same `keyDown` input flags used by keyboard.
- Jump button sets jump buffer; action button triggers the same character skill activation path.
- This avoids introducing a parallel control pipeline.

### 3) Browser gesture hardening on gameplay surface
- Added viewport meta in `game.html` for mobile behavior.
- Added `touch-action: none` to the game canvas to reduce scroll/zoom gesture interference.
- Added touch event handlers with `preventDefault()` scoped to canvas interactions.

### 4) Touch-only jump forgiveness bump
- Added small touch-active boost for:
  - jump buffer frames
  - coyote time frames
- Boost activates only while touch input is recently active.
- Keyboard-only desktop sessions keep baseline values.

### 5) Safety resets for interruption edge cases
- Added input reset on:
  - window blur
  - visibility change away from visible
  - touch release/cancel synchronization
- Prevents sticky movement/jump states after interruptions.

### 6) Runtime toggle for touch HUD
- Added `T` key toggle for touch control overlay visibility.
- Shows on-screen notice (`TOUCH HUD: ON/OFF`).

### 7) Mobile audio unlock/resume
- On touch interaction, audio context is explicitly ensured/resumed.
- This addresses common mobile browser behavior where audio stays muted until a user gesture.

### 8) Fullscreen touch control
- Added `FS` touch button in overlay.
- Tapping toggles fullscreen when supported and shows status notice.
- If unsupported/blocked by browser, a notice is displayed.

### 9) Fullscreen touch alignment hardening
- Canvas transform is reset before drawing touch overlay.
- This keeps rendered button positions aligned with touch hit-testing in fullscreen and during gameplay transitions.
- Added fullscreen/orientation listeners to refresh canvas fit when display mode changes.

### 10) Title menu touch navigation
- Added title touch controls for full navigation:
  - `▲` / `▼` for vertical menu movement
  - `◀` / `▶` for horizontal choices
  - `OK` to confirm/select
  - `↩` to go back
- This enables title/options/level-select/jukebox navigation on touch devices.

## Desktop Impact
Expected desktop impact is minimal:
- Keyboard controls remain unchanged.
- Touch overlay is gated by touch capability and toggle state.
- Touch forgiveness bump is not active in normal keyboard-only usage.

## Files Changed
- `src/main.js`
  - Touch capability state
  - Touch overlay geometry/rendering
  - Touch event handling and mapping
  - Touch-only forgiveness helpers
  - Input reset hardening
  - `T` toggle handling
- `game.html`
  - Mobile viewport meta
  - Canvas `touch-action: none`

## Recommended Quick Validation
1. Desktop sanity:
   - Move/jump/skill/pause/restart still behave normally.
2. Mobile/touch sanity:
   - Overlay appears, controls respond, no page scroll during touch play.
3. Interruption sanity:
   - Switch app/tab and return; no stuck movement or held actions.
4. Character sanity:
   - Test `Q` skill on 2-3 characters from touch action button.

## Scope Notes
This MVP intentionally does **not** include:
- full HUD responsive reflow
- orientation prompts
- deep performance preset system
- expanded accessibility options

Those remain in later roadmap phases.

## Strategy Update (Fullscreen Hitbox Reliability)
- Replaced canvas hitbox interaction as the primary touch input path with a DOM-based touch UI layer (`#touch-ui`) pinned to viewport coordinates.
- Kept game input wiring centralized in `src/main.js` so DOM touch actions still drive the same gameplay/title input paths.
- Canvas touch hit-testing remains as fallback only when DOM touch UI is unavailable.

Why this strategy:
- Fullscreen and mobile browser UI changes can make canvas-space hit-testing brittle across devices.
- DOM controls tied to viewport coordinates are stable in fullscreen and avoid coordinate drift issues.
