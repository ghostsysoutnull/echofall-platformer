# Adding New Levels to Mini Platformer

## File Structure

- `src/levels/game-levels.js` — authored `GAME_LEVELS` entries (name, sequence, theme, grid)
- `src/levels/derived.js` — derived arrays and `validateLevel()` helper
- `src/main.js` — runtime (loads levels through `src/levels/index.js`)
- `docs/guides/LEVEL_DESIGN_GUIDE.md` — level design constraints and marker legend

## Workflow

### 1) Generate a grid
Ask your AI/tool to produce exactly 18 rows at consistent width (match existing levels).

### 2) Validate before adding
Run in browser console while the game is open:

```javascript
validateLevel("SPACE_01", gridArray);
```

### 3) Add level entry
Open `src/levels/game-levels.js` and append an entry to `GAME_LEVELS`:

```javascript
{
  name: "SPACE_01",
  sequence: 99,
  theme: "SPACE",
  grid: [
    "................................................................................................",
    // ... 17 more rows ...
  ]
}
```

`sequence` controls level order.

### 4) Test in game
- Reload page
- Use `N` / `M` to move between levels
- Confirm spawn (`S`) and goal (`F`) are correct

### 5) Commit

```bash
git add src/levels/game-levels.js
git commit -m "Add SPACE_01 level"
```

## Troubleshooting

- Missing spawn/goal: `validateLevel()` reports count mismatch
- Enemy over pit: `validateLevel()` warns if walkers are unsupported
- Wrong order: adjust `sequence`

## Batch adding multiple levels

1. Validate each level individually
2. Add each entry to `GAME_LEVELS`
3. Set unique `sequence` values in desired order
4. Reload and test progression
5. Commit once
