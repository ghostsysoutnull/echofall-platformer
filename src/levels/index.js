export * from "./builders.js";
export * from "./game-levels.js";
export * from "./derived.js";

import { GAME_LEVELS } from "./game-levels.js";
import { LEVELS, LEVEL_NAMES, LEVEL_THEMES, LEVEL_BACKGROUND_ACTORS, LEVEL_CHECKPOINTS, LEVEL_LIGHT_ZONES } from "./derived.js";

window.GAME_LEVELS = GAME_LEVELS;
window.LEVELS = LEVELS;
window.LEVEL_NAMES = LEVEL_NAMES;
window.LEVEL_THEMES = LEVEL_THEMES;
window.LEVEL_BACKGROUND_ACTORS = LEVEL_BACKGROUND_ACTORS;
window.LEVEL_CHECKPOINTS = LEVEL_CHECKPOINTS;
window.LEVEL_LIGHT_ZONES = LEVEL_LIGHT_ZONES;
