# Mobile Phase 1 Sprint Tasks

## Objective
Deliver a touch-playable Mobile Controls MVP that allows players to complete core levels using mobile input only.

## Sprint Window
- Suggested duration: 1 sprint (1-2 weeks)
- Priority: Highest

## Scope (Phase 1 Only)
- On-screen touch controls (left/right/jump/action)
- Input state handling for touch edge cases
- Basic touch-tuned gameplay forgiveness
- Minimal settings toggle for control overlay visibility

## Out of Scope
- PWA install flow
- Full HUD re-layout for small devices
- Broad performance tuning presets
- Accessibility expansion beyond basic control sizing baseline

## Ticket Breakdown

### MOB-101: Touch Input Mapping Layer
**Description**
Add a touch input layer that maps mobile gestures/buttons to existing gameplay actions:
- Move Left
- Move Right
- Jump
- Ability/Action

**Acceptance Criteria**
- Touch inputs drive the same action pipeline as keyboard controls.
- Multi-touch supports directional movement + jump/action combinations.
- Releasing touch clears the mapped action state immediately.
- No persistent/stuck movement after touch end or cancel.

**Estimate**
- 3 points

---

### MOB-102: On-Screen Control Overlay (Landscape)
**Description**
Render a mobile control overlay with thumb-friendly touch targets:
- Left/Right cluster on lower-left
- Jump/Action cluster on lower-right

**Acceptance Criteria**
- Controls are visible and reachable in landscape on common phone sizes.
- Tap targets are large enough for consistent thumb interaction.
- Overlay visual style does not fully block gameplay readability.
- Overlay hides when not on a touch-capable device (or when disabled).

**Estimate**
- 3 points

---

### MOB-103: Browser Gesture and Focus-Safe Input Handling
**Description**
Harden input behavior against mobile browser interruptions and gesture conflicts.

**Acceptance Criteria**
- Gameplay touch interactions do not trigger page scroll/zoom in active game area.
- Touch cancel events clear active control state.
- App focus loss (tab switch/app background) resets transient input safely.
- Resume does not replay stale input state.

**Estimate**
- 2 points

---

### MOB-104: Touch Forgiveness Tuning (MVP)
**Description**
Add minimal touch-focused platforming forgiveness to improve feel without changing level design.

**Acceptance Criteria**
- Jump buffer window is active and configurable.
- Coyote-time window is active and configurable.
- Baseline values improve missed-jump frustration on phone playtests.
- Keyboard feel remains effectively unchanged.

**Estimate**
- 2 points

---

### MOB-105: Mobile Control Overlay Toggle
**Description**
Add a simple toggle to show/hide on-screen controls.

**Acceptance Criteria**
- Toggle state updates immediately without reload.
- Default behavior is sensible for touch devices.
- Hidden overlay mode does not disable keyboard controls.
- Toggle state remains consistent during level transitions.

**Estimate**
- 1 point

---

### MOB-106: QA Matrix and Regression Pass (Phase 1)
**Description**
Execute a focused QA pass for touch controls and core gameplay reliability.

**Acceptance Criteria**
- Test pass completed on at least one Android Chrome device and one iOS Safari device.
- Core scenarios pass: move, jump, action, pause, restart, level transition.
- No blocker bugs for touch-only completion of early levels.
- Any known non-blockers are documented with severity and owner.

**Estimate**
- 2 points

## Dependencies and Order
1. MOB-101 (input mapping)
2. MOB-102 (overlay UI)
3. MOB-103 (focus/gesture hardening)
4. MOB-104 (touch forgiveness tuning)
5. MOB-105 (overlay toggle)
6. MOB-106 (QA/regression)

## Definition of Done (Phase 1)
- Player can complete core gameplay loop using touch controls only.
- No critical stuck-input or focus-resume issues.
- No major browser gesture conflicts during active play.
- Basic mobile test pass complete on Android + iOS.
- Known issues documented with clear follow-up ownership.

## Suggested QA Checklist
- [ ] Hold left/right continuously while tapping jump repeatedly
- [ ] Perform jump/action combos with two thumbs simultaneously
- [ ] Trigger touch cancel (system interruptions) and verify input reset
- [ ] Switch apps and return; ensure no stale movement/action state
- [ ] Rotate device during non-critical moments; verify stable controls
- [ ] Pause/resume and retry flow preserve reliable input behavior

## Risk Notes
- iOS Safari touch and audio lifecycle behavior may introduce edge cases.
- Small-screen thumb precision may require target-size tuning after initial playtests.
- Touch responsiveness expectations are higher than keyboard, so tuning must be test-driven.
