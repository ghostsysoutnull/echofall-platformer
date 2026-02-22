import { LEVELS, LEVEL_NAMES, LEVEL_THEMES, LEVEL_BACKGROUND_ACTORS, LEVEL_CHECKPOINTS, LEVEL_LIGHT_ZONES } from "./levels/index.js";
import { PALETTE, SPRITES } from "./sprites/index.js";
import {
  collectibleSpriteForTheme,
  oneUpSpriteForTheme as selectOneUpSpriteForTheme,
  tileSpriteForTheme,
  enemySpriteForTheme
} from "./core/theme-sprites.js";
import { drawBackground as drawBackgroundFrame } from "./core/background-render.js";
import { drawHudAndNotices } from "./core/hud-render.js";
import { drawEnemyLayer } from "./core/enemy-render.js";
import { drawPlayerAndEffects } from "./core/player-render.js";
import { drawWorldLayer } from "./core/world-render.js";
import { drawFxLayer } from "./core/fx-render.js";
import {
  CANVAS_W,
  CANVAS_H,
  TILE_SIZE,
  FIXED_DT,
  PLAYER_AX,
  PLAYER_MAX_VX,
  COYOTE_FRAMES,
  JUMP_BUFFER_FRAMES,
  ENEMY_SPEED,
  JUMP_VY,
  ENEMY_DEATH_SHATTER,
  LAVA_DEATH_FIRE,
  ONEUP_RADIAL_BURST,
  RELIC_PICKUP_FX,
  ROBOT_MAGNET_PULSE,
  RANGER_GRAPPLE,
  PALADIN_AEGIS,
  DUCK_GALE_DIVE,
  NINJA_SHADOW_STEP,
  BUNNY_CARROT_ROCKET,
  SKELETON_BLOOD_BURST,
  GLITCHRUNNER_PHASE,
  HACKER_SKILLS,
  SHIELDED_WORKER,
  FRANKENSTEIN,
  CONDUCTOR_CORE,
  BAT_COMPANION,
  BONECRYPT_WEATHER,
  PHYSICS_BY_THEME,
  DEFAULT_THEME,
  getThemeForLevel,
  EXTRA_FLYERS_BY_LEVEL,
  CHARACTERS,
  clamp,
  rectsOverlap
} from "./core/constants.js";
// =========================
// Canvas
// =========================
const canvas = document.getElementById("c");
const gfx = canvas.getContext("2d");
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
gfx.imageSmoothingEnabled = false;

const JUKEBOX_SPECIAL_TRACK_KEYS = [
  "JUKEBOX_NEON_COASTLINE",
  "JUKEBOX_OCEAN_DRIVE_86",
  "JUKEBOX_PASSING_BREEZE",
  "JUKEBOX_MIDNIGHT_CIRCUIT"
];
const HIGHSCORE_STORAGE_KEY = "echofall_protocol_high_score";

// =========================
// Art
// =========================
if (!PALETTE || !SPRITES) throw new Error("sprites module failed to load");

// =========================
// Levels (loaded from src/levels modules)
// LEVELS and LEVEL_NAMES are derived in src/levels/derived.js from sorted GAME_LEVELS
// =========================

// =========================
// Game
// =========================
class Game {
  constructor() {
    this.audio = new GameAudioEngine();

    this.keyDown = {};
    this.jumpBuffer = 0;
    this.touchCapable = (typeof navigator !== "undefined") && (navigator.maxTouchPoints > 0 || "ontouchstart" in globalThis);
    this.touchControlsEnabled = this.touchCapable ? 1 : 0;
    this.touchInputTimer = 0;
    this.touchButtons = { left: 0, right: 0, jump: 0, action: 0 };

    this.levelIndex = 0;
    this.characterIndex = 0;
    this.paladinUnlocked = 0;
    this.skeletonUnlocked = 0;
    this.glitchrunnerUnlocked = 0;
    this.shadowrunnerUnlocked = 0;

    this.starSeed = 1337;
    this.starField = this.makeStars();

    this.rngState = 1;

    this.levelNameBanner = 0;

    this.tileGrid = null;
    this.tileRows = 0;
    this.tileCols = 0;

    this.goal = null;
    this.backgroundActors = [];

    this.player = null;
    this.enemies = [];
    this.coinDrops = [];
    this.magnetItems = [];
    this.blockDebris = [];
    this.oneupBursts = [];
    this.relicBursts = [];
    this.relicFloatTexts = [];
    this.relicFlash = 0;
    this.checkpointRain = [];
    this.enemyShatter = [];
    this.vampireBlood = [];
    this.cryptTrails = [];
    this.vampireSpawnPoints = [];
    this.robotPulse = { timer: 0, cooldown: 0, ringT: 0, x: 0, y: 0, phase2Active: 0, phase2Notice: 0, phase2ReadyLatch: 0, killNotice: 0, killCount: 0 };
    this.rangerGrapple = { active: 0, cooldown: 0, timer: 0, anchorX: 0, anchorY: 0, anchorTx: 0, anchorTy: 0, ringT: 0 };
    this.paladinDash = { active: 0, cooldown: 0, timer: 0, afterglow: 0 };
    this.duckDive = { active: 0, cooldown: 0, timer: 0, afterglow: 0, flash: 0, flashX: 0, flashY: 0, flashKind: 0 };
    this.bunnyRocket = { active: 0, timer: 0, afterglow: 0, dir: 1, trail: [], trailTick: 0, charges: BUNNY_CARROT_ROCKET.maxCharges, rechargeTimer: 0, burstUsed: 0, burstFlash: 0, burstX: 0, burstY: 0 };
    this.ninjaShadow = { active: 0, cooldown: 0, timer: 0, afterglow: 0, dir: 1, trail: [], trailTick: 0, overdriveUsed: 0 };
    this.glitchPhase = { active: 0, cooldown: 0, timer: 0, afterglow: 0, dir: 1, trail: [], trailTick: 0, echoReady: 1, echoCooldown: 0, echoPulse: 0, echoX: 0, echoY: 0 };
    this.hackerSkill = {
      globalLock: 0,
      fork: { cooldown: 0, packets: [] },
      spike: { cooldown: 0, flash: 0, x0: 0, x1: 0, y0: 0, y1: 0 },
      swarm: { cooldown: 0, active: 0, timer: 0, angle: 0, x: 0, y: 0 }
    };
    this.skeletonBurst = { cooldown: 0, flash: 0, phase2Notice: 0, phase2ReadyLatch: 0, lastPhase2: 0, phase2Charged: 0, phase2ChargeFrames: 0 };
    this.skeletonBurstShots = [];
    this.batCompanion = { active: 0, timer: 0, angle: 0, x: 0, y: 0, vx: 0, vy: 0, shimmer: 0, trail: [], trailTick: 0, coinDropTimer: 0, burstT: 0, burstLife: 0, burstX: 0, burstY: 0, pushSfxCooldown: 0, returningFrames: 0 };
    this.conductorCore = { active: 0, timer: 0, cooldown: 0, notice: 0, pulse: 0 };
    this.holyWard = 0;
    this.holyWardCooldown = 0;
    this.levelLightZones = [];
    this.playerShatter = [];
    this.deathTimer = 0;
    this.deathReset = 0;
    this.gameOverCinematic = {
      active: 0,
      frame: 0,
      nextImpactFrame: 0,
      impactIndex: -1,
      systemFailureFrame: -1,
      fireStartDelayFrames: 60,
      holdFrames: 156,
      awaitingInput: 0,
      proceed: 0,
      shake: 0,
      particles: [],
      fireParticles: [],
      fireSpawnTick: 0,
      fireActive: 0,
      chunks: [
        { text: "GA", x: 16, y: 24, w: 128, h: 50, impacted: 0, impactFrame: -1 },
        { text: "ME O", x: 84, y: 66, w: 156, h: 52, impacted: 0, impactFrame: -1 },
        { text: "VER", x: 44, y: 112, w: 140, h: 52, impacted: 0, impactFrame: -1 }
      ]
    };

    this.cameraX = 0;
    this.cameraY = 0;

    this.winPending = 0;

    this.score = 0;
    this.titleCurrentScore = 0;
    this.highScore = this.loadHighScore();
    this.coins = 0;
    this.lives = 3;
    this.nextExtraLifeCoins = 200;
    this.levelDeaths = 0;
    this.levelKillCount = 0;
    this.levelKillsByType = {};
    this.helpTimer = 0;
    this.helpShownBlocks = new Set();
    this.isPaused = 0;
    this.levelSpawnX = 0;
    this.levelSpawnY = 0;
    this.levelCheckpoints = [];
    this.activeCheckpointIndex = -1;
    this.checkpointNotice = 0;
    this.respawnGrace = 0;
    this.portals = [];
    this.portalCooldown = 0;
    this.portalOverlapLock = 0;
    this.geometryMusicSection = -1;
    this.geometryMusicNotice = 0;
    this.geometryMusicLabel = "";
    this.teleportNotice = "";
    this.teleportNoticeTimer = 0;
    this.pendingTeleportNotice = "";
    this.shadowrunHintStage = 0;
    this.immortalMode = 0;

    this.boneCryptWeather = { rain: [], lightning: 0, lightningCooldown: 0, cloudDriftNear: 0, cloudDriftFar: 0 };
    this.stormMechanics = this.createStormMechanicsState();
    this.gameState = "PLAYING";
    this.titleScreen = {
      frame: 0,
      mode: "main",
      scoreTagTimer: 0,
      scoreTagVisibleFrames: 180,
      scoreTagHiddenFrames: 300,
      selected: 0,
      optionSelected: 0,
      levelSelectIndex: 0,
      hasContinue: 0,
      jukebox: {
        themes: (() => {
          const themes = Array.from(new Set(LEVEL_THEMES || [])).filter(Boolean);
          for (const key of JUKEBOX_SPECIAL_TRACK_KEYS) {
            if (!themes.includes(key)) themes.push(key);
          }
          return themes;
        })(),
        selected: 0,
        current: -1,
        wavePhase: 0,
        wavePhase2: 0,
        glow: 0,
        shards: []
      },
      fireParticles: [],
      fireTick: 0,
      glitchFrames: 0,
      glitchCooldown: 180,
      reentryStingPending: 0,
      logoPulseFrames: 0,
      demoRunner: {
        x: 20,
        y: 86,
        vx: 0.86,
        vy: 0,
        state: "run",
        roofY: 86,
        floorY: CANVAS_H + 10,
        nextJump: 38,
        jumpsDone: 0,
        jumpsBeforeFall: 3,
        warpTimer: 0,
        warpTotal: 0,
        warpFromY: CANVAS_H + 10,
        warpToY: 86,
        warpFlash: 0,
        anim: 0,
        phase: 0
      }
    };

    this.bindInput();
    this.fitCanvas();
    addEventListener("resize", () => this.fitCanvas());

    this.loadLevel(0);
    this.levelNameBanner = 0;
    this.gameState = "TITLE";
  }

  createStormMechanicsState() {
    return {
      rails: [],
      nodes: [],
      jets: [],
      surges: [],
      linkPaints: [],
      unresolvedLinks: [],
      surge: {
        state: "DORMANT",
        timer: 0,
        cooldown: 420,
        baseCooldown: 600,
        prewarnFrames: 90,
        activeFrames: 240,
        decayFrames: 60
      },
      safety: {
        timer: 0,
        centerXTile: 0,
        radiusTiles: 12,
        durationFrames: 90
      },
      overlap: {
        maxChannelsPerWindow: 2,
        windowTiles: 16,
        deferFrames: 24
      },
      actRanges: [
        { id: 1, startX: 0, endX: 95 },
        { id: 2, startX: 96, endX: 191 },
        { id: 3, startX: 192, endX: 287 },
        { id: 4, startX: 288, endX: 383 },
        { id: 5, startX: 384, endX: 575 }
      ]
    };
  }

  stormSegmentFromTileX(tileX) {
    return clamp(((tileX / 96) | 0), 0, Math.max(0, ((this.tileCols / 96) | 0)));
  }

  stormActIndexFromTileX(tileX) {
    const tx = tileX | 0;
    if (tx < 96) return 0;
    if (tx < 192) return 1;
    if (tx < 288) return 2;
    if (tx < 384) return 3;
    return 4;
  }

  stormLinkIdFromChar(ch) {
    if (!ch || ch.length !== 1) return null;
    const code = ch.charCodeAt(0);
    if (code < 97 || code > 102) return null;
    return code - 97;
  }

  nearestStormLinkPaint(tileX, tileY, predicate) {
    const links = this.stormMechanics.linkPaints || [];
    if (!links.length) return null;
    let best = null;
    let bestDist = 1e9;
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (predicate && !predicate(link)) continue;
      const dist = Math.abs(link.tx - tileX) + Math.abs(link.ty - tileY);
      if (dist < bestDist) {
        bestDist = dist;
        best = link;
      }
    }
    return best;
  }

  resolveStormMechanicLinks() {
    const state = this.stormMechanics;
    if (!state) return;

    const railByLink = new Map();
    for (let i = 0; i < state.rails.length; i++) {
      const rail = state.rails[i];
      const nearest = this.nearestStormLinkPaint(rail.tx, rail.ty, (l) => l.segment === rail.segment);
      rail.linkId = nearest ? nearest.linkId : null;
      rail.hasController = 0;
      rail.autonomous = rail.linkId === null ? 1 : 0;
      if (rail.linkId !== null) {
        if (!railByLink.has(rail.linkId)) railByLink.set(rail.linkId, []);
        railByLink.get(rail.linkId).push(rail);
      }
    }

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];
      const sameSegment = this.nearestStormLinkPaint(node.tx, node.ty, (l) => l.segment === node.segment);
      const sameAct = this.nearestStormLinkPaint(node.tx, node.ty, (l) => l.actIndex === node.actIndex);
      const chosen = sameSegment || sameAct;
      node.linkId = chosen ? chosen.linkId : null;
      node.invalidLink = node.linkId === null || !railByLink.has(node.linkId);
      if (node.invalidLink) {
        state.unresolvedLinks.push({ type: "node", tx: node.tx, ty: node.ty, reason: "no-target-rail" });
      } else {
        const controlled = railByLink.get(node.linkId);
        for (let r = 0; r < controlled.length; r++) controlled[r].hasController = 1;
      }
    }

    for (let i = 0; i < state.jets.length; i++) {
      const jet = state.jets[i];
      let nearestNode = null;
      let nearestDist = 1e9;
      for (let n = 0; n < state.nodes.length; n++) {
        const node = state.nodes[n];
        if (node.segment !== jet.segment) continue;
        const dist = Math.abs(node.tx - jet.tx) + Math.abs(node.ty - jet.ty);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestNode = node;
        }
      }
      jet.linkId = nearestNode && nearestNode.linkId !== null ? nearestNode.linkId : null;
      jet.standalone = jet.linkId === null ? 1 : 0;
    }

    for (let i = 0; i < state.rails.length; i++) {
      const rail = state.rails[i];
      if (!rail.hasController) rail.autonomous = 1;
      rail.state = "OFF";
      rail.timer = rail.autonomous ? (66 + ((rail.tx + rail.ty) % 20)) : 0;
      rail.prewarnFrames = rail.autonomous ? 30 : 36;
      rail.onFrames = rail.autonomous ? 54 : 72;
      rail.cooldownFrames = rail.autonomous ? 66 : 48;
      rail.audioLatch = 0;
      rail.visualPulse = 0;
    }

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];
      node.state = "IDLE";
      node.timer = 20 + ((node.tx * 7 + node.ty * 3) % 35);
      node.chargingFrames = 30;
      node.firingFrames = 72;
      node.recoverFrames = 60;
      node.audioLatch = 0;
    }

    for (let i = 0; i < state.jets.length; i++) {
      const jet = state.jets[i];
      jet.state = "WAIT";
      jet.timer = 56 + ((jet.tx * 5 + jet.ty * 11) % 48);
      jet.waitFrames = 84;
      jet.prewarnFrames = 24;
      jet.burstFrames = 18;
      jet.audioLatch = 0;
      jet.justStartedBurst = 0;
    }
  }

  stormActRailCap(actIndex) {
    if (actIndex <= 0) return 1;
    if (actIndex === 1) return 1;
    if (actIndex === 2) return 2;
    if (actIndex === 3) return 2;
    return 3;
  }

  stormActTuning(actIndex) {
    if (actIndex <= 0) return { prewarnMul: 1.18, onMul: 0.84, cooldownMul: 1.18, waitMul: 1.18, burstMul: 0.90, deferBonus: 8 };
    if (actIndex === 1) return { prewarnMul: 1.10, onMul: 0.92, cooldownMul: 1.10, waitMul: 1.12, burstMul: 0.95, deferBonus: 5 };
    if (actIndex === 2) return { prewarnMul: 1.00, onMul: 1.00, cooldownMul: 1.00, waitMul: 1.00, burstMul: 1.00, deferBonus: 0 };
    if (actIndex === 3) return { prewarnMul: 0.96, onMul: 1.06, cooldownMul: 0.96, waitMul: 0.95, burstMul: 1.04, deferBonus: -1 };
    return { prewarnMul: 0.92, onMul: 1.10, cooldownMul: 0.90, waitMul: 0.90, burstMul: 1.08, deferBonus: -3 };
  }

  isStormSafetyActive() {
    return !!(this.stormMechanics && this.stormMechanics.safety && this.stormMechanics.safety.timer > 0);
  }

  isStormTileInSafetyRadius(tileX) {
    if (!this.isStormSafetyActive()) return 0;
    const safety = this.stormMechanics.safety;
    return Math.abs((tileX | 0) - safety.centerXTile) <= safety.radiusTiles;
  }

  startStormSafetyWindow(centerXTile, durationFrames) {
    const state = this.stormMechanics;
    if (!state || !state.safety) return;
    const duration = Number.isFinite(durationFrames) ? (durationFrames | 0) : state.safety.durationFrames;
    state.safety.centerXTile = clamp(centerXTile | 0, 0, Math.max(0, this.tileCols - 1));
    state.safety.timer = Math.max(state.safety.timer, Math.max(0, duration));
  }

  stormLethalChannelsNear(tileX) {
    const state = this.stormMechanics;
    if (!state || !state.overlap) return 0;
    let count = 0;
    const win = state.overlap.windowTiles;
    for (let i = 0; i < state.rails.length; i++) {
      const rail = state.rails[i];
      if (rail.state !== "ON") continue;
      if (Math.abs(rail.tx - tileX) <= win) count++;
    }
    for (let i = 0; i < state.jets.length; i++) {
      const jet = state.jets[i];
      if (jet.state !== "BURST") continue;
      if (Math.abs(jet.tx - tileX) <= win) count++;
    }
    return count;
  }

  stormCanStartLethalChannel(tileX) {
    const state = this.stormMechanics;
    if (!state || !state.overlap) return 1;
    if (this.isStormTileInSafetyRadius(tileX)) return 0;
    const active = this.stormLethalChannelsNear(tileX | 0);
    return active < state.overlap.maxChannelsPerWindow;
  }

  updateStormSurge(levelTheme) {
    if (levelTheme !== "STORMFOUNDRY") return;
    const state = this.stormMechanics;
    if (!state || !state.surge) return;
    const surge = state.surge;
    const safety = state.safety;

    if (safety && safety.timer > 0) safety.timer--;
    if (surge.cooldown > 0) surge.cooldown--;
    if (surge.timer > 0) surge.timer--;

    if (surge.state === "DORMANT") {
      if (surge.cooldown <= 0 && this.player && state.surges.length) {
        const ptx = ((this.player.x + this.player.w * 0.5) / TILE_SIZE) | 0;
        const pty = ((this.player.y + this.player.h * 0.5) / TILE_SIZE) | 0;
        let trigger = null;
        let bestDist = 99999;
        for (let i = 0; i < state.surges.length; i++) {
          const beacon = state.surges[i];
          if (!beacon || beacon.consumed) continue;
          const d = Math.abs(beacon.tx - ptx) + Math.abs(beacon.ty - pty);
          if (d <= 14 && d < bestDist) {
            bestDist = d;
            trigger = beacon;
          }
        }
        if (trigger) {
          trigger.consumed = 1;
          surge.state = "PREWARN";
          surge.timer = surge.prewarnFrames;
          this.audio.tone(320, 0.06, 0.00, "triangle", 0.04);
          this.audio.tone(430, 0.05, 0.07, "sine", 0.03);
          this.audio.tone(560, 0.05, 0.14, "triangle", 0.03);
        }
      }
      return;
    }

    if (surge.state === "PREWARN") {
      if (surge.timer <= 0) {
        if (this.isStormSafetyActive()) {
          surge.timer = 1;
        } else {
          surge.state = "ACTIVE";
          surge.timer = surge.activeFrames;
          this.audio.tone(980, 0.05, 0.00, "sawtooth", 0.05);
          this.audio.tone(720, 0.06, 0.04, "triangle", 0.04);
        }
      }
      return;
    }

    if (surge.state === "ACTIVE") {
      if (surge.timer <= 0) {
        surge.state = "DECAY";
        surge.timer = surge.decayFrames;
      }
      return;
    }

    if (surge.state === "DECAY") {
      if (surge.timer <= 0) {
        surge.state = "DORMANT";
        surge.cooldown = surge.baseCooldown;
        surge.timer = 0;
      }
    }
  }

  updateStormMechanics(levelTheme) {
    if (levelTheme !== "STORMFOUNDRY") return;
    const state = this.stormMechanics;
    if (!state) return;
    this.updateStormSurge(levelTheme);

    const surge = state.surge;
    const surgeActive = surge && surge.state === "ACTIVE";
    const prewarnMul = surgeActive ? 0.75 : 1;
    const jetWaitMul = surgeActive ? 0.8 : 1;
    const overlapDefer = (state.overlap && state.overlap.deferFrames) ? state.overlap.deferFrames : 24;

    const nodesByLink = new Map();
    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];
      node.timer = Math.max(0, (node.timer | 0) - 1);

      if (node.invalidLink) {
        node.state = "IDLE";
        node.timer = Math.max(node.timer, 18);
        continue;
      }

      if (node.state === "IDLE" && node.timer <= 0) {
        node.state = "CHARGING";
        node.timer = node.chargingFrames;
        this.audio.tone(560, 0.02, 0.00, "triangle", 0.02);
        this.audio.tone(760, 0.03, 0.02, "sine", 0.02);
      } else if (node.state === "CHARGING" && node.timer <= 0) {
        node.state = "FIRING";
        node.timer = node.firingFrames;
        this.audio.tone(920, 0.03, 0.00, "sawtooth", 0.03);
      } else if (node.state === "FIRING" && node.timer <= 0) {
        node.state = "RECOVER";
        node.timer = node.recoverFrames;
      } else if (node.state === "RECOVER" && node.timer <= 0) {
        node.state = "IDLE";
        node.timer = 24 + ((node.tx * 3 + node.ty * 5) % 40);
      }

      if (node.linkId !== null && node.linkId !== undefined) {
        if (!nodesByLink.has(node.linkId)) nodesByLink.set(node.linkId, []);
        nodesByLink.get(node.linkId).push(node);
      }
    }

    for (let i = 0; i < state.rails.length; i++) {
      const rail = state.rails[i];
      const actTune = this.stormActTuning(rail.actIndex);
      rail.visualPulse = ((rail.visualPulse | 0) + 1) % 120;
      const dynamicPrewarn = Math.max(18, ((rail.prewarnFrames * prewarnMul * actTune.prewarnMul) | 0));
      const dynamicOn = Math.max(24, ((rail.onFrames * actTune.onMul) | 0));
      const dynamicCooldown = Math.max(28, ((rail.cooldownFrames * actTune.cooldownMul) | 0));
      const dynamicOverlapDefer = Math.max(16, overlapDefer + actTune.deferBonus);

      if (this.isStormTileInSafetyRadius(rail.tx)) {
        rail.state = "OFF";
        rail.timer = Math.max(rail.timer | 0, 30);
        continue;
      }

      if (rail.autonomous) {
        rail.timer = Math.max(0, (rail.timer | 0) - 1);
        if (rail.state === "OFF" && rail.timer <= 0) {
          rail.state = "PREWARN";
          rail.timer = dynamicPrewarn;
          this.audio.tone(640, 0.02, 0.00, "triangle", 0.02);
        } else if (rail.state === "PREWARN" && rail.timer <= 0) {
          if (this.stormCanStartLethalChannel(rail.tx)) {
            rail.state = "ON";
            rail.timer = dynamicOn;
            this.audio.tone(860, 0.03, 0.00, "sawtooth", 0.03);
          } else {
            rail.state = "PREWARN";
            rail.timer = dynamicOverlapDefer;
          }
        } else if (rail.state === "ON" && rail.timer <= 0) {
          rail.state = "COOLDOWN";
          rail.timer = dynamicCooldown;
        } else if (rail.state === "COOLDOWN" && rail.timer <= 0) {
          rail.state = "OFF";
          rail.timer = 66;
        }
        continue;
      }

      const linkedNodes = rail.linkId !== null ? (nodesByLink.get(rail.linkId) || []) : [];
      let nodeState = "IDLE";
      let minTimer = 0;
      if (linkedNodes.length) {
        let hasFiring = 0;
        let hasCharging = 0;
        minTimer = 99999;
        for (let n = 0; n < linkedNodes.length; n++) {
          const ns = linkedNodes[n].state;
          if (ns === "FIRING") hasFiring = 1;
          else if (ns === "CHARGING") hasCharging = 1;
          minTimer = Math.min(minTimer, linkedNodes[n].timer);
        }
        nodeState = hasFiring ? "FIRING" : (hasCharging ? "CHARGING" : "IDLE");
        if (minTimer === 99999) minTimer = 0;
      }

      if (nodeState === "CHARGING") {
        if (rail.state !== "PREWARN") {
          rail.state = "PREWARN";
          rail.timer = Math.max(18, minTimer || dynamicPrewarn);
          this.audio.tone(620, 0.02, 0.00, "triangle", 0.02);
          this.audio.tone(760, 0.03, 0.02, "sine", 0.02);
        } else {
          rail.timer = Math.max(1, minTimer || rail.timer);
        }
      } else if (nodeState === "FIRING") {
        const cap = this.stormActRailCap(rail.actIndex);
        let activeInAct = 0;
        for (let r = 0; r < state.rails.length; r++) {
          const other = state.rails[r];
          if (other.actIndex === rail.actIndex && other.state === "ON") activeInAct++;
        }
        if (rail.state === "ON" || (activeInAct < cap && this.stormCanStartLethalChannel(rail.tx))) {
          if (rail.state !== "ON") {
            rail.state = "ON";
            rail.timer = Math.max(1, minTimer || dynamicOn);
            this.audio.tone(900, 0.03, 0.00, "sawtooth", 0.025);
          } else {
            rail.timer = Math.max(1, minTimer || rail.timer);
          }
        } else {
          rail.state = "PREWARN";
          rail.timer = dynamicOverlapDefer;
        }
      } else {
        if (rail.state === "ON" || rail.state === "PREWARN") {
          rail.state = "COOLDOWN";
          rail.timer = dynamicCooldown;
        } else if (rail.state === "COOLDOWN") {
          rail.timer = Math.max(0, (rail.timer | 0) - 1);
          if (rail.timer <= 0) {
            rail.state = "OFF";
            rail.timer = 0;
          }
        } else {
          rail.state = "OFF";
        }
      }
    }

    for (let i = 0; i < state.jets.length; i++) {
      const jet = state.jets[i];
      const actTune = this.stormActTuning(jet.actIndex);
      jet.justStartedBurst = 0;
      const dynamicWait = Math.max(48, ((jet.waitFrames * jetWaitMul * actTune.waitMul) | 0));
      const dynamicPrewarn = Math.max(18, ((jet.prewarnFrames * actTune.prewarnMul) | 0));
      const dynamicBurst = Math.max(12, ((jet.burstFrames * actTune.burstMul) | 0));
      const dynamicOverlapDefer = Math.max(16, overlapDefer + actTune.deferBonus);

      if (this.isStormTileInSafetyRadius(jet.tx)) {
        jet.state = "WAIT";
        jet.timer = Math.max(jet.timer | 0, 42);
        continue;
      }

      jet.timer = Math.max(0, (jet.timer | 0) - 1);

      if (jet.state === "WAIT" && jet.timer <= 0) {
        jet.state = "PREWARN";
        jet.timer = dynamicPrewarn;
        this.audio.tone(780, 0.02, 0.00, "triangle", 0.02);
      } else if (jet.state === "PREWARN" && jet.timer <= 0) {
        let blockedByNeighbor = 0;
        for (let j = 0; j < state.jets.length; j++) {
          if (i === j) continue;
          const other = state.jets[j];
          if (other.state !== "BURST") continue;
          const dist = Math.abs(other.tx - jet.tx) + Math.abs(other.ty - jet.ty);
          if (dist <= 8) { blockedByNeighbor = 1; break; }
        }

        if (blockedByNeighbor) {
          jet.state = "WAIT";
          jet.timer = dynamicOverlapDefer;
        } else {
          if (this.stormCanStartLethalChannel(jet.tx)) {
            jet.state = "BURST";
            jet.timer = dynamicBurst;
            jet.justStartedBurst = 1;
            this.audio.tone(980, 0.02, 0.00, "square", 0.025);
          } else {
            jet.state = "WAIT";
            jet.timer = dynamicOverlapDefer;
          }
        }
      } else if (jet.state === "BURST" && jet.timer <= 0) {
        jet.state = "WAIT";
        jet.timer = dynamicWait;
      }
    }
  }

  updateStormMechanicHazardCollision(levelTheme) {
    if (levelTheme !== "STORMFOUNDRY") return;
    if (!this.player || this.respawnGrace > 0 || this.deathTimer > 0) return;
    if (this.immortalMode) return;
    if (this.hasConductorCoreActive()) return;
    const p = this.player;
    const px0 = p.x;
    const py0 = p.y;
    const px1 = p.x + p.w;
    const py1 = p.y + p.h;
    const state = this.stormMechanics;
    if (!state) return;

    for (let i = 0; i < state.rails.length; i++) {
      const rail = state.rails[i];
      if (rail.state !== "ON") continue;
      if (this.isStormTileInSafetyRadius(rail.tx)) continue;
      const tx0 = rail.tx * TILE_SIZE;
      const ty0 = rail.ty * TILE_SIZE;
      const tx1 = tx0 + TILE_SIZE;
      const ty1 = ty0 + TILE_SIZE;
      if (px0 < tx1 && px1 > tx0 && py0 < ty1 && py1 > ty0) {
        if (!this.tryConsumeGlitchrunnerEchoShield(tx0 + TILE_SIZE * 0.5, ty0 + TILE_SIZE * 0.5)) this.startLavaDeath(0);
        return;
      }
    }

    for (let i = 0; i < state.jets.length; i++) {
      const jet = state.jets[i];
      if (jet.state !== "BURST") continue;
      if (this.isStormTileInSafetyRadius(jet.tx)) continue;
      const jx = jet.tx * TILE_SIZE;
      const jy = jet.ty * TILE_SIZE;
      const hx = jx + 2;
      const hy = jy - TILE_SIZE * 2;
      const hw = TILE_SIZE - 4;
      const hh = TILE_SIZE * 3;
      if (px0 < hx + hw && px1 > hx && py0 < hy + hh && py1 > hy) {
        if (!this.tryConsumeGlitchrunnerEchoShield(hx + hw * 0.5, hy + hh * 0.5)) this.startLavaDeath(0);
        return;
      }
    }
  }

  drawStormMechanicsOverlay(theme) {
    if (theme !== "STORMFOUNDRY") return;
    const state = this.stormMechanics;
    if (!state) return;

    for (let i = 0; i < state.rails.length; i++) {
      const rail = state.rails[i];
      const px = rail.tx * TILE_SIZE - this.cameraX;
      const py = rail.ty * TILE_SIZE - this.cameraY;
      const blink = ((this.player.anim + rail.tx + rail.ty) % 12) < 6;

      if (rail.state === "PREWARN") {
        gfx.globalAlpha = blink ? 0.75 : 0.28;
        gfx.fillStyle = "#ffb347";
        gfx.fillRect((px + 1) | 0, (py + 3) | 0, 8, 4);
      } else if (rail.state === "ON") {
        const pulse = (Math.sin((this.player.anim + rail.visualPulse) * 0.24) + 1) * 0.5;
        gfx.globalAlpha = 0.62 + pulse * 0.28;
        gfx.fillStyle = "#8ef6ff";
        gfx.fillRect((px + 1) | 0, (py + 2) | 0, 8, 6);
        gfx.globalAlpha = 0.45 + pulse * 0.25;
        gfx.fillStyle = "#dfefff";
        gfx.fillRect((px + 2) | 0, (py + 4) | 0, 6, 2);
      } else if (rail.state === "COOLDOWN") {
        gfx.globalAlpha = 0.20;
        gfx.fillStyle = "#c97dff";
        gfx.fillRect((px + 2) | 0, (py + 4) | 0, 6, 2);
      }
    }

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];
      const px = node.tx * TILE_SIZE - this.cameraX;
      const py = node.ty * TILE_SIZE - this.cameraY;
      const pulse = (Math.sin((this.player.anim + i * 7) * 0.20) + 1) * 0.5;
      gfx.globalAlpha = 0.35 + pulse * 0.35;
      gfx.strokeStyle = node.invalidLink ? "#9a7f7f" : (node.state === "FIRING" ? "#8ef6ff" : "#ffb347");
      gfx.strokeRect((px + 1) | 0, (py + 1) | 0, 8, 8);
      gfx.strokeRect((px + 3) | 0, (py + 3) | 0, 4, 4);
    }

    for (let i = 0; i < state.jets.length; i++) {
      const jet = state.jets[i];
      const px = jet.tx * TILE_SIZE - this.cameraX;
      const py = jet.ty * TILE_SIZE - this.cameraY;
      const blink = ((this.player.anim + i * 3) % 10) < 5;
      if (jet.state === "PREWARN") {
        gfx.globalAlpha = blink ? 0.8 : 0.3;
        gfx.fillStyle = "#ffb347";
        gfx.fillRect((px + 3) | 0, (py + 7) | 0, 4, 2);
      } else if (jet.state === "BURST") {
        const pulse = (Math.sin((this.player.anim + i * 5) * 0.30) + 1) * 0.5;
        gfx.globalAlpha = 0.55 + pulse * 0.30;
        gfx.fillStyle = "#8ef6ff";
        gfx.fillRect((px + 4) | 0, (py - 20) | 0, 2, 30);
        gfx.globalAlpha = 0.35 + pulse * 0.25;
        gfx.fillStyle = "#dfefff";
        gfx.fillRect((px + 3) | 0, (py - 18) | 0, 4, 2);
      }
    }

    if (state.surge) {
      const surge = state.surge;
      if (surge.state === "PREWARN") {
        const blink = ((this.player.anim >> 2) & 1) === 0;
        gfx.globalAlpha = blink ? 0.20 : 0.08;
        gfx.fillStyle = "#ffb347";
        gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      } else if (surge.state === "ACTIVE") {
        const pulse = (Math.sin(this.player.anim * 0.24) + 1) * 0.5;
        gfx.globalAlpha = 0.08 + pulse * 0.07;
        gfx.fillStyle = "#8ef6ff";
        gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      } else if (surge.state === "DECAY") {
        gfx.globalAlpha = 0.05;
        gfx.fillStyle = "#c97dff";
        gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
    }
    gfx.globalAlpha = 1;
  }

  makeStars() {
    const stars = [];
    for (let i = 0; i < 90; i++) {
      this.starSeed = (this.starSeed * 1664525 + 1013904223) >>> 0;
      const x = this.starSeed % 2600;
      this.starSeed = (this.starSeed * 1664525 + 1013904223) >>> 0;
      const y = this.starSeed % 150;
      this.starSeed = (this.starSeed * 1664525 + 1013904223) >>> 0;
      const s = 1 + (this.starSeed % 2);
      stars.push([x, y, s]);
    }
    return stars;
  }

  rand01() {
    this.rngState ^= this.rngState << 13;
    this.rngState ^= this.rngState >>> 17;
    this.rngState ^= this.rngState << 5;
    return (this.rngState >>> 0) / 4294967296;
  }

  loadHighScore() {
    try {
      const raw = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? (parsed | 0) : 0;
    } catch (_) {
      return 0;
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem(HIGHSCORE_STORAGE_KEY, String(Math.max(0, this.highScore | 0)));
    } catch (_) {
    }
  }

  updateHighScore(value) {
    const next = Math.max(0, value | 0);
    if (next <= this.highScore) return;
    this.highScore = next;
    this.saveHighScore();
  }

  titleMainItems() {
    return [
      { key: "start", label: "START", enabled: 1 },
      { key: "continue", label: "CONTINUE", enabled: this.titleScreen.hasContinue ? 1 : 0 },
      { key: "level-select", label: "LEVEL SELECT", enabled: 1 },
      { key: "options", label: "OPTIONS", enabled: 1 }
    ];
  }

  startNewRun(startLevel = 0) {
    this.score = 0;
    this.titleCurrentScore = 0;
    this.coins = 0;
    this.lives = 3;
    this.nextExtraLifeCoins = 200;
    this.levelDeaths = 0;
    this.levelKillCount = 0;
    this.paladinUnlocked = 0;
    this.glitchrunnerUnlocked = 0;
    this.shadowrunnerUnlocked = 0;
    this.skeletonUnlocked = 0;
    this.characterIndex = 0;
    this.isPaused = 0;

    this.titleScreen.mode = "main";
    this.titleScreen.selected = 0;
    this.titleScreen.optionSelected = 0;
    this.titleScreen.fireParticles = [];
    this.titleScreen.fireTick = 0;
    this.resetTitleDemoRunner(1);

    const targetLevel = clamp(startLevel | 0, 0, Math.max(0, LEVELS.length - 1));
    this.gameState = "PLAYING";
    this.loadLevel(targetLevel);
  }

  resetTitleDemoRunner(resetPhase = 0) {
    const r = this.titleScreen.demoRunner;
    if (!r) return;
    r.roofY = 86;
    r.floorY = CANVAS_H + 10;
    r.x = 16 + this.rand01() * 20;
    r.y = r.roofY;
    r.vx = 0.84 + this.rand01() * 0.22;
    r.vy = 0;
    r.state = "run";
    r.nextJump = 26 + ((this.rand01() * 24) | 0);
    r.jumpsDone = 0;
    r.jumpsBeforeFall = 2 + ((this.rand01() * 3) | 0);
    r.warpTimer = 0;
    r.warpTotal = 0;
    r.warpFromY = r.floorY;
    r.warpToY = r.roofY;
    r.warpFlash = 0;
    r.anim = 0;
    if (resetPhase) r.phase = this.rand01() * 6.283;
  }

  updateTitleDemoRunner() {
    const r = this.titleScreen.demoRunner;
    if (!r) return;

    r.anim++;
    if (r.warpFlash > 0) r.warpFlash--;

    if (r.state === "run") {
      r.x += r.vx;
      r.nextJump--;
      if (r.nextJump <= 0) {
        r.state = "jump";
        r.vy = -2.05 - this.rand01() * 0.42;
        r.nextJump = 28 + ((this.rand01() * 30) | 0);
        this.audio.tone(620 + ((this.rand01() * 90) | 0), 0.012, 0.00, "triangle", 0.010);
      }
      return;
    }

    if (r.state === "jump") {
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.16;
      if (r.vy >= 0 && r.y >= r.roofY) {
        r.jumpsDone++;
        if (r.jumpsDone >= r.jumpsBeforeFall) {
          r.state = "fall";
          r.vy = 0.65;
          r.warpFlash = 8;
        } else {
          r.state = "run";
          r.y = r.roofY;
          r.vy = 0;
        }
      }
      return;
    }

    if (r.state === "fall") {
      r.x += r.vx * 0.75;
      r.y += r.vy;
      r.vy += 0.24;
      if (r.y >= r.floorY) {
        r.state = "warp";
        r.warpTotal = 18 + ((this.rand01() * 6) | 0);
        r.warpTimer = r.warpTotal;
        r.warpFromY = r.floorY;
        r.warpToY = r.roofY;
        r.warpFlash = 14;
        this.audio.tone(930, 0.018, 0.00, "sine", 0.012);
      }
      return;
    }

    if (r.state === "warp") {
      r.warpTimer--;
      const total = Math.max(1, r.warpTotal);
      const progress = 1 - (Math.max(0, r.warpTimer) / total);
      r.y = r.warpFromY + (r.warpToY - r.warpFromY) * progress;
      if (r.warpTimer <= 0) {
        r.x = 14 + this.rand01() * 24;
        r.y = r.roofY;
        r.vx = 0.84 + this.rand01() * 0.24;
        r.vy = 0;
        r.jumpsDone = 0;
        r.jumpsBeforeFall = 2 + ((this.rand01() * 3) | 0);
        r.nextJump = 28 + ((this.rand01() * 26) | 0);
        r.state = "run";
      }
    }
  }

  handleTitleInput(code) {
    const t = this.titleScreen;
    const uiMove = () => this.audio.tone(760, 0.02, 0.00, "triangle", 0.02);
    const uiConfirm = () => this.audio.tone(940, 0.035, 0.00, "sine", 0.03);
    const uiBack = () => this.audio.tone(520, 0.025, 0.00, "triangle", 0.02);
    const uiDeny = () => this.audio.tone(220, 0.05, 0.00, "square", 0.02);

    if (code === "KeyX") {
      this.audio.muted ^= 1;
      return;
    }
    if (code === "Digit9") {
      this.audio.adjustMusicVolume(-0.05);
      uiMove();
      return;
    }
    if (code === "Digit0") {
      this.audio.adjustMusicVolume(0.05);
      uiMove();
      return;
    }

    if (t.mode === "main") {
      const items = this.titleMainItems();
      if (code === "ArrowUp") {
        t.selected = (t.selected - 1 + items.length) % items.length;
        uiMove();
        return;
      }
      if (code === "ArrowDown") {
        t.selected = (t.selected + 1) % items.length;
        uiMove();
        return;
      }
      if (code === "Enter" || code === "Space") {
        const picked = items[t.selected];
        if (!picked || !picked.enabled) {
          uiDeny();
          return;
        }
        if (picked.key === "start") {
          uiConfirm();
          this.startNewRun(0);
          return;
        }
        if (picked.key === "continue") {
          uiConfirm();
          this.startNewRun(t.levelSelectIndex | 0);
          return;
        }
        if (picked.key === "level-select") {
          uiConfirm();
          t.mode = "level-select";
          t.levelSelectIndex = clamp(this.levelIndex | 0, 0, Math.max(0, LEVELS.length - 1));
          return;
        }
        if (picked.key === "options") {
          uiConfirm();
          t.mode = "options";
          t.optionSelected = 0;
        }
      }
      return;
    }

    if (t.mode === "level-select") {
      if (code === "Escape") {
        uiBack();
        t.mode = "main";
        return;
      }
      if (code === "ArrowLeft" || code === "ArrowUp") {
        t.levelSelectIndex = (t.levelSelectIndex - 1 + LEVELS.length) % LEVELS.length;
        uiMove();
        return;
      }
      if (code === "ArrowRight" || code === "ArrowDown") {
        t.levelSelectIndex = (t.levelSelectIndex + 1) % LEVELS.length;
        uiMove();
        return;
      }
      if (code === "Enter" || code === "Space") {
        uiConfirm();
        this.startNewRun(t.levelSelectIndex);
      }
      return;
    }

    if (t.mode === "options") {
      const optionCount = 4;
      if (code === "Escape") {
        uiBack();
        t.mode = "main";
        return;
      }
      if (code === "ArrowUp") {
        t.optionSelected = (t.optionSelected - 1 + optionCount) % optionCount;
        uiMove();
        return;
      }
      if (code === "ArrowDown") {
        t.optionSelected = (t.optionSelected + 1) % optionCount;
        uiMove();
        return;
      }
      if ((code === "ArrowLeft" || code === "ArrowRight") && t.optionSelected === 1) {
        this.audio.adjustMusicVolume(code === "ArrowLeft" ? -0.05 : 0.05);
        uiMove();
        return;
      }
      if (code === "Enter" || code === "Space") {
        if (t.optionSelected === 0) {
          this.audio.muted ^= 1;
          uiConfirm();
          return;
        }
        if (t.optionSelected === 1) {
          this.audio.adjustMusicVolume(0.05);
          uiMove();
          return;
        }
        if (t.optionSelected === 2) {
          uiConfirm();
          t.mode = "jukebox";
          if (t.jukebox.current < 0) t.jukebox.selected = 0;
          return;
        }
        uiBack();
        t.mode = "main";
      }
      return;
    }

    if (t.mode === "jukebox") {
      const list = t.jukebox.themes;
      if (!list.length) {
        if (code === "Escape") {
          uiBack();
          t.mode = "options";
          this.audio.stopTheme({ fadeMs: 220 });
        }
        return;
      }

      if (code === "Escape") {
        uiBack();
        t.mode = "options";
        this.audio.stopTheme({ fadeMs: 220 });
        t.jukebox.current = -1;
        return;
      }
      if (code === "ArrowUp") {
        t.jukebox.selected = (t.jukebox.selected - 1 + list.length) % list.length;
        uiMove();
        return;
      }
      if (code === "ArrowDown") {
        t.jukebox.selected = (t.jukebox.selected + 1) % list.length;
        uiMove();
        return;
      }
      if (code === "ArrowLeft") {
        t.jukebox.selected = (t.jukebox.selected - 1 + list.length) % list.length;
        this.playJukeboxSelectedTheme();
        uiMove();
        return;
      }
      if (code === "ArrowRight") {
        t.jukebox.selected = (t.jukebox.selected + 1) % list.length;
        this.playJukeboxSelectedTheme();
        uiMove();
        return;
      }
      if (code === "Enter" || code === "Space") {
        this.playJukeboxSelectedTheme();
        uiConfirm();
      }
    }
  }

  playJukeboxSelectedTheme() {
    const t = this.titleScreen;
    const list = t.jukebox.themes;
    if (!list.length) return;
    const idx = clamp(t.jukebox.selected | 0, 0, list.length - 1);
    const theme = list[idx];
    if (!theme) return;
    if (!this.audio.ctx) this.audio.ensure();
    this.audio.playTheme(theme, { fadeInMs: 260, crossFadeMs: 260 });
    t.jukebox.current = idx;
    t.jukebox.glow = 24;
  }

  jukeboxTrackLabel(key) {
    if (key === "JUKEBOX_NEON_COASTLINE") return "Neon Coastline";
    if (key === "JUKEBOX_OCEAN_DRIVE_86") return "Ocean Drive '86";
    if (key === "JUKEBOX_PASSING_BREEZE") return "Passing Breeze";
    if (key === "JUKEBOX_MIDNIGHT_CIRCUIT") return "Midnight Circuit";
    return String(key || "");
  }

  updateTitleJukeboxVisuals() {
    const j = this.titleScreen.jukebox;
    if (!j) return;
    j.wavePhase += 0.05;
    j.wavePhase2 += 0.033;
    if (j.glow > 0) j.glow--;

    if ((this.titleScreen.frame % 4) === 0) {
      const y = 100 + ((this.rand01() * 52) | 0);
      j.shards.push({
        x: CANVAS_W + 8 + this.rand01() * 24,
        y,
        vx: -(0.45 + this.rand01() * 0.45),
        vy: (this.rand01() - 0.5) * 0.08,
        rot: this.rand01() * 6.283,
        vr: (this.rand01() - 0.5) * 0.12,
        t: 90 + ((this.rand01() * 70) | 0),
        life: 120
      });
    }
    if (j.shards.length > 35) j.shards.splice(0, j.shards.length - 35);

    for (let i = 0; i < j.shards.length; i++) {
      const s = j.shards[i];
      if (s.t-- <= 0) { s.dead = 1; continue; }
      s.x += s.vx;
      s.y += s.vy;
      s.rot += s.vr;
      if (s.x < -16 || s.y < 78 || s.y > 170) s.dead = 1;
    }
    j.shards = j.shards.filter((s) => !s.dead);
  }

  updateTitleScreen() {
    const t = this.titleScreen;
    t.frame++;

    const cycle = Math.max(1, t.scoreTagVisibleFrames + t.scoreTagHiddenFrames);
    t.scoreTagTimer = (t.scoreTagTimer + 1) % cycle;

    if (t.reentryStingPending) {
      t.reentryStingPending = 0;
      t.logoPulseFrames = 52;
      this.audio.tone(360, 0.06, 0.00, "triangle", 0.04);
      this.audio.tone(540, 0.07, 0.05, "sine", 0.035);
      this.audio.tone(760, 0.08, 0.11, "triangle", 0.03);
    }

    if (t.logoPulseFrames > 0) t.logoPulseFrames--;

    if (t.glitchFrames > 0) t.glitchFrames--;
    else if (--t.glitchCooldown <= 0) {
      t.glitchFrames = 2 + ((this.rand01() * 3) | 0);
      t.glitchCooldown = 150 + ((this.rand01() * 170) | 0);
    }

    t.fireTick++;
    if (t.fireTick >= 2) {
      t.fireTick = 0;
      for (let i = 0; i < 4; i++) {
        const life = 28 + ((this.rand01() * 30) | 0);
        t.fireParticles.push({
          x: 14 + this.rand01() * (CANVAS_W - 28),
          y: CANVAS_H + this.rand01() * 8,
          vx: (this.rand01() - 0.5) * 0.34,
          vy: -(0.9 + this.rand01() * 1.45),
          sway: this.rand01() * 6.283,
          t: life,
          life,
          size: this.rand01() > 0.6 ? 2 : 1,
          kind: this.rand01() > 0.5 ? 0 : 1
        });
      }
      if (t.fireParticles.length > 180) t.fireParticles.splice(0, t.fireParticles.length - 180);
    }

    for (let i = 0; i < t.fireParticles.length; i++) {
      const p = t.fireParticles[i];
      if (p.t-- <= 0) { p.dead = 1; continue; }
      const lifeP = p.life ? (p.t / p.life) : 0;
      p.sway += 0.24;
      p.vx = p.vx * 0.93 + Math.sin(p.sway) * 0.05;
      p.vy = p.vy * 0.98 - 0.01;
      p.x += p.vx;
      p.y += p.vy;
      if (lifeP < 0.08 || p.y < 42) p.dead = 1;
    }
    t.fireParticles = t.fireParticles.filter((p) => !p.dead);
    this.updateTitleDemoRunner();
    if (t.mode === "jukebox") this.updateTitleJukeboxVisuals();
  }

  getTouchJumpBufferFrames() {
    return this.touchInputTimer > 0 ? (JUMP_BUFFER_FRAMES + 2) : JUMP_BUFFER_FRAMES;
  }

  getTouchCoyoteFrames() {
    return this.touchInputTimer > 0 ? (COYOTE_FRAMES + 2) : COYOTE_FRAMES;
  }

  clearRuntimeInputState() {
    this.keyDown = {};
    this.jumpBuffer = 0;
    this.touchButtons.left = 0;
    this.touchButtons.right = 0;
    this.touchButtons.jump = 0;
    this.touchButtons.action = 0;
  }

  touchControlsVisible() {
    return !!(this.touchCapable && this.touchControlsEnabled && this.gameState !== "TITLE");
  }

  getTouchControlRects() {
    const pad = 8;
    const btnW = 34;
    const btnH = 24;
    const y = CANVAS_H - btnH - pad;
    return {
      left: { x: pad, y, w: btnW, h: btnH },
      right: { x: pad + btnW + 8, y, w: btnW, h: btnH },
      action: { x: CANVAS_W - pad - btnW * 2 - 8, y, w: btnW, h: btnH },
      jump: { x: CANVAS_W - pad - btnW, y, w: btnW, h: btnH }
    };
  }

  touchPointToCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;
    return { x, y };
  }

  touchActionAt(x, y) {
    const rects = this.getTouchControlRects();
    const inRect = (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inRect(rects.left)) return "left";
    if (inRect(rects.right)) return "right";
    if (inRect(rects.jump)) return "jump";
    if (inRect(rects.action)) return "action";
    return "";
  }

  applyTouchButtons(nextButtons) {
    const next = {
      left: !!nextButtons.left,
      right: !!nextButtons.right,
      jump: !!nextButtons.jump,
      action: !!nextButtons.action
    };

    const hadAnyBefore = !!(this.touchButtons.left || this.touchButtons.right || this.touchButtons.jump || this.touchButtons.action);
    const hasAnyNow = !!(next.left || next.right || next.jump || next.action);
    if (hasAnyNow) this.touchInputTimer = 120;

    if (this.isPaused && hasAnyNow && !hadAnyBefore) {
      this.isPaused = 0;
      this.audio.tone(620, 0.04);
    }

    if (next.jump && !this.touchButtons.jump) this.jumpBuffer = this.getTouchJumpBufferFrames();
    if (next.action && !this.touchButtons.action && this.gameState !== "TITLE") this.tryActivateCharacterSkill();

    this.touchButtons.left = next.left ? 1 : 0;
    this.touchButtons.right = next.right ? 1 : 0;
    this.touchButtons.jump = next.jump ? 1 : 0;
    this.touchButtons.action = next.action ? 1 : 0;

    this.keyDown.ArrowLeft = this.touchButtons.left;
    this.keyDown.ArrowRight = this.touchButtons.right;
    this.keyDown.Space = this.touchButtons.jump;
    this.keyDown.KeyQ = this.touchButtons.action;
  }

  syncTouchFromEvent(e) {
    if (!this.touchControlsVisible()) {
      this.applyTouchButtons({ left: 0, right: 0, jump: 0, action: 0 });
      return;
    }

    const next = { left: 0, right: 0, jump: 0, action: 0 };
    const touches = e && e.touches ? e.touches : [];
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      const p = this.touchPointToCanvas(t.clientX, t.clientY);
      if (!p) continue;
      const action = this.touchActionAt(p.x, p.y);
      if (action) next[action] = 1;
    }
    this.applyTouchButtons(next);
  }

  drawTouchControlsOverlay() {
    if (!this.touchControlsVisible()) return;
    const rects = this.getTouchControlRects();
    const entries = [
      { key: "left", label: "◀", rect: rects.left },
      { key: "right", label: "▶", rect: rects.right },
      { key: "action", label: "Q", rect: rects.action },
      { key: "jump", label: "J", rect: rects.jump }
    ];

    gfx.save();
    gfx.font = "10px monospace";
    gfx.textAlign = "center";
    gfx.textBaseline = "middle";
    for (let i = 0; i < entries.length; i++) {
      const it = entries[i];
      const pressed = !!this.touchButtons[it.key];
      gfx.fillStyle = pressed ? "#ffffff66" : "#00000055";
      gfx.fillRect(it.rect.x, it.rect.y, it.rect.w, it.rect.h);
      gfx.strokeStyle = "#ffffff88";
      gfx.strokeRect(it.rect.x + 0.5, it.rect.y + 0.5, it.rect.w - 1, it.rect.h - 1);
      gfx.fillStyle = "#ffffff";
      gfx.fillText(it.label, it.rect.x + it.rect.w * 0.5, it.rect.y + it.rect.h * 0.5 + 1);
    }
    gfx.restore();
  }

  bindInput() {
    const preventKeys = new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyA","KeyD","KeyS","KeyM","KeyN","KeyW","KeyX","KeyQ","KeyR","KeyP","KeyE","KeyT","Digit1","Digit2","Digit6","Digit7","Digit8","Digit9","Digit0"]);
    const autoUnpauseKeys = new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyA","KeyD","KeyS","KeyQ","KeyW","KeyE","Digit1","Digit2"]);

    addEventListener("keydown", (e) => {
      if (preventKeys.has(e.code)) e.preventDefault();

      if (this.isPaused && autoUnpauseKeys.has(e.code)) {
        this.isPaused = 0;
        this.audio.tone(620, 0.04);
      }

      if (this.gameOverCinematic.active) {
        if (!this.audio.ctx) this.audio.ensure();
        if (this.gameOverCinematic.awaitingInput && !this.gameOverCinematic.proceed) {
          this.gameOverCinematic.proceed = 1;
          this.audio.tone(760, 0.045, 0.00, "triangle", 0.05);
          this.audio.tone(980, 0.05, 0.03, "sine", 0.04);
        }
        this.keyDown[e.code] = 1;
        return;
      }

      if (this.gameState === "TITLE") {
        if (!this.audio.ctx) this.audio.ensure();
        this.handleTitleInput(e.code);
        this.keyDown[e.code] = 1;
        return;
      }

      if (!this.keyDown[e.code]) {
        if (e.code === "Space" || e.code === "ArrowUp") this.jumpBuffer = this.getTouchJumpBufferFrames();
        if (e.code === "KeyX") this.audio.muted ^= 1;
        if (e.code === "KeyT") {
          this.touchControlsEnabled ^= 1;
          this.teleportNotice = this.touchControlsEnabled ? "TOUCH HUD: ON" : "TOUCH HUD: OFF";
          this.teleportNoticeTimer = 90;
          this.audio.tone(this.touchControlsEnabled ? 760 : 420, 0.04);
          if (!this.touchControlsEnabled) this.applyTouchButtons({ left: 0, right: 0, jump: 0, action: 0 });
        }
        if (e.code === "Digit9") this.audio.adjustMusicVolume(-0.05);
        if (e.code === "Digit0") this.audio.adjustMusicVolume(0.05);
        if (e.code === "Digit7") {
          this.addCoins(70);
          if (!this.skeletonBurst.phase2Charged && this.skeletonBurst.phase2ChargeFrames <= 0) {
            this.skeletonBurst.phase2ChargeFrames = SKELETON_BLOOD_BURST.phaseTwoRechargeFrames;
          }
          this.teleportNotice = "DEBUG: +70 COINS";
          this.teleportNoticeTimer = 70;
          this.audio.tone(840, 0.03, 0.00, "triangle", 0.03);
          this.audio.tone(1040, 0.04, 0.02, "sine", 0.03);
        }
        if (e.code === "Digit8") {
          const idx = LEVEL_THEMES.findIndex(t => t === "SHADOWRUN");
          if (idx >= 0) {
            this.shadowrunnerUnlocked = 1;
            const shadowrunnerIndex = CHARACTERS.findIndex(c => c.name === "SHADOWRUNNER");
            if (shadowrunnerIndex >= 0) this.characterIndex = shadowrunnerIndex;
            this.loadLevel(idx);
            this.teleportNotice = "DEBUG: SHADOWRUNNER ARCLOGY";
            this.teleportNoticeTimer = 90;
          }
        }
        if (e.code === "Digit1") {
          this.cycleCharacterBackward();
          this.audio.tone(620, 0.04);
        }
        if (e.code === "Digit2") {
          this.cycleCharacterForward();
          this.audio.tone(660, 0.04);
        }
        if (e.code === "Digit6") {
          this.immortalMode ^= 1;
          this.teleportNotice = this.immortalMode ? "DEBUG: IMMORTAL ON" : "DEBUG: IMMORTAL OFF";
          this.teleportNoticeTimer = 90;
          this.audio.tone(this.immortalMode ? 980 : 420, 0.05, 0.00, "triangle", 0.04);
        }
        if (e.code === "KeyQ") this.tryActivateCharacterSkill();
        if (e.code === "KeyW") this.tryActivateCharacterAltSkill1();
        if (e.code === "KeyE") this.tryActivateCharacterAltSkill2();
        if (e.code === "KeyP") {
          this.isPaused ^= 1;
          this.audio.tone(this.isPaused ? 360 : 620, 0.05);
        }
        if (e.code === "KeyR") this.loadLevel(this.levelIndex);
        if (e.code === "KeyM") {
          if (this.levelIndex === LEVELS.length - 1) {
            this.loadLevel(0);
          } else {
            const nextTheme = LEVEL_THEMES[this.levelIndex + 1];
            if (nextTheme === "BONECRYPT") this.skeletonUnlocked = 1;
            if (nextTheme === "SIMBREACH") this.glitchrunnerUnlocked = 1;
            if (nextTheme === "SIMBREACH") this.shadowrunnerUnlocked = 1;
            if (nextTheme === "SHADOWRUN") this.shadowrunnerUnlocked = 1;
            this.loadLevel(this.levelIndex + 1);
          }
        }
        if (e.code === "KeyN") {
          if (this.levelIndex === 0) {
            this.loadLevel(LEVELS.length - 1);
          } else {
            this.loadLevel(this.levelIndex - 1);
          }
        }
        if (e.code === "KeyH") {
          const hudTestLevel = LEVELS.findIndex((l, i) => LEVEL_NAMES[i] === "TEST BIOME");
          if (hudTestLevel >= 0) {
            this.loadLevel(hudTestLevel);
            this.teleportNotice = "TEST BIOME";
            this.teleportNoticeTimer = 90;
            this.audio.tone(740, 0.04);
          }
        }

        if (!this.audio.ctx) { this.audio.ensure(); }
      }

      this.keyDown[e.code] = 1;
    });

    addEventListener("keyup", (e) => {
      if (preventKeys.has(e.code)) e.preventDefault();
      this.keyDown[e.code] = 0;
    });

    addEventListener("blur", () => {
      this.clearRuntimeInputState();
    });

    addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") this.clearRuntimeInputState();
    });

    if (this.touchCapable) {
      const handleTouch = (e) => {
        e.preventDefault();
        this.syncTouchFromEvent(e);
      };
      canvas.addEventListener("touchstart", handleTouch, { passive: false });
      canvas.addEventListener("touchmove", handleTouch, { passive: false });
      canvas.addEventListener("touchend", handleTouch, { passive: false });
      canvas.addEventListener("touchcancel", handleTouch, { passive: false });
    }
  }

  fitCanvas() {
    const s = Math.max(1, Math.floor(Math.min(innerWidth / CANVAS_W, innerHeight / CANVAS_H)));
    canvas.style.width = CANVAS_W * s + "px";
    canvas.style.height = CANVAS_H * s + "px";
  }

  setCharacter(index) {
    const oldW = this.player ? this.player.w : 10;
    const oldH = this.player ? this.player.h : 10;
    this.characterIndex = index;

    if (!this.player) return;

    const ch = CHARACTERS[this.characterIndex];
    const newW = ch.w, newH = ch.h;

    this.player.x += oldW * 0.5 - newW * 0.5;
    this.player.y += oldH - newH;

    this.player.w = newW;
    this.player.h = newH;

    this.player.quackFrame = 0;
    this.player.ninjaAirJumps = ch.doubleJumps;
    this.player.duckFuel = ch.duckFlight;
    this.player.duckFlying = 0;
    this.player.skeletonCrouch = 0;
    this.rangerGrapple.active = 0;
    this.paladinDash.active = 0;
    this.paladinDash.timer = 0;
    this.duckDive.active = 0;
    this.duckDive.cooldown = 0;
    this.duckDive.timer = 0;
    this.duckDive.afterglow = 0;
    this.duckDive.flash = 0;
    this.bunnyRocket.active = 0;
    this.bunnyRocket.timer = 0;
    this.bunnyRocket.afterglow = 0;
    this.bunnyRocket.trail = [];
    this.bunnyRocket.charges = BUNNY_CARROT_ROCKET.maxCharges;
    this.bunnyRocket.rechargeTimer = 0;
    this.bunnyRocket.burstUsed = 0;
    this.bunnyRocket.burstFlash = 0;
    this.ninjaShadow.active = 0;
    this.ninjaShadow.timer = 0;
    this.ninjaShadow.afterglow = 0;
    this.ninjaShadow.trail = [];
    this.ninjaShadow.overdriveUsed = 0;
    this.glitchPhase.active = 0;
    this.glitchPhase.cooldown = 0;
    this.glitchPhase.timer = 0;
    this.glitchPhase.afterglow = 0;
    this.glitchPhase.trail = [];
    this.glitchPhase.trailTick = 0;
    this.glitchPhase.echoReady = 1;
    this.glitchPhase.echoCooldown = 0;
    this.glitchPhase.echoPulse = 0;
    this.hackerSkill.globalLock = 0;
    this.hackerSkill.fork.cooldown = 0;
    this.hackerSkill.fork.packets = [];
    this.hackerSkill.spike.cooldown = 0;
    this.hackerSkill.spike.flash = 0;
    this.hackerSkill.swarm.cooldown = 0;
    this.hackerSkill.swarm.active = 0;
    this.hackerSkill.swarm.timer = 0;
    this.skeletonBurst.flash = 0;
  }

  isCharacterUnlocked(index) {
    const name = CHARACTERS[index] ? CHARACTERS[index].name : "";
    if (name === "PALADIN") return !!this.paladinUnlocked;
    if (name === "GLITCHRUNNER") return !!this.glitchrunnerUnlocked;
    if (name === "SHADOWRUNNER") return !!this.shadowrunnerUnlocked;
    if (name === "SKELETON") return !!this.skeletonUnlocked;
    return true;
  }

  getUnlockedCharacterIndices() {
    const list = [];
    for (let i = 0; i < CHARACTERS.length; i++) {
      if (this.isCharacterUnlocked(i)) list.push(i);
    }
    return list;
  }

  cycleCharacterForward() {
    const unlocked = this.getUnlockedCharacterIndices();
    if (!unlocked.length) return;
    const currentPos = Math.max(0, unlocked.indexOf(this.characterIndex));
    const nextPos = (currentPos + 1) % unlocked.length;
    this.setCharacter(unlocked[nextPos]);
  }

  cycleCharacterBackward() {
    const unlocked = this.getUnlockedCharacterIndices();
    if (!unlocked.length) return;
    const currentPos = Math.max(0, unlocked.indexOf(this.characterIndex));
    const prevPos = (currentPos - 1 + unlocked.length) % unlocked.length;
    this.setCharacter(unlocked[prevPos]);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.isPaused = 0;
    this.rngState = 1234567 + (this.levelIndex + 1) * 99991;
    const levelTheme = getThemeForLevel(this.levelIndex);
    this.audio.playTheme(levelTheme);

    let paladinUnlockTriggered = 0;
    let glitchrunnerUnlockTriggered = 0;
    let shadowrunnerUnlockTriggered = 0;
    let skeletonUnlockTriggered = 0;
    if (levelTheme === "GOTHIC" && !this.paladinUnlocked) {
      this.paladinUnlocked = 1;
      const paladinIndex = CHARACTERS.findIndex(c => c.name === "PALADIN");
      if (paladinIndex >= 0) this.characterIndex = paladinIndex;
      paladinUnlockTriggered = 1;
    }
    if (levelTheme === "BONECRYPT" && !this.skeletonUnlocked) {
      this.skeletonUnlocked = 1;
      const skeletonIndex = CHARACTERS.findIndex(c => c.name === "SKELETON");
      if (skeletonIndex >= 0) this.characterIndex = skeletonIndex;
      skeletonUnlockTriggered = 1;
    }
    if (levelTheme === "SIMBREACH" && !this.glitchrunnerUnlocked) {
      this.glitchrunnerUnlocked = 1;
      const glitchrunnerIndex = CHARACTERS.findIndex(c => c.name === "GLITCHRUNNER");
      if (glitchrunnerIndex >= 0) this.characterIndex = glitchrunnerIndex;
      glitchrunnerUnlockTriggered = 1;
    }
    if (levelTheme === "SIMBREACH" && !this.shadowrunnerUnlocked) {
      this.shadowrunnerUnlocked = 1;
      shadowrunnerUnlockTriggered = 1;
    }
    if (levelTheme === "SHADOWRUN" && !this.shadowrunnerUnlocked) {
      this.shadowrunnerUnlocked = 1;
      const shadowrunnerIndex = CHARACTERS.findIndex(c => c.name === "SHADOWRUNNER");
      if (shadowrunnerIndex >= 0) this.characterIndex = shadowrunnerIndex;
      shadowrunnerUnlockTriggered = 1;
    }

    this.tileGrid = LEVELS[this.levelIndex].map(r => r.split(""));
    this.tileRows = this.tileGrid.length;
    this.tileCols = this.tileGrid[0].length;

    this.enemies = [];
    this.coinDrops = [];
    this.magnetItems = [];
    this.blockDebris = [];
    this.oneupBursts = [];
    this.relicBursts = [];
    this.relicFloatTexts = [];
    this.relicFlash = 0;
    this.checkpointRain = [];
    this.enemyShatter = [];
    this.vampireBlood = [];
    this.cryptTrails = [];
    this.vampireSpawnPoints = [];
    this.robotPulse.timer = 0;
    this.robotPulse.cooldown = 0;
    this.robotPulse.ringT = 0;
    this.robotPulse.phase2Active = 0;
    this.robotPulse.phase2Notice = 0;
    this.robotPulse.phase2ReadyLatch = 0;
    this.robotPulse.killNotice = 0;
    this.robotPulse.killCount = 0;
    this.rangerGrapple.active = 0;
    this.rangerGrapple.cooldown = 0;
    this.rangerGrapple.timer = 0;
    this.rangerGrapple.ringT = 0;
    this.paladinDash.active = 0;
    this.paladinDash.cooldown = 0;
    this.paladinDash.timer = 0;
    this.paladinDash.afterglow = 0;
    this.duckDive.active = 0;
    this.duckDive.cooldown = 0;
    this.duckDive.timer = 0;
    this.duckDive.afterglow = 0;
    this.duckDive.flash = 0;
    this.bunnyRocket.active = 0;
    this.bunnyRocket.timer = 0;
    this.bunnyRocket.afterglow = 0;
    this.bunnyRocket.trail = [];
    this.bunnyRocket.trailTick = 0;
    this.bunnyRocket.charges = BUNNY_CARROT_ROCKET.maxCharges;
    this.bunnyRocket.rechargeTimer = 0;
    this.bunnyRocket.burstUsed = 0;
    this.bunnyRocket.burstFlash = 0;
    this.ninjaShadow.active = 0;
    this.ninjaShadow.cooldown = 0;
    this.ninjaShadow.timer = 0;
    this.ninjaShadow.afterglow = 0;
    this.ninjaShadow.trail = [];
    this.ninjaShadow.trailTick = 0;
    this.ninjaShadow.overdriveUsed = 0;
    this.glitchPhase.active = 0;
    this.glitchPhase.cooldown = 0;
    this.glitchPhase.timer = 0;
    this.glitchPhase.afterglow = 0;
    this.glitchPhase.trail = [];
    this.glitchPhase.trailTick = 0;
    this.glitchPhase.echoReady = 1;
    this.glitchPhase.echoCooldown = 0;
    this.glitchPhase.echoPulse = 0;
    this.hackerSkill.globalLock = 0;
    this.hackerSkill.fork.cooldown = 0;
    this.hackerSkill.fork.packets = [];
    this.hackerSkill.spike.cooldown = 0;
    this.hackerSkill.spike.flash = 0;
    this.hackerSkill.swarm.cooldown = 0;
    this.hackerSkill.swarm.active = 0;
    this.hackerSkill.swarm.timer = 0;
    this.hackerSkill.swarm.angle = 0;
    this.skeletonBurst.cooldown = 0;
    this.skeletonBurst.flash = 0;
    this.skeletonBurst.phase2Notice = 0;
    this.skeletonBurst.phase2ReadyLatch = 0;
    this.skeletonBurst.lastPhase2 = 0;
    this.skeletonBurst.phase2Charged = 0;
    this.skeletonBurst.phase2ChargeFrames = 0;
    this.skeletonBurstShots = [];
    this.conductorCore.active = 0;
    this.conductorCore.timer = 0;
    this.conductorCore.cooldown = 0;
    this.conductorCore.notice = 0;
    this.conductorCore.pulse = 0;
    this.batCompanion.active = 0;
    this.batCompanion.timer = 0;
    this.batCompanion.vx = 0;
    this.batCompanion.vy = 0;
    this.batCompanion.shimmer = 0;
    this.batCompanion.trail = [];
    this.batCompanion.trailTick = 0;
    this.batCompanion.coinDropTimer = 0;
    this.batCompanion.burstT = 0;
    this.batCompanion.burstLife = 0;
    this.batCompanion.pushSfxCooldown = 0;
    this.batCompanion.returningFrames = 0;
    this.holyWard = 0;
    this.holyWardCooldown = 0;
    this.levelLightZones = (typeof LEVEL_LIGHT_ZONES !== "undefined" && LEVEL_LIGHT_ZONES[this.levelIndex]) ? LEVEL_LIGHT_ZONES[this.levelIndex] : [];
    this.playerShatter = [];
    this.deathTimer = 0;
    this.deathReset = 0;
    this.gameOverCinematic.active = 0;
    this.gameOverCinematic.frame = 0;
    this.gameOverCinematic.nextImpactFrame = 0;
    this.gameOverCinematic.impactIndex = -1;
    this.gameOverCinematic.systemFailureFrame = -1;
    this.gameOverCinematic.awaitingInput = 0;
    this.gameOverCinematic.proceed = 0;
    this.gameOverCinematic.shake = 0;
    this.gameOverCinematic.particles = [];
    this.gameOverCinematic.fireParticles = [];
    this.gameOverCinematic.fireSpawnTick = 0;
    this.gameOverCinematic.fireActive = 0;
    for (let i = 0; i < this.gameOverCinematic.chunks.length; i++) {
      const chunk = this.gameOverCinematic.chunks[i];
      chunk.impacted = 0;
      chunk.impactFrame = -1;
    }

    this.winPending = 0;
    this.levelDeaths = 0;
    this.levelKillCount = 0;
    this.levelKillsByType = {};
    this.helpTimer = 0;
    this.helpShownBlocks.clear();
    this.boneCryptWeather.rain = [];
    this.boneCryptWeather.lightning = 0;
    this.boneCryptWeather.lightningCooldown = 0;
    this.boneCryptWeather.cloudDriftNear = 0;
    this.boneCryptWeather.cloudDriftFar = 0;
    this.backgroundActors = this.buildLevelBackgroundActors(this.levelIndex);
    this.levelCheckpoints = [];
    this.activeCheckpointIndex = -1;
    this.checkpointNotice = 0;
    this.respawnGrace = 0;
    this.portals = [];
    this.portalCooldown = 0;
    this.portalOverlapLock = 0;
    this.geometryMusicSection = -1;
    this.geometryMusicNotice = 0;
    this.geometryMusicLabel = "";
    this.teleportNotice = "";
    this.teleportNoticeTimer = 0;
    this.shadowrunHintStage = 0;
    this.stormMechanics = this.createStormMechanicsState();

    let spawnX = 10, spawnY = 10;
    let goalMarker = null;

    const spawnFlyer = (type, tileX, tileY) => {
      const px = tileX * TILE_SIZE;
      const py = tileY * TILE_SIZE;
      const size = type === 5 ? 35 : (type === 7 ? 24 : (type === 4 ? 14 : (type === 6 ? 12 : 10)));
      this.enemies.push({
        type,
        x: px,
        y: py,
        baseX: px,
        baseY: py,
        vx: 0,
        vy: 0,
        w: size,
        h: size,
        dir: (tileX & 1) ? 1 : -1,
        onGround: 0,
        dead: 0,
        anim: 0,
        phase: ((tileX * 17 + tileY * 11) % 628) * 0.01,
        variant: ((tileX * 7 + tileY * 11 + type * 5) & 1)
      });
    };

    const spawnShieldedWorker = (tileX, tileY) => {
      this.enemies.push({
        type: 8,
        x: tileX * TILE_SIZE,
        y: tileY * TILE_SIZE,
        vx: 0,
        vy: 0,
        w: 10,
        h: 10,
        dir: (tileX & 1) ? 1 : -1,
        onGround: 0,
        dead: 0,
        anim: 0,
        variant: ((tileX * 13 + tileY * 5 + 17) & 1),
        workerState: "PATROL",
        workerStateTimer: SHIELDED_WORKER.patrolFramesMin + ((this.rand01() * (SHIELDED_WORKER.patrolFramesMax - SHIELDED_WORKER.patrolFramesMin + 1)) | 0)
      });
    };

    const spawnFrankenstein = (tileX, tileY) => {
      this.enemies.push({
        type: 9,
        x: tileX * TILE_SIZE,
        y: tileY * TILE_SIZE,
        vx: 0,
        vy: 0,
        w: 10,
        h: 30,
        dir: (tileX & 1) ? 1 : -1,
        onGround: 0,
        dead: 0,
        anim: 0,
        variant: ((tileX * 9 + tileY * 7 + 29) & 1),
        frankState: "MARCH",
        frankTimer: 0
      });
    };

    for (let y = 0; y < this.tileRows; y++) {
      for (let x = 0; x < this.tileCols; x++) {
        const ch = this.tileGrid[y][x];
        if (ch === "S") {
          spawnX = x * TILE_SIZE;
          spawnY = y * TILE_SIZE;
          this.tileGrid[y][x] = ".";
        } else if (ch === "E") {
          this.enemies.push({ type: 0, x: x*TILE_SIZE, y: y*TILE_SIZE, vx: 0, vy: 0, w: 10, h: 10, dir: -1, onGround: 0, dead: 0, anim: 0, variant: ((x * 13 + y * 5) & 1) });
          this.tileGrid[y][x] = ".";
        } else if (ch === "V") {
          spawnFlyer(1, x, y);
          this.tileGrid[y][x] = ".";
        } else if (ch === "W") {
          spawnFlyer(2, x, y);
          this.tileGrid[y][x] = ".";
        } else if (ch === "Y") {
          spawnFlyer(3, x, y);
          this.tileGrid[y][x] = ".";
        } else if (ch === "Z") {
          spawnFlyer(4, x, y);
          this.vampireSpawnPoints.push({ type: 4, tx: x, ty: y });
          this.tileGrid[y][x] = ".";
        } else if (ch === "R") {
          spawnFlyer(5, x, y);
          this.vampireSpawnPoints.push({ type: 5, tx: x, ty: y });
          this.tileGrid[y][x] = ".";
        } else if (ch === "N") {
          spawnFlyer(6, x, y);
          this.tileGrid[y][x] = ".";
        } else if (ch === "G") {
          spawnFlyer(7, x, y);
          this.tileGrid[y][x] = ".";
        } else if (ch === "K") {
          spawnShieldedWorker(x, y);
          this.tileGrid[y][x] = ".";
        } else if (ch === "!") {
          spawnFrankenstein(x, y);
          this.tileGrid[y][x] = ".";
        } else if (ch === "M") {
          this.tileGrid[y][x] = "M";
        } else if (ch === "F") {
          goalMarker = { x: x, y: y };
          this.tileGrid[y][x] = ".";
        } else if (ch === "P") {
          this.portals.push({ type: "section", x: x * TILE_SIZE, y: y * TILE_SIZE, w: 12, h: 18, tx: x, ty: y });
          this.tileGrid[y][x] = ".";
        } else if (ch === "D") {
          this.portals.push({ type: "dimensional", x: x * TILE_SIZE, y: y * TILE_SIZE, w: 12, h: 18, tx: x, ty: y });
          this.tileGrid[y][x] = ".";
        } else if (ch === "=") {
          this.stormMechanics.rails.push({
            tx: x,
            ty: y,
            segment: this.stormSegmentFromTileX(x),
            actIndex: this.stormActIndexFromTileX(x),
            linkId: null,
            hasController: 0,
            autonomous: 0
          });
          this.tileGrid[y][x] = ".";
        } else if (ch === "A") {
          this.stormMechanics.nodes.push({
            tx: x,
            ty: y,
            segment: this.stormSegmentFromTileX(x),
            actIndex: this.stormActIndexFromTileX(x),
            linkId: null,
            invalidLink: 0,
            fallbackVisualOnly: 0
          });
          this.tileGrid[y][x] = ".";
        } else if (ch === "J") {
          this.stormMechanics.jets.push({
            tx: x,
            ty: y,
            segment: this.stormSegmentFromTileX(x),
            actIndex: this.stormActIndexFromTileX(x),
            orientation: "up",
            linkId: null,
            standalone: 0
          });
          this.tileGrid[y][x] = ".";
        } else if (ch === "~") {
          this.stormMechanics.surges.push({
            tx: x,
            ty: y,
            segment: this.stormSegmentFromTileX(x),
            actIndex: this.stormActIndexFromTileX(x),
            consumed: 0
          });
          this.tileGrid[y][x] = ".";
        } else {
          const linkId = this.stormLinkIdFromChar(ch);
          if (linkId !== null) {
            this.stormMechanics.linkPaints.push({
              tx: x,
              ty: y,
              linkId,
              segment: this.stormSegmentFromTileX(x),
              actIndex: this.stormActIndexFromTileX(x)
            });
            this.tileGrid[y][x] = ".";
          }
        }
      }
    }

    if (levelTheme === "STORMFOUNDRY") {
      this.resolveStormMechanicLinks();
      for (let i = 0; i < this.stormMechanics.nodes.length; i++) {
        const node = this.stormMechanics.nodes[i];
        node.fallbackVisualOnly = node.invalidLink ? 1 : 0;
      }
    }

    for (let y = 1; y < this.tileRows; y++) {
      for (let x = 0; x < this.tileCols; x++) {
        if (this.tileGrid[y][x] === "H" && this.tileGrid[y - 1][x] === ".") {
          this.tileGrid[y - 1][x] = "Q";
        }
      }
    }

    const extraFlyers = EXTRA_FLYERS_BY_LEVEL[this.levelIndex] || [];
    for (let i = 0; i < extraFlyers.length; i++) {
      const f = extraFlyers[i];
      spawnFlyer(f.type, f.x, f.y);
    }

    if (goalMarker) {
      const markerTx = goalMarker.x;
      const markerTy = goalMarker.y;
      let baseY = (this.tileRows - 1) * TILE_SIZE;
      for (let ty = markerTy + 1; ty < this.tileRows; ty++) {
        if (this.isSolid(this.tileIdAt(markerTx, ty))) { baseY = ty * TILE_SIZE; break; }
      }

      const poleHeightTiles = 9;
      const poleWidthPx = 10;
      let poleX = markerTx * TILE_SIZE;
      const leftSolid = this.isSolid(this.tileIdAt(markerTx - 1, markerTy));
      const rightSolid = this.isSolid(this.tileIdAt(markerTx + 1, markerTy));
      if (leftSolid && !rightSolid) poleX += 0.001;
      else if (rightSolid && !leftSolid) poleX -= 0.001;
      const poleTopY = baseY - poleHeightTiles * TILE_SIZE;
      const flagX = poleX + 6;
      const flagYStart = baseY - (poleHeightTiles - 6) * TILE_SIZE;
      const flagYEnd = baseY - (poleHeightTiles + 1) * TILE_SIZE;

      const poleHitbox = { x: poleX, y: poleTopY, w: poleWidthPx, h: poleHeightTiles * TILE_SIZE };
      const flagHitbox = { x: flagX, y: flagYStart, w: 10, h: 10 };

      this.goal = {
        x: poleX,
        markerY: markerTy * TILE_SIZE,
        baseY: baseY,
        poleHeightTiles: poleHeightTiles,
        poleWidthPx: poleWidthPx,
        hitboxPole: poleHitbox,
        hitboxFlag: flagHitbox,
        flagX: flagX,
        flagY: flagYStart,
        flagYStart: flagYStart,
        flagYEnd: flagYEnd,
        raising: 0,
        raiseFrame: 0,
        raiseFrames: 90
      };
    } else {
      this.goal = null;
    }

    this.player = {
      x: spawnX, y: spawnY, vx: 0, vy: 0, w: 10, h: 10,
      onGround: 0, coyote: 0, jumpBuf: 0, face: 1, anim: 0,
      wrapGrace: 0, quackFrame: 0, ninjaAirJumps: 0, duckFuel: 0, duckFlying: 0, skeletonCrouch: 0
    };

    this.setCharacter(this.characterIndex);
    this.levelSpawnX = spawnX;
    this.levelSpawnY = spawnY;
    this.levelCheckpoints = this.buildLevelCheckpoints(this.levelIndex);
    this.configureGeometryDreamPortals();

    if (paladinUnlockTriggered) {
      this.teleportNotice = "PALADIN UNLOCKED: AEGIS DASH";
      this.teleportNoticeTimer = 150;
    }
    if (glitchrunnerUnlockTriggered) {
      this.teleportNotice = "GLITCHRUNNER UNLOCKED: PHASE DASH";
      this.teleportNoticeTimer = 150;
    }
    if (shadowrunnerUnlockTriggered) {
      this.teleportNotice = "SHADOWRUNNER UNLOCKED: HACKER SKILLS";
      this.teleportNoticeTimer = 150;
    }
    if (skeletonUnlockTriggered) {
      this.teleportNotice = "SKELETON UNLOCKED: BLOOD BURST";
      this.teleportNoticeTimer = 150;
    }

    if (this.pendingTeleportNotice) {
      this.teleportNotice = this.pendingTeleportNotice;
      this.teleportNoticeTimer = 120;
      this.pendingTeleportNotice = "";
    }

    this.cameraX = 0;
    this.cameraY = 0;
    this.levelNameBanner = 90;
  }

  buildLevelBackgroundActors(levelIndex) {
    const defs = LEVEL_BACKGROUND_ACTORS[levelIndex] || [];
    const actors = [];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      actors.push({
        ...d,
        phase: Number.isFinite(d.phase) ? d.phase : this.rand01() * 6.283
      });
    }
    return actors;
  }

  findCheckpointSpawnY(tileX) {
    const tx = clamp(tileX | 0, 0, this.tileCols - 1);
    for (let ty = 0; ty < this.tileRows - 1; ty++) {
      const here = this.tileIdAt(tx, ty);
      const below = this.tileIdAt(tx, ty + 1);
      if (here === 0 && this.isSolid(below)) return ty * TILE_SIZE;
    }
    return Math.max(0, (this.tileRows - 3) * TILE_SIZE);
  }

  buildLevelCheckpoints(levelIndex) {
    const defs = (typeof LEVEL_CHECKPOINTS !== "undefined" && LEVEL_CHECKPOINTS[levelIndex]) ? LEVEL_CHECKPOINTS[levelIndex] : [];
    const checkpoints = [];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i] || {};
      const tx = clamp((d.xTile | 0), 1, Math.max(1, this.tileCols - 2));
      checkpoints.push({
        xTile: tx,
        x: tx * TILE_SIZE,
        y: this.findCheckpointSpawnY(tx),
        label: d.label || ("Checkpoint " + (i + 1))
      });
    }
    checkpoints.sort((a, b) => a.xTile - b.xTile);
    return checkpoints;
  }

  configureGeometryDreamPortals() {
    if (getThemeForLevel(this.levelIndex) !== "GEOMETRYDREAM") return;

    if (!this.portals.length) {
      const sectionWidth = 96;
      const sectionPortals = [90, 186, 282, 378, 474];
      for (let i = 0; i < sectionPortals.length; i++) {
        const tx = clamp(sectionPortals[i], 8, Math.max(8, this.tileCols - 14));
        const py = this.findCheckpointSpawnY(tx);
        const section = Math.floor(tx / sectionWidth);
        const targetTx = clamp((section + 1) * sectionWidth + 8, 8, Math.max(8, this.tileCols - 12));
        const targetY = this.findCheckpointSpawnY(targetTx);
        this.portals.push({
          type: "section",
          x: tx * TILE_SIZE,
          y: py,
          w: 12,
          h: 18,
          targetX: targetTx * TILE_SIZE + 1,
          targetY: targetY
        });
      }

      const dimTx = clamp(this.tileCols - 40, 12, Math.max(12, this.tileCols - 12));
      const dimY = this.findCheckpointSpawnY(dimTx);
      this.portals.push({
        type: "dimensional",
        x: dimTx * TILE_SIZE,
        y: dimY,
        w: 12,
        h: 18
      });
    }
  }

  pickDimensionalDestination() {
    const options = [];
    for (let i = 0; i < LEVEL_THEMES.length; i++) {
      if (i === this.levelIndex) continue;
      if (LEVEL_THEMES[i] === "GEOMETRYDREAM") continue;
      options.push(i);
    }
    if (!options.length) return -1;
    return options[(this.rand01() * options.length) | 0];
  }

  pickRandomSectionPortalIndex(currentIndex) {
    const sectionIndices = [];
    for (let i = 0; i < this.portals.length; i++) {
      if (this.portals[i] && this.portals[i].type === "section" && i !== currentIndex) sectionIndices.push(i);
    }
    if (!sectionIndices.length) return currentIndex;
    return sectionIndices[(this.rand01() * sectionIndices.length) | 0];
  }

  maybePortalCharacterShift() {
    if (this.rand01() >= 0.5) return 0;
    const unlocked = this.getUnlockedCharacterIndices();
    if (unlocked.length <= 1) return 0;

    let next = this.characterIndex;
    for (let tries = 0; tries < 6 && next === this.characterIndex; tries++) {
      next = unlocked[(this.rand01() * unlocked.length) | 0];
    }
    if (next === this.characterIndex) {
      const pos = Math.max(0, unlocked.indexOf(this.characterIndex));
      next = unlocked[(pos + 1) % unlocked.length];
    }

    this.setCharacter(next);
    this.audio.tone(700, 0.04, 0.00, "triangle", 0.04);
    return 1;
  }

  updateGeometryDreamMusic() {
    const theme = getThemeForLevel(this.levelIndex);
    if (theme !== "GEOMETRYDREAM") return;
    const sectionWidth = 96 * TILE_SIZE;
    const px = this.player.x + this.player.w * 0.5;
    const section = clamp((px / sectionWidth) | 0, 0, 5);
    if (section === this.geometryMusicSection) return;

    this.geometryMusicSection = section;
    const phase = section + 1;
    this.geometryMusicLabel = "Phase " + phase;
    this.geometryMusicNotice = 85;
    this.audio.playTheme("GEOMETRYDREAM_S" + phase);
    this.audio.tone(460 + phase * 44, 0.04, 0, "triangle", 0.05);
  }

  updatePortals() {
    if (!this.portals.length || !this.player) return;
    const p = this.player;

    if (this.portalOverlapLock) {
      for (let i = 0; i < this.portals.length; i++) {
        if (rectsOverlap(p, this.portals[i])) return;
      }
      this.portalOverlapLock = 0;
    }

    if (this.portalCooldown > 0) {
      this.portalCooldown--;
      return;
    }

    for (let i = 0; i < this.portals.length; i++) {
      const portal = this.portals[i];
      if (!rectsOverlap(p, portal)) continue;

      if (portal.type === "section") {
        const destinationIndex = this.pickRandomSectionPortalIndex(i);
        let destination = this.portals[destinationIndex] || portal;
        if (destination === portal && Number.isFinite(portal.tx)) {
          const sectionWidthTiles = 96;
          const maxTx = Math.max(8, this.tileCols - 12);
          const forwardTx = portal.tx + sectionWidthTiles;
          const backTx = portal.tx - sectionWidthTiles;
          const fallbackTx = forwardTx <= maxTx
            ? forwardTx
            : (backTx >= 8 ? backTx : clamp(portal.tx + 24, 8, maxTx));
          destination = {
            x: fallbackTx * TILE_SIZE,
            y: this.findCheckpointSpawnY(fallbackTx),
            w: portal.w
          };
        }
        let tx = Number.isFinite(destination.x) ? (destination.x + 1) : (portal.x + 1);
        if (Number.isFinite(destination.x) && Number.isFinite(destination.w)) {
          const rightExit = destination.x + destination.w + 2;
          const leftExit = destination.x - p.w - 2;
          tx = rightExit;
          if (tx + p.w >= this.tileCols * TILE_SIZE) tx = leftExit;
        }
        const ty = Number.isFinite(destination.y) ? destination.y : p.y;
        const sectionIndex = clamp((((tx / TILE_SIZE) / 96) | 0) + 1, 1, 6);
        p.x = clamp(tx, 0, this.tileCols * TILE_SIZE - p.w - 0.001);
        p.y = clamp(ty, 0, this.tileRows * TILE_SIZE - p.h - 0.001);
        p.vx = 0;
        p.vy = -1.2;
        p.wrapGrace = 20;
        this.portalCooldown = 32;
        this.portalOverlapLock = 1;
        const shifted = this.maybePortalCharacterShift();
        this.teleportNotice = "PORTAL -> SECTION " + sectionIndex + (shifted ? " | FORM SHIFT" : "");
        this.teleportNoticeTimer = 90;
        this.spawnCheckpointRain(p.x + p.w * 0.5, p.y + p.h * 0.5);
        this.audio.tone(880, 0.05, 0.00, "sine", 0.05);
        this.audio.tone(620, 0.06, 0.04, "triangle", 0.04);
        return;
      }

      const nextLevel = this.pickDimensionalDestination();
      if (nextLevel >= 0) {
        this.pendingTeleportNotice = "DIMENSION -> " + LEVEL_NAMES[nextLevel];
        this.audio.tone(520, 0.05, 0.00, "triangle", 0.05);
        this.audio.tone(980, 0.07, 0.05, "sine", 0.04);
        this.loadLevel(nextLevel);
        return;
      }
    }
  }

  updateCheckpointProgress() {
    if (!this.levelCheckpoints.length || !this.player) return;
    const px = this.player.x + this.player.w * 0.5;
    let reached = this.activeCheckpointIndex;
    for (let i = 0; i < this.levelCheckpoints.length; i++) {
      const cp = this.levelCheckpoints[i];
      if (px >= cp.x) reached = i;
    }
    if (reached !== this.activeCheckpointIndex) {
      this.activeCheckpointIndex = reached;
      if (reached >= 0) {
        this.checkpointNotice = 90;
        this.spawnCheckpointRain(this.player.x + this.player.w * 0.5, this.player.y);
        this.audio.tone(720, 0.04, 0.00, "triangle", 0.04);
        this.audio.tone(980, 0.05, 0.04, "sine", 0.04);
        this.audio.tone(1240, 0.06, 0.08, "triangle", 0.035);
        this.audio.tone(920, 0.07, 0.13, "sine", 0.03);
      }
    }
  }

  spawnCheckpointRain(cx, py) {
    const count = 54;
    const topY = py - 20;
    for (let i = 0; i < count; i++) {
      this.checkpointRain.push({
        x: cx + (this.rand01() - 0.5) * 26,
        y: topY - this.rand01() * 18,
        vx: (this.rand01() - 0.5) * 0.4,
        vy: 0.8 + this.rand01() * 1.8,
        t: 28 + ((this.rand01() * 26) | 0),
        life: 28,
        size: this.rand01() > 0.7 ? 2 : 1,
        col: this.rand01() > 0.5 ? PALETTE.H : PALETTE.F
      });
    }
  }

  updateCheckpointRain() {
    for (let i = 0; i < this.checkpointRain.length; i++) {
      const p = this.checkpointRain[i];
      if (p.t-- <= 0) { p.dead = 1; continue; }
      p.vy += 0.05;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
    }
    this.checkpointRain = this.checkpointRain.filter(p => !p.dead);
  }

  respawnAtCheckpoint() {
    if (!this.player) return this.loadLevel(this.levelIndex);
    const p = this.player;
    const ch = CHARACTERS[this.characterIndex];
    p.w = ch.w;
    p.h = ch.h;
    const cp = this.activeCheckpointIndex >= 0 ? this.levelCheckpoints[this.activeCheckpointIndex] : null;
    const rx = cp ? (cp.x + TILE_SIZE * 0.5 - p.w * 0.5) : this.levelSpawnX;
    const ry = cp ? cp.y : this.levelSpawnY;

    p.x = clamp(rx, 0, this.tileCols * TILE_SIZE - p.w - 0.001);
    p.y = ry;
    p.vx = 0;
    p.vy = 0;
    p.onGround = 0;
    p.coyote = 0;
    p.jumpBuf = 0;
    p.wrapGrace = 24;
    p.quackFrame = 0;
    p.ninjaAirJumps = ch.doubleJumps;
    p.duckFuel = ch.duckFlight;
    p.duckFlying = 0;
    p.skeletonCrouch = 0;

    this.rangerGrapple.active = 0;
    this.paladinDash.active = 0;
    this.paladinDash.timer = 0;
    this.paladinDash.afterglow = 0;
    this.duckDive.active = 0;
    this.duckDive.cooldown = 0;
    this.duckDive.timer = 0;
    this.duckDive.afterglow = 0;
    this.duckDive.flash = 0;
    this.ninjaShadow.active = 0;
    this.ninjaShadow.timer = 0;
    this.ninjaShadow.afterglow = 0;
    this.ninjaShadow.trail = [];
    this.ninjaShadow.trailTick = 0;
    this.ninjaShadow.overdriveUsed = 0;
    this.glitchPhase.active = 0;
    this.glitchPhase.timer = 0;
    this.glitchPhase.afterglow = 0;
    this.glitchPhase.trail = [];
    this.glitchPhase.trailTick = 0;
    this.glitchPhase.echoReady = 1;
    this.glitchPhase.echoCooldown = 0;
    this.glitchPhase.echoPulse = 0;
    this.hackerSkill.globalLock = 0;
    this.hackerSkill.fork.cooldown = 0;
    this.hackerSkill.fork.packets = [];
    this.hackerSkill.spike.cooldown = 0;
    this.hackerSkill.spike.flash = 0;
    this.hackerSkill.swarm.cooldown = 0;
    this.hackerSkill.swarm.active = 0;
    this.hackerSkill.swarm.timer = 0;
    this.hackerSkill.swarm.angle = 0;
    this.bunnyRocket.active = 0;
    this.bunnyRocket.timer = 0;
    this.bunnyRocket.afterglow = 0;
    this.bunnyRocket.trail = [];
    this.bunnyRocket.trailTick = 0;
    this.bunnyRocket.charges = BUNNY_CARROT_ROCKET.maxCharges;
    this.bunnyRocket.rechargeTimer = 0;
    this.bunnyRocket.burstUsed = 0;
    this.bunnyRocket.burstFlash = 0;
    this.skeletonBurst.flash = 0;
    this.skeletonBurstShots = [];
    this.skeletonBurst.phase2Charged = 0;
    this.skeletonBurst.phase2ChargeFrames = 0;
    this.conductorCore.active = 0;
    this.conductorCore.timer = 0;
    this.conductorCore.cooldown = 0;
    this.conductorCore.notice = 0;
    this.conductorCore.pulse = 0;
    this.holyWard = 0;
    this.robotPulse.timer = 0;
    this.robotPulse.ringT = 0;
    this.playerShatter = [];
    this.deathTimer = 0;
    this.respawnGrace = 70;
    this.checkpointNotice = cp ? 75 : this.checkpointNotice;

    if (getThemeForLevel(this.levelIndex) === "STORMFOUNDRY" && this.stormMechanics) {
      const state = this.stormMechanics;
      const centerTile = cp ? cp.xTile : (((p.x + p.w * 0.5) / TILE_SIZE) | 0);
      this.startStormSafetyWindow(centerTile, 90);

      for (let i = 0; i < state.rails.length; i++) {
        const rail = state.rails[i];
        rail.state = "OFF";
        rail.timer = Math.max(30, rail.timer | 0);
      }

      for (let i = 0; i < state.jets.length; i++) {
        const jet = state.jets[i];
        jet.state = "WAIT";
        jet.timer = Math.max(42, jet.timer | 0);
      }

      if (state.surge) {
        if (state.surge.state === "ACTIVE" || state.surge.state === "PREWARN") {
          state.surge.state = "DECAY";
          state.surge.timer = state.surge.decayFrames;
        } else {
          state.surge.cooldown = Math.max(state.surge.cooldown | 0, 180);
        }
      }
    }

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e || e.dead || e.type !== 8) continue;
      e.workerState = "PATROL";
      e.workerStateTimer = SHIELDED_WORKER.patrolFramesMin + ((this.rand01() * (SHIELDED_WORKER.patrolFramesMax - SHIELDED_WORKER.patrolFramesMin + 1)) | 0);
    }

    this.respawnVampires();
    this.audio.tone(420, 0.05, 0.00, "square", 0.03);
  }

  updateBackgroundActors() {
    if (!this.backgroundActors.length) return;

    const worldW = Math.max(CANVAS_W, this.tileCols * TILE_SIZE);
    for (let i = 0; i < this.backgroundActors.length; i++) {
      const actor = this.backgroundActors[i];
      actor.x += actor.vx || 0;
      actor.phase = (actor.phase || 0) + (actor.bobSpeed || 0);

      if (actor.type === "distantDragon") {
        const width = Math.max(1, actor.w || 56);
        const minX = 0;
        const maxX = Math.max(0, worldW - width);
        if (actor.x <= minX) {
          actor.x = minX;
          actor.vx = Math.abs(actor.vx || 0.07);
        } else if (actor.x >= maxX) {
          actor.x = maxX;
          actor.vx = -Math.abs(actor.vx || 0.07);
        }
        continue;
      }

      const wrapPad = 120;
      if (actor.x > worldW + wrapPad) actor.x = -wrapPad;
      else if (actor.x < -wrapPad) actor.x = worldW + wrapPad;
    }
  }

  drawBackgroundActors(theme) {
    if (!this.backgroundActors.length) return;
    for (let i = 0; i < this.backgroundActors.length; i++) {
      const actor = this.backgroundActors[i];
      if (actor.theme && actor.theme !== theme) continue;
      this.drawBackgroundActor(actor);
    }
  }

  drawBackgroundActor(actor) {
    if (!actor) return;
    const worldW = Math.max(CANVAS_W, this.tileCols * TILE_SIZE);
    const span = worldW + actor.w + 80;
    let sx = actor.x - this.cameraX * (actor.parallax || 0);
    sx = ((sx % span) + span) % span - actor.w;
    const sy = actor.y + Math.sin(actor.phase || 0) * (actor.bobAmp || 0);
    const glowRamp = ((Math.sin((actor.phase || 0) * 0.22 + this.player.anim * 0.012) + 1) * 0.5);

    if (actor.type === "balloon") {
      this.drawSprite(SPRITES.bgBalloonLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "blimp" || actor.type === "zeppelin") {
      this.drawSprite(SPRITES.bgBlimpLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "ruinsSilhouette") {
      this.drawSprite(SPRITES.bgRuinsLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "vineSway") {
      this.drawSprite(SPRITES.bgVineLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "railCrates") {
      this.drawSprite(SPRITES.bgCrateRigLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "cableGondola") {
      this.drawSprite(SPRITES.bgGondolaLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "drawbridgeLift") {
      this.drawSprite(SPRITES.bgDrawbridgeLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "tornBanner") {
      this.drawSprite(SPRITES.bgBannerLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "iceShard") {
      this.drawSprite(SPRITES.bgIceShardLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "frostyBalloon") {
      this.drawSprite(SPRITES.bgBalloonLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "ashBlimp") {
      this.drawSprite(SPRITES.bgBlimpLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "rockChunk") {
      this.drawSprite(SPRITES.bgRockChunkLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "skyRuins") {
      this.drawSprite(SPRITES.bgSkyRuinsLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "grappleSpire") {
      this.drawSprite(SPRITES.bgGrappleSpireLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "japanPagoda") {
      this.drawSprite(SPRITES.bgJapanPagodaLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "toriiGate") {
      this.drawSprite(SPRITES.bgJapanToriiLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "hauntedMansion") {
      this.drawSprite(SPRITES.bgHauntedMansionLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "graveGate") {
      this.drawSprite(SPRITES.bgGraveGateLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "geoWireCube") {
      this.drawSprite(SPRITES.bgGeoWireCubeLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "geoPolyShard") {
      this.drawSprite(SPRITES.bgGeoPolyShardLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "geoGridPlane") {
      this.drawSprite(SPRITES.bgGeoGridPlaneLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "geoMirrorDoor") {
      this.drawSprite(SPRITES.bgGeoMirrorDoorLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "moonBalloon") {
      this.drawSprite(SPRITES.bgMoonBalloonLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "shootingGlider" || actor.type === "stationShuttle" || actor.type === "airplane") {
      this.drawSprite(SPRITES.bgShuttleLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "debrisTug") {
      this.drawSprite(SPRITES.bgTugLarge, sx, sy, actor.scale || 1);
    } else if (actor.type === "bird") {
      this.drawSprite(SPRITES.bgBirdSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "distantDragon") {
      const dragonWidth = Math.max(56, actor.w || 56);
      const facingRight = (actor.vx || 0) > 0;
      if (facingRight) {
        gfx.save();
        gfx.translate((sx + dragonWidth) | 0, 0);
        gfx.scale(-1, 1);
      }
      const dragonBaseX = facingRight ? 0 : sx;
      const drawDragonRect = (x, y, w, h) => {
        gfx.fillRect((dragonBaseX + x) | 0, y | 0, w, h);
      };

      const flap = ((Math.sin((actor.phase || 0) * 1.45 + this.player.anim * 0.05) + 1) * 0.5);
      const wingRise = (flap * 6) | 0;
      const wingDrop = ((1 - flap) * 5) | 0;
      const bodyY = sy + 6;
      const fireCycleFrames = 360;
      const fireActiveFrames = 180;
      const fireFrame = this.player.anim % fireCycleFrames;
      const fireActive = fireFrame >= (fireCycleFrames - fireActiveFrames);
      const fireT = fireActive ? ((fireFrame - (fireCycleFrames - fireActiveFrames)) / fireActiveFrames) : 0;
      const firePower = fireActive ? (0.35 + Math.sin(fireT * 3.141592653589793) * 0.65) : 0;

      gfx.fillStyle = "#4f1111";
      drawDragonRect(8, bodyY, 24, 4);
      drawDragonRect(31, bodyY + 1, 6, 3);
      drawDragonRect(36, bodyY + 2, 2, 2);

      gfx.fillStyle = "#7a1b1b";
      drawDragonRect(10, bodyY - 1, 20, 1);
      drawDragonRect(14, bodyY + 4, 14, 1);
      drawDragonRect(32, bodyY, 3, 1);

      gfx.fillStyle = "#a33535";
      drawDragonRect(12, bodyY, 16, 1);
      drawDragonRect(20, bodyY + 2, 7, 1);

      gfx.fillStyle = "#3a0d0d";
      drawDragonRect(2, bodyY + 1, 6, 2);
      drawDragonRect(0, bodyY + 2, 2, 1);
      drawDragonRect(5, bodyY, 2, 1);

      gfx.fillStyle = "#7a1b1b";
      drawDragonRect(7, bodyY - 1, 2, 1);
      drawDragonRect(9, bodyY - 2, 1, 1);
      drawDragonRect(5, bodyY + 3, 3, 1);

      gfx.fillStyle = "#d66a4a";
      drawDragonRect(2, bodyY + 1, 1, 1);

      gfx.fillStyle = "#6a1414";
      drawDragonRect(5, sy - 4 + wingRise, 11, 3);
      drawDragonRect(11, sy - 7 + wingRise, 11, 3);
      drawDragonRect(18, sy - 10 + wingRise, 9, 2);
      drawDragonRect(24, sy - 11 + wingRise, 6, 1);

      gfx.fillStyle = "#8e2323";
      drawDragonRect(8, sy - 3 + wingRise, 10, 2);
      drawDragonRect(14, sy - 6 + wingRise, 10, 2);
      drawDragonRect(21, sy - 8 + wingRise, 7, 1);

      gfx.fillStyle = "#3e0e0e";
      drawDragonRect(7, sy + 8 - wingDrop, 12, 3);
      drawDragonRect(14, sy + 11 - wingDrop, 12, 3);
      drawDragonRect(22, sy + 14 - wingDrop, 9, 2);
      drawDragonRect(28, sy + 16 - wingDrop, 5, 1);

      gfx.fillStyle = "#6a1414";
      drawDragonRect(10, sy + 9 - wingDrop, 10, 2);
      drawDragonRect(16, sy + 12 - wingDrop, 10, 2);
      drawDragonRect(23, sy + 14 - wingDrop, 7, 1);

      gfx.fillStyle = "#2a0808";
      drawDragonRect(4, bodyY + 4, 3, 1);
      drawDragonRect(1, bodyY + 5, 3, 1);
      drawDragonRect(34, bodyY + 3, 2, 1);

      const tailSwing = (Math.sin((actor.phase || 0) * 0.9 + this.player.anim * 0.03) * 2.2) | 0;
      gfx.fillStyle = "#3a0d0d";
      drawDragonRect(37, bodyY + 2 - tailSwing, 6, 2);
      drawDragonRect(42, bodyY + 1 - tailSwing, 5, 2);
      drawDragonRect(46, bodyY - tailSwing, 4, 2);
      drawDragonRect(49, bodyY - 1 - tailSwing, 3, 2);

      gfx.fillStyle = "#6a1414";
      drawDragonRect(38, bodyY + 2 - tailSwing, 4, 1);
      drawDragonRect(43, bodyY + 1 - tailSwing, 3, 1);
      drawDragonRect(47, bodyY - tailSwing, 2, 1);

      gfx.fillStyle = "#a33535";
      drawDragonRect(41, bodyY + 2 - tailSwing, 1, 1);
      drawDragonRect(45, bodyY + 1 - tailSwing, 1, 1);

      gfx.fillStyle = "#4f1111";
      drawDragonRect(51, bodyY - 3 - tailSwing, 2, 1);
      drawDragonRect(52, bodyY - 4 - tailSwing, 2, 1);
      drawDragonRect(53, bodyY - 3 - tailSwing, 2, 1);
      drawDragonRect(52, bodyY - 2 - tailSwing, 2, 1);

      gfx.fillStyle = "#8e2323";
      drawDragonRect(52, bodyY - 3 - tailSwing, 1, 1);

      gfx.fillStyle = "#8e2323";
      drawDragonRect(30, bodyY - 2, 1, 1);
      drawDragonRect(27, bodyY - 2, 1, 1);
      drawDragonRect(24, bodyY - 2, 1, 1);

      gfx.fillStyle = "#c34c3b";
      drawDragonRect(3, bodyY + 1, 1, 1);

      if (fireActive) {
        const sourceX = dragonBaseX + 1;
        const sourceY = (bodyY + 1) | 0;
        const maxDist = 10 + ((firePower * 16) | 0);

        gfx.fillStyle = "#f28a2e";
        gfx.fillRect((sourceX - 2) | 0, sourceY, 2, 1);
        gfx.fillStyle = "#ffd35a";
        gfx.fillRect((sourceX - 1) | 0, sourceY, 1, 1);

        const pieceCount = 18;
        for (let i = 0; i < pieceCount; i++) {
          const launchOffset = i * 0.05;
          const lifePhase = (fireT * 1.22) - launchOffset;
          if (lifePhase <= 0 || lifePhase >= 1) continue;

          const travel = (lifePhase * lifePhase) * maxDist;
          const fade = 1 - lifePhase;
          const rise = ((i % 5) - 2) * 0.45;
          const jitter = Math.sin((actor.phase || 0) * 3.0 + i * 1.7 + this.player.anim * 0.18) * 0.75;
          const px = (sourceX - 1 - travel) | 0;
          const py = (sourceY + rise + jitter) | 0;
          const pw = Math.max(1, (1 + fade * 2) | 0);

          if (fade > 0.72) gfx.fillStyle = "#ffd35a";
          else if (fade > 0.45) gfx.fillStyle = "#f28a2e";
          else if (fade > 0.2) gfx.fillStyle = "#d6492f";
          else gfx.fillStyle = "#8e2323";

          gfx.fillRect(px, py, pw, 1);
          if (pw > 1 && fade > 0.5) gfx.fillRect(px + 1, py + 1, 1, 1);
        }
      }
      if (facingRight) gfx.restore();
    } else if (actor.type === "paperKite") {
      this.drawSprite(SPRITES.bgJapanKiteSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "ghostLantern") {
      this.drawSprite(SPRITES.bgGhostLanternSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "batSwarm") {
      this.drawSprite(SPRITES.bgBatSwarmSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "geoOrbitRune") {
      this.drawSprite(SPRITES.bgGeoOrbitRuneSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "geoChromaprism") {
      const cx = sx + 7;
      const cy = sy + 7;
      gfx.strokeStyle = glowRamp > 0.5 ? "#9a7cff" : "#57e8ff";
      gfx.beginPath();
      gfx.moveTo(cx, cy - 8);
      gfx.lineTo(cx + 7, cy - 1);
      gfx.lineTo(cx, cy + 8);
      gfx.lineTo(cx - 7, cy - 1);
      gfx.closePath();
      gfx.stroke();
      gfx.fillStyle = glowRamp > 0.5 ? "#281a52" : "#10233c";
      gfx.fillRect((cx - 2) | 0, (cy - 2) | 0, 4, 4);
    } else if (actor.type === "geoFluxLens") {
      const cx = sx + 9;
      const cy = sy + 5;
      const ring = 4 + ((Math.sin((actor.phase || 0) * 0.35) + 1) * 0.5) * 2;
      gfx.strokeStyle = glowRamp > 0.5 ? "#4ef3ff" : "#f18cff";
      gfx.beginPath();
      gfx.arc(cx, cy, ring, 0, 6.283);
      gfx.stroke();
      gfx.fillStyle = glowRamp > 0.5 ? "#3f2f77" : "#1f3f67";
      gfx.fillRect((cx - 1) | 0, (cy - 1) | 0, 2, 2);
    } else if (actor.type === "cathedralSpire") {
      gfx.fillStyle = "#2e2740";
      gfx.fillRect(sx | 0, sy | 0, 18, 18);
      gfx.fillStyle = "#46395f";
      gfx.fillRect((sx + 5) | 0, (sy - 8) | 0, 8, 8);
      gfx.fillStyle = "#d9c89a";
      gfx.fillRect((sx + 8) | 0, (sy - 11) | 0, 2, 3);
    } else if (actor.type === "roseWindow") {
      const cx = sx + 7;
      const cy = sy + 7;
      gfx.strokeStyle = glowRamp > 0.5 ? "#e89cff" : "#8ed6ff";
      gfx.beginPath();
      gfx.arc(cx, cy, 6, 0, 6.283);
      gfx.stroke();
      gfx.fillStyle = glowRamp > 0.5 ? "#4d2f69" : "#2c3f69";
      gfx.fillRect((cx - 2) | 0, (cy - 2) | 0, 4, 4);
    } else if (actor.type === "gargoylePerch") {
      gfx.fillStyle = "#4a4a58";
      gfx.fillRect(sx | 0, sy | 0, 12, 8);
      gfx.fillStyle = "#7c7c8b";
      gfx.fillRect((sx + 2) | 0, (sy - 2) | 0, 8, 2);
    } else if (actor.type === "chainBird") {
      this.drawSprite(SPRITES.bgChainBirdSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "canopyBird" || actor.type === "raven" || actor.type === "snowOwl") {
      this.drawSprite(SPRITES.bgBirdSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "drone") {
      this.drawSprite(SPRITES.bgDroneSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "cargoDrone" || actor.type === "antennaDrone") {
      this.drawSprite(SPRITES.bgDroneSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "holoBillboard") {
      const frameFlick = ((this.player.anim + ((actor.phase || 0) * 23)) & 10) === 0;
      gfx.fillStyle = "#142138";
      gfx.fillRect(sx | 0, sy | 0, 22, 12);
      gfx.fillStyle = frameFlick ? "#ffd95e" : "#7dff3b";
      gfx.fillRect((sx + 2) | 0, (sy + 2) | 0, 18, 8);
      gfx.fillStyle = "#09111e";
      gfx.fillRect((sx + 10) | 0, (sy + 12) | 0, 2, 8);
    } else if (actor.type === "cableTram") {
      const tramBob = Math.sin((actor.phase || 0) * 0.6) * 2;
      gfx.strokeStyle = "#2e405f";
      gfx.beginPath();
      gfx.moveTo((sx - 6) | 0, (sy - 10) | 0);
      gfx.lineTo((sx + 26) | 0, (sy - 10) | 0);
      gfx.stroke();
      gfx.fillStyle = "#202f49";
      gfx.fillRect((sx + 4) | 0, (sy + tramBob) | 0, 14, 8);
      gfx.fillStyle = "#9fe7ff";
      gfx.fillRect((sx + 7) | 0, (sy + 2 + tramBob) | 0, 8, 3);
    } else if (actor.type === "serverSpire") {
      const pulse = ((Math.sin((actor.phase || 0) * 0.5 + this.player.anim * 0.04) + 1) * 0.5);
      gfx.fillStyle = "#1b2436";
      gfx.fillRect(sx | 0, sy | 0, 12, 24);
      gfx.fillStyle = pulse > 0.5 ? "#7dff3b" : "#ffd95e";
      gfx.fillRect((sx + 4) | 0, (sy + 3) | 0, 4, 2);
      gfx.fillRect((sx + 4) | 0, (sy + 9) | 0, 4, 2);
      gfx.fillRect((sx + 4) | 0, (sy + 15) | 0, 4, 2);
    } else if (actor.type === "adTower") {
      gfx.fillStyle = "#161f30";
      gfx.fillRect(sx | 0, sy | 0, 10, 22);
      gfx.fillStyle = glowRamp > 0.5 ? "#ff5ef6" : "#9fe7ff";
      gfx.fillRect((sx + 1) | 0, (sy + 2) | 0, 8, 5);
      gfx.fillRect((sx + 1) | 0, (sy + 10) | 0, 8, 5);
      gfx.fillRect((sx + 1) | 0, (sy + 18) | 0, 8, 3);
    } else if (actor.type === "antennaForest") {
      gfx.fillStyle = "#22304a";
      gfx.fillRect((sx + 1) | 0, sy | 0, 2, 16);
      gfx.fillRect((sx + 6) | 0, (sy - 3) | 0, 2, 19);
      gfx.fillRect((sx + 11) | 0, (sy + 2) | 0, 2, 14);
      gfx.fillStyle = "#7dff3b";
      gfx.fillRect((sx + 2) | 0, (sy - 2) | 0, 1, 1);
      gfx.fillRect((sx + 7) | 0, (sy - 5) | 0, 1, 1);
      gfx.fillRect((sx + 12) | 0, sy | 0, 1, 1);
    } else if (actor.type === "lantern") {
      this.drawSprite(SPRITES.bgLanternSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "emberWisp") {
      this.drawSprite(SPRITES.bgLanternSmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "firefly") {
      this.drawSprite(SPRITES.bgFireflySmall, sx, sy, actor.scale || 1);
    } else if (actor.type === "teslaPylon") {
      const flick = ((Math.sin((actor.phase || 0) * 0.8 + this.player.anim * 0.05) + 1) * 0.5);
      gfx.fillStyle = "#2d3342";
      gfx.fillRect(sx | 0, sy | 0, 10, 14);
      gfx.fillStyle = "#1b212d";
      gfx.fillRect((sx + 2) | 0, (sy - 8) | 0, 6, 8);
      gfx.strokeStyle = flick > 0.5 ? "#8a6cff" : "#4ef3ff";
      gfx.beginPath();
      gfx.moveTo((sx + 5) | 0, (sy - 8) | 0);
      gfx.lineTo((sx + 2) | 0, (sy - 14) | 0);
      gfx.lineTo((sx + 8) | 0, (sy - 14) | 0);
      gfx.lineTo((sx + 5) | 0, (sy - 20) | 0);
      gfx.stroke();
    } else if (actor.type === "chainCrane") {
      gfx.fillStyle = "#444f63";
      gfx.fillRect(sx | 0, sy | 0, 18, 4);
      gfx.fillStyle = "#2a3240";
      gfx.fillRect((sx + 13) | 0, (sy + 4) | 0, 3, 12);
      gfx.fillStyle = "#7f8aa3";
      gfx.fillRect((sx + 14) | 0, (sy + 16) | 0, 1, 5);
    } else if (actor.type === "sparkVent") {
      const flick = ((Math.sin((actor.phase || 0) * 0.6 + this.player.anim * 0.09) + 1) * 0.5);
      gfx.fillStyle = "#2e3443";
      gfx.fillRect(sx | 0, sy | 0, 12, 8);
      gfx.fillStyle = flick > 0.5 ? "#f3d44a" : "#4ef3ff";
      gfx.fillRect((sx + 5) | 0, (sy - 3) | 0, 2, 3);
      gfx.fillRect((sx + 3) | 0, (sy - 1) | 0, 1, 2);
      gfx.fillRect((sx + 8) | 0, (sy - 2) | 0, 1, 2);
    } else if (actor.type === "rotatingRingCoil") {
      const cx = sx + 8;
      const cy = sy + 8;
      const pulse = ((Math.sin((actor.phase || 0) * 0.5 + this.player.anim * 0.06) + 1) * 0.5);
      const spin = (this.player.anim * 0.05 + (actor.phase || 0));
      gfx.strokeStyle = pulse > 0.55 ? "#4ef3ff" : "#8a6cff";
      gfx.beginPath();
      gfx.arc(cx, cy, 7, 0, 6.283);
      gfx.stroke();
      gfx.beginPath();
      gfx.arc(cx, cy, 4, 0, 6.283);
      gfx.stroke();
      gfx.fillStyle = "#2d3342";
      gfx.fillRect((cx - 1) | 0, (cy - 1) | 0, 2, 2);
      gfx.fillStyle = "#f3d44a";
      gfx.fillRect((cx + Math.cos(spin) * 6) | 0, (cy + Math.sin(spin) * 6) | 0, 1, 1);
    }
  }

  tileIdAt(tx, ty) {
    if (tx < 0 || tx >= this.tileCols) return 1;
    if (ty < 0 || ty >= this.tileRows) return 0;
    const ch = this.tileGrid[ty][tx];
    return ch === "." ? 0 :
           ch === "#" ? 1 :
           ch === "B" ? 4 :
           ch === "o" ? 2 :
            ch === "T" ? 13 :
            ch === "X" ? 14 :
            ch === "M" ? 15 :
           ch === "O" ? 5 :
           ch === "U" ? 6 :
           ch === "H" ? 8 :
           ch === "h" ? 9 :
           ch === "Q" ? 10 :
           ch === "q" ? 11 :
           ch === "C" ? 12 :
           ch === "L" ? 7 : 0;
  }

  isSolid(tileId) { return tileId === 1 || tileId === 4 || tileId === 8 || tileId === 9 || tileId === 10 || tileId === 11 || tileId === 12; }

  triggerHelpBlock(tx, ty) {
    const key = this.levelIndex + ":" + tx + ":" + ty;
    if (this.helpShownBlocks.has(key)) return;
    this.helpShownBlocks.add(key);
    this.helpTimer = 420;
    this.setTile(tx, ty, "h");
    if (this.tileIdAt(tx, ty - 1) === 10) this.setTile(tx, ty - 1, "q");

    const cx = tx * TILE_SIZE + TILE_SIZE * 0.5;
    const cy = ty * TILE_SIZE + TILE_SIZE * 0.5;
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = this.rand01() * 6.283;
      const v = 0.8 + this.rand01() * 1.8;
      this.blockDebris.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * v,
        vy: -0.8 - this.rand01() * 2.1,
        t: 34 + ((this.rand01() * 14) | 0),
        s: 1 + (this.rand01() > 0.65 ? 1 : 0),
        col: this.rand01() > 0.35 ? "#f3d44a" : "#7dff3b"
      });
    }

    this.audio.tone(680, 0.04);
    this.audio.tone(920, 0.05, 0.05);
  }

  setTile(tx, ty, v) {
    if (tx >= 0 && tx < this.tileCols && ty >= 0 && ty < this.tileRows) this.tileGrid[ty][tx] = v;
  }

  rectHitsSolid(x, y, w, h) {
    const x0 = (x / TILE_SIZE) | 0;
    const x1 = ((x + w - 1) / TILE_SIZE) | 0;
    const y0 = (y / TILE_SIZE) | 0;
    const y1 = ((y + h - 1) / TILE_SIZE) | 0;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.isSolid(this.tileIdAt(tx, ty))) return 1;
      }
    }
    return 0;
  }

  updateSkeletonCrouch(name, downHeld) {
    const p = this.player;
    if (!p) return;
    if (name !== "SKELETON") {
      p.skeletonCrouch = 0;
      return;
    }

    if (downHeld) {
      if (!p.skeletonCrouch) {
        p.y += 10;
        p.h = 10;
        p.skeletonCrouch = 1;
      }
      return;
    }

    if (!p.skeletonCrouch) return;
    if (this.rectHitsSolid(p.x, p.y - 10, p.w, 10)) return;
    p.y -= 10;
    p.h = 20;
    p.skeletonCrouch = 0;
  }

  collideX(e) {
    if (!e.vx) return;
    const dir = e.vx > 0 ? 1 : -1;
    const probeX = dir > 0 ? e.x + e.w : e.x;
    const tx = (probeX / TILE_SIZE) | 0;
    const y0 = (e.y / TILE_SIZE) | 0;
    const y1 = ((e.y + e.h - 1) / TILE_SIZE) | 0;

    for (let ty = y0; ty <= y1; ty++) {
      const tileId = this.tileIdAt(tx, ty);
      if (tileId === 12 && e === this.player && this.paladinDash.active) {
        this.setTile(tx, ty, ".");
        this.spawnCheckpointRain(tx * TILE_SIZE + 5, ty * TILE_SIZE + 5);
        this.audio.tone(880, 0.03, 0.00, "square", 0.03);
        continue;
      }
      if (this.isSolid(tileId)) {
        e.x = dir > 0 ? tx*TILE_SIZE - e.w - 0.001 : (tx + 1)*TILE_SIZE + 0.001;
        e.vx = 0;
        if (e.dir) e.dir *= -1;
        break;
      }
    }
  }

  collideY(e) {
    e.onGround = 0;
    if (!e.vy) return;

    const dir = e.vy > 0 ? 1 : -1;
    const probeY = dir > 0 ? e.y + e.h : e.y;
    const ty = (probeY / TILE_SIZE) | 0;
    const x0 = (e.x / TILE_SIZE) | 0;
    const x1 = ((e.x + e.w - 1) / TILE_SIZE) | 0;

    for (let tx = x0; tx <= x1; tx++) {
      const tileId = this.tileIdAt(tx, ty);
      if (tileId === 12 && e === this.player && this.paladinDash.active) {
        this.setTile(tx, ty, ".");
        this.spawnCheckpointRain(tx * TILE_SIZE + 5, ty * TILE_SIZE + 5);
        this.audio.tone(900, 0.03, 0.00, "triangle", 0.03);
        continue;
      }
      if (this.isSolid(tileId)) {
        if (dir < 0 && tileId === 8) this.triggerHelpBlock(tx, ty);
        e.y = dir > 0 ? ty*TILE_SIZE - e.h - 0.001 : (ty + 1)*TILE_SIZE + 0.001;
        e.vy = 0;
        if (dir > 0) e.onGround = 1;
        break;
      }
    }
  }

  moveAndCollide(e) {
    e.x += e.vx;
    this.collideX(e);
    e.y += e.vy;
    this.collideY(e);
  }

  columnHasBottomGround(tx) { return this.isSolid(this.tileIdAt(tx, this.tileRows - 1)); }

  safeBottomGroundColumn() {
    const centerTx = ((this.player.x + this.player.w * 0.5) / TILE_SIZE) | 0;
    if (this.columnHasBottomGround(centerTx)) return centerTx;
    for (let d = 1; d < this.tileCols; d++) {
      const a = centerTx + d, b = centerTx - d;
      if (a < this.tileCols && this.columnHasBottomGround(a)) return a;
      if (b >= 0 && this.columnHasBottomGround(b)) return b;
    }
    return centerTx;
  }

  wrapToTop() {
    const tx = this.safeBottomGroundColumn();
    const p = this.player;

    p.x = clamp(tx*TILE_SIZE + TILE_SIZE*0.5 - p.w*0.5, 0, this.tileCols*TILE_SIZE - p.w - 0.001);
    p.y = -p.h - 12;
    p.vy = 0;
    p.coyote = 0;
    p.jumpBuf = 0;
    p.onGround = 0;
    p.duckFlying = 0;

    const ch = CHARACTERS[this.characterIndex];
    p.duckFuel = ch.duckFlight;
    p.ninjaAirJumps = ch.doubleJumps;

    p.vx *= 0.6;
    p.wrapGrace = 26;

    this.audio.tone(300, 0.04);
  }

  die(reset) {
    if (this.deathTimer > 0) return;
    if (this.immortalMode && !reset) return;
    if (!reset) {
      this.lives--;
      this.levelDeaths++;
      const coinsBeforeDeath = Math.max(0, this.coins | 0);
      const coinsLost = Math.floor(coinsBeforeDeath * 0.25);
      this.coins = Math.max(0, coinsBeforeDeath - coinsLost);
      this.teleportNotice = "COIN PENALTY -" + coinsLost;
      this.teleportNoticeTimer = 70;
    }
    this.audio.tone(120, 0.10);

    if (this.lives < 0) {
      this.lives = 0;
      this.beginGameOverCinematic();
    } else {
      if (!reset && this.levelCheckpoints.length) this.respawnAtCheckpoint();
      else this.loadLevel(this.levelIndex);
    }
  }

  beginGameOverCinematic() {
    const cinematic = this.gameOverCinematic;
    cinematic.active = 1;
    cinematic.frame = 0;
    cinematic.nextImpactFrame = 6;
    cinematic.impactIndex = -1;
    cinematic.systemFailureFrame = -1;
    cinematic.awaitingInput = 0;
    cinematic.proceed = 0;
    cinematic.shake = 0;
    cinematic.particles = [];
    cinematic.fireParticles = [];
    cinematic.fireSpawnTick = 0;
    cinematic.fireActive = 0;

    for (let i = 0; i < cinematic.chunks.length; i++) {
      const chunk = cinematic.chunks[i];
      chunk.impacted = 0;
      chunk.impactFrame = -1;
    }

    this.teleportNotice = "";
    this.teleportNoticeTimer = 0;
    this.audio.tone(84, 0.18, 0.00, "sawtooth", 0.10);
    this.audio.tone(61, 0.22, 0.03, "triangle", 0.08);
  }

  spawnGameOverWaitingFire() {
    const cinematic = this.gameOverCinematic;
    const count = 6;
    for (let i = 0; i < count; i++) {
      const life = 26 + ((this.rand01() * 28) | 0);
      const x = 18 + this.rand01() * (CANVAS_W - 36);
      const y = CANVAS_H + 2 + this.rand01() * 10;
      cinematic.fireParticles.push({
        x,
        y,
        vx: (this.rand01() - 0.5) * 0.42,
        vy: -(1.35 + this.rand01() * 1.95),
        sway: this.rand01() * 6.283,
        t: life,
        life,
        size: this.rand01() > 0.55 ? 2 : 1,
        kind: this.rand01() > 0.5 ? 0 : 1
      });
    }
    if (cinematic.fireParticles.length > 240) {
      cinematic.fireParticles.splice(0, cinematic.fireParticles.length - 240);
    }
  }

  updateGameOverWaitingFire() {
    const cinematic = this.gameOverCinematic;
    cinematic.fireSpawnTick++;
    if (cinematic.fireSpawnTick >= 1) {
      cinematic.fireSpawnTick = 0;
      this.spawnGameOverWaitingFire();
    }

    for (let i = 0; i < cinematic.fireParticles.length; i++) {
      const p = cinematic.fireParticles[i];
      if (p.t-- <= 0) { p.dead = 1; continue; }
      const lifeP = p.life ? (p.t / p.life) : 0;
      p.sway += 0.24;
      p.vx = p.vx * 0.92 + Math.sin(p.sway) * 0.06;
      p.vy = p.vy * 0.98 - 0.012;
      p.x += p.vx;
      p.y += p.vy;
      if (lifeP < 0.10 || p.y < 34) p.dead = 1;
    }
    cinematic.fireParticles = cinematic.fireParticles.filter((p) => !p.dead);
  }

  spawnGameOverImpactParticles(chunk, intensity = 1) {
    const cx = chunk.x + chunk.w * 0.5;
    const cy = chunk.y + chunk.h * 0.5;
    const count = 42 + ((18 * intensity) | 0);

    for (let i = 0; i < count; i++) {
      const edge = i & 3;
      const life = 16 + ((this.rand01() * 22) | 0);
      const sideX = edge === 0 ? chunk.x : (edge === 1 ? chunk.x + chunk.w : (chunk.x + this.rand01() * chunk.w));
      const sideY = edge === 2 ? chunk.y : (edge === 3 ? chunk.y + chunk.h : (chunk.y + this.rand01() * chunk.h));
      const px = sideX + (this.rand01() - 0.5) * 8;
      const py = sideY + (this.rand01() - 0.5) * 8;
      const dx = px - cx;
      const dy = py - cy;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 1.5 + this.rand01() * (2.6 + intensity * 0.4);

      this.gameOverCinematic.particles.push({
        x: px,
        y: py,
        vx: (dx / len) * speed + (this.rand01() - 0.5) * 1.25,
        vy: (dy / len) * speed - 0.8 - this.rand01() * 0.7,
        t: life,
        life,
        size: this.rand01() > 0.68 ? 2 : 1,
        kind: this.rand01() > 0.26 ? 0 : 1
      });
    }

    for (let i = 0; i < 18; i++) {
      const life = 18 + ((this.rand01() * 18) | 0);
      this.gameOverCinematic.particles.push({
        x: cx + (this.rand01() - 0.5) * chunk.w * 0.8,
        y: cy + (this.rand01() - 0.5) * chunk.h * 0.8,
        vx: (this.rand01() - 0.5) * 1.1,
        vy: -0.4 - this.rand01() * 1.2,
        t: life,
        life,
        size: 1,
        kind: 2
      });
    }

    if (this.gameOverCinematic.particles.length > 260) {
      this.gameOverCinematic.particles.splice(0, this.gameOverCinematic.particles.length - 260);
    }
  }

  updateGameOverCinematic() {
    const cinematic = this.gameOverCinematic;
    if (!cinematic.active) return;

    cinematic.frame++;
    if (cinematic.shake > 0) cinematic.shake *= 0.84;

    if (cinematic.impactIndex + 1 < cinematic.chunks.length && cinematic.frame >= cinematic.nextImpactFrame) {
      cinematic.impactIndex++;
      const index = cinematic.impactIndex;
      const chunk = cinematic.chunks[index];
      chunk.impacted = 1;
      chunk.impactFrame = cinematic.frame;

      this.spawnGameOverImpactParticles(chunk, 1 + index * 0.25);
      cinematic.shake = Math.max(cinematic.shake, 8 - index);
      cinematic.nextImpactFrame = cinematic.frame + 9;

      this.audio.gameOverImpact(index);
    }

    for (let i = 0; i < cinematic.particles.length; i++) {
      const p = cinematic.particles[i];
      if (p.t-- <= 0) { p.dead = 1; continue; }
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 0.14;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > CANVAS_H + 8) p.dead = 1;
    }
    cinematic.particles = cinematic.particles.filter((p) => !p.dead);

    const doneFrame = cinematic.nextImpactFrame + cinematic.holdFrames;
    if (!cinematic.awaitingInput && cinematic.impactIndex >= cinematic.chunks.length - 1 && cinematic.frame >= doneFrame) {
      cinematic.awaitingInput = 1;
      cinematic.shake = Math.max(cinematic.shake, 1.5);
    }

    if (cinematic.impactIndex >= cinematic.chunks.length - 1) {
      if (cinematic.systemFailureFrame < 0) cinematic.systemFailureFrame = cinematic.frame;
      const fireStartFrame = cinematic.systemFailureFrame + cinematic.fireStartDelayFrames;
      cinematic.fireActive = cinematic.frame >= fireStartFrame;
      if (cinematic.fireActive) this.updateGameOverWaitingFire();
    }

    if (cinematic.awaitingInput && cinematic.proceed) {
      cinematic.active = 0;
      cinematic.awaitingInput = 0;
      cinematic.proceed = 0;
      cinematic.shake = 0;
      cinematic.particles = [];
      cinematic.fireParticles = [];
      this.finalizeGameOverReset();
    }
  }

  finalizeGameOverReset() {
    this.titleCurrentScore = Math.max(0, this.score | 0);
    this.updateHighScore(this.titleCurrentScore);
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.nextExtraLifeCoins = 200;
    this.paladinUnlocked = 0;
    this.glitchrunnerUnlocked = 0;
    this.shadowrunnerUnlocked = 0;
    this.skeletonUnlocked = 0;
    this.characterIndex = 0;
    this.loadLevel(0);
    this.levelNameBanner = 0;
    this.gameState = "TITLE";
    this.titleScreen.mode = "main";
    this.titleScreen.selected = 0;
    this.titleScreen.optionSelected = 0;
    this.titleScreen.levelSelectIndex = 0;
    this.titleScreen.hasContinue = 0;
    this.titleScreen.fireParticles = [];
    this.titleScreen.fireTick = 0;
    this.titleScreen.reentryStingPending = 1;
    this.titleScreen.logoPulseFrames = 0;
    this.audio.playTheme("JUKEBOX_NEON_COASTLINE", { fadeInMs: 260, crossFadeMs: 260 });
    this.resetTitleDemoRunner(1);
  }

  currentPlayerSpriteRows() {
    const p = this.player;
    if (!p) return null;

    const name = CHARACTERS[this.characterIndex].name;
    const running = Math.abs(p.vx) > 0.2 && p.onGround;
    const alt = ((p.anim >> 4) & 1);

    if (name === "SKELETON") {
      const top = running ? (alt ? SPRITES.playerSkeletonTopRun : SPRITES.playerSkeletonTopIdle) : SPRITES.playerSkeletonTopIdle;
      const bot = running ? (alt ? SPRITES.playerSkeletonBottomRun : SPRITES.playerSkeletonBottomIdle) : SPRITES.playerSkeletonBottomIdle;
      return top.concat(bot);
    }

    if (name === "DUCK") {
      const spr = p.quackFrame ? SPRITES.playerDuckQuack : (running ? (alt ? SPRITES.playerDuckRun : SPRITES.playerDuckIdle) : SPRITES.playerDuckIdle);
      return spr;
    }

    const anim = CHARACTERS[this.characterIndex].anim;
    const spr = running ? (alt ? SPRITES[anim[1]] : SPRITES[anim[0]]) : SPRITES[anim[0]];
    return spr;
  }

  startEnemyDeath(reset) {
    if (this.deathTimer > 0) return;
    if (this.immortalMode && !reset) return;

    const p = this.player;
    const rows = this.currentPlayerSpriteRows();
    this.playerShatter = [];

    const cfg = ENEMY_DEATH_SHATTER;
    const chunk = cfg.chunkSizeMin + ((this.rand01() * (cfg.chunkSizeMax - cfg.chunkSizeMin + 1)) | 0);
    const deathFrames = cfg.deathFramesMin + ((this.rand01() * (cfg.deathFramesMax - cfg.deathFramesMin + 1)) | 0);
    const burstScale = 0.9 + this.rand01() * 0.35;
    const liftScale = 0.85 + this.rand01() * 0.45;

    if (p && rows && rows.length) {
      const centerX = p.x + p.w * 0.5;
      const centerY = p.y + p.h * 0.5;

      for (let sy = 0; sy < rows.length; sy += chunk) {
        for (let sx = 0; sx < rows[0].length; sx += chunk) {
          const pixels = [];
          for (let yy = 0; yy < chunk; yy++) {
            const row = rows[sy + yy];
            if (!row) continue;
            for (let xx = 0; xx < chunk; xx++) {
              const ch = row[sx + xx];
              if (!ch || ch === ".") continue;
              pixels.push({ dx: xx, dy: yy, col: PALETTE[ch] || "#fff" });
            }
          }

          if (!pixels.length) continue;

          const pieceX = p.x + sx;
          const pieceY = p.y + sy;
          const localCx = pieceX + chunk * 0.5;
          const localCy = pieceY + chunk * 0.5;
          let dx = localCx - centerX;
          let dy = localCy - centerY;
          const len = Math.hypot(dx, dy) || 1;
          dx /= len;
          dy /= len;

          const speed = (cfg.burstSpeedMin + this.rand01() * (cfg.burstSpeedMax - cfg.burstSpeedMin)) * burstScale;
          const lift = (cfg.upwardLiftMin + this.rand01() * (cfg.upwardLiftMax - cfg.upwardLiftMin)) * liftScale;
          const life = cfg.pieceLifeMin + ((this.rand01() * (cfg.pieceLifeMax - cfg.pieceLifeMin + 1)) | 0);
          this.playerShatter.push({
            x: pieceX,
            y: pieceY,
            vx: dx * speed + (this.rand01() - 0.5) * cfg.lateralJitter,
            vy: dy * speed - lift,
            t: life,
            life,
            pixels
          });
        }
      }
    }

    this.deathReset = reset;
    this.deathTimer = deathFrames;
    this.audio.tone(120, 0.10);
  }

  startLavaDeath(reset) {
    if (this.deathTimer > 0) return;
    if (this.immortalMode && !reset) return;

    const p = this.player;
    if (!p) return this.die(reset);

    this.playerShatter = [];
    const cfg = LAVA_DEATH_FIRE;

    for (let i = 0; i < cfg.particleCount; i++) {
      const life = cfg.lifeMin + ((this.rand01() * (cfg.lifeMax - cfg.lifeMin + 1)) | 0);
      const rise = cfg.riseSpeedMin + this.rand01() * (cfg.riseSpeedMax - cfg.riseSpeedMin);
      const roll = this.rand01();
      const size = this.rand01() > 0.7 ? 2 : 1;

      this.playerShatter.push({
        kind: "fire",
        x: p.x + this.rand01() * p.w,
        y: p.y + p.h * (0.45 + this.rand01() * 0.55),
        vx: (this.rand01() - 0.5) * cfg.lateralBurst,
        vy: -rise,
        t: life,
        life,
        size,
        heat: roll > 0.6 ? 2 : roll > 0.25 ? 1 : 0
      });
    }

    this.deathReset = reset;
    this.deathTimer = cfg.deathFrames;
    this.audio.tone(170, 0.05, 0.00, "sawtooth");
    this.audio.tone(140, 0.08, 0.05, "triangle");
    this.audio.tone(110, 0.09, 0.12, "square", 0.05);
  }

  updatePlayerShatter() {
    const physics = PHYSICS_BY_THEME[getThemeForLevel(this.levelIndex)] || PHYSICS_BY_THEME[DEFAULT_THEME];
    const gr = physics.gravity;
    const cfg = ENEMY_DEATH_SHATTER;
    const lava = LAVA_DEATH_FIRE;

    for (let i = 0; i < this.playerShatter.length; i++) {
      const part = this.playerShatter[i];
      if (part.t-- <= 0) { part.dead = 1; continue; }
      if (part.kind === "fire") {
        part.vy += lava.gravity;
        part.vx = part.vx * lava.drag + (this.rand01() - 0.5) * lava.jitter;
      } else {
        part.vy += gr * cfg.gravityMul;
        part.vx *= cfg.drag;
      }
      part.x += part.vx;
      part.y += part.vy;
    }

    this.playerShatter = this.playerShatter.filter(p => !p.dead);
  }

  drawPlayerShatter() {
    for (let i = 0; i < this.playerShatter.length; i++) {
      const part = this.playerShatter[i];
      gfx.globalAlpha = part.life ? part.t / part.life : 1;
      if (part.kind === "fire") {
        const heat = part.life ? (part.t / part.life) : 0;
        gfx.fillStyle = heat > 0.66 ? PALETTE.F : heat > 0.33 ? PALETTE.K : (part.heat ? PALETTE.C : PALETTE.J);
        const s = part.size || 1;
        gfx.fillRect((part.x - this.cameraX) | 0, (part.y - this.cameraY) | 0, s, s);
      } else {
        for (let j = 0; j < part.pixels.length; j++) {
          const px = part.pixels[j];
          gfx.fillStyle = px.col;
          gfx.fillRect(((part.x + px.dx) - this.cameraX) | 0, ((part.y + px.dy) - this.cameraY) | 0, 1, 1);
        }
      }
    }
    gfx.globalAlpha = 1;
  }

  win() {
    this.audio.tone(980, 0.10);
    if (this.levelDeaths === 0) {
      const flawlessBonus = 1500 + Math.min(1000, this.levelKillCount * 20);
      this.addScore(flawlessBonus);
      this.teleportNotice = "FLAWLESS +" + flawlessBonus + " SCORE";
      this.teleportNoticeTimer = 120;
      this.audio.tone(1280, 0.06, 0.00, "triangle", 0.04);
      this.audio.tone(1580, 0.06, 0.04, "sine", 0.035);
    }
    const nextIndex = this.levelIndex + 1;
    if (nextIndex < LEVELS.length && LEVEL_THEMES[nextIndex] === "SIMBREACH" && !this.glitchrunnerUnlocked) {
      this.glitchrunnerUnlocked = 1;
      this.teleportNotice = "GLITCHRUNNER UNLOCKED: PHASE DASH";
      this.teleportNoticeTimer = 150;
    }
    if (nextIndex < LEVELS.length && LEVEL_THEMES[nextIndex] === "SIMBREACH" && !this.shadowrunnerUnlocked) {
      this.shadowrunnerUnlocked = 1;
      this.teleportNotice = "SHADOWRUNNER UNLOCKED: HACKER SKILLS";
      this.teleportNoticeTimer = 150;
    }
    if (nextIndex < LEVELS.length && LEVEL_THEMES[nextIndex] === "BONECRYPT" && !this.skeletonUnlocked) {
      this.skeletonUnlocked = 1;
      this.teleportNotice = "SKELETON UNLOCKED: BLOOD BURST";
      this.teleportNoticeTimer = 150;
    }
    if (this.levelIndex === LEVELS.length - 1) {
      this.loadLevel(0);
    } else {
      this.loadLevel(nextIndex);
    }
  }

  addScore(v) {
    this.score += v;
    this.updateHighScore(this.score);
  }

  drawTitleScoreMessages() {
    const t = this.titleScreen;
    if (t.scoreTagTimer >= t.scoreTagVisibleFrames) return;
    const frame = t.frame | 0;
    const cur = Math.max(0, this.titleCurrentScore | 0);
    const hi = Math.max(0, this.highScore | 0);

    const drawTag = (baseX, baseY, label, value, hueA, hueB, phase) => {
      const bobX = Math.sin(frame * 0.028 + phase) * 2.2;
      const bobY = Math.sin(frame * 0.021 + phase * 1.7) * 1.8;
      const pulse = 0.12 + ((Math.sin(frame * 0.04 + phase) + 1) * 0.5) * 0.12;
      const x = baseX + bobX;
      const y = baseY + bobY;
      const w = 106;
      const h = 15;

      gfx.globalAlpha = 0.24;
      gfx.fillStyle = "#000";
      gfx.fillRect((x + 1) | 0, (y + 1) | 0, w, h);

      gfx.globalAlpha = 0.22 + pulse;
      gfx.fillStyle = hueA;
      gfx.fillRect(x | 0, y | 0, w, h);

      gfx.globalAlpha = 0.22 + pulse * 0.8;
      gfx.fillStyle = hueB;
      const scanW = 18;
      const scanX = x + ((frame * 1.3 + phase * 23) % (w + scanW)) - scanW;
      gfx.fillRect(scanX | 0, y | 0, scanW, h);

      gfx.globalAlpha = 0.78;
      gfx.font = "9px monospace";
      gfx.fillStyle = "#e8fff4";
      gfx.fillText(label + " " + value, (x + 6) | 0, (y + 10) | 0);
    };

    drawTag(8, 20, "CUR", cur, "#1a2a24", "#3aa57e", 0.0);
    drawTag(CANVAS_W - 114, 20, "HI", hi, "#1f1b2e", "#7a54c7", 2.7);
    gfx.globalAlpha = 1;
  }

  addCoins(v) {
    this.coins = Math.max(0, (this.coins | 0) + (v | 0));
    while (this.coins >= this.nextExtraLifeCoins) {
      this.lives++;
      this.nextExtraLifeCoins += 200;
      this.audio.extraLifeJingle();
    }
  }

  scoreForEnemyType(type) {
    if (type === 0) return 100;
    if (type === 1) return 140;
    if (type === 2) return 180;
    if (type === 3) return 220;
    if (type === 4) return 320;
    if (type === 5) return 700;
    if (type === 6) return 260;
    if (type === 7) return 380;
    if (type === 8) return 450;
    if (type === 9) return 900;
    return 0;
  }

  collectTileReward(tileId, cx, cy) {
    if (tileId === 2) {
      this.addCoins(1);
      this.audio.tone(740, 0.03);
    } else if (tileId === 13) {
      this.addCoins(20);
      this.audio.tone(980, 0.05, 0.00, "triangle", 0.04);
      this.audio.tone(1280, 0.06, 0.04, "sine", 0.035);
      this.spawnRelicPickupBurst(cx, cy);
    } else if (tileId === 5) {
      this.addCoins(10);
      this.audio.tone(1040, 0.05);
    } else if (tileId === 6) {
      this.lives++;
      this.audio.extraLifeJingle();
      this.audio.oneUpBurstSparkle();
      this.spawnOneUpRadialBurst(cx, cy);
    } else if (tileId === 14) {
      this.activateBatCompanion();
    } else if (tileId === 15) {
      this.activateConductorCore();
    }
  }

  hasConductorCoreActive() {
    return !!(this.conductorCore && this.conductorCore.active && this.conductorCore.timer > 0);
  }

  pickupMagnetStrengthMultiplier() {
    let mul = 1;
    if (this.hasConductorCoreActive()) mul += 0.35;
    if (this.robotPulse && this.robotPulse.timer > 0) mul += 0.25;
    return Math.min(CONDUCTOR_CORE.robotStackCapMul, mul);
  }

  activateConductorCore() {
    if (this.conductorCore.cooldown > 0 && !this.conductorCore.active) {
      this.audio.tone(380, 0.04, 0.00, "square", 0.03);
      return;
    }
    this.conductorCore.active = 1;
    this.conductorCore.timer = CONDUCTOR_CORE.durationFrames;
    this.conductorCore.cooldown = CONDUCTOR_CORE.durationFrames + CONDUCTOR_CORE.cooldownFrames;
    this.conductorCore.notice = CONDUCTOR_CORE.noticeFrames;
    this.conductorCore.pulse = CONDUCTOR_CORE.pulseFrames;
    this.audio.tone(680, 0.05, 0.00, "triangle", 0.04);
    this.audio.tone(980, 0.06, 0.03, "sine", 0.04);
    this.audio.tone(1220, 0.07, 0.08, "triangle", 0.03);
  }

  updateConductorCore() {
    if (this.conductorCore.cooldown > 0) this.conductorCore.cooldown--;
    if (this.conductorCore.notice > 0) this.conductorCore.notice--;
    if (this.conductorCore.pulse > 0) this.conductorCore.pulse--;
    if (!this.hasConductorCoreActive() || !this.player) {
      this.conductorCore.active = 0;
      return;
    }

    const p = this.player;
    this.conductorCore.timer--;
    if (this.conductorCore.timer <= 0) {
      this.conductorCore.active = 0;
      this.conductorCore.timer = 0;
      this.audio.tone(360, 0.04, 0.00, "triangle", 0.03);
      return;
    }

    const cx = p.x + p.w * 0.5;
    const cy = p.y + p.h * 0.5;
    const radius = CONDUCTOR_CORE.magnetRadius;
    const accel = CONDUCTOR_CORE.magnetPullAccel;

    for (let i = 0; i < this.coinDrops.length; i++) {
      const d = this.coinDrops[i];
      if (d.dead) continue;
      const dx = cx - (d.x + d.w * 0.5);
      const dy = cy - (d.y + d.h * 0.5);
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > radius) continue;
      const pull = (1 - (dist / radius)) * accel;
      d.vx += (dx / dist) * pull;
      d.vy += (dy / dist) * pull - 0.02;
      if (dist <= ROBOT_MAGNET_PULSE.pickupCollectRadius + 1) {
        d.dead = 1;
        this.addCoins(1);
        this.audio.tone(760, 0.02);
      }
    }

    const minTx = Math.max(0, ((cx - radius) / TILE_SIZE) | 0);
    const maxTx = Math.min(this.tileCols - 1, ((cx + radius) / TILE_SIZE) | 0);
    const minTy = Math.max(0, ((cy - radius) / TILE_SIZE) | 0);
    const maxTy = Math.min(this.tileRows - 1, ((cy + radius) / TILE_SIZE) | 0);

    for (let y = minTy; y <= maxTy; y++) {
      for (let x = minTx; x <= maxTx; x++) {
        const id = this.tileIdAt(x, y);
        if (id !== 2 && id !== 5 && id !== 6 && id !== 13 && id !== 14 && id !== 15) continue;
        const tx = x * TILE_SIZE + TILE_SIZE * 0.5;
        const ty = y * TILE_SIZE + TILE_SIZE * 0.5;
        if (Math.hypot(cx - tx, cy - ty) > radius) continue;
        this.setTile(x, y, ".");
        this.spawnMagnetPickup(id, tx, ty);
      }
    }
  }

  spawnCoinDrops(x, y) {
    const n = 10 + ((this.rand01() * 9) | 0);
    for (let i = 0; i < n; i++) {
      const a = this.rand01() * 6.283;
      const v = (this.rand01() * 1.4 + 0.8);
      const ox = (this.rand01() - 0.5) * 10;
      const oy = this.rand01() * 4;
      this.coinDrops.push({ x: x + ox, y: y - 12 - oy, vx: Math.cos(a) * v, vy: -2.8 - this.rand01() * 1.3, w: 10, h: 10, onGround: 0, t: 260, collectDelay: 10 });
    }
  }

  spawnMagnetPickup(tileId, cx, cy) {
    this.magnetItems.push({
      tileId,
      x: cx - 5,
      y: cy - 5,
      w: 10,
      h: 10,
      vx: (this.rand01() - 0.5) * 0.7,
      vy: (this.rand01() - 0.5) * 0.7,
      t: 120
    });
  }

  collectMagnetPickup(item) {
    const cx = item.x + item.w * 0.5;
    const cy = item.y + item.h * 0.5;
    this.collectTileReward(item.tileId, cx, cy);
    item.dead = 1;
  }

  spawnOneUpRadialBurst(x, y) {
    const cfg = ONEUP_RADIAL_BURST;
    const burst = {
      x,
      y,
      ringT: cfg.ringLife,
      ringLife: cfg.ringLife,
      particles: []
    };

    for (let i = 0; i < cfg.particleCount; i++) {
      const angle = (i / cfg.particleCount) * 6.283 + (this.rand01() - 0.5) * 0.2;
      const speed = cfg.particleSpeedMin + this.rand01() * (cfg.particleSpeedMax - cfg.particleSpeedMin);
      const life = cfg.particleLifeMin + ((this.rand01() * (cfg.particleLifeMax - cfg.particleLifeMin + 1)) | 0);
      burst.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        t: life,
        life,
        col: this.rand01() > 0.4 ? PALETTE.F : PALETTE.H
      });
    }

    this.oneupBursts.push(burst);
  }

  spawnRelicPickupBurst(x, y) {
    const cfg = RELIC_PICKUP_FX;
    const theme = getThemeForLevel(this.levelIndex);
    const gothic = theme === "GOTHIC";
    const primary = gothic ? "#bda9ff" : PALETTE.F;
    const secondary = gothic ? "#76e6ff" : PALETTE.H;
    const burst = {
      x,
      y,
      ringT: cfg.ringLife,
      ringLife: cfg.ringLife,
      primary,
      secondary,
      particles: []
    };

    for (let i = 0; i < cfg.particleCount; i++) {
      const angle = (i / cfg.particleCount) * 6.283 + (this.rand01() - 0.5) * 0.22;
      const speed = cfg.particleSpeedMin + this.rand01() * (cfg.particleSpeedMax - cfg.particleSpeedMin);
      const life = cfg.particleLifeMin + ((this.rand01() * (cfg.particleLifeMax - cfg.particleLifeMin + 1)) | 0);
      burst.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        t: life,
        life,
        col: this.rand01() > 0.45 ? primary : secondary
      });
    }

    this.relicBursts.push(burst);
    this.relicFloatTexts.push({
      text: "+20",
      x,
      y: y - 6,
      vy: -0.36,
      t: cfg.floatLife,
      life: cfg.floatLife,
      col: primary,
      glow: secondary
    });
    this.relicFlash = Math.max(this.relicFlash, cfg.flashFrames);
  }

  spawnOneUpNear(x, y) {
    this.magnetItems.push({
      tileId: 6,
      x: x - 5 + (this.rand01() - 0.5) * 8,
      y: y - 9 + (this.rand01() - 0.5) * 6,
      w: 10,
      h: 10,
      vx: (this.rand01() - 0.5) * 0.5,
      vy: -0.4 - this.rand01() * 0.35,
      t: 220
    });
    this.spawnOneUpRadialBurst(x, y);
    this.audio.tone(980, 0.05, 0.00, "triangle", 0.03);
  }

  handleSpecialEnemyDefeat(enemy) {
    if (!enemy || enemy.__scoreApplied) return;
    enemy.__scoreApplied = 1;
    const scoreGain = this.scoreForEnemyType(enemy.type | 0);
    if (scoreGain > 0) {
      this.addScore(scoreGain);
      this.levelKillCount++;
      const typeId = enemy.type | 0;
      this.levelKillsByType[typeId] = (this.levelKillsByType[typeId] || 0) + 1;
    }
    if (enemy.type !== 5) return;
    const x = enemy.x + enemy.w * 0.5;
    const y = enemy.y + enemy.h * 0.5;
    this.spawnOneUpNear(x, y);
  }

  respawnVampires() {
    if (!this.vampireSpawnPoints || !this.vampireSpawnPoints.length) return;
    this.enemies = this.enemies.filter(e => e.type !== 4 && e.type !== 5);
    for (let i = 0; i < this.vampireSpawnPoints.length; i++) {
      const s = this.vampireSpawnPoints[i];
      const size = s.type === 5 ? 35 : 14;
      const px = s.tx * TILE_SIZE;
      const py = s.ty * TILE_SIZE;
      this.enemies.push({
        type: s.type,
        x: px,
        y: py,
        baseX: px,
        baseY: py,
        vx: 0,
        vy: 0,
        w: size,
        h: size,
        dir: (s.tx & 1) ? 1 : -1,
        onGround: 0,
        dead: 0,
        anim: 0,
        phase: ((s.tx * 17 + s.ty * 11) % 628) * 0.01,
        variant: ((s.tx * 7 + s.ty * 11 + s.type * 5) & 1)
      });
    }
  }

  tryActivateCharacterSkill() {
    if (!this.player || this.deathTimer > 0) return;
    const name = CHARACTERS[this.characterIndex].name;
    if (name === "ROBOT") this.tryActivateRobotPulse();
    else if (name === "DUCK") this.tryActivateDuckGaleDive();
    else if (name === "BUNNY") this.tryActivateBunnyCarrotRocket();
    else if (name === "RANGER") this.tryActivateRangerGrapple();
    else if (name === "PALADIN") this.tryActivatePaladinAegisDash();
    else if (name === "NINJA") this.tryActivateNinjaShadowStep();
    else if (name === "GLITCHRUNNER") this.tryActivateGlitchrunnerPhaseDash();
    else if (name === "SHADOWRUNNER") this.tryActivateGlitchrunnerForkBomb();
    else if (name === "SKELETON") this.tryActivateSkeletonBloodBurst();
  }

  tryActivateCharacterAltSkill1() {
    if (!this.player || this.deathTimer > 0) return;
    if (CHARACTERS[this.characterIndex].name === "SHADOWRUNNER") this.tryActivateGlitchrunnerZeroDaySpike();
  }

  tryActivateCharacterAltSkill2() {
    if (!this.player || this.deathTimer > 0) return;
    if (CHARACTERS[this.characterIndex].name === "SHADOWRUNNER") this.tryActivateGlitchrunnerRootkitSwarm();
  }

  tryActivateGlitchrunnerPhaseDash() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "GLITCHRUNNER") return;
    if (this.glitchPhase.active || this.glitchPhase.cooldown > 0) return;

    this.glitchPhase.active = 1;
    this.glitchPhase.timer = GLITCHRUNNER_PHASE.dashFrames;
    this.glitchPhase.cooldown = GLITCHRUNNER_PHASE.cooldownFrames;
    this.glitchPhase.afterglow = GLITCHRUNNER_PHASE.afterglowFrames;
    this.glitchPhase.dir = this.player.face >= 0 ? 1 : -1;
    this.player.vy = Math.min(this.player.vy, -0.8);
    this.player.onGround = 0;

    this.audio.tone(760, 0.03, 0.00, "triangle", 0.04);
    this.audio.tone(980, 0.04, 0.03, "sine", 0.035);
  }

  tryActivateGlitchrunnerForkBomb() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "SHADOWRUNNER") return;
    if (this.hackerSkill.globalLock > 0) return;
    if (this.hackerSkill.fork.cooldown > 0) return;

    const p = this.player;
    const cfg = HACKER_SKILLS.forkBomb;
    const cx = p.x + p.w * 0.5;
    const cy = p.y + p.h * 0.45;
    const dir = p.face >= 0 ? 1 : -1;

    this.hackerSkill.fork.cooldown = cfg.cooldownFrames;
    this.hackerSkill.globalLock = HACKER_SKILLS.globalLockFrames;

    for (let i = 0; i < cfg.packetCount; i++) {
      const spread = (i - (cfg.packetCount - 1) * 0.5) * 0.22;
      this.hackerSkill.fork.packets.push({
        x: cx,
        y: cy,
        vx: dir * (cfg.speed * 0.75),
        vy: spread,
        t: cfg.lifeFrames,
        chains: cfg.chainCount,
        targetId: -1,
        dead: 0
      });
    }

    this.audio.tone(620, 0.03, 0.00, "triangle", 0.05);
    this.audio.tone(880, 0.04, 0.03, "sine", 0.04);
    this.audio.tone(1120, 0.03, 0.06, "triangle", 0.035);
  }

  tryActivateGlitchrunnerZeroDaySpike() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "SHADOWRUNNER") return;
    if (this.hackerSkill.globalLock > 0) return;
    if (this.hackerSkill.spike.cooldown > 0) return;

    const cfg = HACKER_SKILLS.zeroDaySpike;
    const p = this.player;
    const dir = p.face >= 0 ? 1 : -1;
    const cx = p.x + p.w * 0.5;
    const cy = p.y + p.h * 0.5;
    const range = cfg.rangeTiles * TILE_SIZE;

    const x0 = dir > 0 ? cx : (cx - range);
    const x1 = dir > 0 ? (cx + range) : cx;
    const y0 = cy - cfg.height * 0.5;
    const y1 = cy + cfg.height * 0.5;

    this.hackerSkill.spike.cooldown = cfg.cooldownFrames;
    this.hackerSkill.globalLock = HACKER_SKILLS.globalLockFrames;
    this.hackerSkill.spike.flash = cfg.flashFrames;
    this.hackerSkill.spike.x0 = x0;
    this.hackerSkill.spike.x1 = x1;
    this.hackerSkill.spike.y0 = y0;
    this.hackerSkill.spike.y1 = y1;

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      const ex = enemy.x + enemy.w * 0.5;
      const ey = enemy.y + enemy.h * 0.5;
      if (ex >= x0 && ex <= x1 && ey >= y0 && ey <= y1) {
        this.handleSpecialEnemyDefeat(enemy);
        enemy.dead = 1;
        this.spawnEnemyShatter(enemy, getThemeForLevel(this.levelIndex));
        this.spawnCoinDrops(enemy.x + 2, enemy.y + 2);
      }
    }

    this.audio.tone(540, 0.03, 0.00, "square", 0.05);
    this.audio.tone(740, 0.04, 0.03, "triangle", 0.04);
    this.audio.tone(980, 0.03, 0.05, "sine", 0.035);
  }

  tryActivateGlitchrunnerRootkitSwarm() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "SHADOWRUNNER") return;
    if (this.hackerSkill.globalLock > 0) return;
    if (this.hackerSkill.swarm.active) return;
    if (this.hackerSkill.swarm.cooldown > 0) return;

    const cfg = HACKER_SKILLS.rootkitSwarm;
    this.hackerSkill.swarm.active = 1;
    this.hackerSkill.swarm.timer = cfg.durationFrames;
    this.hackerSkill.swarm.cooldown = cfg.cooldownFrames;
    this.hackerSkill.swarm.angle = 0;
    this.hackerSkill.globalLock = HACKER_SKILLS.globalLockFrames;

    this.audio.tone(500, 0.03, 0.00, "triangle", 0.04);
    this.audio.tone(690, 0.04, 0.03, "sine", 0.04);
    this.audio.tone(910, 0.04, 0.06, "triangle", 0.03);
  }

  updateGlitchrunnerPhase(name) {
    if (this.glitchPhase.cooldown > 0) this.glitchPhase.cooldown--;
    if (this.glitchPhase.afterglow > 0) this.glitchPhase.afterglow--;
    if (this.glitchPhase.echoCooldown > 0) this.glitchPhase.echoCooldown--;
    else this.glitchPhase.echoReady = 1;
    if (this.glitchPhase.echoPulse > 0) this.glitchPhase.echoPulse--;

    if (name === "GLITCHRUNNER" && this.player) {
      if (this.glitchPhase.active) {
        if (this.glitchPhase.trailTick <= 0) {
          const p = this.player;
          this.glitchPhase.trail.push({
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            t: GLITCHRUNNER_PHASE.afterglowFrames,
            life: GLITCHRUNNER_PHASE.afterglowFrames
          });
          this.glitchPhase.trailTick = GLITCHRUNNER_PHASE.trailSpawnEvery;
        } else {
          this.glitchPhase.trailTick--;
        }

        this.glitchPhase.timer--;
        if (this.glitchPhase.timer <= 0) {
          this.glitchPhase.active = 0;
          this.glitchPhase.timer = 0;
        }
      }

      for (let i = 0; i < this.glitchPhase.trail.length; i++) {
        this.glitchPhase.trail[i].t--;
      }
      this.glitchPhase.trail = this.glitchPhase.trail.filter(g => g.t > 0);
    } else {
      this.glitchPhase.active = 0;
      this.glitchPhase.timer = 0;
      this.glitchPhase.trailTick = 0;
      this.glitchPhase.trail = [];
    }

    if (this.hackerSkill.globalLock > 0) this.hackerSkill.globalLock--;
    if (this.hackerSkill.fork.cooldown > 0) this.hackerSkill.fork.cooldown--;
    if (this.hackerSkill.spike.cooldown > 0) this.hackerSkill.spike.cooldown--;
    if (this.hackerSkill.spike.flash > 0) this.hackerSkill.spike.flash--;
    if (this.hackerSkill.swarm.cooldown > 0) this.hackerSkill.swarm.cooldown--;

    const isShadowrunner = name === "SHADOWRUNNER" && !!this.player;
    if (!isShadowrunner) {
      this.hackerSkill.fork.packets = [];
      this.hackerSkill.swarm.active = 0;
      this.hackerSkill.swarm.timer = 0;
      return;
    }

    const levelTheme = getThemeForLevel(this.levelIndex);
    const forkCfg = HACKER_SKILLS.forkBomb;
    for (let i = 0; i < this.hackerSkill.fork.packets.length; i++) {
      const packet = this.hackerSkill.fork.packets[i];
      if (packet.t-- <= 0) { packet.dead = 1; continue; }

      let target = null;
      let bestD = 1e9;
      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];
        if (!enemy || enemy.dead) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        const dist = Math.hypot(ex - packet.x, ey - packet.y);
        if (dist < bestD) {
          bestD = dist;
          target = enemy;
        }
      }

      if (target) {
        const tx = target.x + target.w * 0.5;
        const ty = target.y + target.h * 0.5;
        const dx = tx - packet.x;
        const dy = ty - packet.y;
        const dist = Math.hypot(dx, dy) || 1;
        packet.vx = packet.vx * forkCfg.turnDrag + (dx / dist) * forkCfg.homingAccel;
        packet.vy = packet.vy * forkCfg.turnDrag + (dy / dist) * forkCfg.homingAccel;
      }

      const speed = Math.hypot(packet.vx, packet.vy) || 1;
      if (speed > forkCfg.speed) {
        const m = forkCfg.speed / speed;
        packet.vx *= m;
        packet.vy *= m;
      }

      packet.x += packet.vx;
      packet.y += packet.vy;

      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];
        if (!enemy || enemy.dead) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - packet.x, ey - packet.y) <= forkCfg.hitRadius) {
          this.handleSpecialEnemyDefeat(enemy);
          enemy.dead = 1;
          this.spawnEnemyShatter(enemy, levelTheme);
          this.spawnCoinDrops(enemy.x + 2, enemy.y + 2);
          if (packet.chains > 0) {
            packet.chains--;
            packet.t = Math.max(packet.t, 12);
          } else {
            packet.dead = 1;
          }
          break;
        }
      }
    }
    this.hackerSkill.fork.packets = this.hackerSkill.fork.packets.filter(p => !p.dead);

    if (this.hackerSkill.swarm.active) {
      const swarm = this.hackerSkill.swarm;
      const swarmCfg = HACKER_SKILLS.rootkitSwarm;
      const p = this.player;
      swarm.angle += swarmCfg.orbitSpeed;
      const cx = p.x + p.w * 0.5;
      const cy = p.y + p.h * 0.45;
      swarm.x = cx + Math.cos(swarm.angle) * swarmCfg.orbitRadius;
      swarm.y = cy + Math.sin(swarm.angle) * (swarmCfg.orbitRadius * 0.65);

      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (!enemy || enemy.dead) continue;
        enemy.rootkitHitCd = Math.max(0, (enemy.rootkitHitCd | 0) - 1);
        if (enemy.rootkitHitCd > 0) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - swarm.x, ey - swarm.y) <= swarmCfg.hitRadius + Math.min(enemy.w, enemy.h) * 0.35) {
          enemy.rootkitHitCd = swarmCfg.hitCooldownFrames;
          this.handleSpecialEnemyDefeat(enemy);
          enemy.dead = 1;
          this.spawnEnemyShatter(enemy, levelTheme);
          this.spawnCoinDrops(enemy.x + 2, enemy.y + 2);
        }
      }

      if (swarm.timer > 0) swarm.timer--;
      if (swarm.timer <= 0) swarm.active = 0;
    }
  }

  tryConsumeGlitchrunnerEchoShield(sourceX, sourceY) {
    if (!this.player) return 0;
    if (CHARACTERS[this.characterIndex].name !== "GLITCHRUNNER") return 0;
    if (!this.glitchPhase.echoReady) return 0;
    this.glitchPhase.echoReady = 0;
    this.glitchPhase.echoCooldown = GLITCHRUNNER_PHASE.echoRechargeFrames;
    this.glitchPhase.echoPulse = GLITCHRUNNER_PHASE.echoFlashFrames;
    this.glitchPhase.echoX = sourceX;
    this.glitchPhase.echoY = sourceY;
    this.respawnGrace = Math.max(this.respawnGrace, 22);
    this.audio.tone(760, 0.03, 0.00, "triangle", 0.03);
    this.audio.tone(1020, 0.04, 0.02, "sine", 0.03);
    return 1;
  }

  activateBatCompanion() {
    if (!this.player) return;
    this.batCompanion.active = 1;
    this.batCompanion.timer = BAT_COMPANION.durationFrames;
    this.batCompanion.angle = 0;
    this.batCompanion.shimmer = BAT_COMPANION.shimmerFrames;
    this.batCompanion.vx = 0;
    this.batCompanion.vy = 0;
    this.batCompanion.trail = [];
    this.batCompanion.trailTick = 0;
    this.batCompanion.coinDropTimer = this.rollFairyCoinDropTimer();
    this.batCompanion.burstT = 0;
    this.batCompanion.burstLife = 0;
    this.batCompanion.pushSfxCooldown = 0;
    this.batCompanion.returningFrames = 0;
    this.batCompanion.x = this.player.x + this.player.w * 0.5;
    this.batCompanion.y = this.player.y + this.player.h * 0.35;
    this.audio.tone(980, 0.06, 0.00, "sine", 0.04);
    this.audio.tone(1320, 0.07, 0.03, "triangle", 0.035);
    this.audio.tone(1660, 0.08, 0.08, "sine", 0.03);
  }

  rollFairyCoinDropTimer() {
    return BAT_COMPANION.coinDropIntervalMin + ((this.rand01() * (BAT_COMPANION.coinDropIntervalMax - BAT_COMPANION.coinDropIntervalMin + 1)) | 0);
  }

  spawnFairyCoinDrop(cx, cy) {
    const count = BAT_COMPANION.coinDropBurstMin + ((this.rand01() * (BAT_COMPANION.coinDropBurstMax - BAT_COMPANION.coinDropBurstMin + 1)) | 0);
    for (let i = 0; i < count; i++) {
      this.coinDrops.push({
        x: cx - 5 + (this.rand01() - 0.5) * 7,
        y: cy - 6,
        vx: (this.rand01() - 0.5) * 0.55,
        vy: -1.15 - this.rand01() * 0.75,
        w: 10,
        h: 10,
        onGround: 0,
        t: 220,
        collectDelay: 20
      });
    }
    this.audio.tone(1180, 0.03, 0.00, "triangle", 0.02);
    this.audio.tone(1440, 0.025, 0.015, "sine", 0.018);
  }

  triggerFairyCompanionExpireBurst(x, y) {
    this.batCompanion.burstX = x;
    this.batCompanion.burstY = y;
    this.batCompanion.burstLife = BAT_COMPANION.expireBurstFrames;
    this.batCompanion.burstT = BAT_COMPANION.expireBurstFrames;
    this.audio.tone(1320, 0.09, 0.00, "sine", 0.045);
    this.audio.tone(1760, 0.08, 0.03, "triangle", 0.035);
    this.audio.tone(2210, 0.06, 0.08, "sine", 0.03);
  }

  tryActivateSkeletonBloodBurst() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "SKELETON") return;
    if (this.skeletonBurst.cooldown > 0) return;

    this.skeletonBurst.cooldown = SKELETON_BLOOD_BURST.cooldownFrames;
    this.skeletonBurst.flash = SKELETON_BLOOD_BURST.flashFrames;
    const phase2 = !!this.skeletonBurst.phase2Charged;
    this.skeletonBurst.lastPhase2 = phase2 ? 1 : 0;
    if (phase2) this.skeletonBurst.phase2Notice = SKELETON_BLOOD_BURST.phaseTwoNoticeFrames;
    this.spawnSkeletonBloodBurst(phase2);
    this.audio.tone(260, 0.06, 0.00, "triangle", 0.05);
    this.audio.tone(380, 0.06, 0.03, "sawtooth", 0.04);
    this.audio.tone(560, 0.07, 0.06, "sine", 0.04);
    if (phase2) {
      this.skeletonBurst.phase2Charged = 0;
      this.skeletonBurst.phase2ChargeFrames = SKELETON_BLOOD_BURST.phaseTwoRechargeFrames;
      this.audio.tone(760, 0.05, 0.02, "triangle", 0.04);
      this.audio.tone(940, 0.06, 0.05, "sine", 0.03);
    }
  }

  spawnSkeletonBloodBurst(phase2) {
    if (!this.player) return;
    const p = this.player;
    const cx = p.x + p.w * 0.5;
    const cy = p.y + p.h * 0.35;
    const shotCount = 6 + (phase2 ? SKELETON_BLOOD_BURST.phaseTwoExtraShots : 0);
    const speedMul = phase2 ? SKELETON_BLOOD_BURST.phaseTwoSpeedMul : 1;
    const radiusMul = phase2 ? SKELETON_BLOOD_BURST.phaseTwoRadiusMul : 1;
    for (let i = 0; i < shotCount; i++) {
      const a = (i / shotCount) * 6.283 + (this.rand01() - 0.5) * 0.18;
      const speed = (SKELETON_BLOOD_BURST.shotSpeedMin + this.rand01() * (SKELETON_BLOOD_BURST.shotSpeedMax - SKELETON_BLOOD_BURST.shotSpeedMin)) * speedMul;
      const life = SKELETON_BLOOD_BURST.shotLifeMin + ((this.rand01() * (SKELETON_BLOOD_BURST.shotLifeMax - SKELETON_BLOOD_BURST.shotLifeMin + 1)) | 0);
      this.skeletonBurstShots.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 0.35,
        t: life,
        life,
        r: SKELETON_BLOOD_BURST.radius * radiusMul,
        phase2: phase2 ? 1 : 0,
        pierce: phase2 ? SKELETON_BLOOD_BURST.phaseTwoPierce : 0,
        dead: 0
      });
    }
    if (this.skeletonBurstShots.length > 80) this.skeletonBurstShots.splice(0, this.skeletonBurstShots.length - 80);
  }

  updateSkeletonBloodBurst(name) {
    if (this.skeletonBurst.cooldown > 0) this.skeletonBurst.cooldown--;
    if (this.skeletonBurst.flash > 0) this.skeletonBurst.flash--;
    if (this.skeletonBurst.phase2Notice > 0) this.skeletonBurst.phase2Notice--;
    const phase2Eligible = this.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold;
    if (!phase2Eligible) {
      this.skeletonBurst.phase2ReadyLatch = 0;
      this.skeletonBurst.phase2Charged = 0;
      this.skeletonBurst.phase2ChargeFrames = 0;
      if (name !== "SKELETON" || !this.player) return;
      return;
    }

    if (!this.skeletonBurst.phase2ReadyLatch) {
      this.skeletonBurst.phase2ReadyLatch = 1;
      if (!this.skeletonBurst.phase2Charged && this.skeletonBurst.phase2ChargeFrames <= 0) {
        this.skeletonBurst.phase2ChargeFrames = SKELETON_BLOOD_BURST.phaseTwoRechargeFrames;
      }
    }

    if (!this.skeletonBurst.phase2Charged && this.skeletonBurst.phase2ChargeFrames > 0) {
      this.skeletonBurst.phase2ChargeFrames--;
      if (this.skeletonBurst.phase2ChargeFrames <= 0) {
        this.skeletonBurst.phase2Charged = 1;
        this.skeletonBurst.phase2Notice = SKELETON_BLOOD_BURST.phaseTwoNoticeFrames;
        this.audio.tone(920, 0.03, 0.00, "triangle", 0.03);
        this.audio.tone(1120, 0.04, 0.03, "sine", 0.03);
      }
    }
    if (name !== "SKELETON" || !this.player) return;
  }

  clearCollectibleTileByBurst(tx, ty) {
    const id = this.tileIdAt(tx, ty);
    if (id !== 2 && id !== 5 && id !== 6 && id !== 13) return 0;
    this.setTile(tx, ty, ".");
    this.spawnCheckpointRain(tx * TILE_SIZE + TILE_SIZE * 0.5, ty * TILE_SIZE + TILE_SIZE * 0.5);
    return 1;
  }

  updateSkeletonBurstShots(gravity, levelTheme) {
    if (!this.skeletonBurstShots.length) return;
    for (let i = 0; i < this.skeletonBurstShots.length; i++) {
      const shot = this.skeletonBurstShots[i];
      if (shot.t-- <= 0) { shot.dead = 1; continue; }
      shot.vy += SKELETON_BLOOD_BURST.gravity;
      shot.x += shot.vx;
      shot.y += shot.vy;

      const tx = (shot.x / TILE_SIZE) | 0;
      const ty = (shot.y / TILE_SIZE) | 0;
      if (this.isSolid(this.tileIdAt(tx, ty))) { shot.dead = 1; continue; }

      const burstRange = shot.phase2 ? 2 : 1;
      for (let gy = ty - burstRange; gy <= ty + burstRange; gy++) {
        for (let gx = tx - burstRange; gx <= tx + burstRange; gx++) {
          this.clearCollectibleTileByBurst(gx, gy);
        }
      }

      for (let j = 0; j < this.coinDrops.length; j++) {
        const drop = this.coinDrops[j];
        if (drop.dead) continue;
        const dx = shot.x - (drop.x + drop.w * 0.5);
        const dy = shot.y - (drop.y + drop.h * 0.5);
        if (Math.hypot(dx, dy) <= shot.r + 4) drop.dead = 1;
      }

      for (let j = 0; j < this.magnetItems.length; j++) {
        const item = this.magnetItems[j];
        if (item.dead) continue;
        if (item.tileId !== 2 && item.tileId !== 5 && item.tileId !== 6 && item.tileId !== 13) continue;
        const dx = shot.x - (item.x + item.w * 0.5);
        const dy = shot.y - (item.y + item.h * 0.5);
        if (Math.hypot(dx, dy) <= shot.r + 5) item.dead = 1;
      }

      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];
        if (!enemy || enemy.dead) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        const hitR = shot.r + Math.max(4, Math.min(enemy.w, enemy.h) * 0.36);
        if (Math.hypot(shot.x - ex, shot.y - ey) <= hitR) {
          this.handleSpecialEnemyDefeat(enemy);
          enemy.dead = 1;
          this.spawnEnemyShatter(enemy, levelTheme);
          this.spawnCoinDrops(enemy.x + 2, enemy.y + 2);
          if (shot.pierce > 0) shot.pierce--;
          else shot.dead = 1;
          break;
        }
      }
    }
    this.skeletonBurstShots = this.skeletonBurstShots.filter(s => !s.dead);
  }

  tryActivatePaladinAegisDash() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "PALADIN") return;
    if (this.paladinDash.active || this.paladinDash.cooldown > 0) return;

    this.paladinDash.active = 1;
    this.paladinDash.timer = PALADIN_AEGIS.dashFrames;
    this.paladinDash.cooldown = PALADIN_AEGIS.cooldownFrames;
    this.paladinDash.afterglow = PALADIN_AEGIS.afterglowFrames;
    this.player.vy = 0;
    this.player.duckFlying = 0;
    if (!this.player.face) this.player.face = 1;
    this.audio.tone(540, 0.04, 0.00, "square", 0.05);
    this.audio.tone(760, 0.05, 0.03, "triangle", 0.04);
  }

  updatePaladinAegisDash(name) {
    if (this.paladinDash.cooldown > 0) this.paladinDash.cooldown--;
    if (this.paladinDash.afterglow > 0) this.paladinDash.afterglow--;
    if (name !== "PALADIN" || !this.player) {
      this.paladinDash.active = 0;
      this.paladinDash.timer = 0;
      return;
    }
    if (!this.paladinDash.active) return;
    if (this.paladinDash.timer > 0) this.paladinDash.timer--;
    if (this.paladinDash.timer <= 0) this.paladinDash.active = 0;
  }

  tryActivateDuckGaleDive() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "DUCK") return;
    if (this.duckDive.active || this.duckDive.cooldown > 0) return;
    if (this.player.onGround) {
      this.audio.tone(190, 0.03, 0.00, "square", 0.03);
      return;
    }

    this.duckDive.active = 1;
    this.duckDive.timer = DUCK_GALE_DIVE.durationFrames;
    this.duckDive.cooldown = DUCK_GALE_DIVE.cooldownFrames;
    this.duckDive.afterglow = DUCK_GALE_DIVE.afterglowFrames;
    this.player.duckFlying = 0;
    this.player.vx *= 0.6;
    this.player.vy = Math.max(this.player.vy, DUCK_GALE_DIVE.diveSpeed);
    this.duckDive.flash = DUCK_GALE_DIVE.startFlashFrames;
    this.duckDive.flashX = this.player.x + this.player.w * 0.5;
    this.duckDive.flashY = this.player.y + this.player.h * 0.5;
    this.duckDive.flashKind = 1;
    this.audio.tone(360, 0.04, 0.00, "square", 0.04);
    this.audio.tone(280, 0.05, 0.03, "triangle", 0.03);
  }

  triggerDuckDiveImpactFx(x, y) {
    this.duckDive.flash = DUCK_GALE_DIVE.impactFlashFrames;
    this.duckDive.flashX = x;
    this.duckDive.flashY = y;
    this.duckDive.flashKind = 2;
  }

  updateDuckGaleDive(name) {
    if (this.duckDive.cooldown > 0) this.duckDive.cooldown--;
    if (this.duckDive.afterglow > 0) this.duckDive.afterglow--;
    if (this.duckDive.flash > 0) this.duckDive.flash--;

    if (name !== "DUCK" || !this.player) {
      this.duckDive.active = 0;
      this.duckDive.timer = 0;
      return;
    }

    if (!this.duckDive.active) return;
    const p = this.player;
    p.duckFlying = 0;
    p.vy = Math.max(p.vy, DUCK_GALE_DIVE.diveSpeed);
    p.vx *= 0.94;

    if (this.duckDive.timer > 0) this.duckDive.timer--;
    if (this.duckDive.timer <= 0) this.duckDive.active = 0;
  }

  tryActivateBunnyCarrotRocket() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "BUNNY") return;
    if (this.bunnyRocket.active) return;
    if (this.bunnyRocket.charges <= 0) {
      this.audio.tone(170, 0.03, 0.00, "square", 0.03);
      return;
    }

    const inputDir = (this.keyDown.ArrowRight || this.keyDown.KeyD ? 1 : 0) - (this.keyDown.ArrowLeft || this.keyDown.KeyA ? 1 : 0);
    const dir = inputDir || (this.player.face >= 0 ? 1 : -1) || 1;

    this.bunnyRocket.active = 1;
    this.bunnyRocket.timer = BUNNY_CARROT_ROCKET.durationFrames;
    this.bunnyRocket.afterglow = BUNNY_CARROT_ROCKET.afterglowFrames;
    this.bunnyRocket.dir = dir;
    this.bunnyRocket.trail = [];
    this.bunnyRocket.trailTick = 0;
    this.bunnyRocket.burstUsed = 0;
    this.bunnyRocket.charges = Math.max(0, this.bunnyRocket.charges - 1);
    if (this.bunnyRocket.charges < BUNNY_CARROT_ROCKET.maxCharges && this.bunnyRocket.rechargeTimer <= 0) {
      this.bunnyRocket.rechargeTimer = BUNNY_CARROT_ROCKET.rechargeFrames;
    }

    this.player.face = dir;
    this.player.vx = dir * BUNNY_CARROT_ROCKET.launchVx;
    this.player.vy = BUNNY_CARROT_ROCKET.launchVy;
    this.player.duckFlying = 0;

    this.audio.tone(620, 0.03, 0.00, "square", 0.05);
    this.audio.tone(880, 0.04, 0.03, "triangle", 0.04);
    this.audio.tone(1040, 0.03, 0.06, "sine", 0.03);
  }

  triggerBunnyRocketBurst(cx, cy, levelTheme) {
    if (!this.player || this.bunnyRocket.burstUsed) return;
    this.bunnyRocket.burstUsed = 1;
    this.bunnyRocket.burstFlash = BUNNY_CARROT_ROCKET.burstFlashFrames;
    this.bunnyRocket.burstX = cx;
    this.bunnyRocket.burstY = cy;

    const radius = BUNNY_CARROT_ROCKET.burstRadius;
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      const ex = enemy.x + enemy.w * 0.5;
      const ey = enemy.y + enemy.h * 0.5;
      const hitR = radius + Math.max(4, Math.min(enemy.w, enemy.h) * 0.36);
      if (Math.hypot(ex - cx, ey - cy) > hitR) continue;
      this.handleSpecialEnemyDefeat(enemy);
      enemy.dead = 1;
      this.spawnEnemyShatter(enemy, levelTheme);
      this.spawnCoinDrops(enemy.x + 2, enemy.y + 2);
    }

    this.bunnyRocket.active = 0;
    this.bunnyRocket.timer = 0;
    this.audio.tone(460, 0.04, 0.00, "square", 0.05);
    this.audio.tone(700, 0.04, 0.03, "triangle", 0.04);
    this.audio.tone(980, 0.03, 0.06, "sine", 0.03);
  }

  updateBunnyCarrotRocket(name) {
    if (this.bunnyRocket.burstFlash > 0) this.bunnyRocket.burstFlash--;
    if (this.bunnyRocket.afterglow > 0) this.bunnyRocket.afterglow--;

    if (this.bunnyRocket.charges < BUNNY_CARROT_ROCKET.maxCharges) {
      if (this.bunnyRocket.rechargeTimer > 0) this.bunnyRocket.rechargeTimer--;
      if (this.bunnyRocket.rechargeTimer <= 0) {
        this.bunnyRocket.charges++;
        if (this.bunnyRocket.charges < BUNNY_CARROT_ROCKET.maxCharges) {
          this.bunnyRocket.rechargeTimer = BUNNY_CARROT_ROCKET.rechargeFrames;
        }
      }
    } else {
      this.bunnyRocket.rechargeTimer = 0;
    }

    if (name !== "BUNNY" || !this.player) {
      this.bunnyRocket.active = 0;
      this.bunnyRocket.timer = 0;
    } else if (this.bunnyRocket.active) {
      const p = this.player;
      p.face = this.bunnyRocket.dir;
      p.vx += this.bunnyRocket.dir * BUNNY_CARROT_ROCKET.driftAccel;
      p.vx = clamp(p.vx, -BUNNY_CARROT_ROCKET.maxDriftVx, BUNNY_CARROT_ROCKET.maxDriftVx);
      if (Math.sign(p.vx) !== this.bunnyRocket.dir) p.vx = this.bunnyRocket.dir * 1.2;

      this.bunnyRocket.trailTick++;
      if ((this.bunnyRocket.trailTick % BUNNY_CARROT_ROCKET.trailSpawnEvery) === 0) {
        this.bunnyRocket.trail.push({
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
          t: BUNNY_CARROT_ROCKET.afterglowFrames,
          life: BUNNY_CARROT_ROCKET.afterglowFrames
        });
      }

      if (this.bunnyRocket.timer > 0) this.bunnyRocket.timer--;
      if (this.bunnyRocket.timer <= 0) this.bunnyRocket.active = 0;
    }

    for (let i = 0; i < this.bunnyRocket.trail.length; i++) {
      const ghost = this.bunnyRocket.trail[i];
      if (ghost.t-- <= 0) ghost.dead = 1;
    }
    this.bunnyRocket.trail = this.bunnyRocket.trail.filter(g => !g.dead);
  }

  tryActivateNinjaShadowStep() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "NINJA") return;
    if (this.ninjaShadow.active) return;

    const overdrive = this.ninjaShadow.cooldown > 0;
    if (overdrive) {
      if (this.ninjaShadow.overdriveUsed) {
        this.audio.tone(170, 0.03, 0.00, "square", 0.03);
        return;
      }
      if (this.coins < NINJA_SHADOW_STEP.overdriveCoinCost) {
        this.audio.tone(150, 0.03, 0.00, "square", 0.03);
        return;
      }
      this.coins = Math.max(0, this.coins - NINJA_SHADOW_STEP.overdriveCoinCost);
      this.ninjaShadow.overdriveUsed = 1;
      this.teleportNotice = "SHADOW STEP -" + NINJA_SHADOW_STEP.overdriveCoinCost + " COINS";
      this.teleportNoticeTimer = 60;
    } else {
      this.ninjaShadow.overdriveUsed = 0;
    }

    const inputDir = (this.keyDown.ArrowRight || this.keyDown.KeyD ? 1 : 0) - (this.keyDown.ArrowLeft || this.keyDown.KeyA ? 1 : 0);
    const dir = inputDir || (this.player.face >= 0 ? 1 : -1) || 1;

    this.ninjaShadow.active = 1;
    this.ninjaShadow.timer = NINJA_SHADOW_STEP.dashFrames;
    this.ninjaShadow.cooldown = NINJA_SHADOW_STEP.cooldownFrames;
    this.ninjaShadow.afterglow = NINJA_SHADOW_STEP.afterglowFrames;
    this.ninjaShadow.dir = dir;
    this.ninjaShadow.trail = [];
    this.ninjaShadow.trailTick = 0;

    this.player.face = dir;
    this.player.vx = dir * NINJA_SHADOW_STEP.dashSpeed;
    this.player.vy = Math.min(this.player.vy, NINJA_SHADOW_STEP.airLiftVy);
    this.player.duckFlying = 0;

    this.audio.tone(520, 0.03, 0.00, "triangle", 0.05);
    this.audio.tone(760, 0.04, 0.03, "sine", 0.04);
    this.audio.tone(980, 0.03, 0.06, "triangle", 0.035);
  }

  updateNinjaShadowStep(name) {
    if (this.ninjaShadow.cooldown > 0) this.ninjaShadow.cooldown--;
    if (this.ninjaShadow.cooldown <= 0) this.ninjaShadow.overdriveUsed = 0;
    if (this.ninjaShadow.afterglow > 0) this.ninjaShadow.afterglow--;

    if (name !== "NINJA" || !this.player) {
      this.ninjaShadow.active = 0;
      this.ninjaShadow.timer = 0;
    } else if (this.ninjaShadow.active) {
      const p = this.player;
      p.face = this.ninjaShadow.dir;
      p.vx = this.ninjaShadow.dir * NINJA_SHADOW_STEP.dashSpeed;
      p.vy = Math.min(p.vy, 0.4);

      this.ninjaShadow.trailTick++;
      if ((this.ninjaShadow.trailTick % NINJA_SHADOW_STEP.trailSpawnEvery) === 0) {
        this.ninjaShadow.trail.push({
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
          t: NINJA_SHADOW_STEP.afterglowFrames,
          life: NINJA_SHADOW_STEP.afterglowFrames
        });
      }

      if (this.ninjaShadow.timer > 0) this.ninjaShadow.timer--;
      if (this.ninjaShadow.timer <= 0) this.ninjaShadow.active = 0;
    }

    for (let i = 0; i < this.ninjaShadow.trail.length; i++) {
      const ghost = this.ninjaShadow.trail[i];
      if (ghost.t-- <= 0) ghost.dead = 1;
    }
    this.ninjaShadow.trail = this.ninjaShadow.trail.filter(g => !g.dead);
  }

  updateHolyZones() {
    if (this.holyWardCooldown > 0) this.holyWardCooldown--;
    this.holyWard = 0;
    if (!this.levelLightZones || !this.levelLightZones.length || !this.player) return;
    const px = this.player.x + this.player.w * 0.5;
    for (let i = 0; i < this.levelLightZones.length; i++) {
      const zone = this.levelLightZones[i];
      const x0 = (zone.xTile || 0) * TILE_SIZE;
      const x1 = x0 + (zone.widthTiles || 0) * TILE_SIZE;
      if (px >= x0 && px <= x1) {
        this.holyWard = 1;
        return;
      }
    }
  }

  hasGrappleLineOfSight(x0, y0, x1, y1, targetTx, targetTy) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.ceil(dist / 4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = x0 + (x1 - x0) * t;
      const sy = y0 + (y1 - y0) * t;
      const tx = (sx / TILE_SIZE) | 0;
      const ty = (sy / TILE_SIZE) | 0;
      if (tx === targetTx && ty === targetTy) continue;
      if (this.isSolid(this.tileIdAt(tx, ty))) return 0;
    }
    return 1;
  }

  findRangerGrappleAnchor() {
    const p = this.player;
    if (!p) return null;

    const dir = p.face >= 0 ? 1 : -1;
    const maxRangePx = RANGER_GRAPPLE.rangeTiles * TILE_SIZE;
    const px = p.x + p.w * 0.5;
    const py = p.y + p.h * 0.35;
    let best = null;
    let bestDist = 1e9;

    for (let dyTiles = -8; dyTiles <= 2; dyTiles++) {
      for (let dxTiles = 2; dxTiles <= RANGER_GRAPPLE.rangeTiles; dxTiles++) {
        const probeX = px + dir * dxTiles * TILE_SIZE;
        const probeY = py + dyTiles * TILE_SIZE;
        const tx = (probeX / TILE_SIZE) | 0;
        const ty = (probeY / TILE_SIZE) | 0;
        if (!this.isSolid(this.tileIdAt(tx, ty))) continue;
        if (this.isSolid(this.tileIdAt(tx - dir, ty))) continue;

        const ax = tx * TILE_SIZE + (dir > 0 ? 1 : TILE_SIZE - 1);
        const ay = ty * TILE_SIZE + 2;
        const dist = Math.hypot(ax - px, ay - py);
        if (dist > maxRangePx) continue;
        if (!this.hasGrappleLineOfSight(px, py, ax, ay, tx, ty)) continue;

        if (dist < bestDist) {
          bestDist = dist;
          best = { x: ax, y: ay, tx, ty };
        }
      }
    }

    return best;
  }

  tryActivateRangerGrapple() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "RANGER") return;
    if (this.rangerGrapple.active || this.rangerGrapple.cooldown > 0) return;

    const anchor = this.findRangerGrappleAnchor();
    if (!anchor) {
      this.audio.tone(180, 0.04, 0.00, "square", 0.03);
      return;
    }

    this.rangerGrapple.active = 1;
    this.rangerGrapple.cooldown = RANGER_GRAPPLE.cooldownFrames;
    this.rangerGrapple.timer = RANGER_GRAPPLE.maxHoldFrames;
    this.rangerGrapple.anchorX = anchor.x;
    this.rangerGrapple.anchorY = anchor.y;
    this.rangerGrapple.anchorTx = anchor.tx;
    this.rangerGrapple.anchorTy = anchor.ty;
    this.rangerGrapple.ringT = RANGER_GRAPPLE.ringFlashFrames;

    this.player.duckFlying = 0;
    this.audio.tone(360, 0.04, 0.00, "triangle", 0.05);
    this.audio.tone(640, 0.05, 0.03, "sine", 0.045);
  }

  updateRangerGrapple(characterName) {
    if (this.rangerGrapple.cooldown > 0) this.rangerGrapple.cooldown--;
    if (this.rangerGrapple.ringT > 0) this.rangerGrapple.ringT--;

    if (characterName !== "RANGER" || !this.player) {
      this.rangerGrapple.active = 0;
      return;
    }
    if (!this.rangerGrapple.active) return;

    const p = this.player;
    const cx = p.x + p.w * 0.5;
    const cy = p.y + p.h * 0.45;
    const dx = this.rangerGrapple.anchorX - cx;
    const dy = this.rangerGrapple.anchorY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const maxRangePx = RANGER_GRAPPLE.rangeTiles * TILE_SIZE + 10;

    if (dist > maxRangePx || dist <= RANGER_GRAPPLE.snapDistance || this.rangerGrapple.timer <= 0) {
      this.rangerGrapple.active = 0;
      p.vx *= 0.88;
      return;
    }

    this.rangerGrapple.timer--;
    p.vx += (dx / dist) * RANGER_GRAPPLE.pullAccel;
    p.vy += (dy / dist) * RANGER_GRAPPLE.pullAccel;

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy.type !== 8 || enemy.workerState !== "SHIELD_UP") continue;
      const ex = enemy.x + enemy.w * 0.5;
      const ey = enemy.y + enemy.h * 0.5;
      if (Math.hypot(cx - ex, cy - ey) > 16) continue;
      enemy.dir *= -1;
      enemy.workerState = "RECOVER";
      enemy.workerStateTimer = SHIELDED_WORKER.recoverFrames;
      this.rangerGrapple.active = 0;
      this.audio.tone(520, 0.04, 0.00, "triangle", 0.03);
      this.audio.tone(700, 0.05, 0.02, "sine", 0.03);
      break;
    }

    const speed = Math.hypot(p.vx, p.vy);
    if (speed > RANGER_GRAPPLE.maxPullSpeed) {
      const s = RANGER_GRAPPLE.maxPullSpeed / speed;
      p.vx *= s;
      p.vy *= s;
    }
  }

  tryActivateRobotPulse() {
    if (this.deathTimer > 0 || !this.player) return;
    if (CHARACTERS[this.characterIndex].name !== "ROBOT") return;
    if (this.robotPulse.timer > 0 || this.robotPulse.cooldown > 0) return;

    this.robotPulse.timer = ROBOT_MAGNET_PULSE.durationFrames;
    this.robotPulse.cooldown = ROBOT_MAGNET_PULSE.cooldownFrames;
    this.robotPulse.ringT = ROBOT_MAGNET_PULSE.ringFlashFrames;
    this.robotPulse.x = this.player.x + this.player.w * 0.5;
    this.robotPulse.y = this.player.y + this.player.h * 0.5;
    this.robotPulse.phase2Active = this.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold ? 1 : 0;
    if (this.robotPulse.phase2Active) this.robotPulse.phase2Notice = ROBOT_MAGNET_PULSE.phaseTwoAnnounceFrames;

    this.audio.tone(520, 0.04, 0.00, "triangle", 0.055);
    this.audio.tone(760, 0.04, 0.04, "triangle", 0.052);
    this.audio.tone(980, 0.05, 0.08, "sine", 0.048);
    if (this.robotPulse.phase2Active) {
      this.audio.tone(1180, 0.05, 0.02, "triangle", 0.04);
      this.audio.tone(1360, 0.06, 0.07, "sine", 0.035);
    }
  }

  updateRobotMagnetPulse(characterName) {
    if (this.robotPulse.cooldown > 0) this.robotPulse.cooldown--;
    if (this.robotPulse.ringT > 0) this.robotPulse.ringT--;
    if (this.robotPulse.phase2Notice > 0) this.robotPulse.phase2Notice--;
    if (this.robotPulse.killNotice > 0) this.robotPulse.killNotice--;

    const phase2Ready = this.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold;
    if (characterName === "ROBOT" && phase2Ready && !this.robotPulse.phase2ReadyLatch) {
      this.robotPulse.phase2ReadyLatch = 1;
      this.robotPulse.phase2Notice = ROBOT_MAGNET_PULSE.phaseTwoAnnounceFrames;
      this.audio.tone(980, 0.03, 0.00, "triangle", 0.03);
      this.audio.tone(1220, 0.04, 0.04, "sine", 0.03);
    } else if (!phase2Ready) {
      this.robotPulse.phase2ReadyLatch = 0;
    }

    if (characterName !== "ROBOT" || this.robotPulse.timer <= 0 || !this.player) {
      this.robotPulse.phase2Active = 0;
      return;
    }

    this.robotPulse.timer--;
    this.robotPulse.phase2Active = phase2Ready ? 1 : 0;

    const p = this.player;
    const cx = p.x + p.w * 0.5;
    const cy = p.y + p.h * 0.5;
    const radius = ROBOT_MAGNET_PULSE.radius;
    this.robotPulse.x = cx;
    this.robotPulse.y = cy;

    for (let i = 0; i < this.coinDrops.length; i++) {
      const d = this.coinDrops[i];
      const dx = cx - (d.x + d.w * 0.5);
      const dy = cy - (d.y + d.h * 0.5);
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > radius) continue;
      const pull = (1 - (dist / radius)) * ROBOT_MAGNET_PULSE.pullStrength;
      d.vx += (dx / dist) * pull;
      d.vy += (dy / dist) * pull - 0.03;
    }

    const minTx = Math.max(0, ((cx - radius) / TILE_SIZE) | 0);
    const maxTx = Math.min(this.tileCols - 1, ((cx + radius) / TILE_SIZE) | 0);
    const minTy = Math.max(0, ((cy - radius) / TILE_SIZE) | 0);
    const maxTy = Math.min(this.tileRows - 1, ((cy + radius) / TILE_SIZE) | 0);

    for (let y = minTy; y <= maxTy; y++) {
      for (let x = minTx; x <= maxTx; x++) {
        const id = this.tileIdAt(x, y);
        if (id !== 2 && id !== 5 && id !== 6 && id !== 13 && id !== 14 && id !== 15) continue;
        const tx = x * TILE_SIZE + TILE_SIZE * 0.5;
        const ty = y * TILE_SIZE + TILE_SIZE * 0.5;
        if (Math.hypot(cx - tx, cy - ty) > radius) continue;

        this.setTile(x, y, ".");
        this.spawnMagnetPickup(id, tx, ty);
      }
    }

    const levelTheme = getThemeForLevel(this.levelIndex);
    let phase2Kills = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      const ex = e.x + e.w * 0.5;
      const ey = e.y + e.h * 0.5;
      const dx = cx - ex;
      const dy = cy - ey;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > radius) continue;

      let pull = (1 - (dist / radius)) * ROBOT_MAGNET_PULSE.enemyPullStrength;
      if (this.robotPulse.phase2Active) pull *= 1.35;
      if (e.type) {
        e.x += (dx / dist) * pull;
        e.y += (dy / dist) * pull;
        e.baseX = e.x;
        e.baseY = e.y;
      } else {
        // ground enemies: modify position directly because their AI resets `vx` each frame
        // (enemy update does `e.vx = e.dir * ENEMY_SPEED`), so adding to vx had no effect.
        e.x += (dx / dist) * pull;
        e.y += (dy / dist) * pull * 0.85;
      }

      if (this.robotPulse.phase2Active && dist <= ROBOT_MAGNET_PULSE.enemyKillRadius) {
        this.handleSpecialEnemyDefeat(e);
        e.dead = 1;
        phase2Kills++;
        this.spawnEnemyShatter(e, levelTheme);
        this.spawnCoinDrops(e.x + 2, e.y + 2);
      }
    }

    if (phase2Kills > 0) {
      this.robotPulse.cooldown = Math.max(this.robotPulse.cooldown, ROBOT_MAGNET_PULSE.cooldownFrames + ROBOT_MAGNET_PULSE.enemyKillCooldownFrames);
      this.robotPulse.phase2Notice = ROBOT_MAGNET_PULSE.phaseTwoAnnounceFrames;
      this.robotPulse.killNotice = ROBOT_MAGNET_PULSE.killNoticeFrames;
      this.robotPulse.killCount = phase2Kills;
      this.audio.tone(230, 0.05, 0.00, "sawtooth", 0.05);
      this.audio.tone(170, 0.06, 0.04, "triangle", 0.05);
    }

  }

  updateFrankensteinEnemy(e, p, gr, speedMul) {
    if (!e.frankState) {
      e.frankState = "MARCH";
      e.frankTimer = 0;
    }

    const absDx = Math.abs((p.x + p.w * 0.5) - (e.x + e.w * 0.5));
    const absDy = Math.abs((p.y + p.h * 0.5) - (e.y + e.h * 0.5));

    if (e.frankState === "MARCH" && absDx <= FRANKENSTEIN.triggerRange && absDy <= FRANKENSTEIN.verticalAwareness) {
      e.frankState = "WINDUP";
      e.frankTimer = FRANKENSTEIN.windupFrames;
      e.dir = (p.x + p.w * 0.5) >= (e.x + e.w * 0.5) ? 1 : -1;
      this.audio.tone(150, 0.06, 0.00, "triangle", 0.035);
    }

    let moveSpeed = FRANKENSTEIN.patrolSpeed;
    if (e.frankState === "WINDUP") moveSpeed = FRANKENSTEIN.windupSpeed;
    else if (e.frankState === "SLAM") moveSpeed = FRANKENSTEIN.slamSpeed;
    else if (e.frankState === "RECOVER") moveSpeed = FRANKENSTEIN.recoverSpeed;

    e.vx = e.dir * moveSpeed * speedMul;
    e.vy += gr;
    if (e.vy > 8.5) e.vy = 8.5;
    this.moveAndCollide(e);

    if (e.onGround) {
      const ax = e.x + (e.dir > 0 ? e.w + 1 : -1);
      const tx = (ax / TILE_SIZE) | 0;
      const ty = ((e.y + e.h + 1) / TILE_SIZE) | 0;
      if (!this.isSolid(this.tileIdAt(tx, ty))) e.dir *= -1;
    }

    if (e.frankState === "WINDUP") {
      e.frankTimer = Math.max(0, (e.frankTimer | 0) - 1);
      if (e.frankTimer <= 0) {
        e.frankState = "SLAM";
        e.frankTimer = FRANKENSTEIN.slamFrames;
        this.audio.tone(100, 0.08, 0.00, "sawtooth", 0.05);
        this.audio.tone(76, 0.10, 0.02, "triangle", 0.045);
      }
    } else if (e.frankState === "SLAM") {
      e.frankTimer = Math.max(0, (e.frankTimer | 0) - 1);
      if (e.frankTimer <= 0) {
        e.frankState = "RECOVER";
        e.frankTimer = FRANKENSTEIN.recoverFrames;
      }
    } else if (e.frankState === "RECOVER") {
      e.frankTimer = Math.max(0, (e.frankTimer | 0) - 1);
      if (e.frankTimer <= 0) e.frankState = "MARCH";
    }
  }

  enemySpriteFor(enemy, theme) {
    return enemySpriteForTheme(enemy, theme, SPRITES);
  }

  spawnEnemyShatter(enemy, theme) {
    const sprite = this.enemySpriteFor(enemy, theme);
    if (!sprite || !sprite.length) return;
    const cfg = ENEMY_DEATH_SHATTER;
    const chunk = cfg.chunkSizeMin + ((this.rand01() * (cfg.chunkSizeMax - cfg.chunkSizeMin + 1)) | 0);
    const centerX = enemy.x + enemy.w * 0.5;
    const centerY = enemy.y + enemy.h * 0.5;

    for (let sy = 0; sy < sprite.length; sy += chunk) {
      for (let sx = 0; sx < sprite[0].length; sx += chunk) {
        const pixels = [];
        for (let yy = 0; yy < chunk; yy++) {
          const row = sprite[sy + yy];
          if (!row) continue;
          for (let xx = 0; xx < chunk; xx++) {
            const ch = row[sx + xx];
            if (!ch || ch === ".") continue;
            pixels.push({ dx: xx, dy: yy, col: PALETTE[ch] || "#fff" });
          }
        }
        if (!pixels.length) continue;

        const pieceX = enemy.x + sx;
        const pieceY = enemy.y + sy;
        let dx = pieceX + chunk * 0.5 - centerX;
        let dy = pieceY + chunk * 0.5 - centerY;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;

        const speed = cfg.burstSpeedMin + this.rand01() * (cfg.burstSpeedMax - cfg.burstSpeedMin);
        const lift = cfg.upwardLiftMin + this.rand01() * (cfg.upwardLiftMax - cfg.upwardLiftMin);
        const life = cfg.pieceLifeMin + ((this.rand01() * (cfg.pieceLifeMax - cfg.pieceLifeMin + 1)) | 0);
        this.enemyShatter.push({
          x: pieceX,
          y: pieceY,
          vx: dx * speed + (this.rand01() - 0.5) * cfg.lateralJitter,
          vy: dy * speed - lift,
          t: life,
          life,
          pixels
        });
      }
    }
  }

  updateEnemyShatter(gravity) {
    const cfg = ENEMY_DEATH_SHATTER;
    for (let i = 0; i < this.enemyShatter.length; i++) {
      const part = this.enemyShatter[i];
      if (part.t-- <= 0) { part.dead = 1; continue; }
      part.vy += gravity * cfg.gravityMul;
      part.vx *= cfg.drag;
      part.x += part.vx;
      part.y += part.vy;
    }
    this.enemyShatter = this.enemyShatter.filter(p => !p.dead);
  }

  drawEnemyShatter() {
    for (let i = 0; i < this.enemyShatter.length; i++) {
      const part = this.enemyShatter[i];
      gfx.globalAlpha = part.life ? (part.t / part.life) : 1;
      for (let j = 0; j < part.pixels.length; j++) {
        const px = part.pixels[j];
        gfx.fillStyle = px.col;
        gfx.fillRect(((part.x + px.dx) - this.cameraX) | 0, ((part.y + px.dy) - this.cameraY) | 0, 1, 1);
      }
    }
    gfx.globalAlpha = 1;
  }

  collectTiles() {
    const p = this.player;
    const x0 = (p.x / TILE_SIZE) | 0;
    const x1 = ((p.x + p.w - 1) / TILE_SIZE) | 0;
    const y0 = (p.y / TILE_SIZE) | 0;
    const y1 = ((p.y + p.h - 1) / TILE_SIZE) | 0;

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const id = this.tileIdAt(x, y);
        if (id === 7 && !this.paladinDash.active) {
          if (!this.tryConsumeGlitchrunnerEchoShield(x * TILE_SIZE + TILE_SIZE * 0.5, y * TILE_SIZE + TILE_SIZE * 0.5)) return this.startLavaDeath(0);
          continue;
        }
        if (id === 2 || id === 5 || id === 6 || id === 13 || id === 14 || id === 15) {
          this.setTile(x, y, ".");
          this.collectTileReward(id, x * TILE_SIZE + TILE_SIZE * 0.5, y * TILE_SIZE + TILE_SIZE * 0.5);
        }
      }
    }
  }

  collectibleSprite(tileId) {
    const theme = getThemeForLevel(this.levelIndex);
    return collectibleSpriteForTheme(theme, tileId, SPRITES);
  }

  oneUpSpriteForTheme(theme) {
    return selectOneUpSpriteForTheme(theme, SPRITES);
  }

  tileSprite(tileId) {
    const theme = getThemeForLevel(this.levelIndex);
    return tileSpriteForTheme(theme, tileId, SPRITES);
  }

  spawnVampireBlood(enemy, streamCount) {
    if (!enemy || streamCount <= 0) return;
    for (let i = 0; i < streamCount; i++) {
      const side = streamCount > 1 ? (i === 0 ? -1 : 1) : 0;
      const life = 20 + ((this.rand01() * 18) | 0);
      this.vampireBlood.push({
        x: enemy.x + enemy.w * 0.5 + side * (enemy.w * 0.16) + (this.rand01() - 0.5) * 2,
        y: enemy.y + enemy.h * 0.72 + (this.rand01() - 0.5) * 1.5,
        vx: -enemy.dir * (0.35 + this.rand01() * 0.45) + side * 0.14 + (this.rand01() - 0.5) * 0.25,
        vy: 0.18 + this.rand01() * 0.35,
        t: life,
        life,
        size: this.rand01() > 0.55 ? 2 : 1
      });
    }
    if (this.vampireBlood.length > 420) this.vampireBlood.splice(0, this.vampireBlood.length - 420);
  }

  spawnCryptTrail(enemy, kind) {
    if (!enemy) return;
    const life = kind === "wisp" ? (18 + ((this.rand01() * 16) | 0)) : (24 + ((this.rand01() * 18) | 0));
    const spread = kind === "wisp" ? 0.22 : 0.36;
    this.cryptTrails.push({
      kind,
      x: enemy.x + enemy.w * 0.5 + (this.rand01() - 0.5) * 2,
      y: enemy.y + enemy.h * (kind === "wisp" ? 0.55 : 0.68) + (this.rand01() - 0.5) * 2,
      vx: -enemy.dir * (0.20 + this.rand01() * 0.22) + (this.rand01() - 0.5) * spread,
      vy: (kind === "wisp" ? 0.04 : 0.12) + this.rand01() * 0.20,
      t: life,
      life,
      size: kind === "wisp" ? (this.rand01() > 0.65 ? 2 : 1) : (this.rand01() > 0.5 ? 3 : 2)
    });
    if (this.cryptTrails.length > 340) this.cryptTrails.splice(0, this.cryptTrails.length - 340);
  }

  updateBatCompanion(levelTheme) {
    for (let i = 0; i < this.batCompanion.trail.length; i++) {
      const t = this.batCompanion.trail[i];
      if (t.t-- <= 0) t.dead = 1;
    }
    this.batCompanion.trail = this.batCompanion.trail.filter(t => !t.dead);
    if (this.batCompanion.burstT > 0) this.batCompanion.burstT--;

    if (!this.batCompanion.active || !this.player) return;
    if (this.batCompanion.timer-- <= 0) {
      this.triggerFairyCompanionExpireBurst(this.batCompanion.x, this.batCompanion.y);
      this.batCompanion.active = 0;
      this.batCompanion.timer = 0;
      return;
    }

    const p = this.player;
    this.batCompanion.angle += BAT_COMPANION.orbitSpeed;
    this.batCompanion.shimmer = (this.batCompanion.shimmer + 1) % BAT_COMPANION.shimmerFrames;
    if (this.batCompanion.pushSfxCooldown > 0) this.batCompanion.pushSfxCooldown--;
    const pcx = p.x + p.w * 0.5;
    const pcy = p.y + p.h * 0.32;
    let targetX = pcx + Math.cos(this.batCompanion.angle) * BAT_COMPANION.orbitRadius;
    let targetY = pcy + Math.sin(this.batCompanion.angle * 1.5) * 5;
    let targetAccel = BAT_COMPANION.fallbackAccel;
    let targetMaxSpeed = BAT_COMPANION.fallbackMaxSpeed;

    if (this.batCompanion.returningFrames > 0) {
      targetX = pcx + Math.cos(this.batCompanion.angle) * (BAT_COMPANION.orbitRadius * 0.6);
      targetY = pcy + Math.sin(this.batCompanion.angle * 1.8) * 4;
      targetAccel = BAT_COMPANION.returnAccel;
      targetMaxSpeed = BAT_COMPANION.returnMaxSpeed;
      this.batCompanion.returningFrames--;
      if (Math.hypot(this.batCompanion.x - pcx, this.batCompanion.y - pcy) <= BAT_COMPANION.returnCatchRadius) {
        this.batCompanion.returningFrames = 0;
      }
    } else {
      let bestEnemy = null;
      let bestDist = BAT_COMPANION.chaseRange;
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (!enemy || enemy.dead) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        const d = Math.hypot(ex - this.batCompanion.x, ey - this.batCompanion.y);
        if (d < bestDist) {
          bestDist = d;
          bestEnemy = enemy;
        }
      }

      if (bestEnemy) {
        targetX = bestEnemy.x + bestEnemy.w * 0.5 + (bestEnemy.vx || 0) * 3;
        targetY = bestEnemy.y + bestEnemy.h * 0.5 + (bestEnemy.vy || 0) * 2;
        targetAccel = BAT_COMPANION.chaseAccel;
        targetMaxSpeed = BAT_COMPANION.chaseMaxSpeed;
      }
    }

    const seekDx = targetX - this.batCompanion.x;
    const seekDy = targetY - this.batCompanion.y;
    const seekDist = Math.hypot(seekDx, seekDy) || 1;
    this.batCompanion.vx += (seekDx / seekDist) * targetAccel;
    this.batCompanion.vy += (seekDy / seekDist) * targetAccel;
    this.batCompanion.vx *= BAT_COMPANION.motionDrag;
    this.batCompanion.vy *= BAT_COMPANION.motionDrag;
    const vMag = Math.hypot(this.batCompanion.vx, this.batCompanion.vy);
    if (vMag > targetMaxSpeed) {
      const s = targetMaxSpeed / vMag;
      this.batCompanion.vx *= s;
      this.batCompanion.vy *= s;
    }
    this.batCompanion.x += this.batCompanion.vx;
    this.batCompanion.y += this.batCompanion.vy;
    const cx = this.batCompanion.x;
    const cy = this.batCompanion.y;
    this.batCompanion.x = cx;
    this.batCompanion.y = cy;

    this.batCompanion.trailTick++;
    if ((this.batCompanion.trailTick % BAT_COMPANION.trailSpawnEvery) === 0) {
      this.batCompanion.trail.push({
        x: cx + (this.rand01() - 0.5) * 2,
        y: cy + (this.rand01() - 0.5) * 2,
        t: BAT_COMPANION.trailLifeFrames,
        life: BAT_COMPANION.trailLifeFrames,
        size: BAT_COMPANION.trailSizeMin + ((this.rand01() * (BAT_COMPANION.trailSizeMax - BAT_COMPANION.trailSizeMin + 1)) | 0)
      });
    }

    if (this.batCompanion.coinDropTimer > 0) this.batCompanion.coinDropTimer--;
    if (this.batCompanion.coinDropTimer <= 0) {
      this.spawnFairyCoinDrop(cx, cy);
      this.batCompanion.coinDropTimer = this.rollFairyCoinDropTimer();
    }

    const minTx = Math.max(0, ((cx - BAT_COMPANION.coinCollectRadius) / TILE_SIZE) | 0);
    const maxTx = Math.min(this.tileCols - 1, ((cx + BAT_COMPANION.coinCollectRadius) / TILE_SIZE) | 0);
    const minTy = Math.max(0, ((cy - BAT_COMPANION.coinCollectRadius) / TILE_SIZE) | 0);
    const maxTy = Math.min(this.tileRows - 1, ((cy + BAT_COMPANION.coinCollectRadius) / TILE_SIZE) | 0);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const id = this.tileIdAt(tx, ty);
        if (id !== 2 && id !== 5 && id !== 13 && id !== 15) continue;
        const px = tx * TILE_SIZE + TILE_SIZE * 0.5;
        const py = ty * TILE_SIZE + TILE_SIZE * 0.5;
        if (Math.hypot(cx - px, cy - py) > BAT_COMPANION.coinCollectRadius) continue;
        this.setTile(tx, ty, ".");
        this.collectTileReward(id, px, py);
      }
    }

    for (let i = 0; i < this.coinDrops.length; i++) {
      const d = this.coinDrops[i];
      if (d.dead) continue;
      if (d.collectDelay > 0) continue;
      if (Math.hypot(cx - (d.x + d.w * 0.5), cy - (d.y + d.h * 0.5)) <= BAT_COMPANION.coinCollectRadius) {
        d.dead = 1;
        this.addCoins(1);
        this.audio.tone(760, 0.02);
      }
    }

    for (let i = 0; i < this.magnetItems.length; i++) {
      const item = this.magnetItems[i];
      if (item.dead || (item.tileId !== 2 && item.tileId !== 5 && item.tileId !== 13 && item.tileId !== 15)) continue;
      if (Math.hypot(cx - (item.x + item.w * 0.5), cy - (item.y + item.h * 0.5)) <= BAT_COMPANION.coinCollectRadius + 1) {
        this.collectMagnetPickup(item);
      }
    }

    let pushedEnemy = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      const ex = enemy.x + enemy.w * 0.5;
      const ey = enemy.y + enemy.h * 0.5;
      const hitR = BAT_COMPANION.enemyHitRadius + Math.max(4, Math.min(enemy.w, enemy.h) * 0.30);
      const dx = ex - cx;
      const dy = ey - cy;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > hitR) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const strength = BAT_COMPANION.enemyPushStrength * (1 - (dist / hitR));
      if (enemy.type) {
        enemy.x += nx * strength;
        enemy.y += ny * strength * 0.8;
        enemy.baseX = enemy.x;
        enemy.baseY = enemy.y;
      } else {
        enemy.x += nx * strength;
        enemy.y += ny * strength * 0.45;
        enemy.vx += nx * (strength * 0.45);
        enemy.vy += ny * BAT_COMPANION.enemyPushLift;
        if (Math.abs(nx) > 0.08) enemy.dir = nx >= 0 ? 1 : -1;
      }
      if (this.batCompanion.pushSfxCooldown <= 0) {
        this.audio.tone(860, 0.025, 0.00, "triangle", 0.02);
        this.batCompanion.pushSfxCooldown = BAT_COMPANION.pushSfxCooldownFrames;
      }
      pushedEnemy = 1;
      this.batCompanion.returningFrames = BAT_COMPANION.returnFrames;
      break;
    }

    if (pushedEnemy && this.batCompanion.coinDropTimer > 6) {
      this.batCompanion.coinDropTimer = 6;
    }
  }

  updateShadowrunHints() {
    if (getThemeForLevel(this.levelIndex) !== "SHADOWRUN") return;
    if (!this.player || this.shadowrunHintStage >= 2) return;

    const levelWidth = Math.max(1, this.tileCols * TILE_SIZE);
    const playerProgress = (this.player.x + this.player.w * 0.5) / levelWidth;
    if (this.teleportNoticeTimer > 30) return;

    if (this.shadowrunHintStage === 0 && playerProgress >= 0.74) {
      this.teleportNotice = "DATA CACHE: RISK POCKETS UP AHEAD";
      this.teleportNoticeTimer = 120;
      this.shadowrunHintStage = 1;
      return;
    }

    if (this.shadowrunHintStage === 1 && playerProgress >= 0.86) {
      this.teleportNotice = "EXFIL FORK: CHOOSE EITHER P PORTAL";
      this.teleportNoticeTimer = 120;
      this.shadowrunHintStage = 2;
    }
  }

  step() {
    if (this.gameState === "TITLE") {
      this.updateTitleScreen();
      return;
    }

    if (this.levelNameBanner) this.levelNameBanner--;
    if (this.helpTimer > 0) this.helpTimer--;
    if (this.checkpointNotice > 0) this.checkpointNotice--;
    if (this.respawnGrace > 0) this.respawnGrace--;
    if (this.geometryMusicNotice > 0) this.geometryMusicNotice--;
    if (this.teleportNoticeTimer > 0) this.teleportNoticeTimer--;
    if (this.touchInputTimer > 0) this.touchInputTimer--;

    if (this.gameOverCinematic.active) {
      this.updateGameOverCinematic();
      return;
    }

    if (this.deathTimer > 0) {
      this.updatePlayerShatter();
      this.deathTimer--;
      if (this.deathTimer <= 0) {
        this.deathTimer = 0;
        this.playerShatter = [];
        this.die(this.deathReset);
      }
      return;
    }

    const p = this.player;
    p.anim++;
    this.updateGeometryDreamMusic();
    this.updateBoneCryptWeather();
    this.updateShadowrunHints();

    const L = this.keyDown.ArrowLeft || this.keyDown.KeyA;
    const R = this.keyDown.ArrowRight || this.keyDown.KeyD;
    const D = this.keyDown.ArrowDown || this.keyDown.KeyS;
    const JH = this.keyDown.Space || this.keyDown.ArrowUp;
    const levelTheme = getThemeForLevel(this.levelIndex);

    const physics = PHYSICS_BY_THEME[levelTheme] || PHYSICS_BY_THEME[DEFAULT_THEME];
    const gr = physics.gravity;
    const fr = physics.groundFriction;
    const af = physics.airFriction;

    const character = CHARACTERS[this.characterIndex];
    const name = character.name;
    const rangerGrappling = (name === "RANGER" && this.rangerGrapple.active);
    const paladinDashing = (name === "PALADIN" && this.paladinDash.active);
    const duckDiving = (name === "DUCK" && this.duckDive.active);
    const bunnyRocketing = (name === "BUNNY" && this.bunnyRocket.active);
    const ninjaShadowing = (name === "NINJA" && this.ninjaShadow.active);
    const glitchPhasing = (name === "GLITCHRUNNER" && this.glitchPhase.active);
    this.updateSkeletonCrouch(name, D);
    this.updateHolyZones();
    this.updateStormMechanics(levelTheme);

    // Horizontal
    const dir = (R ? 1 : 0) - (L ? 1 : 0);
    if (duckDiving) {
      p.vx *= 0.90;
    } else if (bunnyRocketing) {
      p.vx += this.bunnyRocket.dir * BUNNY_CARROT_ROCKET.driftAccel;
      p.vx = clamp(p.vx, -BUNNY_CARROT_ROCKET.maxDriftVx, BUNNY_CARROT_ROCKET.maxDriftVx);
      p.face = this.bunnyRocket.dir;
    } else if (ninjaShadowing) {
      p.vx = this.ninjaShadow.dir * NINJA_SHADOW_STEP.dashSpeed;
      p.face = this.ninjaShadow.dir;
    } else if (glitchPhasing) {
      p.vx = this.glitchPhase.dir * GLITCHRUNNER_PHASE.dashSpeed;
      p.face = this.glitchPhase.dir;
    } else if (paladinDashing) {
      p.vx = (p.face >= 0 ? 1 : -1) * PALADIN_AEGIS.dashSpeed;
    } else if (!rangerGrappling && dir) {
      p.vx += dir * PLAYER_AX;
      p.face = dir;
      p.vx = clamp(p.vx, -PLAYER_MAX_VX, PLAYER_MAX_VX);
    } else if (!rangerGrappling) {
      p.vx *= p.onGround ? fr : af;
    } else {
      p.vx *= 0.99;
    }

    // Jump buffer transfer
    if (this.jumpBuffer) { p.jumpBuf = this.jumpBuffer; this.jumpBuffer = 0; }
    else p.jumpBuf = Math.max(0, p.jumpBuf - 1);

    // Ground resets
    const coyoteFrames = this.getTouchCoyoteFrames();
    if (p.onGround) {
      p.coyote = coyoteFrames;
      p.ninjaAirJumps = character.doubleJumps;
      p.duckFuel = character.duckFlight;
      p.duckFlying = 0;
    } else {
      p.coyote = Math.max(0, p.coyote - 1);
    }

    // Duck sustained flight
    if (p.duckFlying) {
      if (name !== "DUCK") p.duckFlying = 0;
      else if (JH && p.duckFuel > 0) {
        p.duckFuel--;
        p.vy -= 0.16;
        if (p.vy < -2.4) p.vy = -2.4;
      } else {
        p.duckFlying = 0;
      }
    }

    // Jump consume (same logic, clearer names)
    if (p.jumpBuf && !paladinDashing && !ninjaShadowing && !bunnyRocketing && !duckDiving && !glitchPhasing) {
      const isDuck = (name === "DUCK");
      const isNinja = (name === "NINJA");

      const canCoyoteJump = (p.coyote > 0) && !(name === "SKELETON" && p.skeletonCrouch);
      const canNinjaAirJump = isNinja && (p.ninjaAirJumps > 0);
      const canStartDuckFlight = isDuck && (p.duckFuel > 0);

      if (canCoyoteJump) {
        if (name === "RANGER") this.rangerGrapple.active = 0;
        p.vy = JUMP_VY * character.jumpMul;
        p.jumpBuf = 0;
        p.coyote = 0;
        p.onGround = 0;
        if (isDuck) { p.quackFrame = 10; this.audio.quack(); }
        else this.audio.tone(420, 0.05);
      } else if (canNinjaAirJump) {
        if (name === "RANGER") this.rangerGrapple.active = 0;
        p.ninjaAirJumps--;
        p.vy = JUMP_VY * character.jumpMul;
        p.jumpBuf = 0;
        this.audio.tone(520, 0.05);
      } else if (canStartDuckFlight) {
        p.duckFlying = 1;
        p.duckFuel = Math.max(0, p.duckFuel - 6);
        p.vy = Math.min(p.vy, -2.2);
        p.jumpBuf = 0;
        p.quackFrame = 10;
        this.audio.quack();
      }
    }

    this.updateRangerGrapple(name);
    this.updatePaladinAegisDash(name);
    this.updateDuckGaleDive(name);
    this.updateBunnyCarrotRocket(name);
    this.updateNinjaShadowStep(name);
    this.updateGlitchrunnerPhase(name);
    this.updateSkeletonBloodBurst(name);

    // Gravity + jump cut
    p.vy += gr * (duckDiving ? 0.15 : bunnyRocketing ? 0.2 : ninjaShadowing ? 0.25 : glitchPhasing ? 0.2 : paladinDashing ? 0.15 : (p.duckFlying ? 0.25 : 1));
    if (p.vy > 8.5) p.vy = 8.5;
    if (!paladinDashing && !ninjaShadowing && !bunnyRocketing && !duckDiving && !JH && p.vy < 0) p.vy *= 0.55;

    this.moveAndCollide(p);
    if (duckDiving && this.duckDive.active && p.onGround) {
      this.duckDive.active = 0;
      this.triggerDuckDiveImpactFx(p.x + p.w * 0.5, p.y + p.h * 0.85);
    }
    if (bunnyRocketing && this.bunnyRocket.active && p.onGround && !this.bunnyRocket.burstUsed) {
      this.triggerBunnyRocketBurst(p.x + p.w * 0.5, p.y + p.h * 0.85, levelTheme);
    }
    this.updateCheckpointProgress();
    this.updatePortals();
    this.updateStormMechanicHazardCollision(levelTheme);

    if (p.duckFlying && p.vy === 0 && !p.onGround) p.duckFlying = 0;

    this.collectTiles();
    this.updateConductorCore();
    this.updateRobotMagnetPulse(name);
    if (this.goal) {
      if (!this.winPending && rectsOverlap(p, this.goal.hitboxFlag)) {
        this.winPending = 1;
        this.goal.raising = 1;
        this.goal.raiseFrame = 0;
        this.audio.flagRaiseJingle();
      }

      if (this.goal.raising) {
        this.goal.raiseFrame = Math.min(this.goal.raiseFrames, this.goal.raiseFrame + 1);
        const t = this.goal.raiseFrame / this.goal.raiseFrames;
        this.goal.flagY = this.goal.flagYStart + (this.goal.flagYEnd - this.goal.flagYStart) * t;
        this.goal.hitboxFlag.y = this.goal.flagY;
        if (this.goal.raiseFrame >= this.goal.raiseFrames) {
          this.goal.raising = 0;
          if (this.winPending) this.win();
        }
      }
    }
    if (p.quackFrame) p.quackFrame--;

    // Coin drops
    for (let i = 0; i < this.coinDrops.length; i++) {
      const d = this.coinDrops[i];
      if (d.t-- <= 0) { d.dead = 1; continue; }
      if (d.collectDelay > 0) d.collectDelay--;
      d.vy += gr;
      d.vx *= 0.985;
      this.moveAndCollide(d);
      if (d.collectDelay <= 0 && rectsOverlap(p, d)) { d.dead = 1; this.addCoins(1); this.audio.tone(740, 0.03); }
    }
    this.coinDrops = this.coinDrops.filter(d => !d.dead);

    for (let i = 0; i < this.magnetItems.length; i++) {
      const item = this.magnetItems[i];
      if (item.t-- <= 0) { item.dead = 1; continue; }
      const dx = (p.x + p.w * 0.5) - (item.x + item.w * 0.5);
      const dy = (p.y + p.h * 0.5) - (item.y + item.h * 0.5);
      const dist = Math.hypot(dx, dy) || 1;
      const pull = ROBOT_MAGNET_PULSE.pickupPullStrength * this.pickupMagnetStrengthMultiplier();
      item.vx += (dx / dist) * pull;
      item.vy += (dy / dist) * pull;
      item.vx *= 0.92;
      item.vy *= 0.92;
      item.x += item.vx;
      item.y += item.vy;

      if (dist <= ROBOT_MAGNET_PULSE.pickupCollectRadius || rectsOverlap(p, item)) {
        this.collectMagnetPickup(item);
      }
    }
    this.magnetItems = this.magnetItems.filter(item => !item.dead);

    // Help block debris
    for (let i = 0; i < this.blockDebris.length; i++) {
      const d = this.blockDebris[i];
      if (d.t-- <= 0) { d.dead = 1; continue; }
      d.vy += gr * 0.6;
      d.vx *= 0.98;
      d.x += d.vx;
      d.y += d.vy;
    }
    this.blockDebris = this.blockDebris.filter(d => !d.dead);

    for (let i = 0; i < this.oneupBursts.length; i++) {
      const burst = this.oneupBursts[i];
      if (burst.ringT > 0) burst.ringT--;

      const parts = burst.particles;
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        if (part.t-- <= 0) { part.dead = 1; continue; }
        part.vx *= ONEUP_RADIAL_BURST.particleDrag;
        part.vy = part.vy * ONEUP_RADIAL_BURST.particleDrag + ONEUP_RADIAL_BURST.particleGravity;
        part.x += part.vx;
        part.y += part.vy;
      }
      burst.particles = parts.filter(p => !p.dead);
      if (burst.ringT <= 0 && burst.particles.length === 0) burst.dead = 1;
    }
    this.oneupBursts = this.oneupBursts.filter(b => !b.dead);

    if (this.relicFlash > 0) this.relicFlash--;
    for (let i = 0; i < this.relicBursts.length; i++) {
      const burst = this.relicBursts[i];
      if (burst.ringT > 0) burst.ringT--;
      const parts = burst.particles;
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        if (part.t-- <= 0) { part.dead = 1; continue; }
        part.vx *= RELIC_PICKUP_FX.particleDrag;
        part.vy = part.vy * RELIC_PICKUP_FX.particleDrag + RELIC_PICKUP_FX.particleGravity;
        part.x += part.vx;
        part.y += part.vy;
      }
      burst.particles = parts.filter(p => !p.dead);
      if (burst.ringT <= 0 && burst.particles.length === 0) burst.dead = 1;
    }
    this.relicBursts = this.relicBursts.filter(b => !b.dead);

    for (let i = 0; i < this.relicFloatTexts.length; i++) {
      const text = this.relicFloatTexts[i];
      if (text.t-- <= 0) { text.dead = 1; continue; }
      text.vy *= 0.96;
      text.y += text.vy;
    }
    this.relicFloatTexts = this.relicFloatTexts.filter(t => !t.dead);

    this.updateCheckpointRain();
    this.updateEnemyShatter(gr);
    for (let i = 0; i < this.vampireBlood.length; i++) {
      const drop = this.vampireBlood[i];
      if (drop.t-- <= 0) { drop.dead = 1; continue; }
      drop.vy += gr * 0.18;
      drop.vx *= 0.98;
      drop.x += drop.vx;
      drop.y += drop.vy;
    }
    this.vampireBlood = this.vampireBlood.filter(d => !d.dead);
    for (let i = 0; i < this.cryptTrails.length; i++) {
      const trail = this.cryptTrails[i];
      if (trail.t-- <= 0) { trail.dead = 1; continue; }
      trail.vy += gr * (trail.kind === "wisp" ? 0.04 : 0.10);
      trail.vx *= 0.985;
      trail.x += trail.vx;
      trail.y += trail.vy;
    }
    this.cryptTrails = this.cryptTrails.filter(t => !t.dead);
    this.updateSkeletonBurstShots(gr, levelTheme);
    this.updateBatCompanion(levelTheme);

    // Enemies
    const spaceMode = levelTheme === "SPACE";
    const stormSurgeAggroMul = (levelTheme === "STORMFOUNDRY" && this.stormMechanics && this.stormMechanics.surge && this.stormMechanics.surge.state === "ACTIVE") ? 1.2 : 1;
    let latePulseKills = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      e.anim++;

      if (e.type) {
        if (spaceMode) {
          if (e.type === 1) {
            e.vx = e.dir * 1.35;
            e.x += e.vx;
            this.collideX(e);
            e.y = e.baseY + Math.sin(e.anim * 0.22 + e.phase) * 5;
          } else if (e.type === 2) {
            const lane = Math.sin(e.phase * 1.9) > 0 ? 14 : -14;
            const targetX = p.x + lane + Math.sin(e.anim * 0.05 + e.phase) * 12;
            const desired = targetX >= e.x ? 1.0 : -1.0;
            e.vx += (desired - e.vx) * 0.07;
            e.x += e.vx;
            this.collideX(e);
            const swoop = Math.max(0, Math.sin(e.anim * 0.11 + e.phase)) * 8;
            e.y = e.baseY + Math.sin(e.anim * 0.08 + e.phase) * 2 + swoop;
          } else if (e.type === 4) {
            const track = Math.sin(e.anim * 0.03 + e.phase) > 0 ? 18 : -18;
            const targetX = p.x + track;
            const desired = targetX >= e.x ? 1.15 : -1.15;
            e.vx += (desired - e.vx) * 0.06;
            e.x += e.vx;
            this.collideX(e);
            e.y = e.baseY + Math.sin(e.anim * 0.10 + e.phase) * 10;
            if ((e.anim & 2) === 0) this.spawnVampireBlood(e, 1);
          } else if (e.type === 5) {
            const track = Math.sin(e.anim * 0.022 + e.phase) > 0 ? 26 : -26;
            const targetX = p.x + track;
            const desired = targetX >= e.x ? (0.92 * stormSurgeAggroMul) : (-0.92 * stormSurgeAggroMul);
            e.vx += (desired - e.vx) * 0.05;
            e.x += e.vx;
            this.collideX(e);
            e.y = e.baseY + Math.sin(e.anim * 0.08 + e.phase) * 13;
            if ((e.anim & 2) === 0) this.spawnVampireBlood(e, 2);
          } else if (e.type === 6) {
            const lead = p.x + Math.sin(e.anim * 0.06 + e.phase) * 20;
            const desired = lead >= e.x ? 1.2 : -1.2;
            e.vx += (desired - e.vx) * 0.08;
            e.x += e.vx;
            this.collideX(e);
            e.y = e.baseY + Math.sin(e.anim * 0.14 + e.phase) * 7;
            if ((e.anim & 2) === 0) this.spawnCryptTrail(e, "wisp");
          } else if (e.type === 7) {
            const lane = Math.sin(e.anim * 0.04 + e.phase) > 0 ? 24 : -24;
            const targetX = p.x + lane;
            const desired = targetX >= e.x ? (0.75 * stormSurgeAggroMul) : (-0.75 * stormSurgeAggroMul);
            e.vx += (desired - e.vx) * 0.05;
            e.x += e.vx;
            this.collideX(e);
            e.y = e.baseY + Math.sin(e.anim * 0.07 + e.phase) * 12;
            if ((e.anim & 3) === 0) this.spawnCryptTrail(e, "sigil");
          } else if (e.type === 8) {
            if (!e.workerState) {
              e.workerState = "PATROL";
              e.workerStateTimer = SHIELDED_WORKER.patrolFramesMin + ((this.rand01() * (SHIELDED_WORKER.patrolFramesMax - SHIELDED_WORKER.patrolFramesMin + 1)) | 0);
            }
            e.workerStateTimer = Math.max(0, (e.workerStateTimer | 0) - 1);
            const moveSpeed = (e.workerState === "SHIELD_UP" ? 0.46 : (e.workerState === "RECOVER" ? 0.62 : 0.88)) * stormSurgeAggroMul;
            e.vx = e.dir * moveSpeed;
            e.vy += gr;
            if (e.vy > 8.5) e.vy = 8.5;
            this.moveAndCollide(e);
            if (e.onGround) {
              const ax = e.x + (e.dir > 0 ? e.w + 1 : -1);
              const tx = (ax / TILE_SIZE) | 0;
              const ty = ((e.y + e.h + 1) / TILE_SIZE) | 0;
              if (!this.isSolid(this.tileIdAt(tx, ty))) e.dir *= -1;
            }
            if (e.workerState === "PATROL" && e.workerStateTimer <= 0) {
              e.workerState = "SHIELD_UP";
              e.workerStateTimer = SHIELDED_WORKER.shieldUpFrames;
            } else if (e.workerState === "SHIELD_UP" && e.workerStateTimer <= 0) {
              e.workerState = "EXPOSED";
              e.workerStateTimer = SHIELDED_WORKER.exposedFrames;
            } else if (e.workerState === "EXPOSED" && e.workerStateTimer <= 0) {
              e.workerState = "RECOVER";
              e.workerStateTimer = SHIELDED_WORKER.recoverFrames;
            } else if (e.workerState === "RECOVER" && e.workerStateTimer <= 0) {
              e.workerState = "PATROL";
              e.workerStateTimer = SHIELDED_WORKER.patrolFramesMin + ((this.rand01() * (SHIELDED_WORKER.patrolFramesMax - SHIELDED_WORKER.patrolFramesMin + 1)) | 0);
            }
          } else if (e.type === 9) {
            this.updateFrankensteinEnemy(e, p, gr, stormSurgeAggroMul);
          } else {
            const loopT = e.anim * 0.12 + e.phase;
            const drift = Math.sin(e.anim * 0.03 + e.phase) * 10;
            e.x = e.baseX + drift + Math.cos(loopT) * 14;
            e.y = e.baseY + Math.sin(loopT * 2.3) * 6;
          }
        } else if (e.type === 1) {
          e.vx = e.dir * 1.25;
          e.x += e.vx;
          this.collideX(e);
          e.y = e.baseY + Math.sin(e.anim * 0.15 + e.phase) * 6;
        } else if (e.type === 2) {
          e.vx = e.dir * 0.95;
          e.x += e.vx;
          this.collideX(e);
          const bob = Math.sin(e.anim * 0.10 + e.phase) * 3;
          const dip = Math.max(0, Math.sin(e.anim * 0.05 + e.phase)) * 7;
          e.y = e.baseY + bob + dip;
        } else if (e.type === 4) {
          e.vx = e.dir * 1.05;
          e.x += e.vx;
          this.collideX(e);
          const swoop = Math.sin(e.anim * 0.09 + e.phase) * 9;
          const hunt = Math.sign((p.x + p.w * 0.5) - (e.x + e.w * 0.5)) * 2;
          e.y = e.baseY + swoop + hunt;
          if ((e.anim & 2) === 0) this.spawnVampireBlood(e, 1);
        } else if (e.type === 5) {
          e.vx = e.dir * 0.88 * stormSurgeAggroMul;
          e.x += e.vx;
          this.collideX(e);
          const swoop = Math.sin(e.anim * 0.07 + e.phase) * 12;
          const hunt = Math.sign((p.x + p.w * 0.5) - (e.x + e.w * 0.5)) * 2.2;
          e.y = e.baseY + swoop + hunt;
          if ((e.anim & 2) === 0) this.spawnVampireBlood(e, 2);
        } else if (e.type === 6) {
          e.vx = e.dir * 1.4;
          e.x += e.vx;
          this.collideX(e);
          const wave = Math.sin(e.anim * 0.15 + e.phase) * 8;
          e.y = e.baseY + wave;
          if ((e.anim & 2) === 0) this.spawnCryptTrail(e, "wisp");
        } else if (e.type === 7) {
          e.vx = e.dir * 0.78 * stormSurgeAggroMul;
          e.x += e.vx;
          this.collideX(e);
          const pulse = Math.sin(e.anim * 0.06 + e.phase) * 14;
          const hunt = Math.sign((p.x + p.w * 0.5) - (e.x + e.w * 0.5)) * 1.4;
          e.y = e.baseY + pulse + hunt;
          if ((e.anim & 3) === 0) this.spawnCryptTrail(e, "sigil");
        } else if (e.type === 8) {
          if (!e.workerState) {
            e.workerState = "PATROL";
            e.workerStateTimer = SHIELDED_WORKER.patrolFramesMin + ((this.rand01() * (SHIELDED_WORKER.patrolFramesMax - SHIELDED_WORKER.patrolFramesMin + 1)) | 0);
          }
          e.workerStateTimer = Math.max(0, (e.workerStateTimer | 0) - 1);

          const moveSpeed = (e.workerState === "SHIELD_UP" ? 0.46 : (e.workerState === "RECOVER" ? 0.62 : 0.88)) * stormSurgeAggroMul;
          e.vx = e.dir * moveSpeed;
          e.vy += gr;
          if (e.vy > 8.5) e.vy = 8.5;
          this.moveAndCollide(e);

          if (e.onGround) {
            const ax = e.x + (e.dir > 0 ? e.w + 1 : -1);
            const tx = (ax / TILE_SIZE) | 0;
            const ty = ((e.y + e.h + 1) / TILE_SIZE) | 0;
            if (!this.isSolid(this.tileIdAt(tx, ty))) e.dir *= -1;
          }

          if (e.workerState === "PATROL" && e.workerStateTimer <= 0) {
            e.workerState = "SHIELD_UP";
            e.workerStateTimer = SHIELDED_WORKER.shieldUpFrames;
          } else if (e.workerState === "SHIELD_UP" && e.workerStateTimer <= 0) {
            e.workerState = "EXPOSED";
            e.workerStateTimer = SHIELDED_WORKER.exposedFrames;
          } else if (e.workerState === "EXPOSED" && e.workerStateTimer <= 0) {
            e.workerState = "RECOVER";
            e.workerStateTimer = SHIELDED_WORKER.recoverFrames;
          } else if (e.workerState === "RECOVER" && e.workerStateTimer <= 0) {
            e.workerState = "PATROL";
            e.workerStateTimer = SHIELDED_WORKER.patrolFramesMin + ((this.rand01() * (SHIELDED_WORKER.patrolFramesMax - SHIELDED_WORKER.patrolFramesMin + 1)) | 0);
          }
        } else if (e.type === 9) {
          this.updateFrankensteinEnemy(e, p, gr, stormSurgeAggroMul);
        } else {
          const loopT = e.anim * 0.09 + e.phase;
          e.x = e.baseX + Math.cos(loopT) * 12;
          e.y = e.baseY + Math.sin(loopT * 2) * 5;
        }
      } else {
        e.vx = e.dir * ENEMY_SPEED;
        e.vy += gr;
        if (e.vy > 8.5) e.vy = 8.5;
        this.moveAndCollide(e);

        if (e.onGround) {
          const ax = e.x + (e.dir > 0 ? e.w + 1 : -1);
          const tx = (ax / TILE_SIZE) | 0;
          const ty = ((e.y + e.h + 1) / TILE_SIZE) | 0;
          if (!this.isSolid(this.tileIdAt(tx, ty))) e.dir *= -1;
        }
      }

      if (name === "ROBOT" && this.robotPulse.timer > 0) {
        const cx = this.robotPulse.x;
        const cy = this.robotPulse.y;
        const radius = ROBOT_MAGNET_PULSE.radius;
        const ex = e.x + e.w * 0.5;
        const ey = e.y + e.h * 0.5;
        const dx = cx - ex;
        const dy = cy - ey;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist <= radius) {
          let pull = (1 - (dist / radius)) * ROBOT_MAGNET_PULSE.enemyPullStrength;
          pull *= this.robotPulse.phase2Active ? 1.65 : 1.25;

          e.x += (dx / dist) * pull;
          e.y += (dy / dist) * pull * 0.9;
          if (e.type) {
            e.baseX = e.x;
            e.baseY = e.y;
          }

          if (this.robotPulse.phase2Active && dist <= ROBOT_MAGNET_PULSE.enemyKillRadius + 4) {
            if (e.type === 5) continue;
            this.handleSpecialEnemyDefeat(e);
            e.dead = 1;
            latePulseKills++;
            this.spawnEnemyShatter(e, levelTheme);
            this.spawnCoinDrops(e.x + 2, e.y + 2);
            continue;
          }
        }
      }

      if (this.respawnGrace <= 0 && bunnyRocketing && rectsOverlap(p, e)) {
        this.triggerBunnyRocketBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, levelTheme);
        continue;
      }

      if (this.respawnGrace <= 0 && duckDiving && rectsOverlap(p, e)) {
        this.handleSpecialEnemyDefeat(e);
        this.spawnEnemyShatter(e, levelTheme);
        e.dead = 1;
        this.spawnCoinDrops(e.x + 2, e.y + 2);
        p.vy = DUCK_GALE_DIVE.bounceVy;
        this.duckDive.active = 0;
        this.triggerDuckDiveImpactFx(e.x + e.w * 0.5, e.y + e.h * 0.5);
        this.audio.tone(260, 0.05, 0.00, "triangle", 0.04);
        continue;
      }

      if (this.respawnGrace <= 0 && ninjaShadowing && rectsOverlap(p, e)) {
        this.handleSpecialEnemyDefeat(e);
        this.spawnEnemyShatter(e, levelTheme);
        e.dead = 1;
        this.spawnCoinDrops(e.x + 2, e.y + 2);
        this.audio.tone(340, 0.03, 0.00, "triangle", 0.03);
        continue;
      }

      if (this.respawnGrace <= 0 && glitchPhasing && rectsOverlap(p, e)) {
        continue;
      }

      if (this.respawnGrace <= 0 && !ninjaShadowing && !glitchPhasing && rectsOverlap(p, e)) {
        const giantVampire = e.type === 5;
        const shieldedWorker = e.type === 8;
        const frankenstein = e.type === 9;
        const frankenRecover = frankenstein && e.frankState === "RECOVER";
        const shieldUp = shieldedWorker && e.workerState === "SHIELD_UP";
        const exposed = shieldedWorker && e.workerState === "EXPOSED";
        const stompedFromAbove = p.vy > 0 && p.y + p.h - 2 < e.y + e.h * (frankenstein ? FRANKENSTEIN.headStompRatio : 0.55);
        const playerCenterX = p.x + p.w * 0.5;
        const enemyCenterX = e.x + e.w * 0.5;
        const frontHit = shieldedWorker && ((e.dir >= 0 && playerCenterX >= enemyCenterX) || (e.dir < 0 && playerCenterX <= enemyCenterX));

        if (name === "PALADIN" && this.paladinDash.active) {
          if (shieldUp) {
            e.workerState = "EXPOSED";
            e.workerStateTimer = SHIELDED_WORKER.exposedFrames + SHIELDED_WORKER.paladinExposeBonusFrames;
            p.vy = Math.min(p.vy, -0.7);
            this.audio.tone(540, 0.04, 0.00, "triangle", 0.03);
          } else {
            this.handleSpecialEnemyDefeat(e);
            this.spawnEnemyShatter(e, levelTheme);
            e.dead = 1;
            p.vy = Math.min(p.vy, -0.7);
            this.spawnCoinDrops(e.x + 2, e.y + 2);
            this.audio.tone(300, 0.05, 0.00, "square", 0.03);
          }
        } else if (this.holyWard && this.holyWardCooldown <= 0) {
          this.holyWardCooldown = PALADIN_AEGIS.wardHitCooldown;
          p.vx = (p.x < e.x ? -1 : 1) * 1.8;
          p.vy = -2.2;
          this.audio.tone(520, 0.05, 0.00, "triangle", 0.03);
        } else if (shieldUp && frontHit) {
          p.vx = (p.x < e.x ? -1 : 1) * SHIELDED_WORKER.frontBlockKnockbackX;
          p.vy = Math.min(p.vy, SHIELDED_WORKER.frontBlockKnockbackY);
          this.audio.tone(420, 0.04, 0.00, "square", 0.03);
        } else if (e.type && name === "SKELETON" && !giantVampire) {
          this.handleSpecialEnemyDefeat(e);
          this.spawnEnemyShatter(e, levelTheme);
          e.dead = 1;
          this.spawnCoinDrops(e.x + 2, e.y + 2);
          this.audio.tone(180, 0.08);
        } else if (stompedFromAbove && (!shieldedWorker || exposed) && (!frankenstein || frankenRecover)) {
          if (shieldedWorker && e.workerStateTimer > (SHIELDED_WORKER.exposedFrames - SHIELDED_WORKER.perfectWindowFrames)) {
            this.addScore(10);
            this.audio.tone(1120, 0.04, 0.00, "triangle", 0.03);
          }
          this.handleSpecialEnemyDefeat(e);
          this.spawnEnemyShatter(e, levelTheme);
          e.dead = 1;
          p.vy = JUMP_VY * 0.6;
          this.spawnCoinDrops(e.x + 2, e.y + 2);
          this.audio.tone(e.type ? 260 : 220, 0.08);
        } else if (frankenstein) {
          p.vx = (p.x < e.x ? -1 : 1) * FRANKENSTEIN.knockbackX;
          p.vy = FRANKENSTEIN.knockbackY;
          this.audio.tone(130, 0.05, 0.00, "square", 0.04);
          if (!this.tryConsumeGlitchrunnerEchoShield(e.x + e.w * 0.5, e.y + e.h * 0.5)) this.startEnemyDeath(0);
        } else {
          if (!this.tryConsumeGlitchrunnerEchoShield(e.x + e.w * 0.5, e.y + e.h * 0.5)) this.startEnemyDeath(0);
        }
      }

      if (e.y > this.tileRows * TILE_SIZE + 90) e.dead = 1;
    }

    if (spaceMode) {
      for (let i = 0; i < this.enemies.length; i++) {
        const a = this.enemies[i];
        if (a.dead || !a.type) continue;
        for (let j = i + 1; j < this.enemies.length; j++) {
          const b = this.enemies[j];
          if (b.dead || !b.type) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) < 14 && Math.abs(dy) < 9) {
            const push = dx >= 0 ? 0.4 : -0.4;
            a.x += push;
            b.x -= push;
          }
        }
      }
    }

    if (latePulseKills > 0) {
      this.robotPulse.cooldown = Math.max(this.robotPulse.cooldown, ROBOT_MAGNET_PULSE.cooldownFrames + ROBOT_MAGNET_PULSE.enemyKillCooldownFrames);
      this.robotPulse.phase2Notice = ROBOT_MAGNET_PULSE.phaseTwoAnnounceFrames;
      this.robotPulse.killNotice = ROBOT_MAGNET_PULSE.killNoticeFrames;
      this.robotPulse.killCount = Math.max(this.robotPulse.killCount, latePulseKills);
      this.audio.tone(230, 0.05, 0.00, "sawtooth", 0.05);
      this.audio.tone(170, 0.06, 0.04, "triangle", 0.05);
    }

    // Wrap / fall
    if (p.wrapGrace) p.wrapGrace--;
    else if (p.y > this.tileRows * TILE_SIZE + 40) this.wrapToTop();

    this.updateBackgroundActors();

    // Camera
    const tx = p.x + p.w * 0.5 - CANVAS_W * 0.5;
    const ty = p.y + p.h * 0.5 - CANVAS_H * 0.55;
    this.cameraX += (clamp(tx, 0, this.tileCols*TILE_SIZE - CANVAS_W) - this.cameraX) * 0.12;
    this.cameraY += (clamp(ty, 0, this.tileRows*TILE_SIZE - CANVAS_H) - this.cameraY) * 0.10;
  }

  drawSprite(sprite, x, y, scale) {
    const px = x | 0, py = y | 0;
    let current = "";
    for (let r = 0; r < sprite.length; r++) {
      const row = sprite[r];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === ".") continue;
        const col = PALETTE[ch];
        if (col !== current) { current = col; gfx.fillStyle = current; }
        gfx.fillRect(px + i*scale, py + r*scale, scale, scale);
      }
    }
  }

  drawSpaceThruster(enemy) {
    const px = ((enemy.x - this.cameraX) | 0);
    const py = ((enemy.y - this.cameraY) | 0);
    const flicker = ((enemy.anim + ((enemy.phase * 100) | 0)) & 3);
    const flameH = 2 + (flicker >> 1);

    if (enemy.type === 2) {
      gfx.fillStyle = PALETTE.M;
      gfx.fillRect(px + 2, py + 10, 2, flameH + 1);
      gfx.fillRect(px + 6, py + 10, 2, flameH + 1);
      gfx.fillStyle = PALETTE.H;
      gfx.fillRect(px + 2, py + 10, 1, flameH);
      gfx.fillRect(px + 7, py + 10, 1, flameH);
    } else {
      gfx.fillStyle = PALETTE.M;
      gfx.fillRect(px + 4, py + 10, 2, flameH + 1);
      gfx.fillStyle = PALETTE.H;
      gfx.fillRect(px + 4, py + 10, 1, flameH);
    }

    gfx.fillStyle = flicker < 2 ? PALETTE.F : PALETTE.K;
    gfx.fillRect(px + 4, py + 9, 2, 1);
  }

  isBoneCryptMidWeatherActive() {
    if (getThemeForLevel(this.levelIndex) !== "BONECRYPT") return 0;
    const centerTile = ((this.cameraX + CANVAS_W * 0.5) / TILE_SIZE) | 0;
    const startTile = (this.tileCols * BONECRYPT_WEATHER.zoneStartRatio) | 0;
    const endTile = (this.tileCols * BONECRYPT_WEATHER.zoneEndRatio) | 0;
    return centerTile >= startTile && centerTile <= endTile;
  }

  updateBoneCryptWeather() {
    const weather = this.boneCryptWeather;
    if (!weather) return;

    weather.cloudDriftNear += 0.42;
    weather.cloudDriftFar += 0.23;

    if (getThemeForLevel(this.levelIndex) !== "BONECRYPT") {
      weather.rain = [];
      weather.lightning = 0;
      weather.lightningCooldown = 0;
      return;
    }

    const active = this.isBoneCryptMidWeatherActive();
    if (!active) {
      weather.rain = [];
      weather.lightning = 0;
      weather.lightningCooldown = Math.max(0, weather.lightningCooldown - 1);
      return;
    }

    if (weather.lightningCooldown > 0) weather.lightningCooldown--;
    if (weather.lightning > 0) weather.lightning--;
    if (weather.lightning <= 0 && weather.lightningCooldown <= 0 && this.rand01() < BONECRYPT_WEATHER.lightningChance) {
      weather.lightning = BONECRYPT_WEATHER.lightningFrames;
      weather.lightningCooldown = BONECRYPT_WEATHER.lightningCooldownFrames;
    }

    while (weather.rain.length < BONECRYPT_WEATHER.rainTarget) {
      weather.rain.push({
        x: this.rand01() * CANVAS_W,
        y: this.rand01() * CANVAS_H,
        vx: BONECRYPT_WEATHER.rainWind + (this.rand01() - 0.5) * 0.18,
        vy: 2.2 + this.rand01() * 2.0,
        len: 7 + ((this.rand01() * 4) | 0)
      });
    }

    for (let i = 0; i < weather.rain.length; i++) {
      const drop = weather.rain[i];
      drop.x += drop.vx;
      drop.y += drop.vy;
      if (drop.y > CANVAS_H + 10) {
        drop.y = -6 - this.rand01() * 12;
        drop.x = this.rand01() * CANVAS_W;
      }
      if (drop.x < -10) drop.x = CANVAS_W + this.rand01() * 12;
      else if (drop.x > CANVAS_W + 10) drop.x = -this.rand01() * 12;
    }
  }

  drawBoneCryptWeatherBackground(camx) {
    if (!this.isBoneCryptMidWeatherActive()) return;
    const weather = this.boneCryptWeather;
    const nearShift = (((camx * 0.22) + weather.cloudDriftNear) | 0) % (CANVAS_W + 90);
    const farShift = (((camx * 0.12) + weather.cloudDriftFar) | 0) % (CANVAS_W + 120);

    gfx.fillStyle = "#cfd6e512";
    for (let i = -1; i < 4; i++) {
      const x = i * 110 - farShift;
      gfx.fillRect(x + 24, 22, 58, 10);
      gfx.fillRect(x + 40, 18, 34, 8);
    }

    gfx.fillStyle = "#d8deea18";
    for (let i = -1; i < 4; i++) {
      const x = i * 92 - nearShift;
      gfx.fillRect(x + 12, 30, 66, 12);
      gfx.fillRect(x + 34, 24, 30, 8);
    }
  }

  drawBoneCryptWeatherOverlay() {
    if (!this.isBoneCryptMidWeatherActive()) return;
    const weather = this.boneCryptWeather;

    gfx.strokeStyle = "#c4d7ee55";
    for (let i = 0; i < weather.rain.length; i++) {
      const drop = weather.rain[i];
      gfx.beginPath();
      gfx.moveTo(drop.x | 0, drop.y | 0);
      gfx.lineTo((drop.x + drop.vx * 1.7) | 0, (drop.y + drop.len) | 0);
      gfx.stroke();
    }

    if (weather.lightning > 0) {
      const alpha = (weather.lightning / BONECRYPT_WEATHER.lightningFrames) * 0.30;
      gfx.globalAlpha = alpha;
      gfx.fillStyle = "#e9f4ff";
      gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      gfx.globalAlpha = 1;
    }
  }

  drawBackground() {
    drawBackgroundFrame(this, gfx, {
      CANVAS_W,
      CANVAS_H,
      getThemeForLevel
    });
  }

  drawPlayer(px, py) {
    const p = this.player;
    const name = CHARACTERS[this.characterIndex].name;
    const running = Math.abs(p.vx) > 0.2 && p.onGround;
    const alt = ((p.anim >> 4) & 1);

    if (name === "SKELETON") {
      const top = running ? (alt ? SPRITES.playerSkeletonTopRun : SPRITES.playerSkeletonTopIdle) : SPRITES.playerSkeletonTopIdle;
      const bot = running ? (alt ? SPRITES.playerSkeletonBottomRun : SPRITES.playerSkeletonBottomIdle) : SPRITES.playerSkeletonBottomIdle;
      if (p.skeletonCrouch) {
        this.drawSprite(bot, px, py, 1);
      } else {
        this.drawSprite(top, px, py, 1);
        this.drawSprite(bot, px, py + 10, 1);
      }
      const phase2Charged = !!this.skeletonBurst.phase2Charged;
      if (phase2Charged) {
        const pulse = (Math.sin(this.player.anim * 0.18) + 1) * 0.5;
        gfx.globalAlpha = 0.35 + pulse * 0.45;
        gfx.fillStyle = "#ff2a43";
        gfx.fillRect((px + 2) | 0, (py + 2) | 0, 6, 5);
        gfx.fillStyle = "#ffd0d0";
        gfx.fillRect((px + 3) | 0, (py + 3) | 0, 1, 1);
        gfx.fillRect((px + 6) | 0, (py + 3) | 0, 1, 1);
        gfx.globalAlpha = 1;
      }
      if (this.skeletonBurst.flash > 0) {
        gfx.globalAlpha = Math.max(0.2, this.skeletonBurst.flash / SKELETON_BLOOD_BURST.flashFrames);
        gfx.strokeStyle = "#c11f3b";
        gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);
        gfx.globalAlpha = 1;
      }
      return;
    }

    if (name === "DUCK") {
      const spr = p.quackFrame ? SPRITES.playerDuckQuack : (running ? (alt ? SPRITES.playerDuckRun : SPRITES.playerDuckIdle) : SPRITES.playerDuckIdle);
      this.drawSprite(spr, px, py, 1);
      return;
    }

    const anim = CHARACTERS[this.characterIndex].anim;
    const spr = running ? (alt ? SPRITES[anim[1]] : SPRITES[anim[0]]) : SPRITES[anim[0]];
    this.drawSprite(spr, px, py, 1);

    if (name === "ROBOT") {
      const pulseReady = this.robotPulse.timer <= 0 && this.robotPulse.cooldown <= 0;
      const phase2Ratio = ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold > 0 ? (this.score / ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold) : 0;
      const phase2Near = phase2Ratio >= 0.8 && phase2Ratio < 1;
      const phase2Ready = this.score >= ROBOT_MAGNET_PULSE.phaseTwoScoreThreshold;
      const phase1Ready = pulseReady && !phase2Ready;
      if (phase1Ready) {
        const readyPulse = (Math.sin(this.player.anim * 0.18) + 1) * 0.5;
        gfx.globalAlpha = 0.10 + readyPulse * 0.12;
        gfx.fillStyle = "#3be7ff";
        gfx.fillRect((px + 2) | 0, (py + 2) | 0, 6, 5);
        gfx.globalAlpha = 1;
      }
      if (pulseReady && phase2Near) {
        const nearPulse = (Math.sin(this.player.anim * 0.24) + 1) * 0.5;
        gfx.globalAlpha = 0.12 + nearPulse * 0.20;
        gfx.fillStyle = "#73f1ff";
        gfx.fillRect((px + 2) | 0, (py + 2) | 0, 6, 5);
        gfx.globalAlpha = 1;
      }
      if (pulseReady && phase2Ready) {
        const pulse = (Math.sin(this.player.anim * 0.20) + 1) * 0.5;
        gfx.globalAlpha = 0.35 + pulse * 0.45;
        gfx.fillStyle = "#ff2a43";
        gfx.fillRect((px + 2) | 0, (py + 2) | 0, 6, 5);
        gfx.fillStyle = "#ffd0d0";
        gfx.fillRect((px + 3) | 0, (py + 3) | 0, 1, 1);
        gfx.fillRect((px + 6) | 0, (py + 3) | 0, 1, 1);
        gfx.globalAlpha = 1;
      }

      if (this.robotPulse.timer > 0 && this.robotPulse.phase2Active) {
        const activePulse = (Math.sin(this.player.anim * 0.28) + 1) * 0.5;
        gfx.globalAlpha = 0.35 + activePulse * 0.35;
        gfx.strokeStyle = "#8ef6ff";
        gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);
        gfx.globalAlpha = 1;
      }
    }

    if (name === "PALADIN" && (this.paladinDash.active || this.paladinDash.afterglow > 0)) {
      gfx.globalAlpha = this.paladinDash.active ? 0.65 : Math.max(0.2, this.paladinDash.afterglow / PALADIN_AEGIS.afterglowFrames);
      gfx.strokeStyle = this.holyWard ? "#f3d44a" : "#9fd8ff";
      gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);
      gfx.globalAlpha = 1;
    }

    if (name === "NINJA" && (this.ninjaShadow.active || this.ninjaShadow.afterglow > 0)) {
      gfx.globalAlpha = this.ninjaShadow.active ? 0.6 : Math.max(0.2, this.ninjaShadow.afterglow / NINJA_SHADOW_STEP.afterglowFrames);
      gfx.strokeStyle = this.ninjaShadow.active ? "#8a6cff" : "#4ef3ff";
      gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);
      gfx.globalAlpha = 1;
    }

    if (name === "GLITCHRUNNER" && (this.glitchPhase.active || this.glitchPhase.afterglow > 0)) {
      gfx.globalAlpha = this.glitchPhase.active ? 0.62 : Math.max(0.2, this.glitchPhase.afterglow / GLITCHRUNNER_PHASE.afterglowFrames);
      gfx.strokeStyle = this.glitchPhase.active ? "#57e8ff" : "#9a7cff";
      gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);
      gfx.globalAlpha = 1;
    }

    if (name === "GLITCHRUNNER" && this.glitchPhase.echoPulse > 0) {
      const t = this.glitchPhase.echoPulse / GLITCHRUNNER_PHASE.echoFlashFrames;
      const fx = (this.glitchPhase.echoX - this.cameraX) | 0;
      const fy = (this.glitchPhase.echoY - this.cameraY) | 0;
      const r = Math.max(6, (22 * (1.8 - t * 0.7)) | 0);
      gfx.globalAlpha = Math.max(0.2, t * 0.72);
      gfx.fillStyle = "#57e8ff";
      gfx.beginPath();
      gfx.arc(fx, fy, r, 0, 6.283);
      gfx.fill();
      gfx.globalAlpha = Math.max(0.16, t * 0.48);
      gfx.fillStyle = "#9a7cff";
      gfx.beginPath();
      gfx.arc(fx, fy, Math.max(3, (r * 0.52) | 0), 0, 6.283);
      gfx.fill();
      gfx.globalAlpha = 1;
    }

    if (name === "SHADOWRUNNER" && (this.hackerSkill.globalLock > 0 || this.hackerSkill.swarm.active || this.hackerSkill.spike.flash > 0)) {
      const lockPulse = (Math.sin(this.player.anim * 0.22) + 1) * 0.5;
      gfx.globalAlpha = this.hackerSkill.swarm.active ? 0.62 : (this.hackerSkill.spike.flash > 0 ? 0.56 : (0.26 + lockPulse * 0.28));
      gfx.strokeStyle = this.hackerSkill.swarm.active ? "#ffd95e" : "#7dff3b";
      gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);
      gfx.globalAlpha = 1;
    }

    if (name === "SHADOWRUNNER" && this.hackerSkill.spike.flash > 0) {
      const t = this.hackerSkill.spike.flash / Math.max(1, HACKER_SKILLS.zeroDaySpike.flashFrames);
      const fx = (((this.hackerSkill.spike.x0 + this.hackerSkill.spike.x1) * 0.5) - this.cameraX) | 0;
      const fy = (((this.hackerSkill.spike.y0 + this.hackerSkill.spike.y1) * 0.5) - this.cameraY) | 0;
      const r = Math.max(6, (22 * (1.8 - t * 0.7)) | 0);
      gfx.globalAlpha = Math.max(0.2, t * 0.72);
      gfx.fillStyle = "#ffd95e";
      gfx.beginPath();
      gfx.arc(fx, fy, r, 0, 6.283);
      gfx.fill();
      gfx.globalAlpha = Math.max(0.16, t * 0.48);
      gfx.fillStyle = "#7dff3b";
      gfx.beginPath();
      gfx.arc(fx, fy, Math.max(3, (r * 0.52) | 0), 0, 6.283);
      gfx.fill();
      gfx.globalAlpha = 1;
    }

    if (name === "BUNNY" && (this.bunnyRocket.active || this.bunnyRocket.afterglow > 0)) {
      gfx.globalAlpha = this.bunnyRocket.active ? 0.65 : Math.max(0.2, this.bunnyRocket.afterglow / BUNNY_CARROT_ROCKET.afterglowFrames);
      gfx.strokeStyle = this.bunnyRocket.active ? "#ff7f2a" : "#ffd95e";
      gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);
      gfx.globalAlpha = 1;
    }

    if (name === "DUCK" && (this.duckDive.active || this.duckDive.afterglow > 0)) {
      gfx.globalAlpha = this.duckDive.active ? 0.65 : Math.max(0.2, this.duckDive.afterglow / DUCK_GALE_DIVE.afterglowFrames);
      gfx.strokeStyle = this.duckDive.active ? "#7ec8ff" : "#b8f1ff";
      gfx.strokeRect((px - 2) | 0, (py - 2) | 0, p.w + 4, p.h + 4);

      if (this.duckDive.active) {
        gfx.globalAlpha = 0.62;
        gfx.fillStyle = "#9fe7ff";
        const cx = (px + p.w * 0.5) | 0;
        gfx.fillRect((cx - 4) | 0, (py + p.h - 1) | 0, 8, 8);
        gfx.fillRect((cx - 2) | 0, (py + p.h + 7) | 0, 4, 8);
        gfx.globalAlpha = 0.48;
        gfx.fillStyle = "#dff8ff";
        gfx.fillRect((cx - 1) | 0, (py + p.h + 1) | 0, 2, 14);
      }
      gfx.globalAlpha = 1;
    }

    if (name === "DUCK" && this.duckDive.flash > 0) {
      const start = this.duckDive.flashKind === 1;
      const maxT = start ? DUCK_GALE_DIVE.startFlashFrames : DUCK_GALE_DIVE.impactFlashFrames;
      const baseR = start ? DUCK_GALE_DIVE.startRadius : DUCK_GALE_DIVE.impactRadius;
      const t = this.duckDive.flash / Math.max(1, maxT);
      const r = Math.max(6, (baseR * (2.1 - t * 0.8)) | 0);
      const fx = (this.duckDive.flashX - this.cameraX) | 0;
      const fy = (this.duckDive.flashY - this.cameraY) | 0;
      gfx.globalAlpha = Math.max(0.28, t * (start ? 0.72 : 0.88));
      gfx.fillStyle = start ? "#b8f1ff" : "#7ec8ff";
      gfx.beginPath();
      gfx.arc(fx, fy, r, 0, 6.283);
      gfx.fill();
      gfx.globalAlpha = Math.max(0.22, t * 0.64);
      gfx.fillStyle = start ? "#e9fdff" : "#dff8ff";
      gfx.beginPath();
      gfx.arc(fx, fy, Math.max(3, (r * 0.52) | 0), 0, 6.283);
      gfx.fill();
      gfx.globalAlpha = Math.max(0.18, t * 0.52);
      gfx.fillStyle = "#ffffff";
      gfx.fillRect((fx - 1) | 0, (fy - (r + 2)) | 0, 2, 4);
      gfx.fillRect((fx - 1) | 0, (fy + r - 2) | 0, 2, 4);
      gfx.fillRect((fx - (r + 2)) | 0, (fy - 1) | 0, 4, 2);
      gfx.fillRect((fx + r - 2) | 0, (fy - 1) | 0, 4, 2);
      gfx.globalAlpha = 1;
    }
  }

  drawTitleScreen() {
    const t = this.titleScreen;
    gfx.setTransform(1,0,0,1,0,0);

    if (t.mode === "jukebox") {
      this.drawJukeboxScreen();
      return;
    }

    gfx.fillStyle = "#040708";
    gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const nearDrift = (t.frame * 0.18) % CANVAS_W;
    const farDrift = (t.frame * 0.08) % CANVAS_W;
    gfx.fillStyle = "#0c1618";
    for (let i = -1; i < 5; i++) {
      const x = ((i * 88) - farDrift) | 0;
      gfx.fillRect(x, 88, 40, 92);
      gfx.fillRect((x + 28) | 0, 102, 22, 78);
    }
    gfx.fillStyle = "#0f1d1f";
    for (let i = -1; i < 6; i++) {
      const x = ((i * 62) - nearDrift) | 0;
      gfx.fillRect(x, 108, 24, 72);
      gfx.fillRect((x + 14) | 0, 120, 18, 60);
    }

    const runner = t.demoRunner;
    if (runner) {
      const px = runner.x | 0;
      const py = runner.y | 0;

      if (runner.warpFlash > 0 || runner.state === "warp") {
        const flashA = runner.warpFlash > 0 ? Math.min(1, runner.warpFlash / 14) : 0.18;
        gfx.globalAlpha = flashA * 0.55;
        gfx.fillStyle = "#7ef7be";
        gfx.fillRect((px + 1) | 0, ((runner.roofY - 6) | 0), 2, ((runner.floorY - runner.roofY + 2) | 0));
        gfx.globalAlpha = flashA * 0.40;
        gfx.fillStyle = "#b9ffe0";
        gfx.fillRect((px + 2) | 0, ((runner.roofY - 3) | 0), 1, ((runner.floorY - runner.roofY - 1) | 0));
      }

      gfx.globalAlpha = 0.34;
      gfx.fillStyle = "#8be8c0";
      const runAlt = ((runner.anim >> 2) & 1) === 0;
      gfx.fillRect(px, py, 4, 1);
      gfx.fillRect((px + 1) | 0, (py - 2) | 0, 2, 2);
      if (runner.state === "run") {
        gfx.fillRect(px, (py + 1) | 0, 1, 1);
        gfx.fillRect((px + 3) | 0, (py + 1 + (runAlt ? 0 : 1)) | 0, 1, 1);
      } else if (runner.state === "jump") {
        gfx.fillRect((px + 1) | 0, (py + 1) | 0, 1, 1);
        gfx.fillRect((px + 2) | 0, (py + 1) | 0, 1, 1);
      } else {
        gfx.fillRect((px + 1) | 0, (py + 1) | 0, 1, 1);
      }
      gfx.globalAlpha = 1;
    }

    for (let i = 0; i < t.fireParticles.length; i++) {
      const p = t.fireParticles[i];
      const lifeP = p.life ? (p.t / p.life) : 0;
      gfx.globalAlpha = Math.max(0.08, Math.min(0.85, lifeP * 1.05));
      gfx.fillStyle = p.kind === 0 ? (lifeP > 0.5 ? "#6df79b" : "#2fa967") : (lifeP > 0.5 ? "#bfffd9" : "#5cd891");
      const s = p.size + (lifeP > 0.55 ? 1 : 0);
      gfx.fillRect((p.x - (s >> 1)) | 0, (p.y - s) | 0, s, s + 1);
    }
    gfx.globalAlpha = 1;

    this.drawTitleScoreMessages();

    if (t.glitchFrames > 0) {
      gfx.globalAlpha = 0.09;
      gfx.fillStyle = "#5affb3";
      gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      gfx.globalAlpha = 1;
    }

    const glitchX = t.glitchFrames > 0 ? (((this.rand01() * 4) | 0) - 2) : 0;
    const glitchY = t.glitchFrames > 0 ? (((this.rand01() * 4) | 0) - 2) : 0;

    const pulseP = t.logoPulseFrames > 0 ? (t.logoPulseFrames / 52) : 0;
    const pulseScale = 1 + pulseP * 0.12;
    const pulseGlow = 0.16 + pulseP * 0.26;

    gfx.font = "bold 36px monospace";
    gfx.globalAlpha = pulseGlow;
    gfx.fillStyle = "#67f4b0";
    const glowTitle = "ECHOFALL";
    const glowW = gfx.measureText(glowTitle).width;
    const glowX = ((CANVAS_W - glowW * pulseScale) * 0.5 + glitchX) | 0;
    gfx.setTransform(pulseScale, 0, 0, pulseScale, glowX, (48 + glitchY) | 0);
    gfx.fillText(glowTitle, 0, 0);

    gfx.setTransform(1,0,0,1,0,0);
    gfx.globalAlpha = 1;
    gfx.font = "bold 36px monospace";
    gfx.fillStyle = "#d8fff0";
    const mainTitle = "ECHOFALL";
    const titleW = gfx.measureText(mainTitle).width;
    gfx.fillText(mainTitle, ((CANVAS_W - titleW) * 0.5 + glitchX) | 0, (52 + glitchY) | 0);

    gfx.font = "bold 16px monospace";
    gfx.fillStyle = "#7de4b8";
    const subTitle = "PROTOCOL";
    const subW = gfx.measureText(subTitle).width;
    gfx.fillText(subTitle, ((CANVAS_W - subW) * 0.5 - glitchX) | 0, (70 - glitchY) | 0);

    if (t.mode === "main") {
      const items = this.titleMainItems();
      gfx.font = "12px monospace";
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const selected = i === t.selected;
        const label = selected ? ("[ " + item.label + " ]") : item.label;
        const width = gfx.measureText(label).width;
        gfx.fillStyle = !item.enabled ? "#557166" : (selected ? "#bfffd9" : "#d2e7de");
        gfx.fillText(label, ((CANVAS_W - width) * 0.5) | 0, (108 + i * 15) | 0);
      }
    } else if (t.mode === "level-select") {
      gfx.font = "12px monospace";
      gfx.fillStyle = "#bfffd9";
      const head = "LEVEL SELECT";
      gfx.fillText(head, ((CANVAS_W - gfx.measureText(head).width) * 0.5) | 0, 108);
      gfx.fillStyle = "#e8fff4";
      gfx.font = "10px monospace";
      const levelLabel = ("< " + (LEVEL_NAMES[t.levelSelectIndex] || ("LEVEL " + (t.levelSelectIndex + 1))) + " >");
      gfx.fillText(levelLabel, ((CANVAS_W - gfx.measureText(levelLabel).width) * 0.5) | 0, 126);
      const hint = "LEFT/RIGHT PICK  ENTER START  ESC BACK";
      gfx.fillStyle = "#a5cbb9";
      gfx.fillText(hint, ((CANVAS_W - gfx.measureText(hint).width) * 0.5) | 0, 154);
    } else {
      const options = [
        "MUTE: " + (this.audio.muted ? "ON" : "OFF"),
        "MUSIC: " + (((this.audio.musicVolume * 100) + 0.5) | 0) + "%",
        "JUKEBOX",
        "BACK"
      ];
      const optionStartY = 120;
      const optionStepY = 12;
      gfx.font = "12px monospace";
      gfx.fillStyle = "#bfffd9";
      const head = "OPTIONS";
      gfx.fillText(head, ((CANVAS_W - gfx.measureText(head).width) * 0.5) | 0, 102);
      for (let i = 0; i < options.length; i++) {
        const selected = i === t.optionSelected;
        const text = selected ? ("[ " + options[i] + " ]") : options[i];
        gfx.fillStyle = selected ? "#e8fff4" : "#bddfd0";
        gfx.fillText(text, ((CANVAS_W - gfx.measureText(text).width) * 0.5) | 0, (optionStartY + i * optionStepY) | 0);
      }
    }

    gfx.fillStyle = "#9ab7aa";
    gfx.font = "9px monospace";
    const footer = "ARROWS MOVE  ENTER SELECT  ESC BACK  X MUTE";
    gfx.fillText(footer, ((CANVAS_W - gfx.measureText(footer).width) * 0.5) | 0, 174);
  }

  drawJukeboxScreen() {
    const t = this.titleScreen;
    const j = t.jukebox;
    const list = j.themes;
    gfx.setTransform(1,0,0,1,0,0);

    const pulse = (Math.sin(j.wavePhase * 0.6) + 1) * 0.5;
    const specialSelected = JUKEBOX_SPECIAL_TRACK_KEYS.includes(list[j.selected]);
    const baseDark = specialSelected ? "#13070e" : "#05070f";
    const gradTop = specialSelected ? "#2a0f2d" : "#0a1020";
    const gradBottom = specialSelected ? "#120617" : "#05070f";
    const cyan = specialSelected ? "#6fd8ff" : "#57e8ff";
    const magenta = specialSelected ? "#ff7db8" : "#d95cff";
    const lime = specialSelected ? "#ffd36b" : "#7dff9b";
    const panelBg = specialSelected ? "#170d1dcc" : "#031018";
    const panelStroke = specialSelected ? "#ff7db8" : "#57e8ff";
    const headColor = specialSelected ? "#ffd6ef" : "#e8fff4";
    const subColor = specialSelected ? "#ffd1a1" : "#b8ffe2";
    const normalItem = specialSelected ? "#d4b9cf" : "#97c9bb";

    gfx.fillStyle = baseDark;
    gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const grad = gfx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, gradTop);
    grad.addColorStop(1, gradBottom);
    gfx.globalAlpha = 0.9;
    gfx.fillStyle = grad;
    gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    gfx.globalAlpha = 0.18 + pulse * 0.10;
    gfx.fillStyle = cyan;
    gfx.fillRect(0, 82, CANVAS_W, 2);
    gfx.globalAlpha = 0.12 + (1 - pulse) * 0.12;
    gfx.fillStyle = magenta;
    gfx.fillRect(0, 85, CANVAS_W, 1);

    gfx.globalAlpha = 0.18;
    gfx.strokeStyle = cyan;
    for (let y = 90; y < CANVAS_H; y += 8) {
      const wobble = Math.sin(j.wavePhase + y * 0.04) * 4;
      gfx.beginPath();
      gfx.moveTo(0, y + wobble);
      gfx.lineTo(CANVAS_W, y - wobble);
      gfx.stroke();
    }
    gfx.globalAlpha = 0.16;
    gfx.strokeStyle = magenta;
    for (let x = -20; x <= CANVAS_W + 20; x += 20) {
      gfx.beginPath();
      gfx.moveTo(x + Math.sin(j.wavePhase2 + x * 0.03) * 3, 90);
      gfx.lineTo(CANVAS_W * 0.5 + (x - CANVAS_W * 0.5) * 0.25, CANVAS_H);
      gfx.stroke();
    }

    for (let i = 0; i < j.shards.length; i++) {
      const s = j.shards[i];
      const lifeP = s.life ? (s.t / s.life) : 1;
      gfx.save();
      gfx.translate(s.x, s.y);
      gfx.rotate(s.rot);
      gfx.globalAlpha = Math.max(0.08, lifeP * 0.35);
      gfx.fillStyle = (i & 1) ? cyan : magenta;
      gfx.fillRect(-2, -2, 4, 4);
      gfx.restore();
    }

    gfx.globalAlpha = 0.72;
    gfx.fillStyle = panelBg;
    gfx.fillRect(64, 44, 192, 108);
    gfx.globalAlpha = 1;
    gfx.strokeStyle = panelStroke;
    gfx.strokeRect(64.5, 44.5, 191, 107);

    const glowP = j.glow > 0 ? (j.glow / 24) : 0;
    if (glowP > 0) {
      gfx.globalAlpha = 0.12 + glowP * 0.20;
      gfx.fillStyle = lime;
      gfx.fillRect(64, 44, 192, 108);
      gfx.globalAlpha = 1;
    }

    gfx.font = "bold 18px monospace";
    gfx.fillStyle = headColor;
    const head = "JUKEBOX";
    gfx.fillText(head, ((CANVAS_W - gfx.measureText(head).width) * 0.5) | 0, 32);

    gfx.font = "10px monospace";
    gfx.fillStyle = subColor;
    const now = j.current >= 0 && list[j.current] ? this.jukeboxTrackLabel(list[j.current]) : "NONE";
    const nowText = "NOW PLAYING: " + now;
    gfx.fillText(nowText, ((CANVAS_W - gfx.measureText(nowText).width) * 0.5) | 0, 56);

    const rowStart = Math.max(0, (j.selected - 3) | 0);
    const rowEnd = Math.min(list.length, rowStart + 7);
    gfx.font = "11px monospace";
    for (let i = rowStart; i < rowEnd; i++) {
      const selected = i === j.selected;
      const playing = i === j.current;
      const prefix = selected ? "> " : "  ";
      const suffix = playing ? " *" : "";
      const text = prefix + this.jukeboxTrackLabel(list[i]) + suffix;
      gfx.fillStyle = selected ? headColor : (playing ? lime : normalItem);
      gfx.fillText(text, 80, 74 + (i - rowStart) * 11);
    }

    gfx.font = "9px monospace";
    gfx.fillStyle = "#9ab7aa";
    const footer = "UP/DOWN SELECT  LEFT/RIGHT CYCLE  ENTER PLAY  ESC BACK";
    gfx.fillText(footer, ((CANVAS_W - gfx.measureText(footer).width) * 0.5) | 0, 174);
    gfx.globalAlpha = 1;
  }

  render() {
    if (this.gameState === "TITLE") {
      this.drawTitleScreen();
      return;
    }

    let shakeX = 0;
    let shakeY = 0;
    if (this.gameOverCinematic.active && this.gameOverCinematic.shake > 0.25) {
      shakeX = ((this.rand01() * 2 - 1) * this.gameOverCinematic.shake) | 0;
      shakeY = ((this.rand01() * 2 - 1) * this.gameOverCinematic.shake * 0.75) | 0;
    }
    gfx.setTransform(1,0,0,1,shakeX,shakeY);
    this.drawBackground();

    const t = ((this.player.anim >> 3) % 3);
    const theme = getThemeForLevel(this.levelIndex);
    drawWorldLayer(this, gfx, { TILE_SIZE, CANVAS_W, CANVAS_H, PALETTE, SPRITES, theme, t });
    drawFxLayer(this, gfx, { PALETTE, SPRITES, ONEUP_RADIAL_BURST, RELIC_PICKUP_FX, theme });

    drawEnemyLayer(this, gfx, { theme, levelName: LEVEL_NAMES[this.levelIndex] });
    drawPlayerAndEffects(this, gfx, { SPRITES, BUNNY_CARROT_ROCKET });

    drawHudAndNotices(this, gfx, {
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
    });

    this.drawTouchControlsOverlay();
  }
}

const game = new Game();

if (typeof globalThis !== "undefined") {
  globalThis.__ECHOFALL_TEST_API__ = {
    getGame: () => game,
    getSnapshot: () => ({
      gameState: game.gameState,
      isPaused: !!game.isPaused,
      levelIndex: game.levelIndex,
      score: game.score,
      lives: game.lives,
      coins: game.coins,
      player: game.player
        ? {
            x: game.player.x,
            y: game.player.y,
            vx: game.player.vx,
            vy: game.player.vy,
            onGround: !!game.player.onGround
          }
        : null,
      robotPulse: {
        timer: game.robotPulse.timer,
        cooldown: game.robotPulse.cooldown
      }
    }),
    startPlaying: () => {
      game.gameState = "PLAYING";
      game.isPaused = 0;
      return game.gameState;
    },
    resetLevel: () => {
      game.loadLevel(game.levelIndex | 0);
      game.isPaused = 0;
      return game.levelIndex;
    },
    runFrames: (count = 1) => {
      const frames = Math.max(1, count | 0);
      for (let i = 0; i < frames; i++) {
        if (!game.isPaused) game.step();
      }
      return frames;
    },
    setKey: (code, isDown) => {
      game.keyDown[code] = isDown ? 1 : 0;
      return !!game.keyDown[code];
    },
    triggerJump: () => {
      game.keyDown.Space = 1;
      game.jumpBuffer = JUMP_BUFFER_FRAMES;
      if (!game.isPaused) game.step();
      game.keyDown.Space = 0;
      return game.player ? game.player.vy : 0;
    },
    selectCharacter: (name) => {
      const target = String(name || "").toUpperCase();
      const idx = CHARACTERS.findIndex((c) => (c && c.name ? c.name.toUpperCase() : "") === target);
      if (idx < 0) return false;
      game.characterIndex = idx;
      game.robotPulse.timer = 0;
      game.robotPulse.cooldown = 0;
      return true;
    },
    resetPlayerToSpawn: () => {
      if (!game.player) return null;
      game.player.x = game.levelSpawnX;
      game.player.y = game.levelSpawnY;
      game.player.vx = 0;
      game.player.vy = 0;
      game.player.onGround = 1;
      return {
        x: game.player.x,
        y: game.player.y
      };
    },
    triggerSkill: () => {
      const snap = () => ({
        robotPulseTimer: game.robotPulse.timer,
        robotPulseCooldown: game.robotPulse.cooldown,
        rangerGrappleCooldown: game.rangerGrapple.cooldown,
        rangerGrappleActive: game.rangerGrapple.active,
        paladinDashCooldown: game.paladinDash.cooldown,
        paladinDashActive: game.paladinDash.active,
        duckDiveCooldown: game.duckDive.cooldown,
        duckDiveActive: game.duckDive.active,
        bunnyRocketCharges: game.bunnyRocket.charges,
        bunnyRocketActive: game.bunnyRocket.active,
        ninjaShadowCooldown: game.ninjaShadow.cooldown,
        ninjaShadowActive: game.ninjaShadow.active,
        glitchPhaseCooldown: game.glitchPhase.cooldown,
        glitchPhaseActive: game.glitchPhase.active,
        forkCooldown: game.hackerSkill.fork.cooldown,
        skeletonBurstCooldown: game.skeletonBurst.cooldown,
        skeletonBurstFlash: game.skeletonBurst.flash
      });
      const before = snap();
      game.tryActivateCharacterSkill();
      const after = snap();
      return {
        characterName: CHARACTERS[game.characterIndex] ? CHARACTERS[game.characterIndex].name : "",
        activated: Object.keys(before).some((k) => before[k] !== after[k]),
        before,
        after,
        robotPulseTimer: game.robotPulse.timer,
        robotPulseCooldown: game.robotPulse.cooldown
      };
    },
    clearInput: () => {
      game.keyDown = {};
      game.jumpBuffer = 0;
    }
  };
}

let last = performance.now();
let acc = 0;
let loopErrorShown = 0;

const loop = (now) => {
  try {
    acc += Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.isPaused) {
      acc = 0;
    } else {
      while (acc >= FIXED_DT) {
        game.step();
        acc -= FIXED_DT;
      }
    }
    game.render();
    loopErrorShown = 0;
  } catch (err) {
    acc = 0;
    if (!loopErrorShown) {
      loopErrorShown = 1;
      const msg = err && err.message ? err.message : String(err);
      console.error("Game loop runtime error:", err);
      game.teleportNotice = "RUNTIME ERROR: " + msg;
      game.teleportNoticeTimer = 180;
    }
    try {
      game.render();
    } catch (_) {
    }
  } finally {
    requestAnimationFrame(loop);
  }
};

requestAnimationFrame(loop);

