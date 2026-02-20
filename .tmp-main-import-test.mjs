globalThis.window = globalThis;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
globalThis.addEventListener = () => {};

globalThis.performance = { now: () => Date.now() };
globalThis.requestAnimationFrame = () => 0;

globalThis.GameAudioEngine = class {
  constructor(){ this.muted = 0; this.ctx = null; }
  ensure(){}
  playTheme(){}
  tone(){}
  adjustMusicVolume(){}
  extraLifeJingle(){}
  oneUpBurstSparkle(){}
  quack(){}
  flagRaiseJingle(){}
};

const gfx = {
  imageSmoothingEnabled: false,
  setTransform(){}, fillRect(){}, strokeRect(){}, beginPath(){}, arc(){}, fill(){}, stroke(){},
  moveTo(){}, lineTo(){}, save(){}, restore(){}, translate(){}, scale(){}, fillText(){},
  globalAlpha: 1, fillStyle: '', strokeStyle: '', font: ''
};
const canvas = { width: 0, height: 0, style: {}, getContext(){ return gfx; } };
globalThis.document = { getElementById(id){ return id === 'c' ? canvas : null; } };

import('./src/main.js')
  .then(() => { console.log('MAIN_IMPORT:PASS'); })
  .catch((e) => { console.error('MAIN_IMPORT:FAIL'); console.error(e && e.stack ? e.stack : e); process.exit(1); });
