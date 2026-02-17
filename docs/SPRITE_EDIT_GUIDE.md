# Sprite Edit Guide (Mini Platformer)

This is a quick guide for creating/updating pixel sprites in this project and handing sprite work to an AI agent.

## 1) How sprites are stored

Sprites live in `sprites.js` inside the `SPRITES` object.

- Each sprite is an array of strings.
- Each string is one row of pixels.
- `.` means transparent pixel.
- Any other letter is a palette key from `PALETTE`.
- Standard sprite tile size is `10x10` (10 rows, each row 10 chars).

Example:

```js
coin:[
  "..........",
  "....FF....",
  "...FLLF...",
  "..FLLLFF..",
  "..FLLLFF..",
  "..FFLLF...",
  "...FFLF...",
  "....FF....",
  "..........",
  ".........."
]
```

## 2) Help block sprite pieces (current)

The help block is a **2-tile block**:

- Top active: `helpBlockTopUnusedA`, `helpBlockTopUnusedB`
- Bottom active: `helpBlockBottomUnusedA`, `helpBlockBottomUnusedB`
- Top used: `helpBlockTopUsed`
- Bottom used: `helpBlockBottomUsed`

Current references in `game.html`:

- Sprite definitions: around lines with `helpBlockTopUnusedA`, `helpBlockTopUnusedB`, `helpBlockBottomUnusedA`, `helpBlockBottomUnusedB`, `helpBlockTopUsed`, `helpBlockBottomUsed`
- Tile IDs: `H/h/Q/q` in `tileIdAt(...)`
- Trigger path: `triggerHelpBlock(...)`
- Collision trigger: `if (dir < 0 && tileId === 8)`
- Rendering mapping: `id === 10/8/11/9` branches in `render()`

## 3) What to send to an AI for redesign

When asking an AI for new help-block art, send these snippets:

1. `PALETTE` block
2. Existing help-block sprite definitions (`helpBlockTopUnusedA/helpBlockTopUnusedB/helpBlockBottomUnusedA/helpBlockBottomUnusedB/helpBlockTopUsed/helpBlockBottomUsed`)
3. Render mapping block (`id === 10/8/11/9`)
4. `tileIdAt(...)` return mapping for `H/h/Q/q`

That gives the AI enough context to redesign visuals without breaking behavior.

## 4) Prompt template for AI handoff

Copy/paste and fill in:

```text
You are editing pixel-art sprites in JavaScript arrays.

Constraints:
- Keep each sprite exactly 10 rows x 10 columns.
- Use only existing palette letters already present in PALETTE.
- Keep sprite keys unchanged:
  helpBlockTopUnusedA, helpBlockTopUnusedB, helpBlockBottomUnusedA, helpBlockBottomUnusedB, helpBlockTopUsed, helpBlockBottomUsed
- Keep animation frame pairs compatible (0/1 variants).
- Do not change gameplay logic, only sprite arrays.

Goal:
Redesign the help block to look like a clear retro question-mark tutorial block.
- Active state: bright and readable
- Used state: clearly dimmed/inactive
- Keep visual style consistent with existing game sprites

Return:
- Only updated sprite array definitions for:
  helpBlockTopUnusedA, helpBlockTopUnusedB, helpBlockBottomUnusedA, helpBlockBottomUnusedB, helpBlockTopUsed, helpBlockBottomUsed
```

## 5) Fast validation checklist

After updating sprite arrays:

- No JS syntax errors.
- All sprite rows have 10 chars.
- Each sprite has 10 rows.
- Game loads.
- Help block still triggers and switches to used state.
- Top+bottom tiles align visually.

## 6) Optional: quick consistency rules

- Active block: higher contrast, brighter outlines.
- Used block: lower contrast and flatter shading.
- Keep the `?` shape centered across top+bottom pieces.

## 7) Player enemy-death shatter effect

When the player is killed by an enemy, the game now uses a sprite-shatter explosion before respawn.

- Source sprite: current rendered player frame (including `DUCK` and `SKELETON` variants).
- Behavior: the sprite is split into chunks, pieces burst outward, then fade.
- Scope: enemy-kill deaths only. Tile/lava deaths keep original immediate behavior.

### Tunables in `game.html`

The effect is controlled by `ENEMY_DEATH_SHATTER` near the top constants block:

- `chunkSizeMin`, `chunkSizeMax` — piece size range.
- `burstSpeedMin`, `burstSpeedMax` — outward velocity range.
- `upwardLiftMin`, `upwardLiftMax` — how much pieces launch upward.
- `pieceLifeMin`, `pieceLifeMax` — per-piece lifetime in frames.
- `deathFramesMin`, `deathFramesMax` — delay before respawn.
- `gravityMul`, `drag` — shatter motion feel.
- `lateralJitter` — sideways randomness.

### Random variation policy

Each death randomizes a bounded profile (chunk size, burst strength, lift, and respawn delay), then adds per-piece variance.
This keeps explosions fresh without making gameplay timing unpredictable.
