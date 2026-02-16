# Adding New Levels to Mini Platformer

## File Structure

- **`levels.js`** – Contains all level data (GAME_LEVELS object), GROUND_ROW constant, and validateLevel() utility
- **`game.html`** – Main game (imports levels.js, references levels via LEVEL_ORDER)
- **`LEVEL_DESIGN_GUIDE.md`** – Complete design documentation for creating new levels

## Workflow: Adding a New Level

### Step 1: Get Level Grid from AI Agent

Send the AI agent the `LEVEL_DESIGN_GUIDE.md` with a request like:
```
Use LEVEL_DESIGN_GUIDE.md to create a new level called "SPACE_01".
Difficulty: Medium
Intent: Practice double-jumping over obstacles.

Output ONLY the 18 rows (96 chars each), no explanation.
```

### Step 2: Validate the Level

Paste this into your browser console (while game is open):

```javascript
// Copy the 18-row grid from AI output as a JavaScript array:
const testLevel = [
  "................................................................................................",
  "................................................................................................",
  // ... paste all 18 rows here ...
];

// Run validation:
validateLevel("SPACE_01", testLevel);
```

**Good output**: `✓ SPACE_01 is valid`
**Bad output**: Error messages listing what failed

### Step 3: Add to levels.js

1. Open `levels.js`
2. Add new level to `GAME_LEVELS` object:

```javascript
const GAME_LEVELS = {
  DAY: [ /* ... */ ],
  JUNGLE: [ /* ... */ ],
  // ... existing levels ...
  SPACE_01: [
    "................................................................................................",
    // ... paste your validated grid here ...
  ]
};
```

3. Update `LEVEL_ORDER` array to include new level:

```javascript
const LEVEL_ORDER = ["DAY", "JUNGLE", "FACTORY", "ICE", "VOLCANO", "NITE", "SPACE_01"];
```

### Step 4: Test in Game

- Reload or refresh the page
- All levels should be playable in order
- Press `N` to cycle through and test new level

### Step 5: Commit to Git

```bash
git add levels.js game.html
git commit -m "Add SPACE_01 level"
```

---

## Troubleshooting

### Validation fails with "Expected 1 spawn (S)"
- Check level has exactly one `S` in rows 0–16
- AI probably forgot it or placed two

### Validation fails with "Row 17 (GROUND_ROW) corrupted"
- Make sure row 17 is **exactly**:
  ```
  ###########..#######.....####....#####....######....####....#####....######....####....#########
  ```
- No typos, no edits, copy-paste from template

### Level plays but enemies fall off-screen
- Check enemies are on solid ground
- Validation warns about this; fix and re-validate
- All `E` (walkers) must have `#` below in GROUND_ROW at same column

### Coindrops unreachable or floating
- Use browser dev tools to trace path from spawn to coin
- Redeploy level back to AI with notes: "Coin at (col X, row Y) is unreachable from spawn"

---

## Quick Reference: JSON Format

Levels are stored as simple string arrays. Example:

```javascript
SPACE_01: [
  "................................................................................................",  // row 0 (96 chars)
  "................................................................................................",  // row 1
  // ... rows 2–16 (14 more rows) ...
  "###########..#######.....####....#####....######....####....#####....######....####....#########"   // row 17 (GROUND_ROW, locked)
]
```

Each row is a string of exactly 96 ASCII characters representing tile codes.

---

## Batch Adding Multiple Levels

If you have 5 new levels from AI:

1. Validate each one individually using the console (see Step 2)
2. Add all 5 to `GAME_LEVELS` object in `levels.js`
3. Update `LEVEL_ORDER` with all new names in desired order
4. Reload game → test all levels in sequence
5. One commit: `git add levels.js && git commit -m "Add 5 new levels: SPACE_01–SPACE_05"`

---

## Rolling Back a Level

If a level is broken and you want to remove it:

1. Delete the level from `GAME_LEVELS` object in `levels.js`
2. Remove its name from `LEVEL_ORDER`
3. Reload game
4. Commit: `git add levels.js && git commit -m "Remove BROKEN_LEVEL"`

---

## validateLevel() Function

Located in `levels.js`. Usage:

```javascript
validateLevel("MY_LEVEL", gridArray);
```

**Returns**: `true` if valid, `false` + console errors if not.

**Checks**:
- 18 rows exactly
- 96 characters per row
- GROUND_ROW on row 17 (exact match)
- Exactly 1 spawn (`S`)
- Exactly 1 goal/flag (`F`)
- ⚠ Warns if enemies placed over pits

---

## Notes

- **Levels are immutable in game**: Changes to `levels.js` require page reload
- **No performance penalty**: All 6 default levels load instantly (<10KB total)
- **AI agents have LEVEL_DESIGN_GUIDE.md**: Share it directly; they know constraints
- **Version control**: Each level addition is one commit; easy to revert if needed
