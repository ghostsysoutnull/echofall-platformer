(() => {
  const THEME_KEY = {
    DAY: "DAY",
    AFTERNOON: "AFTERNOON",
    JUNGLE: "JUNGLE",
    FACTORY: "FACTORY",
    CASTLE: "CASTLE",
    ICE: "ICE",
    VOLCANO: "VOLCANO",
    SKYRUINS: "SKYRUINS",
    NITE: "NITE",
    SPACE: "SPACE_01"
  };

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
