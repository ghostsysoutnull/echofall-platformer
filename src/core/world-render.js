function drawWorldLayer(game, gfx, deps) {
  const { TILE_SIZE, CANVAS_W, CANVAS_H, PALETTE, SPRITES, theme, t } = deps;

  const sx = (game.cameraX / TILE_SIZE) | 0;
  const sy = (game.cameraY / TILE_SIZE) | 0;
  const ex = sx + ((CANVAS_W / TILE_SIZE) | 0) + 3;
  const ey = sy + ((CANVAS_H / TILE_SIZE) | 0) + 3;

  const relicSprite = theme === "GOTHIC" ? SPRITES.relicGothicSmall : SPRITES.relicCrossSmall;
  for (let y = sy; y < ey; y++) for (let x = sx; x < ex; x++) {
    const id = game.tileIdAt(x, y);
    const px = x * TILE_SIZE - game.cameraX;
    const py = y * TILE_SIZE - game.cameraY;

    if (id === 1 || id === 4 || id === 12) {
      game.drawSprite(game.tileSprite(id), px, py, 1);
      if (theme === "SPACE" && (((x * 5 + y * 3 + t) & 7) === 0)) {
        gfx.fillStyle = PALETTE.H;
        gfx.fillRect(px + 1, py + 1, 1, 1);
      }
    }
    else if (id === 13) game.drawSprite(relicSprite, px, py, 1);
    else if (id === 14) game.drawSprite(SPRITES.shinyFairyRelic, px, py, 1);
    else if (id === 15) game.drawSprite(relicSprite, px, py, 1);
    else if (id === 2 || id === 5) game.drawSprite(game.collectibleSprite(id), px, py, 1);
    else if (id === 6) game.drawSprite(game.oneUpSpriteForTheme(theme), px, py, 1);
    else if (id === 7) game.drawSprite((t & 1) ? SPRITES.lavaTileA : SPRITES.lavaTileB, px, py, 1);
    else if (id === 10) game.drawSprite(((game.player.anim >> 3) & 1) ? SPRITES.helpBlockTopUnusedB : SPRITES.helpBlockTopUnusedA, px, py, 1);
    else if (id === 8) game.drawSprite(((game.player.anim >> 3) & 1) ? SPRITES.helpBlockBottomUnusedB : SPRITES.helpBlockBottomUnusedA, px, py, 1);
    else if (id === 11) game.drawSprite(SPRITES.helpBlockTopUsed, px, py, 1);
    else if (id === 9) game.drawSprite(SPRITES.helpBlockBottomUsed, px, py, 1);
  }

  game.drawStormMechanicsOverlay(theme);

  if (game.goal) {
    const baseX = (game.goal.x - game.cameraX) | 0;
    const baseY = (game.goal.baseY - game.cameraY) | 0;
    for (let j = 1; j <= game.goal.poleHeightTiles; j++) {
      game.drawSprite(((j ^ t) & 1) ? SPRITES.goalPoleSegmentA : SPRITES.goalPoleSegmentB, baseX, baseY - j * TILE_SIZE, 1);
    }
    game.drawSprite(SPRITES.goalPoleTop, baseX, baseY - (game.goal.poleHeightTiles + 1) * TILE_SIZE, 1);
    game.drawSprite(t === 0 ? SPRITES.goalFlagA : t === 1 ? SPRITES.goalFlagB : SPRITES.goalFlagC, (game.goal.flagX - game.cameraX) | 0, (game.goal.flagY - game.cameraY) | 0, 1);
  }

  for (let i = 0; i < game.portals.length; i++) {
    const portal = game.portals[i];
    const px = (portal.x - game.cameraX) | 0;
    const py = (portal.y - game.cameraY - 8) | 0;
    const huePulse = (Math.sin(game.player.anim * 0.02 + i * 1.2) + 1) * 0.5;
    gfx.strokeStyle = portal.type === "dimensional"
      ? (huePulse > 0.5 ? "#ff86d8" : "#76e6ff")
      : (huePulse > 0.5 ? "#9f7bff" : "#4ef3ff");
    gfx.strokeRect(px - 1, py - 1, 14, 20);
    gfx.strokeRect(px + 2, py + 2, 8, 14);
    if (portal.type === "dimensional") {
      gfx.fillStyle = "#ff86d840";
      gfx.fillRect(px + 4, py + 2, 4, 14);
      gfx.fillRect(px + 1, py + 7, 10, 4);
      gfx.strokeRect(px + 4, py + 2, 4, 14);
      gfx.strokeRect(px + 1, py + 7, 10, 4);
    }
  }
}

export { drawWorldLayer };