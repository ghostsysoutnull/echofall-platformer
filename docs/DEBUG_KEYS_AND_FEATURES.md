# Debug Keys & Features

This document lists developer/debug keyboard shortcuts that are intentionally not shown in the in-game help overlay.

## Debug Keys

- `6` — Toggle immortal mode
  - Internal behavior: toggles `immortalMode` on/off.
  - Shows a short debug notice (`DEBUG: IMMORTAL ON/OFF`).

- `7` — Add coins
  - Adds `+70` coins.
  - If Skeleton phase-2 charge is idle, starts/restarts that charge timer.
  - Shows a short debug notice (`DEBUG: +70 COINS`).

- `8` — Jump to Shadowrunner Arcology
  - Unlocks Shadowrunner.
  - Switches current character to Shadowrunner (if available).
  - Loads the first `SHADOWRUN` theme level.
  - Shows a short debug notice (`DEBUG: SHADOWRUNNER ARCLOGY`).

- `H` — Jump to test biome
  - Loads level named `TEST BIOME` if present.
  - Shows a short notice (`TEST BIOME`).

## Notes

- In-game help text is kept player-facing and does not list debug shortcuts.
- HUD no longer displays the `IMMORTAL` label even when immortal mode is enabled.
- Debug notices for debug actions still appear via transient teleport notice text.
