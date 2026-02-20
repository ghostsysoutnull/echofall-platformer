function drawPlayerAndEffects(game, gfx, deps) {
  const { SPRITES, BUNNY_CARROT_ROCKET } = deps;

  game.drawPlayerShatter();

  if (game.ninjaShadow.trail.length) {
    for (let i = 0; i < game.ninjaShadow.trail.length; i++) {
      const ghost = game.ninjaShadow.trail[i];
      gfx.globalAlpha = Math.max(0.12, (ghost.t / ghost.life) * 0.45);
      gfx.fillStyle = "#7f6cff";
      gfx.fillRect((ghost.x - game.cameraX) | 0, (ghost.y - game.cameraY) | 0, ghost.w, ghost.h);
      gfx.fillStyle = "#b9f8ff";
      gfx.fillRect(((ghost.x - game.cameraX) + 2) | 0, ((ghost.y - game.cameraY) + 2) | 0, Math.max(2, ghost.w - 4), Math.max(2, ghost.h - 4));
    }
    gfx.globalAlpha = 1;
  }

  if (game.batCompanion.trail.length) {
    for (let i = 0; i < game.batCompanion.trail.length; i++) {
      const trail = game.batCompanion.trail[i];
      const alpha = Math.max(0.12, trail.life ? (trail.t / trail.life) * 0.5 : 0.3);
      const tx = (trail.x - game.cameraX) | 0;
      const ty = (trail.y - game.cameraY) | 0;
      gfx.globalAlpha = alpha;
      gfx.fillStyle = "#9af7ff";
      gfx.beginPath();
      gfx.arc(tx, ty, Math.max(1, trail.size), 0, 6.283);
      gfx.fill();
      gfx.globalAlpha = alpha * 0.65;
      gfx.fillStyle = "#ffe5ff";
      gfx.beginPath();
      gfx.arc(tx, ty, Math.max(1, trail.size - 1), 0, 6.283);
      gfx.fill();
    }
    gfx.globalAlpha = 1;
  }

  if (game.bunnyRocket.trail.length) {
    for (let i = 0; i < game.bunnyRocket.trail.length; i++) {
      const ghost = game.bunnyRocket.trail[i];
      gfx.globalAlpha = Math.max(0.12, (ghost.t / ghost.life) * 0.5);
      gfx.fillStyle = "#ff8c34";
      gfx.fillRect((ghost.x - game.cameraX) | 0, (ghost.y - game.cameraY) | 0, ghost.w, ghost.h);
      gfx.fillStyle = "#ffd95e";
      gfx.fillRect(((ghost.x - game.cameraX) + 2) | 0, ((ghost.y - game.cameraY) + 2) | 0, Math.max(2, ghost.w - 4), Math.max(2, ghost.h - 4));
    }
    gfx.globalAlpha = 1;
  }

  if (game.bunnyRocket.burstFlash > 0) {
    const t = game.bunnyRocket.burstFlash / BUNNY_CARROT_ROCKET.burstFlashFrames;
    const r = (BUNNY_CARROT_ROCKET.burstRadius * (1.55 - t * 0.45)) | 0;
    const bx = (game.bunnyRocket.burstX - game.cameraX) | 0;
    const by = (game.bunnyRocket.burstY - game.cameraY) | 0;
    gfx.globalAlpha = Math.max(0.18, t * 0.65);
    gfx.fillStyle = "#ff8c34";
    gfx.beginPath();
    gfx.arc(bx, by, Math.max(6, r), 0, 6.283);
    gfx.fill();
    gfx.globalAlpha = Math.max(0.16, t * 0.45);
    gfx.fillStyle = "#ffd95e";
    gfx.beginPath();
    gfx.arc(bx, by, Math.max(3, (r * 0.55) | 0), 0, 6.283);
    gfx.fill();
    gfx.globalAlpha = 1;
  }

  const player = game.player;
  const px = player.x - game.cameraX;
  const py = player.y - game.cameraY;

  if (game.deathTimer <= 0) {
    if (player.face < 0) {
      gfx.save();
      gfx.translate(((px + player.w) | 0), (py | 0));
      gfx.scale(-1, 1);
      game.drawPlayer(0, 0);
      gfx.restore();
    } else {
      game.drawPlayer(px, py);
    }
  }

  game.drawBoneCryptWeatherOverlay();

  if (game.batCompanion.active) {
    const bx = game.batCompanion.x - game.cameraX;
    const by = game.batCompanion.y - game.cameraY;
    game.drawSprite(SPRITES.shinyFairyCompanion, bx - 5, by - 5, 1);
    if (game.batCompanion.shimmer < 6) {
      gfx.globalAlpha = 0.45;
      gfx.strokeStyle = "#9af7ff";
      gfx.beginPath();
      gfx.arc(bx | 0, by | 0, 8, 0, 6.283);
      gfx.stroke();
      gfx.globalAlpha = 1;
    }
  }

  if (game.batCompanion.burstT > 0 && game.batCompanion.burstLife > 0) {
    const p = 1 - (game.batCompanion.burstT / game.batCompanion.burstLife);
    const bx = (game.batCompanion.burstX - game.cameraX) | 0;
    const by = (game.batCompanion.burstY - game.cameraY) | 0;
    for (let i = 0; i < 3; i++) {
      const ringP = Math.max(0, p - i * 0.12);
      if (ringP <= 0) continue;
      const r = 4 + ringP * (8 + i * 7);
      gfx.globalAlpha = Math.max(0.12, (1 - ringP) * 0.55);
      gfx.strokeStyle = i === 1 ? "#ffe5ff" : "#9af7ff";
      gfx.beginPath();
      gfx.arc(bx, by, r, 0, 6.283);
      gfx.stroke();
    }
    gfx.globalAlpha = 1;
  }

  for (let i = 0; i < game.checkpointRain.length; i++) {
    const drop = game.checkpointRain[i];
    gfx.globalAlpha = Math.max(0.2, drop.t / drop.life);
    gfx.fillStyle = drop.col;
    gfx.fillRect((drop.x - game.cameraX) | 0, (drop.y - game.cameraY) | 0, drop.size, drop.size + 1);
  }
  gfx.globalAlpha = 1;
}

export { drawPlayerAndEffects };