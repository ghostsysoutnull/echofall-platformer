(() => {
  const GameAudioSfx = {
    extraLife(engine) {
      engine.tone(880, 0.06, 0);
      engine.tone(1175, 0.06, 0.07);
      engine.tone(1760, 0.08, 0.14);
    },

    oneUpBurstSparkle(engine) {
      const passes = [0.00, 0.11, 0.22];
      for (let i = 0; i < passes.length; i++) {
        const t = passes[i];
        const lift = i * 18;
        engine.tone(1320 + lift, 0.028, t + 0.000, "sine", 0.050);
        engine.tone(1370 + lift, 0.026, t + 0.018, "sine", 0.048);
        engine.tone(1325 + lift, 0.026, t + 0.036, "sine", 0.046);
        engine.tone(1568 + lift, 0.030, t + 0.056, "triangle", 0.052);
        engine.tone(1620 + lift, 0.028, t + 0.076, "triangle", 0.048);
        engine.tone(1760 + lift, 0.040, t + 0.098, "triangle", 0.050);
      }
    },

    flagRaise(engine) {
      engine.tone(660, 0.06, 0.00);
      engine.tone(990, 0.08, 0.08);
    },

    quack(engine) {
      engine.tone(560, 0.05, 0, "square");
      engine.tone(420, 0.08, 0.04, "square");
      engine.tone(240, 0.08, 0.08, "triangle");
    }
  };

  window.GameAudioSfx = GameAudioSfx;
})();
