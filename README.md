# Mini Platformer

Quick index for this workspace.

## Documentation

- [Add Levels Guide](docs/ADD_LEVELS_README.md)
- [Level Design Guide](docs/LEVEL_DESIGN_GUIDE.md)
- [Levels Overview](docs/LEVELS_OVERVIEW.md)
- [Jungle 4x Production Spec](docs/JUNGLE_4X_PRODUCTION_SPEC.md)
- [Storm Foundry Production Spec](docs/STORM_FOUNDRY_PRODUCTION_SPEC.md)
- [Sprite Edit Guide](docs/SPRITE_EDIT_GUIDE.md)

## Core Files

- `game.html` — main game loop, rendering, input, gameplay logic
- `levels.js` — level data, order, themes, and level validation utilities
- `audio/audio-engine.js` — audio coordinator (master/mute, SFX bus, theme track crossfades)
- `audio/sfx.js` — gameplay SFX patterns (quack, flag raise, extra life)
- `audio/tracks.js` — procedural per-theme background music builders

## Notes

- Enemy-kill player death uses a sprite-shatter effect; see the section **"Player enemy-death shatter effect"** in [Sprite Edit Guide](docs/SPRITE_EDIT_GUIDE.md).
