(() => {
  const THEME_KEY = {
    DAY: "DAY",
    AFTERNOON: "AFTERNOON",
    JUNGLE: "JUNGLE",
    FACTORY: "FACTORY",
    STORMFOUNDRY: "FACTORY",
    CASTLE: "CASTLE",
    ICE: "ICE",
    VOLCANO: "VOLCANO",
    SKYRUINS: "SKYRUINS",
    JAPAN: "JAPAN",
    HORROR: "HORROR",
    BONECRYPT: "HORROR",
    GOTHIC: "GOTHIC",
    GEOMETRYDREAM: "GEOMETRYDREAM",
    GEOMETRYDREAM_S1: "GEOMETRYDREAM_S1",
    GEOMETRYDREAM_S2: "GEOMETRYDREAM_S2",
    GEOMETRYDREAM_S3: "GEOMETRYDREAM_S3",
    GEOMETRYDREAM_S4: "GEOMETRYDREAM_S4",
    GEOMETRYDREAM_S5: "GEOMETRYDREAM_S5",
    GEOMETRYDREAM_S6: "GEOMETRYDREAM_S6",
    SHADOWRUN: "SHADOWRUN",
    NITE: "NITE",
    SPACE: "SPACE_01"
  };

  function buildGeometryDreamTrack(ctx, bus, aux, helpers, variant) {
    const ping = helpers && helpers.ping ? helpers.ping : (() => []);
    const nodes = [];
    const timers = [];

    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.18 + variant * 0.01;
    const pulseLp = ctx.createBiquadFilter();
    pulseLp.type = "lowpass";
    pulseLp.frequency.value = 1500 + variant * 180;
    pulseLp.Q.value = 0.8;
    pulseGain.connect(pulseLp);
    pulseLp.connect(bus);

    const baseByVariant = [
      [98.00, 146.83, 196.00, 293.66],
      [110.00, 164.81, 220.00, 329.63],
      [123.47, 174.61, 246.94, 349.23],
      [130.81, 196.00, 261.63, 392.00],
      [146.83, 220.00, 293.66, 440.00],
      [164.81, 246.94, 329.63, 493.88]
    ];
    const base = baseByVariant[clampVariant(variant)];
    for (let i = 0; i < base.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "triangle" : "sine";
      osc.frequency.value = base[i] * (i === 3 ? 0.5 : 1);
      osc.connect(pulseGain);
      osc.start();
      nodes.push(osc);
    }

    const gate = ctx.createOscillator();
    gate.type = variant >= 4 ? "sine" : "square";
    gate.frequency.value = 2.6 + variant * 0.28;
    const gateAmt = ctx.createGain();
    gateAmt.gain.value = 0.04 + variant * 0.006;
    gate.connect(gateAmt);
    gateAmt.connect(pulseGain.gain);
    gate.start();
    nodes.push(pulseGain, pulseLp, gate, gateAmt);

    const shimmer = makeNoiseSource(ctx, 1.0, 0.16 + variant * 0.006);
    const shimmerBp = ctx.createBiquadFilter();
    shimmerBp.type = "bandpass";
    shimmerBp.frequency.value = 2000 + variant * 190;
    shimmerBp.Q.value = 1.8;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.04 + variant * 0.005;
    shimmer.connect(shimmerBp);
    shimmerBp.connect(shimmerGain);
    shimmerGain.connect(bus);
    shimmer.start();
    nodes.push(shimmer, shimmerBp, shimmerGain);

    const tonePool = [
      [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
      [293.66, 329.63, 392.00, 440.00, 493.88, 587.33],
      [329.63, 392.00, 440.00, 493.88, 587.33, 659.25],
      [349.23, 415.30, 466.16, 523.25, 622.25, 698.46],
      [392.00, 440.00, 523.25, 587.33, 698.46, 783.99],
      [440.00, 493.88, 587.33, 659.25, 783.99, 880.00]
    ];
    const tones = tonePool[clampVariant(variant)];
    const arpTimer = setInterval(() => {
      const f = tones[(Math.random() * tones.length) | 0] * (Math.random() < (0.48 - variant * 0.03) ? 0.5 : 1);
      nodes.push(...ping({ freq: f, type: variant >= 3 ? "sine" : "triangle", peak: 0.075 + variant * 0.003, dur: 0.14 + variant * 0.012, lpHz: 3200 + variant * 120, toDelay: Math.random() < 0.33 + variant * 0.05, bus, aux }));
    }, Math.max(260, 460 - variant * 30));
    timers.push(arpTimer);

    const portalSweepTimer = setInterval(() => {
      if (Math.random() < 0.30 + variant * 0.03) {
        const now = ctx.currentTime;
        const sweep = ctx.createOscillator();
        sweep.type = variant >= 4 ? "triangle" : "sine";
        sweep.frequency.setValueAtTime(760 + variant * 60 + Math.random() * 160, now);
        sweep.frequency.exponentialRampToValueAtTime(130 + variant * 20 + Math.random() * 80, now + 0.50 + variant * 0.04);

        const sweepGain = ctx.createGain();
        sweepGain.gain.setValueAtTime(0.0001, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.032 + variant * 0.004, now + 0.09);
        sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.64 + variant * 0.06);

        const sweepHp = ctx.createBiquadFilter();
        sweepHp.type = "highpass";
        sweepHp.frequency.value = 240 + variant * 18;

        sweep.connect(sweepHp);
        sweepHp.connect(sweepGain);
        sweepGain.connect(bus);
        if (aux) sweepGain.connect(aux);

        sweep.start(now);
        sweep.stop(now + 0.70 + variant * 0.06);
        nodes.push(sweep, sweepGain, sweepHp);
      }
    }, Math.max(1200, 2200 - variant * 110));
    timers.push(portalSweepTimer);

    return { nodes, timers };
  }

  function clampVariant(variant) {
    if (!Number.isFinite(variant)) return 0;
    if (variant < 0) return 0;
    if (variant > 5) return 5;
    return variant | 0;
  }

  function makeNoiseSource(ctx, seconds = 1.0, amp = 0.35) {
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * seconds));
    const buffer = ctx.createBuffer(1, len, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * amp;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  function makeDistortionCurve(amount) {
    const n = 44100;
    const curve = new Float32Array(n);
    const k = typeof amount === "number" ? amount : 50;
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  const GameAudioTracks = {
    build(ctx, theme, bus, aux, helpers) {
      const key = THEME_KEY[theme] || "DAY";
      if (key === "DAY") return this.DAY(ctx, bus, aux, helpers);
      if (key === "AFTERNOON") return this.AFTERNOON(ctx, bus, aux, helpers);
      if (key === "JUNGLE") return this.JUNGLE(ctx, bus, aux, helpers);
      if (key === "FACTORY") return this.FACTORY(ctx, bus, aux, helpers);
      if (key === "CASTLE") return this.CASTLE(ctx, bus, aux, helpers);
      if (key === "ICE") return this.ICE(ctx, bus, aux, helpers);
      if (key === "VOLCANO") return this.VOLCANO(ctx, bus, aux, helpers);
      if (key === "SKYRUINS") return this.SKYRUINS(ctx, bus, aux, helpers);
      if (key === "JAPAN") return this.JAPAN(ctx, bus, aux, helpers);
      if (key === "HORROR") return this.HORROR(ctx, bus, aux, helpers);
      if (key === "GOTHIC") return this.GOTHIC(ctx, bus, aux, helpers);
      if (key === "GEOMETRYDREAM") return this.GEOMETRYDREAM(ctx, bus, aux, helpers);
      if (key === "GEOMETRYDREAM_S1") return this.GEOMETRYDREAM_S1(ctx, bus, aux, helpers);
      if (key === "GEOMETRYDREAM_S2") return this.GEOMETRYDREAM_S2(ctx, bus, aux, helpers);
      if (key === "GEOMETRYDREAM_S3") return this.GEOMETRYDREAM_S3(ctx, bus, aux, helpers);
      if (key === "GEOMETRYDREAM_S4") return this.GEOMETRYDREAM_S4(ctx, bus, aux, helpers);
      if (key === "GEOMETRYDREAM_S5") return this.GEOMETRYDREAM_S5(ctx, bus, aux, helpers);
      if (key === "GEOMETRYDREAM_S6") return this.GEOMETRYDREAM_S6(ctx, bus, aux, helpers);
      if (key === "SHADOWRUN") return this.SHADOWRUN(ctx, bus, aux, helpers);
      if (key === "NITE") return this.NITE(ctx, bus, aux, helpers);
      return this.SPACE_01(ctx, bus, aux, helpers);
    },

    DAY: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const padGain = ctx.createGain();
      padGain.gain.value = 0.30;
      padGain.connect(bus);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      lp.Q.value = 0.6;
      padGain.disconnect();
      padGain.connect(lp);
      lp.connect(bus);

      const freqs = [130.81, 164.81, 196.00];
      for (let i = 0; i < freqs.length; i++) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "triangle" : "sine";
        o.frequency.value = freqs[i] * (i === 2 ? 0.5 : 1);
        o.connect(padGain);
        o.start();
        nodes.push(o);
      }

      const trem = ctx.createOscillator();
      trem.type = "sine";
      trem.frequency.value = 0.08;
      const tremAmt = ctx.createGain();
      tremAmt.gain.value = 0.10;
      trem.connect(tremAmt);
      tremAmt.connect(padGain.gain);
      trem.start();
      nodes.push(padGain, lp, trem, tremAmt);

      const id = setInterval(() => {
        if (Math.random() < 0.65) {
          const choices = [1760, 1976, 2093, 2349, 2637];
          const f = choices[(Math.random() * choices.length) | 0] * (Math.random() < 0.4 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "sine", peak: 0.08, dur: 0.18, lpHz: 6000, toDelay: false, bus, aux }));
        }
      }, 1200);
      timers.push(id);

      return { nodes, timers };
    },

    AFTERNOON: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const padGain = ctx.createGain();
      padGain.gain.value = 0.28;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1600;
      lp.Q.value = 0.65;
      padGain.connect(lp);
      lp.connect(bus);

      const freqs = [110.00, 146.83, 196.00];
      for (let i = 0; i < freqs.length; i++) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "triangle" : "sine";
        o.frequency.value = freqs[i] * (i === 2 ? 0.5 : 1);
        o.connect(padGain);
        o.start();
        nodes.push(o);
      }

      const sway = ctx.createOscillator();
      sway.type = "sine";
      sway.frequency.value = 0.11;
      const swayAmt = ctx.createGain();
      swayAmt.gain.value = 0.09;
      sway.connect(swayAmt);
      swayAmt.connect(padGain.gain);
      sway.start();

      nodes.push(padGain, lp, sway, swayAmt);

      const id = setInterval(() => {
        if (Math.random() < 0.80) {
          const choices = [392, 440, 523.25, 587.33, 659.25, 783.99];
          const f = choices[(Math.random() * choices.length) | 0] * (Math.random() < 0.3 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "triangle", peak: 0.085, dur: 0.15, lpHz: 3200, toDelay: Math.random() < 0.25, bus, aux }));
        }
      }, 650);
      timers.push(id);

      return { nodes, timers };
    },

    JUNGLE: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.34;

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 420;
      bp.Q.value = 0.9;

      droneGain.connect(bp);
      bp.connect(bus);

      const o1 = ctx.createOscillator();
      o1.type = "triangle";
      o1.frequency.value = 55;

      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = 55 * 1.01;

      o1.connect(droneGain);
      o2.connect(droneGain);
      o1.start();
      o2.start();
      nodes.push(droneGain, bp, o1, o2);

      const noise = makeNoiseSource(ctx, 1.0, 0.28);
      const nlp = ctx.createBiquadFilter();
      nlp.type = "lowpass";
      nlp.frequency.value = 1200;
      nlp.Q.value = 0.7;

      const nGain = ctx.createGain();
      nGain.gain.value = 0.14;

      noise.connect(nlp);
      nlp.connect(nGain);
      nGain.connect(bus);
      noise.start();
      nodes.push(noise, nlp, nGain);

      const id = setInterval(() => {
        if (Math.random() < 0.75) {
          const f = 300 + Math.random() * 450;
          nodes.push(...ping({ freq: f, type: "triangle", peak: 0.07, dur: 0.12, lpHz: 1800, toDelay: Math.random() < 0.25, bus, aux }));
        }
      }, 700);
      timers.push(id);

      return { nodes, timers };
    },

    FACTORY: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const pulseGain = ctx.createGain();
      pulseGain.gain.value = 0.0001;
      pulseGain.connect(bus);

      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 110;
      osc.connect(pulseGain);
      osc.start();
      nodes.push(osc, pulseGain);

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 800;
      bp.Q.value = 2.0;
      pulseGain.disconnect();
      pulseGain.connect(bp);
      bp.connect(bus);
      nodes.push(bp);

      const lfo = ctx.createOscillator();
      lfo.type = "square";
      lfo.frequency.value = 0.5;
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 350;
      lfo.connect(lfoAmt);
      lfoAmt.connect(bp.frequency);
      lfo.start();
      nodes.push(lfo, lfoAmt);

      const noise = makeNoiseSource(ctx, 1.0, 0.30);
      const nbp = ctx.createBiquadFilter();
      nbp.type = "bandpass";
      nbp.frequency.value = 2200;
      nbp.Q.value = 6.0;

      const nGain = ctx.createGain();
      nGain.gain.value = 0.10;

      noise.connect(nbp);
      nbp.connect(nGain);
      nGain.connect(bus);
      noise.start();
      nodes.push(noise, nbp, nGain);

      const id = setInterval(() => {
        const now = ctx.currentTime;
        pulseGain.gain.cancelScheduledValues(now);
        pulseGain.gain.setValueAtTime(0.0001, now);
        pulseGain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
        pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

        if (Math.random() < 0.35) {
          const f = 500 + Math.random() * 900;
          nodes.push(...ping({ freq: f, type: "triangle", peak: 0.10, dur: 0.20, lpHz: 2600, toDelay: true, bus, aux }));
        }
      }, 430);
      timers.push(id);

      return { nodes, timers };
    },

    CASTLE: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const padGain = ctx.createGain();
      padGain.gain.value = 0.24;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      lp.Q.value = 0.75;

      padGain.connect(lp);
      lp.connect(bus);

      const freqs = [98.00, 123.47, 146.83];
      for (let i = 0; i < freqs.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "triangle" : "sine";
        osc.frequency.value = freqs[i];
        osc.connect(padGain);
        osc.start();
        nodes.push(osc);
      }

      const pulse = ctx.createOscillator();
      pulse.type = "sine";
      pulse.frequency.value = 0.09;
      const pulseAmt = ctx.createGain();
      pulseAmt.gain.value = 0.06;
      pulse.connect(pulseAmt);
      pulseAmt.connect(padGain.gain);
      pulse.start();

      nodes.push(padGain, lp, pulse, pulseAmt);

      const id = setInterval(() => {
        if (Math.random() < 0.62) {
          const tones = [392, 440, 523.25, 587.33, 659.25, 783.99];
          const f = tones[(Math.random() * tones.length) | 0] * (Math.random() < 0.25 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "sine", peak: 0.08, dur: 0.24, lpHz: 2600, toDelay: true, bus, aux }));
        }
      }, 920);
      timers.push(id);

      return { nodes, timers };
    },

    ICE: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const noise = makeNoiseSource(ctx, 1.0, 0.25);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 900;
      hp.Q.value = 0.7;

      const airGain = ctx.createGain();
      airGain.gain.value = 0.12;

      noise.connect(hp);
      hp.connect(airGain);
      airGain.connect(bus);
      noise.start();
      nodes.push(noise, hp, airGain);

      const padGain = ctx.createGain();
      padGain.gain.value = 0.22;
      padGain.connect(bus);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      lp.Q.value = 0.6;
      padGain.disconnect();
      padGain.connect(lp);
      lp.connect(bus);

      const freqs = [246.94, 311.13, 369.99];
      for (let i = 0; i < freqs.length; i++) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freqs[i] * 0.5;
        o.connect(padGain);
        o.start();
        nodes.push(o);
      }
      nodes.push(padGain, lp);

      const id = setInterval(() => {
        if (Math.random() < 0.55) {
          const choices = [523.25, 659.25, 783.99, 1046.5];
          const f = choices[(Math.random() * choices.length) | 0] * (Math.random() < 0.35 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "sine", peak: 0.10, dur: 0.45, lpHz: 5000, toDelay: true, bus, aux }));
        }
      }, 1100);
      timers.push(id);

      return { nodes, timers };
    },

    VOLCANO: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.40;

      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 33;

      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(220);
      shaper.oversample = "2x";

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      lp.Q.value = 0.8;

      sub.connect(rumbleGain);
      rumbleGain.connect(shaper);
      shaper.connect(lp);
      lp.connect(bus);

      sub.start();
      nodes.push(rumbleGain, sub, shaper, lp);

      const noise = makeNoiseSource(ctx, 1.0, 0.34);
      const nbp = ctx.createBiquadFilter();
      nbp.type = "bandpass";
      nbp.frequency.value = 1800;
      nbp.Q.value = 2.8;

      const nGain = ctx.createGain();
      nGain.gain.value = 0.10;

      noise.connect(nbp);
      nbp.connect(nGain);
      nGain.connect(bus);
      noise.start();
      nodes.push(noise, nbp, nGain);

      const id = setInterval(() => {
        if (Math.random() < 0.60) {
          const f = 180 + Math.random() * 220;
          nodes.push(...ping({ freq: f, type: "triangle", peak: 0.10, dur: 0.20, lpHz: 1400, toDelay: Math.random() < 0.30, bus, aux }));
        }
      }, 800);
      timers.push(id);

      return { nodes, timers };
    },

    SKYRUINS: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const padGain = ctx.createGain();
      padGain.gain.value = 0.24;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1900;
      lp.Q.value = 0.7;
      padGain.connect(lp);
      lp.connect(bus);

      const freqs = [174.61, 220.00, 261.63];
      for (let i = 0; i < freqs.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "triangle" : "sine";
        osc.frequency.value = freqs[i] * (i === 2 ? 0.5 : 1);
        osc.connect(padGain);
        osc.start();
        nodes.push(osc);
      }

      const sway = ctx.createOscillator();
      sway.type = "sine";
      sway.frequency.value = 0.10;
      const swayAmt = ctx.createGain();
      swayAmt.gain.value = 0.08;
      sway.connect(swayAmt);
      swayAmt.connect(padGain.gain);
      sway.start();

      nodes.push(padGain, lp, sway, swayAmt);

      const id = setInterval(() => {
        if (Math.random() < 0.72) {
          const tones = [523.25, 587.33, 659.25, 783.99, 880.00];
          const f = tones[(Math.random() * tones.length) | 0] * (Math.random() < 0.35 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "triangle", peak: 0.09, dur: 0.22, lpHz: 3600, toDelay: Math.random() < 0.35, bus, aux }));
        }
      }, 760);
      timers.push(id);

      return { nodes, timers };
    },

    JAPAN: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.22;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1300;
      lp.Q.value = 0.7;
      droneGain.connect(lp);
      lp.connect(bus);

      const base = [130.81, 196.00, 261.63];
      for (let i = 0; i < base.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "triangle" : "sine";
        osc.frequency.value = base[i] * (i === 2 ? 0.5 : 1);
        osc.connect(droneGain);
        osc.start();
        nodes.push(osc);
      }

      const sway = ctx.createOscillator();
      sway.type = "sine";
      sway.frequency.value = 0.09;
      const swayAmt = ctx.createGain();
      swayAmt.gain.value = 0.07;
      sway.connect(swayAmt);
      swayAmt.connect(droneGain.gain);
      sway.start();

      nodes.push(droneGain, lp, sway, swayAmt);

      const id = setInterval(() => {
        if (Math.random() < 0.78) {
          const tones = [329.63, 392.00, 493.88, 523.25, 659.25, 783.99];
          const f = tones[(Math.random() * tones.length) | 0] * (Math.random() < 0.30 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "triangle", peak: 0.09, dur: 0.19, lpHz: 2800, toDelay: Math.random() < 0.28, bus, aux }));
        }
      }, 620);
      timers.push(id);

      return { nodes, timers };
    },

    HORROR: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.26;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 420;
      bp.Q.value = 1.1;
      droneGain.connect(bp);
      bp.connect(bus);

      const low = ctx.createOscillator();
      low.type = "triangle";
      low.frequency.value = 65.41;
      const high = ctx.createOscillator();
      high.type = "sine";
      high.frequency.value = 98.00;
      low.connect(droneGain);
      high.connect(droneGain);
      low.start();
      high.start();

      const wobble = ctx.createOscillator();
      wobble.type = "sine";
      wobble.frequency.value = 0.07;
      const wobbleAmt = ctx.createGain();
      wobbleAmt.gain.value = 0.12;
      wobble.connect(wobbleAmt);
      wobbleAmt.connect(droneGain.gain);
      wobble.start();

      const air = makeNoiseSource(ctx, 1.0, 0.26);
      const airHp = ctx.createBiquadFilter();
      airHp.type = "highpass";
      airHp.frequency.value = 1200;
      const airGain = ctx.createGain();
      airGain.gain.value = 0.08;
      air.connect(airHp);
      airHp.connect(airGain);
      airGain.connect(bus);
      air.start();

      nodes.push(droneGain, bp, low, high, wobble, wobbleAmt, air, airHp, airGain);

      const id = setInterval(() => {
        if (Math.random() < 0.74) {
          const tones = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00];
          const f = tones[(Math.random() * tones.length) | 0] * (Math.random() < 0.42 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "sine", peak: 0.085, dur: 0.20, lpHz: 2200, toDelay: Math.random() < 0.35, bus, aux }));
        }
      }, 710);
      timers.push(id);

      const howlTimer = setInterval(() => {
        if (Math.random() < 0.38) {
          const now = ctx.currentTime;
          const howl = ctx.createOscillator();
          howl.type = "triangle";
          howl.frequency.setValueAtTime(330 + Math.random() * 60, now);
          howl.frequency.exponentialRampToValueAtTime(140 + Math.random() * 40, now + 0.95);

          const howlGain = ctx.createGain();
          howlGain.gain.setValueAtTime(0.0001, now);
          howlGain.gain.exponentialRampToValueAtTime(0.050, now + 0.22);
          howlGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.30);

          const howlLp = ctx.createBiquadFilter();
          howlLp.type = "lowpass";
          howlLp.frequency.value = 1250;
          howlLp.Q.value = 0.8;

          howl.connect(howlLp);
          howlLp.connect(howlGain);
          howlGain.connect(bus);
          if (aux) howlGain.connect(aux);

          howl.start(now);
          howl.stop(now + 1.35);

          nodes.push(howl, howlGain, howlLp);
        }
      }, 2900);
      timers.push(howlTimer);

      return { nodes, timers };
    },

    GOTHIC: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const organGain = ctx.createGain();
      organGain.gain.value = 0.24;
      const organLp = ctx.createBiquadFilter();
      organLp.type = "lowpass";
      organLp.frequency.value = 1200;
      organLp.Q.value = 0.9;
      organGain.connect(organLp);
      organLp.connect(bus);

      const bass = ctx.createOscillator();
      bass.type = "triangle";
      bass.frequency.value = 73.42;
      const mid = ctx.createOscillator();
      mid.type = "sine";
      mid.frequency.value = 146.83;
      const choir = ctx.createOscillator();
      choir.type = "sine";
      choir.frequency.value = 293.66;
      bass.connect(organGain);
      mid.connect(organGain);
      choir.connect(organGain);
      bass.start();
      mid.start();
      choir.start();

      const trem = ctx.createOscillator();
      trem.type = "sine";
      trem.frequency.value = 0.06;
      const tremAmt = ctx.createGain();
      tremAmt.gain.value = 0.08;
      trem.connect(tremAmt);
      tremAmt.connect(organGain.gain);
      trem.start();

      const candle = makeNoiseSource(ctx, 1.0, 0.20);
      const candleHp = ctx.createBiquadFilter();
      candleHp.type = "highpass";
      candleHp.frequency.value = 900;
      const candleGain = ctx.createGain();
      candleGain.gain.value = 0.06;
      candle.connect(candleHp);
      candleHp.connect(candleGain);
      candleGain.connect(bus);
      candle.start();

      nodes.push(organGain, organLp, bass, mid, choir, trem, tremAmt, candle, candleHp, candleGain);

      const bellTimer = setInterval(() => {
        if (Math.random() < 0.66) {
          const tones = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
          const f = tones[(Math.random() * tones.length) | 0] * (Math.random() < 0.30 ? 0.5 : 1);
          nodes.push(...ping({ freq: f, type: "triangle", peak: 0.08, dur: 0.18, lpHz: 2600, toDelay: Math.random() < 0.32, bus, aux }));
        }
      }, 680);
      timers.push(bellTimer);

      const bellSweepTimer = setInterval(() => {
        if (Math.random() < 0.34) {
          const now = ctx.currentTime;
          const bell = ctx.createOscillator();
          bell.type = "sine";
          bell.frequency.setValueAtTime(620 + Math.random() * 90, now);
          bell.frequency.exponentialRampToValueAtTime(180 + Math.random() * 30, now + 0.80);

          const bellGain = ctx.createGain();
          bellGain.gain.setValueAtTime(0.0001, now);
          bellGain.gain.exponentialRampToValueAtTime(0.048, now + 0.10);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.10);

          bell.connect(bellGain);
          bellGain.connect(bus);
          if (aux) bellGain.connect(aux);

          bell.start(now);
          bell.stop(now + 1.14);
          nodes.push(bell, bellGain);
        }
      }, 2600);
      timers.push(bellSweepTimer);

      return { nodes, timers };
    },

    GEOMETRYDREAM: (ctx, bus, aux, helpers) => buildGeometryDreamTrack(ctx, bus, aux, helpers, 0),
    GEOMETRYDREAM_S1: (ctx, bus, aux, helpers) => buildGeometryDreamTrack(ctx, bus, aux, helpers, 0),
    GEOMETRYDREAM_S2: (ctx, bus, aux, helpers) => buildGeometryDreamTrack(ctx, bus, aux, helpers, 1),
    GEOMETRYDREAM_S3: (ctx, bus, aux, helpers) => buildGeometryDreamTrack(ctx, bus, aux, helpers, 2),
    GEOMETRYDREAM_S4: (ctx, bus, aux, helpers) => buildGeometryDreamTrack(ctx, bus, aux, helpers, 3),
    GEOMETRYDREAM_S5: (ctx, bus, aux, helpers) => buildGeometryDreamTrack(ctx, bus, aux, helpers, 4),
    GEOMETRYDREAM_S6: (ctx, bus, aux, helpers) => buildGeometryDreamTrack(ctx, bus, aux, helpers, 5),

    SHADOWRUN: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const bassGain = ctx.createGain();
      bassGain.gain.value = 0.30;
      const bassLp = ctx.createBiquadFilter();
      bassLp.type = "lowpass";
      bassLp.frequency.value = 520;
      bassLp.Q.value = 1.1;
      bassGain.connect(bassLp);
      bassLp.connect(bus);

      const bass = ctx.createOscillator();
      bass.type = "sawtooth";
      bass.frequency.value = 55;
      const sub = ctx.createOscillator();
      sub.type = "triangle";
      sub.frequency.value = 27.5;
      bass.connect(bassGain);
      sub.connect(bassGain);
      bass.start();
      sub.start();

      const sideLfo = ctx.createOscillator();
      sideLfo.type = "sine";
      sideLfo.frequency.value = 0.18;
      const sideAmt = ctx.createGain();
      sideAmt.gain.value = 0.08;
      sideLfo.connect(sideAmt);
      sideAmt.connect(bassGain.gain);
      sideLfo.start();

      const glitchNoise = makeNoiseSource(ctx, 1.0, 0.24);
      const glitchHp = ctx.createBiquadFilter();
      glitchHp.type = "highpass";
      glitchHp.frequency.value = 1400;
      const glitchBp = ctx.createBiquadFilter();
      glitchBp.type = "bandpass";
      glitchBp.frequency.value = 2300;
      glitchBp.Q.value = 2.2;
      const glitchGain = ctx.createGain();
      glitchGain.gain.value = 0.07;
      glitchNoise.connect(glitchHp);
      glitchHp.connect(glitchBp);
      glitchBp.connect(glitchGain);
      glitchGain.connect(bus);
      if (aux && aux.delay) glitchGain.connect(aux.delay);
      glitchNoise.start();

      nodes.push(bassGain, bassLp, bass, sub, sideLfo, sideAmt, glitchNoise, glitchHp, glitchBp, glitchGain);

      const exploreArp = setInterval(() => {
        const tones = [220, 261.63, 329.63, 392, 493.88, 523.25];
        const f = tones[(Math.random() * tones.length) | 0] * (Math.random() < 0.4 ? 0.5 : 1);
        nodes.push(...ping({ freq: f, type: "triangle", peak: 0.075, dur: 0.14, lpHz: 2800, toDelay: Math.random() < 0.32, bus, aux }));
      }, 460);
      timers.push(exploreArp);

      const alertStab = setInterval(() => {
        if (Math.random() < 0.58) {
          const now = ctx.currentTime;
          const stab = ctx.createOscillator();
          stab.type = "sawtooth";
          stab.frequency.setValueAtTime(680 + Math.random() * 320, now);
          stab.frequency.exponentialRampToValueAtTime(160 + Math.random() * 70, now + 0.20);

          const stabGain = ctx.createGain();
          stabGain.gain.setValueAtTime(0.0001, now);
          stabGain.gain.exponentialRampToValueAtTime(0.050, now + 0.03);
          stabGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

          const stabHp = ctx.createBiquadFilter();
          stabHp.type = "highpass";
          stabHp.frequency.value = 220;

          stab.connect(stabHp);
          stabHp.connect(stabGain);
          stabGain.connect(bus);
          if (aux && aux.delay) stabGain.connect(aux.delay);

          stab.start(now);
          stab.stop(now + 0.32);
          nodes.push(stab, stabGain, stabHp);
        }
      }, 980);
      timers.push(alertStab);

      return { nodes, timers };
    },

    NITE: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const padGain = ctx.createGain();
      padGain.gain.value = 0.26;
      padGain.connect(bus);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1200;
      lp.Q.value = 0.7;
      padGain.disconnect();
      padGain.connect(lp);
      lp.connect(bus);

      const freqs = [110, 130.81, 164.81];
      for (let i = 0; i < freqs.length; i++) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freqs[i];
        o.connect(padGain);
        o.start();
        nodes.push(o);
      }
      nodes.push(padGain, lp);

      const id = setInterval(() => {
        if (Math.random() < 0.8) {
          const f = 2500 + Math.random() * 1500;
          nodes.push(...ping({ freq: f, type: "sine", peak: 0.05, dur: 0.08, lpHz: 6000, toDelay: false, bus, aux }));
        }
      }, 500);
      timers.push(id);

      return { nodes, timers };
    },

    SPACE_01: (ctx, bus, aux, helpers) => {
      const ping = helpers && helpers.ping ? helpers.ping : (() => []);
      const nodes = [];
      const timers = [];

      const droneLP = ctx.createBiquadFilter();
      droneLP.type = "lowpass";
      droneLP.frequency.value = 800;
      droneLP.Q.value = 0.7;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.35;

      droneGain.connect(droneLP);
      droneLP.connect(bus);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.03;
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 550;
      lfo.connect(lfoAmt);
      lfoAmt.connect(droneLP.frequency);
      lfo.start();

      const baseHz = 55;
      const o1 = ctx.createOscillator();
      o1.type = "triangle";
      o1.frequency.value = baseHz;

      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = baseHz * 1.005;

      const drift = ctx.createOscillator();
      drift.type = "sine";
      drift.frequency.value = 0.015;
      const driftAmt = ctx.createGain();
      driftAmt.gain.value = 0.25;
      drift.connect(driftAmt);
      driftAmt.connect(o2.detune);
      drift.start();

      o1.connect(droneGain);
      o2.connect(droneGain);
      o1.start();
      o2.start();

      nodes.push(droneLP, droneGain, lfo, lfoAmt, drift, driftAmt, o1, o2);

      const noise = makeNoiseSource(ctx, 1.0, 0.35);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1200;
      bp.Q.value = 1.2;

      const dustGain = ctx.createGain();
      dustGain.gain.value = 0.12;

      const dustLfo = ctx.createOscillator();
      dustLfo.type = "sine";
      dustLfo.frequency.value = 0.025;

      const dustAmt = ctx.createGain();
      dustAmt.gain.value = 700;

      dustLfo.connect(dustAmt);
      dustAmt.connect(bp.frequency);
      dustLfo.start();

      noise.connect(bp);
      bp.connect(dustGain);
      dustGain.connect(bus);
      noise.start();

      nodes.push(noise, bp, dustGain, dustLfo, dustAmt);

      const id = setInterval(() => {
        if (Math.random() < 0.40) {
          const choices = [220, 247, 262, 294, 330, 392];
          const f = choices[(Math.random() * choices.length) | 0] * (Math.random() < 0.25 ? 2 : 1);
          nodes.push(...ping({ freq: f, type: Math.random() < 0.5 ? "sine" : "triangle", peak: 0.18, dur: 0.35, lpHz: 2200, toDelay: true, bus, aux }));
        }
      }, 1200);
      timers.push(id);

      return { nodes, timers };
    }
  };

  window.GameAudioTracks = GameAudioTracks;
})();
