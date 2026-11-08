/* game.js — แกนเกม "Bamboo Creek Online"
 * ใช้ร่วมกันทั้งเซิร์ฟเวอร์ (Node) และเบราว์เซอร์ (โหมดเดโม)
 * มี: แมพหมู่บ้าน, หาเส้นทาง A*, ผู้เล่น/NPC, ฮับข้อความ (Hub) ที่ไม่ผูกกับ transport
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Game = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const W = 40, H = 32;
  const T = { GRASS: 0, PATH: 1, STONE: 2, WATER: 3, BRIDGE: 4 };
  const SPEED = 4.6;                 // ช่อง/วินาที
  const DAY_MS = 12 * 60 * 1000;     // 1 วันในเกม = 12 นาทีจริง
  const START_HOUR = 10;
  const OUTFITS = 6, HAIRS = 4, HAIR_COLORS = 4;
  const MAX_NAME = 12, MAX_CHAT = 80, MAX_PLAYERS = 100;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------------- map */
  function buildMap() {
    const tiles = new Uint8Array(W * H);
    const solid = new Uint8Array(W * H);
    const I = (x, y) => y * W + x;
    const R = rng(7741);
    const depth = (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y);
    const riverC = x => 27.6 + Math.sin(x * 0.27) * 1.1;

    // แม่น้ำคดเคี้ยว
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (Math.abs(y + 0.5 - riverC(x)) < 1.05) tiles[I(x, y)] = T.WATER;
    // ถนน
    for (let y = 2; y < H - 2; y++)
      for (const x of [19, 20]) if (tiles[I(x, y)] !== T.WATER) tiles[I(x, y)] = T.PATH;
    for (let x = 2; x < W - 2; x++)
      for (const y of [15, 16]) tiles[I(x, y)] = T.PATH;
    // ลานกลางหมู่บ้าน
    for (let y = 11; y <= 20; y++)
      for (let x = 15; x <= 24; x++) tiles[I(x, y)] = T.STONE;
    // สะพานข้ามน้ำบนถนนสายหลัก
    for (let y = 0; y < H; y++)
      for (const x of [19, 20]) if (tiles[I(x, y)] === T.WATER) tiles[I(x, y)] = T.BRIDGE;

    const objs = [];
    const occupy = (x0, y0, w, h) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) solid[I(x, y)] = 1;
    };
    const B = (kind, x, y, w, h, extra) => {
      objs.push(Object.assign({ type: 'building', kind, x, y, w, h }, extra));
      occupy(x, y, w, h);
    };

    B('inn', 24, 5, 5, 4, { name: 'โรงเตี๊ยม' });
    B('shop', 10, 6, 4, 3, { name: 'ร้านค้า' });
    B('dojo', 27, 20, 6, 4, { name: 'สำนักยุทธ์' });
    B('pagoda', 31, 6, 3, 3, { name: 'เจดีย์ไผ่' });
    [[9, 11], [4, 11], [4, 18], [11, 19], [27, 11], [34, 11], [14, 22], [23, 22]]
      .forEach((p, i) => B('house', p[0], p[1], 3, 3, { v: i % 3 }));

    // แผงตลาด, บ่อน้ำ, ซุ้มประตูหมู่บ้าน
    objs.push({ type: 'stall', x: 16, y: 12, w: 2, h: 1, v: 0 }); occupy(16, 12, 2, 1);
    objs.push({ type: 'stall', x: 22, y: 12, w: 2, h: 1, v: 1 }); occupy(22, 12, 2, 1);
    objs.push({ type: 'well', x: 19, y: 15, w: 2, h: 2 }); occupy(19, 15, 2, 2);
    objs.push({ type: 'pillar', x: 18, y: 3, w: 1, h: 1, beam: true }); occupy(18, 3, 1, 1);
    objs.push({ type: 'pillar', x: 21, y: 3, w: 1, h: 1, beam: false }); occupy(21, 3, 1, 1);

    // โคมไฟริมทาง
    [[15, 11], [24, 11], [15, 20], [24, 20], [18, 7], [21, 7], [18, 24], [21, 24],
      [7, 14], [7, 17], [31, 14], [31, 17]].forEach(p => {
      objs.push({ type: 'lamp', x: p[0], y: p[1], w: 1, h: 1 });
      occupy(p[0], p[1], 1, 1);
    });

    // NPC
    const npcs = [
      { id: 'n1', name: 'ผู้ใหญ่บ้าน', x: 17, y: 17, look: { o: 5, h: 2, c: 2 },
        lines: ['ยินดีต้อนรับสู่หมู่บ้านลำธารไผ่', 'กลางคืนโคมไฟสวยที่สุดเลยนะ', 'ระวังตัวเวลาออกนอกประตูหมู่บ้านด้วย'] },
      { id: 'n2', name: 'เจ้าของร้าน', x: 12, y: 9, look: { o: 3, h: 3, c: 1 },
        lines: ['ของดี ราคาถูก เชิญเลือกชมก่อนครับ', 'ยาบำรุงกำลังเพิ่งมาใหม่!', 'ซื้อสามแถมหนึ่งนะ'] },
      { id: 'n3', name: 'เถ้าแก่โรงเตี๊ยม', x: 26, y: 9, look: { o: 0, h: 0, c: 0 },
        lines: ['ชาร้อนกับซาลาเปาไหมจ๊ะ', 'ห้องพักว่างอยู่นะ', 'นักเดินทางมาจากไหนกันล่ะ'] },
      { id: 'n4', name: 'ทหารเฝ้าประตู', x: 21, y: 5, look: { o: 5, h: 2, c: 0 },
        lines: ['ผ่านได้ แต่อย่าก่อเรื่อง', 'ข้านั่งเฝ้าทั้งวันทั้งคืน', 'ทางเหนือเงียบสงบดี']}
    ];
    npcs.forEach(n => { solid[I(n.x, n.y)] = 1; });

    // ต้นไม้
    const prot = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const t = tiles[I(x, y)];
        if (t === T.PATH || t === T.STONE || t === T.BRIDGE || solid[I(x, y)]) {
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              if (inb(x + dx, y + dy)) prot[I(x + dx, y + dy)] = 1;
        }
      }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = I(x, y);
        if (tiles[i] === T.WATER || tiles[i] === T.BRIDGE) { if (depth(x, y) < 2) solid[i] = 1; continue; }
        if (tiles[i] === T.PATH || tiles[i] === T.STONE || solid[i]) continue;
        const d = depth(x, y);
        let p;
        if (d < 2) p = 1;
        else if (d < 3) p = prot[i] ? 0 : 0.8;
        else if (d < 4) p = prot[i] ? 0 : 0.5;
        else p = prot[i] ? 0 : 0.1;
        if (R() >= p) continue;
        const nearRiver = Math.abs(y + 0.5 - riverC(x)) < 4.5;
        const r = R();
        let v;
        if (nearRiver) v = r < 0.55 ? 3 : r < 0.75 ? 1 : 0;
        else if (d < 4) v = r < 0.5 ? 2 : r < 0.8 ? 0 : 1;
        else v = r < 0.4 ? 1 : r < 0.75 ? 0 : 2;
        objs.push({ type: 'tree', x, y, w: 1, h: 1, v });
        solid[i] = 1;
      }

    const spawn = [];
    for (let y = 17; y <= 19; y++)
      for (let x = 16; x <= 23; x++) if (!solid[I(x, y)]) spawn.push([x, y]);

    return { W, H, tiles, solid, objs, npcs, spawn, riverC };
  }

  /* ----------------------------------------------------------- pathfinding */
  const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  class MinHeap {
    constructor() { this.k = []; this.v = []; }
    get size() { return this.k.length; }
    push(key, val) {
      const k = this.k, v = this.v;
      let c = k.length; k.push(key); v.push(val);
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (k[p] <= k[c]) break;
        [k[p], k[c]] = [k[c], k[p]]; [v[p], v[c]] = [v[c], v[p]]; c = p;
      }
    }
    pop() {
      const k = this.k, v = this.v;
      const top = v[0];
      const lk = k.pop(), lv = v.pop();
      if (k.length) {
        k[0] = lk; v[0] = lv;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < k.length && k[l] < k[m]) m = l;
          if (r < k.length && k[r] < k[m]) m = r;
          if (m === i) break;
          [k[m], k[i]] = [k[i], k[m]]; [v[m], v[i]] = [v[i], v[m]]; i = m;
        }
      }
      return top;
    }
  }

  function findPath(map, sx, sy, tx, ty) {
    if (!inb(tx, ty) || !inb(sx, sy) || map.solid[tx + ty * W]) return null;
    if (sx === tx && sy === ty) return [[sx, sy]];
    const N = W * H;
    const g = new Float32Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);
    const done = new Uint8Array(N);
    const heap = new MinHeap();
    const si = sx + sy * W, ti = tx + ty * W;
    const hh = (x, y) => {
      const dx = Math.abs(x - tx), dy = Math.abs(y - ty);
      return dx + dy - 0.5858 * Math.min(dx, dy);
    };
    g[si] = 0; heap.push(hh(sx, sy), si);
    while (heap.size) {
      const i = heap.pop();
      if (done[i]) continue;
      done[i] = 1;
      if (i === ti) break;
      const x = i % W, y = (i / W) | 0;
      for (let k = 0; k < 8; k++) {
        const nx = x + D8[k][0], ny = y + D8[k][1];
        if (!inb(nx, ny) || map.solid[nx + ny * W]) continue;
        if (k >= 4 && (map.solid[nx + y * W] || map.solid[x + ny * W])) continue; // ห้ามตัดมุม
        const ni = nx + ny * W;
        const ng = g[i] + (k >= 4 ? 1.4142 : 1);
        if (ng < g[ni]) { g[ni] = ng; prev[ni] = i; heap.push(ng + hh(nx, ny), ni); }
      }
    }
    if (!done[ti]) return null;
    const path = [];
    for (let i = ti; i !== -1; i = prev[i]) path.push([i % W, (i / W) | 0]);
    return path.reverse();
  }

  function nearestWalkable(map, x, y, maxR) {
    let best = null, bd = Infinity;
    for (let r = 0; r <= maxR; r++) {
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const nx = x + dx, ny = y + dy;
          if (!inb(nx, ny) || map.solid[nx + ny * W]) continue;
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = [nx, ny]; }
        }
      if (best) return best;
    }
    return null;
  }

  /* ------------------------------------------------------------ sanitizers */
  const CTRL = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g;
  function cleanName(s) {
    s = String(s == null ? '' : s).replace(CTRL, '').replace(/\s+/g, ' ').trim();
    s = Array.from(s).slice(0, MAX_NAME).join('');
    return s || 'นักเดินทาง';
  }
  function cleanText(s) {
    s = String(s == null ? '' : s).replace(CTRL, '').replace(/\s+/g, ' ').trim();
    return Array.from(s).slice(0, MAX_CHAT).join('');
  }
  function cleanLook(l) {
    l = l && typeof l === 'object' ? l : {};
    const f = (v, n) => { v = Number(v); return Number.isInteger(v) && v >= 0 && v < n ? v : 0; };
    return { o: f(l.o, OUTFITS), h: f(l.h, HAIRS), c: f(l.c, HAIR_COLORS) };
  }

  /* ----------------------------------------------------------------- world */
  const dirOf = (dx, dy) => (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;

  class World {
    constructor() {
      this.map = buildMap();
      this.players = new Map();
      this.nextId = 1;
      this.epoch = Date.now() - (START_HOUR / 24) * DAY_MS;
      this.events = [];
      this.npcTimer = 6;
    }
    phase(now) {
      now = now || Date.now();
      return ((((now - this.epoch) % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS;
    }
    addPlayer(name, look) {
      const sp = this.map.spawn[Math.floor(Math.random() * this.map.spawn.length)] || [20, 18];
      const p = {
        id: this.nextId++, name: cleanName(name), look: cleanLook(look),
        x: sp[0] + 0.5, y: sp[1] + 0.5, dir: 2, moving: false, path: [], dirty: false
      };
      this.players.set(p.id, p);
      return p;
    }
    removePlayer(id) { this.players.delete(id); }
    setTarget(id, x, y) {
      const p = this.players.get(id);
      if (!p) return false;
      let tx = Math.floor(x), ty = Math.floor(y);
      if (!inb(tx, ty)) return false;
      const m = this.map;
      if (m.solid[tx + ty * W]) {
        const n = nearestWalkable(m, tx, ty, 3);
        if (!n) return false;
        tx = n[0]; ty = n[1];
      }
      const path = findPath(m, clamp(Math.floor(p.x), 0, W - 1), clamp(Math.floor(p.y), 0, H - 1), tx, ty);
      if (!path) return false;
      p.path = path.length > 1 ? path.slice(1) : [[tx, ty]];
      p.moving = true; p.dirty = true;
      return true;
    }
    step(dt) {
      for (const p of this.players.values()) {
        if (!p.path.length) continue;
        let budget = SPEED * dt;
        while (budget > 1e-6 && p.path.length) {
          const tx = p.path[0][0] + 0.5, ty = p.path[0][1] + 0.5;
          const dx = tx - p.x, dy = ty - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1e-6) { p.path.shift(); continue; }
          p.dir = dirOf(dx, dy);
          if (dist <= budget) { p.x = tx; p.y = ty; budget -= dist; p.path.shift(); }
          else { p.x += dx / dist * budget; p.y += dy / dist * budget; budget = 0; }
        }
        p.moving = p.path.length > 0;
        p.dirty = true;
      }
      this.npcTimer -= dt;
      if (this.npcTimer <= 0) {
        this.npcTimer = 9 + Math.random() * 12;
        if (this.players.size) {
          const n = this.map.npcs[Math.floor(Math.random() * this.map.npcs.length)];
          const text = n.lines[Math.floor(Math.random() * n.lines.length)];
          this.events.push({ t: 'chat', id: n.id, name: n.name, text, npc: 1 });
        }
      }
    }
    snapshot() {
      const out = [];
      for (const p of this.players.values()) {
        if (!p.dirty) continue;
        out.push([p.id, Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, p.dir, p.moving ? 1 : 0]);
        if (!p.moving) p.dirty = false;
      }
      return out;
    }
    drainEvents() { const e = this.events; this.events = []; return e; }
  }

  const pub = p => ({ id: p.id, name: p.name, look: p.look, x: p.x, y: p.y, dir: p.dir, m: p.moving ? 1 : 0 });

  /* ------------------------------------------------------------------- hub
   * ตรรกะข้อความทั้งหมดอยู่ตรงนี้ — transport (WebSocket หรือโหมดเดโมในเบราว์เซอร์)
   * แค่ส่งสตริงเข้า hub.message() และรับสตริงกลับผ่านฟังก์ชัน send
   */
  class Hub {
    constructor() { this.world = new World(); this.conns = new Set(); this.n = 0; }
    connect(send) {
      const c = { send, player: null, lastChat: 0, lastMove: 0 };
      this.conns.add(c);
      return c;
    }
    bcast(obj, except) {
      const s = JSON.stringify(obj);
      for (const c of this.conns) if (c.player && c !== except) c.send(s);
    }
    message(c, raw) {
      let m = raw;
      if (typeof raw === 'string') {
        if (raw.length > 1024) return;
        try { m = JSON.parse(raw); } catch (e) { return; }
      }
      if (!m || typeof m !== 'object') return;
      const now = Date.now();
      if (m.t === 'join') {
        if (c.player) return;
        if (this.world.players.size >= MAX_PLAYERS) { c.send(JSON.stringify({ t: 'full' })); return; }
        const p = this.world.addPlayer(m.name, m.look);
        c.player = p;
        c.send(JSON.stringify({
          t: 'init', id: p.id, phase: this.world.phase(now), dayMs: DAY_MS,
          players: Array.from(this.world.players.values()).map(pub)
        }));
        this.bcast({ t: 'join', p: pub(p) }, c);
      } else if (!c.player) {
        return;
      } else if (m.t === 'move') {
        if (now - c.lastMove < 60) return;
        c.lastMove = now;
        const x = Number(m.x), y = Number(m.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        this.world.setTarget(c.player.id, x, y);
      } else if (m.t === 'chat') {
        if (now - c.lastChat < 700) return;
        const text = cleanText(m.text);
        if (!text) return;
        c.lastChat = now;
        this.bcast({ t: 'chat', id: c.player.id, name: c.player.name, text });
      }
    }
    drop(c) {
      if (!this.conns.delete(c)) return;
      if (c.player) {
        this.world.removePlayer(c.player.id);
        this.bcast({ t: 'leave', id: c.player.id });
        c.player = null;
      }
    }
    tick(dt) {
      this.world.step(dt);
      for (const ev of this.world.drainEvents()) this.bcast(ev);
      this.n++;
      if (this.n % 2 === 0) {
        const snap = this.world.snapshot();
        if (snap.length) this.bcast({ t: 'snap', p: snap });
      }
    }
  }

  return {
    W, H, T, SPEED, DAY_MS, START_HOUR, OUTFITS, HAIRS, HAIR_COLORS, MAX_NAME, MAX_CHAT,
    buildMap, findPath, nearestWalkable, World, Hub, cleanName, cleanText, cleanLook, rng
  };
});
