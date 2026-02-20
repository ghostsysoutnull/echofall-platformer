function drawFxLayer(game, gfx, deps) {
  const { PALETTE, SPRITES, ONEUP_RADIAL_BURST, RELIC_PICKUP_FX, theme } = deps;

  const relicSprite = theme === "GOTHIC" ? SPRITES.relicGothicSmall : SPRITES.relicCrossSmall;

  for (let i = 0; i < game.coinDrops.length; i++) {
    game.drawSprite(game.collectibleSprite(2), game.coinDrops[i].x - game.cameraX, game.coinDrops[i].y - game.cameraY, 1);
  }

  for (let i = 0; i < game.magnetItems.length; i++) {
    const item = game.magnetItems[i];
    if (item.tileId === 6) {
      game.drawSprite(game.oneUpSpriteForTheme(theme), item.x - game.cameraX, item.y - game.cameraY, 1);
    } else if (item.tileId === 13) {
      game.drawSprite(relicSprite, item.x - game.cameraX, item.y - game.cameraY, 1);
    } else if (item.tileId === 14) {
      game.drawSprite(SPRITES.shinyFairyRelic, item.x - game.cameraX, item.y - game.cameraY, 1);
    } else if (item.tileId === 15) {
      game.drawSprite(relicSprite, item.x - game.cameraX, item.y - game.cameraY, 1);
    } else {
      game.drawSprite(game.collectibleSprite(item.tileId), item.x - game.cameraX, item.y - game.cameraY, 1);
    }
  }

  for (let i = 0; i < game.blockDebris.length; i++) {
    const debris = game.blockDebris[i];
    gfx.fillStyle = debris.col;
    gfx.fillRect((debris.x - game.cameraX) | 0, (debris.y - game.cameraY) | 0, debris.s, debris.s);
  }

  for (let i = 0; i < game.oneupBursts.length; i++) {
    const burst = game.oneupBursts[i];
    if (burst.ringT > 0) {
      const ringP = 1 - (burst.ringT / burst.ringLife);
      const ringR = ONEUP_RADIAL_BURST.ringRadiusStart + (ONEUP_RADIAL_BURST.ringRadiusEnd - ONEUP_RADIAL_BURST.ringRadiusStart) * ringP;
      gfx.globalAlpha = 1 - ringP;
      gfx.strokeStyle = PALETTE.F;
      gfx.beginPath();
      gfx.arc((burst.x - game.cameraX) | 0, (burst.y - game.cameraY) | 0, ringR, 0, 6.283);
      gfx.stroke();
    }

    const parts = burst.particles;
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];
      gfx.globalAlpha = part.life ? (part.t / part.life) : 1;
      gfx.fillStyle = part.col;
      gfx.fillRect((part.x - game.cameraX) | 0, (part.y - game.cameraY) | 0, 2, 2);
    }
  }

  for (let i = 0; i < game.relicBursts.length; i++) {
    const burst = game.relicBursts[i];
    if (burst.ringT > 0) {
      const ringP = 1 - (burst.ringT / burst.ringLife);
      const ringR = RELIC_PICKUP_FX.ringRadiusStart + (RELIC_PICKUP_FX.ringRadiusEnd - RELIC_PICKUP_FX.ringRadiusStart) * ringP;
      gfx.globalAlpha = Math.max(0.15, 1 - ringP);
      gfx.strokeStyle = burst.primary;
      gfx.beginPath();
      gfx.arc((burst.x - game.cameraX) | 0, (burst.y - game.cameraY) | 0, ringR, 0, 6.283);
      gfx.stroke();
      gfx.globalAlpha = Math.max(0.12, (1 - ringP) * 0.7);
      gfx.strokeStyle = burst.secondary;
      gfx.beginPath();
      gfx.arc((burst.x - game.cameraX) | 0, (burst.y - game.cameraY) | 0, Math.max(3, ringR * 0.58), 0, 6.283);
      gfx.stroke();
    }

    const parts = burst.particles;
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];
      gfx.globalAlpha = part.life ? (part.t / part.life) : 1;
      gfx.fillStyle = part.col;
      gfx.fillRect((part.x - game.cameraX) | 0, (part.y - game.cameraY) | 0, 2, 2);
    }
  }

  gfx.font = "10px monospace";
  for (let i = 0; i < game.relicFloatTexts.length; i++) {
    const text = game.relicFloatTexts[i];
    const alpha = Math.max(0.18, text.t / text.life);
    const tx = (text.x - game.cameraX) | 0;
    const ty = (text.y - game.cameraY) | 0;
    gfx.globalAlpha = alpha * 0.5;
    gfx.fillStyle = text.glow;
    gfx.fillText(text.text, tx - 1, ty - 1);
    gfx.globalAlpha = alpha;
    gfx.fillStyle = text.col;
    gfx.fillText(text.text, tx, ty);
  }
  gfx.globalAlpha = 1;
}

export { drawFxLayer };