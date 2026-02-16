# Sprite Edit Guide (Mini Platformer)

This is a quick guide for creating/updating pixel sprites in this project and handing sprite work to an AI agent.

## 1) How sprites are stored

Sprites live in `game.html` inside the `SPRITES` object.

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

- Top active: `hbt0`, `hbt1`
- Bottom active: `hbb0`, `hbb1`
- Top used: `hut`
- Bottom used: `hub`

Current references in `game.html`:

- Sprite definitions: around lines with `hbt0`, `hbt1`, `hbb0`, `hbb1`, `hut`, `hub`
- Tile IDs: `H/h/Q/q` in `tileIdAt(...)`
- Trigger path: `triggerHelpBlock(...)`
- Collision trigger: `if (dir < 0 && tileId === 8)`
- Rendering mapping: `id === 10/8/11/9` branches in `render()`

## 3) What to send to an AI for redesign

When asking an AI for new help-block art, send these snippets:

1. `PALETTE` block
2. Existing help-block sprite definitions (`hbt0/hbt1/hbb0/hbb1/hut/hub`)
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
  hbt0, hbt1, hbb0, hbb1, hut, hub
- Keep animation frame pairs compatible (0/1 variants).
- Do not change gameplay logic, only sprite arrays.

Goal:
Redesign the help block to look like a clear retro question-mark tutorial block.
- Active state: bright and readable
- Used state: clearly dimmed/inactive
- Keep visual style consistent with existing game sprites

Return:
- Only updated sprite array definitions for:
  hbt0, hbt1, hbb0, hbb1, hut, hub
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
