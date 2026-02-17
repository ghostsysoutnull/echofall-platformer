(() => {
  const GameAudioSfx = {
    extraLife(engine) {
      engine.tone(880, 0.06, 0);
      engine.tone(1175, 0.06, 0.07);
      engine.tone(1760, 0.08, 0.14);
    },

    oneUpBurstSparkle(engine) {
      engine.tone(1320, 0.04, 0.00, "sine", 0.05);
      engine.tone(1568, 0.04, 0.05, "sine", 0.05);
      engine.tone(1760, 0.05, 0.10, "triangle", 0.05);
      engine.tone(2093, 0.05, 0.16, "triangle", 0.045);
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
