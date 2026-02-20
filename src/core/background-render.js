function drawBackground(game, gfx, deps) {
  const { CANVAS_W, CANVAS_H, getThemeForLevel } = deps;
  const camx = game.cameraX;
  const theme = getThemeForLevel(game.levelIndex);
  if (theme === "DAY") {
    gfx.fillStyle = "#6bb7ff"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const bx = ((camx * 0.3) | 0) % CANVAS_W;
    gfx.fillStyle = "#bfe6ff";
    for (let i = -1; i < 3; i++) {
      const x = i*CANVAS_W - bx;
      gfx.fillRect(x+40,20,50,12); gfx.fillRect(x+65,14,30,10);
      gfx.fillRect(x+170,36,70,14); gfx.fillRect(x+200,30,40,10);
    }
  } else if (theme === "AFTERNOON") {
    gfx.fillStyle = "#ffbf7f"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1 = ((camx * 0.16) | 0) % CANVAS_W;
    const p2 = ((camx * 0.30) | 0) % CANVAS_W;
    gfx.fillStyle = "#ffd9a6";
    for (let i = -1; i < 3; i++) {
      const x = i*CANVAS_W - p1;
      gfx.fillRect(x + 24, 24, 62, 12);
      gfx.fillRect(x + 156, 38, 82, 16);
    }
    gfx.fillStyle = "#c47c4d";
    for (let i = -1; i < 3; i++) {
      const x = i*CANVAS_W - p2;
      gfx.fillRect(x, 120, 260, 72);
      gfx.fillRect(x + 70, 108, 280, 84);
    }
    gfx.fillStyle = "#8f5a3f";
    for (let i = 0; i < 16; i++) {
      let x = ((i*29 - (camx*0.44)) | 0) % CANVAS_W;
      x = (x + CANVAS_W) % CANVAS_W;
      gfx.fillRect(x, 92, 8, 98);
    }
  } else if (theme === "JUNGLE") {
    gfx.fillStyle = "#2f8f74"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1 = ((camx*0.18)|0) % CANVAS_W, p2 = ((camx*0.35)|0) % CANVAS_W;
    gfx.fillStyle = "#1f6f45";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,104,210,90); gfx.fillRect(x+90,92,230,100); gfx.fillRect(x+170,98,160,96);}
    gfx.fillStyle = "#12472a";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,120,240,70); gfx.fillRect(x+70,108,260,82); gfx.fillRect(x+170,114,200,76);}
    gfx.fillStyle = "#081f12";
    for (let i=0;i<22;i++){let x=((i*17-(camx*0.6))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,0,6,42);}
  } else if (theme === "FACTORY") {
    gfx.fillStyle = "#ffb36b"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.2)|0)%CANVAS_W, p2=((camx*0.45)|0)%CANVAS_W;
    gfx.fillStyle="#3a2a2a";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,112,260,70); gfx.fillRect(x+60,96,280,86); gfx.fillRect(x+180,86,170,96);}
    gfx.fillStyle="#1b1414";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,128,290,62); gfx.fillRect(x+80,110,300,80);}
    gfx.fillStyle="#ffffff10";
    for (let i=0;i<26;i++){let x=((i*19-(camx*0.75))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,0,6,28);}
    gfx.fillStyle="#00000010";
    for (let i=0;i<14;i++){let x=((i*37-(camx*0.25))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,64,12,120);}
  } else if (theme === "CASTLE") {
    gfx.fillStyle="#7fa0be"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.16)|0)%CANVAS_W, p2=((camx*0.30)|0)%CANVAS_W;
    gfx.fillStyle="#3b4f66";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,112,230,80); gfx.fillRect(x+70,98,260,94);}
    gfx.fillStyle="#223448";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,126,280,64); gfx.fillRect(x+65,112,290,78);}
    gfx.fillStyle="#b9d0e5";
    for (let i=0;i<16;i++){let x=((i*41-(camx*0.5))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,94,8,30); gfx.fillRect(x+2,90,4,6);}
  } else if (theme === "ICE") {
    gfx.fillStyle="#87c9ff"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.18)|0)%CANVAS_W, p2=((camx*0.33)|0)%CANVAS_W;
    gfx.fillStyle="#2a5a88";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,112,220,80); gfx.fillRect(x+80,96,260,96);}
    gfx.fillStyle="#163a66";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,128,260,62); gfx.fillRect(x+60,110,280,80);}
    gfx.fillStyle="#bfe9ff";
    for (let i=0;i<18;i++){let x=((i*33-(camx*0.55))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,92,6,36); gfx.fillRect(x+3,104,10,6);}
  } else if (theme === "VOLCANO") {
    gfx.fillStyle="#260013"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.2)|0)%CANVAS_W, p2=((camx*0.45)|0)%CANVAS_W;
    gfx.fillStyle="#3b001c";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,120,280,70); gfx.fillRect(x+70,105,260,85); gfx.fillRect(x+190,92,170,98);}
    gfx.fillStyle="#12000a";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,132,320,58); gfx.fillRect(x+80,114,300,76);}
    gfx.fillStyle="#ff5a0030";
    for (let i=0;i<18;i++){let x=((i*37-(camx*0.6))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,92,10,98);}
    gfx.fillStyle="#ff6a0020";
    for (let i=0;i<28;i++){let x=((i*19-(camx*0.9))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,0,4,28);}
  } else if (theme === "STORMFOUNDRY") {
    gfx.fillStyle="#0e1219"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.17)|0)%CANVAS_W, p2=((camx*0.36)|0)%CANVAS_W;
    const flash = ((game.player.anim + ((camx * 0.1) | 0)) % 180) < 3;
    gfx.fillStyle="#252d3b";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,122,250,68); gfx.fillRect(x+92,104,270,86);}        
    gfx.fillStyle="#161d29";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,132,300,58); gfx.fillRect(x+70,116,286,74);}        
    gfx.fillStyle="#8a6cff24";
    for (let i=0;i<18;i++){let x=((i*23-(camx*0.62))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,14,2,2);}        
    gfx.fillStyle="#4ef3ff1d";
    for (let i=0;i<20;i++){let x=((i*29-(camx*0.48))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,82,6,108);}        
    if (flash) {
      gfx.globalAlpha = 0.12;
      gfx.fillStyle = "#dfe8ff";
      gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      gfx.globalAlpha = 1;
    }
  } else if (theme === "SKYRUINS") {
    gfx.fillStyle="#8fc0ff"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.14)|0)%CANVAS_W, p2=((camx*0.28)|0)%CANVAS_W;
    gfx.fillStyle="#d9ecff";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x+20,24,58,10); gfx.fillRect(x+148,38,74,12); gfx.fillRect(x+250,20,50,10);}
    gfx.fillStyle="#5577a8";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,120,240,70); gfx.fillRect(x+90,102,260,88); gfx.fillRect(x+200,114,180,76);}
    gfx.fillStyle="#2f4568";
    for (let i=0;i<14;i++){let x=((i*33-(camx*0.46))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,84,9,106);}
  } else if (theme === "JAPAN") {
    gfx.fillStyle="#1b1f44"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.15)|0)%CANVAS_W, p2=((camx*0.32)|0)%CANVAS_W;
    gfx.fillStyle="#f5d0d0";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x+24,24,56,10); gfx.fillRect(x+152,34,74,12); gfx.fillRect(x+262,26,42,9);}
    gfx.fillStyle="#44213f";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,122,250,68); gfx.fillRect(x+90,104,270,86);}
    gfx.fillStyle="#6f2b56";
    for (let i=0;i<13;i++){let x=((i*37-(camx*0.50))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,88,8,102);}
    gfx.fillStyle="#ff9bc940";
    for (let i=0;i<20;i++){let x=((i*23-(camx*0.70))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,18,2,2);}
  } else if (theme === "HORROR") {
    gfx.fillStyle="#100817"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.16)|0)%CANVAS_W, p2=((camx*0.34)|0)%CANVAS_W;
    const moonX = CANVAS_W - 56 - ((camx * 0.05) | 0) % 14;
    gfx.fillStyle="#d9d2ff"; gfx.beginPath(); gfx.arc(moonX,34,15,0,6.283); gfx.fill();
    gfx.fillStyle="#100817"; gfx.beginPath(); gfx.arc(moonX + 6,30,13,0,6.283); gfx.fill();
    gfx.fillStyle="#ffffff1a"; gfx.fillRect(moonX - 6,22,2,2); gfx.fillRect(moonX - 1,26,2,2);
    gfx.fillStyle="#2b1633";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,120,250,70); gfx.fillRect(x+92,104,270,86);}
    gfx.fillStyle="#180b22";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,132,300,58); gfx.fillRect(x+70,116,286,74);}
    gfx.fillStyle="#d7a8ff28";
    for (let i=0;i<16;i++){let x=((i*29-(camx*0.48))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,80,6,110);}
    gfx.fillStyle="#bff8ff20";
    for (let i=0;i<26;i++){let x=((i*17-(camx*0.78))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,12,2,2);}
  } else if (theme === "BONECRYPT") {
    gfx.fillStyle="#0b0a12"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.18)|0)%CANVAS_W, p2=((camx*0.36)|0)%CANVAS_W;
    gfx.fillStyle="#d7d2cf";
    gfx.beginPath(); gfx.arc(CANVAS_W-52,30,13,0,6.283); gfx.fill();
    gfx.fillStyle="#0b0a12"; gfx.beginPath(); gfx.arc(CANVAS_W-46,28,11,0,6.283); gfx.fill();
    gfx.fillStyle="#2a2433";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,122,250,68); gfx.fillRect(x+88,104,270,86);}        
    gfx.fillStyle="#17131f";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,132,300,58); gfx.fillRect(x+68,116,286,74);}        
    gfx.fillStyle="#d8c8a228";
    for (let i=0;i<18;i++){let x=((i*27-(camx*0.58))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,82,7,108);}        
    gfx.fillStyle="#e8e4dd1e";
    for (let i=0;i<24;i++){let x=((i*19-(camx*0.76))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,16,2,2);}        
    game.drawBoneCryptWeatherBackground(camx);
  } else if (theme === "GOTHIC") {
    gfx.fillStyle="#0e0b18"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.16)|0)%CANVAS_W, p2=((camx*0.31)|0)%CANVAS_W;
    gfx.fillStyle="#d8cba5";
    gfx.beginPath(); gfx.arc(CANVAS_W-50,30,14,0,6.283); gfx.fill();
    gfx.fillStyle="#0e0b18";
    gfx.beginPath(); gfx.arc(CANVAS_W-44,27,12,0,6.283); gfx.fill();
    gfx.fillStyle="#2a203c";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,122,250,68); gfx.fillRect(x+88,102,270,88);}
    gfx.fillStyle="#181126";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,132,300,58); gfx.fillRect(x+68,114,286,76);}
    gfx.fillStyle="#b58cff22";
    for (let i=0;i<16;i++){let x=((i*31-(camx*0.5))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,82,7,108);}
    gfx.fillStyle="#ffd58a28";
    for (let i=0;i<24;i++){let x=((i*18-(camx*0.74))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,16,2,2);} 
  } else if (theme === "GEOMETRYDREAM") {
    gfx.fillStyle="#0b1120"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const p1=((camx*0.18)|0)%CANVAS_W, p2=((camx*0.36)|0)%CANVAS_W;
    gfx.strokeStyle="#58d9ff30";
    for (let y=12;y<96;y+=12){ gfx.beginPath(); gfx.moveTo(0,y); gfx.lineTo(CANVAS_W,y); gfx.stroke(); }
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillStyle="#101a35"; gfx.fillRect(x,120,240,70); gfx.fillRect(x+90,102,260,88);}
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillStyle="#0f1730"; gfx.fillRect(x,132,300,58); gfx.fillRect(x+70,116,286,74);}
    gfx.fillStyle="#9f7bff40";
    for (let i=0;i<18;i++){let x=((i*21-(camx*0.64))|0)%CANVAS_W; x=(x+CANVAS_W)%CANVAS_W; gfx.fillRect(x,10,2,2); gfx.fillRect((x+8)%CANVAS_W,24,2,2);}
  } else if (theme === "NITE") {
    gfx.fillStyle="#0b0f2a"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    gfx.fillStyle="#a8c7ff";
    for (let i=0;i<game.starField.length;i++){
      const s=game.starField[i];
      let x=((s[0]-camx*0.10)|0)%2600, y=s[1];
      x=((x%CANVAS_W)+CANVAS_W)%CANVAS_W;
      gfx.fillRect(x,y,s[2],s[2]);
    }
    gfx.fillStyle="#d9e6ff"; gfx.beginPath(); gfx.arc(CANVAS_W-52,36,20,0,6.283); gfx.fill();
    gfx.fillStyle="#0b0f2a"; gfx.beginPath(); gfx.arc(CANVAS_W-44,30,18,0,6.283); gfx.fill();

    const sx=((camx*0.12)|0)%CANVAS_W;
    gfx.fillStyle="#050711";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-sx; gfx.fillRect(x,110,160,70); gfx.fillRect(x+40,96,110,84); gfx.fillRect(x+90,86,80,94);}
    gfx.fillStyle="#ffffff10";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-(((camx*0.5)|0)%CANVAS_W); gfx.fillRect(x,122,220,6); gfx.fillRect(x+60,134,240,7);}
  } else if (theme === "SPACE") {
    gfx.fillStyle="#060815"; gfx.fillRect(0,0,CANVAS_W,CANVAS_H);
    gfx.fillStyle="#95b5ff";
    for (let i=0;i<game.starField.length;i++){
      const s=game.starField[i];
      let x=((s[0]-camx*0.14)|0)%2600, y=(s[1]*0.9)|0;
      x=((x%CANVAS_W)+CANVAS_W)%CANVAS_W;
      gfx.fillRect(x,y,s[2],s[2]);
    }
    gfx.fillStyle="#4f6be0";
    gfx.beginPath(); gfx.arc(CANVAS_W-54,32,16,0,6.283); gfx.fill();
    gfx.fillStyle="#89a2ff";
    gfx.beginPath(); gfx.arc(CANVAS_W-48,28,6,0,6.283); gfx.fill();
    const p1=((camx*0.18)|0)%CANVAS_W, p2=((camx*0.34)|0)%CANVAS_W;
    gfx.fillStyle="#1a2247";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p1; gfx.fillRect(x,124,250,66); gfx.fillRect(x+80,112,260,78);}
    gfx.fillStyle="#0c122f";
    for (let i=-1;i<3;i++){const x=i*CANVAS_W-p2; gfx.fillRect(x,136,300,54); gfx.fillRect(x+70,118,290,72);}
  } else {
    gfx.fillStyle = "#6bb7ff";
    gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  game.drawBackgroundActors(theme);
}

export { drawBackground };