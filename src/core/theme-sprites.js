function collectibleSpriteForTheme(theme, tileId, SPRITES) {
  if (theme === "DAY") return tileId === 2 ? SPRITES.coinDay : SPRITES.coinDayBig;
  if (theme === "AFTERNOON") return tileId === 2 ? SPRITES.coinAfternoon : SPRITES.coinAfternoonBig;
  if (theme === "VOLCANO") return tileId === 2 ? SPRITES.coinVolcano : SPRITES.coinVolcanoBig;
  if (theme === "STORMFOUNDRY") return tileId === 2 ? SPRITES.coinStormFoundry : SPRITES.coinStormFoundryBig;
  if (theme === "CASTLE") return tileId === 2 ? SPRITES.coinCastle : SPRITES.coinCastleBig;
  if (theme === "GOTHIC") return tileId === 2 ? SPRITES.relicCrossSmall : SPRITES.coinGothicBig;
  if (theme === "SKYRUINS") return tileId === 2 ? SPRITES.coinSkyRuins : SPRITES.coinSkyRuinsBig;
  if (theme === "JAPAN") return tileId === 2 ? SPRITES.coinJapan : SPRITES.coinJapanBig;
  if (theme === "HORROR") return tileId === 2 ? SPRITES.coinHorror : SPRITES.coinHorrorBig;
  if (theme === "BONECRYPT") return tileId === 2 ? SPRITES.coinBone : SPRITES.coinBoneBig;
  if (theme === "GEOMETRYDREAM") return tileId === 2 ? SPRITES.coinGeometryDream : SPRITES.coinGeometryDreamBig;
  if (theme === "SIMBREACH") return tileId === 2 ? SPRITES.coinGeometryDream : SPRITES.coinGeometryDreamBig;
  if (tileId === 2) return theme === "JUNGLE" ? SPRITES.coinJungle : theme === "FACTORY" ? SPRITES.coinFactory : (theme === "ICE" || theme === "SPACE") ? SPRITES.coinGem : SPRITES.coinDay;
  return theme === "JUNGLE" ? SPRITES.coinJungleBig : theme === "FACTORY" ? SPRITES.coinFactoryBig : (theme === "ICE" || theme === "SPACE") ? SPRITES.coinGemBig : SPRITES.coinDayBig;
}

function oneUpSpriteForTheme(theme, SPRITES) {
  if (theme === "JUNGLE") return SPRITES.oneUpJungle;
  if (theme === "AFTERNOON") return SPRITES.oneUpAfternoon;
  if (theme === "FACTORY") return SPRITES.oneUpFactory;
  if (theme === "STORMFOUNDRY") return SPRITES.oneUpStormFoundry;
  if (theme === "CASTLE") return SPRITES.oneUpCastle;
  if (theme === "GOTHIC") return SPRITES.oneUpGothic;
  if (theme === "ICE") return SPRITES.oneUpIce;
  if (theme === "VOLCANO") return SPRITES.oneUpVolcano;
  if (theme === "SKYRUINS") return SPRITES.oneUpSkyRuins;
  if (theme === "JAPAN") return SPRITES.oneUpJapan;
  if (theme === "HORROR") return SPRITES.oneUpHorror;
  if (theme === "BONECRYPT") return SPRITES.oneUpHorror;
  if (theme === "GEOMETRYDREAM") return SPRITES.oneUpGeometryDream;
  if (theme === "SIMBREACH") return SPRITES.oneUpGeometryDream;
  if (theme === "NITE") return SPRITES.oneUpNite;
  if (theme === "SPACE") return SPRITES.oneUpSpace;
  return SPRITES.oneUpDay;
}

function tileSpriteForTheme(theme, tileId, SPRITES) {
  if (tileId === 1) {
    return theme === "JUNGLE" ? SPRITES.tileJungleA :
      theme === "FACTORY" ? SPRITES.tileFactoryA :
      theme === "STORMFOUNDRY" ? SPRITES.tileStormFoundryA :
      theme === "CASTLE" ? SPRITES.tileCastleA :
      theme === "GOTHIC" ? SPRITES.tileGothicA :
      theme === "ICE" ? SPRITES.tileIceA :
      theme === "VOLCANO" ? SPRITES.tileVolcanoA :
      theme === "SKYRUINS" ? SPRITES.tileSkyRuinsA :
      theme === "JAPAN" ? SPRITES.tileJapanA :
      theme === "HORROR" ? SPRITES.tileHorrorA :
      theme === "BONECRYPT" ? SPRITES.tileHorrorA :
        theme === "SIMBREACH" ? SPRITES.tileNiteA :
      theme === "SPACE" ? SPRITES.tileSpaceA :
      theme === "NITE" ? SPRITES.tileNiteA : SPRITES.tileDayA;
  }
  if (tileId === 4) {
    return theme === "JUNGLE" ? SPRITES.tileJungleB :
      theme === "FACTORY" ? SPRITES.tileFactoryB :
      theme === "STORMFOUNDRY" ? SPRITES.tileStormFoundryB :
      theme === "CASTLE" ? SPRITES.tileCastleB :
      theme === "GOTHIC" ? SPRITES.tileGothicB :
      theme === "ICE" ? SPRITES.tileIceB :
      theme === "VOLCANO" ? SPRITES.tileVolcanoB :
      theme === "SKYRUINS" ? SPRITES.tileSkyRuinsB :
      theme === "JAPAN" ? SPRITES.tileJapanB :
      theme === "HORROR" ? SPRITES.tileHorrorB :
      theme === "BONECRYPT" ? SPRITES.tileHorrorB :
        theme === "SIMBREACH" ? SPRITES.tileNiteB :
      theme === "SPACE" ? SPRITES.tileSpaceB :
      theme === "NITE" ? SPRITES.tileNiteB : SPRITES.tileDayB;
  }
  if (tileId === 12) return SPRITES.tileCursedBarrier;
  return null;
}

function enemySpriteForTheme(enemy, theme, SPRITES) {
  const f = ((enemy.anim >> 3) & 1);
  const variant = enemy.variant | 0;
  if (enemy.type === 0) {
    const runFrame = ((enemy.anim >> 4) & 1);
    if (theme === "CASTLE" || theme === "GOTHIC") {
      if (variant & 1) return runFrame ? SPRITES.enemyCastleWalkerAltRun : SPRITES.enemyCastleWalkerAltIdle;
      return runFrame ? SPRITES.enemyCastleWalkerRun : SPRITES.enemyCastleWalkerIdle;
    }
    if (variant & 1) return runFrame ? SPRITES.enemyWalkerAltRun : SPRITES.enemyWalkerAltIdle;
    return runFrame ? SPRITES.enemyWalkerRun : SPRITES.enemyWalkerIdle;
  }
  if (enemy.type === 1) {
    if (theme === "CASTLE" || theme === "GOTHIC") return (variant & 1) ? (f ? SPRITES.enemyCastleBatSpineB : SPRITES.enemyCastleBatSpineA) : (f ? SPRITES.enemyCastleBatFlapB : SPRITES.enemyCastleBatFlapA);
    return (variant & 1) ? (f ? SPRITES.enemyBatSpineB : SPRITES.enemyBatSpineA) : (f ? SPRITES.enemyBatFlapB : SPRITES.enemyBatFlapA);
  }
  if (enemy.type === 2) {
    if (theme === "CASTLE" || theme === "GOTHIC") return (variant & 1) ? (f ? SPRITES.enemyCastleFalconDeltaB : SPRITES.enemyCastleFalconDeltaA) : (f ? SPRITES.enemyCastleFalconFlapB : SPRITES.enemyCastleFalconFlapA);
    return (variant & 1) ? (f ? SPRITES.enemyFalconDeltaB : SPRITES.enemyFalconDeltaA) : (f ? SPRITES.enemyFalconFlapB : SPRITES.enemyFalconFlapA);
  }
  if (enemy.type === 4) {
    if (theme === "CASTLE" || theme === "GOTHIC") return f ? SPRITES.enemyVampireBigB : SPRITES.enemyVampireBigA;
    return f ? SPRITES.enemyVampireBigB : SPRITES.enemyVampireBigA;
  }
  if (enemy.type === 5) {
    if (theme === "CASTLE" || theme === "GOTHIC") return f ? SPRITES.enemyVampireBigB : SPRITES.enemyVampireBigA;
    return f ? SPRITES.enemyVampireBigB : SPRITES.enemyVampireBigA;
  }
  if (enemy.type === 6) {
    return f ? SPRITES.enemyBoneWispB : SPRITES.enemyBoneWispA;
  }
  if (enemy.type === 7) {
    return f ? SPRITES.enemyCryptHarbingerB : SPRITES.enemyCryptHarbingerA;
  }
  if (enemy.type === 8) {
    if (enemy.workerState === "SHIELD_UP") {
      return (variant & 1) ? SPRITES.enemyCastleWalkerAltIdle : SPRITES.enemyCastleWalkerIdle;
    }
    const runFrame = ((enemy.anim >> 4) & 1);
    return (variant & 1)
      ? (runFrame ? SPRITES.enemyWalkerAltRun : SPRITES.enemyWalkerAltIdle)
      : (runFrame ? SPRITES.enemyWalkerRun : SPRITES.enemyWalkerIdle);
  }
  if (enemy.type === 9) {
    if (enemy.frankState === "WINDUP") return SPRITES.enemyFrankensteinWindup;
    if (enemy.frankState === "SLAM") return SPRITES.enemyFrankensteinSlam;
    const runFrame = ((enemy.anim >> 4) & 1);
    return runFrame ? SPRITES.enemyFrankensteinMarch : SPRITES.enemyFrankensteinIdle;
  }
  if (theme === "CASTLE" || theme === "GOTHIC") return (variant & 1) ? (f ? SPRITES.enemyCastleGhostOrbB : SPRITES.enemyCastleGhostOrbA) : (f ? SPRITES.enemyCastleGhostFlapB : SPRITES.enemyCastleGhostFlapA);
  return (variant & 1) ? (f ? SPRITES.enemyGhostOrbB : SPRITES.enemyGhostOrbA) : (f ? SPRITES.enemyGhostFlapB : SPRITES.enemyGhostFlapA);
}

export { collectibleSpriteForTheme, oneUpSpriteForTheme, tileSpriteForTheme, enemySpriteForTheme };