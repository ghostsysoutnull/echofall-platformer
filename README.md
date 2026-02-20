# Mini Platformer

Quick index for this workspace.

## Documentation

- [Add Levels Guide](docs/ADD_LEVELS_README.md)
- [Level Design Guide](docs/LEVEL_DESIGN_GUIDE.md)
- [Levels Overview](docs/LEVELS_OVERVIEW.md)
- [Jungle: Ruin Ascent Production Spec](docs/JUNGLE_RUIN_ASCENT_PRODUCTION_SPEC.md)
- [Storm Foundry Production Spec](docs/STORM_FOUNDRY_PRODUCTION_SPEC.md)
- [Sprite Edit Guide](docs/SPRITE_EDIT_GUIDE.md)

## Core Files

- `game.html` — browser entry page that loads the modular runtime
- `src/main.js` — main game loop, rendering, input, and gameplay logic
- `src/levels/game-levels.js` — authored level data entries
- `src/levels/derived.js` — derived level arrays (`LEVELS`, names, themes, checkpoints)
- `src/sprites/sprite-data.js` — sprite definitions (`SPRITES`)
- `audio/audio-engine.js` — audio coordinator (master/mute, SFX bus, theme track crossfades)
- `audio/sfx.js` — gameplay SFX patterns (quack, flag raise, extra life)
- `audio/tracks.js` — procedural per-theme background music builders

## Notes

- Enemy-kill player death uses a sprite-shatter effect; see the section **"Player enemy-death shatter effect"** in [Sprite Edit Guide](docs/SPRITE_EDIT_GUIDE.md).
