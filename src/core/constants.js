import { LEVEL_THEMES } from "../levels/index.js";

const CANVAS_W = 320, CANVAS_H = 180, TILE_SIZE = 10, FIXED_DT = 1 / 60;
const PLAYER_AX = 0.22, PLAYER_MAX_VX = 2.2, COYOTE_FRAMES = 7, JUMP_BUFFER_FRAMES = 7;
const ENEMY_SPEED = 1.0, JUMP_VY = -5.4;
const ENEMY_DEATH_SHATTER = {
  chunkSizeMin: 2,
  chunkSizeMax: 3,
  burstSpeedMin: 1.2,
  burstSpeedMax: 3.4,
  upwardLiftMin: 0.8,
  upwardLiftMax: 2.0,
  lateralJitter: 0.6,
  pieceLifeMin: 24,
  pieceLifeMax: 42,
  deathFramesMin: 30,
  deathFramesMax: 42,
  gravityMul: 0.45,
  drag: 0.992
};
const LAVA_DEATH_FIRE = {
  particleCount: 64,
  deathFrames: 46,
  riseSpeedMin: 1.2,
  riseSpeedMax: 2.8,
  lateralBurst: 1.5,
  lifeMin: 16,
  lifeMax: 30,
  gravity: 0.10,
  drag: 0.965,
  jitter: 0.18
};
const ONEUP_RADIAL_BURST = {
  ringLife: 28,
  ringRadiusStart: 3,
  ringRadiusEnd: 28,
  particleCount: 28,
  particleLifeMin: 18,
  particleLifeMax: 30,
  particleSpeedMin: 1.1,
  particleSpeedMax: 2.6,
  particleDrag: 0.95,
  particleGravity: 0.04
};
const RELIC_PICKUP_FX = {
  ringLife: 24,
  ringRadiusStart: 4,
  ringRadiusEnd: 26,
  particleCount: 14,
  particleLifeMin: 16,
  particleLifeMax: 28,
  particleSpeedMin: 0.8,
  particleSpeedMax: 2.2,
  particleDrag: 0.94,
  particleGravity: 0.03,
  floatLife: 34,
  flashFrames: 10
};
const ROBOT_MAGNET_PULSE = {
  durationFrames: 72,
  cooldownFrames: 230,
  enemyKillCooldownFrames: 150,
  radius: 64,
  pullStrength: 0.34,
  enemyPullStrength: 0.52,
  enemyKillRadius: 24,
  pickupPullStrength: 0.32,
  pickupCollectRadius: 8,
  phaseTwoScoreThreshold: 50,
  phaseTwoAnnounceFrames: 74,
  killNoticeFrames: 42,
  ringFlashFrames: 18
};
const RANGER_GRAPPLE = {
  rangeTiles: 12,
  cooldownFrames: 86,
  pullAccel: 0.82,
  maxPullSpeed: 4.2,
  maxHoldFrames: 26,
  snapDistance: 7,
  ringFlashFrames: 12
};
const PALADIN_AEGIS = {
  dashFrames: 16,
  cooldownFrames: 92,
  dashSpeed: 4.2,
  afterglowFrames: 16,
  wardHitCooldown: 72
};
const DUCK_GALE_DIVE = {
  durationFrames: 18,
  cooldownFrames: 94,
  diveSpeed: 5.1,
  bounceVy: -2.6,
  afterglowFrames: 14,
  startFlashFrames: 14,
  impactFlashFrames: 18,
  startRadius: 16,
  impactRadius: 28
};
const NINJA_SHADOW_STEP = {
  dashFrames: 14,
  cooldownFrames: 108,
  dashSpeed: 4.6,
  afterglowFrames: 14,
  airLiftVy: -1.8,
  trailSpawnEvery: 2,
  overdriveCoinCost: 10
};
const BUNNY_CARROT_ROCKET = {
  durationFrames: 28,
  launchVx: 3.2,
  launchVy: -4.7,
  driftAccel: 0.22,
  maxDriftVx: 3.6,
  afterglowFrames: 16,
  trailSpawnEvery: 2,
  maxCharges: 2,
  rechargeFrames: 176,
  burstRadius: 18,
  burstFlashFrames: 12
};
const SKELETON_BLOOD_BURST = {
  cooldownFrames: 120,
  flashFrames: 14,
  shotLifeMin: 34,
  shotLifeMax: 48,
  shotSpeedMin: 2.7,
  shotSpeedMax: 3.6,
  gravity: 0.11,
  radius: 3.6,
  phaseTwoRadiusMul: 1.85,
  phaseTwoSpeedMul: 1.35,
  phaseTwoExtraShots: 10,
  phaseTwoNoticeFrames: 72,
  phaseTwoPierce: 4,
  phaseTwoRechargeFrames: 210
};
const GLITCHRUNNER_PHASE = {
  dashFrames: 10,
  cooldownFrames: 84,
  dashSpeed: 5.1,
  afterglowFrames: 14,
  trailSpawnEvery: 2,
  echoRechargeFrames: 360,
  echoFlashFrames: 24
};
const HACKER_SKILLS = {
  globalLockFrames: 10,
  forkBomb: {
    cooldownFrames: 84,
    packetCount: 4,
    speed: 2.9,
    homingAccel: 0.24,
    turnDrag: 0.92,
    lifeFrames: 58,
    hitRadius: 9,
    chainCount: 1
  },
  zeroDaySpike: {
    cooldownFrames: 110,
    rangeTiles: 13,
    height: 16,
    flashFrames: 16
  },
  rootkitSwarm: {
    cooldownFrames: 180,
    durationFrames: 180,
    orbitRadius: 18,
    orbitSpeed: 0.22,
    hitRadius: 11,
    hitCooldownFrames: 20
  }
};
const SHIELDED_WORKER = {
  shieldUpFrames: 90,
  exposedFrames: 45,
  recoverFrames: 36,
  patrolFramesMin: 96,
  patrolFramesMax: 160,
  perfectWindowFrames: 18,
  paladinExposeBonusFrames: 30,
  frontBlockKnockbackX: 1.8,
  frontBlockKnockbackY: -2.0
};
const FRANKENSTEIN = {
  patrolSpeed: 0.56,
  windupSpeed: 0.16,
  slamSpeed: 1.95,
  recoverSpeed: 0.22,
  triggerRange: 58,
  verticalAwareness: 22,
  windupFrames: 30,
  slamFrames: 24,
  recoverFrames: 46,
  headStompRatio: 0.30,
  knockbackX: 2.6,
  knockbackY: -2.7
};
const CONDUCTOR_CORE = {
  durationFrames: 360,
  cooldownFrames: 480,
  magnetRadius: 42,
  magnetPullAccel: 0.26,
  noticeFrames: 74,
  pulseFrames: 26,
  robotStackCapMul: 1.6
};
const BAT_COMPANION = {
  durationFrames: 1240,
  orbitRadius: 13,
  orbitSpeed: 0.13,
  chaseRange: 220,
  chaseAccel: 0.34,
  chaseMaxSpeed: 4.5,
  fallbackAccel: 0.18,
  fallbackMaxSpeed: 2.2,
  returnFrames: 34,
  returnAccel: 0.42,
  returnMaxSpeed: 4.9,
  returnCatchRadius: 14,
  motionDrag: 0.92,
  trailSpawnEvery: 2,
  trailLifeFrames: 16,
  trailSizeMin: 1,
  trailSizeMax: 3,
  coinCollectRadius: 8,
  coinDropIntervalMin: 24,
  coinDropIntervalMax: 48,
  coinDropBurstMin: 2,
  coinDropBurstMax: 4,
  enemyHitRadius: 9,
  enemyPushStrength: 2.15,
  enemyPushLift: 0.52,
  pushSfxCooldownFrames: 14,
  shimmerFrames: 14,
  expireBurstFrames: 26
};
const BONECRYPT_WEATHER = {
  zoneStartRatio: 0.30,
  zoneEndRatio: 0.70,
  rainTarget: 86,
  rainWind: -0.26,
  lightningChance: 0.006,
  lightningFrames: 7,
  lightningCooldownFrames: 92
};
const PHYSICS_BY_THEME = {
  DAY:     { gravity: 0.35, groundFriction: 0.80, airFriction: 0.94 },
  AFTERNOON:{ gravity: 0.35, groundFriction: 0.81, airFriction: 0.94 },
  JUNGLE:  { gravity: 0.34, groundFriction: 0.83, airFriction: 0.95 },
  FACTORY: { gravity: 0.35, groundFriction: 0.82, airFriction: 0.95 },
  CASTLE:  { gravity: 0.35, groundFriction: 0.80, airFriction: 0.94 },
  ICE:     { gravity: 0.30, groundFriction: 0.95, airFriction: 0.97 },
  VOLCANO: { gravity: 0.36, groundFriction: 0.80, airFriction: 0.94 },
  STORMFOUNDRY: { gravity: 0.35, groundFriction: 0.81, airFriction: 0.95 },
  SKYRUINS:{ gravity: 0.33, groundFriction: 0.83, airFriction: 0.95 },
  JAPAN:   { gravity: 0.34, groundFriction: 0.82, airFriction: 0.95 },
  HORROR:  { gravity: 0.34, groundFriction: 0.81, airFriction: 0.95 },
  BONECRYPT:{ gravity: 0.34, groundFriction: 0.82, airFriction: 0.95 },
  GOTHIC:  { gravity: 0.33, groundFriction: 0.83, airFriction: 0.95 },
  LIMINAL: { gravity: 0.34, groundFriction: 0.83, airFriction: 0.95 },
  GEOMETRYDREAM:{ gravity: 0.32, groundFriction: 0.84, airFriction: 0.96 },
  SIMBREACH:{ gravity: 0.33, groundFriction: 0.83, airFriction: 0.96 },
  SHADOWRUN:{ gravity: 0.33, groundFriction: 0.82, airFriction: 0.96 },
  NITE:    { gravity: 0.35, groundFriction: 0.80, airFriction: 0.94 },
  SPACE:   { gravity: 0.28, groundFriction: 0.84, airFriction: 0.96 }
};
const DEFAULT_THEME = "DAY";
const getThemeForLevel = (index) => {
  const theme = LEVEL_THEMES[index];
  return PHYSICS_BY_THEME[theme] ? theme : DEFAULT_THEME;
};
const EXTRA_FLYERS_BY_LEVEL = [
  [{ type: 1, x: 26, y: 7 }, { type: 2, x: 58, y: 6 }, { type: 3, x: 80, y: 8 }],
  [{ type: 1, x: 22, y: 6 }, { type: 2, x: 48, y: 7 }, { type: 3, x: 74, y: 6 }],
  [{ type: 1, x: 24, y: 6 }, { type: 2, x: 54, y: 7 }, { type: 3, x: 78, y: 5 }],
  [{ type: 1, x: 22, y: 6 }, { type: 2, x: 50, y: 7 }, { type: 3, x: 74, y: 6 }],
  [{ type: 1, x: 28, y: 7 }, { type: 2, x: 56, y: 6 }, { type: 3, x: 82, y: 8 }],
  [{ type: 1, x: 26, y: 6 }, { type: 2, x: 52, y: 7 }, { type: 3, x: 76, y: 5 }],
  [{ type: 1, x: 24, y: 7 }, { type: 2, x: 48, y: 6 }, { type: 3, x: 72, y: 8 }],
  [{ type: 1, x: 30, y: 6 }, { type: 2, x: 58, y: 7 }, { type: 3, x: 86, y: 6 }],
  [{ type: 1, x: 22, y: 6 }, { type: 2, x: 46, y: 7 }, { type: 3, x: 70, y: 5 }],
  [{ type: 1, x: 24, y: 6 }, { type: 2, x: 58, y: 7 }, { type: 3, x: 84, y: 6 }, { type: 2, x: 72, y: 5 }]
];

const CHARACTERS = [
  { name: "RANGER",   anim: ["playerRangerIdle","playerRangerRun"], jumpMul: 1.00, w: 10, h: 10, doubleJumps: 0, duckFlight: 0  },
  { name: "BUNNY",    anim: ["playerBunnyIdle","playerBunnyRun"], jumpMul: 1.22, w: 10, h: 10, doubleJumps: 0, duckFlight: 0  },
  { name: "NINJA",    anim: ["playerNinjaIdle","playerNinjaRun"], jumpMul: 1.00, w: 10, h: 10, doubleJumps: 1, duckFlight: 0  },
  { name: "ROBOT",    anim: ["playerRobotIdle","playerRobotRun"], jumpMul: 1.00, w: 10, h: 10, doubleJumps: 0, duckFlight: 0  },
  { name: "DUCK",     anim: ["playerDuckIdle","playerDuckRun"],jumpMul: 1.00, w: 20, h: 10, doubleJumps: 0, duckFlight: 26 },
  { name: "PALADIN",  anim: ["playerPaladinIdle","playerPaladinRun"], jumpMul: 0.98, w: 10, h: 10, doubleJumps: 0, duckFlight: 0  },
  { name: "GLITCHRUNNER", anim: ["playerGlitchRunnerIdle","playerGlitchRunnerRun"], jumpMul: 0.95, w: 10, h: 10, doubleJumps: 0, duckFlight: 0  },
  { name: "SHADOWRUNNER", anim: ["playerShadowRunnerIdle","playerShadowRunnerRun"], jumpMul: 0.95, w: 10, h: 10, doubleJumps: 0, duckFlight: 0  },
  { name: "SKELETON", anim: null,        jumpMul: 1.00, w: 10, h: 20, doubleJumps: 0, duckFlight: 0  }
];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export {
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
};
