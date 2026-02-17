(() => {
  class GameAudioEngine {
    constructor() {
      this.ctx = null;
      this._muted = 0;
      this._musicVolume = 0.45;
      this.masterGain = null;
      this.sfxGain = null;
      this.musicGain = null;
      this.currentTrack = null;
      this.pendingTheme = null;
      this.currentTheme = null;

      this.sfx = window.GameAudioSfx || null;
      this.tracks = window.GameAudioTracks || null;
    }

    get muted() { return this._muted; }

    get musicVolume() { return this._musicVolume; }

    set muted(v) {
      this._muted = v ? 1 : 0;
      this._syncMute();
    }

    set musicVolume(v) {
      const next = Math.max(0, Math.min(1, Number(v) || 0));
      this._musicVolume = next;
      if (this.musicGain) this.musicGain.gain.value = this._musicVolume;
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === "suspended" && this.ctx.resume) this.ctx.resume();
        if (this.pendingTheme) this.playTheme(this.pendingTheme, { fadeInMs: 500, crossFadeMs: 500 });
        return;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this._musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.masterGain);

      if (this.ctx.resume) this.ctx.resume();
      if (this.pendingTheme) this.playTheme(this.pendingTheme, { fadeInMs: 500, crossFadeMs: 500 });
    }

    adjustMusicVolume(delta = 0) {
      this.musicVolume = this._musicVolume + delta;
      return this._musicVolume;
    }

    _syncMute() {
      if (!this.masterGain) return;
      this.masterGain.gain.value = this._muted ? 0 : 1;
    }

    tone(freq, dur, at = 0, type = "square", peak = 0.06) {
      if (this._muted || !this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + at;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(peak, start);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + dur);
    }

    ping({ freq = 440, type = "sine", peak = 0.12, dur = 0.2, lpHz = 2400, toDelay = false, bus, aux }) {
      if (!this.ctx || !bus) return [];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = lpHz;
      lp.Q.value = 0.8;

      osc.connect(g);
      g.connect(lp);
      lp.connect(bus);
      if (toDelay && aux && aux.delay) lp.connect(aux.delay);

      osc.start(now);
      osc.stop(now + dur + 0.1);

      return [osc, g, lp];
    }

    _makeDelay({ time = 0.2, feedback = 0.2, mix = 0.2, dest }) {
      if (!this.ctx || !dest) return null;

      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = time;

      const fb = this.ctx.createGain();
      fb.gain.value = feedback;

      delay.connect(fb);
      fb.connect(delay);

      const mixGain = this.ctx.createGain();
      mixGain.gain.value = mix;

      delay.connect(mixGain);
      mixGain.connect(dest);

      return { delay, fb, mixGain };
    }

    _fadeGain(g, value, ms) {
      if (!this.ctx || !g) return;
      const t = this.ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(value, t + Math.max(0, ms) / 1000);
    }

    _cleanupTrackLater(trackWrapper, fadeMs) {
      if (!trackWrapper) return;

      const waitMs = Math.max(0, (fadeMs | 0) + 120);
      setTimeout(() => {
        for (const id of (trackWrapper.track?.timers || [])) clearInterval(id);
        for (const n of (trackWrapper.track?.nodes || [])) {
          try { if (typeof n.stop === "function") n.stop(); } catch {}
          try { if (typeof n.disconnect === "function") n.disconnect(); } catch {}
        }
        try { trackWrapper.gain.disconnect(); } catch {}
      }, waitMs);
    }

    playTheme(theme, { fadeInMs = 900, crossFadeMs = 600 } = {}) {
      this.pendingTheme = theme;
      if (!theme) return;

      if (!this.ctx || !this.musicGain) return;
      if (this.currentTheme === theme && this.currentTrack) return;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.0001;
      gain.connect(this.musicGain);

      const aux = this._makeDelay({
        time: theme === "FACTORY" ? 0.12 : 0.22,
        feedback: theme === "VOLCANO" ? 0.27 : 0.20,
        mix: 0.20,
        dest: gain
      });

      const track = this.tracks
        ? this.tracks.build(this.ctx, theme, gain, aux, { ping: (opts) => this.ping(opts) })
        : { nodes: [], timers: [] };

      const next = { theme, gain, track, aux };
      this._fadeGain(gain, 1.0, fadeInMs);

      const prev = this.currentTrack;
      if (prev) {
        this._fadeGain(prev.gain, 0.0, crossFadeMs);
        this._cleanupTrackLater(prev, crossFadeMs);
      }

      this.currentTrack = next;
      this.currentTheme = theme;
    }

    extraLifeJingle() {
      if (this.sfx && this.sfx.extraLife) return this.sfx.extraLife(this);
      this.tone(880, 0.06, 0);
      this.tone(1175, 0.06, 0.07);
      this.tone(1760, 0.08, 0.14);
    }

    oneUpBurstSparkle() {
      if (this.sfx && this.sfx.oneUpBurstSparkle) return this.sfx.oneUpBurstSparkle(this);
      const passes = [0.00, 0.11, 0.22];
      for (let i = 0; i < passes.length; i++) {
        const t = passes[i];
        const lift = i * 18;
        this.tone(1320 + lift, 0.028, t + 0.000, "sine", 0.050);
        this.tone(1370 + lift, 0.026, t + 0.018, "sine", 0.048);
        this.tone(1325 + lift, 0.026, t + 0.036, "sine", 0.046);
        this.tone(1568 + lift, 0.030, t + 0.056, "triangle", 0.052);
        this.tone(1620 + lift, 0.028, t + 0.076, "triangle", 0.048);
        this.tone(1760 + lift, 0.040, t + 0.098, "triangle", 0.050);
      }
    }

    flagRaiseJingle() {
      if (this.sfx && this.sfx.flagRaise) return this.sfx.flagRaise(this);
      this.tone(660, 0.06, 0.00);
      this.tone(990, 0.08, 0.08);
    }

    quack() {
      if (this.sfx && this.sfx.quack) return this.sfx.quack(this);
      this.tone(560, 0.05, 0, "square");
      this.tone(420, 0.08, 0.04, "square");
      this.tone(240, 0.08, 0.08, "triangle");
    }
  }

  window.GameAudioEngine = GameAudioEngine;
})();
