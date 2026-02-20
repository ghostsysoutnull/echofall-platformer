# Jungle: Ruin Ascent — Production Spec (v1)

Status: Authoritative hand-authored expansion spec for Jungle from 1x (96) to 4x (384).
Scope: New level variant based on existing `JUNGLE` theme and already-supported runtime markers/mechanics.
Constraint: **No procedural generation** for this level. Final grid is explicitly authored.

---

## 1) Geometry + Structure

### 1.1 Target Size
- Width: **384 tiles** (`4 x 96`)
- Height: **18 rows**
- Segment boundaries:
  - Segment 1: `x=0..95`
  - Segment 2: `x=96..191`
  - Segment 3: `x=192..287`
  - Segment 4: `x=288..383`

### 1.2 Core Rules
- Exactly one `S` spawn marker.
- Exactly one `F` goal marker.
- Keep base Jungle ground readability: frequent `#` floor continuity and visible platform landmarks (`B`).
- Preserve at least one safe traversal line per segment.

### 1.3 Segment Themes (hand-authored)
- Segment 1 — **Canopy Start**
  - Familiar onboarding and cadence from current 1x Jungle.
- Segment 2 — **Vine Lifts**
  - Higher vertical movement and mixed platform spacing.
- Segment 3 — **Ruin Crossing**
  - Mid-run pressure, denser enemy lanes, risk/reward coin arcs.
- Segment 4 — **Temple Approach**
  - Finale with layered threats, one optional shortcut, clear finish runway.

---

## 2) Progression Systems

### 2.1 Checkpoints
- Add 3 checkpoints:
  - `xTile: 96` — `Act 2: Vine Lifts`
  - `xTile: 192` — `Act 3: Ruin Crossing`
  - `xTile: 288` — `Act 4: Temple Approach`

### 2.2 Light Zones
- Add 4 light zones for readability and pacing:
  - `{ xTile: 52, widthTiles: 18 }`
  - `{ xTile: 148, widthTiles: 18 }`
  - `{ xTile: 244, widthTiles: 18 }`
  - `{ xTile: 340, widthTiles: 18 }`

---

## 3) Allowed Marker Set (Existing Runtime Only)

Use only markers already supported in `game.html`:
- Terrain/pickups: `. # B o O U T X C L H Q`
- Runtime markers: `S F E V W Y Z R N G P D`

Notes:
- `P` section portals are allowed for optional route compression.
- `C` cursed barriers are allowed as Paladin-specific route tools.
- No new parser/runtime markers are introduced by this spec.

---

## 4) Difficulty + Density Targets

### 4.1 Enemy Budget by Segment
- Segment 1: 4–6 active encounters (mostly `E`, occasional `V`)
- Segment 2: 6–8 encounters (add `W`, occasional `Y`)
- Segment 3: 8–10 encounters (mix `E/V/W/Y`, optional `Z`)
- Segment 4: 10–12 encounters (final mixed lanes, limited elites)

### 4.2 Pickup Economy by Segment
- Segment 1: coins 8–12, big coins 1–2, 1UP 1
- Segment 2: coins 10–14, big coins 2, relic 0–1
- Segment 3: coins 12–16, big coins 2–3, relic 1
- Segment 4: coins 14–18, big coins 3, relic 1

### 4.3 Risk/Reward Contract
- Every segment includes at least one optional high-risk lane worth +3 coin-equivalent over safe lane.
- Segment 4 includes one high-skill final pocket before `F` with clear telegraphing.

---

## 5) Enhancement Borrow List (From Existing Levels)

This 4x Jungle should reuse proven patterns already present in the project:
- **Checkpoint cadence + labels** style from larger campaign levels.
- **Light zone spacing** style from Storm/Gothic/BoneCrypt structures.
- **Portal optionality** (`P`) from dimensional/section traversal systems.
- **Cursed barrier side lanes** (`C`) as optional Paladin-enabled shortcuts.
- **Relic placement rhythm** (`T`/`X`) from advanced levels, but capped for Jungle readability.

---

## 6) Authoring Blueprint (Manual, Non-Procedural)

### 6.1 Grid Build Method
- Author full 18-row x 384-char static strings in `levels.js`.
- Build each row by explicit 4-part composition during editing:
  - `rowS1 + rowS2 + rowS3 + rowS4`
- Final committed content remains literal static rows (no generator function).

### 6.2 Segment Composition Guidance
- Segment 1 should preserve signature Jungle identity from current 1x.
- Segment 2 increases vertical traversal by spacing `B` islands and adding flyer lanes.
- Segment 3 introduces mixed lateral and vertical pressure with controlled density spikes.
- Segment 4 culminates with denser platform cadence and one alternate route choice.

### 6.3 Validation Checklist
- Each row length exactly `384`.
- `18` rows exactly.
- Exactly one `S` and one `F`.
- Checkpoints strictly increasing.
- No blocked critical path from `S` to `F`.

---

## 7) QA + Balancing Targets

- Intended first clear: **5.0–7.0 min**
- Practiced clear: **3.2–4.8 min**
- First-clear deaths: **4–10**
- Practiced deaths: **0–3**

### 7.1 Segment Ramp
- S1 -> S2: +15% interaction frequency
- S2 -> S3: +18% mixed-threat overlap
- S3 -> S4: +20% sustained pressure

### 7.2 Failure Rules
- No blind drops into unavoidable enemy-body collisions.
- Any mandatory jump over lethal hazard must have readable setup space.
- Optional high-risk lanes may be strict, mandatory path must remain fair.

---

## 8) Implementation Plan

- Phase A: Add new level entry (`JUNGLE: RUIN ASCENT`) with checkpoints/light zones and static 384 grid. **Status: implemented in `levels.js` as initial scaffold shell.**
- Phase B: Hand-author Segment 1 and Segment 2, validate traversal. **Status: implemented (first-pass enrichment in `levels.js`; tuning pass pending).**
- Phase C: Hand-author Segment 3 and Segment 4, validate pacing/route rewards. **Status: implemented (first-pass enrichment in `levels.js`; tuning pass pending).**
- Phase D: Tune enemy and pickup density to hit timing/death targets. **Status: implemented (first-pass pacing/density tuning in `levels.js`; playtest polish pending).**

This spec is designed for direct hand-authoring in `levels.js` with existing engine behavior only.
