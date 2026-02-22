# Enemy Grid Codes Reference

This is the canonical reference for enemy placement in level grids.

- Source of truth for spawn mapping: `src/main.js` (tile-char loader)
- Biome coverage below was generated from `GAME_LEVELS` in `src/levels/game-levels.js`

---

## Quick Index (Code -> Enemy)

- `E` -> Walker (`type 0`, `10x10`)
- `V` -> Bat (`type 1`, `10x10`)
- `W` -> Falcon (`type 2`, `10x10`)
- `Y` -> Ghost (`type 3`, `10x10`)
- `Z` -> Vampire (small big-form) (`type 4`, `14x14`)
- `R` -> Vampire (big) (`type 5`, `35x35`)
- `N` -> Bone Wisp (`type 6`, `12x12`)
- `G` -> Crypt Harbinger (`type 7`, `24x24`)
- `K` -> Shielded Worker (`type 8`, `10x10`)
- `!` -> Frankenstein (`type 9`, `10x30`)

---

## Categories

### Walkers

#### `E` — Walker (`type 0`, `10x10`)
Biomes:
- DAY
- AFTERNOON
- JUNGLE
- JUNGLE: RUIN ASCENT
- FACTORY
- CASTLE
- ICE
- VOLCANO
- SKY RUINS
- NITE
- MOONLIT MATSURI
- CELESTIAL SHOGUNATE
- PHANTOM PROCESSION
- GEOMETRY DREAM
- SIMULATION BREACH
- SHADOWRUNNER ARCLOGY
- GOTHIC CATHEDRAL
- STORM FOUNDRY
- BONE CRYPT

### Flyers

#### `V` — Bat (`type 1`, `10x10`)
Biomes:
- AFTERNOON
- JUNGLE: RUIN ASCENT
- CASTLE
- VOLCANO
- SKY RUINS
- MOONLIT MATSURI
- SPACE
- CELESTIAL SHOGUNATE
- PHANTOM PROCESSION
- GEOMETRY DREAM
- SIMULATION BREACH
- SHADOWRUNNER ARCLOGY
- GOTHIC CATHEDRAL
- STORM FOUNDRY
- BONE CRYPT

#### `W` — Falcon (`type 2`, `10x10`)
Biomes:
- JUNGLE: RUIN ASCENT
- SKY RUINS
- MOONLIT MATSURI
- SPACE
- CELESTIAL SHOGUNATE
- PHANTOM PROCESSION
- GEOMETRY DREAM
- SIMULATION BREACH
- SHADOWRUNNER ARCLOGY
- GOTHIC CATHEDRAL
- STORM FOUNDRY
- BONE CRYPT

#### `Y` — Ghost (`type 3`, `10x10`)
Biomes:
- JUNGLE: RUIN ASCENT
- SKY RUINS
- MOONLIT MATSURI
- SPACE
- CELESTIAL SHOGUNATE
- PHANTOM PROCESSION
- GEOMETRY DREAM
- SIMULATION BREACH
- SHADOWRUNNER ARCLOGY
- GOTHIC CATHEDRAL
- STORM FOUNDRY
- BONE CRYPT

### Flyers (Vampire)

#### `Z` — Vampire (small big-form) (`type 4`, `14x14`)
Biomes:
- JUNGLE: RUIN ASCENT
- GOTHIC CATHEDRAL
- BONE CRYPT
- TEST BIOME

#### `R` — Vampire (big) (`type 5`, `35x35`)
Biomes:
- JUNGLE: RUIN ASCENT
- GOTHIC CATHEDRAL
- BONE CRYPT
- TEST BIOME

### Flyers (Crypt)

#### `N` — Bone Wisp (`type 6`, `12x12`)
Biomes:
- BONE CRYPT

### Flyers (Crypt Big)

#### `G` — Crypt Harbinger (`type 7`, `24x24`)
Biomes:
- STORM FOUNDRY
- BONE CRYPT
- TEST BIOME

### Walkers (Special)

#### `K` — Shielded Worker (`type 8`, `10x10`)
Biomes:
- SHADOWRUNNER ARCLOGY
- STORM FOUNDRY

### Walkers (Bosslike)

#### `!` — Frankenstein (`type 9`, `10x30`)
Biomes:
- PHANTOM PROCESSION
- SHADOWRUNNER ARCLOGY
- GOTHIC CATHEDRAL
- TEST BIOME

---

## Placement Notes

- Put the code character directly into a level grid row string.
- On level load, the code is converted into an enemy object and the tile is replaced with `.`.
- For large enemies (`R`, `G`, `!`), leave horizontal/vertical clearance around spawn positions.
- `R` and `Z` also register as vampire respawn points.

---

## Big Enemies (Quick Filter)

If you only want large-profile enemies, use:

- `R` — Vampire Big (`35x35`)
- `G` — Crypt Harbinger (`24x24`)
- `!` — Frankenstein (`10x30`)
- `Z` — Vampire variant (`14x14`)
