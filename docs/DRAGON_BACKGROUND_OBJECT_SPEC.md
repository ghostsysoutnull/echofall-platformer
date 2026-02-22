# Dragon Background Object Spec

## Purpose

Define a reusable, high-detail pixel-art dragon object that currently appears as a distant background actor and can be evolved into:

- Additional background variants (theme-specific colors, size tiers, weather variants)
- Interactive entities (hazard actor, enemy, miniboss)

This document captures the current implementation behavior and formalizes a reusable pattern.

---

## Quick Copy Template

Use this section when you want to create another dragon-like background object fast.

### 1) Drop-in actor definition

```js
{
   type: "distantDragon",
   theme: "LIMINAL",
   x: 186,
   y: 24,
   vx: -0.07,
   parallax: 0.08,
   bobAmp: 0.8,
   bobSpeed: 0.022,
   w: 28,
   h: 12,
   scale: 1
}
```

### 2) Renderer skeleton (`drawBackgroundActor` branch)

```js
} else if (actor.type === "distantDragon") {
   const flap = ((Math.sin((actor.phase || 0) * 1.45 + this.player.anim * 0.05) + 1) * 0.5);
   const wingRise = (flap * 6) | 0;
   const wingDrop = ((1 - flap) * 5) | 0;
   const bodyY = sy + 6;

   const fireCycleFrames = 360;    // 6s at 60 FPS
   const fireActiveFrames = 180;   // 3s active, starts after 3s
   const fireFrame = this.player.anim % fireCycleFrames;
   const fireActive = fireFrame >= (fireCycleFrames - fireActiveFrames);
   const fireT = fireActive ? ((fireFrame - (fireCycleFrames - fireActiveFrames)) / fireActiveFrames) : 0;
   const firePower = fireActive ? (0.35 + Math.sin(fireT * Math.PI) * 0.65) : 0;

   // BODY + HEAD + WINGS (pixel rect layers)
   // - base silhouette pass
   // - mid-tone contour pass
   // - highlight pass
   // - upper wing pass using wingRise
   // - lower wing pass using wingDrop

   if (fireActive) {
      // Muzzle spark
      // Fragment cloud: small horizontal pieces that spread and vanish
      // for each piece:
      //   lifePhase = (fireT * speed) - perPieceOffset
      //   if (0 < lifePhase < 1):
      //     travel = lifePhase^2 * maxDist
      //     fade = 1 - lifePhase
      //     draw tiny 1-3 px streak in color by fade band
   }
}
```

### 3) Fast tuning checklist

- `vx`: left/right travel speed
- `parallax`: depth (lower = farther)
- `bobAmp`, `bobSpeed`: flight feel
- `fireCycleFrames`, `fireActiveFrames`: attack cadence
- `pieceCount`, `maxDist`, jitter: flame spread and density

---

## Current Implementation Summary

- Actor type: `distantDragon`
- Current usage: `TEST BIOME` background actor list
- Render location: `drawBackgroundActor(actor)` in `src/main.js`
- Movement update: `updateBackgroundActors()` in `src/main.js`

The dragon is currently **visual-only** (no collision, no gameplay damage).

---

## Actor Data Contract

A dragon actor follows the same background actor schema:

```js
{
  type: "distantDragon",
  theme: "LIMINAL",
  x: 186,
  y: 24,
  vx: -0.07,
  parallax: 0.08,
  bobAmp: 0.8,
  bobSpeed: 0.022,
  w: 28,
  h: 12,
  scale: 1,
  phase: <auto-assigned if omitted>
}
```

### Field meanings

- `x`, `y`: world-space anchor of actor sprite silhouette.
- `vx`: horizontal drift speed in world-space units/frame.
- `parallax`: camera multiplier for distant-depth feel; lower = farther.
- `bobAmp`: vertical sinusoidal movement amplitude.
- `bobSpeed`: bob/flap phase speed.
- `w`, `h`: logical size used for wrapping span and placement assumptions.
- `scale`: sprite scale (currently renderer uses pixel primitives directly, but field retained for consistency).
- `phase`: procedural phase offset for de-sync among multiple dragons.

---

## Motion Model

The actor combines three motion layers:

1. **World drift**
   - `x += vx`
   - Wrap around extended bounds (global background actor wrap logic)

2. **Parallax projection**
   - Screen X uses `cameraX * parallax`
   - Produces depth separation from foreground

3. **Vertical bob**
   - `sy = y + sin(phase) * bobAmp`

This creates a stable distant flight profile suitable for non-gameplay decoration.

---

## Visual Construction (Body Plan)

The dragon silhouette is built from manual pixel rectangles in layered passes.

### Layer groups

1. **Core body and neck**
   - Dark red base blocks
   - Mid-red contour strips
   - Brighter top highlights

2. **Head + snout + eye accent**
   - Dark snout and jaw chunks
   - Horn pixels
   - Single bright eye pixel for readability at distance

3. **Wing set A (upper/front)**
   - Broad plates with darker base
   - Mid-tone overlays
   - Animated by `wingRise`

4. **Wing set B (lower/rear)**
   - Secondary plates offset to imply layered anatomy
   - Animated by `wingDrop`

5. **Tail/spines/details**
   - Small spike pixels along dorsal line
   - Back silhouette accents

### Color palette intent

Current palette uses red-hue ranges:

- Very dark reds for silhouette mass
- Mid reds for form separation
- Warm reds/oranges for highlights and heat cues

This keeps contrast while preserving a distant-object look.

---

## Wing Animation Model

Wing animation derives from sinusoidal flap phase:

- `flap = (sin(phase * 1.45 + player.anim * 0.05) + 1) * 0.5`
- `wingRise = floor(flap * 6)`
- `wingDrop = floor((1 - flap) * 5)`

Interpretation:

- High `flap` raises upper wing layers and compresses lower layers.
- Low `flap` lowers upper layers and expands lower layers.
- Unequal rise/drop magnitudes avoid robotic symmetry.

---

## Fire Behavior Spec (Current)

### Timing

- Global cycle: `6s` (`360` frames at 60 FPS)
- Fire starts after `3s` (second half of cycle)
- Fire duration: `3s` (`180` frames)

Formally:

- `fireCycleFrames = 360`
- `fireActiveFrames = 180`
- `fireFrame = player.anim % fireCycleFrames`
- `fireActive = fireFrame >= 180`

### Emission style

Instead of a single flame tongue, fire is rendered as many micro-fragments:

- horizontal spread from mouth origin
- per-fragment life phase offset
- varying horizontal travel with easing
- tiny vertical jitter for turbulence
- color decay from bright yellow/orange to deep red
- fragment width shrinks as it fades
- pieces vanish naturally when life phase expires

### Fire visual stages

1. **Muzzle ignition** near mouth (small bright pixels)
2. **Mid-flight fragments** (orange-red streaks)
3. **Cooling tail fragments** (dark red embers)
4. **Dissipation** (width = 1 px, then gone)

---

## Reuse Rules for New Background Objects

Use this dragon as a reference template when creating other high-detail background creatures/vehicles.

### Required pattern

- Keep actor data contract fields (`x`, `y`, `vx`, `parallax`, `bobAmp`, `bobSpeed`, `w`, `h`, `phase`)
- Build visuals in clear layer groups (silhouette -> midtones -> accents -> FX)
- Drive motion from deterministic formulas (phase-based), not random per-frame noise
- Keep effect timing frame-based and loop-safe

### Performance guidelines

- Prefer small `fillRect` batches; avoid heavy per-frame path complexity
- Keep per-actor fragment counts moderate (dragon currently uses lightweight loops)
- Reuse `phase` and existing `player.anim` instead of introducing independent timers when possible

---

## Migration Path: Background Dragon -> Enemy/Threat

To evolve this into gameplay:

1. **Promote actor to game entity list**
   - Add world position, velocity, hitbox, health/state machine

2. **Add explicit state machine**
   - `IDLE`, `GLIDE`, `WINDUP_FIRE`, `FIRE`, `COOLDOWN`, `HIT`, `DEAD`

3. **Deterministic attack windows**
   - Reuse current `6s / 3s` pattern initially
   - Later bind to AI conditions (distance, LOS, phase)

4. **Collision integration**
   - Flame fragments become hazard projectiles/areas
   - Add player hit logic and damage tuning

5. **Telegraphing and readability**
   - Pre-fire glow/windup cues
   - Ensure visible attack cones independent of background contrast

---

## Tunable Parameters

### Motion

- `vx`: `-0.03` to `-0.14` (slow distant glide to strong traverse)
- `parallax`: `0.05` to `0.16` (far to mid-depth)
- `bobAmp`: `0.3` to `2.0`
- `bobSpeed`: `0.010` to `0.040`

### Scale/shape

- `w`, `h`: keep logical width near rendered footprint for clean wrapping
- Increase detail by adding silhouette layers before increasing effect count

### Fire

- `fireCycleFrames`: cadence of attacks
- `fireActiveFrames`: attack duration
- `pieceCount`: density of fragment cloud
- `maxDist`: horizontal spread
- `jitter amplitude`: turbulence
- color thresholds: cooling curve feel

---

## Variant Ideas

- **Storm Dragon**: cyan/white lightning embers, forked arc fragments
- **Ash Dragon**: ember-black core, smoky brown cooling particles
- **Neon Dragon**: magenta/cyan dual-tone with glitch stutter
- **Moon Dragon**: pale silhouette with low-contrast cold flame

Each variant should preserve the same actor contract and timing model for consistency.

---

## Acceptance Criteria (Background Version)

A dragon implementation is considered complete when:

- It reads clearly at distance as a dragon silhouette.
- Flight has layered motion (drift + parallax + flap/bob).
- Fire appears after delay, spreads horizontally in small pieces, and dissipates.
- Behavior loops smoothly without popping at cycle boundaries.
- Frame cost remains acceptable with multiple simultaneous actors.
