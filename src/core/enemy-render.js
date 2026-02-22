function drawEnemyLayer(game, gfx, deps) {
  const { theme, levelName } = deps;
  const enemyLabelForType = (type) => {
    if (type === 0) return "WALKER";
    if (type === 1) return "BAT";
    if (type === 2) return "FALCON";
    if (type === 3) return "GHOST";
    if (type === 4) return "VAMP Z";
    if (type === 5) return "VAMPIRE";
    if (type === 6) return "BONE WISP";
    if (type === 7) return "HARBINGER";
    if (type === 8) return "SHIELD WORKER";
    if (type === 9) return "FRANKENSTEIN";
    return "ENEMY";
  };
  const drawEnemyLabel = (enemy) => {
    const label = enemyLabelForType(enemy.type);
    const ex = (enemy.x - game.cameraX) | 0;
    const ey = (enemy.y - game.cameraY) | 0;
    const cx = ex + ((enemy.w * 0.5) | 0);
    gfx.font = "8px monospace";
    const w = (gfx.measureText(label).width | 0);
    const tx = cx - ((w * 0.5) | 0);
    const ty = ey - 6;
    gfx.fillStyle = "#000a";
    gfx.fillRect(tx - 2, ty - 8, w + 4, 10);
    gfx.fillStyle = "#fff";
    gfx.fillText(label, tx, ty);
  };

  for (let i = 0; i < game.enemies.length; i++) {
    const enemy = game.enemies[i];
    if (enemy.dead) continue;
    const sprite = game.enemySpriteFor(enemy, theme);
    game.drawSprite(sprite, enemy.x - game.cameraX, enemy.y - game.cameraY, enemy.type === 5 ? 2.5 : (enemy.type === 7 ? 1.5 : 1));
    if (enemy.type === 8 && enemy.workerState === "SHIELD_UP") {
      const ex = (enemy.x - game.cameraX) | 0;
      const ey = (enemy.y - game.cameraY) | 0;
      gfx.globalAlpha = 0.6;
      gfx.fillStyle = "#8ef6ff";
      if (enemy.dir >= 0) gfx.fillRect(ex + enemy.w - 2, ey + 2, 2, 6);
      else gfx.fillRect(ex, ey + 2, 2, 6);
      gfx.globalAlpha = 1;
    }
    if (levelName === "TEST BIOME") drawEnemyLabel(enemy);
    if (theme === "SPACE" && enemy.type) game.drawSpaceThruster(enemy);
  }

  for (let i = 0; i < game.vampireBlood.length; i++) {
    const drop = game.vampireBlood[i];
    gfx.globalAlpha = Math.max(0.15, drop.t / drop.life);
    gfx.fillStyle = drop.size > 1 ? "#b3122d" : "#7d0a1b";
    gfx.fillRect((drop.x - game.cameraX) | 0, (drop.y - game.cameraY) | 0, drop.size, drop.size + 1);
  }

  for (let i = 0; i < game.cryptTrails.length; i++) {
    const trail = game.cryptTrails[i];
    gfx.globalAlpha = Math.max(0.12, trail.t / trail.life);
    gfx.fillStyle = trail.kind === "wisp" ? "#8fd6c1" : "#8a6cff";
    const tx = (trail.x - game.cameraX) | 0;
    const ty = (trail.y - game.cameraY) | 0;
    gfx.fillRect(tx, ty, trail.size, trail.size);
    if (trail.kind === "sigil" && trail.size > 1) {
      gfx.fillStyle = "#d6c5ff";
      gfx.fillRect(tx + 1, ty + 1, 1, 1);
    }
  }

  for (let i = 0; i < game.skeletonBurstShots.length; i++) {
    const shot = game.skeletonBurstShots[i];
    gfx.globalAlpha = Math.max(0.25, shot.t / shot.life);
    gfx.fillStyle = "#b3122d";
    gfx.fillRect(((shot.x - game.cameraX) - 1) | 0, ((shot.y - game.cameraY) - 1) | 0, 3, 3);
    gfx.fillStyle = "#ff8da6";
    gfx.fillRect((shot.x - game.cameraX) | 0, (shot.y - game.cameraY) | 0, 1, 1);
  }
  gfx.globalAlpha = 1;

  game.drawEnemyShatter();
}

export { drawEnemyLayer };