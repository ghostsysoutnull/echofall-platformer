# Level Overview (Full Reference)

This document is a source-of-truth style overview of all current levels and level-facing systems:
- theme visuals and color direction
- coin / 1UP sprite routing
- background actors
- enemies and marker-driven behavior
- special items, portals, and effects
- per-level inventories

All values here are based on current `levels.js`, `game.html`, and `sprites.js`.

---

## 1) Global Tile / Marker Legend

### Terrain + Pickups (tile grid chars)
- `.` = empty space
- `#` = solid terrain A
- `B` = solid terrain B (alternate block)
- `L` = lava hazard tile (kills player unless Paladin dash is active)
- `C` = cursed barrier (solid; breakable by active Paladin dash)
- `o` = coin (+1)
- `O` = big coin (+10)
- `U` = 1UP
- `T` = relic cross (+20)
- `X` = shiny bat relic (activates bat companion)
- `H` = help block bottom (unused)
- `Q` = help block top (unused)

### Runtime markers (parsed, then removed from collision grid)
- `S` = spawn
- `F` = goal flag marker
- `E` = walker enemy (`type:0`)
- `V` = flyer enemy type 1
- `W` = flyer enemy type 2
- `Y` = flyer enemy type 3 (ghost-like fallback flyer pattern)
- `Z` = vampire (`type:4`)
- `R` = giant vampire (`type:5`)
- `N` = bone wisp (`type:6`)
- `G` = crypt harbinger (`type:7`)
- `P` = section portal
- `D` = dimensional portal

---

## 2) Enemy Roster + Behavior

### Ground
- `type 0` (marker `E`): walker. Patrols ground, turns at ledges/walls.

### Air (non-space behavior)
- `type 1` (marker `V`): bat-like flier, horizontal sweep + sine bob.
- `type 2` (marker `W`): falcon-like flier, horizontal drift + bob/dip.
- `type 3` (marker `Y`): ghost-style looping flyer motion.
- `type 4` (marker `Z`): vampire hunter pattern + blood trail.
- `type 5` (marker `R`): giant vampire variant (larger, heavier swoop), drops special 1UP reward on defeat.
- `type 6` (marker `N`): bone wisp, fast wave motion + wisp trails.
- `type 7` (marker `G`): crypt harbinger, slower pulse/hunt motion + sigil trails.

### Air (SPACE behavior override)
In `SPACE`, air types switch to more tracking-heavy behavior (lane tracking, target-leading, and swarm spacing separation). Thruster VFX are drawn for flying enemies in this theme.

---

## 3) Theme Visual / Physics / Sprite Routing

## Palette key (global sprite palette)
- `A #000000`
- `B #ffffff`
- `C #e23b3b`
- `D #3bd16f`
- `E #2f6cff`
- `F #f3d44a`
- `G #ff55d6`
- `H #4ef3ff`
- `I #b5b5b5`
- `J #4a4a4a`
- `K #ff8a2a`
- `L #7dff3b`
- `M #63b5ff`
- `N #ff7fb5`
- `O #2cffb0`
- `P #7a4b2a`

### Theme mapping summary
- `DAY`
	- Physics: gravity 0.35, ground friction 0.80, air friction 0.94
	- Coin sprites: `coinDay`, `coinDayBig`
	- 1UP sprite: `oneUpDay`
	- Background style: bright blue sky + cloud bands

- `AFTERNOON`
	- Physics: 0.35 / 0.81 / 0.94
	- Coin sprites: `coinAfternoon`, `coinAfternoonBig`
	- 1UP sprite: `oneUpAfternoon`
	- Background style: warm sunset sky + layered city silhouettes

- `JUNGLE`
	- Physics: 0.34 / 0.83 / 0.95
	- Coin sprites: `coinJungle`, `coinJungleBig`
	- 1UP sprite: `oneUpJungle`
	- Background style: dense green canopy layers + vine silhouettes

- `FACTORY`
	- Physics: 0.35 / 0.82 / 0.95
	- Coin sprites: `coinFactory`, `coinFactoryBig`
	- 1UP sprite: `oneUpFactory`
	- Background style: orange sky + dark machinery strata

- `CASTLE`
	- Physics: 0.35 / 0.80 / 0.94
	- Coin sprites: `coinCastle`, `coinCastleBig`
	- 1UP sprite: `oneUpCastle`
	- Background style: cool stone skyline + battlement silhouettes

- `ICE`
	- Physics: 0.30 / 0.95 / 0.97 (floatier + slippery)
	- Coin sprites: `coinGem`, `coinGemBig`
	- 1UP sprite: `oneUpIce`
	- Background style: icy blue gradients + crystal-like forms

- `VOLCANO`
	- Physics: 0.36 / 0.80 / 0.94
	- Coin sprites: `coinVolcano`, `coinVolcanoBig`
	- 1UP sprite: `oneUpVolcano`
	- Background style: deep crimson/purple + ember streaks

- `STORMFOUNDRY`
	- Physics: 0.35 / 0.81 / 0.95
	- Coin sprites: `coinStormFoundry`, `coinStormFoundryBig`
	- 1UP sprite: `oneUpStormFoundry`
	- Background style: steel storm sky + electric pulse flashes + industrial silhouettes

- `SKYRUINS`
	- Physics: 0.33 / 0.83 / 0.95
	- Coin sprites: `coinSkyRuins`, `coinSkyRuinsBig`
	- 1UP sprite: `oneUpSkyRuins`
	- Background style: pale sky + suspended ruin columns

- `JAPAN`
	- Physics: 0.34 / 0.82 / 0.95
	- Coin sprites: `coinJapan`, `coinJapanBig`
	- 1UP sprite: `oneUpJapan`
	- Background style: moonlit indigo + sakura-like particles + layered architecture

- `HORROR`
	- Physics: 0.34 / 0.81 / 0.95
	- Coin sprites: `coinHorror`, `coinHorrorBig`
	- 1UP sprite: `oneUpHorror`
	- Background style: dark moonlit purple + haunted silhouettes

- `BONECRYPT`
	- Physics: 0.34 / 0.82 / 0.95
	- Coin sprites: `coinBone`, `coinBoneBig`
	- 1UP sprite: `oneUpHorror` (shared)
	- Tile style: uses horror tile family
	- Background style: crypt night palette + moon + cemetery strata
	- Special weather: mid-zone-only rain, drifting cloud layers, occasional lightning flash

- `GOTHIC`
	- Physics: 0.33 / 0.83 / 0.95
	- Coin sprites: `coinGothic`, `coinGothicBig`
	- 1UP sprite: `oneUpGothic`
	- Background style: cathedral dusk palette + moon + stained-light accents

- `GEOMETRYDREAM`
	- Physics: 0.32 / 0.84 / 0.96
	- Coin sprites: `coinGeometryDream`, `coinGeometryDreamBig`
	- 1UP sprite: `oneUpGeometryDream`
	- Background style: neon grid + deep parallax planes + chroma points
	- Portal config: auto section portals + dimensional portal fallback if not authored in-grid

- `NITE`
	- Physics: 0.35 / 0.80 / 0.94
	- Coin sprites: `coinDay` fallback family
	- 1UP sprite: `oneUpNite`
	- Background style: night sky stars + moon + dark skyline silhouettes

- `SPACE`
	- Physics: 0.28 / 0.84 / 0.96 (lowest gravity)
	- Coin sprites: `coinGem`, `coinGemBig`
	- 1UP sprite: `oneUpSpace`
	- Background style: starfield + planetary body + layered deep-space bands

---

## 4) Special Items + Effects

- Relic Cross (`T` / tile id 13)
	- Score reward: +20
	- Uses `relicCrossSmall` sprite

- Shiny Bat Relic (`X` / tile id 14)
	- Activates bat companion orbit attack/collector system
	- Uses `shinyBatRelic` sprite

- 1UP (`U` / tile id 6)
	- Adds one life
	- Triggers radial burst particles/jingle

- Help blocks (`H` + `Q`)
	- Trigger once per block key
	- Convert to used-state tiles (`h`,`q`) and emit debris
	- Show help HUD message timer

- Portals (`P` / `D`)
	- Section portal: intra-level movement, optional character shift
	- Dimensional portal: can jump to random non-geometry level
	- Portal notice text shown in HUD

- Checkpoints
	- Defined per-level via `LEVEL_CHECKPOINTS`
	- Trigger visual checkpoint rain burst + audio cue

- BONECRYPT weather
	- Mid-map zone only (30%..70% width)
	- Rain particles + cloud drift + random lightning flashes

---

## 5) Background Actors by Type (quick reference)

- Air/sun themes: `balloon`, `blimp`, `airplane`, `zeppelin`, `bird`
- Nature/industrial: `ruinsSilhouette`, `vineSway`, `canopyBird`, `railCrates`, `cableGondola`, `cargoDrone`
- Castle/gothic/horror: `drawbridgeLift`, `tornBanner`, `raven`, `cathedralSpire`, `roseWindow`, `gargoylePerch`, `hauntedMansion`, `graveGate`, `ghostLantern`, `batSwarm`
- Elemental/sci-fi: `frostyBalloon`, `iceShard`, `snowOwl`, `ashBlimp`, `rockChunk`, `emberWisp`, `moonBalloon`, `shootingGlider`, `stationShuttle`, `debrisTug`, `antennaDrone`
- Storm Foundry set: `teslaPylon`, `chainCrane`, `sparkVent`, `rotatingRingCoil`
- Japan: `japanPagoda`, `toriiGate`, `paperKite`
- Geometry dream set: `geoWireCube`, `geoPolyShard`, `geoGridPlane`, `geoMirrorDoor`, `geoOrbitRune`, `geoChromaprism`, `geoFluxLens`

---

## 6) Per-Level Breakdown (in sequence order)

Each line includes sequence, theme, width, checkpoints/light-zones, authored actor set, and marker inventory.

### 1) DAY
- Theme: `DAY`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `balloon`, `blimp`
- Marker inventory: `o:6, U:1, E:3, B:30, H:1`
- Notes: clean onboarding lane; no portal markers; no elite flyers

### 1.5) AFTERNOON
- Theme: `AFTERNOON`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `airplane`, `zeppelin`, `bird`
- Marker inventory: `o:55, O:7, E:3, V:1, B:65, H:1`
- Notes: high coin density + first explicit flying pressure marker (`V`)

### 2) JUNGLE
- Theme: `JUNGLE`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `ruinsSilhouette`, `vineSway`, `canopyBird`
- Marker inventory: `o:8, U:1, E:3, B:48, H:1`
- Notes: moderate enemy load with traversal-focused platforms

### 3) FACTORY
- Theme: `FACTORY`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `railCrates`, `cableGondola`, `cargoDrone`
- Marker inventory: `o:12, U:3, E:4, B:54, H:1`
- Notes: higher walker count and additional 1UP opportunities

### 4) CASTLE
- Theme: `CASTLE`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `drawbridgeLift`, `tornBanner`, `raven`
- Marker inventory: `o:7, U:1, E:3, V:1, B:21`
- Notes: first castle mood shift and castle enemy art variants

### 5) ICE
- Theme: `ICE`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `frostyBalloon`, `iceShard`, `snowOwl`
- Marker inventory: `o:9, U:1, E:2, B:42`
- Notes: lower gravity + high friction movement profile

### 6) VOLCANO
- Theme: `VOLCANO`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `ashBlimp`, `rockChunk`, `emberWisp`
- Marker inventory: `o:5, U:1, E:2, V:2, L:30, B:51`
- Notes: heavy lava usage (`L`) and mixed air pressure

### 6.5) SKY RUINS
- Theme: `SKYRUINS`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `skyRuins`, `grappleSpire`, `chainBird`
- Marker inventory: `o:9, O:2, U:1, E:1, V:1, W:1, Y:1, B:69, H:1`
- Notes: multi-flyer mix (`V/W/Y`) tuned to aerial routing

### 7) NITE
- Theme: `NITE`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `moonBalloon`, `shootingGlider`, `firefly`
- Marker inventory: `o:8, U:1, E:3, B:42`
- Notes: classic night pacing before saga-length maps

### 7.5) MOONLIT MATSURI
- Theme: `JAPAN`
- Width: 192
- Checkpoints: 0 | Light zones: 0
- Background actors: `japanPagoda`, `toriiGate`, `paperKite`
- Marker inventory: `o:21, O:3, U:1, E:9, V:6, W:4, Y:4, B:96, H:1`
- Notes: first extended run; broad enemy/coin density ramp

### 8) SPACE
- Theme: `SPACE`
- Width: 96
- Checkpoints: 0 | Light zones: 0
- Background actors: `stationShuttle`, `debrisTug`, `antennaDrone`
- Marker inventory: `o:9, U:1, V:2, W:2, Y:3, B:52`
- Notes: no walker markers; fully airborne encounter profile + space AI override

### 8.5) CELESTIAL SHOGUNATE
- Theme: `JAPAN`
- Width: 288
- Checkpoints: 2 | Light zones: 0
- Checkpoint labels: `Act 2: Storm Ascent`, `Act 3: Moon Fortress`
- Background actors: `japanPagoda`, `toriiGate`, `paperKite`, `japanPagoda`
- Marker inventory: `o:29, O:3, U:1, E:9, V:6, W:5, Y:5, B:141, H:1`
- Notes: three-act progression with dense mixed flyer composition

### 9) PHANTOM PROCESSION
- Theme: `HORROR`
- Width: 384
- Checkpoints: 3 | Light zones: 0
- Checkpoint labels: `Act 2: Grave March`, `Act 3: Lantern Hollow`, `Act 4: Eclipse Keep`
- Background actors: `hauntedMansion`, `graveGate`, `ghostLantern`, `batSwarm`
- Marker inventory: `o:41, O:8, U:1, E:8, V:5, W:5, Y:7, B:192, H:1`
- Notes: long-form horror gauntlet with sustained mixed air/ground pressure

### 9.5) GEOMETRY DREAM
- Theme: `GEOMETRYDREAM`
- Width: 576
- Checkpoints: 5 | Light zones: 0
- Checkpoint labels: `Section 2: Neon Grid`, `Section 3: Mirror Hall`, `Section 4: Fractal Spine`, `Section 5: Orbit Vault`, `Section 6: Dimensional Gate`
- Background actors: `geoWireCube`, `geoPolyShard`, `geoGridPlane`, `geoMirrorDoor`, `geoOrbitRune`, `geoChromaprism`, `geoFluxLens`
- Marker inventory: `o:18, O:6, U:6, E:12, V:6, W:6, Y:6, B:162, H:1`
- Notes: section portal architecture + geometry soundtrack notices

### 10) GOTHIC CATHEDRAL
- Theme: `GOTHIC`
- Width: 768
- Checkpoints: 5 | Light zones: 6
- Checkpoint labels: `Nave Crossing`, `Bell Gallery`, `Choir Transept`, `Reliquary Walk`, `Sanctum Approach`
- Background actors: `cathedralSpire`, `roseWindow`, `gargoylePerch`
- Marker inventory: `o:40, O:1, U:8, E:8, V:2, W:9, Y:2, Z:3, R:2, T:25, P:2, D:2, C:438, H:1`
- Notes:
	- unlocks Paladin on first entry
	- first major cursed-barrier usage (`C`)
	- introduces authored vampires (`Z`) and giant vampires (`R`)
	- heavy relic economy (`T`) and authored portals (`P`,`D`)

### 10.3) STORM FOUNDRY
- Theme: `STORMFOUNDRY`
- Width: 576 (6x)
- Checkpoints: 5 | Light zones: 6
- Checkpoint labels: `Act 1: Intake Platforms`, `Act 2: Coil Gallery`, `Act 3: Furnace Spine`, `Act 4: Lightning Apex`, `Act 5: Overload Core`
- Background actors: `teslaPylon`, `chainCrane`, `sparkVent`, `cableGondola`, `rotatingRingCoil`
- Marker inventory: `o:30, U:6, E:6, V:6, W:6, Y:6, G:6, L:168, C:30, B:288`
- Notes:
	- now structured as a long-form 5-act storm gauntlet
	- mixes spark-lane hazards (`L`) with energized rail lanes (`C`) across repeated sections
	- keeps elite pressure (`G`) distributed through all six segments

### 10.6) BONE CRYPT
- Theme: `BONECRYPT`
- Width: 576
- Checkpoints: 5 | Light zones: 6
- Checkpoint labels: `Antechamber`, `Ossuary Hall`, `Catacomb Gate`, `Sepulcher Span`, `Final Reliquary`
- Background actors: `hauntedMansion`, `graveGate`, `batSwarm`
- Marker inventory: `o:65, U:6, E:12, V:3, W:3, Y:4, Z:1, R:1, N:4, G:3, T:5, X:4, P:3, D:2, B:639, H:1`
- Notes:
	- unlocks Skeleton on first entry
	- includes bone-wisp (`N`) and crypt-harbinger (`G`) enemy families
	- includes shiny bat relics (`X`) and relic crosses (`T`)
	- supports BONECRYPT weather (rain/lightning) in mid-map zones

---

## 7) UI / Announcement Effects tied to Level Flow

- Level name banner on entry
- Help message toast from help blocks
- Checkpoint reached banner
- Portal transition notice text
- Geometry section music notice in `GEOMETRYDREAM`
- Character unlock notices (Paladin in Gothic, Skeleton in Bone Crypt)
- Robot/Skeleton phase-2 notices and kill notices during abilities

---

## 8) Maintenance Notes

- Storm Foundry production baseline:
	- use `docs/STORM_FOUNDRY_PRODUCTION_SPEC.md` for 6x act ranges, mechanic state machines, marker grammar, tuning budgets, and variant templates

- If you add a new theme:
	- add physics profile in `PHYSICS_BY_THEME`
	- add coin routing in `collectibleSprite()`
	- add 1UP routing in `oneUpSpriteForTheme()`
	- add tile art routing in `tileSprite()`
	- add background branch in `drawBackground()`

- If you add a new marker char:
	- parse it in `loadLevel()` marker pass
	- map it in `tileIdAt()` only if it must persist as a collision/render tile
	- document it here under legend + per-level inventories
