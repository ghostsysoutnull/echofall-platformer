# Mini Platformer

Quick index for this workspace.

## Play Online

- [Play EchoFall Platformer](https://ghostsysoutnull.github.io/echofall-platformer/)

## Documentation

- [Docs Hub](docs/README.md)
- [Add Levels Guide](docs/guides/ADD_LEVELS_README.md)
- [Level Design Guide](docs/guides/LEVEL_DESIGN_GUIDE.md)
- [Levels Overview](docs/guides/LEVELS_OVERVIEW.md)
- [Mobile Device Roadmap](docs/mobile/MOBILE_DEVICE_ROADMAP.md)
- [Mobile Phase 1 Sprint Tasks](docs/mobile/MOBILE_PHASE1_SPRINT_TASKS.md)
- [Mobile Phase 1 Implementation Notes](docs/mobile/MOBILE_PHASE1_IMPLEMENTATION_NOTES.md)
- [Mobile Automated Tests](docs/testing/MOBILE_AUTOMATED_TESTS.md)
- [GitHub Actions Mobile CI Decision Guide](docs/testing/GITHUB_ACTIONS_MOBILE_CI_DECISION_GUIDE.md)
- [Mobile Work Change Summary](docs/mobile/MOBILE_WORK_CHANGE_SUMMARY.md)
- [Mobile Touch MVP Implementation Notes](docs/mobile/MOBILE_TOUCH_MVP_IMPLEMENTATION.md)
- [Jungle: Ruin Ascent Production Spec](docs/specs/JUNGLE_RUIN_ASCENT_PRODUCTION_SPEC.md)
- [Storm Foundry Production Spec](docs/specs/STORM_FOUNDRY_PRODUCTION_SPEC.md)
- [Sprite Edit Guide](docs/guides/SPRITE_EDIT_GUIDE.md)

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

- Enemy-kill player death uses a sprite-shatter effect; see the section **"Player enemy-death shatter effect"** in [Sprite Edit Guide](docs/guides/SPRITE_EDIT_GUIDE.md).
