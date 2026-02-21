# SHADOWRUNNER ARCLOGY — PRODUCTION SPEC

## 0) Compatibility Matrix (Requested Vision)
- **Single long infiltration run, 5 acts, ~5x width:** **Implemented**
- **Urban arcology datavault at night + acid rain fantasy:** **Implemented**
- **Dark synthwave + broken-glitch pulses (explore vs alert layers):** **Implemented**
- **Visual palette charcoal + neon amber/lime + occasional magenta scans:** **Implemented**
- **Background set: billboards/trams/server spires/antenna forests/patrol drones/ad towers:** **Implemented**
- **Weather FX: acid drizzle + EM flicker + data-surge flashes:** **Implemented**
- **Act mechanics aligned to skill identity:** **Implemented (design intent)**
- **Two portal forks in exfil flow:** **Implemented**
- **Two optional high-risk data cache side pockets:** **Implemented**
- **Difficulty ramps via mechanic overlap, not HP spam:** **Implemented (design rule)**

## 1) Level Identity
- **Level Name:** SHADOWRUNNER ARCLOGY
- **Theme Key:** `SHADOWRUN`
- **Sequence Intent:** Late-game specialist stage focused on SHADOWRUNNER mastery.
- **Campaign Placement (current):** After `SIMULATION BREACH`, before `BONE CRYPT`.
- **Design Pillars:**
  - Cooldown sequencing over brute platforming.
  - Route pressure via portals and enemy lane control.
  - Neon cyber-noir atmosphere with environmental interference.

## 2) Player Fantasy
The player is infiltrating a corporate arcology datavault at night during acid rain. The level should feel like tactical breach-and-exfil under surveillance pressure, where combat is less brute platforming and more timing, routing, and burst-hacking windows.

## 3) Length & Structure
- **Total Length:** 5 segments (builder: `buildShadowrunnerArcology5xGrid()`)
- **Rows:** 18
- **Acts / Pacing Beats:**
  1. **Breach Entry** — onboarding, low-pressure combat lanes.
  2. **Firewall Lanes** — horizontal hazard timing and ranged picks.
  3. **Drone Nest** — clustered flyers and multi-angle pressure.
  4. **Black ICE Courtyard** — mixed heavy threats and trap cadence.
  5. **Core Exfil** — dimensional fork + final push to flag.

## 4) Character Focus
Primary target character is **SHADOWRUNNER**.
- Primary skill rhythm expects active use of:
  - `Q` = burst pressure opener.
  - `W` = line punish / lane clear (Zero-Day timing windows).
  - `E` = close-control / orbit denial (Rootkit area control).
- Secondary characters remain viable, but encounter spacing should reward SHADOWRUNNER timing windows.

> Note: Earlier concept drafts referenced `Q/1/2`; current live control scheme is `Q/W/E`.

## 5) Checkpoints & Recovery
- Checkpoints:
  - Act 1: Breach Entry
  - Act 2: Firewall Lanes
  - Act 3: Drone Nest
  - Act 4: Black ICE Courtyard
  - Act 5: Core Exfil
- Respawn lanes should avoid immediate unavoidable hits.
- On checkpoint recovery, give enough neutral ground for one decision cycle before next threat cluster.

## 6) Portals & Routing
- Section portals (`P`) are intentional route pivots.
- Dimensional portal (`D`) appears in late segment as high-variance option.
- Exfil presents **two portal fork decisions** before final push.
- Portal usage should create strategic tradeoffs:
  - Faster act progression vs. higher combat volatility.
  - Optional reroutes for score optimization.

## 7) Encounter Design Rules
- **Enemy Density Curve:**
  - Act 1 low, Act 2 medium, Act 3 high, Act 4 high+, Act 5 medium-high.
- **Threat Mix:**
  - Flyers for vertical pressure.
  - Walkers/advanced units for lane denial.
  - Limited heavy inserts for decision spikes.
- **Fairness Constraints:**
  - Avoid stacking unavoidable hazards over portals/checkpoint spawn.
  - Keep at least one readable safe lane in each major arena.

## 8) Visual Direction
- **Palette Mood:** dark navy base, amber/lime SHADOWRUNNER accents.
- **Background Actors (target stack):** hologram billboards, cable trams, server spires, rooftop antenna forests, patrol drones, rotating ad towers.
- **Current Actor Set:** hologram billboards, cable trams, server spires, rooftop antenna forests, patrol drones, rotating ad towers, geometric cyber artifacts.
- **Depth Behavior:** mixed parallax speeds to imply high-rise scale and traffic layers.
- **Readability Priority:** gameplay foreground contrast must remain stronger than decorative glow.

## 9) Weather & Ambient Effects
- **Primary Effect:** acid drizzle with neon edge highlights.
- **Secondary Effect:** intermittent EM interference flicker + subtle scanline horizon bands.
- **Tertiary Event:** lightning-like data surge flashes (digital, not natural storm).
- **Cadence:** continuous but low-alpha; never obscure hazards, portals, or enemy silhouettes.

## 10) Music Direction
- Target music direction: dark synthwave + broken-glitch pulses with low-bass exploration bed and high-arp alert escalations.
- Current implementation: bespoke SHADOWRUN profile with low-bass exploration bed, glitch texture layer, and alert stabs.
- Implementation note (2026-02-21): fixed SHADOWRUN delay-send routing (`aux.delay`) so level music initializes reliably, and bumped `audio/tracks.js` cache key in `game.html`.
- Music should communicate:
  - infiltration tension in traversal,
  - urgency escalation in dense arenas,
  - release in exfil corridor.

## 11) Technical Hooks (Current Implementation)
- Level definition: `src/levels/game-levels.js` (`SHADOWRUNNER ARCLOGY`, theme `SHADOWRUN`)
- Grid builder: `src/levels/builders.js` (`buildShadowrunnerArcology5xGrid`)
- Theme physics: `src/core/constants.js` (`PHYSICS_BY_THEME.SHADOWRUN`)
- Theme visuals:
  - `src/core/background-render.js`
  - `src/core/theme-sprites.js`
- Theme audio mapping: `audio/tracks.js`

## 12) Tuning Targets (Pass 1)
- Completion target (experienced player): 2.5–4.5 minutes.
- Expected deaths first blind run: medium-high (3–8).
- Portal usage target: at least one optional portal decision per run.
- Skill expression target: each SHADOWRUNNER skill should feel mandatory in at least one act.
- Optional side-objective target: two high-risk data cache pockets for score runners.

## 13) QA Checklist
- [ ] Level appears in level order and can be reached via normal progression.
- [ ] `Digit8` debug jump reaches level and auto-selects SHADOWRUNNER as intended.
- [ ] Checkpoint respawns never overlap immediate lethal collision.
- [ ] Portals do not self-loop unexpectedly.
- [x] Exfil includes two explicit portal fork choices.
- [ ] No unreadable overlap between weather FX and hazards.
- [ ] Audio theme switches correctly on level load.
- [ ] Character remains playable with non-SHADOWRUNNER picks.
- [x] Two optional high-risk data cache side pockets are reachable but dangerous.

## 14) Future Iteration Ideas
- Add optional “Data Cache” side pockets with risk/reward.
- Add act-specific mini-modifiers (temporary signal blackout zones).
- Add one bespoke enemy behavior tuned specifically for `W` line timing.
