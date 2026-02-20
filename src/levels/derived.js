import { GAME_LEVELS } from "./game-levels.js";

// Sort by sequence and derive ordered arrays for the game engine
GAME_LEVELS.sort((a, b) => a.sequence - b.sequence);
const LEVELS = GAME_LEVELS.map(l => l.grid);
const LEVEL_NAMES = GAME_LEVELS.map(l => l.name);
const LEVEL_THEMES = GAME_LEVELS.map(l => l.theme);
const LEVEL_BACKGROUND_ACTORS = GAME_LEVELS.map(l => l.backgroundActors || []);
const LEVEL_CHECKPOINTS = GAME_LEVELS.map(l => l.checkpoints || []);
const LEVEL_LIGHT_ZONES = GAME_LEVELS.map(l => l.lightZones || []);

// Utility function: validate a level before adding
function validateLevel(name, grid) {
  const errors = [];
  const expectedWidth = grid[0] ? grid[0].length : 0;

  if (grid.length !== 18) errors.push(`${name}: Expected 18 rows, got ${grid.length}`);
  if (expectedWidth <= 0) errors.push(`${name}: Empty or invalid row width`);

  grid.forEach((row, i) => {
    if (row.length !== expectedWidth) errors.push(`${name} row ${i}: Expected ${expectedWidth} chars, got ${row.length}`);
  });

  if (grid[17].length !== expectedWidth) errors.push(`${name}: Row 17 width mismatch`);

  let spawnCount = 0, flagCount = 0;
  for (let i = 0; i < 17; i++) {
    for (let j = 0; j < expectedWidth; j++) {
      if (grid[i][j] === 'S') spawnCount++;
      if (grid[i][j] === 'F') flagCount++;
    }
  }
  if (spawnCount !== 1) errors.push(`${name}: Expected 1 spawn (S), got ${spawnCount}`);
  if (flagCount !== 1) errors.push(`${name}: Expected 1 flag (F), got ${flagCount}`);

  // Check enemies on ground
  for (let i = 0; i < 17; i++) {
    for (let j = 0; j < expectedWidth; j++) {
      if (grid[i][j] === 'E') {
        if (grid[17][j] !== '#') console.warn(`  ⚠ ${name}: Walker at (col ${j}, row ${i}) over pit (GROUND[${j}]='${grid[17][j]}')`);
      }
    }
  }

  if (errors.length === 0) {
    console.log(`✓ ${name} is valid`);
    return true;
  } else {
    errors.forEach(e => console.error(`✗ ${e}`));
    return false;
  }
}


export { LEVELS, LEVEL_NAMES, LEVEL_THEMES, LEVEL_BACKGROUND_ACTORS, LEVEL_CHECKPOINTS, LEVEL_LIGHT_ZONES, validateLevel };
