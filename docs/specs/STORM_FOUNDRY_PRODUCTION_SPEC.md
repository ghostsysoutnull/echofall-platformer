# Storm Foundry — 6x Production Spec (v1)

Status: Authoritative implementation spec for the first 6x Storm Foundry level.
Scope: Level `STORM FOUNDRY` (`sequence: 10.3`, theme `STORMFOUNDRY`) and reusable variant templates.

---

## 1) 6x Production Geometry Spec

### 1.1 Width + Sectioning
- Exact width target: **576 tiles** (6 segments x 96 tiles each).
- Tile rows: **18**.
- Segment boundaries (inclusive):
  - Segment 1: `x=0..95`
  - Segment 2: `x=96..191`
  - Segment 3: `x=192..287`
  - Segment 4: `x=288..383`
  - Segment 5: `x=384..479`
  - Segment 6: `x=480..575`

### 1.2 Act Ranges + Progression Curve
- Act 1 — Intake Platforms: `x=0..95`
  - Goal: onboarding + readable cadence.
  - Threat density: low.
- Act 2 — Coil Gallery: `x=96..191`
  - Goal: introduce mechanic overlap one-at-a-time.
  - Threat density: low-medium.
- Act 3 — Furnace Spine: `x=192..287`
  - Goal: mixed hazard lanes + movement pressure.
  - Threat density: medium.
- Act 4 — Lightning Apex: `x=288..383`
  - Goal: burst windows and timing checks.
  - Threat density: medium-high.
- Act 5 — Overload Core: `x=384..575` (segments 5+6)
  - Goal: sustained pressure + final mastery checks.
  - Threat density: high.

Current authored Storm marker density (initial pass, by segment):
- Segment 1: 11 markers (`a`, `Ax2`, `=x6`, `Jx2`)
- Segment 2: 13 markers (`b`, `~`, `Ax2`, `=x6`, `Jx3`)
- Segment 3: 17 markers (`c`, `~`, `Ax3`, `=x9`, `Jx3`)
- Segment 4: 19 markers (`d`, `~x2`, `Ax3`, `=x9`, `Jx4`)
- Segment 5: 23 markers (`e`, `~x2`, `Ax4`, `=x12`, `Jx4`)
- Segment 6: 24 markers (`f`, `~x2`, `Ax4`, `=x12`, `Jx5`)

### 1.3 Checkpoints + Light Zones
- Checkpoint count: **5**.
- Checkpoint x positions:
  - CP1: `96`
  - CP2: `192`
  - CP3: `288`
  - CP4: `384`
  - CP5: `480`
- Light zone count: **6**.
- Light zones (x, width):
  - `(52,18)`, `(148,18)`, `(244,18)`, `(340,18)`, `(436,18)`, `(532,18)`.

---

## 2) Mechanic State Machines + Timing Rules

All timings are in frames at 60 FPS.

### 2.1 Energized Rails (Hazard Lanes)
- Purpose: periodic lane denial.
- States:
  - `OFF` -> `PREWARN` -> `ON` -> `COOLDOWN` -> `OFF`.
- Default timers:
  - `PREWARN`: 36
  - `ON`: 72
  - `COOLDOWN`: 48
- Damage model:
  - Touching active rail (`ON`) causes instant death.
  - Touching during `PREWARN` is safe.
- Stacking:
  - Multiple rails may be active, but max simultaneously active groups per act:
    - Act1: 1
    - Act2: 1
    - Act3: 2
    - Act4: 2
    - Act5: 3
- Fail state:
  - If timer data invalid (negative/NaN), force `OFF` for 120 frames and log one warning.

### 2.2 Arc Nodes (Rail Controllers)
- Purpose: orchestrate rail groups.
- States:
  - `IDLE` -> `CHARGING` -> `FIRING` -> `RECOVER` -> `IDLE`.
- Default timers:
  - `CHARGING`: 30
  - `FIRING`: 72 (matches rail `ON`)
  - `RECOVER`: 60
- Link behavior:
  - Each node controls one or more rail groups by `linkId`.
- Invalid link fail state:
  - If no valid target rails exist for node linkId, node enters `IDLE` and emits fallback spark VFX only (no hazard).

### 2.3 Spark Jets (Vertical/Horizontal Burst Emitters)
- States:
  - `WAIT` -> `PREWARN` -> `BURST` -> `WAIT`.
- Default timers:
  - `WAIT`: 84
  - `PREWARN`: 24
  - `BURST`: 18
- Burst properties:
  - Burst hitbox active only during `BURST`.
  - Hit causes instant death.
- Anti-chain rule:
  - Adjacent jets (`<= 8 tiles`) cannot burst on same frame unless during surge override.

### 2.4 Storm Surges (Global Modifier Window)
- Purpose: short global escalation phase.
- States:
  - `DORMANT` -> `PREWARN` -> `ACTIVE` -> `DECAY` -> `DORMANT`.
- Default timers:
  - `PREWARN`: 90
  - `ACTIVE`: 240
  - `DECAY`: 60
  - `BASE_COOLDOWN`: 600
- Effects while `ACTIVE`:
  - Rail `PREWARN` reduced by 25% (min 18).
  - Spark jet `WAIT` reduced by 20% (min 48).
  - Elite aggression multiplier: `1.20x`.
- Stacking rules:
  - No nested surges; triggering during `ACTIVE` or `DECAY` is ignored.
- Fail state:
  - If surge scheduler drift exceeds `+/-180` frames from planned cadence, resync at next checkpoint boundary.

---

## 3) Marker Grammar + Link Semantics

### 3.1 Existing markers (already implemented)
- Keep existing grammar unchanged (`S,F,E,V,W,Y,Z,R,N,G,P,D,L,C,o,O,U,T,X,H,Q,#,B,.`).

### 3.2 New Storm mechanic markers (reserved)
- `=` : Rail segment tile (non-solid hazard channel anchor).
- `A` : Arc node marker.
- `J` : Spark jet emitter marker.
- `~` : Surge trigger beacon marker.
- `a..f` : Rail link-id paint markers (optional inline linkage) where:
  - `a` => linkId `0`, `b` => `1`, ... `f` => `5`.

### 3.3 Pairing Rules
- Node-to-rail linkage:
  - Node (`A`) searches nearest reachable rail-id marker in same segment first.
  - If none found, expand to full act bounds.
- Jet linkage:
  - Jet (`J`) may optionally inherit nearest node linkId; otherwise standalone cycle.
- Surge triggers:
  - `~` activates only once when player enters trigger radius first time.

### 3.4 Invalid Link Fallbacks
- Node without rail target: visual-only spark pulses; no active hazard.
- Rail with no controller: runs local autonomous cycle (`PREWARN 30`, `ON 54`, `OFF 66`).
- Jet with bad orientation data: defaults to vertical up burst.
- Duplicate trigger beacons in same 12-tile window: keep first, disable others.

---

## 4) Telegraph + Readability Contract

### 4.1 Timing Telemetry
- Rails and jets must always provide prewarn >= 18 frames.
- Surge must provide prewarn >= 60 frames.

### 4.2 Color Language
- Safe/idle: desaturated steel-cyan (`low saturation`, low bloom).
- Prewarn: amber pulse (2-step blink at 6-frame cadence).
- Active danger: white-blue high intensity with edge flicker.
- Recover/cooldown: fading magenta-cyan residue.

### 4.3 Audio Cues
- Rail prewarn: 2-tone rising chirp.
- Rail active: sustained buzz layer (low volume loop).
- Jet prewarn: sharp crackle tick.
- Surge prewarn: global low rumble + 3 warning pings.
- Surge active start: single high-energy strike transient.

### 4.4 Visibility Under Storm Flash
- Rule: hazard silhouettes and prewarn overlays must remain visible during flashes.
- Minimum contrast rule: hazard telegraph alpha never below 0.72 during white flash frames.

---

## 5) Enemy Tuning Sheet (Per Act)

### 5.1 Spawn Budget (authored + injected total cap)
- Act1: max 6 active enemies, elite cap 0
- Act2: max 8 active enemies, elite cap 1
- Act3: max 10 active enemies, elite cap 2
- Act4: max 12 active enemies, elite cap 3
- Act5: max 14 active enemies, elite cap 4

### 5.2 Wave Density Target
- Act1: 1 encounter cluster / 24 tiles
- Act2: 1 / 20
- Act3: 1 / 18
- Act4: 1 / 16
- Act5: 1 / 14

### 5.3 Surge Aggression Modifiers
- During surge `ACTIVE`:
  - Walker turn latency: -15%
  - Flyer approach tolerance: +18%
  - Elite pursuit window: +20%

### 5.4 Anti-Overlap Constraints
- Never spawn more than:
  - 2 elites in same 24-tile horizontal window.
  - 1 elite directly above active rail lane within 8 tiles vertical offset.
- Do not schedule jet burst frame to coincide with first 12 frames after checkpoint respawn.

---

## 6) New Enemy: Shielded Worker (Spec)

### 6.1 Core Behavior
- Ground enemy with directional shield.
- Marker: reserved `K`.

### 6.2 State Machine
- `PATROL` -> `SHIELD_UP` -> `EXPOSED` -> `RECOVER` -> `PATROL`.
- Timers:
  - `SHIELD_UP`: 90
  - `EXPOSED`: 45
  - `RECOVER`: 36

### 6.3 Collision Rules
- Front hit while shield up: blocked (player bounce-back, no enemy damage).
- Stomp from above during `EXPOSED`: valid kill.
- Dash/Grapple counterplay:
  - Paladin dash breaks shield and forces `EXPOSED` for +30 frames.
  - Ranger grapple pull during `SHIELD_UP` rotates facing and enters `RECOVER`.

### 6.4 Stomp Windows
- Perfect stomp window: first 18 frames of `EXPOSED` grants +10 score bonus.

---

## 7) Reward Economy Targets

### 7.1 Per-Act Placement Targets
- Act1: coins 6-10, 1UP 1, relic 0
- Act2: coins 10-14, 1UP 1, relic 0-1
- Act3: coins 12-16, 1UP 1, relic 1
- Act4: coins 14-18, 1UP 1-2, relic 1
- Act5: coins 18-24, 1UP 2, relic 1-2

### 7.2 Risk/Reward Routes
- Each act must include at least one high-risk lane with:
  - +3 coin equivalent minimum over safe route.
  - At least one hazard timing commitment.

### 7.3 Score Scaling Expectations
- Target completion score ranges:
  - Clean conservative path: 220-320
  - Standard path: 320-450
  - Full risk route + perfect windows: 450-620

---

## 8) Relic Design: Conductor Core

### 8.1 Pickup Definition
- Marker: reserved `M`.
- Effect theme: temporary storm immunity + magnetized pickups.

### 8.2 Timings + Values
- Duration: 360 frames (6.0s)
- Cooldown before next spawn can activate: 480 frames
- Magnet radius: 42 px
- Magnet pull acceleration: 0.26 px/frame^2

### 8.3 Immunity Scope
- Grants immunity to:
  - Energized rail active damage
  - Spark jet burst damage
  - Surge electric overcharge damage
- Does not grant immunity to:
  - Lava (`L`) unless Paladin dash rules already allow.
  - Enemy body collision.

### 8.4 Skill Interactions
- Robot pulse active + Conductor Core:
  - Coin magnet strengths stack additively up to 1.6x cap.
- Paladin dash + Conductor Core:
  - Dash keeps cursed barrier break behavior unchanged.
- Ranger grapple + Conductor Core:
  - Grapple movement unchanged; only pickup magnetization added.

---

## 9) Failure + Respawn Design (Long 6x)

### 9.1 Checkpoint Safety Radius
- On checkpoint respawn, enforce temporary safety volume:
  - Radius: 12 tiles horizontally from checkpoint x.
  - Duration: 90 frames.
- Safety volume behavior:
  - Rails forced `OFF`.
  - Jets blocked from entering `BURST`.
  - Surge cannot transition to `ACTIVE`.

### 9.2 Hazard Reset Rules
- Respawn resets hazard state machines to deterministic baseline:
  - Rails -> `OFF` (`cooldown=30`)
  - Jets -> `WAIT` (`timer=42`)
  - Surge -> `DECAY` if active, else unchanged cooldown floor 180.

### 9.3 Persistence Matrix After Death
- Persists:
  - Activated checkpoint index
  - Collected permanent unlocks
  - Level-wide trigger disabled flags already consumed
- Resets:
  - Temporary relic effects (Conductor Core)
  - Active hazard phases
  - Non-permanent enemy states

---

## 10) Balancing Targets

- Intended first-clear completion time: **8.5-11.0 min**.
- Intended practiced completion time: **5.5-7.0 min**.
- First-clear death budget target: **10-18 deaths**.
- Practiced death budget target: **0-5 deaths**.

### 10.1 Difficulty Ramp Metrics
- Act1 -> Act2: +20% interaction frequency.
- Act2 -> Act3: +15% hazard concurrency.
- Act3 -> Act4: +18% elite pressure.
- Act4 -> Act5: +22% sustained hazard uptime and reduced recovery windows.

### 10.2 Phase 5 Tuning Profile (Pass 2)
- Applied per-act multiplier profile in `src/main.js` (`stormActTuning`) for rails/jets:
  - Act1 (`actIndex 0`): `prewarn 1.18x`, `on 0.84x`, `cooldown 1.18x`, `jet wait 1.18x`, `jet burst 0.90x`, `defer +8`.
  - Act2 (`actIndex 1`): `prewarn 1.10x`, `on 0.92x`, `cooldown 1.10x`, `jet wait 1.12x`, `jet burst 0.95x`, `defer +5`.
  - Act3 (`actIndex 2`): baseline `1.00x`.
  - Act4 (`actIndex 3`): `prewarn 0.96x`, `on 1.06x`, `cooldown 0.96x`, `jet wait 0.95x`, `jet burst 1.04x`, `defer -1`.
  - Act5 (`actIndex 4`): `prewarn 0.92x`, `on 1.10x`, `cooldown 0.90x`, `jet wait 0.90x`, `jet burst 1.08x`, `defer -3`.
- Surge elite aggression during `ACTIVE` remains `1.20x`.
- Goal of this pass: widen first-clear forgiveness in Acts 1-2 while preserving pressure curve in Acts 4-5 toward the **10-18** death budget target.

---

## 11) Overlap Priority/Limits (Critical Edge Cases)

When Surge + Rails + Elites overlap:
1. **Respawn safety lockout** (highest priority)
2. **Checkpoint trigger safety rules**
3. **Surge state transitions**
4. **Rail activation**
5. **Jet bursts**
6. **Enemy aggression modifiers**

Hard limits:
- Max concurrent lethal channels in same 16-tile window: **2**.
- Max elite units while >=2 lethal channels active in same window: **1**.
- If limit exceeded, defer newest hazard activation by 24 frames.

---

## 12) Content Pipeline for Future Storm Variants

### 12.1 Variant Authoring Template
- Required metadata:
  - `variantId`
  - `segmentCount`
  - `actRanges`
  - `checkpointDefs`
  - `lightZones`
  - `hazardProfile` (rails/jets/surge parameters)
  - `enemyBudgetProfile`
  - `rewardProfile`
- Required validation:
  - Exactly one `S` and one `F` after final normalization.
  - No unresolved link IDs.
  - Checkpoint x positions strictly increasing.

### 12.2 Reusable Parameter Profiles
- `storm_profile_easy`: reduced concurrency, longer prewarn.
- `storm_profile_standard`: values in this document.
- `storm_profile_hard`: shorter prewarn, higher elite cap, stricter overlap cap enforcement.

### 12.3 QA Checklist (Must Pass)
- Geometry width/rows correct.
- Marker grammar parse succeeds with zero unresolved links.
- Every act has at least one safe route and one risk route.
- Respawn safety radius verified.
- Overlap hard limits never exceeded in 10-minute soak test.

---

## 13) Implementation Phases (Recommended)

- Phase 1: marker grammar + parser + data structures (`=`, `A`, `J`, `~`, link ids). **Status: implemented in `src/main.js` loader/parser pass.**
- Phase 2: rail/node/jet state machines + telegraph VFX/audio. **Status: implemented in `src/main.js` runtime update/render paths (active with current initial marker pass authored in `src/levels/builders.js` Storm 6x generator).**
- Phase 3: surge scheduler + overlap limiter + checkpoint safety gating. **Status: implemented (core) in `src/main.js`: surge state machine, lethal-channel overlap cap/defer, respawn safety lockout radius + deterministic hazard resets.**
- Phase 4: shielded worker enemy + Conductor Core relic. **Status: implemented in `src/main.js` (marker parse + enemy FSM/counterplay + relic immunity/magnet effect) with authored placements in `src/levels/builders.js` Storm 6x generator (`K` + `M`).**
- Phase 5: tuning pass against balancing targets and death budget. **Status: in progress (pass 2) — calibrated per-act hazard multipliers applied in `src/main.js` (`stormActTuning`) with explicit Act1/2 forgiveness and Act4/5 pressure profile; surge elite aggression remains `1.20x`.**

This spec is designed to be directly mapped into `src/levels/*` marker data and `src/main.js` runtime systems.
