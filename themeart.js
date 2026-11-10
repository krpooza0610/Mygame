/* themeart.js — ภาพของโลกใหม่: พื้น/ต้นไม้/ของตกแต่ง/อาคาร/มอนสเตอร์/บรรยากาศ ของแต่ละธีม
 * ใช้ตัวช่วยวาดจากหน้า index.html โดยตรง (ctx, poly, line, rr, box, LP, shade, mixc, hsh, glowPx, glowAt, shadowDiamond, LIGHTS, FONT, T)
 * ไฟล์นี้ต้องโหลดก่อนสคริปต์หลัก แต่ฟังก์ชันต่าง ๆ จะถูกเรียกหลังสคริปต์หลักทำงานแล้วเท่านั้น
 */
const TA = (function () {
  'use strict';
  const TAU = 6.2832;
  // ตัวช่วยวาดจากหน้าเกม — ส่งเข้ามาผ่าน TA.env() เพราะสคริปต์หลักอยู่ใน IIFE (มองไม่เห็นจากไฟล์นี้)
  let H = null, ctx = null, LIGHTS = 0, poly, line, rr, box, LP, shade, mixc, hsh, glowPx, glowAt, shadowDiamond, FONT, diamond, proj, drawStall, hangSign, T, OX = 0, MW = 40, MH = 32;
  function env(h) {
    H = h; ({ poly, line, rr, box, LP, shade, mixc, hsh, glowPx, glowAt, shadowDiamond, FONT, diamond, proj, drawStall, hangSign, T, OX, MW, MH } = h);
  }
  const sync = () => { ctx = H.ctx(); LIGHTS = H.lights(); };
  /* ---------------------------------------------------------------- สีพื้น */
  // g = หญ้า/พื้นฐาน (4 เฉด), p = ทางเดิน, s = หิน/ลาน (2 เฉด), w = น้ำ [ขอบ, ลึก], d = ลวดลาย
  const PAL = {
    euro: { g: ['#8fc16e', '#88bb68', '#95c874', '#82b462'], p: ['#d8c9a4', '#d1c19b', '#ddcfaa'], s: ['#b9b5ab', '#c6c2b8'], w: ['#7ec0e0', '#4d9bcb'], br: '#8a6a44', shore: '#d7c9a0', d: 'grass', bl: 'rgba(60,110,50,.5)', fl: 1, bg: '#2f4a32' },
    jungle: { g: ['#4d9647', '#478f41', '#549f4d', '#418a3b'], p: ['#9a7a52', '#927048', '#a38258'], s: ['#8e8a7c', '#9a9686'], w: ['#7ab8a0', '#3f8672'], br: '#6a4a2a', shore: '#7a6a44', d: 'grass', bl: 'rgba(20,70,30,.6)', fl: 0, bg: '#17341e' },
    ruins: { g: ['#a39d84', '#9d977e', '#aaa48b', '#979178'], p: ['#8e8778', '#968f80', '#867f70'], s: ['#8c8880', '#9a968c'], w: ['#6a98a8', '#46788a'], br: '#6a5a44', d: 'crack', bg: '#2a2822' },
    treehouse: { g: ['#5f9a58', '#5a9453', '#66a25e', '#548e4e'], p: ['#a67c4e', '#9f7448', '#ad8456'], s: ['#9a9482', '#a8a290'], w: ['#5aa8a0', '#2f7f7a'], br: '#7a5a32', d: 'grass', bl: 'rgba(30,90,45,.55)', fl: 1, bg: '#1a3a24' },
    thai: { g: ['#7fc063', '#79ba5e', '#86c869', '#73b458'], p: ['#cdb27c', '#c6ab74', '#d3b984'], s: ['#c9bea4', '#d3c8ae'], w: ['#79bdb8', '#4a9098'], br: '#9a6a3a', shore: '#cdb88a', d: 'grass', bl: 'rgba(60,120,50,.5)', fl: 1, bg: '#2a4a30' },
    sea: { g: ['#d9c898', '#d3c190', '#dfce9f', '#cdbb89'], p: ['#c4b17c', '#bca974', '#ccb984'], s: ['#9fb8b8', '#abc2c0'], w: ['#1d5a8c', '#0d3560'], br: '#7a8a8a', d: 'sea', bg: '#0b2a4a' },
    desert: { g: ['#e2c585', '#dcbd7c', '#e8cc8e', '#d6b673'], p: ['#caa868', '#c3a061', '#d1b072'], s: ['#d4b98a', '#dec497'], w: ['#58b4c4', '#3a95a8'], br: '#a07a46', shore: '#e8d49a', d: 'sand', bg: '#4a3a1c' },
    oasis: { g: ['#e6cc90', '#e0c487', '#ecd199', '#dabc7e'], p: ['#cfae70', '#c8a768', '#d6b678'], s: ['#d8bf90', '#e2c99d'], w: ['#5fd0cc', '#2aa0a6'], br: '#a07a46', shore: '#efdca4', d: 'sand', bg: '#4a3a1c' },
    neon: { g: ['#2a2d3a', '#262936', '#2e3140', '#232632'], p: ['#363a4c', '#313546', '#3b4054'], s: ['#3d4258', '#474d66'], w: ['#2a9ad0', '#1a5a8e'], br: '#4a5068', d: 'neon', bg: '#0b0d16' },
    waste: { g: ['#7a5e48', '#74583f', '#82664f', '#6e5340'], p: ['#625a52', '#5c544c', '#686058'], s: ['#8a8a86', '#94948f'], w: ['#8be05a', '#4aa832'], br: '#5a4a3a', d: 'crack', bg: '#1e1612' },
    snow: { g: ['#f0f5fa', '#e8eff6', '#f6fafd', '#e2eaf2'], p: ['#cfdce8', '#c6d4e2', '#d6e2ee'], s: ['#aee0f4', '#bde8f8'], w: ['#4b92bd', '#215a82'], br: '#8a7a6a', shore: '#cfe8f4', d: 'snow', bg: '#3a4a5c' },
    frost: { g: ['#eef4fa', '#e6edf5', '#f4f9fd', '#e0e8f1'], p: ['#cbd9e6', '#c2d1e0', '#d3e0ec'], s: ['#b4c8dc', '#c2d4e6'], w: ['#4b92bd', '#215a82'], br: '#8a7a6a', shore: '#cfe8f4', d: 'snow', bg: '#3a4a5c' },
    dungeon: { g: ['#4a4658', '#454152', '#4f4b5e', '#413d4e'], p: ['#4a4658', '#454152', '#4f4b5e'], s: ['#4d4960', '#58546b'], w: ['#2a3a5a', '#1a2440'], br: '#4a4658', d: 'floor', v: ['#15121e', '#0e0c15', '#2c2838'], bg: '#07060b' }
  };
  const SKY_FX = { sea: 'bubbles', snow: 'flake', frost: 'flake', neon: 'rain', waste: 'ember', desert: 'dust', oasis: 'dust', jungle: 'mist', treehouse: 'spore', ruins: 'dust', dungeon: 'mote', thai: 'none', euro: 'none' };
  // เวลาคงที่/โทนสีของแมพ (hour = เวลาบังคับ, tint = คูณสี)
  const TINT = { sea: [0.62, 0.86, 1.0], dungeon: [0.82, 0.76, 1.0], waste: [1.0, 0.82, 0.68], neon: [0.78, 0.8, 1.0], snow: [0.94, 0.98, 1.0], frost: [0.94, 0.98, 1.0], jungle: [0.9, 1.0, 0.92], desert: [1.0, 0.96, 0.86], oasis: [1.0, 0.97, 0.88] };

  /* ---------------------------------------------------------------- ปูพื้น */
  function bakeTile(g, P, t, x, y, X, Y, r, n, tAt) {
    if (t === 5) return;   // กำแพงมืดวาดทีหลัง
    let col, shore = false;
    if (t === 0) {
      if (P.shore) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (tAt(x + dx, y + dy) === 3) shore = true;
      col = shore ? shade(P.shore, 1 + n * 0.03) : shade(P.g[Math.floor(r * 4)], 1 + n * 0.05);
    } else if (t === 1) col = shade(P.p[Math.floor(r * 3)], 1 + n * 0.03);
    else if (t === 2) col = (x + y) % 2 ? P.s[0] : P.s[1];
    else if (t === 3) {
      const edge = tAt(x + 1, y) !== 3 || tAt(x - 1, y) !== 3 || tAt(x, y + 1) !== 3 || tAt(x, y - 1) !== 3;
      col = edge ? P.w[0] : shade(P.w[1], 1 + n * 0.05);
    } else col = P.br;
    diamond(g, X, Y); g.fillStyle = col; g.fillStroke = col; g.fill(); g.strokeStyle = col; g.lineWidth = 1; g.stroke();
    const d = P.d, q = (k) => { const a = proj(x + hsh(x, y, 10 + k), y + hsh(x, y, 20 + k)); return [a[0] + OX, a[1]]; };
    if (t === 0 && !shore) {
      if (d === 'grass') {
        g.strokeStyle = P.bl; g.lineWidth = 1.2;
        for (let k = 0; k < 3; k++) { const a = q(k); g.beginPath(); g.moveTo(a[0] - 2, a[1] + 1); g.lineTo(a[0] - 3, a[1] - 3); g.moveTo(a[0], a[1] + 1); g.lineTo(a[0], a[1] - 4); g.moveTo(a[0] + 2, a[1] + 1); g.lineTo(a[0] + 3, a[1] - 3); g.stroke(); }
        if (P.fl && hsh(x, y, 30) > 0.88) {
          const fc = ['#ffffff', '#ffe27a', '#ff9ec0', '#c9a6ff'][Math.floor(hsh(x, y, 31) * 4)], a = proj(x + 0.5, y + 0.5);
          for (let k = 0; k < 5; k++) { g.fillStyle = fc; g.beginPath(); g.arc(a[0] + OX + (hsh(x, y, 40 + k) - 0.5) * 22, a[1] + (hsh(x, y, 50 + k) - 0.5) * 10, 1.5, 0, TAU); g.fill(); }
        }
      } else if (d === 'sand' || d === 'sea') {
        g.strokeStyle = d === 'sand' ? 'rgba(150,105,50,.22)' : 'rgba(255,255,255,.14)'; g.lineWidth = 1.2;
        const a = q(1); g.beginPath(); g.ellipse(a[0], a[1], 9, 2.4, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        if (hsh(x, y, 33) > 0.8) { g.fillStyle = d === 'sand' ? 'rgba(120,85,40,.35)' : 'rgba(255,255,255,.3)'; const b = q(2); g.beginPath(); g.arc(b[0], b[1], 1.3, 0, TAU); g.fill(); }
      } else if (d === 'snow') {
        if (hsh(x, y, 34) > 0.7) { g.fillStyle = 'rgba(255,255,255,.95)'; const a = q(3); g.beginPath(); g.arc(a[0], a[1], 1.2, 0, TAU); g.fill(); }
        if (hsh(x, y, 35) > 0.82) { g.fillStyle = 'rgba(120,160,200,.22)'; const a = q(4); g.beginPath(); g.ellipse(a[0], a[1], 7, 2.2, 0, 0, TAU); g.fill(); }
      } else if (d === 'crack') {
        if (hsh(x, y, 36) > 0.6) { g.strokeStyle = 'rgba(40,30,20,.35)'; g.lineWidth = 1.1; const a = q(5); g.beginPath(); g.moveTo(a[0] - 6, a[1]); g.lineTo(a[0] - 1, a[1] + 2); g.lineTo(a[0] + 2, a[1] - 1); g.lineTo(a[0] + 7, a[1] + 1); g.stroke(); }
      } else if (d === 'neon') {
        g.strokeStyle = 'rgba(80,220,255,.10)'; g.lineWidth = 1; diamond(g, X, Y); g.stroke();
      } else if (d === 'floor') {
        g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; diamond(g, X, Y); g.stroke();
      }
    }
    if (t === 1) {
      if (d === 'neon') { g.strokeStyle = (x + y) % 6 === 0 ? 'rgba(255,60,200,.35)' : 'rgba(60,220,255,.22)'; g.lineWidth = 1.5; diamond(g, X, Y); g.stroke(); }
      else {
        for (let k = 0; k < 3; k++) { const a = q(30 + k); g.fillStyle = k % 2 ? 'rgba(90,70,40,.30)' : 'rgba(255,240,200,.22)'; g.beginPath(); g.ellipse(a[0], a[1], 2.2, 1.2, 0, 0, TAU); g.fill(); }
        g.strokeStyle = 'rgba(70,50,30,.2)'; g.lineWidth = 1.6;
        const E = [[1, 0, [1, 0], [1, 1]], [0, 1, [0, 1], [1, 1]], [-1, 0, [0, 0], [0, 1]], [0, -1, [0, 0], [1, 0]]];
        for (const e of E) { if (tAt(x + e[0], y + e[1]) !== 0) continue; const a = proj(x + e[2][0], y + e[2][1]), b = proj(x + e[3][0], y + e[3][1]); g.beginPath(); g.moveTo(a[0] + OX, a[1]); g.lineTo(b[0] + OX, b[1]); g.stroke(); }
        if (d === 'crack' && hsh(x, y, 37) > 0.7) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; const a = q(6); g.beginPath(); g.moveTo(a[0] - 5, a[1]); g.lineTo(a[0] + 5, a[1] + 1); g.stroke(); }
      }
    }
    if (t === 2) {
      if (d === 'neon') { g.strokeStyle = 'rgba(60,220,255,.35)'; g.lineWidth = 1; diamond(g, X, Y); g.stroke(); if ((x * 3 + y) % 7 === 0) { g.fillStyle = 'rgba(255,60,200,.35)'; g.beginPath(); g.arc(X, Y + 16, 3, 0, TAU); g.fill(); } }
      else {
        g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(X, Y + 4); g.lineTo(X + 26, Y + 16); g.lineTo(X, Y + 28); g.lineTo(X - 26, Y + 16); g.closePath(); g.stroke();
        diamond(g, X, Y); g.strokeStyle = 'rgba(0,0,0,.1)'; g.stroke();
      }
    }
    if (t === 3 && d === 'sea') { g.strokeStyle = 'rgba(120,200,255,.18)'; g.lineWidth = 1; const a = q(7); g.beginPath(); g.ellipse(a[0], a[1], 8, 2, 0, 0, TAU); g.stroke(); }
    if (t === 3 && (d === 'neon' || d === 'crack') && hsh(x, y, 38) > 0.8) { g.fillStyle = 'rgba(255,255,255,.18)'; const a = q(8); g.beginPath(); g.ellipse(a[0], a[1], 6, 1.8, 0, 0, TAU); g.fill(); }
    if (t === 4) {
      g.strokeStyle = 'rgba(60,35,15,.45)'; g.lineWidth = 1;
      for (const f of [0.2, 0.4, 0.6, 0.8]) { const a = proj(x, y + f), b = proj(x + 1, y + f); g.beginPath(); g.moveTo(a[0] + OX, a[1]); g.lineTo(b[0] + OX, b[1]); g.stroke(); }
      g.strokeStyle = '#5a3a1f'; g.lineWidth = 2.2;
      for (const xx of [0, 1]) { const a = proj(x + xx, y), b = proj(x + xx, y + 1); g.beginPath(); g.moveTo(a[0] + OX, a[1]); g.lineTo(b[0] + OX, b[1]); g.stroke(); }
    }
  }
  // กำแพงมืด/เหวของดันเจี้ยน — วาดเป็นก้อนสูงหลังจากพื้นทั้งหมด
  function bakeVoids(g, P, tilesAt) {
    const hgt = 18, V = P.v || ['#15121e', '#0e0c15', '#2c2838'];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (tilesAt(x, y) !== 5) continue;
      const p = proj(x, y), X = p[0] + OX, Y = p[1] - hgt;
      g.fillStyle = V[0]; g.beginPath(); g.moveTo(X - 32, Y + 16); g.lineTo(X, Y + 32); g.lineTo(X, Y + 32 + hgt); g.lineTo(X - 32, Y + 16 + hgt); g.closePath(); g.fill();
      g.fillStyle = V[1]; g.beginPath(); g.moveTo(X, Y + 32); g.lineTo(X + 32, Y + 16); g.lineTo(X + 32, Y + 16 + hgt); g.lineTo(X, Y + 32 + hgt); g.closePath(); g.fill();
      diamond(g, X, Y); g.fillStyle = shade(V[2], 0.9 + hsh(x, y, 3) * 0.25); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; g.stroke();
    }
  }

  /* ---------------------------------------------------------------- ต้นไม้/หิน ตามธีม */
  const arc = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const ell = (x, y, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); };
  const shad = (rx, ry) => { ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(0, 2, rx || 18, ry || 8); };
  const trunk = (w, h, col) => { ctx.fillStyle = col; ctx.fillRect(-w / 2, -h, w, h + 2); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-w / 2, -h, w * 0.3, h + 2); };
  function crown(cx, cy, r, c, sway) {
    ctx.fillStyle = c[0]; arc(cx + sway * 0.9, cy, r);
    ctx.fillStyle = c[1]; arc(cx - r * 0.55 + sway * 0.6, cy + r * 0.45, r * 0.7); arc(cx + r * 0.55 + sway * 0.6, cy + r * 0.35, r * 0.7);
    ctx.fillStyle = c[2]; arc(cx - r * 0.25 + sway, cy - r * 0.35, r * 0.5);
  }
  function pine(c, tiers, w, snow, sway) {
    trunk(7, 22, '#5a3d28');
    for (let i = 0; i < tiers; i++) {
      const by = -12 - i * 15, wd = w - i * 4;
      ctx.fillStyle = c[i % c.length]; ctx.beginPath(); ctx.moveTo(sway * (i + 1) * 0.3, by - 22); ctx.lineTo(-wd, by); ctx.lineTo(wd, by); ctx.closePath(); ctx.fill();
      if (snow) { ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.moveTo(sway * (i + 1) * 0.3, by - 22); ctx.lineTo(-wd * 0.62, by - 8); ctx.quadraticCurveTo(0, by - 3, wd * 0.62, by - 8); ctx.closePath(); ctx.fill(); }
    }
  }
  function palm(t, seed, lean, leaf, trunkC, h) {
    const sway = Math.sin(t * 1.3 + seed * 6.28) * 1.6, tx = lean * 8 + sway, ty = -h;
    ctx.strokeStyle = trunkC; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(lean * 10, -h / 2, tx, ty); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
    for (let k = 1; k < 6; k++) { const f = k / 6; ctx.beginPath(); ctx.moveTo(tx * f * f - 2.4, -h * f); ctx.lineTo(tx * f * f + 2.4, -h * f); ctx.stroke(); }
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.62 + sway * 0.02;
      ctx.strokeStyle = leaf[k % 2]; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * 14, ty + Math.sin(a) * 14 - 5, tx + Math.cos(a) * 24, ty + Math.sin(a) * 18 + 8); ctx.stroke();
    }
  }
  function rock(w, h, c, snow) {
    shad(w * 0.9, 7);
    ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(-w, 1); ctx.lineTo(-w * 0.8, -h * 0.6); ctx.lineTo(-w * 0.2, -h); ctx.lineTo(w * 0.5, -h * 0.85); ctx.lineTo(w, -h * 0.2); ctx.lineTo(w * 0.9, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c[1]; ctx.beginPath(); ctx.moveTo(w * 0.1, -h * 0.9); ctx.lineTo(w * 0.5, -h * 0.85); ctx.lineTo(w, -h * 0.2); ctx.lineTo(w * 0.9, 2); ctx.lineTo(w * 0.15, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(-w * 0.2, -h); ctx.lineTo(w * 0.1, -h * 0.9); ctx.lineTo(-w * 0.3, -h * 0.5); ctx.lineTo(-w * 0.7, -h * 0.55); ctx.closePath(); ctx.fill();
    if (snow) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.moveTo(-w * 0.82, -h * 0.58); ctx.lineTo(-w * 0.2, -h); ctx.lineTo(w * 0.5, -h * 0.85); ctx.lineTo(w * 0.7, -h * 0.5); ctx.quadraticCurveTo(0, -h * 0.55, -w * 0.82, -h * 0.58); ctx.fill(); }
  }
  function crystalCl(col, hi, t, seed, n, glow) {
    shad(14, 6);
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * 8, hh = 26 + hsh((seed * 100) | 0, i, 5) * 22, wd = 5 + i % 2 * 2;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - wd, 0); ctx.lineTo(bx - wd * 0.6, -hh * 0.7); ctx.lineTo(bx, -hh); ctx.lineTo(bx + wd * 0.6, -hh * 0.7); ctx.lineTo(bx + wd, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(bx, -hh); ctx.lineTo(bx + wd * 0.6, -hh * 0.7); ctx.lineTo(bx + wd, 0); ctx.lineTo(bx + 1, 0); ctx.closePath(); ctx.fill();
    }
    if (glow) glowPx(0, -16, 46, glow, 0.5 + 0.2 * Math.sin(t * 2 + seed * 9));
  }
  function column(h, broken, c) {
    shad(14, 6);
    ctx.fillStyle = c[1]; ctx.fillRect(-11, -6, 22, 8);
    ctx.fillStyle = c[0]; ctx.fillRect(-7, -h, 14, h - 4);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(1, -h, 6, h - 4);
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; for (const x of [-3, 2]) { ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x, -8); ctx.stroke(); }
    if (broken) { ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(-7, -h); ctx.lineTo(-2, -h - 6); ctx.lineTo(2, -h - 2); ctx.lineTo(7, -h - 8); ctx.lineTo(7, -h); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = c[1]; ctx.fillRect(-10, -h - 5, 20, 6); }
  }
  function pile(c, n) {
    shad(16, 7);
    for (let i = 0; i < n; i++) { const x = (hsh(i, 3, 9) - 0.5) * 22, y = -hsh(i, 4, 9) * 7, s = 4 + hsh(i, 5, 9) * 5; ctx.fillStyle = c[i % c.length]; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.5, y - s); ctx.lineTo(x + s * 0.6, y - s * 0.8); ctx.lineTo(x + s, y); ctx.closePath(); ctx.fill(); }
  }
  function bones(t) {
    shad(14, 6); ctx.strokeStyle = '#e6dfc8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(8, -8); ctx.moveTo(-7, -9); ctx.lineTo(10, -2); ctx.moveTo(-3, -1); ctx.lineTo(3, -12); ctx.stroke();
    ctx.fillStyle = '#efe8d2'; arc(-2, -10, 6); ctx.fillStyle = '#2a2230'; arc(-4, -11, 1.6); arc(0, -11, 1.6); ctx.fillRect(-3.4, -7.6, 2.4, 2);
  }
  function coral(col, col2, t, seed) {
    shad(16, 7); const sw = Math.sin(t * 1.2 + seed * 6) * 1.5;
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const br = [[-9, -26, -14, -42], [0, -34, 2, -52], [9, -24, 15, -40]];
    br.forEach((b, i) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(b[0], b[1] * 0.6, b[0] + b[2] * 0.15 + sw, b[3]); ctx.stroke(); ctx.fillStyle = col2; arc(b[0] + b[2] * 0.15 + sw, b[3], 4); });
  }
  function kelp(t, seed) {
    shad(10, 5);
    for (let i = 0; i < 3; i++) {
      const bx = (i - 1) * 6, hg = 44 + hsh((seed * 100) | 0, i, 6) * 26, ph = t * 1.6 + i + seed * 6;
      ctx.strokeStyle = i % 2 ? '#2f9a5a' : '#46b46a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, 2);
      for (let k = 1; k <= 6; k++) ctx.lineTo(bx + Math.sin(ph + k * 0.7) * 5 * (k / 6), 2 - hg * k / 6);
      ctx.stroke();
    }
  }
  function cactus(t, seed) {
    shad(14, 6); ctx.fillStyle = '#3f9a56';
    rr(-5, -52, 10, 54, 5); ctx.fill(); rr(-16, -36, 9, 5, 2.5); ctx.fill(); rr(-16, -42 - 8, 5, 18, 2.5); ctx.fill(); rr(7, -30, 11, 5, 2.5); ctx.fill(); rr(13, -44, 5, 20, 2.5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(1, -50, 4, 50);
    ctx.strokeStyle = '#e8f0c8'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-5, -10 - i * 7); ctx.lineTo(-8, -12 - i * 7); ctx.moveTo(5, -8 - i * 7); ctx.lineTo(8, -10 - i * 7); ctx.stroke(); }
    ctx.fillStyle = '#ff7aa8'; arc(0, -54, 3);
  }
  function deadTree(c) {
    shad(12, 5); ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(1, -40); ctx.stroke(); ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(1, -26); ctx.lineTo(-14, -40); ctx.moveTo(1, -32); ctx.lineTo(13, -48); ctx.moveTo(-8, -34); ctx.lineTo(-12, -50); ctx.moveTo(9, -42); ctx.lineTo(16, -42); ctx.stroke();
  }
  function mushTree(t, seed) {
    shad(14, 6); ctx.fillStyle = '#e8e0f0'; ctx.fillRect(-4, -26, 8, 28);
    const gl = 0.55 + 0.25 * Math.sin(t * 2 + seed * 9);
    ctx.fillStyle = '#3ad0d8'; ctx.beginPath(); ctx.ellipse(0, -28, 20, 13, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#9af4f0'; for (const [x, y] of [[-8, -33], [5, -36], [10, -30], [-1, -29]]) arc(x, y, 2);
    glowPx(0, -26, 50, [80, 230, 220], 0.6 * gl);
  }
  function neonCrate(c, t, seed) {
    shad(16, 7); box2(-14, -4, 14, 10, 0, 22, c[0], c[1], c[2]);
    box2(-9, -2, 9, 8, 22, 36, shade(c[0], 1.1), shade(c[1], 1.05), shade(c[2], 1.05));
    ctx.fillStyle = '#ffe66a'; ctx.fillRect(-12, -15, 4, 3);
  }
  // กล่องแบบพิกเซล (ใช้พิกัดจอ ไม่ใช่ไอโซ) ใช้กับของเล็ก ๆ
  function box2(x0, y0, x1, y1, z0, z1, top, left, right) {
    const w = (x1 - x0) / 2, d = (y1 - y0) / 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    ctx.fillStyle = left; ctx.beginPath(); ctx.moveTo(cx - w, cy - z0 * 0); ctx.lineTo(cx, cy + d); ctx.lineTo(cx, cy + d - (z1 - z0)); ctx.lineTo(cx - w, cy - (z1 - z0)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = right; ctx.beginPath(); ctx.moveTo(cx, cy + d); ctx.lineTo(cx + w, cy); ctx.lineTo(cx + w, cy - (z1 - z0)); ctx.lineTo(cx, cy + d - (z1 - z0)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(cx - w, cy - (z1 - z0)); ctx.lineTo(cx, cy + d - (z1 - z0)); ctx.lineTo(cx + w, cy - (z1 - z0)); ctx.lineTo(cx, cy - d - (z1 - z0)); ctx.closePath(); ctx.fill();
  }
  function neonPole(t, seed, col) {
    shad(8, 4); ctx.fillStyle = '#242838'; ctx.fillRect(-2.5, -58, 5, 60); ctx.fillStyle = '#3a4058'; ctx.fillRect(-6, -4, 12, 6);
    const fl = 0.8 + 0.2 * Math.sin(t * 7 + seed * 20);
    ctx.fillStyle = col; ctx.fillRect(-9, -62, 18, 6); ctx.fillStyle = '#fff'; ctx.fillRect(-7, -60, 14, 2);
    glowPx(0, -58, 60, col === '#ff3ac8' ? [255, 60, 200] : [60, 220, 255], 0.9 * fl); glowPx(0, -20, 30, col === '#ff3ac8' ? [255, 60, 200] : [60, 220, 255], 0.3 * fl);
  }
  function ventPipe(t, seed) {
    shad(12, 5); ctx.fillStyle = '#4a5068'; ctx.fillRect(-6, -30, 12, 32); ctx.fillStyle = '#6a7290'; ctx.fillRect(-8, -34, 16, 6);
    ctx.fillStyle = 'rgba(210,220,240,' + (0.2 + 0.15 * Math.sin(t * 2 + seed * 7)) + ')'; for (let i = 0; i < 3; i++) arc(Math.sin(t + i + seed * 5) * 3, -42 - ((t * 14 + i * 12) % 36), 5 + i * 2);
  }
  function scrap(t) {
    pile(['#6a6a68', '#8a5a3a', '#4a4a4a', '#9a9a96'], 7); ctx.fillStyle = '#b86a2a'; ctx.fillRect(-9, -16, 6, 5); ctx.fillStyle = '#ffb03a'; arc(6, -10, 1.5);
  }
  function barrels() {
    shad(14, 6);
    for (const [x, y, c] of [[-7, 0, '#8a4a2a'], [7, 0, '#5a6a7a'], [0, -9, '#9a5a30']]) {
      ctx.fillStyle = c; rr(x - 7, y - 20, 14, 21, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 7, y - 14, 14, 2); ctx.fillRect(x - 7, y - 7, 14, 2);
    }
  }
  function stalag(c) {
    shad(14, 6); ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-5, -38); ctx.lineTo(0, -22); ctx.lineTo(5, -52); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c[1]; ctx.beginPath(); ctx.moveTo(3, -48); ctx.lineTo(12, 2); ctx.lineTo(2, 2); ctx.closePath(); ctx.fill();
  }
  function bush(c, flower) {
    shad(14, 6); ctx.fillStyle = c[0]; arc(0, -9, 12); ctx.fillStyle = c[1]; arc(-8, -5, 8); arc(8, -5, 8); ctx.fillStyle = c[2]; arc(-3, -13, 6);
    if (flower) { ctx.fillStyle = flower; for (const [x, y] of [[-6, -10], [4, -14], [8, -5], [-9, -4]]) arc(x, y, 1.8); }
  }
  function bamboo(t, seed) {
    shad(14, 6);
    for (let i = 0; i < 4; i++) {
      const bx = (i - 1.5) * 6, hg = 62 + hsh((seed * 1000) | 0, i, 8) * 26, sw = Math.sin(t * 1.3 + seed * 6.28 + i) * 1.4;
      ctx.strokeStyle = i % 2 ? '#7fb85a' : '#92c868'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, 2); ctx.quadraticCurveTo(bx + sw * 0.3, -hg / 2, bx + sw, -hg); ctx.stroke();
      ctx.strokeStyle = '#4f8a3a'; ctx.lineWidth = 1; for (let k = 1; k < 5; k++) { const yy = -hg * k / 5, xx = bx + sw * (k / 5) * (k / 5); ctx.beginPath(); ctx.moveTo(xx - 2.3, yy); ctx.lineTo(xx + 2.3, yy); ctx.stroke(); }
      ctx.fillStyle = '#5b9b45'; ell(bx + sw, -hg + 6, 8, 2.6, -0.4);
    }
  }
  function bigCanopy(c, vines, t, seed) {
    const sway = Math.sin(t * 1.1 + seed * 6.28) * 1.4;
    shad(24, 10); trunk(10, 34, '#4a3320');
    ctx.fillStyle = c[0]; arc(sway, -52, 24); ctx.fillStyle = c[1]; arc(-16 + sway, -42, 16); arc(16 + sway, -44, 16); arc(sway, -38, 14); ctx.fillStyle = c[2]; arc(-7 + sway, -62, 12);
    if (vines) { ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 1.6; for (let i = 0; i < 4; i++) { const x = -14 + i * 9 + sway; ctx.beginPath(); ctx.moveTo(x, -36); ctx.quadraticCurveTo(x + 3, -26, x + Math.sin(t + i) * 2, -18 - i % 2 * 6); ctx.stroke(); } }
  }
  function snowBush() { shad(12, 5); ctx.fillStyle = '#5a7a6a'; arc(0, -8, 11); ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.ellipse(0, -14, 11, 6, 0, Math.PI, TAU); ctx.fill(); arc(-7, -6, 5); arc(7, -6, 5); }
  function snowTree() { deadTree('#6b5a4a'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-14, -41); ctx.lineTo(-6, -35); ctx.moveTo(13, -49); ctx.lineTo(5, -43); ctx.moveTo(-12, -51); ctx.lineTo(-8, -44); ctx.stroke(); }
  function shellCoral(t, seed) { shad(14, 6); ctx.fillStyle = '#f2a0c0'; ctx.beginPath(); ctx.ellipse(0, -12, 17, 12, 0, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = '#d4789e'; ctx.lineWidth = 1.4; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 7, -1); ctx.lineTo(i * 3.2, -24); ctx.stroke(); } ctx.fillStyle = '#fff3'; ctx.fillRect(-17, -1, 34, 3); glowPx(0, -10, 40, [255, 160, 210], 0.25 + 0.1 * Math.sin(t * 2 + seed * 7)); }

  const TREES = {
    euro: [(t, s, sw) => { shad(); trunk(7, 26, '#6b4a2e'); crown(0, -42, 19, ['#4e8f4a', '#5a9d54', '#76b868'], sw); },
      (t, s, sw) => pine(['#2f6b4a', '#37805a', '#43925f'], 3, 21, 0, sw),
      () => bush(['#4e8f4a', '#5a9d54', '#76b868'], '#ff9ec0'),
      (t, s, sw) => { shad(); trunk(6, 26, '#8a7a66'); crown(0, -42, 18, ['#d68a3a', '#e0a04a', '#f0c070'], sw); }],
    jungle: [(t, s) => bigCanopy(['#2f7a3a', '#388a42', '#4aa050'], true, t, s),
      (t, s) => palm(t, s, 0.6, ['#3f9a4a', '#2f8040'], '#7a5a34', 56),
      () => bush(['#2f8a3c', '#3a9a48', '#58b860'], '#ffd23c'),
      (t, s) => { shad(); const sw = Math.sin(t * 1.4 + s * 6) * 2; ctx.strokeStyle = '#4a7a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(sw, -38); ctx.stroke(); for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#3fa04a' : '#58b85a'; ctx.beginPath(); ctx.ellipse(sw + (k - 2) * 9, -38 + Math.abs(k - 2) * 4, 12, 4.5, (k - 2) * 0.35, 0, TAU); ctx.fill(); } }],
    ruins: [() => deadTree('#5a4a3a'), () => column(54, 1, ['#aaa59a', '#8c877c']), () => pile(['#8c877c', '#a39e92', '#756f64'], 6), () => column(40, 0, ['#9a958a', '#7c776c'])],
    treehouse: [(t, s, sw) => { shad(22, 9); trunk(11, 38, '#6a4a2a'); crown(0, -54, 24, ['#3f8a4a', '#4a9a52', '#62b466'], sw); },
      (t, s) => mushTree(t, s), () => bush(['#3f8a4a', '#4a9a52', '#62b466'], '#ffb0d0'),
      (t, s, sw) => { shad(); trunk(5, 44, '#7a5a38'); crown(0, -54, 14, ['#3f8a4a', '#58a85a', '#74c070'], sw); }],
    thai: [(t, s) => palm(t, s, -0.5, ['#4aa84a', '#389038'], '#9a7a50', 60),
      () => { shad(); for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#5aaa40' : '#4a9a36'; ctx.beginPath(); ctx.ellipse((k - 1.5) * 8, -22 - (k % 2) * 8, 14, 5, (k - 1.5) * 0.5, 0, TAU); ctx.fill(); } trunk(4, 18, '#6a8a3a'); },
      (t, s) => bamboo(t, s),
      (t, s, sw) => { shad(); trunk(6, 26, '#7a6a52'); crown(0, -40, 17, ['#58a850', '#68b860', '#88d078'], sw); ctx.fillStyle = '#fff'; for (const [x, y] of [[-8, -44], [4, -50], [10, -38], [-3, -36]]) arc(x, y, 2.4); }],
    sea: [(t, s) => coral('#ff7a8a', '#ffb0b8', t, s), (t, s) => kelp(t, s), () => rock(16, 22, ['#6a7a8a', '#4a5a6a']), (t, s) => shellCoral(t, s)],
    desert: [(t, s) => cactus(t, s), () => rock(20, 30, ['#c9955a', '#a8743c']), () => { shad(10, 4); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.6; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo((k - 3) * 4, -14 - (k % 3) * 4); ctx.stroke(); } },
      (t, s) => palm(t, s, 0.3, ['#58a040', '#488c34'], '#8a6a44', 46)],
    neon: [(t, s) => neonCrate([['#3a4a6a'], '#2a3652', '#222c46'].flat().slice(0, 3), t, s), (t, s) => neonPole(t, s, '#3ae8ff'), (t, s) => ventPipe(t, s), (t, s) => neonPole(t, s, '#ff3ac8')],
    waste: [(t) => scrap(t), () => barrels(), () => deadTree('#3a2a22'), () => { shad(14, 6); ctx.strokeStyle = '#7a7e86'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-6, -22); ctx.lineTo(8, -34); ctx.stroke(); ctx.fillStyle = '#e8503a'; arc(8, -34, 3); ctx.fillStyle = '#4a4e56'; ctx.fillRect(-14, -3, 12, 5); }],
    snow: [(t, s, sw) => pine(['#2a5a4a', '#316a56', '#3a7a62'], 3, 21, 1, sw), () => rock(18, 24, ['#8a96a6', '#6a768a'], 1), (t, s) => crystalCl('#9ce0f8', '#d8f6ff', t, s, 3, [140, 220, 255]), () => snowBush()],
    dungeon: [() => stalag(['#4a465a', '#34303f']), () => bones(), () => bones(), (t, s) => crystalCl('#a060ff', '#e0b0ff', t, s, 3, [170, 100, 255])]
  };
  TREES.oasis = TREES.desert; TREES.frost = TREES.snow;
  TREES.oasis = [(t, s) => palm(t, s, 0.4, ['#3f9a4a', '#2f8040'], '#8a6a44', 56), (t, s) => cactus(t, s), TREES.desert[1], TREES.desert[3]];
  function tree(theme, v, t, seed) {
    const L = TREES[theme] || TREES.euro, f = L[(v | 0) % L.length], sway = Math.sin(t * 1.3 + seed * 6.28) * 1.4;
    f(t, seed, sway);
  }

  /* ---------------------------------------------------------------- ของตกแต่ง (prop) */
  const LAMP = {
    euro: ['#2a2a30', [255, 200, 120], 'gas'], jungle: ['#4a3a24', [150, 255, 160], 'post'], treehouse: ['#5a4228', [160, 255, 170], 'post'], thai: ['#7a2a20', [255, 160, 70], 'lantern'],
    ruins: ['#3a3630', [255, 150, 70], 'brazier'], desert: ['#6a5028', [255, 210, 120], 'gas'], oasis: ['#6a5028', [255, 210, 120], 'gas'], neon: ['#222636', [80, 230, 255], 'neon'],
    waste: ['#4a4036', [255, 170, 70], 'flood'], snow: ['#4a5a70', [150, 210, 255], 'gas'], frost: ['#4a5a70', [150, 210, 255], 'gas'], sea: ['#2a5a7a', [120, 230, 255], 'gas'], dungeon: ['#3a3040', [255, 150, 70], 'brazier'], bamboo: ['#5b3a24', [255, 150, 60], 'gas']
  };
  function lampProp(theme, t, seed) {
    const L = LAMP[theme] || LAMP.euro, rgb = L[1], fl = 1 + Math.sin(t * 6 + seed * 20) * 0.04, c = 'rgb(' + rgb.join(',') + ')';
    shad(8, 4);
    if (L[2] === 'brazier') {
      ctx.fillStyle = L[0]; ctx.fillRect(-2, -26, 4, 28); ctx.beginPath(); ctx.moveTo(-9, -26); ctx.lineTo(9, -26); ctx.lineTo(5, -18); ctx.lineTo(-5, -18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff9a3a'; ctx.beginPath(); ctx.moveTo(-5, -26); ctx.quadraticCurveTo(0, -42 * fl, 5, -26); ctx.fill(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(-2.5, -26); ctx.quadraticCurveTo(0, -35 * fl, 2.5, -26); ctx.fill();
      glowPx(0, -30, 56, rgb, 0.8); return;
    }
    if (L[2] === 'neon') { neonPole(t, seed, seed > 0.5 ? '#ff3ac8' : '#3ae8ff'); return; }
    if (L[2] === 'flood') {
      ctx.fillStyle = L[0]; ctx.fillRect(-2, -58, 4, 60); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-9, -64, 18, 7); ctx.fillStyle = c; ctx.fillRect(-7, -58, 14, 2);
      glowPx(0, -52, 70, rgb, 0.8); return;
    }
    ctx.fillStyle = L[0]; ctx.fillRect(-2, -50, 4, 52); ctx.fillRect(-5, -4, 10, 6);
    if (L[2] === 'lantern') {
      ctx.fillStyle = '#d0382a'; ctx.beginPath(); ctx.ellipse(0, -44, 6.5 * fl, 8.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b64a'; ctx.fillRect(-3.4, -54, 6.8, 2.2); ctx.fillRect(-3.4, -36, 6.8, 2.2);
    } else {
      ctx.fillStyle = c; ctx.globalAlpha = 0.5 + LIGHTS * 0.5; ctx.beginPath(); ctx.moveTo(-6, -54); ctx.lineTo(6, -54); ctx.lineTo(5, -40); ctx.lineTo(-5, -40); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = L[0]; ctx.lineWidth = 2; ctx.strokeRect(-6, -54, 12, 14); ctx.fillStyle = L[0]; ctx.beginPath(); ctx.moveTo(-8, -54); ctx.lineTo(0, -62); ctx.lineTo(8, -54); ctx.closePath(); ctx.fill();
    }
    glowPx(0, -45, 62, rgb, 0.85); glowPx(0, 0, 34, rgb, 0.25);
  }
  function fountain(o, t) {
    const c = LP(o.w / 2, o.h / 2, 0), broken = o.v === 1;
    ctx.save(); ctx.translate(c[0], c[1]);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 6, 48, 22);
    ctx.fillStyle = '#9a968c'; ell(0, 4, 40, 19); ctx.fillStyle = '#b9b5aa'; ctx.fillRect(-40, -8, 80, 12); ell(0, -8, 40, 19);
    ctx.fillStyle = broken ? '#3a5a50' : '#4d9bcb'; ell(0, -8, 33, 15);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ell(-8, -9, 12, 4);
    ctx.fillStyle = '#c9c5ba'; ctx.fillRect(-5, -34, 10, 28); ell(0, -34, 16, 7); ctx.fillStyle = broken ? '#3a5a50' : '#6fb4dc'; ell(0, -35, 13, 5);
    if (!broken) {
      ctx.strokeStyle = 'rgba(190,230,255,.85)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.5; ctx.beginPath(); ctx.moveTo(0, -38); ctx.quadraticCurveTo(a * 14, -58 + Math.sin(t * 5 + i) * 2, a * 30, -20); ctx.stroke(); }
      ctx.fillStyle = 'rgba(210,240,255,.7)'; for (let i = 0; i < 6; i++) arc(Math.sin(t * 3 + i * 2) * 20, -22 - ((t * 20 + i * 9) % 20), 1.4);
    } else { ctx.fillStyle = '#b9b5aa'; ctx.beginPath(); ctx.moveTo(-5, -34); ctx.lineTo(0, -40); ctx.lineTo(5, -36); ctx.lineTo(5, -34); ctx.fill(); }
    ctx.restore();
  }
  function statue(o, t) {
    const c = LP(o.w / 2, o.h / 2, 0), th = o.v | 0;
    ctx.save(); ctx.translate(c[0], c[1]);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 4, 34, 15);
    box2(-26, -10, 26, 12, 0, 12, '#b9b5aa', '#9a968c', '#7c786e'); box2(-18, -6, 18, 8, 12, 24, '#c9c5ba', '#a9a59a', '#8c887e');
    const col = th === 2 ? '#7aa8a8' : '#c8c2b4';
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-8, -24); ctx.lineTo(-6, -52); ctx.lineTo(6, -52); ctx.lineTo(8, -24); ctx.closePath(); ctx.fill();
    arc(0, -60, 7); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(1, -52, 5, 28);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, -48); ctx.lineTo(16, -64); ctx.stroke();
    ctx.fillStyle = '#e8c860'; ctx.fillRect(14, -76, 3, 18); ctx.restore();
  }
  function bench() {
    shad(14, 5); box2(-14, -4, 14, 4, 6, 12, '#8a6a44', '#7a5a38', '#5a3d28'); ctx.fillStyle = '#6a4a2c'; ctx.fillRect(-12, -14, 3, 8); ctx.fillRect(9, -14, 3, 8);
    ctx.fillStyle = '#7a5a38'; ctx.fillRect(-13, -20, 26, 4);
  }
  function tent(o, t) {
    const c = LP(o.w / 2, o.h / 2, 0), v = o.v | 0, cols = [['#c0392b', '#f4e9d0'], ['#2f7fb0', '#f4e9d0'], ['#c8902a', '#7a3a1a']][v % 3];
    ctx.save(); ctx.translate(c[0], c[1]);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 6, 54, 22);
    ctx.fillStyle = shade(cols[0], 0.78); ctx.beginPath(); ctx.moveTo(-50, 8); ctx.lineTo(0, -46); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -46); ctx.lineTo(50, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cols[1]; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-34 + i * 17, -2 + i * 2); ctx.lineTo(-24 + i * 17, -2 + i * 2); ctx.lineTo(0, -46); ctx.closePath(); }
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(-9, 14); ctx.lineTo(0, -16); ctx.lineTo(10, 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8b64a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(0, -58); ctx.stroke(); ctx.fillStyle = '#e8b64a'; ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(12, -54 + Math.sin(t * 4) * 1.5); ctx.lineTo(0, -50); ctx.fill();
    ctx.restore();
  }
  function boat(o, t) {
    const c = LP(o.w / 2, o.h / 2, 0), sw = Math.sin(t * 1.4 + (o.x + o.y)) * 1.8;
    ctx.save(); ctx.translate(c[0], c[1] + sw);
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ell(0, 5, 38, 11);
    ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.moveTo(-38, -4); ctx.quadraticCurveTo(-30, 10, 0, 10); ctx.quadraticCurveTo(30, 10, 38, -4); ctx.lineTo(30, -4); ctx.lineTo(-30, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a06a3a'; ctx.beginPath(); ctx.moveTo(-38, -4); ctx.lineTo(-30, -9); ctx.lineTo(30, -9); ctx.lineTo(38, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d0382a'; ctx.beginPath(); ctx.moveTo(-14, -9); ctx.quadraticCurveTo(0, -30, 14, -9); ctx.closePath(); ctx.fill();
    const goods = [['#e8573d', '#f2c14e', '#8fcf5a'], ['#f08a3a', '#7cc65a', '#e86a4a'], ['#f2c14e', '#e8573d', '#f08a3a']][(o.v | 0) % 3];
    goods.forEach((cc, i) => { ctx.fillStyle = cc; arc(-24 + i * 8, -12, 4); arc(20 + i * 5, -12, 4); });
    ctx.restore();
  }
  function giantTree(o, t) {
    const c = LP(o.w / 2, o.h / 2, 0);
    ctx.save(); ctx.translate(c[0], c[1]);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 10, 110, 40);
    ctx.fillStyle = '#5a3d24'; ctx.beginPath(); ctx.moveTo(-34, 14); ctx.quadraticCurveTo(-24, -40, -18, -150); ctx.lineTo(18, -150); ctx.quadraticCurveTo(24, -40, 34, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a3019'; ctx.beginPath(); ctx.moveTo(6, -150); ctx.lineTo(18, -150); ctx.quadraticCurveTo(24, -40, 34, 14); ctx.lineTo(10, 14); ctx.quadraticCurveTo(12, -60, 6, -150); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.5; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 9, 8); ctx.quadraticCurveTo(k * 7, -60, k * 5, -140); ctx.stroke(); }
    // บันไดเชือก + ไฟกระพริบ
    ctx.strokeStyle = '#d9c28a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-24, -12); ctx.lineTo(-30, -96); ctx.moveTo(-14, -12); ctx.lineTo(-20, -96); ctx.stroke();
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-26 - k * 0.4, -20 - k * 14); ctx.lineTo(-16 - k * 0.4, -20 - k * 14); ctx.stroke(); }
    const sw = Math.sin(t * 1.1) * 2;
    ctx.fillStyle = '#2f7a3a'; arc(sw, -170, 56); ctx.fillStyle = '#3a8a46'; arc(-46 + sw, -148, 38); arc(48 + sw, -150, 38); arc(sw * 0.6, -128, 34); ctx.fillStyle = '#58b060'; arc(-22 + sw, -196, 28); arc(26 + sw, -190, 24);
    for (let k = 0; k < 7; k++) { const a = hsh(k, 3, 4) * TAU, rr_ = 60 + hsh(k, 5, 6) * 28; glowPx(Math.cos(a) * rr_ * 0.9, -150 + Math.sin(a) * rr_ * 0.5, 30, [255, 230, 140], 0.5 + 0.3 * Math.sin(t * 2 + k)); ctx.fillStyle = '#ffe9a0'; arc(Math.cos(a) * rr_ * 0.9, -150 + Math.sin(a) * rr_ * 0.5, 2.4); }
    ctx.restore();
  }
  function holo(o, t) {
    const c = LP(o.w / 2, o.h / 2, 0);
    ctx.save(); ctx.translate(c[0], c[1]);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 6, 38, 16); box2(-22, -8, 22, 10, 0, 8, '#4a5068', '#363a4c', '#2a2e3e');
    const fl = 0.75 + 0.25 * Math.sin(t * 5), a = 0.55 + 0.2 * Math.sin(t * 3);
    ctx.globalAlpha = a; ctx.fillStyle = '#3ae8ff'; ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(20, -4); ctx.lineTo(14, -78); ctx.lineTo(-14, -78); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.9 * fl; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; for (let k = 0; k < 6; k++) { const yy = -12 - k * 11 - ((t * 12) % 11); ctx.beginPath(); ctx.moveTo(-16, yy); ctx.lineTo(16, yy); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#ff3ac8'; ctx.font = '800 15px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('2099', 0, -40); ctx.fillStyle = '#fff'; ctx.font = '700 9px ' + FONT; ctx.fillText('NEON CITY', 0, -27);
    glowPx(0, -40, 80, [60, 220, 255], 0.8 * fl); ctx.restore();
  }
  function crystalProp(o, t) { const c = LP(o.w / 2, o.h / 2, 0); ctx.save(); ctx.translate(c[0], c[1]); crystalCl(o.v ? '#b6a0ff' : '#8ad8f4', '#e8f8ff', t, hsh(o.x, o.y, 2), 4, o.v ? [170, 140, 255] : [140, 220, 255]); ctx.restore(); }
  function pillarProp(o, t) {
    const c = LP(o.w / 2, o.h / 2, 0), v = o.v | 0; ctx.save(); ctx.translate(c[0], c[1]);
    if (v === 2) { column(78, 0, ['#8fb0b0', '#6a8a8a']); glowPx(0, -50, 46, [100, 220, 230], 0.45); }
    else column(70, 0, ['#c0392b', '#e8b64a']);
    ctx.restore();
  }
  function ruinWall(o) {
    const w = o.w, h = o.h, v = o.v | 0, z = 20 + v * 6;
    shadowDiamond(-0.1, -0.1, w + 0.2, h + 0.2, 0.2);
    box(0.08, 0.08, w - 0.08, h - 0.08, 0, z, '#8c877c', '#a39e92', '#756f64');
    // ขอบบนแหว่ง
    const n = Math.max(w, h);
    for (let k = 0; k < n; k++) { const hh = 4 + hsh(o.x + k, o.y, 11) * 12; const a = w >= h ? [k + 0.1, 0.08, k + 0.9, h - 0.08] : [0.08, k + 0.1, w - 0.08, k + 0.9]; if (hsh(o.x + k, o.y + 3, 12) > 0.4) box(a[0], a[1], a[2], a[3], z, z + hh, '#8c877c', '#b0ab9f', '#837d72'); }
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; for (let k = 1; k < 3; k++) { const p0 = LP(0, h, z * k / 3), p1 = LP(w, h, z * k / 3); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
  }
  function pyramid(o, t) {
    const w = o.w, h = o.h, ap = LP(w / 2, h / 2, 150);
    shadowDiamond(-0.3, -0.3, w + 0.5, h + 0.5, 0.22);
    const A = LP(0, h, 0), B = LP(w, h, 0), C = LP(w, 0, 0);
    poly([A, B, ap], '#e8c97e'); poly([B, C, ap], '#b8975a');
    ctx.strokeStyle = 'rgba(90,60,20,.3)'; ctx.lineWidth = 1;
    for (let k = 1; k < 8; k++) { const f = k / 8, a = LP(w * f * 0 + 0, h - (h) * 0, 0); const p0 = LP(0 + (w / 2) * f, h - (h / 2) * f, 150 * f), p1 = LP(w - (w / 2) * f, h - (h / 2) * f, 150 * f), p2 = LP(w - (w / 2) * f, 0 + (h / 2) * f, 150 * f); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
    const door = LP(w / 2, h, 0); poly([[door[0] - 12, door[1] + 4], [door[0] + 12, door[1] + 4], [door[0] + 12, door[1] - 22], [door[0] - 12, door[1] - 22]], '#2a1a0c');
    glowPx(door[0], door[1] - 10, 40, [255, 190, 90], 0.5);
    ctx.fillStyle = '#ffd860'; ctx.beginPath(); ctx.moveTo(ap[0] - 7, ap[1] + 8); ctx.lineTo(ap[0], ap[1] - 8); ctx.lineTo(ap[0] + 7, ap[1] + 8); ctx.fill();
  }
  function factory(o, t) {
    const w = o.w, h = o.h;
    shadowDiamond(-0.3, -0.3, w + 0.4, h + 0.4, 0.25);
    box(0.1, 0.1, w - 0.1, h - 0.1, 0, 44, '#6a6e76', '#7e828c', '#555961');
    box(0.1, 0.1, w - 0.1, h - 0.1, 44, 50, '#4a4e56', '#5a5e68', '#42464e');
    for (let k = 0; k < w - 1; k++) { const p0 = LP(0.4 + k, h, 14), p1 = LP(0.9 + k, h, 14), p2 = LP(0.9 + k, h, 30), p3 = LP(0.4 + k, h, 30); poly([p0, p1, p2, p3], mixc('#2a2e36', '#ffb03a', LIGHTS * 0.7), '#222', 1); }
    const sk = LP(w - 1, 1, 50), sm = (o.v | 0) ? 70 : 90;
    ctx.fillStyle = '#5a5e66'; ctx.fillRect(sk[0] - 8, sk[1] - sm, 16, sm); ctx.fillStyle = '#c0392b'; ctx.fillRect(sk[0] - 8, sk[1] - sm, 16, 6); ctx.fillStyle = '#3a3e46'; ctx.fillRect(sk[0] - 6, sk[1] - sm - 6, 12, 6);
    ctx.fillStyle = 'rgba(70,70,76,.55)'; for (let i = 0; i < 4; i++) arc(sk[0] + Math.sin(t * 0.8 + i) * 6 + i * 3, sk[1] - sm - 14 - ((t * 14 + i * 14) % 56), 6 + i * 2.4);
    glowPx(sk[0], sk[1] - sm, 40, [255, 140, 60], 0.4);
  }
  function pipeProp(o) {
    const w = o.w, h = o.h; shadowDiamond(0, 0, w, h, 0.18);
    box(0.2, 0.2, w - 0.2, h - 0.2, 4, 16, '#7a7e86', '#8e929c', '#5e626a');
    ctx.strokeStyle = '#4a4e56'; ctx.lineWidth = 2; const n = Math.max(w, h); for (let k = 1; k < n; k++) { const a = w >= h ? LP(k, h - 0.2, 4) : LP(w - 0.2, k, 4), b = w >= h ? LP(k, h - 0.2, 16) : LP(w - 0.2, k, 16); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  }
  function conveyor(o, t) {
    const w = o.w, h = o.h; box(0.1, 0.2, w - 0.1, h - 0.2, 0, 4, '#3a3e46', '#4a4e56', '#2e3238');
    ctx.fillStyle = '#ffb03a'; for (let k = 0; k < w * 3; k++) { const f = ((k / 3 + t * 0.5) % w); const p = LP(f, h / 2, 4); ctx.fillRect(p[0] - 3, p[1] - 1, 6, 2); }
  }
  function torchDeco(o, t) {
    const c = LP(0.5, 0.5, 0), fl = 1 + Math.sin(t * 9 + o.x * 3 + o.y) * 0.1;
    ctx.save(); ctx.translate(c[0], c[1] - 26);
    ctx.fillStyle = '#5a3d28'; ctx.fillRect(-1.6, 0, 3.2, 14); ctx.fillStyle = '#3a2a1c'; ctx.fillRect(-4, -1, 8, 3);
    ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(-5, -1); ctx.quadraticCurveTo(0, -20 * fl, 5, -1); ctx.fill(); ctx.fillStyle = '#ffd860'; ctx.beginPath(); ctx.moveTo(-2.4, -1); ctx.quadraticCurveTo(0, -12 * fl, 2.4, -1); ctx.fill();
    glowPx(0, -6, 66, [255, 140, 60], 0.85); ctx.restore();
  }
  const PROPS = {
    lamp: (o, t, th, seed) => { const c = LP(0.5, 0.5, 0); ctx.save(); ctx.translate(c[0], c[1]); lampProp(th, t, seed); ctx.restore(); },
    fountain, statue, bench: (o) => { const c = LP(0.5, 0.5, 0); ctx.save(); ctx.translate(c[0], c[1]); bench(); ctx.restore(); },
    tent, boat, gianttree: giantTree, holo, crystal: crystalProp, pillar: pillarProp, ruinwall: ruinWall, pyramid, factory, pipe: pipeProp, conveyor, torch: torchDeco,
    stall: (o) => drawStall(o.v | 0)
  };
  function prop(o, t, theme, seed) { const f = PROPS[o.kind]; if (f) f(o, t, theme, seed); }

  /* ---------------------------------------------------------------- อาคาร */
  const glassC = (dark, lit) => mixc(dark, lit, LIGHTS);
  function winS(c, y, z, wd, ht, o) {
    o = o || {}; poly([LP(c - wd, y, z), LP(c + wd, y, z), LP(c + wd, y, z + ht), LP(c - wd, y, z + ht)], glassC(o.dark || '#3a4658', o.lit || '#ffd27a'), o.frame || '#4a3426', 1.3);
    if (o.cross !== 0) { line(LP(c, y, z), LP(c, y, z + ht), o.frame || '#4a3426', 1); line(LP(c - wd, y, z + ht / 2), LP(c + wd, y, z + ht / 2), o.frame || '#4a3426', 1); }
    const p = LP(c, y, z + ht / 2); glowPx(p[0], p[1], 26, o.glow || [255, 190, 90], 0.5);
  }
  function winE(x, c, z, wd, ht, o) {
    o = o || {}; poly([LP(x, c - wd, z), LP(x, c + wd, z), LP(x, c + wd, z + ht), LP(x, c - wd, z + ht)], glassC(o.dark || '#3a4658', o.lit || '#ffd27a'), o.frame || '#4a3426', 1.3);
    if (o.cross !== 0) { line(LP(x, c, z), LP(x, c, z + ht), o.frame || '#4a3426', 1); line(LP(x, c - wd, z + ht / 2), LP(x, c + wd, z + ht / 2), o.frame || '#4a3426', 1); }
    const p = LP(x, c, z + ht / 2); glowPx(p[0], p[1], 26, o.glow || [255, 190, 90], 0.45);
  }
  function doorS(c, y, z, wd, ht, col, arch) {
    const a = LP(c - wd, y, z), b = LP(c + wd, y, z), d = LP(c + wd, y, z + ht), e = LP(c - wd, y, z + ht);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]);
    if (arch) { const m = LP(c, y, z + ht + 5); ctx.quadraticCurveTo(m[0], m[1] - 3, e[0], e[1]); } else ctx.lineTo(e[0], e[1]);
    ctx.closePath(); ctx.fillStyle = col || '#5a3622'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.3; ctx.stroke();
    const k = LP(c + wd * 0.55, y, z + ht * 0.45); ctx.fillStyle = '#e8c860'; arc(k[0], k[1], 1.4);
    const g = LP(c, y, z + 6); glowPx(g[0], g[1], 30, [255, 170, 80], 0.3);
  }
  function wallBox(x0, y0, x1, y1, z0, z1, col, lo) {
    box(x0, y0, x1, y1, z0, z1, shade(col, 1.12), col, shade(col, lo || 0.8));
  }
  function plank(x0, y0, x1, y1, z0, z1, col) { // เส้นกรอบไม้
    const lc = shade(col, 0.62); for (let z = z0 + 8; z < z1 - 1; z += 10) { line(LP(x0, y1, z), LP(x1, y1, z), 'rgba(0,0,0,.12)', 1); line(LP(x1, y1, z), LP(x1, y0, z), 'rgba(0,0,0,.12)', 1); }
    void lc;
  }
  function timber(x0, y0, x1, y1, z0, z1, col) { // โครงไม้แบบยุโรป
    const nx = Math.max(1, Math.round(x1 - x0)), ny = Math.max(1, Math.round(y1 - y0));
    for (let k = 0; k <= nx; k++) { const px = x0 + k * (x1 - x0) / nx; line(LP(px, y1, z0), LP(px, y1, z1), col, 2.4); }
    for (let k = 0; k <= ny; k++) { const py = y0 + k * (y1 - y0) / ny; line(LP(x1, py, z0), LP(x1, py, z1), shade(col, 0.8), 2.4); }
    line(LP(x0, y1, z1), LP(x1, y1, z1), col, 2.6); line(LP(x1, y1, z1), LP(x1, y0, z1), shade(col, 0.8), 2.6);
  }
  function gable(x0, y0, x1, y1, z, rh, ov, cols, wallCol, o) {
    o = o || {};
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, alongX = (x1 - x0) >= (y1 - y0);
    const A = LP(x0 - ov, y0 - ov, z), B = LP(x1 + ov, y0 - ov, z), C = LP(x1 + ov, y1 + ov, z), D = LP(x0 - ov, y1 + ov, z);
    let R1, R2;
    if (alongX) { R1 = LP(x0 - ov, cy, z + rh); R2 = LP(x1 + ov, cy, z + rh); poly([A, B, R2, R1], cols[2]); poly([LP(x1, y0, z), LP(x1, y1, z), LP(x1, cy, z + rh * 0.92)], wallCol ? shade(wallCol, 0.8) : cols[1]); poly([D, C, R2, R1], cols[0], 'rgba(0,0,0,.25)', 1); }
    else { R1 = LP(cx, y0 - ov, z + rh); R2 = LP(cx, y1 + ov, z + rh); poly([A, D, R2, R1], cols[2]); poly([LP(x0, y1, z), LP(x1, y1, z), LP(cx, y1, z + rh * 0.92)], wallCol || cols[1], 'rgba(0,0,0,.2)', 1); poly([B, C, R2, R1], cols[1], 'rgba(0,0,0,.25)', 1); }
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
    for (const f of [0.34, 0.67]) { const a = alongX ? [LP(x0 - ov, y1 + ov - (y1 + ov - cy) * f, z + rh * f), LP(x1 + ov, y1 + ov - (y1 + ov - cy) * f, z + rh * f)] : [LP(x1 + ov - (x1 + ov - cx) * f, y0 - ov, z + rh * f), LP(x1 + ov - (x1 + ov - cx) * f, y1 + ov, z + rh * f)]; ctx.beginPath(); ctx.moveTo(a[0][0], a[0][1]); ctx.lineTo(a[1][0], a[1][1]); ctx.stroke(); }
    line(R1, R2, shade(cols[0], 1.2), 2.4);
    return alongX ? [R1, R2] : [R1, R2];
  }
  function chimney(x, y, z, col, smoke, t) {
    box(x, y, x + 0.45, y + 0.45, z, z + 16, shade(col, 1.15), col, shade(col, 0.78));
    if (smoke) { const p = LP(x + 0.22, y + 0.22, z + 18); ctx.fillStyle = 'rgba(210,210,215,.5)'; for (let i = 0; i < 3; i++) arc(p[0] + Math.sin(t * 0.9 + i) * 3 + i * 2, p[1] - ((t * 10 + i * 9) % 28), 4 + i * 1.6); }
  }
  function crenel(x0, y0, x1, y1, z, col) { // กำแพงเมือง
    const nx = Math.max(2, Math.round((x1 - x0) * 1.6)), ny = Math.max(2, Math.round((y1 - y0) * 1.6));
    for (let k = 0; k < nx; k += 2) box(x0 + k * (x1 - x0) / nx, y1 - 0.2, x0 + (k + 1) * (x1 - x0) / nx, y1, z, z + 7, shade(col, 1.12), col, shade(col, 0.8));
    for (let k = 0; k < ny; k += 2) box(x1 - 0.2, y0 + k * (y1 - y0) / ny, x1, y0 + (k + 1) * (y1 - y0) / ny, z, z + 7, shade(col, 1.12), col, shade(col, 0.8));
  }
  function cone(cx, cy, z, r, h, c1, c2) { // หลังคากรวย
    const b = LP(cx, cy, z), top = LP(cx, cy, z + h), rx = r * 32 * 0.9, ry = r * 16 * 0.9;
    ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(b[0] - rx, b[1]); ctx.lineTo(top[0], top[1]); ctx.lineTo(b[0] + rx, b[1]); ctx.ellipse(b[0], b[1], rx, ry, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(b[0] - rx, b[1]); ctx.lineTo(top[0], top[1]); ctx.lineTo(b[0] - rx * 0.1, b[1] + ry); ctx.ellipse(b[0], b[1], rx, ry, 0, Math.PI * 0.55, Math.PI); ctx.closePath(); ctx.fill();
  }
  function round(cx, cy, z0, z1, r, col) { // ทรงกระบอก
    const b = LP(cx, cy, z0), tp = LP(cx, cy, z1), rx = r * 32 * 0.95, ry = r * 16 * 0.95;
    const g = ctx.createLinearGradient(b[0] - rx, 0, b[0] + rx, 0); g.addColorStop(0, shade(col, 1.08)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, 0.68));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(b[0] - rx, b[1]); ctx.lineTo(tp[0] - rx, tp[1]); ctx.ellipse(tp[0], tp[1], rx, ry, 0, Math.PI, 0); ctx.lineTo(b[0] + rx, b[1]); ctx.ellipse(b[0], b[1], rx, ry, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, 1.15); ctx.beginPath(); ctx.ellipse(tp[0], tp[1], rx, ry, 0, 0, TAU); ctx.fill();
  }
  function flag(lx, ly, lz, col, t) {
    const p = LP(lx, ly, lz); line(p, [p[0], p[1] - 26], '#6a5a44', 1.6);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 26); ctx.quadraticCurveTo(p[0] + 8, p[1] - 28 + Math.sin(t * 4) * 2, p[0] + 16, p[1] - 22 + Math.sin(t * 4 + 1) * 2); ctx.lineTo(p[0], p[1] - 14); ctx.closePath(); ctx.fill();
  }
  function sign(o, lx, lz) { if (o.name && typeof hangSign === 'function') hangSign(o.name, lx, o.h + 0.55, lz); }

  const EURO_WALL = ['#f0e4cc', '#e8d9c0', '#e6d2cc', '#dfe6d2'];
  const EURO_ROOF = [['#b5503c', '#9a4030', '#7a3224'], ['#4f6a8a', '#3f5876', '#30445c'], ['#8a5a3c', '#744a30', '#5a3824'], ['#5a7a58', '#4a6648', '#3a5238']];
  function euroHouse(o, t, big) {
    const w = o.w, h = o.h, v = (o.v | 0) % 4, wc = EURO_WALL[v];
    shadowDiamond(-0.35, -0.35, w + 0.5, h + 0.5, 0.2);
    box(-0.08, -0.08, w + 0.08, h + 0.08, 0, 4, '#c8c3b6', '#a39e92', '#8a857a');
    const wh = big ? 40 : 30;
    wallBox(0, 0, w, h, 4, 4 + wh, wc); timber(0, 0, w, h, 4, 4 + wh, '#6a4a30');
    if (big) { line(LP(0, h, 4 + wh * 0.55), LP(w, h, 4 + wh * 0.55), '#6a4a30', 3); line(LP(w, h, 4 + wh * 0.55), LP(w, 0, 4 + wh * 0.55), '#5a3d28', 3); }
    const nS = Math.max(1, Math.round(w / 1.8)), dI = Math.floor(nS / 2);
    for (let k = 0; k < nS; k++) { const c = (k + 0.5) * w / nS; if (k === dI) doorS(c, h, 4, 0.42, 20, '#6a3a22', true); else { winS(c, h, 4 + (big ? 6 : 8), 0.28, 13); if (big) winS(c, h, 4 + wh * 0.62, 0.28, 12); } }
    const nE = Math.max(1, Math.round(h / 2));
    for (let k = 0; k < nE; k++) { winE(w, (k + 0.5) * h / nE, 4 + (big ? 6 : 8), 0.28, 13); if (big) winE(w, (k + 0.5) * h / nE, 4 + wh * 0.62, 0.28, 12); }
    const rh = big ? 26 : 22, rc = EURO_ROOF[(v + (big ? 1 : 0)) % 4];
    gable(0, 0, w, h, 4 + wh, rh, 0.4, rc, wc);
    if (w >= 4) chimney(w * 0.65, h * 0.35, 4 + wh + rh * 0.55, '#8a6a58', true, t);
    if (v === 1) { const p = LP(w + 0.2, h + 0.2, 4 + 16); ctx.fillStyle = '#c0392b'; arc(p[0], p[1], 2.4); }
  }
  function euroTavern(o, t) {
    euroHouse(o, t, true); const w = o.w, h = o.h;
    box(w * 0.5 - 0.5, h - 0.05, w * 0.5 + 0.5, h + 0.55, 0, 12, '#9a6a3a', '#7a5028', '#5a3a1e');
    barrelAt(0.5, h + 0.4); barrelAt(w - 0.6, h + 0.4);
    sign(o, Math.floor(w / 2) - 1.2, 28);
  }
  function barrelAt(x, y) { const p = LP(x, y, 0); ctx.fillStyle = '#7a5028'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 6, 6, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p[0] - 6, p[1] - 9); ctx.lineTo(p[0] + 6, p[1] - 9); ctx.moveTo(p[0] - 6, p[1] - 3); ctx.lineTo(p[0] + 6, p[1] - 3); ctx.stroke(); }
  function euroShop(o, t) {
    euroHouse(o, t, false); const w = o.w, h = o.h, c = Math.floor(w / 2) + 0.5;
    for (let i = 0; i < 6; i++) { const a = c - 1.5 + i * 0.5, b = a + 0.5; poly([LP(a, h + 0.02, 26), LP(b, h + 0.02, 26), LP(b, h + 0.6, 19), LP(a, h + 0.6, 19)], i % 2 ? '#f4e9d0' : '#c0392b'); }
    sign(o, Math.floor(w / 2) - 1.2, 30);
  }
  function euroSmith(o, t) {
    const w = o.w, h = o.h;
    shadowDiamond(-0.35, -0.35, w + 0.5, h + 0.5, 0.2); box(-0.08, -0.08, w + 0.08, h + 0.08, 0, 4, '#c8c3b6', '#a39e92', '#8a857a');
    wallBox(0, 0, w, h, 4, 34, '#a8a49a'); for (let z = 12; z < 34; z += 8) { line(LP(0, h, z), LP(w, h, z), 'rgba(0,0,0,.14)', 1); line(LP(w, h, z), LP(w, 0, z), 'rgba(0,0,0,.14)', 1); }
    gable(0, 0, w, h, 34, 18, 0.4, ['#5a5e68', '#4a4e58', '#3a3e48'], '#a8a49a');
    doorS(w * 0.35, h, 4, 0.7, 22, '#2a1c14', false); glowPx(LP(w * 0.35, h, 12)[0], LP(w * 0.35, h, 12)[1], 50, [255, 120, 40], 0.9);
    winS(w * 0.78, h, 12, 0.3, 12, { lit: '#ff9a4a', glow: [255, 120, 40] }); winE(w, h / 2, 12, 0.3, 12, { lit: '#ff9a4a', glow: [255, 120, 40] });
    chimney(w * 0.7, h * 0.3, 52, '#5a5650', true, t);
    const a = LP(w + 0.3, h + 0.2, 0); ctx.fillStyle = '#3a3a40'; ctx.fillRect(a[0] - 7, a[1] - 11, 14, 5); ctx.fillRect(a[0] - 3, a[1] - 6, 6, 6);
    sign(o, Math.floor(w / 2) - 0.2, 26);
  }
  function euroGuild(o, t) {
    const w = o.w, h = o.h;
    shadowDiamond(-0.35, -0.35, w + 0.5, h + 0.5, 0.2); box(-0.1, -0.1, w + 0.1, h + 0.1, 0, 5, '#c8c3b6', '#a39e92', '#8a857a');
    wallBox(0, 0, w, h, 5, 46, '#c9c2b0'); for (let z = 14; z < 46; z += 9) { line(LP(0, h, z), LP(w, h, z), 'rgba(0,0,0,.1)', 1); line(LP(w, h, z), LP(w, 0, z), 'rgba(0,0,0,.1)', 1); }
    const nS = Math.max(3, Math.round(w / 1.6)), dI = Math.floor(nS / 2);
    for (let k = 0; k < nS; k++) { const c = (k + 0.5) * w / nS; if (k === dI) doorS(c, h, 5, 0.6, 26, '#5a3622', true); else { winS(c, h, 10, 0.26, 14); winS(c, h, 30, 0.26, 10); } }
    for (let k = 0; k < 3; k++) winE(w, (k + 0.5) * h / 3, 12, 0.28, 14);
    box(-0.2, -0.2, w + 0.2, h + 0.2, 46, 49, '#d8d2c0', '#b0aa98', '#908a7a'); crenel(-0.2, -0.2, w + 0.2, h + 0.2, 49, '#c9c2b0');
    cone(w * 0.12, h * 0.15, 49, 0.9, 30, '#3f6fb0', '#2f5890'); cone(w * 0.88, h * 0.15, 49, 0.9, 30, '#3f6fb0', '#2f5890');
    flag(w / 2, h * 0.3, 49, '#2f5890', t);
    const c = (Math.floor(w / 2) + 0.5) * 1; poly([LP(c - 0.9, h + 0.02, 44), LP(c + 0.9, h + 0.02, 44), LP(c + 0.9, h + 0.02, 34), LP(c, h + 0.02, 30), LP(c - 0.9, h + 0.02, 34)], '#2f5890', '#e8c860', 1.4);
    sign(o, Math.floor(w / 2) - 1.2, 34);
  }
  function euroChurch(o, t) {
    const w = o.w, h = o.h, snow = o.snow;
    shadowDiamond(-0.35, -0.35, w + 0.5, h + 0.5, 0.2); box(-0.08, -0.08, w + 0.08, h + 0.08, 0, 4, '#c8c3b6', '#a39e92', '#8a857a');
    const wc = snow ? '#d8dee8' : '#e6e0d2';
    wallBox(0, h * 0.28, w, h, 4, 44, wc);
    gable(0, h * 0.28, w, h, 44, 24, 0.3, snow ? ['#f4f8ff', '#dce6f2', '#b8c8dc'] : ['#4f6a8a', '#3f5876', '#30445c'], wc);
    wallBox(w * 0.25, 0, w * 0.75, h * 0.34, 4, 84, shade(wc, 0.97));
    cone(w / 2, h * 0.17, 84, Math.min(w, h) * 0.36 + 0.2, 40, snow ? '#f4f8ff' : '#6a82a8', snow ? '#c8d8ea' : '#4f6688');
    const tp = LP(w / 2, h * 0.17, 126); line(tp, [tp[0], tp[1] - 12], '#e8c860', 2.2); line([tp[0] - 4, tp[1] - 8], [tp[0] + 4, tp[1] - 8], '#e8c860', 2.2);
    const cs = (w / 2), y1 = h * 0.34;
    winS(cs, y1, 56, 0.3, 18, { lit: '#ffe9a0', dark: '#3a4a68' });
    doorS(w / 2, h, 4, 0.6, 24, '#5a3622', true);
    const rp = LP(w / 2, h + 0.02, 40); ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(rp[0], rp[1], 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7a5a28'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(rp[0], rp[1]); ctx.lineTo(rp[0] + Math.cos(k * 0.785) * 5, rp[1] + Math.sin(k * 0.785) * 5); ctx.stroke(); }
    for (let k = 0; k < 3; k++) winE(w, h * 0.45 + k * h * 0.17, 14, 0.2, 20, { lit: ['#ff9a9a', '#9ad0ff', '#ffe08a'][k], dark: '#2a3a58', cross: 0 });
  }
  function euroHall(o, t, snow) {
    const w = o.w, h = o.h;
    shadowDiamond(-0.35, -0.35, w + 0.5, h + 0.5, 0.2); box(-0.1, -0.1, w + 0.1, h + 0.1, 0, 5, '#cfcabe', '#aaa59a', '#8f8a80');
    const wc = snow ? '#cfd8e6' : '#e2d6b8';
    wallBox(0, 0, w, h, 5, 42, wc); box(-0.15, -0.15, w + 0.15, h + 0.15, 42, 46, shade(wc, 1.05), shade(wc, 0.9), shade(wc, 0.75));
    const n = Math.max(3, Math.round(w / 1.4));
    for (let k = 0; k <= n; k++) { const c = k * w / n; line(LP(c, h + 0.05, 5), LP(c, h + 0.05, 42), shade(wc, 1.2), 4); }
    doorS(w / 2, h, 5, 0.8, 28, '#4a2c1c', true);
    for (let k = 0; k < n; k++) { const c = (k + 0.5) * w / n; if (Math.abs(c - w / 2) > 1.1) winS(c, h, 14, 0.3, 17, { cross: 0 }); }
    poly([LP(w / 2 - 1.8, h + 0.05, 46), LP(w / 2 + 1.8, h + 0.05, 46), LP(w / 2, h + 0.05, 62)], snow ? '#e8eef8' : '#d8c898', '#7a6a48', 1.4);
    gable(0.3, 0.3, w - 0.3, h - 0.3, 46, 18, 0.4, snow ? ['#f4f8ff', '#dce6f2', '#b8c8dc'] : ['#8a3a2a', '#703024', '#582418'], wc);
    flag(w / 2, h * 0.5, 64, '#c0392b', t);
    for (let k = 0; k < 3; k++) winE(w, (k + 0.5) * h / 3, 14, 0.28, 17, { cross: 0 });
    sign(o, w / 2 - 1.2, 40);
  }
  function euroTower(o, t) {
    const w = o.w, h = o.h, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
    shadowDiamond(-0.2, -0.2, w + 0.3, h + 0.3, 0.2);
    round(cx, cy, 0, 100, r * 0.82, '#c9c2b0');
    for (let k = 0; k < 4; k++) { const p = LP(cx + r * 0.2, cy + r * 0.55, 20 + k * 20); poly([[p[0] - 3, p[1]], [p[0] + 3, p[1]], [p[0] + 3, p[1] - 9], [p[0] - 3, p[1] - 9]], glassC('#2a3040', '#ffd27a')); }
    round(cx, cy, 100, 106, r * 0.98, '#b0aa98'); cone(cx, cy, 106, r * 1.0, 44, '#b5503c', '#8a3a2a');
    flag(cx, cy, 150, '#c0392b', t);
    const d = LP(cx, cy + r * 0.78, 0); doorS(cx, cy + r * 0.8, 0, 0.36, 18, '#5a3622', true);
  }
  function thaiStilt(o, t) {
    const w = o.w, h = o.h, v = (o.v | 0) % 3;
    shadowDiamond(-0.2, -0.2, w + 0.3, h + 0.3, 0.16);
    const fz = 26;
    for (const [px, py] of [[0.3, 0.3], [w - 0.3, 0.3], [0.3, h - 0.3], [w - 0.3, h - 0.3], [w / 2, h - 0.3]]) { const b = LP(px, py, 0), tp = LP(px, py, fz); ctx.fillStyle = '#6a4a2c'; ctx.fillRect(b[0] - 2.4, tp[1], 4.8, b[1] - tp[1]); }
    box(-0.1, -0.1, w + 0.1, h + 0.1, fz - 3, fz, '#b88a56', '#9a6e3e', '#7a5430');
    const wc = ['#c9945a', '#d0a66a', '#b88048'][v], wh = 26;
    wallBox(0.35, 0.35, w - 0.35, h - 0.35, fz, fz + wh, wc, 0.78); plank(0.35, 0.35, w - 0.35, h - 0.35, fz, fz + wh, wc);
    doorS(w * 0.5, h - 0.35, fz, 0.38, 17, '#4a2c1c', false);
    if (w >= 3) winS(w * 0.2, h - 0.35, fz + 6, 0.24, 11, { cross: 0, frame: '#5a3822' }); if (w >= 4) winS(w * 0.8, h - 0.35, fz + 6, 0.24, 11, { cross: 0, frame: '#5a3822' });
    winE(w - 0.35, h / 2, fz + 6, 0.3, 11, { cross: 0, frame: '#5a3822' });
    const rc = [['#b5503c', '#9a4030', '#7a3224'], ['#6a4a3a', '#583a2c', '#442c20'], ['#4f7a6a', '#3f6658', '#2f5044']][v];
    const [R1, R2] = gable(0.35, 0.35, w - 0.35, h - 0.35, fz + wh, 24, 0.55, rc, wc);
    ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; // ช่อฟ้า
    for (const R of [R1, R2]) { const dir = R === R1 ? -1 : 1; ctx.beginPath(); ctx.moveTo(R[0], R[1]); ctx.quadraticCurveTo(R[0] + dir * 3, R[1] - 6, R[0] + dir * 7, R[1] - 12); ctx.stroke(); }
    const sx = LP(w * 0.5, h + 0.1, 0), st = LP(w * 0.5, h - 0.35, fz); // บันได
    ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(sx[0] - 6, sx[1]); ctx.lineTo(st[0] - 6, st[1]); ctx.moveTo(sx[0] + 6, sx[1]); ctx.lineTo(st[0] + 6, st[1]); ctx.stroke();
    ctx.lineWidth = 1.4; for (let k = 1; k < 5; k++) { const f = k / 5; ctx.beginPath(); ctx.moveTo(sx[0] - 6 + (st[0] - sx[0]) * f, sx[1] + (st[1] - sx[1]) * f); ctx.lineTo(sx[0] + 6 + (st[0] - sx[0]) * f, sx[1] + (st[1] - sx[1]) * f); ctx.stroke(); }
    if (o.name) sign(o, w * 0.5 - 1.2, fz + 20);
  }
  function thaiWat(o, t) {
    const w = o.w, h = o.h;
    shadowDiamond(-0.3, -0.3, w + 0.5, h + 0.5, 0.2);
    box(-0.1, -0.1, w + 0.1, h + 0.1, 0, 6, '#e8e0cc', '#c9c1ac', '#a8a08c'); box(0.4, 0.4, w - 0.4, h - 0.4, 6, 10, '#efe7d3', '#d4ccb7', '#b3ab97');
    wallBox(0.9, 0.9, w - 0.9, h - 0.9, 10, 40, '#f4efe0', 0.82);
    for (let k = 0; k < 3; k++) winS(2 + k * ((w - 4) / 2.2), h - 0.9, 18, 0.25, 15, { cross: 0, lit: '#ffe9a0', frame: '#c8a040' });
    doorS(w / 2, h - 0.9, 10, 0.45, 22, '#7a3a22', false);
    const rc1 = ['#c0392b', '#a02f24', '#7a241c'], rc2 = ['#d9a02a', '#b88420', '#8a6218'];
    const a = gable(0.5, 0.5, w - 0.5, h - 0.5, 40, 16, 0.7, rc1, '#f4efe0'); gable(1.4, 1.4, w - 1.4, h - 1.4, 52, 14, 0.5, rc2, '#f4efe0');
    ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; for (const R of a) { const dir = R === a[0] ? -1 : 1; ctx.beginPath(); ctx.moveTo(R[0], R[1]); ctx.quadraticCurveTo(R[0] + dir * 3, R[1] - 6, R[0] + dir * 8, R[1] - 14); ctx.stroke(); }
    const cx = w - 1.8, cy = 1.8; // เจดีย์ทอง
    ctx.fillStyle = 'rgba(0,0,0,.2)'; const sp = LP(cx, cy, 0); ell(sp[0], sp[1], 26, 11);
    round(cx, cy, 0, 8, 1.0, '#e8c860'); const b2 = LP(cx, cy, 8);
    for (let k = 0; k < 4; k++) round(cx, cy, 8 + k * 10, 18 + k * 10, 0.85 - k * 0.14, '#ffd860');
    const tp = LP(cx, cy, 54); ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.moveTo(tp[0] - 5, tp[1]); ctx.lineTo(tp[0], tp[1] - 32); ctx.lineTo(tp[0] + 5, tp[1]); ctx.closePath(); ctx.fill();
    glowPx(tp[0], tp[1] - 12, 70, [255, 220, 120], 0.6);
    sign(o, w / 2 - 1.2, 34);
  }
  function treeHut(o, t) {
    const w = o.w, h = o.h, cx = w / 2, cy = h / 2, v = (o.v | 0) % 3;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; const sp = LP(cx, cy, 0); ell(sp[0], sp[1] + 2, 38, 15);
    const b = LP(cx, cy, 0), tp = LP(cx, cy, 70);
    ctx.fillStyle = '#5a3d24'; ctx.beginPath(); ctx.moveTo(b[0] - 17, b[1] + 3); ctx.quadraticCurveTo(b[0] - 9, tp[1] + 30, tp[0] - 11, tp[1]); ctx.lineTo(tp[0] + 11, tp[1]); ctx.quadraticCurveTo(b[0] + 9, tp[1] + 30, b[0] + 17, b[1] + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#46301c'; ctx.beginPath(); ctx.moveTo(tp[0] + 2, tp[1]); ctx.lineTo(tp[0] + 11, tp[1]); ctx.quadraticCurveTo(b[0] + 9, tp[1] + 30, b[0] + 17, b[1] + 3); ctx.lineTo(b[0] + 3, b[1] + 3); ctx.closePath(); ctx.fill();
    const pz = 64; box(0.2, 0.2, w - 0.2, h - 0.2, pz - 4, pz, '#b0884e', '#8e6a38', '#6e5028');
    ctx.strokeStyle = '#d9c28a'; ctx.lineWidth = 1.6; const l0 = LP(w * 0.4, h - 0.2, pz - 4), l1 = LP(w * 0.3, h + 0.6, 0); ctx.beginPath(); ctx.moveTo(l0[0], l0[1]); ctx.quadraticCurveTo(l1[0] + 4, l1[1] - 30, l1[0], l1[1]); ctx.moveTo(l0[0] + 9, l0[1]); ctx.quadraticCurveTo(l1[0] + 13, l1[1] - 30, l1[0] + 9, l1[1]); ctx.stroke();
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(l1[0] + 1 + k * 0.2, l1[1] - k * 9); ctx.lineTo(l1[0] + 9 + k * 0.2, l1[1] - k * 9); ctx.stroke(); }
    const wc = ['#a8794a', '#b88a56', '#9a6c40'][v]; wallBox(0.9, 0.9, w - 0.9, h - 0.9, pz, pz + 24, wc, 0.78);
    doorS(w * 0.5, h - 0.9, pz, 0.34, 16, '#4a2c1c', true); winE(w - 0.9, h / 2, pz + 5, 0.26, 10, { lit: '#c8ffa0', glow: [160, 255, 170], cross: 0 });
    const lc = [['#3f9a4a', '#2f8040', '#236a32'], ['#58a84a', '#468f3c', '#367830'], ['#3a8a58', '#2c7448', '#205e3a']][v];
    gable(0.9, 0.9, w - 0.9, h - 0.9, pz + 24, 22, 0.6, lc, wc);
    const lp = LP(cx, cy, pz + 55); for (let k = 0; k < 3; k++) glowPx(lp[0] + (k - 1) * 22, lp[1] + 32 + (k % 2) * 6, 22, [255, 240, 150], 0.5);
    if (o.name) sign(o, w * 0.5 - 1.2, pz + 14);
  }
  function adobe(o, t) {
    const w = o.w, h = o.h, v = (o.v | 0) % 3, wc = ['#e0c38a', '#d9b87a', '#e6cc98'][v];
    shadowDiamond(-0.3, -0.3, w + 0.4, h + 0.4, 0.2);
    wallBox(0, 0, w, h, 0, 34, wc, 0.82); box(-0.1, -0.1, w + 0.1, h + 0.1, 34, 38, shade(wc, 1.05), shade(wc, 0.88), shade(wc, 0.72));
    for (let k = 0; k < 4; k++) { const p = LP(0.4 + k * (w - 0.8) / 3, h, 34 + 0); ctx.fillStyle = shade(wc, 0.7); ctx.fillRect(p[0] - 1.5, p[1] - 10, 3, 10); }
    doorS(w * 0.5, h, 0, 0.42, 20, '#6a4222', true);
    if (w >= 3) winS(w * 0.18, h, 14, 0.22, 11, { cross: 0, frame: '#7a5a30' }); if (w >= 4) winS(w * 0.82, h, 14, 0.22, 11, { cross: 0, frame: '#7a5a30' });
    winE(w, h / 2, 14, 0.26, 11, { cross: 0, frame: '#7a5a30' });
    const aw = [['#c0392b', '#f4e9d0'], ['#2f7fb0', '#f4e9d0'], ['#c8902a', '#f4e9d0']][v]; const c = w * 0.5;
    for (let i = 0; i < 6; i++) { const a = c - 1.5 + i * 0.5, bb = a + 0.5; poly([LP(a, h + 0.02, 26), LP(bb, h + 0.02, 26), LP(bb, h + 0.7, 19), LP(a, h + 0.7, 19)], i % 2 ? aw[1] : aw[0]); }
    if (o.name) sign(o, w * 0.5 - 1.2, 32);
  }
  function ziggurat(o, t) {
    const w = o.w, h = o.h; shadowDiamond(-0.4, -0.4, w + 0.6, h + 0.6, 0.22);
    const cols = [['#e0c38a', '#c9a96a', '#a98c52'], ['#d9b87a', '#bf9f60', '#9d8048'], ['#d0ac6a', '#b5944f', '#947640'], ['#c8a05a', '#aa8844', '#8a6c38']];
    let z = 0; const steps = 4;
    for (let k = 0; k < steps; k++) { const ins = k * Math.min(w, h) * 0.12, zz = 16; box(ins, ins, w - ins, h - ins, z, z + zz, cols[k][0], cols[k][1], cols[k][2]); z += zz; }
    const ins = steps * Math.min(w, h) * 0.12; // บันไดกลาง
    for (let k = 0; k < 8; k++) { const f = k / 8; poly([LP(w / 2 - 0.7, h - f * (h - ins) * 0.9 + 0.05, f * 56), LP(w / 2 + 0.7, h - f * (h - ins) * 0.9 + 0.05, f * 56), LP(w / 2 + 0.7, h - f * (h - ins) * 0.9 + 0.05, f * 56 + 7), LP(w / 2 - 0.7, h - f * (h - ins) * 0.9 + 0.05, f * 56 + 7)], k % 2 ? '#f0dcae' : '#dcc690'); }
    const tp = LP(w / 2, h / 2, z + 2); ctx.fillStyle = '#ffd860'; ctx.beginPath(); ctx.moveTo(tp[0] - 10, tp[1]); ctx.lineTo(tp[0], tp[1] - 26); ctx.lineTo(tp[0] + 10, tp[1]); ctx.closePath(); ctx.fill();
    glowPx(tp[0], tp[1] - 12, 80, [255, 200, 90], 0.7); flag(w * 0.2, h * 0.2, z, '#c0392b', t);
    if (o.name) sign(o, w / 2 - 1.2, 22);
  }
  function arena(o, t) {
    const w = o.w, h = o.h, cx = w / 2, cy = h / 2; shadowDiamond(-0.3, -0.3, w + 0.5, h + 0.5, 0.22);
    // ลานทราย
    const sp = LP(cx, cy, 0); ctx.fillStyle = '#d9b87a'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1], w * 32 * 0.5, w * 16 * 0.5 + 2, 0, 0, TAU); ctx.fill();
    wallBox(0, 0, w, h, 0, 40, '#d6b678', 0.8);
    // ผนังด้านในมองเห็นด้านหลัง: วาดขอบบน + ซุ้มโค้ง
    const nS = Math.max(4, Math.round(w / 1.3));
    for (let k = 0; k < nS; k++) { const c = (k + 0.5) * w / nS; doorS(c, h, 0, 0.3, 14, '#2a1a10', true); doorS(c, h, 22, 0.3, 11, '#2a1a10', true); }
    for (let k = 0; k < 4; k++) { const c = (k + 0.5) * h / 4; const p0 = LP(w, c - 0.25, 4), p1 = LP(w, c + 0.25, 4), p2 = LP(w, c + 0.25, 18), p3 = LP(w, c - 0.25, 18); poly([p0, p1, p2, p3], '#2a1a10'); }
    box(-0.15, -0.15, w + 0.15, h + 0.15, 40, 44, '#e6c98a', '#c6a868', '#a68a50');
    flag(0.5, h, 44, '#c0392b', t); flag(w - 0.5, h, 44, '#2f7fb0', t + 1); flag(w - 0.5, 0.5, 44, '#c8902a', t + 2);
    if (o.name) sign(o, w / 2 - 1.2, 36);
  }
  function neonTower(o, t) {
    const w = o.w, h = o.h, s = (o.x * 7 + o.y * 13) | 0, v = (o.v | 0) % 3, ht = 90 + (hsh(s, 3, 9) * 70 | 0) + (o.tall ? 60 : 0);
    const ac = [['#3ae8ff', [60, 220, 255]], ['#ff3ac8', [255, 60, 200]], ['#a0ff4a', [150, 255, 80]]][v];
    shadowDiamond(-0.3, -0.3, w + 0.5, h + 0.5, 0.3);
    box(0, 0, w, h, 0, ht, '#2e3348', '#232739', '#191c2a');
    for (let z = 10; z < ht - 6; z += 12) {
      for (let k = 0; k < w; k++) { const lit = hsh(s + k, z, 4) > 0.45; poly([LP(k + 0.2, h, z), LP(k + 0.8, h, z), LP(k + 0.8, h, z + 6), LP(k + 0.2, h, z + 6)], lit ? mixc('#1a2030', hsh(s + k, z, 6) > 0.5 ? '#ffe9a0' : '#9ae8ff', 0.5 + 0.5 * LIGHTS) : '#12151f'); }
      for (let k = 0; k < h; k++) { const lit = hsh(s, z + k, 5) > 0.45; poly([LP(w, k + 0.2, z), LP(w, k + 0.8, z), LP(w, k + 0.8, z + 6), LP(w, k + 0.2, z + 6)], lit ? mixc('#141826', hsh(s, z + k, 7) > 0.5 ? '#ffe9a0' : '#9ae8ff', 0.45 + 0.45 * LIGHTS) : '#0e1018'); }
    }
    const fl = 0.7 + 0.3 * Math.sin(t * 3 + s);
    line(LP(0, h, 0), LP(0, h, ht), ac[0], 2.4); line(LP(w, h, 0), LP(w, h, ht), ac[0], 2.4); line(LP(w, 0, 0), LP(w, 0, ht), ac[0], 2.4); line(LP(0, h, ht), LP(w, h, ht), ac[0], 2.4); line(LP(w, h, ht), LP(w, 0, ht), ac[0], 2.4);
    glowAt(w, h, ht * 0.5, 80, ac[1], 0.35 * fl); glowAt(w / 2, h, ht, 60, ac[1], 0.5 * fl);
    const ap = LP(w / 2, h / 2, ht); line(ap, [ap[0], ap[1] - 26], '#6a7090', 2); ctx.fillStyle = '#ff3a3a'; arc(ap[0], ap[1] - 27, 2.4 + (Math.sin(t * 4 + s) > 0.5 ? 1 : 0));
    if (o.name) { const p = LP(w / 2, h, 24); ctx.font = '800 12px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = ac[0]; ctx.globalAlpha = 0.6 + 0.4 * fl; ctx.fillText(T(o.name), p[0], p[1]); ctx.globalAlpha = 1; glowPx(p[0], p[1], 50, ac[1], 0.5); }
    const d = LP(w / 2, h, 0); poly([[d[0] - 7, d[1]], [d[0] + 7, d[1]], [d[0] + 7, d[1] - 14], [d[0] - 7, d[1] - 14]], mixc('#1a2030', '#9ae8ff', LIGHTS * 0.6), ac[0], 1.2);
  }
  function frostCabin(o, t) {
    const w = o.w, h = o.h, v = (o.v | 0) % 2, wc = ['#8a6a4a', '#7a5c40'][v];
    shadowDiamond(-0.3, -0.3, w + 0.4, h + 0.4, 0.2); box(-0.08, -0.08, w + 0.08, h + 0.08, 0, 4, '#e8eef6', '#c6d2e0', '#a2b0c4');
    wallBox(0, 0, w, h, 4, 30, wc, 0.78);
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.6; for (let z = 9; z < 30; z += 5.5) { line(LP(0, h, z), LP(w, h, z), 'rgba(0,0,0,.28)', 1.6); line(LP(w, h, z), LP(w, 0, z), 'rgba(0,0,0,.28)', 1.6); }
    doorS(w * 0.5, h, 4, 0.4, 18, '#4a2c1c', false); if (w >= 3) winS(w * 0.18, h, 12, 0.24, 11, { cross: 1, glow: [255, 200, 110] }); if (w >= 4) winS(w * 0.82, h, 12, 0.24, 11, { cross: 1 });
    winE(w, h / 2, 12, 0.28, 11);
    gable(0, 0, w, h, 30, 20, 0.45, ['#f2f6fb', '#d8e3ef', '#b4c4d8'], wc);
    chimney(w * 0.7, h * 0.35, 40, '#7a7a82', true, t);
    if (o.name) sign(o, w * 0.5 - 1.2, 26);
  }
  function frostCastle(o, t) {
    const w = o.w, h = o.h; shadowDiamond(-0.4, -0.4, w + 0.6, h + 0.6, 0.24);
    box(-0.1, -0.1, w + 0.1, h + 0.1, 0, 6, '#c8d4e2', '#a8b6c8', '#8898ac');
    wallBox(0.6, 0.6, w - 0.6, h - 0.6, 6, 56, '#b8c8da', 0.8);
    for (let z = 16; z < 56; z += 10) { line(LP(0.6, h - 0.6, z), LP(w - 0.6, h - 0.6, z), 'rgba(0,0,0,.12)', 1); line(LP(w - 0.6, h - 0.6, z), LP(w - 0.6, 0.6, z), 'rgba(0,0,0,.12)', 1); }
    doorS(w / 2, h - 0.6, 6, 0.8, 30, '#3a4a68', true); line(LP(w / 2 - 0.8, h - 0.6, 24), LP(w / 2 + 0.8, h - 0.6, 24), '#a0b8d8', 2);
    for (let k = 0; k < 3; k++) { winS(w * 0.18 + k * w * 0.32, h - 0.6, 36, 0.26, 12, { lit: '#bfe8ff', glow: [140, 210, 255], cross: 0 }); if (k !== 1) winS(w * 0.18 + k * w * 0.32, h - 0.6, 14, 0.26, 12, { lit: '#bfe8ff', glow: [140, 210, 255], cross: 0 }); }
    for (let k = 0; k < 3; k++) winE(w - 0.6, h * (0.2 + k * 0.3), 30, 0.26, 12, { lit: '#bfe8ff', glow: [140, 210, 255], cross: 0 });
    box(0.4, 0.4, w - 0.4, h - 0.4, 56, 60, '#d6e2ee', '#b4c4d6', '#94a6bc'); crenel(0.4, 0.4, w - 0.4, h - 0.4, 60, '#b8c8da');
    for (const [fx_, fy_] of [[0.4, 0.4], [w - 0.4, 0.4], [0.4, h - 0.4], [w - 0.4, h - 0.4]]) { round(fx_, fy_, 0, 76, 0.85, '#c4d2e2'); cone(fx_, fy_, 76, 1.05, 34, '#6aa8e0', '#4a88c0'); }
    flag(w / 2, h / 2, 60, '#4a88c0', t);
    glowAt(w / 2, h / 2, 80, 80, [140, 210, 255], 0.35);
    if (o.name) sign(o, w / 2 - 1.2, 44);
  }
  function mageTower(o, t) {
    const w = o.w, h = o.h, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2; shadowDiamond(-0.2, -0.2, w + 0.3, h + 0.3, 0.22);
    round(cx, cy, 0, 116, r * 0.72, '#b4c4da'); round(cx, cy, 116, 122, r * 0.95, '#8aa0c0');
    for (let k = 0; k < 5; k++) { const p = LP(cx + r * 0.1, cy + r * 0.5, 22 + k * 20); poly([[p[0] - 3, p[1]], [p[0] + 3, p[1]], [p[0] + 3, p[1] - 9], [p[0] - 3, p[1] - 9]], glassC('#2a3c58', '#bfe8ff')); }
    cone(cx, cy, 122, r * 0.98, 36, '#5a7ac0', '#40609e');
    const tp = LP(cx, cy, 168), fl = 0.75 + 0.25 * Math.sin(t * 3);
    ctx.fillStyle = '#a0e8ff'; ctx.beginPath(); ctx.moveTo(tp[0], tp[1] - 14 + Math.sin(t * 2) * 2); ctx.lineTo(tp[0] + 7, tp[1] + Math.sin(t * 2) * 2); ctx.lineTo(tp[0], tp[1] + 14 + Math.sin(t * 2) * 2); ctx.lineTo(tp[0] - 7, tp[1] + Math.sin(t * 2) * 2); ctx.closePath(); ctx.fill();
    glowPx(tp[0], tp[1], 110, [140, 220, 255], 0.9 * fl); doorS(cx, cy + r * 0.72, 0, 0.34, 18, '#3a4a68', true);
    if (o.name) sign({ name: o.name, h: cy + r * 0.72 - 0.55 }, cx - 1.2, 30);
  }
  function genericBox(o, t) { euroHouse(o, t, false); }
  const BUILD = {
    house: (o, t, th) => th === 'frost' || th === 'snow' ? frostCabin(o, t) : th === 'desert' || th === 'oasis' ? adobe(o, t) : euroHouse(o, t, false),
    tavern: euroTavern, shop: euroShop, smith: euroSmith, guild: euroGuild, tower: (o, t, th) => th === 'neon' ? neonTower(o, t) : euroTower(o, t),
    church: (o, t, th) => euroChurch(Object.assign({ snow: th === 'frost' }, o), t),
    hall: (o, t, th) => th === 'oasis' || th === 'desert' ? adobeHall(o, t) : euroHall(o, t, th === 'frost' || th === 'snow'),
    stilt: thaiStilt, wat: thaiWat, treehut: treeHut, adobe, ziggurat, arena, cabin: frostCabin, castle: frostCastle, mtower: mageTower
  };
  function adobeHall(o, t) { // ห้องโถงทะเลทราย: อะโดบี + โดม
    const w = o.w, h = o.h; adobe(Object.assign({}, o, { name: null }), t);
    const cx = w / 2, cy = h / 2; ctx.fillStyle = '#e8c860'; const p = LP(cx, cy, 38); ctx.beginPath(); ctx.ellipse(p[0], p[1], 22, 12, 0, Math.PI, 0); ctx.ellipse(p[0], p[1], 22, 9, 0, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(p[0], p[1] - 4, 17, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#b8903a'; ctx.fillRect(p[0] - 1, p[1] - 30, 2, 12); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(p[0] - 6, p[1] - 14, 4, 6, -0.5, 0, TAU); ctx.fill();
    if (o.name) sign(o, w / 2 - 1.2, 32);
  }
  function building(o, t, theme) { const f = BUILD[o.kind] || genericBox; f(o, t || 0, theme); }

  /* ---------------------------------------------------------------- มอนสเตอร์ (วาดตามตระกูล) */
  function wpn(i, x, y, ang, flip) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (flip) ctx.scale(-1, 1); ctx.lineCap = 'round';
    if (i === 0) { ctx.strokeStyle = '#d8dce6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -17); ctx.stroke(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3.5, -1); ctx.lineTo(3.5, -1); ctx.stroke(); }
    else if (i === 1) { ctx.strokeStyle = '#7a5a32'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -22); ctx.stroke(); ctx.fillStyle = '#d8dce6'; ctx.beginPath(); ctx.moveTo(-2.6, -22); ctx.lineTo(0, -29); ctx.lineTo(2.6, -22); ctx.fill(); }
    else if (i === 2) { ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, -4, 11, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.cos(-1.2) * 11, -4 + Math.sin(-1.2) * 11); ctx.lineTo(Math.cos(1.2) * 11, -4 + Math.sin(1.2) * 11); ctx.stroke(); }
    else if (i === 3) { ctx.strokeStyle = '#6a4a8a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -20); ctx.stroke(); ctx.fillStyle = '#9ae8ff'; ctx.beginPath(); ctx.arc(0, -23, 4, 0, TAU); ctx.fill(); glowPx(0, -23, 24, [140, 220, 255], 0.5); }
    else { ctx.fillStyle = '#3a3e48'; ctx.fillRect(-2, -4, 14, 4.5); ctx.fillRect(-2, -1, 4, 7); }
    ctx.restore();
  }
  const FAMS = {};
  function eyes(x, y, sp, r, hot, col) { ctx.fillStyle = hot ? '#ff3a2c' : (col || '#1c1c24'); arc(x - sp, y, r); arc(x + sp, y, r); if (!hot) { ctx.fillStyle = 'rgba(255,255,255,.8)'; arc(x - sp - r * 0.3, y - r * 0.3, r * 0.35); arc(x + sp - r * 0.3, y - r * 0.3, r * 0.35); } }
  function legs4(c, mv, ph, x0, x1, len, w) { ctx.fillStyle = c; [[x0, 0], [x0 + 7, Math.PI], [x1 - 7, Math.PI], [x1, 0]].forEach(l => { const lift = mv ? Math.max(0, Math.sin(ph + l[1])) * 3.5 : 0; rr(l[0] - w / 2, -len, w, len - lift, w * 0.35); ctx.fill(); }); }

  FAMS.quad = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk } = s, tr = A.tr || [], ph = t * 12 + m.off, bob = mv ? Math.abs(Math.cos(ph)) * 2 : Math.sin(t * 2 + m.off) * 0.6;
    ctx.translate(atk ? fl * 6 : 0, -bob);
    if (tr.includes('frog')) {
      const hop = mv ? Math.abs(Math.sin(t * 7 + m.off)) * 8 : 0; ctx.translate(0, -hop);
      ctx.fillStyle = c2; ell(-8 * fl, -4, 5, 3.2); ell(8 * fl, -4, 5, 3.2); ctx.fillStyle = c1; ell(0, -11, 14, 9.5);
      if (tr.includes('spot')) { ctx.fillStyle = c2; arc(-4, -15, 2.2); arc(5, -12, 2.6); arc(0, -8, 1.8); }
      ctx.fillStyle = shade(c2, 0.85); ctx.beginPath(); ctx.ellipse(fl * 4, -9, 8, 2.2, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#fff'; arc(-5 + fl, -19, 3.6); arc(5 + fl, -19, 3.6); ctx.fillStyle = s.hot ? '#ff3a2c' : '#111'; arc(-5 + fl * 1.6, -19, 1.8); arc(5 + fl * 1.6, -19, 1.8);
      if (atk) { ctx.strokeStyle = '#e8607a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(fl * 8, -9); ctx.lineTo(fl * 22, -13); ctx.stroke(); }
      return;
    }
    if (tr.includes('shell')) { // เต่า
      legs4('#8a9a5a', mv, ph, -10, 10, 7, 5); ctx.fillStyle = c2; ell(0, -13, 19, 11); ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, -15, 17, 12, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = shade(c1, 0.6); ctx.lineWidth = 1.4; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 8, -26); ctx.lineTo(k * 6, -14); ctx.stroke(); }
      ctx.fillStyle = '#8a9a5a'; ell(fl * 20, -14, 7, 6); eyes(fl * 22, -16, 2.4, 1.4, s.hot); return;
    }
    const big = tr.includes('hump'), body = hit ? '#fff' : c1, dk = hit ? '#ffe3dc' : c2;
    legs4(shade(c2, 0.7), mv, ph, -11, 12, 9, 4.6);
    if (tr.includes('tail')) { ctx.strokeStyle = dk; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-fl * 17, -19); ctx.quadraticCurveTo(-fl * 27, -26 - Math.sin(t * 6) * 2, -fl * 23, -12); ctx.stroke(); }
    ctx.fillStyle = body; ell(0, -18, 19, 11.5);
    if (big) { ctx.fillStyle = dk; ell(-2, -30, 9, 8); ctx.fillStyle = body; ell(-2, -29, 8, 7); }
    if (tr.includes('stripe')) { ctx.strokeStyle = tr.includes('glow') ? '#c05aff' : (c2 || '#222'); ctx.lineWidth = 2.6; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 5, -28 + Math.abs(k)); ctx.lineTo(k * 4.4, -15); ctx.stroke(); } }
    if (tr.includes('fur')) { ctx.strokeStyle = dk; ctx.lineWidth = 2.4; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 5 - fl * 2, -29); ctx.lineTo(k * 5 - fl * 4, -34 + Math.abs(k)); ctx.stroke(); } }
    if (tr.includes('mane')) { ctx.fillStyle = dk; for (let k = 0; k < 7; k++) { const a = -2.6 + k * 0.45; ctx.beginPath(); ctx.moveTo(fl * 12 + Math.cos(a) * 6, -20 + Math.sin(a) * 6); ctx.lineTo(fl * 12 + Math.cos(a) * 16, -20 + Math.sin(a) * 16); ctx.lineTo(fl * 12 + Math.cos(a + 0.3) * 8, -20 + Math.sin(a + 0.3) * 8); ctx.fill(); } }
    const hx = fl * 17, rabbit = tr.includes('ear') && A.sz < 0.8;
    ctx.fillStyle = body; ell(hx, -19, 9.5, 8.5);
    if (tr.includes('ear')) { ctx.fillStyle = body; if (rabbit) { ell(hx - fl * 3, -34, 3, 9, fl * 0.15); ell(hx + fl * 1, -35, 3, 9, -fl * 0.1); ctx.fillStyle = '#f0a0a8'; ell(hx - fl * 3, -34, 1.4, 6, fl * 0.15); } else { ctx.beginPath(); ctx.moveTo(hx - 4, -25); ctx.lineTo(hx - fl * 1, -33); ctx.lineTo(hx + 3, -25); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx - 1, -25); ctx.lineTo(hx + fl * 3, -32); ctx.lineTo(hx + 6, -25); ctx.fill(); } }
    if (tr.includes('horn')) { ctx.strokeStyle = '#f2ead0'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(hx - 4, -25); ctx.quadraticCurveTo(hx - 12, -30, hx - 9, -37); ctx.moveTo(hx + 4, -25); ctx.quadraticCurveTo(hx + 12, -30, hx + 9, -37); ctx.stroke(); }
    ctx.fillStyle = tr.includes('fur') ? shade(c1, 0.8) : '#e6cdb0'; ell(hx + fl * 8, -16, 5.4, 4.2); ctx.fillStyle = '#3a2a22'; arc(hx + fl * 11, -17, 1.4);
    if (tr.includes('tusk')) { ctx.fillStyle = '#f7f1df'; ctx.beginPath(); ctx.moveTo(hx + fl * 4, -13); ctx.lineTo(hx + fl * 7, -24); ctx.lineTo(hx + fl * 9, -13); ctx.fill(); }
    ctx.fillStyle = s.hot ? '#ff3a2c' : '#1c1c24'; arc(hx + fl * 2.5, -22, 1.9);
    if (tr.includes('glow')) glowPx(hx, -22, 28, [190, 90, 255], 0.7);
  };

  FAMS.biped = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], ph = t * 11 + m.off, sw = mv ? Math.sin(ph) : 0, bob = mv ? Math.abs(Math.cos(ph)) * 1.6 : Math.sin(t * 2 + m.off) * 0.5;
    ctx.translate(atk ? fl * 5 : 0, -bob);
    const bone = tr.includes('bone'), skin = bone ? '#e9e5d4' : (tr.includes('fur') ? c1 : '#e8c9a4'), body = hit ? '#fff' : c1, dk = hit ? '#ffe3dc' : c2;
    if (tr.includes('glow')) glowPx(0, -22, 46, tr.includes('veil') ? [170, 140, 255] : [140, 220, 255], 0.55);
    if (tr.includes('fish')) { // นางเงือก/ไซเรน
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-5, -20); ctx.quadraticCurveTo(-8 - sw * 3, -8, -fl * 4 - 6, 2); ctx.lineTo(0, -4 + sw * 2); ctx.lineTo(fl * 6 + 4, 2); ctx.quadraticCurveTo(8 + sw * 3, -8, 5, -20); ctx.closePath(); ctx.fill(); ctx.strokeStyle = shade(c2, 0.7); ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(0, -16 + k * 3.4, 4, 0.3, 2.8); ctx.stroke(); }
    } else if (tr.includes('dance') || tr.includes('fem')) { // กระโปรงพลิ้ว
      const w = 11 + Math.sin(t * 5 + m.off) * 2 + (mv ? 3 : 0); ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-5, -22); ctx.quadraticCurveTo(-w - 2, -10, -w, -2); ctx.quadraticCurveTo(0, 3 + Math.sin(t * 6) * 1.5, w, -2); ctx.quadraticCurveTo(w + 2, -10, 5, -22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-w, -2); ctx.quadraticCurveTo(0, 3, w, -2); ctx.lineTo(w * 0.8, -6); ctx.quadraticCurveTo(0, -1, -w * 0.8, -6); ctx.fill();
    } else if (tr.includes('hood') || tr.includes('wrap') && false) {
      ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(9, -4); ctx.quadraticCurveTo(0, 2 + Math.sin(t * 4) * 1.5, -9, -4); ctx.fill();
    } else {
      ctx.fillStyle = shade(c2, 0.7); rr(-5.5, -13, 4.6, 13 - Math.max(0, sw) * 3, 1.5); ctx.fill(); rr(0.9, -13, 4.6, 13 - Math.max(0, -sw) * 3, 1.5); ctx.fill();
    }
    if (!tr.includes('hood') && !tr.includes('dance') && !tr.includes('fem') && !tr.includes('fish')) {
      ctx.fillStyle = tr.includes('wrap') ? '#e0d6b8' : body; rr(-7.5, -28, 15, 17, 3); ctx.fill();
      if (bone) { ctx.strokeStyle = '#8a8676'; ctx.lineWidth = 1.2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-5, -26 + k * 3.6); ctx.lineTo(5, -26 + k * 3.6); ctx.stroke(); } }
      if (tr.includes('wrap')) { ctx.strokeStyle = '#9a8f6e'; ctx.lineWidth = 1.2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-7.5, -27 + k * 3.4); ctx.lineTo(7.5, -24 + k * 3.4); ctx.stroke(); } }
      if (tr.includes('fur')) { ctx.strokeStyle = dk; ctx.lineWidth = 1.6; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-7 + k * 3.5, -28); ctx.lineTo(-8 + k * 3.5, -31); ctx.stroke(); } }
    }
    const yeti = tr.includes('arms');
    const armL = yeti ? 11 : 8, aw = yeti ? 6 : 3.6;
    ctx.fillStyle = tr.includes('fur') ? c1 : (bone ? skin : body);
    const swing = atk ? -1.3 : sw * 0.5;
    ctx.save(); ctx.translate(-fl * 8, -25); ctx.rotate(-swing * 0.6); rr(-aw / 2, 0, aw, armL + (yeti ? 6 : 0), 1.6); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(fl * 8, -25); ctx.rotate(atk ? -1.6 * fl : swing * 0.6); rr(-aw / 2, 0, aw, armL + (yeti ? 6 : 0), 1.6); ctx.fill();
    if (tr.includes('claw')) { ctx.fillStyle = '#f4f0e0'; for (let k = -1; k <= 1; k++) ell(k * 1.8, armL + 2, 0.9, 2.6); }
    ctx.restore();
    if (A.sk === 'rw' || tr.includes('blade')) { const wi = tr.includes('blade') ? 0 : (m.wp | 0); ctx.save(); ctx.translate(fl * 8, -25); ctx.rotate(atk ? -1.6 * fl : swing * 0.6); wpn(wi, 0, armL, fl * 0.35 + (atk ? 1.2 * fl : 0), fl < 0); ctx.restore(); }
    // หัว
    const hy = -34;
    if (tr.includes('fur') && !yeti || tr.includes('ear') && tr.includes('claw')) { // หัวหมาป่า
      ctx.fillStyle = c1; ell(0, hy, 8, 7.5); ctx.beginPath(); ctx.moveTo(-7, hy - 4); ctx.lineTo(-5, hy - 14); ctx.lineTo(-1, hy - 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, hy - 4); ctx.lineTo(5, hy - 14); ctx.lineTo(1, hy - 6); ctx.fill();
      ctx.fillStyle = shade(c1, 1.2); ell(fl * 5, hy + 3, 5, 3.4); ctx.fillStyle = '#222'; arc(fl * 8, hy + 2, 1.3);
    } else if (yeti) { ctx.fillStyle = c1; ell(0, hy, 9, 8); ctx.fillStyle = '#9ad0e8'; ell(0, hy + 2, 6, 5); }
    else if (tr.includes('hood')) { ctx.fillStyle = shade(c2, 0.55); ell(0, hy - 1, 8.5, 9); ctx.fillStyle = '#0a0a12'; ell(0, hy, 5.6, 6.2); }
    else if (tr.includes('veil')) { ctx.fillStyle = skin; ell(0, hy, 7, 7.5); ctx.fillStyle = 'rgba(170,140,255,.55)'; ctx.fillRect(-7, hy + 1, 14, 7); }
    else { ctx.fillStyle = skin; ell(0, hy, 7.5, 8); }
    if (tr.includes('fem') && !tr.includes('veil')) { ctx.fillStyle = shade(c2, 0.5); ctx.beginPath(); ctx.arc(0, hy - 2, 8.2, Math.PI, 0); ctx.fill(); ctx.fillRect(-8.2, hy - 2, 3, 12 + Math.sin(t * 4) * 1.5); ctx.fillRect(5.2, hy - 2, 3, 12 + Math.sin(t * 4 + 1) * 1.5); }
    if (tr.includes('hat')) { ctx.fillStyle = '#6a4a2a'; ell(0, hy - 6, 12, 3.4); ctx.beginPath(); ctx.arc(0, hy - 6, 6, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.fillRect(-6, hy - 7, 12, 2); }
    if (tr.includes('helm')) { ctx.fillStyle = '#8a8e98'; ctx.beginPath(); ctx.arc(0, hy - 1, 8.4, Math.PI, 0); ctx.fill(); ctx.fillRect(-8.4, hy - 1, 16.8, 3); }
    if (tr.includes('crown')) { ctx.fillStyle = '#ffd860'; ctx.beginPath(); ctx.moveTo(-7, hy - 6); ctx.lineTo(-7, hy - 14); ctx.lineTo(-3.5, hy - 9); ctx.lineTo(0, hy - 15); ctx.lineTo(3.5, hy - 9); ctx.lineTo(7, hy - 14); ctx.lineTo(7, hy - 6); ctx.closePath(); ctx.fill(); glowPx(0, hy - 10, 24, [255, 220, 100], 0.5); }
    if (bone) { ctx.fillStyle = '#16141c'; arc(-3, hy, 2.2); arc(3, hy, 2.2); ctx.fillRect(-2.4, hy + 4, 4.8, 2); }
    else if (tr.includes('hood')) { ctx.fillStyle = hot ? '#ff3a2c' : '#8affd0'; arc(-2.6, hy, 1.3); arc(2.6, hy, 1.3); }
    else if (!tr.includes('fur') || yeti) eyes(fl * 2, hy, 3, 1.3, hot);
    else { ctx.fillStyle = hot ? '#ff3a2c' : '#ffd23c'; arc(fl * 4, hy - 1, 1.4); }
    if (tr.includes('cap')) { /* reserved */ }
  };

  FAMS.bird = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], fy = 22 + Math.sin(t * 3 + m.off) * 3, fl_ = Math.sin(t * 14 + m.off), wsp = 16 + fl_ * 9;
    ctx.save(); ctx.translate(atk ? fl * 6 : 0, -fy);
    const body = hit ? '#fff' : c1, wing = hit ? '#ffe3dc' : c2;
    const wingShape = (dir) => { ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(dir * 3, -16); if (tr.includes('bat') || tr.includes('imp')) { ctx.lineTo(dir * (wsp + 4), -28 - fl_ * 8); ctx.lineTo(dir * (wsp - 2), -18 - fl_ * 4); ctx.lineTo(dir * (wsp * 0.6), -13); ctx.lineTo(dir * (wsp * 0.3), -9); } else { ctx.quadraticCurveTo(dir * wsp * 0.7, -30 - fl_ * 10, dir * wsp, -18 - fl_ * 6); ctx.quadraticCurveTo(dir * wsp * 0.5, -14, dir * 3, -10); } ctx.closePath(); ctx.fill(); };
    wingShape(-1); ctx.fillStyle = body; ell(0, -13, tr.includes('tail') ? 12 : 9, 9);
    if (tr.includes('tail')) { ctx.fillStyle = '#d98a99'; ell(-fl * 12, -14, 3, 3); ell(fl * 6, -9, 4.4, 3.2); arc(fl * 8, -12, 0); } // หมูบิน
    ctx.fillStyle = body; ell(fl * 8, -18, 6.4, 6);
    if (tr.includes('vult')) { ctx.fillStyle = '#d98a8a'; ell(fl * 8, -19, 4.5, 5); ctx.fillStyle = '#f4ead0'; ctx.beginPath(); ctx.arc(fl * 3, -14, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b64a'; ctx.beginPath(); ctx.moveTo(fl * 11, -19); ctx.lineTo(fl * 18, -16); ctx.lineTo(fl * 11, -15); ctx.fill(); }
    if (tr.includes('bat')) { ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(fl * 5, -22); ctx.lineTo(fl * 6, -30); ctx.lineTo(fl * 9, -23); ctx.fill(); ctx.beginPath(); ctx.moveTo(fl * 10, -22); ctx.lineTo(fl * 13, -29); ctx.lineTo(fl * 13, -21); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(fl * 10, -15, 1.4, 3); }
    if (tr.includes('imp')) { ctx.fillStyle = '#f2ead0'; ctx.beginPath(); ctx.moveTo(fl * 4, -22); ctx.lineTo(fl * 2, -30); ctx.lineTo(fl * 7, -23); ctx.fill(); ctx.beginPath(); ctx.moveTo(fl * 10, -22); ctx.lineTo(fl * 13, -29); ctx.lineTo(fl * 12, -21); ctx.fill(); ctx.strokeStyle = wing; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-fl * 8, -10); ctx.quadraticCurveTo(-fl * 18, -4, -fl * 13, 2); ctx.stroke(); ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(-fl * 13, 2); ctx.lineTo(-fl * 18, 4); ctx.lineTo(-fl * 14, -2); ctx.fill(); }
    ctx.fillStyle = hot ? '#ff3a2c' : '#ffe23c'; arc(fl * 10, -19, 1.6); wingShape(1);
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 0, 13, 4.6);
  };

  FAMS.snake = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], n = 12, ph = t * (mv ? 8 : 2.2) + m.off, up = tr.includes('hood');
    const pts = []; for (let i = 0; i < n; i++) pts.push([-fl * i * 2.6 + Math.sin(ph - i * 0.6) * 3, -3 - Math.max(0, 1 - i / 4) * (up ? 16 : 7) + (atk && i < 4 ? -3 : 0)]);
    ctx.lineCap = 'round'; if (tr.includes('glow')) glowPx(0, -10, 36, [130, 230, 255], 0.5);
    for (let i = n - 1; i > 0; i--) { ctx.strokeStyle = i % 2 ? (hit ? '#fff' : c1) : (hit ? '#ffe3dc' : c2); ctx.lineWidth = 7 - i * 0.4; ctx.beginPath(); ctx.moveTo(pts[i][0] - fl * 2, pts[i][1]); ctx.lineTo(pts[i - 1][0] - fl * 2, pts[i - 1][1]); ctx.stroke(); }
    const hx = pts[0][0] - fl * 2, hy = pts[0][1];
    if (up) { ctx.fillStyle = hit ? '#fff' : c2; ctx.beginPath(); ctx.ellipse(hx - fl * 3, hy + 3, 7, 10, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = hit ? '#fff' : c1; ell(hx + fl * 2, hy - 1, 6.5, 5);
    ctx.fillStyle = hot ? '#ff3a2c' : '#ffe23c'; arc(hx + fl * 3, hy - 3, 1.3);
    ctx.strokeStyle = '#e8305a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx + fl * 8, hy); ctx.lineTo(hx + fl * 13 + (Math.sin(t * 20) > 0 ? 2 : 0), hy + (Math.sin(t * 20) > 0 ? -2 : 1)); ctx.stroke();
  };

  FAMS.insect = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], ph = t * 14 + m.off, spider = tr.includes('spider'), bone = tr.includes('bone');
    const jump = tr.includes('leap') ? (mv ? Math.abs(Math.sin(t * 6 + m.off)) * 12 : 0) : 0; ctx.translate(atk ? fl * 5 : 0, -jump);
    const body = hit ? '#fff' : c1, dk = hit ? '#ffe3dc' : c2;
    ctx.strokeStyle = shade(dk, 0.7); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    const nL = spider ? 4 : 3; for (let i = 0; i < nL; i++) for (const sd of [-1, 1]) { const lx = (i - (nL - 1) / 2) * (spider ? 5 : 6), sw = mv ? Math.sin(ph + i * 1.7 + (sd > 0 ? 1.5 : 0)) * 2 : 0; ctx.beginPath(); ctx.moveTo(lx, -9); ctx.lineTo(lx + sd * 8 + sw, -14 - (spider ? 4 : 0)); ctx.lineTo(lx + sd * 12 + sw, 0); ctx.stroke(); }
    if (tr.includes('leap')) { ctx.strokeStyle = shade(dk, 0.8); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-fl * 6, -11); ctx.lineTo(-fl * 16, -22); ctx.lineTo(-fl * 20, 0); ctx.stroke(); }
    if (tr.includes('wing')) { ctx.fillStyle = 'rgba(220,255,200,.55)'; ctx.save(); ctx.translate(-fl * 2, -17); ctx.rotate(-0.4 + Math.sin(t * 20) * (mv ? 0.2 : 0.05)); ell(-fl * 6, -3, 11, 3.6); ctx.restore(); }
    ctx.fillStyle = body; ell(-fl * 6, -12, 9, 6.5); ctx.fillStyle = dk; ell(fl * 4, -12, 6.2, 5.4);
    if (tr.includes('horn')) { ctx.strokeStyle = shade(dk, 0.7); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(fl * 8, -14); ctx.quadraticCurveTo(fl * 16, -20, fl * 15, -28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(fl * 14, -22); ctx.lineTo(fl * 20, -22); ctx.stroke(); }
    if (bone) { ctx.fillStyle = '#16141c'; arc(fl * 4 - 2, -14, 1.8); arc(fl * 4 + 2, -14, 1.8); }
    else { ctx.fillStyle = hot ? '#ff3a2c' : '#1c1c24'; arc(fl * 7, -14, 1.6); }
  };

  FAMS.fish = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], ph = t * 3 + m.off, bob = Math.sin(ph) * 3, body = hit ? '#fff' : c1, dk = hit ? '#ffe3dc' : c2;
    ctx.translate(atk ? fl * 6 : 0, -18 - bob);
    if (tr.includes('glow')) glowPx(0, -4, 44, tr.includes('jelly') ? [255, 150, 230] : [120, 220, 255], 0.55);
    if (tr.includes('jelly')) { ctx.strokeStyle = dk; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 4, 4); ctx.quadraticCurveTo(k * 4 + Math.sin(ph * 2 + k) * 4, 14, k * 4 + Math.sin(ph * 2 + k + 1) * 6, 24); ctx.stroke(); } ctx.globalAlpha *= 0.85; ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 2, 13, 11 + Math.sin(ph * 2) * 1.5, 0, Math.PI, 0); ctx.lineTo(13, 4); ctx.quadraticCurveTo(0, 8, -13, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-4, -4, 4, 2.4); eyes(0, 0, 4, 1.4, hot); return; }
    if (tr.includes('octo')) { ctx.strokeStyle = dk; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo((k - 2.5) * 4, 4); ctx.quadraticCurveTo((k - 2.5) * 7 + Math.sin(ph * 2 + k) * 4, 14, (k - 2.5) * 9 + Math.sin(ph * 2 + k * 1.3) * 5, 22); ctx.stroke(); } ctx.fillStyle = body; ell(0, -4, 13, 12); ctx.fillStyle = 'rgba(255,255,255,.3)'; ell(-4, -9, 4, 3); if (tr.includes('eye')) { ctx.fillStyle = '#fff'; arc(0, -3, 7); ctx.fillStyle = hot ? '#ff3a2c' : '#a020c0'; arc(fl, -3, 4); ctx.fillStyle = '#000'; arc(fl, -3, 1.8); } else eyes(0, -2, 4.4, 1.9, hot); return; }
    if (tr.includes('puff')) { const k = 1 + Math.sin(ph * 2) * 0.05 + (atk ? 0.15 : 0); ctx.scale(k, k); ctx.fillStyle = body; ell(0, 0, 13, 12); ctx.fillStyle = '#f2e6b0'; ell(0, 5, 10, 6); ctx.strokeStyle = dk; ctx.lineWidth = 1.8; for (let a = 0; a < 12; a++) { const an = a * 0.52; ctx.beginPath(); ctx.moveTo(Math.cos(an) * 12, Math.sin(an) * 11); ctx.lineTo(Math.cos(an) * 17, Math.sin(an) * 16); ctx.stroke(); } ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-fl * 12, 0); ctx.lineTo(-fl * 20, -6 + Math.sin(ph * 3) * 3); ctx.lineTo(-fl * 20, 6 + Math.sin(ph * 3) * 3); ctx.fill(); eyes(fl * 5, -3, 3, 2, hot); return; }
    const shark = tr.includes('shark'), L = shark ? 26 : 15;
    ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-fl * (L - 2), 0); ctx.lineTo(-fl * (L + 9), -9 + Math.sin(ph * 3) * 3); ctx.lineTo(-fl * (L + 9), 9 + Math.sin(ph * 3) * 3); ctx.fill();
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, L, shark ? 10 : 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = shark ? '#e8eef4' : shade(body, 1.2); ctx.beginPath(); ctx.ellipse(0, 4, L * 0.8, 5, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-2, -(shark ? 9 : 10)); ctx.lineTo(-fl * 2 - 6, -(shark ? 22 : 18)); ctx.lineTo(6, -(shark ? 9 : 10)); ctx.fill();
    ctx.fillStyle = hot ? '#ff3a2c' : '#111'; arc(fl * (L - 8), -3, 2);
    if (shark) { ctx.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(fl * (L - 10 + k * 3), 3); ctx.lineTo(fl * (L - 9 + k * 3), 6); ctx.lineTo(fl * (L - 8 + k * 3), 3); ctx.fill(); } }
  };

  FAMS.crab = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], ph = t * 13 + m.off, body = hit ? '#fff' : c1, dk = hit ? '#ffe3dc' : c2;
    ctx.translate(mv ? Math.sin(ph) * 1.2 : 0, 0);
    ctx.strokeStyle = shade(dk, 0.7); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const sw = mv ? Math.sin(ph + i * 2) * 2 : 0; ctx.beginPath(); ctx.moveTo(sd * 8, -9); ctx.lineTo(sd * (14 + i * 2) + sw, -10 - i); ctx.lineTo(sd * (17 + i * 2) + sw, 0); ctx.stroke(); }
    if (tr.includes('tailsting')) { ctx.strokeStyle = body; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(-fl * 8, -12); ctx.quadraticCurveTo(-fl * 24, -14, -fl * 20, -30 + (atk ? 6 : 0)); ctx.quadraticCurveTo(-fl * 16, -36, -fl * 8, -30); ctx.stroke(); ctx.fillStyle = '#e8305a'; ctx.beginPath(); ctx.moveTo(-fl * 9, -30); ctx.lineTo(-fl * 4, -28); ctx.lineTo(-fl * 8, -24); ctx.fill(); }
    ctx.fillStyle = body; ell(0, -12, 13, 8.5); ctx.fillStyle = 'rgba(255,255,255,.2)'; ell(-3, -15, 6, 2.4);
    for (const sd of [-1, 1]) { const o = atk ? 5 : 0; ctx.fillStyle = dk; ctx.save(); ctx.translate(sd * (13 + o * fl * sd * 0), -16); ctx.rotate(sd * (0.4 + Math.sin(t * 5 + m.off) * 0.1)); ell(sd * 6, -4, 7, 5); ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(sd * 10, -6); ctx.lineTo(sd * 18, -10); ctx.lineTo(sd * 15, -2); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = dk; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(-3, -23); ctx.moveTo(3, -18); ctx.lineTo(3, -23); ctx.stroke(); ctx.fillStyle = '#fff'; arc(-3, -24, 2.2); arc(3, -24, 2.2); ctx.fillStyle = hot ? '#ff3a2c' : '#111'; arc(-3 + fl * 0.6, -24, 1.1); arc(3 + fl * 0.6, -24, 1.1);
  };

  FAMS.ghost = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], fy = 14 + Math.sin(t * 2.4 + m.off) * 4;
    ctx.translate(atk ? fl * 7 : 0, -fy);
    glowPx(0, -14, 54, tr.includes('hood') ? [150, 120, 255] : [150, 220, 255], 0.6);
    ctx.globalAlpha *= hit ? 1 : 0.78;
    const col = hit ? '#fff' : c1, w = 13 + (atk ? 2 : 0);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w, 4);
    ctx.bezierCurveTo(-w - 2, -22, w + 2, -22, w, 4);
    for (let i = 0; i <= 4; i++) { const x = w - i * (w * 2 / 4); ctx.lineTo(x, 4 + (i % 2 ? 8 : 2) + Math.sin(t * 5 + i + m.off) * 2); }
    ctx.closePath(); ctx.fill();
    if (tr.includes('hood')) { ctx.fillStyle = shade(c2, 0.5); ctx.beginPath(); ctx.arc(0, -10, 10.5, Math.PI, 0); ctx.lineTo(10, 0); ctx.quadraticCurveTo(0, -8, -10, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#05050a'; ell(0, -8, 6, 6); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-5, -14, 3.4, 5);
    ctx.fillStyle = hot || atk ? '#ff3a2c' : (tr.includes('hood') ? '#a0ffe0' : '#1c2a40'); ell(-4.4, -9, 1.9, 2.8); ell(4.4, -9, 1.9, 2.8);
    ctx.fillStyle = tr.includes('hood') ? '#a0ffe0' : '#1c2a40'; ctx.beginPath(); ctx.ellipse(0, -2, 2.4, atk ? 3.4 : 2, 0, 0, TAU); ctx.fill();
    if (tr.includes('humanoid')) { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fl * 10, -6); ctx.lineTo(fl * 20, atk ? -16 : -2); ctx.stroke(); wpn(m.wp | 0, fl * 21, atk ? -16 : -2, fl * 0.4 + (atk ? 1.2 * fl : 0), fl < 0); }
    ctx.globalAlpha = 1;
  };

  FAMS.plant = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], body = hit ? '#fff' : c1, dk = hit ? '#ffe3dc' : c2, hop = mv ? Math.abs(Math.sin(t * 8 + m.off)) * 4 : 0, sq = Math.sin(t * 3 + m.off) * 0.04;
    ctx.translate(atk ? fl * 5 : 0, -hop);
    if (tr.includes('cactus')) {
      ctx.save(); ctx.scale(1 + sq, 1 - sq); ctx.fillStyle = body; rr(-8, -34, 16, 34, 7); ctx.fill(); ctx.fillStyle = dk; ctx.fillRect(-1, -34, 2, 34);
      ctx.fillStyle = body; rr(-17, -26, 6, 14, 3); ctx.fill(); rr(-17, -20, 12, 5, 2); ctx.fill(); rr(11, -30, 6, 14, 3); ctx.fill(); rr(5, -22, 12, 5, 2); ctx.fill();
      ctx.strokeStyle = '#f4f0d0'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { const x = (hsh(k, 1, 3) - 0.5) * 12, y = -32 + k * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 2); ctx.stroke(); }
      ctx.fillStyle = '#ff6a9a'; arc(0, -37, 3.4); arc(-3, -35, 2.2); arc(3, -35, 2.2);
      eyes(0, -22, 3.4, 1.7, hot); ctx.strokeStyle = '#1c2a18'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -17, 2.4, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.restore(); return;
    }
    ctx.fillStyle = '#f0e6cc'; rr(-5, -14, 10, 14, 4); ctx.fill();
    ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(0, -16, 17, 6, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -18, 17, 14, 0, Math.PI, 0); ctx.lineTo(17, -17); ctx.quadraticCurveTo(0, -12, -17, -17); ctx.fill();
    ctx.fillStyle = '#fff'; arc(-8, -25, 3); arc(5, -29, 2.6); arc(10, -22, 2); arc(-2, -22, 1.8);
    eyes(0, -11, 3.6, 1.5, hot); if (atk) { ctx.fillStyle = '#7a2a2a'; ell(0, -6, 2.2, 1.6); }
  };

  FAMS.robot = (s) => {
    const { A, c1, c2, fl, mv, t, m, hit, atk, hot } = s, tr = A.tr || [], ph = t * 11 + m.off, body = hit ? '#fff' : c1, dk = hit ? '#ffe3dc' : c2, lit = hot || atk ? '#ff4a3c' : '#3ae8ff';
    if (tr.includes('drone')) {
      const fy = 26 + Math.sin(t * 3 + m.off) * 3; ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 0, 11, 4); ctx.translate(atk ? fl * 6 : 0, -fy);
      ctx.fillStyle = body; ell(0, 0, 11, 8); ctx.fillStyle = dk; ctx.fillRect(-12, -9, 24, 2.4); ctx.strokeStyle = 'rgba(200,220,240,.7)'; ctx.lineWidth = 2; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 13, -9, 10, 2 + Math.abs(Math.sin(t * 40)) * 1.4, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = lit; arc(fl * 4, 1, 3); glowPx(fl * 4, 1, 26, hot ? [255, 70, 60] : [60, 220, 255], 0.7); ctx.fillStyle = '#222'; ctx.fillRect(-2, 7, 4, 5); return;
    }
    if (tr.includes('quadbot') || tr.includes('beetlebot') || tr.includes('lizard')) {
      ctx.translate(atk ? fl * 6 : 0, mv ? -Math.abs(Math.cos(ph)) * 1.5 : 0);
      legs4(dk, mv, ph, -11, 12, 9, 4.4);
      if (tr.includes('lizard')) { ctx.strokeStyle = tr.includes('half') ? dk : body; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-fl * 14, -14); ctx.quadraticCurveTo(-fl * 28, -10 + Math.sin(t * 5) * 3, -fl * 32, -3); ctx.stroke(); }
      ctx.fillStyle = body; ell(0, -16, tr.includes('beetlebot') ? 17 : 15, 9.5); ctx.fillStyle = dk; ctx.fillRect(-8, -24, 16, 3); if (tr.includes('lizard')) { ctx.fillStyle = '#7fcf6a'; ctx.beginPath(); ctx.ellipse(-fl * 6, -18, 9, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#9aa0aa'; ctx.fillRect(fl * 0, -22, 10 * fl, 9); }
      const hx = fl * 15; ctx.fillStyle = body; ell(hx, -17, 8, 6.4); ctx.fillStyle = lit; ctx.fillRect(hx - 1 + fl * 1, -20, 7 * fl, 2.4); glowPx(hx + fl * 4, -19, 22, hot ? [255, 70, 60] : [60, 220, 255], 0.6);
      if (tr.includes('horn')) { ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(hx + fl * 4, -22); ctx.lineTo(hx + fl * 12, -30); ctx.lineTo(hx + fl * 9, -20); ctx.fill(); }
      if (tr.includes('tusk')) { ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(hx + fl * 4, -13); ctx.lineTo(hx + fl * 8, -22); ctx.lineTo(hx + fl * 9, -13); ctx.fill(); }
      if (tr.includes('ear')) { ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(hx - 3, -22); ctx.lineTo(hx, -30); ctx.lineTo(hx + 4, -22); ctx.fill(); }
      if (tr.includes('tail') && !tr.includes('lizard')) { ctx.strokeStyle = dk; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-fl * 14, -18); ctx.quadraticCurveTo(-fl * 24, -26, -fl * 20, -12); ctx.stroke(); }
      return;
    }
    const mech = tr.includes('mech'), sc = mech ? 1.25 : 1; ctx.scale(sc, sc);
    ctx.translate(atk ? fl * 5 : 0, mv ? -Math.abs(Math.cos(ph)) * 1.5 : 0);
    const sw = mv ? Math.sin(ph) : 0; ctx.fillStyle = dk; rr(-7, -13, 5.4, 13 - Math.max(0, sw) * 3, 1.5); ctx.fill(); rr(1.6, -13, 5.4, 13 - Math.max(0, -sw) * 3, 1.5); ctx.fill(); ctx.fillStyle = '#2a2e38'; ctx.fillRect(-8, -2, 7, 3); ctx.fillRect(1, -2, 7, 3);
    ctx.fillStyle = body; rr(-10, -31, 20, 19, 3); ctx.fill(); ctx.fillStyle = dk; ctx.fillRect(-10, -22, 20, 2.4); ctx.fillStyle = lit; arc(0, -17, 2.2); glowPx(0, -17, 16, hot ? [255, 70, 60] : [60, 220, 255], 0.5);
    const arm = (sd) => { ctx.save(); ctx.translate(sd * 11, -28); ctx.rotate(sd === fl && atk ? -1.7 * fl : sw * 0.5 * sd); ctx.fillStyle = dk; rr(-2.6, 0, 5.2, 13, 1.6); ctx.fill(); if (mech && sd === fl) { ctx.fillStyle = '#2a2e38'; ctx.fillRect(-3.4, 11, 6.8, 9); ctx.fillStyle = lit; arc(0, 21, 1.8); } else { ctx.fillStyle = '#2a2e38'; arc(0, 13, 3); } ctx.restore(); };
    arm(-1); arm(1);
    if (tr.includes('blade')) { ctx.save(); ctx.translate(fl * 11, -28); ctx.rotate(atk ? -1.7 * fl : sw * 0.5 * fl); wpn(0, 0, 14, fl * 0.35, fl < 0); ctx.restore(); }
    if (mech) { ctx.fillStyle = dk; ctx.fillRect(-12, -34, 6, 4); ctx.fillRect(6, -34, 6, 4); }
    ctx.fillStyle = body; rr(-7.5, -41, 15, 11, 3); ctx.fill();
    if (tr.includes('hat')) { ctx.fillStyle = '#30343e'; ell(0, -42, 11, 3); ctx.beginPath(); ctx.arc(0, -42, 5.4, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#10131a'; ctx.fillRect(-6, -38, 12, 4.4); ctx.fillStyle = lit; ctx.fillRect(-5, -37, 10 * (0.5 + 0.5 * Math.abs(Math.sin(t * 2 + m.off))) + 0, 2.2); ctx.fillRect(-5, -37, 10, 2.2); glowPx(0, -36, 22, hot ? [255, 70, 60] : [60, 220, 255], 0.6);
    ctx.strokeStyle = dk; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(4, -41); ctx.lineTo(6, -48); ctx.stroke(); ctx.fillStyle = hot ? '#ff4a3c' : '#ffd23c'; arc(6, -49, 1.6);
  };

  function monster(m, t, now, A) {
    const age = m.dead ? Math.min(1, (now - m.deadT) / 600) : 0, hit = now - m.hitT < 160, atk = !!(m.atkT && now - m.atkT < 220);
    const vx = Math.cos(m.dir * Math.PI / 4), vy = Math.sin(m.dir * Math.PI / 4), fl = (vx - vy) >= 0 ? 1 : -1;
    const f = FAMS[A.fam] || FAMS.quad, sz = A.sz || 1;
    if (A.boss && !m.dead) { // ออร่าบอส
      const pu = 0.8 + 0.2 * Math.sin(t * 3); ctx.save(); ctx.scale(sz, sz); ctx.strokeStyle = 'rgba(255,200,80,' + (0.55 * pu) + ')'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, 1, 30 * pu + 4, 12 * pu + 2, 0, 0, TAU); ctx.stroke(); ctx.restore();
      glowPx(0, -20 * sz, 60 * sz, [255, 150, 60], 0.5);
    }
    if (!A.f && A.fam !== 'ghost' && A.fam !== 'bird' && !(A.tr || []).includes('drone') && !(A.tr || []).includes('jelly') && A.fam !== 'fish') { ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.beginPath(); ctx.ellipse(0, 0, 18 * sz * (1 - age * .4), 6.5 * sz, 0, 0, TAU); ctx.fill(); }
    else if (A.fam === 'ghost' || A.fam === 'fish' || (A.tr || []).includes('drone')) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, 13 * sz, 4.6 * sz, 0, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.globalAlpha = 1 - age; ctx.scale(sz * (1 + age * .3), sz * (1 - age * .65));
    const hot = (m.state === 'chase') || atk;
    f({ A, m, t, now, hit, atk, mv: !!m.moving, fl, hot, c1: A.c1, c2: A.c2 });
    ctx.restore();
  }

  /* ---------------------------------------------------------------- บรรยากาศ (พิกัดจอ ไม่เก็บสถานะ) */
  function atmos(kind, t, vw, vh, zoom) {
    if (!kind || kind === 'none') return;
    const N = kind === 'rain' ? 90 : kind === 'mist' ? 7 : kind === 'dust' ? 40 : 56, z = zoom || 1;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const h1 = hsh(i, 1, 41), h2 = hsh(i, 2, 42), h3 = hsh(i, 3, 43), md = (a) => ((a % 1) + 1) % 1;
      if (kind === 'flake') { const x = md(h1 + Math.sin(t * 0.7 + i) * 0.02 + t * 0.01) * vw, y = md(h2 + t * (0.05 + h3 * 0.06)) * vh; ctx.fillStyle = 'rgba(255,255,255,' + (0.45 + h3 * 0.45) + ')'; ctx.beginPath(); ctx.arc(x, y, (1 + h3 * 2.2) * z, 0, TAU); ctx.fill(); }
      else if (kind === 'bubbles') { const x = md(h1 + Math.sin(t * 0.9 + i * 2) * 0.015) * vw, y = md(h2 - t * (0.04 + h3 * 0.05)) * vh; ctx.strokeStyle = 'rgba(200,240,255,' + (0.35 + h3 * 0.4) + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, (2 + h3 * 5) * z, 0, TAU); ctx.stroke(); }
      else if (kind === 'rain') { const x = md(h1 + t * 0.12 * (0.7 + h3 * 0.6)) * vw, y = md(h2 + t * (0.75 + h3 * 0.5)) * vh, l = (10 + h3 * 14) * z; ctx.strokeStyle = h3 > 0.78 ? 'rgba(255,90,210,.5)' : 'rgba(150,220,255,.4)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - l * 0.22, y - l); ctx.stroke(); }
      else if (kind === 'ember') { const x = md(h1 + Math.sin(t * 0.8 + i) * 0.03 + t * 0.012) * vw, y = md(h2 - t * (0.05 + h3 * 0.07)) * vh; ctx.fillStyle = 'rgba(255,' + (120 + (h3 * 100 | 0)) + ',50,' + (0.4 + 0.5 * Math.abs(Math.sin(t * 3 + i))) + ')'; ctx.beginPath(); ctx.arc(x, y, (1 + h3 * 1.6) * z, 0, TAU); ctx.fill(); }
      else if (kind === 'dust') { const x = md(h1 + t * (0.05 + h3 * 0.08)) * vw, y = md(h2 + Math.sin(t * 0.5 + i) * 0.02) * vh; ctx.strokeStyle = 'rgba(240,215,160,' + (0.14 + h3 * 0.16) + ')'; ctx.lineWidth = 1.2 * z; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (14 + h3 * 22) * z, y + 2 * z); ctx.stroke(); }
      else if (kind === 'mist') { const x = md(h1 + t * 0.006) * vw, y = (0.15 + h2 * 0.75) * vh, g = ctx.createRadialGradient(x, y, 0, x, y, 260 * z); g.addColorStop(0, 'rgba(210,235,215,.13)'); g.addColorStop(1, 'rgba(210,235,215,0)'); ctx.fillStyle = g; ctx.fillRect(x - 260 * z, y - 260 * z, 520 * z, 520 * z); }
      else if (kind === 'spore' || kind === 'mote') { const x = md(h1 + Math.sin(t * 0.4 + i * 3) * 0.03) * vw, y = md(h2 - t * (0.015 + h3 * 0.02)) * vh, a = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.3 + i)); ctx.fillStyle = kind === 'spore' ? 'rgba(200,255,140,' + a + ')' : 'rgba(190,150,255,' + a + ')'; ctx.beginPath(); ctx.arc(x, y, (1.4 + h3 * 1.8) * z, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  const W = f => function () { sync(); return f.apply(null, arguments); };
  return { env, PAL, SKY_FX, TINT, pal: th => PAL[th] || null, tint: th => TINT[th] || null, skyFx: th => SKY_FX[th] || 'none',
    bakeTile: W(bakeTile), bakeVoids: W(bakeVoids), tree: W(tree), prop: W(prop), building: W(building), monster: W(monster), atmos: W(atmos) };
})();
