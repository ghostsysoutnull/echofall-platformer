# Simulation Breach Production Spec

## 0) Goal

Create a new biome inspired by late-90s cyberpunk “simulated reality” aesthetics:
- dark city silhouettes
- green code-rain atmosphere
- glitching geometry
- high readability and fair platforming

This spec is implementation-ready for the current modular runtime (`src/main.js`, `src/core/*`, `src/levels/*`, `src/sprites/*`).

---

## 1) Biome Identity

### 1.1 Theme Name
- Internal theme id: `SIMBREACH`
- Display name examples:
  - `SIMULATION BREACH`
  - `CODEFALL DISTRICT`
  - `GLASS CITY`

### 1.2 Visual Pillars
1. **Code Rain**: vertical glyph streaks in distant background layers.
2. **Synthetic City**: hard-edged tower silhouettes and clean orthogonal forms.
3. **Glitch Interruptions**: subtle corruption pulses and scanline noise.
4. **Neon Guidance**: bright green/cyan affordances for safe routes.

### 1.3 Gameplay Feel
- Precision platforming with controlled pressure.
- Mid/high tempo movement; minimal blind hazards.
- Optional high-skill “glitch lanes” with better rewards.

---

## 2) Technical Scope

### 2.1 Runtime Compatibility
Use existing runtime markers and systems first; add minimal new logic only when needed.

Supported marker set (already available):
- Terrain/pickups: `. # B o O U T X C L H Q`
- Runtime markers: `S F E V W Y Z R N G K ! P D`

### 2.2 New Additions (Minimal)
Required:
- New level theme mapping entry: `SIMBREACH`
- Background branch in renderer for this theme
- Coin/1UP sprite routing for `SIMBREACH`

Optional (Phase 2+):
- “Glitch platform” behavior via existing portal or timed-state system reuse
- “Alert mode” enemy pressure multiplier in biome-specific windows

---

## 3) Art Direction

### 3.1 Palette Direction (using existing palette first)
Primary use (existing keys):
- `A` black, `J` dark gray for structures
- `L` neon green highlights
- `H` cyan accents
- `M` electric blue accent
- `B` white for telegraphs/readability

If adding a tiny extension palette, keep values close to existing contrast and avoid low-contrast neon-on-neon collisions.

### 3.2 Tile Language
- Solid A (`#`): dark matrix-metal block
- Solid B (`B`): variant with stripe/circuit inlay
- Cursed barrier (`C`): “encrypted wall” motif
- Lava (`L` tile-id route): use as “data burn” hazard visual variant

### 3.3 Background Actors (new sprites)
Recommended actor set:
- `codePillar` (tall vertical glyph slab)
- `droneBillboard` (floating ad panel)
- `scanTower` (slow parallax structural silhouette)
- `packetFlock` (small moving particles)

All actors should follow existing actor schema:
`{ type, theme, x, y, vx, parallax, bobAmp, bobSpeed, w, h, scale }`

---

## 4) Audio Direction

### 4.1 Music
Target mood:
- pulsed synthetic bass
- sparse percussive ticks
- drifting high-frequency texture

### 4.2 SFX
- pickups: short digital chirp variants
- hazards: clipped static crackle
- transitions/checkpoints: bit-crystal rise arpeggio

Implementation should reuse existing audio engine/tracks architecture in `audio/`.

---

## 5) Level Design Rules

### 5.1 Core Geometry
- Standard: 18 rows
- Recommended first rollout widths:
  - Intro level: 96 or 192
  - Main biome level: 384

### 5.2 Route Design
Per segment include:
- 1 safe route (mandatory)
- 1 optional risk lane (+2 to +4 coin-equivalent)
- 1 readability landmark every ~64 tiles

### 5.3 Fairness Constraints
- No unavoidable enemy-body collisions after blind drops.
- Mandatory hazards must be pre-telegraphed at least 12–16 tiles ahead.
- Keep “gotcha” density below one hard check per 24 tiles average in early segment.

---

## 6) Enemy & Hazard Profile

### 6.1 Baseline Roster
Use existing enemies with tuned composition:
- Ground: `E`, `K`, `!`
- Air pressure: `V`, `W`, `Y`
- Elite punctuation: `Z` (rare), `R` (very rare)

### 6.2 Distribution Guidance (384-wide)
- Segment 1 (0–95): low pressure, mostly `E` + light flyers
- Segment 2 (96–191): introduce `K` with shield timing checks
- Segment 3 (192–287): mixed aerial pressure + one elite event
- Segment 4 (288–383): denser cadence, but preserve one readable fallback route

### 6.3 Hazard Tone
- Prefer timing hazards (platform spacing + enemy sync) over pure one-shot traps.
- Use `C` barriers as optional route modifiers, not mandatory walls on first rollout.

---

## 7) Pickups & Economy

### 7.1 Reward Budget (384-wide target)
- coins (`o`): 36–54
- big coins (`O`): 6–10
- 1UP (`U`): 1–2
- relic (`T`): 1
- fairy/core relic (`X`/`M` style equivalent where applicable): 0–1

### 7.2 Placement Rules
- Reward player for route commitment, not random jumps.
- Big coin clusters should signal “advanced lane” intent.
- 1UP placement should be visible before commitment, not hidden off-camera.

---

## 8) Checkpoints, Light Zones, Portals

### 8.1 Checkpoints (for 384-wide)
Recommended:
- `xTile: 96` — "Act 2: Signal Drop"
- `xTile: 192` — "Act 3: Glass Corridor"
- `xTile: 288` — "Act 4: Core Access"

### 8.2 Light Zones
Use readable contrast islands where background is busiest:
- around each checkpoint and one midpoint per act

### 8.3 Portals
Optional:
- `P` section portal as skill shortcut
- `D` dimensional portal only if biome is meant as late-campaign crossover

---

## 9) First Release Level Blueprint

### 9.1 Level Entry
Add to `src/levels/game-levels.js`:
- `name: "SIMULATION BREACH"`
- `sequence`: place after `SPACE` or late-campaign
- `theme: "SIMBREACH"`
- `backgroundActors`: code/city actor set
- `checkpoints`, `lightZones`
- `grid`: static authored rows

### 9.2 Segment Intent
- **S1 (onboarding):** teach spacing + visual language
- **S2 (pressure):** add shielded worker timing
- **S3 (mix):** combine aerial and ground threats
- **S4 (finish):** crescendo + clear final flag approach

---

## 10) Implementation Plan

### Phase A — Theme Plumbing
- Add `SIMBREACH` theme mapping in constants/physics.
- Add background rendering branch in `src/core/background-render.js`.
- Route coin/1UP/tile variants in `src/core/theme-sprites.js`.

### Phase B — Art Integration
- Add sprites for new biome tiles/coins/1UP/background actors in `src/sprites/sprite-data.js`.
- Ensure palette consistency and readability.

### Phase C — Level Authoring
- Add first 384-wide level entry in `src/levels/game-levels.js`.
- Add checkpoints + light zones.
- Validate with `validateLevel()` in `src/levels/derived.js`.

### Phase D — Balance Pass
- Tune enemy/pickup density to hit targets below.
- Verify fair telegraphing and route readability.

### Phase E — Polish
- Add biome-specific notice strings if needed.
- Final pass on actor motion and contrast.

---

## 11) Balancing Targets

- First-clear completion: **5.5–8.0 min**
- Practiced completion: **3.8–5.5 min**
- First-clear deaths: **6–14**
- Practiced deaths: **1–4**

Ramp target:
- Act1 -> Act2: +15% interaction frequency
- Act2 -> Act3: +18% hazard overlap
- Act3 -> Act4: +20% sustained pressure

---

## 12) QA Checklist

Must pass before merge:
- No syntax/diagnostic errors.
- Theme resolves correctly (`SIMBREACH` branch active).
- Level validation passes (rows, spawn, flag, widths).
- No unresolved marker behavior.
- One safe path remains available in every segment.
- No visual readability failures under active effects.

---

## 13) Creative Guardrails

To stay legally/creatively safe while preserving tone:
- Do **not** use film names, character names, logos, or exact iconography.
- Use generic “simulation breach / code rain / digital city” terminology.
- Keep all art and audio assets original to this project style.
