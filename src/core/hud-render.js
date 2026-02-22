function drawHudAndNotices(game, gfx, deps) {
  const {
    CANVAS_W,
    CANVAS_H,
    LEVEL_NAMES,
    CHARACTERS,
    PALETTE,
    ROBOT_MAGNET_PULSE,
    NINJA_SHADOW_STEP,
    HACKER_SKILLS,
    RANGER_GRAPPLE,
    RELIC_PICKUP_FX,
    getThemeForLevel
  } = deps;

  const HUD_FONT = "10px monospace";
  const setHudFont = () => {
    if (gfx.font !== HUD_FONT) gfx.font = HUD_FONT;
  };
  const drawHudText = (text, x, y, color) => {
    setHudFont();
    if (color) gfx.fillStyle = color;
    gfx.fillText(text, x, y);
  };
  const measureHudText = (text) => {
    setHudFont();
    return gfx.measureText(text).width;
  };
  const ellipsizeHudText = (text, maxWidth) => {
    const src = String(text || "");
    if (maxWidth <= 0) return "";
    if (measureHudText(src) <= maxWidth) return src;
    const ellipsis = "…";
    if (measureHudText(ellipsis) > maxWidth) return "";
    let lo = 0;
    let hi = src.length;
    while (lo < hi) {
      const mid = ((lo + hi + 1) / 2) | 0;
      const candidate = src.slice(0, mid) + ellipsis;
      if (measureHudText(candidate) <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    return src.slice(0, lo) + ellipsis;
  };
  const compactCharacterName = (name) => {
    if (name === "GLITCHRUNNER") return "GLITCH";
    if (name === "SHADOWRUNNER") return "SHADOW";
    return name;
  };
  const drawNotice = (x, y, w, h, text, tx, ty, bg = "#000b", fg = "#fff") => {
    gfx.fillStyle = bg;
    gfx.fillRect(x, y, w, h);
    drawHudText(text, tx, ty, fg);
  };

  if (game.relicFlash > 0) {
    const flashP = game.relicFlash / RELIC_PICKUP_FX.flashFrames;
    const flashTheme = getThemeForLevel(game.levelIndex) === "GOTHIC";
    gfx.globalAlpha = flashP * 0.2;
    gfx.fillStyle = flashTheme ? "#ad98ff" : "#f3d44a";
    gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    gfx.globalAlpha = 1;
  }

  if (game.levelNameBanner) {
    const bannerX = 78;
    const bannerY = 62;
    const bannerW = 164;
    const bannerH = 28;
    const title = LEVEL_NAMES[game.levelIndex] || "";
    gfx.fillStyle = "#000a";
    gfx.fillRect(bannerX, bannerY, bannerW, bannerH);
    gfx.fillStyle = "#fff";
    gfx.font = "16px monospace";
    const tw = gfx.measureText(title).width;
    const tx = bannerX + ((bannerW - tw) * 0.5);
    const ty = bannerY + ((bannerH + 12) * 0.5);
    gfx.fillText(title, tx | 0, ty | 0);
  }

  if (game.geometryMusicNotice > 0 && getThemeForLevel(game.levelIndex) === "GEOMETRYDREAM") {
    gfx.globalAlpha = Math.min(1, game.geometryMusicNotice / 25);
    gfx.fillStyle = "#00000080";
    gfx.fillRect(100, 94, 120, 16);
    gfx.fillStyle = "#9fe7ff";
    gfx.font = "8px monospace";
    gfx.fillText(game.geometryMusicLabel, 135, 105);
    gfx.globalAlpha = 1;
  }

  if (game.helpTimer > 0) {
    gfx.fillStyle = "#000c";
    gfx.fillRect(16, 22, 288, 82);
    drawHudText("SPECIAL KEYS", 112, 36, "#fff");
    drawHudText("MOVE: Arrows / A,D", 24, 50, "#fff");
    drawHudText("JUMP: Space / Up", 168, 50, "#fff");
    drawHudText("1/2: Switch Character", 24, 62, "#fff");
    drawHudText("Q/W/E: Character Skills", 168, 62, "#fff");
    drawHudText("P: Pause  R: Restart  N: Prev  M: Next", 72, 74, "#fff");
    drawHudText("X: Mute  9/0: BGM -/+", 24, 86, "#fff");
  }

  if (game.checkpointNotice > 0 && game.activeCheckpointIndex >= 0 && game.levelCheckpoints[game.activeCheckpointIndex]) {
    const cp = game.levelCheckpoints[game.activeCheckpointIndex];
    drawNotice(82, 40, 156, 20, "CHECKPOINT: " + cp.label, 90, 53);
  }

  if (game.teleportNoticeTimer > 0 && game.teleportNotice) {
    gfx.globalAlpha = Math.min(1, game.teleportNoticeTimer / 24);
    drawNotice(70, 56, 180, 16, game.teleportNotice, 80, 67, "#000b", "#9fe7ff");
    gfx.globalAlpha = 1;
  }

  const levelNameFull = LEVEL_NAMES[game.levelIndex] || "";
  const charNameFull = CHARACTERS[game.characterIndex].name;
  const scoreText = "S" + game.score;
  const coinText = "C" + game.coins;
  const lifeText = "♥" + game.lives;
  const cpText = game.levelCheckpoints.length
    ? ("CP " + Math.max(0, game.activeCheckpointIndex + 1) + "/" + game.levelCheckpoints.length)
    : "";

  let abilityText = "";
  let secondaryLeftText = "";
  const charName = charNameFull;
  if (charName === "ROBOT") {
    const phase2Ready = game.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold;
    abilityText = game.robotPulse.timer > 0
      ? (game.robotPulse.phase2Active ? "Q PHASE2" : "Q PULSE")
      : game.robotPulse.cooldown > 0
        ? ("Q " + ((game.robotPulse.cooldown / 60) | 0) + "s")
        : (phase2Ready ? "Q READY+" : "Q READY");
  } else if (charName === "RANGER") {
    abilityText = game.rangerGrapple.active
      ? "Q GRAPPLE"
      : game.rangerGrapple.cooldown > 0
        ? ("Q " + ((game.rangerGrapple.cooldown / 60) | 0) + "s")
        : "Q READY";
  } else if (charName === "BUNNY") {
    const hasCharges = game.bunnyRocket.charges > 0;
    const rechargeSecs = Math.max(1, ((game.bunnyRocket.rechargeTimer / 60) | 0));
    abilityText = game.bunnyRocket.active
      ? "Q ROCKET"
      : hasCharges
        ? ("Q x" + game.bunnyRocket.charges)
        : ("Q x0 " + rechargeSecs + "s");
  } else if (charName === "DUCK") {
    abilityText = game.duckDive.active
      ? "Q DIVE"
      : game.duckDive.cooldown > 0
        ? ("Q " + ((game.duckDive.cooldown / 60) | 0) + "s")
        : (game.player && game.player.onGround ? "Q AIR" : "Q READY");
  } else if (charName === "PALADIN") {
    abilityText = game.paladinDash.active
      ? "Q AEGIS"
      : game.paladinDash.cooldown > 0
        ? ("Q " + ((game.paladinDash.cooldown / 60) | 0) + "s")
        : "Q READY";
  } else if (charName === "NINJA") {
    const overdriveReady = game.ninjaShadow.cooldown > 0 && !game.ninjaShadow.overdriveUsed && game.coins >= NINJA_SHADOW_STEP.overdriveCoinCost;
    const overdriveBlocked = game.ninjaShadow.cooldown > 0 && !game.ninjaShadow.overdriveUsed && game.coins < NINJA_SHADOW_STEP.overdriveCoinCost;
    abilityText = game.ninjaShadow.active
      ? "Q SHADOW"
      : overdriveReady
        ? ("Q -" + NINJA_SHADOW_STEP.overdriveCoinCost + "C")
        : overdriveBlocked
          ? ("Q NEED " + NINJA_SHADOW_STEP.overdriveCoinCost)
          : game.ninjaShadow.cooldown > 0
            ? ("Q " + ((game.ninjaShadow.cooldown / 60) | 0) + "s")
            : "Q READY";
  } else if (charName === "GLITCHRUNNER") {
    abilityText = game.glitchPhase.active
      ? "Q PHASE"
      : game.glitchPhase.cooldown > 0
        ? ("Q " + ((game.glitchPhase.cooldown / 60) | 0) + "s")
        : "Q READY";
    secondaryLeftText = game.glitchPhase.echoReady ? "ECHO READY" : ("ECHO " + Math.max(1, ((game.glitchPhase.echoCooldown / 60) | 0)) + "s");
  } else if (charName === "SHADOWRUNNER") {
    const oneText = game.hackerSkill.spike.cooldown > 0 ? ("1 " + ((game.hackerSkill.spike.cooldown / 60) | 0) + "s") : "1 SPIKE";
    const twoText = game.hackerSkill.swarm.active
      ? ("2 SWARM " + Math.max(1, ((game.hackerSkill.swarm.timer / 60) | 0)) + "s")
      : game.hackerSkill.swarm.cooldown > 0
        ? ("2 " + ((game.hackerSkill.swarm.cooldown / 60) | 0) + "s")
        : "2 SWARM";
    abilityText = game.hackerSkill.fork.cooldown > 0 ? ("Q " + ((game.hackerSkill.fork.cooldown / 60) | 0) + "s") : "Q FORK";
    secondaryLeftText = oneText + "  " + twoText;
  } else if (charName === "SKELETON") {
    const phase2Eligible = game.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold;
    const phase2Charged = !!game.skeletonBurst.phase2Charged;
    const phase2Charging = phase2Eligible && !phase2Charged && game.skeletonBurst.phase2ChargeFrames > 0;
    abilityText = game.skeletonBurst.flash > 0
      ? (game.skeletonBurst.lastPhase2 ? "Q BLOOD+" : "Q BURST")
      : game.skeletonBurst.cooldown > 0
        ? ("Q " + ((game.skeletonBurst.cooldown / 60) | 0) + "s")
        : (phase2Charged ? "Q READY+" : (phase2Charging ? ("Q CHRG " + Math.max(1, ((game.skeletonBurst.phase2ChargeFrames / 60) | 0)) + "s") : "Q READY"));
  }

  const coreText = game.hasConductorCoreActive()
    ? ("CORE " + Math.max(1, ((game.conductorCore.timer / 60) | 0)) + "s")
    : "";

  gfx.fillStyle = "#0008";
  gfx.fillRect(0, 0, CANVAS_W, 14);
  drawHudText(scoreText, 4, 11, "#C9A06D");
  drawHudText(coinText, 42, 11, PALETTE.F);
  drawHudText(lifeText, 78, 11, PALETTE.C);

  const hudTopY = 11;
  const hudRow2Y = 23;
  const centerStartX = 112;
  const rightEdgeX = CANVAS_W - 4;
  const itemGap = 8;

  const rightItemsActive = [];
  if (abilityText) rightItemsActive.push({ key: "ability", text: abilityText, color: "#fff" });
  if (cpText) rightItemsActive.push({ key: "cp", text: cpText, color: "#fff" });
  if (game.audio.muted) rightItemsActive.push({ key: "mute", text: "MUTE", color: "#fff" });

  const rightItemsDemoted = [];
  const calcRightWidth = (items) => {
    if (!items.length) return 0;
    let total = 0;
    for (let i = 0; i < items.length; i++) total += measureHudText(items[i].text);
    total += itemGap * (items.length - 1);
    return total;
  };

  let levelNameDisplay = levelNameFull;
  let charNameDisplay = charNameFull;
  const centerGap = 10;
  const fitCenterTexts = (maxWidth) => {
    let levelText = levelNameFull;
    let charText = charNameFull;
    let total = measureHudText(levelText) + centerGap + measureHudText(charText);
    if (total <= maxWidth) return { levelText, charText, overflow: false };

    charText = compactCharacterName(charText);
    total = measureHudText(levelText) + centerGap + measureHudText(charText);
    if (total <= maxWidth) return { levelText, charText, overflow: false };

    const levelBudget = Math.max(24, maxWidth - centerGap - measureHudText(charText));
    levelText = ellipsizeHudText(levelText, levelBudget);
    total = measureHudText(levelText) + centerGap + measureHudText(charText);
    if (total <= maxWidth) return { levelText, charText, overflow: false };

    const charBudget = Math.max(20, maxWidth - centerGap - measureHudText(levelText));
    charText = ellipsizeHudText(charText, charBudget);
    total = measureHudText(levelText) + centerGap + measureHudText(charText);
    if (total <= maxWidth) return { levelText, charText, overflow: false };

    levelText = ellipsizeHudText(levelNameFull, Math.max(20, (maxWidth * 0.58) | 0));
    charText = ellipsizeHudText(charNameFull, Math.max(16, maxWidth - centerGap - measureHudText(levelText)));
    total = measureHudText(levelText) + centerGap + measureHudText(charText);
    return { levelText, charText, overflow: total > maxWidth };
  };

  while (true) {
    const availableCenter = Math.max(12, rightEdgeX - calcRightWidth(rightItemsActive) - itemGap - centerStartX);
    const fit = fitCenterTexts(availableCenter);
    levelNameDisplay = fit.levelText;
    charNameDisplay = fit.charText;
    if (!fit.overflow) break;

    const demoteKey = rightItemsActive.some((item) => item.key === "mute")
      ? "mute"
      : (rightItemsActive.some((item) => item.key === "cp") ? "cp" : "");
    if (!demoteKey) break;
    const idx = rightItemsActive.findIndex((item) => item.key === demoteKey);
    rightItemsDemoted.push(rightItemsActive[idx]);
    rightItemsActive.splice(idx, 1);
  }

  drawHudText(levelNameDisplay, centerStartX, hudTopY, "#fff");
  drawHudText(charNameDisplay, centerStartX + measureHudText(levelNameDisplay) + centerGap, hudTopY, "#fff");

  let rightX = rightEdgeX;
  for (let i = rightItemsActive.length - 1; i >= 0; i--) {
    const item = rightItemsActive[i];
    const width = measureHudText(item.text);
    drawHudText(item.text, rightX - width, hudTopY, item.color);
    rightX -= width + itemGap;
  }

  if (secondaryLeftText) {
    drawHudText(secondaryLeftText, 6, hudRow2Y, "#fff");
  }

  const row2RightItems = [];
  for (let i = 0; i < rightItemsDemoted.length; i++) row2RightItems.push(rightItemsDemoted[i]);
  if (coreText) row2RightItems.push({ key: "core", text: coreText, color: "#fff" });

  let row2RightX = rightEdgeX;
  for (let i = row2RightItems.length - 1; i >= 0; i--) {
    const item = row2RightItems[i];
    const width = measureHudText(item.text);
    drawHudText(item.text, row2RightX - width, hudRow2Y, item.color);
    row2RightX -= width + itemGap;
  }

  if (CHARACTERS[game.characterIndex].name === "ROBOT" && (game.robotPulse.phase2Notice > 0 || (game.robotPulse.timer > 0 && game.robotPulse.phase2Active))) {
    drawNotice(106, 16, 108, 16, "PHASE 2 ACTIVE", 114, 27, "#000b", "#fff");
  }

  if (CHARACTERS[game.characterIndex].name === "ROBOT" && game.robotPulse.killNotice > 0) {
    drawNotice(106, 34, 108, 16, "PHASE 2 KILL x" + game.robotPulse.killCount, 108, 45, "#000c", PALETTE.F);
  }

  if (CHARACTERS[game.characterIndex].name === "SKELETON" && (game.skeletonBurst.phase2Notice > 0 || (game.skeletonBurst.flash > 0 && game.skeletonBurst.lastPhase2))) {
    drawNotice(106, 16, 108, 16, "BLOOD PHASE 2", 114, 27, "#000b", "#fff");
  }

  if (CHARACTERS[game.characterIndex].name === "GLITCHRUNNER" && (game.glitchPhase.active || game.glitchPhase.afterglow > 0)) {
    drawNotice(98, 16, 126, 16, game.glitchPhase.active ? "PHASE DASH ACTIVE" : "ECHO-SHIFT READY", 102, 27, "#000b", "#9fe7ff");
  }

  if (CHARACTERS[game.characterIndex].name === "SHADOWRUNNER" && (game.hackerSkill.globalLock > 0 || game.hackerSkill.swarm.active)) {
    drawNotice(98, 16, 126, 16, game.hackerSkill.swarm.active ? "ROOTKIT SWARM ACTIVE" : "PACKETBREAKER ONLINE", 102, 27, "#000b", "#ffd95e");
  }

  if (game.hasConductorCoreActive() || game.conductorCore.notice > 0) {
    drawNotice(100, 34, 120, 16, game.hasConductorCoreActive() ? "CONDUCTOR CORE" : "CORE COOLING", 108, 45, "#000b", "#9fe7ff");
  }

  if (game.robotPulse.timer > 0 || game.robotPulse.ringT > 0) {
    const burstLife = ROBOT_MAGNET_PULSE.ringFlashFrames;
    const baseT = game.robotPulse.ringT > 0 ? game.robotPulse.ringT : ((game.robotPulse.timer % 12) + 1);
    const pulseP = 1 - (baseT / burstLife);
    const radius = 12 + (ROBOT_MAGNET_PULSE.radius - 12) * pulseP;
    const alpha = game.robotPulse.ringT > 0 ? (baseT / burstLife) : 0.35;
    gfx.globalAlpha = alpha;
    gfx.strokeStyle = game.robotPulse.phase2Active ? PALETTE.F : PALETTE.H;
    gfx.beginPath();
    gfx.arc((game.robotPulse.x - game.cameraX) | 0, (game.robotPulse.y - game.cameraY) | 0, radius, 0, 6.283);
    gfx.stroke();
    gfx.globalAlpha = 1;
  }

  if (game.rangerGrapple.active || game.rangerGrapple.ringT > 0) {
    const p = game.player;
    const px = p.x + p.w * 0.5 - game.cameraX;
    const py = p.y + p.h * 0.45 - game.cameraY;
    const ax = game.rangerGrapple.anchorX - game.cameraX;
    const ay = game.rangerGrapple.anchorY - game.cameraY;

    gfx.globalAlpha = game.rangerGrapple.active ? 0.8 : Math.max(0.2, game.rangerGrapple.ringT / RANGER_GRAPPLE.ringFlashFrames);
    gfx.strokeStyle = PALETTE.H;
    gfx.beginPath();
    gfx.moveTo(px | 0, py | 0);
    gfx.lineTo(ax | 0, ay | 0);
    gfx.stroke();

    gfx.fillStyle = PALETTE.F;
    gfx.fillRect((ax - 1) | 0, (ay - 1) | 0, 3, 3);
    gfx.globalAlpha = 1;
  }

  if (game.gameOverCinematic && game.gameOverCinematic.active) {
    const cinematic = game.gameOverCinematic;
    const chunkColors = ["#f3d44a", "#f18b49", "#d95cff"];
    const textColors = ["#1a1304", "#200a00", "#12051f"];

    gfx.globalAlpha = 0.62;
    gfx.fillStyle = "#000";
    gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    gfx.globalAlpha = 1;

    if (cinematic.fireActive) {
      gfx.globalAlpha = 0.14;
      gfx.fillStyle = "#3ad47a";
      gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      gfx.globalAlpha = 1;
    }

    for (let i = 0; i < cinematic.particles.length; i++) {
      const p = cinematic.particles[i];
      const lifeP = p.life ? (p.t / p.life) : 1;
      gfx.globalAlpha = Math.max(0.12, lifeP * 0.9);
      gfx.fillStyle = p.kind === 2 ? "#fff" : (p.kind === 1 ? "#f18b49" : "#9dd8ff");
      gfx.fillRect((p.x - (p.size >> 1)) | 0, (p.y - (p.size >> 1)) | 0, p.size, p.size);
    }
    gfx.globalAlpha = 1;

    if (cinematic.awaitingInput && cinematic.fireParticles && cinematic.fireParticles.length) {
      for (let i = 0; i < cinematic.fireParticles.length; i++) {
        const p = cinematic.fireParticles[i];
        const lifeP = p.life ? (p.t / p.life) : 0;
        const alpha = Math.max(0.1, Math.min(0.92, lifeP * 1.1));
        gfx.globalAlpha = alpha;
        if (p.kind === 0) gfx.fillStyle = lifeP > 0.6 ? "#7cff97" : (lifeP > 0.3 ? "#47cf7c" : "#2d934f");
        else gfx.fillStyle = lifeP > 0.6 ? "#b1ffd1" : (lifeP > 0.3 ? "#67e6a2" : "#3aa06a");
        const s = p.size + (lifeP > 0.55 ? 1 : 0);
        gfx.fillRect((p.x - (s >> 1)) | 0, (p.y - s) | 0, s, s + 1);
      }
      gfx.globalAlpha = 1;
    }

    for (let i = 0; i < cinematic.chunks.length; i++) {
      const chunk = cinematic.chunks[i];
      if (!chunk.impacted) continue;

      const sinceImpact = cinematic.frame - chunk.impactFrame;
      const punch = Math.max(0, 1 - (sinceImpact / 9));
      const bounce = Math.sin(Math.min(1, sinceImpact / 5) * Math.PI) * 5 * punch;
      const x = chunk.x;
      const y = chunk.y - bounce;

      gfx.fillStyle = "#000c";
      gfx.fillRect((x + 3) | 0, (y + 4) | 0, chunk.w, chunk.h);

      gfx.fillStyle = chunkColors[i % chunkColors.length];
      gfx.fillRect(x | 0, y | 0, chunk.w, chunk.h);
      gfx.strokeStyle = "#000d";
      gfx.strokeRect((x + 0.5) | 0, (y + 0.5) | 0, chunk.w - 1, chunk.h - 1);

      gfx.strokeStyle = "#0008";
      for (let c = 0; c < 4; c++) {
        const sx = x + ((chunk.w / 5) * (c + 1));
        const sy = y + 4 + ((sinceImpact + c * 7) % Math.max(8, chunk.h - 8));
        gfx.beginPath();
        gfx.moveTo((sx - 6) | 0, sy | 0);
        gfx.lineTo((sx - 1) | 0, (sy + 3) | 0);
        gfx.lineTo((sx + 3) | 0, (sy - 1) | 0);
        gfx.lineTo((sx + 8) | 0, (sy + 2) | 0);
        gfx.stroke();
      }

      gfx.fillStyle = textColors[i % textColors.length];
      gfx.font = "bold 42px monospace";
      const tw = gfx.measureText(chunk.text).width;
      const tx = x + ((chunk.w - tw) * 0.5);
      gfx.fillText(chunk.text, tx | 0, (y + chunk.h - 12) | 0);
    }

    if (cinematic.impactIndex >= cinematic.chunks.length - 1) {
      gfx.fillStyle = "#ffffffd0";
      gfx.font = "12px monospace";
      gfx.fillText("SYSTEM FAILURE", 102, 171);
    }
  }

  if (game.isPaused) {
    const panelX = 26;
    const panelY = 44;
    const panelW = 268;
    const panelH = 96;
    const leftColX = panelX + 10;
    const rightColX = panelX + 150;

    gfx.fillStyle = "#000c";
    gfx.fillRect(panelX, panelY, panelW, panelH);
    drawHudText("PAUSED (P)", panelX + 96, panelY + 13, "#fff");

    drawHudText(scoreText, leftColX, panelY + 28, "#C9A06D");
    drawHudText(coinText, leftColX, panelY + 40, PALETTE.F);
    drawHudText(lifeText, leftColX, panelY + 52, PALETTE.C);
    drawHudText("LEVEL " + levelNameFull, leftColX, panelY + 64, "#fff");
    drawHudText("CHAR " + charNameFull, leftColX, panelY + 76, "#fff");

    if (abilityText) drawHudText("SKILL " + abilityText, rightColX, panelY + 28, "#fff");
    if (cpText) drawHudText(cpText, rightColX, panelY + 40, "#fff");
    if (coreText) drawHudText(coreText, rightColX, panelY + 52, "#fff");
    if (secondaryLeftText) drawHudText(secondaryLeftText, rightColX, panelY + 64, "#fff");
    if (game.audio.muted) drawHudText("MUTE", rightColX, panelY + 76, "#fff");
  }
}

export { drawHudAndNotices };
