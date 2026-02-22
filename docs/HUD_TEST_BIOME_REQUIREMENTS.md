# HUD Test Biome — Requirements

## 1) Objective
Create a dedicated debug biome for testing and showcasing the redesigned HUD layout. Players can quickly access it to verify all HUD elements render correctly across different character states and ability statuses.

## 2) Scope
- Accessible via **'H' key** from any level.
- Displays all character types and their unique ability cooldown indicators.
- Demonstrates the **2-row HUD header** redesign.
- Non-progression level (does not affect campaign sequence).
- Minimal gameplay obstruction to focus on HUD visibility.

## 3) Definitions
- `HUD Test Biome`: Debug level themed in DAY, sequence 999, minimal enemies/platforms.
- `HUD Layer`: Top 26px bar containing score, lives, character name, level name, checkpoints, and ability status.
- `Right-aligned indicators`: Skill cooldown text, positioned at right edge (CANVAS_W - 6).
- `Left-aligned info`: Score, lives, level name, checkpoint counter, positioned at left edge.

## 4) Functional Requirements

### FR-1: Level Access
- Pressing **'H' key** during gameplay loads the HUD Test Biome.
- Triggers audio feedback: tone(740, 0.04).
- Displays notice: "HUD TEST BIOME" for ~1.5 seconds (90 frames at 60fps).
- Level load succeeds regardless of current level or character state.

### FR-2: Level Configuration
- Level name: "HUD TEST"
- Theme: DAY (default, light background for contrast)
- Sequence: 999 (debug/non-campaign)
- Minimal background actors: 1 balloon actor (non-interactive)
- Grid: Simple platformer with one main platform, minimal enemies (≤1 enemy to avoid distraction)
- Starting checkpoint at player spawn position

### FR-3: HUD Header Layout
The top 26px bar displays two rows:

**Row 1 (y=11):**
- Left: "SCORE <value>", "LIVES <value>"
- Center: "CHARACTER <name>"
- Right: Character ability status (e.g., "Q READY", "Q PULSE")

**Row 2 (y=23):**
- Left: "LEVEL NAME", "CP <active>/<total>"
- Right: Additional ability or status info (GLITCHRUNNER echo, SHADOWRUNNER skills, SKELETON coin counter)

### FR-4: Character State Visualization
All playable characters must be testable:
1. **ROBOT** — "Q PULSE" or "Q PHASE2" (depends on phase 2 unlock)
2. **RANGER** — "Q GRAPPLE" or "Q READY"
3. **BUNNY** — "Q ROCKET" or "Q x<charges>"
4. **DUCK** — "Q DIVE" or "Q AIR" (depends on grounded state)
5. **PALADIN** — "Q AEGIS" or "Q READY"
6. **NINJA** — "Q SHADOW" or "Q NEED <coins>" or "Q <cooldown>s"
7. **GLITCHRUNNER** — "Q PHASE" + "ECHO <status>" (2-line display)
8. **SHADOWRUNNER** — "Q FORK" + "1 SPIKE  2 SWARM" (2-line display)
9. **SKELETON** — "Q BURST" or "Q BLOOD+" (phase 2) + "COIN <current>/<threshold>"

### FR-5: HUD Sizing & Positioning
- Header background: 26px height (increased from 14px), semi-transparent dark "#0008"
- Font: 10px monospace (unchanged)
- Line spacing: Row 1 at y=11, Row 2 at y=23
- Text positioning: Left at x=6, right-aligned at CANVAS_W - 6 using `gfx.textAlign = "right"`
- Help menu: Repositioned to y=32+ to avoid overlap with expanded header

### FR-6: Transition & Visual Feedback
- Level transition must be smooth (no freeze or flicker).
- Notice message: Yellow/default text, centered, auto-dismisses after cooldown.
- HUD immediately shows correct state upon entry (score, lives, character).

## 5) Edge Cases & Validation

### E-1: Key Binding Conflict
If 'H' conflicts with other debug binds:
- Priority: 'H' for HUD Test loads immediately.
- Document as intentional override if needed.

### E-2: Level State Preservation
- Player retains current character selection.
- Player retains current score and lives.
- Checkpoints in HUD Test do not interfere with campaign progression.

### E-3: Audio/Feedback
- Tone generation must not fail; falls back gracefully if audio context unavailable.
- Notice timer must not exceed 150 frames (2.5 seconds max).

## 6) Testing Checklist

- [ ] 'H' key loads HUD Test Biome from any level
- [ ] Notification tone plays (740Hz)
- [ ] "HUD TEST BIOME" notice displays and auto-dismisses
- [ ] Top bar extends to 26px height
- [ ] Row 1: Score, Lives, Character Name visible
- [ ] Row 1: Ability status right-aligned
- [ ] Row 2: Level Name, Checkpoint counter visible
- [ ] Row 2: Secondary ability info displays correctly
- [ ] All 9 character types show correct ability text
- [ ] Cooldown counters update in real-time
- [ ] Help menu (H key) does not overlap expanded HUD
- [ ] Pause/notices positioned below header (y ≥ 36)
- [ ] Level is non-progression (does not advance campaign)
- [ ] Exiting via N/M keys works normally

## 7) Implementation Notes
- Level grid uses DAY theme palette and tile sprites.
- Minimal enemy count to reduce visual noise.
- Platform layout allows player movement and jumping to test HUD responsiveness.
- Level ends at checkpoint for quick respawn testing.
