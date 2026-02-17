# Mini Platformer: Level Design & Generation Guide

## SECTION 1: GAME MECHANICS REFERENCE

### 1.1 Core Gameplay
- **Genre**: Compact single-screen platformer with world-anchored camera
- **Canvas**: 320×180px (32×18 tiles @ 10px/tile), world extends horizontally
- **Tile Grid**: 96 columns × 18 rows
- **Physics**: Fixed timestep 60 FPS, gravity-based with air friction

### 1.2 Player Mechanics
- **Horizontal**: Acceleration 0.22, max velocity 2.2 px/frame
- **Jump**: Initial velocity −5.4 px/frame (modified per character)
- **Ground Friction**: 0.80–0.95 (level-dependent)
- **Air Friction**: 0.94–0.97 (level-dependent)
- **Coyote Frames**: 7 (can jump up to 7 frames after leaving ground)
- **Jump Buffer**: 7 (input accepted 7 frames before landing)

### 1.3 Characters (Selectable)
| Name | Jump Mult | Width | Height | Double Jump | Duck Flight |
|------|-----------|-------|--------|-------------|-------------|
| MARIO | 1.00 | 10px | 10px | No | No |
| BUNNY | 1.22 | 10px | 10px | No | No |
| NINJA | 1.00 | 10px | 10px | Yes (1) | No |
| ROBOT | 1.00 | 10px | 10px | No | No |
| DUCK | 1.00 | 20px | 10px | No | Yes (26 frames fuel) |
| SKELETON | 1.00 | 10px | 20px | No | No |

### 1.4 Tile Semantics
| Char | Name | Role | Behavior |
|------|------|------|----------|
| `#` | Solid Ground | Collision solid (walkable) | Blocks movement |
| `B` | Special Block | Collision solid (mid-level platform) | Blocks movement |
| `o` | Small Coin | Collectible (+1 score) | Disappears on touch |
| `O` | Big Coin | Collectible (+10 score) | Disappears on touch |
| `U` | Extra Life | Collectible (+1 life) | Disappears on touch |
| `L` | Lava | Hazard | Instant death on touch |
| `V` | Flying Enemy (oscillating) | Enemy spawner (type 1) | Bounces left/right, sine wave Y |
| `E` | Walking Enemy | Enemy spawner (type 0) | Walks/bounces on platforms |
| `S` | Spawn Point | Level marker | Player starts here (becomes `.`) |
| `F` | Flag/Goal | Level marker | Player wins on touch; flag raises 1.5s |
| `.` | Empty | Passthrough | No collision |

### 1.5 Enemies
**Walkers (type 0, `E`):**
- Speed: 1.0 px/frame, direction: −1 (left initially)
- Bounce at pit edges (no ground below)
- Damage: Instant death if player hits from side/below; death if player stomps from above (−0.6× jump velocity)

**Fliers (type 1, `V`):**
- Speed: 1.25 px/frame horizontal, bounces at obstructions
- Vertical: Sine wave oscillation at frequency 0.15, amplitude 6px
- Damage: Same as walkers
- Special: SKELETON eliminates them for coin drops

### 1.6 Goal / Flag
- **Placement**: Single `F` marker per level (required)
- **Structure**: Vertical pole (9 tiles tall), flag at top
- **Base Y**: Computed as first solid tile beneath marker; anchors entire pole
- **Win Condition**: Player AABB overlaps flag hitbox → flag raises 1.5s + jingle → level advances
- **World-anchored**: Scrolls with camera

### 1.7 Level Progression
- **6 Levels**: DAY, JUNGLE, FACTORY, ICE, VOLCANO, NITE
- **Loop**: After NITE, Skeleton unlocks; loops to DAY
- **Score**: 100 points per extra life; lives persist across levels

---

## SECTION 2: LEVEL FORMAT SPECIFICATION

### 2.1 Level String Format
- **Dimensions**: Exactly 96 characters per row, 18 rows total
- **Rows 0–16**: Game area (walkable space, platforms, enemies, collectibles)
- **Row 17**: GROUND_ROW (fixed pattern, all hazards/exits reset here)
- **Encoding**: Case-sensitive single-character tile codes (see 1.4)

### 2.2 Mandatory Elements
Every level **must** contain:
- **Exactly 1 `S`** (spawn point) in rows 0–16; placed on safe ground
- **Exactly 1 `F`** (flag) in rows 0–16; must have solid support below (direct or within 2 tiles)

### 2.3 Camera & Scroll
- **Camera target**: Player center − (160, 99) = half-screen offset
- **Scroll speed**: Smooth interpolation at 0.12 (X), 0.10 (Y) per frame
- **Visible area**: ~32 tiles wide × 18 tall

### 2.4 Placement Constraints

#### Spawn (`S`) Safety
- Never place on `L` (lava)
- Never place surrounded by `#` or `B` (soft-trapped)
- Recommend: Row 10–12, empty horizontal space

#### Flag (`F`) Anchoring
- **Base Y scanning**: Scan downward from flag row until first solid (`#` or `B`)
  - If row 17 is solid at that column, base = row 17 surface
  - If column is all `.`, base = floor (row 17)
- **Pole height**: Always 9 tiles; never taller/shorter
- **Minimum clearance**: No solid blocks within 2 tiles horizontally (flag raise needs space)

#### Enemies (`E`, `V`)
- **Never place in mid-air** (unless intentional instant-death design)
- **Walkers**: Must start on solid ground (or will fall instantly)
- **Fliers**: Can start in air; oscillate freely; avoid rows 0–2 (off-screen)
- **Spacing**: Min 3 tiles apart to prevent instant collision at spawn
- **First enemy**: Should appear row 8 or later (after intro platforms)

#### Collectibles (`o`, `O`, `U`)
- **Placement**: On platforms, ledges, or mid-air (will fall if no collision)
- **Density**: Max 1 per 3×3 tile area to avoid clutter
- **Reachability**: Verify every coin is on a path the player can access

#### Lava (`L`)
- **Sparse use**: 1–3 per level, clearly telegraphed
- **Clustered**: Group in same column or row for visual cohesion
- **Avoidance**: Never block critical paths

### 2.5 Level Difficulty Progression (Reference)
1. **DAY** (Tutorial): Few enemies, open space, simple jumps
2. **JUNGLE** (Easy): More collectibles, intro multi-platform
3. **FACTORY** (Medium): Repeated patterns, 3+ enemies
4. **ICE** (Medium–Hard): Slippery physics (friction 0.95), tighter timing
5. **VOLCANO** (Hard): Lava hazards, flying enemies, complex pathing
6. **NITE** (Hard): Dense enemies, high collectible chains

---

## SECTION 3: AI LEVEL GENERATION PROMPT TEMPLATE

Use this structure when requesting level generation from another AI:

### Template: Generate Level [NAME]

**Context**
- Game: Mini Platformer (see SECTION 1 & 2 above)
- Output Format: Single 96×18 grid of tile characters, newline-separated

**Design Brief**
- **Level Name**: [NAME]
- **Difficulty Tier**: [Easy/Medium/Hard]
- **Design Intent**: [What mechanic does player practice? e.g., "timing jumps over enemies", "collecting coins while dodging lava"]
- **Estimated Play Duration**: [20–40 seconds]

**Constraints (DO NOT VIOLATE)**
1. Exactly 96 characters per row, 18 rows total
2. Exactly 1 `S` somewhere row 0–16, on solid ground
3. Exactly 1 `F` somewhere row 0–16, with solid support below
4. GROUND_ROW (row 17) unchanged: `###########..#######.....####....#####....######....####....#####....######....####....#########`
5. No mid-air spawn enemies (except flying `V` is OK)
6. First enemy row ≥ 8
7. No lava blocking mandatory paths
8. All solid platforms must be constructed from `#` or `B` only

**Layout Sketch** (optional, ASCII hint)
```
     [spawn area]  ... [platforms] ... [enemy zone] ... [goal]
```

**Checklist (verify before output)**
- ✓ Spawn is reachable and safe
- ✓ Flag base will anchor to solid ground
- ✓ Enemies are on ground or intentional fliers
- ✓ All coins are reachable
- ✓ Lava (if any) is visually clear and avoidable
- ✓ Level is completable by all 6 characters
- ✓ Row 17 is EXACTLY the GROUND_ROW string (no edits)

**Output Format**
```
................................................................................................
................................................................................................
...
[18 rows exactly]
```

---

## SECTION 4: EXAMPLE LEVEL ANNOTATION

**Level: DAY (Existing)**

```
................................................................................................  [rows 0–6: open sky]
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
......................o.................o.................U.....................................  [row 7: scattered coins intro]
.............BBB..................BBB.............BBB...........................................  [row 8: first platform triplets]
............................................................E...................................  [row 9: FIRST ENEMY (col 60, over solid ground)]
....................o...................................................o......................... [row 10: coin placement pattern]
..........BBB..................BBB....................BBB.......................................  [row 11: second platform wave]
...........................................E...................................................... [row 12: secondary enemy]
....S.................................BBB.........................BBB............................  [row 13: SPAWN (col 4), two large platforms]
..............o...........BBB..............................................o...............F....  [row 14: coins lead to goal, FLAG at col 88]
.....................E.........................BBB............................................... [row 15: tertiary enemy, final cluster]
................................................................................................  [row 16: open space]
###########..#######.....####....#####....######....####....#####....######....####....#########  [row 17: GROUND_ROW]
```

**Design Intent**: Teach basic platforming, introduce coins and enemies gradually. Spawn in mid-left, goal far right. Enemies are spaced and grounded. Coins form breadcrumb trail.

**Physics Profile**: DAY (base gravity 0.35, friction balanced)

---

---

## SECTION 5: HARD CONSTRAINTS VIOLATIONS & CORRECTIONS

### ❌ Grid Size Mismatch
```
..........................................................................      [WRONG: 70 chars, should be 96]
................................................................................................ [CORRECT: 96 chars]
```
**Impact**: Game crashes or clips sprites; grid parsing fails.

---

### ❌ Missing or Duplicate Spawn/Flag
```
................................................................................................ [WRONG: no 'S' anywhere]
................................................................................................
....S.................................S.......................................... [WRONG: two 'S' markers]
................................................................................................ [CORRECT: exactly one 'S']
```
**Impact**: Spawn undefined (player.x/y uninitialized); multiple spawns ignored (only first parsed).

---

### ❌ Enemy Placed in Mid-Air (Walker Type)
```
................................................................................................
.....E............................................................................................  [WRONG: E at row 1, no platform]
................................................................................................
.....BBB...........................................................................................  [CORRECT: E on platform]
.....E.............................................................................................
```
**Impact**: Enemy falls instantly off-screen due to gravity; never participates in level.

---

### ❌ Walking Enemy Over Pit (Ground Row Check)
```
..........E...........................................................................................  [col 10, row 8]
................................................................................................
................................................................................................
###########..#######.....####....#####....######....####....#####....######....####....#########
[GROUND_ROW col 10 = '.' → pit below]
[WRONG: enemy falls into pit instantly on spawn]

..........BBB..........................................................................................  [col 10–12: platform added]
..........E............................................................................................  [col 10, row 9]
................................................................................................
###########..#######.....####....#####....######....####....#####....######....####....#########
[GROUND_ROW col 10 = '#' → solid]
[CORRECT: enemy walks on ground]
```
**Impact**: Instant-death level design; player sees despawning enemy, no gameplay.

**Check**: For every `E`, verify `GROUND_ROW[col]` is `#`.

---

### ❌ Modifying Ground Row
```
###########..#######.....####....#####....######....####....#####....######....#########
[WRONG: 85 chars; row 17 corrupted]

###########..#######.....####....#####....######....####....#####....######....####....#########
[CORRECT: exactly as defined, 96 chars]
```
**Impact**: Physics broken; base Y calculations fail; collisions corrupt.

**Check**: Row 17 must be **exactly**:
```
###########..#######.....####....#####....######....####....#####....######....####....#########
```
(Copy-paste from template; never edit.)

---

### ❌ Flag with Insufficient Vertical Space
```
...............F..........................................................................................  [col 15, row 16]
................................................................................................
###########..#######.....####....#####....######....####....#####....######....####....#########
[WRONG: flag at row 16; pole needs 9 tiles (rows 8–16); collision with self]
[Base scans down from row 16 → row 17 (ground) → baseY = row 17.
Pole = rows (17−90px to 17−0px) = rows 8–17; flag at row 16 overlaps pole!]

....................................................................F.....................................  [col 61, row 5]
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
########################..##########.....#######.....##########.....########################
[CORRECT: flag at row 5; base scans to row 17 (ground); pole = rows 8–17; no collision]
```
**Impact**: Flag and pole render/collide incorrectly; hitbox misaligned.

**Check**: `F` must be placed in row 0–11 (preferably 3–8) to ensure base has room below.

---

### ❌ Unreachable Collectible
```
.O..............................................................................  [row 0: coin high up]
................................................................................................
................................................................................................
.....S.............................................................................................  [row 10: spawn]
###########..#######.....####....#####....######....####....#####....######....####....#########
[WRONG: max jump ~5–6 tiles; coin at height 10, unreachable]

................................................................................................
................................................................................................
................................................................................................
.....S.........................o.....................................  [row 10: spawn, coin nearby]
....BBB.........................BBB.....................................................  [row 11: platform to coin]
###########..#######.....####....#####....######....####....#####....######....####....#########
[CORRECT: coin reachable via platform bounce]
```
**Impact**: Collectible is just scenery; score not achievable; player frustration.

**Check**: For each coin, verify a path from spawn to coin exists using platforms.

---

### ❌ Lava Blocking Mandatory Path
```
....S.............................................................................................  [spawn]
................................................................................................
.....LLLLL.......L...................................................................................  [lava blocks passage]
................................................................................................
....................................................F.....................................  [flag beyond]
###########..#######.....####....#####....######....####....#####....######....####....#########
[WRONG: player trapped; no way around lava]

....S.............................................................................................  [spawn]
....BBB.............................................................................................  [platform to jump over]
.....LLLLL.......L...................................................................................  [lava]
....................................................F.....................................  [flag]
###########..#######.....####....#####....######....####....#####....######....####....#########
[CORRECT: lava avoidable; path to goal exists]
```
**Impact**: Unwinnable level; player soft-locked.

**Check**: Trace spawn → flag path; ensure no mandatory lava crossing.

---

### ✅ CORRECT COMPLETE EXAMPLE
```
................................................................................................  [row 0]
................................................................................................  [row 1]
................................................................................................  [row 2]
................................................................................................  [row 3]
................................................................................................  [row 4]
................................................................................................  [row 5]
................................................................................................  [row 6]
................................................................................................  [row 7]
..............o...................................................................................  [row 8: coin intro]
..............BBB.................................................................................  [row 9: platform trio]
....S.................................................................................................  [row 10: spawn (col 4, 96 chars total)]
................................................................................................  [row 11]
................................................................................................  [row 12]
................................................................................................  [row 13]
........................o.........................F.............................................  [row 14: coin + flag (col 69)]
................................................................................................  [row 15]
................................................................................................  [row 16]
###########..#######.....####....#####....######....####....#####....######....####....#########  [row 17: GROUND_ROW]
```

**Validates**:
- ✓ 18 rows, 96 chars per row
- ✓ Exactly 1 `S` (col 4, row 10)
- ✓ Exactly 1 `F` (col 69, row 14)
- ✓ Row 17 unchanged
- ✓ No enemies in mid-air
- ✓ Coin on platform (reachable from spawn)
- ✓ Flag has ground support (col 69 in GROUND_ROW = `#`)

---

## NOTES FOR AI AGENTS

- **Do not deviate** from SECTION 2 constraints; they are hard requirements
- **Test mentally**: Can Mario (1.0× jump) reach all coins? Can Bunny (1.22×) skip platforms?
- **Enemy placement**: Always verify ground beneath walking enemies (check GROUND_ROW col at enemy col)
- **Flag base**: If flag is in column X, row Y, scan column X downward: first `#` or `B` at row Z → base is row Z surface
- **Row 17 is sacred**: Copy GROUND_ROW exactly; do not edit, do not shorten
- **Lava sparsity**: Use only if level design calls for it; avoid cheapness
- **Text edge cases**: Ensure no trailing spaces, no Unicode, ASCII only
- **Verify before output**: Check SECTION 5 violations; if any apply, fix and re-check

---

## QUICK REFERENCE: TILE GRID TEMPLATE (blank)

Copy and fill to generate a new level:
```
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
................................................................................................
###########..#######.....####....#####....######....####....#####....######....####....#########
```

(96 chars per row, 18 total. Row 17 is locked. Rows 0–16 are editable.)

