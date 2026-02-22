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
    gfx.fillStyle = "#000a";
    gfx.fillRect(78, 62, 164, 28);
    gfx.fillStyle = "#fff";
    gfx.font = "14px monospace";
    gfx.fillText(LEVEL_NAMES[game.levelIndex], 94, 82);
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
    drawHudText("R: Restart   N: Prev   M: Next", 96, 74, "#fff");
    drawHudText("X: Mute  6: Immortal  9/0: BGM -/+", 24, 86, "#fff");
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

  gfx.fillStyle = "#0008";
  gfx.fillRect(0, 0, CANVAS_W, 14);
  drawHudText("S" + game.score, 4, 11, "#C9A06D");
  drawHudText("C" + game.coins, 42, 11, PALETTE.F);
  drawHudText("♥" + game.lives, 78, 11, PALETTE.C);
  drawHudText(LEVEL_NAMES[game.levelIndex], 112, 11, "#fff");
  drawHudText(CHARACTERS[game.characterIndex].name, 210, 11, "#fff");
  if (game.levelCheckpoints.length) {
    const cpText = "CP " + Math.max(0, game.activeCheckpointIndex + 1) + "/" + game.levelCheckpoints.length;
    drawHudText(cpText, 258, 11, "#fff");
  }
  const charName = CHARACTERS[game.characterIndex].name;
  if (charName === "ROBOT") {
    const phase2Ready = game.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold;
    const pulseText = game.robotPulse.timer > 0
      ? (game.robotPulse.phase2Active ? "Q PHASE2" : "Q PULSE")
      : game.robotPulse.cooldown > 0
        ? ("Q " + ((game.robotPulse.cooldown / 60) | 0) + "s")
        : (phase2Ready ? "Q READY+" : "Q READY");
    drawHudText(pulseText, 258, 11, "#fff");
  } else if (charName === "RANGER") {
    const grappleText = game.rangerGrapple.active
      ? "Q GRAPPLE"
      : game.rangerGrapple.cooldown > 0
        ? ("Q " + ((game.rangerGrapple.cooldown / 60) | 0) + "s")
        : "Q READY";
    drawHudText(grappleText, 258, 11, "#fff");
  } else if (charName === "BUNNY") {
    const hasCharges = game.bunnyRocket.charges > 0;
    const rechargeSecs = Math.max(1, ((game.bunnyRocket.rechargeTimer / 60) | 0));
    const rocketText = game.bunnyRocket.active
      ? "Q ROCKET"
      : hasCharges
        ? ("Q x" + game.bunnyRocket.charges)
        : ("Q x0 " + rechargeSecs + "s");
    drawHudText(rocketText, 258, 11, "#fff");
  } else if (charName === "DUCK") {
    const diveText = game.duckDive.active
      ? "Q DIVE"
      : game.duckDive.cooldown > 0
        ? ("Q " + ((game.duckDive.cooldown / 60) | 0) + "s")
        : (game.player && game.player.onGround ? "Q AIR" : "Q READY");
    drawHudText(diveText, 258, 11, "#fff");
  } else if (charName === "PALADIN") {
    const dashText = game.paladinDash.active
      ? "Q AEGIS"
      : game.paladinDash.cooldown > 0
        ? ("Q " + ((game.paladinDash.cooldown / 60) | 0) + "s")
        : "Q READY";
    drawHudText(dashText, 258, 11, "#fff");
  } else if (charName === "NINJA") {
    const overdriveReady = game.ninjaShadow.cooldown > 0 && !game.ninjaShadow.overdriveUsed && game.coins >= NINJA_SHADOW_STEP.overdriveCoinCost;
    const overdriveBlocked = game.ninjaShadow.cooldown > 0 && !game.ninjaShadow.overdriveUsed && game.coins < NINJA_SHADOW_STEP.overdriveCoinCost;
    const shadowText = game.ninjaShadow.active
      ? "Q SHADOW"
      : overdriveReady
        ? ("Q -" + NINJA_SHADOW_STEP.overdriveCoinCost + "C")
        : overdriveBlocked
          ? ("Q NEED " + NINJA_SHADOW_STEP.overdriveCoinCost)
          : game.ninjaShadow.cooldown > 0
        ? ("Q " + ((game.ninjaShadow.cooldown / 60) | 0) + "s")
        : "Q READY";
    drawHudText(shadowText, 258, 11, "#fff");
  } else if (charName === "GLITCHRUNNER") {
    const qText = game.glitchPhase.active
      ? "Q PHASE"
      : game.glitchPhase.cooldown > 0
        ? ("Q " + ((game.glitchPhase.cooldown / 60) | 0) + "s")
        : "Q READY";
    const echoText = game.glitchPhase.echoReady ? "ECHO READY" : ("ECHO " + Math.max(1, ((game.glitchPhase.echoCooldown / 60) | 0)) + "s");
    drawHudText(qText, 248, 11, "#fff");
    drawHudText(echoText, 6, 23, "#fff");
  } else if (charName === "SHADOWRUNNER") {
    const qText = game.hackerSkill.fork.cooldown > 0 ? ("Q " + ((game.hackerSkill.fork.cooldown / 60) | 0) + "s") : "Q FORK";
    const oneText = game.hackerSkill.spike.cooldown > 0 ? ("1 " + ((game.hackerSkill.spike.cooldown / 60) | 0) + "s") : "1 SPIKE";
    const twoText = game.hackerSkill.swarm.active
      ? ("2 SWARM " + Math.max(1, ((game.hackerSkill.swarm.timer / 60) | 0)) + "s")
      : game.hackerSkill.swarm.cooldown > 0
        ? ("2 " + ((game.hackerSkill.swarm.cooldown / 60) | 0) + "s")
        : "2 SWARM";
    drawHudText(qText, 238, 11, "#fff");
    drawHudText(oneText + "  " + twoText, 6, 23, "#fff");
  } else if (charName === "SKELETON") {
    const phase2Eligible = game.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold;
    const phase2Charged = !!game.skeletonBurst.phase2Charged;
    const phase2Charging = phase2Eligible && !phase2Charged && game.skeletonBurst.phase2ChargeFrames > 0;
    const burstText = game.skeletonBurst.flash > 0
      ? (game.skeletonBurst.lastPhase2 ? "Q BLOOD+" : "Q BURST")
      : game.skeletonBurst.cooldown > 0
        ? ("Q " + ((game.skeletonBurst.cooldown / 60) | 0) + "s")
        : (phase2Charged ? "Q READY+" : (phase2Charging ? ("Q CHRG " + Math.max(1, ((game.skeletonBurst.phase2ChargeFrames / 60) | 0)) + "s") : "Q READY"));
    drawHudText(burstText, 258, 11, "#fff");
    drawHudText("SCORE " + game.score + "/" + ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold, 6, 23, "#fff");
  }
  if (game.hasConductorCoreActive()) {
    const secs = Math.max(1, ((game.conductorCore.timer / 60) | 0));
    drawHudText("CORE " + secs + "s", 258, 23, "#fff");
  }
  if (game.audio.muted) {
    drawHudText("MUTE", CANVAS_W - 34, 11, "#fff");
  }
  if (game.immortalMode) {
    drawHudText("IMMORTAL", 6, 35, "#fff");
  }
  if (game.isPaused) {
    drawNotice(116, 16, 88, 16, "PAUSED (P)", 124, 27, "#000c", "#fff");
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

  if (game.isPaused) {
    gfx.fillStyle = "#000a";
    gfx.fillRect(106, 78, 108, 24);
    gfx.fillStyle = "#fff";
    drawHudText("PAUSED", 140, 93, "#fff");
  }
}

export { drawHudAndNotices };
