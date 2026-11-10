/* game.js — แกนเกม "Chathai Online"
 * ใช้ร่วมกันทั้งเซิร์ฟเวอร์ (Node) และเบราว์เซอร์ (โหมดเดโม)
 * มี: แมพหมู่บ้าน, หาเส้นทาง A*, ผู้เล่น/NPC, ฮับข้อความ (Hub) ที่ไม่ผูกกับ transport
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Game = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RPG = typeof require === 'function' && typeof module === 'object' ? require('./rpg.js') : (typeof self !== 'undefined' ? self : this).RPG;
  const WORLD = typeof require === 'function' && typeof module === 'object' ? require('./world.js') : (typeof self !== 'undefined' ? self : this).World;
  const W = 40, H = 32;
  const T = { GRASS: 0, PATH: 1, STONE: 2, WATER: 3, BRIDGE: 4 };
  const SPEED = 4.6;                 // ช่อง/วินาที
  const DAY_MS = 12 * 60 * 1000;     // 1 วันในเกม = 12 นาทีจริง
  const START_HOUR = 10;
  const OUTFITS = 6, HAIRS = 4, HAIR_COLORS = 4;
  const MAX_NAME = 12, MAX_CHAT = 80, MAX_PLAYERS = 100;
  const MELEE = 1.6, LEASH = 10;   // ระยะตี (ช่อง), ตีทุกกี่วินาที, ระยะที่มอนสเตอร์เลิกไล่
  const ZONES = WORLD.ZONES, TOWNS = WORLD.TOWNS;
  const ITEMS = {
    coin: { name: 'เหรียญทองแดง', desc: 'เงินที่ใช้กันทั่วทั้งลำธารไผ่' },
    jelly: { name: 'ก้อนวุ้นไผ่', desc: 'วุ้นเหนียวหนึบจากสไลม์ไผ่ พ่อค้ารับซื้อไปทำขนม', sell: 5 },
    tusk: { name: 'เขี้ยวหมูป่า', desc: 'เขี้ยวโค้งคมกริบของหมูป่าไผ่ ช่างตีเหล็กชอบนัก', sell: 14 },
    herb: { name: 'สมุนไพร', desc: 'ใบไม้สดชื่นที่เคี้ยวแล้วแผลหายไว ฟื้นเลือด 40', heal: 40, buy: 20, sell: 6 },
    tonic: { name: 'ยาบำรุงกำลัง', desc: 'ยาต้มสูตรลับของร้านยา ฟื้นเลือด 100', heal: 100, buy: 70, sell: 20 },
    // อุปกรณ์สวมใส่: slot = weapon (เพิ่มพลังโจมตี) / armor (เพิ่มป้องกัน)
    sword_wood: { name: 'ดาบไม้ไผ่', desc: 'ดาบฝึกหัดเหลาจากไผ่แก่ เบาและทนกว่าที่คิด', slot: 'weapon', atk: 4, buy: 120, sell: 40 },
    sword_iron: { name: 'ดาบเหล็กกล้า', desc: 'ดาบเหล็กพับสามชั้น คมกริบ', slot: 'weapon', atk: 10, buy: 450, sell: 150 },
    robe_cloth: { name: 'เสื้อคลุมผ้าฝ้าย', desc: 'เสื้อคลุมเนื้อหนา กันลมกันหนาวได้ดี', slot: 'armor', def: 2, buy: 100, sell: 30 },
    armor_hide: { name: 'เกราะหนังหมูป่า', desc: 'เกราะหนังแข็งเย็บมือ กันเขี้ยวหมูป่าได้สบาย', slot: 'armor', def: 5, buy: 380, sell: 120 }
  };
  Object.assign(ITEMS, RPG.genItems(ITEMS));
  Object.assign(ITEMS, WORLD.ITEMS_X);
  // อุปกรณ์สุ่มดรอปตามขั้น (0-4)
  const GEAR = [[], [], [], [], []];
  for (const id of Object.keys(ITEMS)) { const it = ITEMS[id]; if (it.wt && /[0-4]$/.test(id) && (it.slot === 'weapon' || it.slot === 'armor' || it.slot === 'off')) GEAR[+id.slice(-1)].push(id); }
  const SKILLS = RPG.SK;   // สกิลทั้งหมดอยู่ใน rpg.js
  const ACT_SK = RPG.ACTIVE_IDS();
  // ร้านค้า: ร้านยารับซื้อของทั่วไป ร้านอาวุธรับซื้ออุปกรณ์
  const SHOPS = {
    potion: { npc: 'n2', title: 'ร้านยา', buy: ['herb', 'tonic'], sellSlot: false },
    smith: { npc: 'n5', title: 'ร้านอาวุธและชุดเกราะ', buy: RPG.smithList(), sellSlot: true }
  };
  // เควสต์ (ต้องไปรับ/ส่งกับ NPC ในหมู่บ้าน)
  const QUESTS = {
    q_slime: {
      title: 'วุ้นไผ่เกลื่อนทุ่ง', giver: 'n1', minLv: 1, kill: 'slime', n: 5, nav: 'slime',
      goal: 'ล่าวุ้นไผ่', rewards: { exp: 40, items: { coin: 60, herb: 3 } },
      offer: 'ทุ่งไผ่เขียวทางเหนือมีวุ้นไผ่เพิ่มขึ้นมากจนชาวบ้านไม่กล้าไปเก็บฟืน ช่วยไปกำจัดมันสัก 5 ตัวได้ไหม ข้าจะตอบแทนอย่างงาม',
      progress: 'วุ้นไผ่ยังเยอะอยู่นะ สู้ไหวไหม ถ้าเลือดน้อยก็กินสมุนไพรเสียก่อน',
      done: 'เก่งมาก! ชาวบ้านจะได้เก็บฟืนกันได้เสียที นี่ค่าตอบแทนของเจ้า'
    },
    q_boar: {
      title: 'หมูป่าอาละวาด', giver: 'n3', minLv: 4, prereq: 'q_slime', kill: 'boar', n: 5, nav: 'boar',
      goal: 'ล่าหมูป่าไผ่', rewards: { exp: 260, items: { coin: 350, tonic: 3 } },
      offer: 'หมูป่าไผ่พวกนี้ไล่ขวิดพ่อค้าที่ผ่านมาพักโรงเตี๊ยมข้า หากเจ้าปราบมันได้ 5 ตัว ข้าจะให้ยาบำรุงกำลังกับเงินก้อนหนึ่ง',
      progress: 'หมูป่าอยู่ทางเหนือของทุ่ง ระวังเขี้ยวมันด้วยนะ',
      done: 'ดีเหลือเกิน! พ่อค้าจะได้เดินทางสบายใจ รับรางวัลไปเลย'
    },
    q_tusk: {
      title: 'เขี้ยวของช่างตีเหล็ก', giver: 'n4', minLv: 7, prereq: 'q_boar', collect: 'tusk', n: 5, nav: 'boar',
      goal: 'เก็บเขี้ยวหมูป่า', rewards: { exp: 600, items: { coin: 800, armor_hide: 1, tonic: 3 } },
      offer: 'ช่างตีเหล็กอยากได้เขี้ยวหมูป่าไปทำด้ามมีด ข้าเฝ้าประตูไปไหนไม่ได้ เจ้าช่วยเก็บเขี้ยวหมูป่ามาให้ข้า 5 อันที เดี๋ยวข้าจัดการต่อเอง',
      progress: 'เขี้ยวหมูป่าได้จากการล่าหมูป่าไผ่ แต่ไม่ได้ทุกตัวนะ ใจเย็น ๆ',
      done: 'เขี้ยวสวยทั้งนั้น! ข้าเอาไปให้ช่างตีเหล็กเอง นี่รางวัลของเจ้า'
    },
    q_clear: {
      title: 'กวาดล้างหมูป่า', giver: 'n1', minLv: 12, prereq: 'q_tusk', kill: 'boar', n: 15, nav: 'boar',
      goal: 'ล่าหมูป่าไผ่', rewards: { exp: 1800, items: { coin: 2000, sword_iron: 1, tonic: 5 } },
      offer: 'ฝูงหมูป่ายังไม่หมดไป เจ้าฝีมือดีขึ้นมากแล้ว ปราบอีก 15 ตัวเถิด ข้ามีดาบเหล็กกล้าเก็บไว้ จะมอบให้เป็นรางวัล',
      progress: 'เหลืออีกไม่มากแล้ว สู้ต่อไป!',
      done: 'หมู่บ้านเราปลอดภัยเพราะเจ้าแท้ ๆ รับดาบเล่มนี้ไว้เถิด'
    }
  };

  const MON = {
    slime: {
      name: 'วุ้นไผ่', lv: 1, hp: 30, atk: [3, 6], atkCd: 1.4, speed: 2.4, exp: 12, respawn: 12,
      drops: [['coin', 1, [3, 9]], ['jelly', 0.7, [1, 1]], ['herb', 0.15, [1, 1]]]  // [ไอเท็ม, โอกาส, [น้อยสุด, มากสุด]]
    },
    boar: {
      name: 'หมูป่าไผ่', lv: 4, hp: 70, atk: [6, 10], atkCd: 1.3, speed: 3.0, exp: 34, respawn: 20,
      drops: [['coin', 1, [10, 22]], ['tusk', 0.6, [1, 1]], ['herb', 0.25, [1, 2]], ['tonic', 0.06, [1, 1]], ['sword_iron', 0.03, [1, 1]], ['armor_hide', 0.06, [1, 1]]]
    }
  };
  // จุดเกิดมอนสเตอร์ในแต่ละแมพ: [ชนิด, x0, y0, x1, y1, จำนวน]
  const MON_SPAWNS = {
    field: [['slime', 4, 18, 15, 26, 5], ['slime', 25, 19, 36, 26, 4], ['boar', 4, 3, 15, 11, 3], ['boar', 24, 3, 36, 10, 3]]
  };

  // ---- ขยายโลก: มอนสเตอร์ ร้านค้า เควสต์ และจุดเกิดจาก world.js
  Object.assign(MON, WORLD.MONX);
  { const WI = WORLD.init(RPG); Object.assign(SHOPS, WI.shops); Object.assign(QUESTS, WI.quests); }
  MON_SPAWNS.field = MON_SPAWNS.field.concat(WORLD.FIELD_SPAWN_X);
  for (const z of ZONES) if (z !== 'village' && z !== 'field') MON_SPAWNS[z] = WORLD.build(z).spawns;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

  // ช่วงเลเวลมอนสเตอร์ของแต่ละแมพ (null = ไม่มีมอนสเตอร์)
  function zoneLevels(name) {
    const sp = MON_SPAWNS[name]; if (!sp) return null;
    let lo = 99, hi = 0;
    for (const z of sp) { if (MON[z[0]].boss) continue; lo = Math.min(lo, MON[z[0]].lv); hi = Math.max(hi, MON[z[0]].lv); }
    return hi ? [lo, hi] : null;
  }
  const ZONE_LV = {}; ZONES.forEach(z => { ZONE_LV[z] = zoneLevels(z); });

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
  const STORE_SLOTS = 60;
  function buildMap(name) {
    if (name === 'village') { const vm = buildVillage(); WORLD.addKafra(vm, 'village'); return vm; }
    if (name === 'field') { const m = buildField(); WORLD.fieldExtra(m); return m; }
    return WORLD.build(name);
  }

  function buildVillage() {
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
    B('shop', 10, 6, 4, 3, { name: 'ร้านยา' });
    B('dojo', 27, 20, 6, 4, { name: 'สำนักยุทธ์' });
    B('pagoda', 31, 6, 3, 3, { name: 'เจดีย์ไผ่' });
    [[9, 11], [4, 11], [4, 18], [11, 19], [27, 11], [34, 11], [14, 22], [23, 22]]
      .forEach((p, i) => B('house', p[0], p[1], 3, 3, { v: i % 3 }));

    // แผงตลาด, บ่อน้ำ, ซุ้มประตูหมู่บ้าน
    objs.push({ type: 'stall', x: 16, y: 12, w: 2, h: 1, v: 0 }); occupy(16, 12, 2, 1);
    objs.push({ type: 'stall', x: 22, y: 12, w: 2, h: 1, v: 1 }); occupy(22, 12, 2, 1);
    objs.push({ type: 'stall', x: 28, y: 14, w: 2, h: 1, v: 1 }); occupy(28, 14, 2, 1);
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
      { id: 'n2', name: 'เจ้าของร้านยา', x: 12, y: 9, look: { o: 3, h: 3, c: 1 },
        lines: ['ยาดี ราคาถูก เชิญเลือกชมก่อนครับ', 'ยาบำรุงกำลังเพิ่งมาใหม่!', 'ออกไปล่าสัตว์อย่าลืมพกสมุนไพรนะ'] },
      { id: 'n3', name: 'เถ้าแก่โรงเตี๊ยม', x: 26, y: 9, look: { o: 0, h: 0, c: 0 },
        lines: ['ชาร้อนกับซาลาเปาไหมจ๊ะ', 'ห้องพักว่างอยู่นะ', 'นักเดินทางมาจากไหนกันล่ะ'] },
      { id: 'n5', name: 'ช่างตีเหล็ก', x: 30, y: 14, look: { o: 2, h: 0, c: 0 },
        lines: ['ดาบดี เกราะแกร่ง มาดูก่อนได้นะ', 'เหล็กต้องตีตอนยังร้อน', 'ได้เขี้ยวหมูป่ามาไหม ข้าอยากได้'] },
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

    // ประตูวาร์ปทางเหนือ (หลังซุ้มประตูหมู่บ้าน) ไปทุ่งไผ่เขียว
    const portals = [{ x: 19, y: 5, w: 2, h: 1, to: 'field', tx: 20, ty: 25, name: 'ทุ่งไผ่เขียว' }];
    return { name: 'village', theme: 'bamboo', W, H, tiles, solid, objs, npcs, spawn, riverC, portals, fixedHour: null };
  }

  /* ทุ่งไผ่เขียว: แมพล่ามอนสเตอร์ มีบ่อน้ำ ทางเดิน และต้นไม้หนาแน่นตามขอบ */
  function buildField() {
    const tiles = new Uint8Array(W * H), solid = new Uint8Array(W * H);
    const I = (x, y) => y * W + x, R = rng(5309);
    const depth = (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y);
    // บ่อน้ำ
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - 29) / 4.6, dy = (y + 0.5 - 14) / 3.2;
      if (dx * dx + dy * dy < 1) { tiles[I(x, y)] = T.WATER; solid[I(x, y)] = 1; }
    }
    // ทางเดิน (กว้าง 2 ช่อง)
    const seg = (x0, y0, x1, y1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]])
          if (inb(x + a, y + b) && tiles[I(x + a, y + b)] !== T.WATER) tiles[I(x + a, y + b)] = T.PATH;
      }
    };
    seg(19, 29, 19, 21); seg(19, 21, 12, 15); seg(12, 15, 11, 5); seg(19, 21, 30, 22); seg(30, 22, 33, 9);
    const objs = [];
    // โคมไฟสองข้างประตูวาร์ปทางกลับ
    [[17, 27], [22, 27]].forEach(p => { objs.push({ type: 'lamp', x: p[0], y: p[1], w: 1, h: 1 }); solid[I(p[0], p[1])] = 1; });
    // ต้นไม้: หนาแน่นตามขอบ กระจายเบา ๆ ด้านใน เว้นทางเดินและบริเวณประตู
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = I(x, y);
      if (tiles[i] === T.WATER || tiles[i] === T.PATH || solid[i]) continue;
      if (Math.abs(x - 19.5) < 4 && y > 22) continue;
      const d = depth(x, y);
      const p = d < 2 ? 1 : d < 3 ? 0.7 : d < 4 ? 0.35 : 0.07;
      if (R() >= p) continue;
      const r = R();
      objs.push({ type: 'tree', x, y, w: 1, h: 1, v: r < 0.55 ? 1 : r < 0.8 ? 0 : 2 });
      solid[i] = 1;
    }
    const spawn = [];
    for (let y = 24; y <= 26; y++) for (let x = 18; x <= 21; x++) if (!solid[I(x, y)]) spawn.push([x, y]);
    const portals = [{ x: 19, y: 28, w: 2, h: 1, to: 'village', tx: 20, ty: 8.5, name: 'กลับหมู่บ้านลำธารไผ่' }];
    return { name: 'field', theme: 'bamboo', W, H, tiles, solid, objs, npcs: [], spawn, riverC: null, portals, fixedHour: null };
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
    return { o: f(l.o, OUTFITS), h: f(l.h, HAIRS), c: f(l.c, HAIR_COLORS), g: l.g === 1 || l.g === '1' ? 1 : 0 };
  }

  /* ----------------------------------------------------------------- world */
  const dirOf = (dx, dy) => (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const nextExp = lv => Math.round(20 * Math.pow(lv, 1.6));
  const LVCAP = RPG.MAX_LV;

  // เดินตามเส้นทาง คืนค่า true ถ้าขยับจริง
  function advance(e, speed, dt) {
    let budget = speed * dt, moved = false;
    while (budget > 1e-6 && e.path.length) {
      const tx = e.path[0][0] + 0.5, ty = e.path[0][1] + 0.5;
      const dx = tx - e.x, dy = ty - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1e-6) { e.path.shift(); continue; }
      e.dir = dirOf(dx, dy);
      moved = true;
      if (dist <= budget) { e.x = tx; e.y = ty; budget -= dist; e.path.shift(); }
      else { e.x += dx / dist * budget; e.y += dy / dist * budget; budget = 0; }
    }
    return moved;
  }

  class World {
    constructor() {
      this.zones = {};
      for (const name of ZONES) this.zones[name] = { name, map: buildMap(name) };
      this.map = this.zones.village.map;
      this.players = new Map();
      this.nextId = 1;
      this.epoch = Date.now() - (START_HOUR / 24) * DAY_MS;
      this.events = [];
      this.npcTimer = 6;
      this.time = 0;
      this.monsters = [];
      this.monById = new Map();
      this.spawnMonsters();
    }
    spawnMonsters() {
      const R = rng(31); let n = 1;
      for (const zname of Object.keys(MON_SPAWNS)) {
        const m = this.zones[zname].map;
        for (const z of MON_SPAWNS[zname]) {   // [ชนิด, x0, y0, x1, y1, จำนวน]
          const cand = [];
          for (let y = z[2]; y <= z[4]; y++)
            for (let x = z[1]; x <= z[3]; x++) if (!m.solid[y * W + x] && m.tiles[y * W + x] !== T.WATER && m.tiles[y * W + x] !== T.VOID && !m.portals.some(pt => Math.hypot(x + 0.5 - pt.x - pt.w / 2, y + 0.5 - pt.y - pt.h / 2) < 8)) cand.push([x, y]);
          for (let i = 0; i < z[5] && cand.length; i++) {
            const c = cand.splice(Math.floor(R() * cand.length), 1)[0];
            const D = MON[z[0]];
            const mon = {
              id: 'm' + n++, zone: zname, type: z[0], x: c[0] + 0.5, y: c[1] + 0.5, hx: c[0] + 0.5, hy: c[1] + 0.5,
              hp: D.hp, maxHp: D.hp, dir: 2, moving: false, path: [], state: 'idle',
              wait: 1 + R() * 4, atkCd: 0, repath: 0, target: null, respawn: 0, dirty: false, wp: Math.floor(R() * 5)
            };
            this.monsters.push(mon); this.monById.set(mon.id, mon);
          }
        }
      }
    }
    phase(now) {
      now = now || Date.now();
      return ((((now - this.epoch) % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS;
    }
    applyLevel(p) {
      RPG.derive(p, ITEMS, this.time);
      p.hp = Math.min(p.hp, p.maxHp); p.mp = Math.min(p.mp, p.maxMp);
    }
    pickSpawn(zone) {
      const sp = this.zones[zone].map.spawn;
      return sp[Math.floor(Math.random() * sp.length)] || [20, 18];
    }
    playersIn(zone) { return Array.from(this.players.values()).filter(p => p.zone === zone); }
    addPlayer(name, look, save) {
      const home = save && TOWNS.indexOf(save.home) >= 0 ? save.home : 'village';
      const sp = this.pickSpawn(home);
      const p = {
        id: this.nextId++, name: cleanName(name), look: cleanLook(look), zone: home, home, seen: { village: 1 },
        x: sp[0] + 0.5, y: sp[1] + 0.5, dir: 2, moving: false, path: [], dirty: false,
        lv: 1, exp: 0, hp: 60, maxHp: 60, mp: 30, maxMp: 30, cd: {}, mpT: 0, atk: 8, def: 0, inv: {}, equip: { weapon: null, off: null, armor: null, ammo: null }, quests: {}, qdone: {},
        target: null, atkCd: 0, repath: 0, lastCombat: -99, regenT: 0, dead: false, respawn: 0, warpCd: 0, pend: null, buffT: 0, ammoWarn: 0, gm: false
      };
      if (save && typeof save === 'object') {
        p.lv = clamp(Math.floor(Number(save.lv)) || 1, 1, LVCAP);
        p.exp = p.lv >= LVCAP ? 0 : clamp(Math.floor(Number(save.exp)) || 0, 0, nextExp(p.lv) - 1);
        if (save.inv && typeof save.inv === 'object') {
          for (const k of Object.keys(ITEMS)) {
            const v = Math.floor(Number(save.inv[k]));
            if (v > 0) p.inv[k] = Math.min(v, 99999);
          }
        }
      }
      if (save && Array.isArray(save.seen)) for (const z of save.seen) if (ZONES.indexOf(z) >= 0) p.seen[z] = 1;
      p.seen[home] = 1;
      p.storage = {};
      if (save && save.storage && typeof save.storage === 'object') for (const k of Object.keys(save.storage)) { const v = Math.floor(Number(save.storage[k])); if ((ITEMS[k] || k === 'coin') && v > 0 && Object.keys(p.storage).length < STORE_SLOTS) p.storage[k] = Math.min(v, 999999); }
      RPG.fromSave(p, save, ITEMS);
      if (save && save.equip && typeof save.equip === 'object') {
        for (const slot of ['weapon', 'off', 'armor', 'ammo']) {
          const k = save.equip[slot];
          if (typeof k === 'string' && ITEMS[k] && (ITEMS[k].slot === slot || (slot === 'off' && ITEMS[k].wt === 'sword'))) p.equip[slot] = k;
        }
      }
      this.dropIllegalGear(p, true);
      if (save && save.quests && typeof save.quests === 'object') {
        for (const id of Array.isArray(save.quests.done) ? save.quests.done : []) if (QUESTS[id]) p.qdone[id] = 1;
        const act = save.quests.active && typeof save.quests.active === 'object' ? save.quests.active : {};
        for (const id of Object.keys(act)) {
          const q = QUESTS[id], n = Math.floor(Number(act[id]));
          if (q && !p.qdone[id]) p.quests[id] = { n: clamp(Number.isFinite(n) ? n : 0, 0, q.n) };
        }
      }
      this.applyLevel(p); p.hp = p.maxHp; p.mp = p.maxMp;
      this.players.set(p.id, p);
      return p;
    }
    removePlayer(id) { this.players.delete(id); }
    // ถอดอุปกรณ์ที่ใช้ไม่ได้ (เปลี่ยนอาชีพ/รีเซ็ตสเตตัส) กลับเข้ากระเป๋า
    dropIllegalGear(p, quiet) {
      const bad = RPG.illegalGear(p, ITEMS);
      for (const slot of bad) { const k = p.equip[slot]; if (k) { p.inv[k] = (p.inv[k] || 0) + 1; p.equip[slot] = null; } }
      if (bad.length && !quiet) this.note(p, 'ถอดอุปกรณ์ที่ใช้ไม่ได้แล้วเก็บเข้ากระเป๋า');
      return bad.length > 0;
    }
    saveOf(p) {
      const active = {};
      for (const id of Object.keys(p.quests)) active[id] = p.quests[id].n | 0;
      return Object.assign({ lv: p.lv, exp: p.exp, inv: Object.assign({}, p.inv), equip: Object.assign({}, p.equip), quests: { done: Object.keys(p.qdone), active }, home: p.home, seen: Object.keys(p.seen), storage: Object.assign({}, p.storage) }, RPG.toSave(p));
    }
    meMsg(p) {
      const buffs = {};
      for (const id of Object.keys(p.buffs)) buffs[id] = Math.max(0, Math.round(p.buffs[id].until - this.time));
      return {
        t: 'me', lv: p.lv, exp: p.exp, next: p.lv >= LVCAP ? 0 : nextExp(p.lv), hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp, atk: p.atk, def: p.def,
        inv: Object.assign({}, p.inv), equip: Object.assign({}, p.equip),
        home: p.home, storage: Object.assign({}, p.storage), job: p.job, via: p.via || null, fac: p.fac, c4: p.c4 ? 1 : 0, rb: p.rb, orig: p.orig, st: Object.assign({}, p.st), sp: p.sp, skp: p.skp,
        skills: Object.assign({}, p.skills), borrow: p.borrow.slice(), bsl: RPG.bslots(p), buffs,
        atkS: p.atkS, atkD: p.atkD, atkI: p.atkI, crit: Math.round(p.crit * 1000) / 10, dodge: Math.round(p.dodge * 1000) / 10, cdA: Math.round(p.acd * 100) / 100, rng: p.rng, gm: p.gm ? 1 : 0
      };
    }
    tellMe(p) { this.events.push(Object.assign({ _to: p.id }, this.meMsg(p))); }
    note(p, text) { this.events.push({ _to: p.id, t: 'note', text }); }
    emit(zone, ev) { ev._z = zone; this.events.push(ev); }

    // ย้ายผู้เล่นไปอีกแมพ
    moveZone(p, zone, x, y) {
      const old = p.zone;
      this.emit(old, { t: 'leave', id: p.id });
      p.zone = zone; p.x = x; p.y = y; p.path = []; p.moving = false; p.target = null; p.dirty = true; p.warpCd = 1.5;
      p.seen[zone] = 1;
      this.emit(zone, { t: 'join', p: pub(p), _x: p.id });
      this.events.push({
        _to: p.id, t: 'zone', zone, x, y,
        players: this.playersIn(zone).map(pub),
        monsters: this.monsters.filter(m => m.zone === zone).map(pubM), me: this.meMsg(p), seen: Object.keys(p.seen)
      });
    }

    setTarget(id, x, y) {
      const p = this.players.get(id);
      if (!p || p.dead) return false;
      let tx = Math.floor(x), ty = Math.floor(y);
      if (!inb(tx, ty)) return false;
      const m = this.zones[p.zone].map;
      if (m.solid[tx + ty * W]) {
        const n = nearestWalkable(m, tx, ty, 3);
        if (!n) return false;
        tx = n[0]; ty = n[1];
      }
      const path = findPath(m, clamp(Math.floor(p.x), 0, W - 1), clamp(Math.floor(p.y), 0, H - 1), tx, ty);
      if (!path) return false;
      p.target = null;
      p.path = path.length > 1 ? path.slice(1) : [[tx, ty]];
      p.moving = true; p.dirty = true;
      return true;
    }
    setAttack(id, mid) {
      const p = this.players.get(id), m = this.monById.get(mid);
      if (!p || p.dead || !m || m.state === 'dead' || m.zone !== p.zone) return false;
      p.target = mid; p.repath = 0;
      return true;
    }
    useItem(id, item) {
      const p = this.players.get(id), it = ITEMS[item];
      if (!p || p.dead || !it || !(it.heal || it.mp) || !(p.inv[item] > 0)) return false;
      if (it.heal ? p.hp >= p.maxHp : p.mp >= p.maxMp) return false;
      p.inv[item]--; if (p.inv[item] <= 0) delete p.inv[item];
      if (it.heal) { p.hp = Math.min(p.maxHp, p.hp + it.heal); this.emit(p.zone, { t: 'heal', id: p.id, amt: it.heal, hp: p.hp }); }
      else { p.mp = Math.min(p.maxMp, p.mp + it.mp); this.emit(p.zone, { t: 'heal', id: p.id, amt: it.mp, hp: p.hp, mp: 1 }); }
      this.tellMe(p);
      return true;
    }
    equip(id, item) {
      const p = this.players.get(id), it = ITEMS[item];
      if (!p || p.dead || !it || !it.slot || !(p.inv[item] > 0)) return false;
      const why = RPG.reqCheck(p, it);
      if (why) { this.note(p, 'ใส่ ' + it.name + ' ไม่ได้: ' + why); return false; }
      const slot = it.slot;
      if (slot === 'ammo') {
        p.equip.ammo = p.equip.ammo === item ? null : item;
      } else {
        const wpn = ITEMS[p.equip.weapon];
        if (slot === 'weapon' && p.job === 'Solo Player' && it.wt === 'sword' && wpn && wpn.wt === 'sword' && !p.equip.off) {
          p.inv[item]--; if (p.inv[item] <= 0) delete p.inv[item];
          p.equip.off = item; this.note(p, 'ถือดาบคู่! (ดาบมือซ้าย: ' + it.name + ')');
          this.applyLevel(p);
          this.emit(p.zone, { t: 'eq', id: p.id, eq: Object.assign({}, p.equip) });
          this.tellMe(p);
          return true;
        }
        if (slot === 'off' && wpn && wpn.two) { this.note(p, 'ถืออาวุธสองมืออยู่ ใส่ของมืออีกข้างไม่ได้'); return false; }
        const old = p.equip[slot];
        p.inv[item]--; if (p.inv[item] <= 0) delete p.inv[item];
        if (old) p.inv[old] = (p.inv[old] || 0) + 1;
        p.equip[slot] = item;
        if (slot === 'weapon' && it.two && p.equip.off) { const o = p.equip.off; p.inv[o] = (p.inv[o] || 0) + 1; p.equip.off = null; this.note(p, 'ถอด ' + ITEMS[o].name + ' เพราะอาวุธนี้ถือสองมือ'); }
      }
      this.applyLevel(p);
      this.emit(p.zone, { t: 'eq', id: p.id, eq: Object.assign({}, p.equip) });
      this.tellMe(p);
      return true;
    }
    unequip(id, slot) {
      const p = this.players.get(id);
      if (!p || p.dead || ['weapon', 'off', 'armor', 'ammo'].indexOf(slot) < 0 || !p.equip[slot]) return false;
      const k = p.equip[slot]; p.equip[slot] = null;
      if (slot !== 'ammo') p.inv[k] = (p.inv[k] || 0) + 1;
      this.applyLevel(p);
      this.emit(p.zone, { t: 'eq', id: p.id, eq: Object.assign({}, p.equip) });
      this.tellMe(p);
      return true;
    }

    /* ---- สกิล ---- */
    resolveSkill(p, sid) {   // → { sk, lvl } | null (แจ้งเหตุผลให้ผู้เล่น)
      let sk, lvl;
      if (/^b[0-4]$/.test(sid)) {
        const i = +sid[1], bid = p.borrow[i];
        if (i >= RPG.bslots(p) || !bid) { this.note(p, 'ช่องยืมสกิลนี้ยังว่างอยู่'); return null; }
        sk = SKILLS[bid]; lvl = RPG.borrowLv(p);
      } else {
        sk = SKILLS[sid];
        if (!sk) return null;
        lvl = RPG.skillLevel(p, sid);
        if (!lvl) { this.note(p, 'ยังไม่ได้เรียนสกิล ' + sk.name); return null; }
        const lock = RPG.skillLock(p, sk);
        if (lock) { this.note(p, sk.name + ': ' + lock); return null; }
      }
      return { sk, lvl };
    }
    nearestMonster(p, r) {
      let best = null, bd = r;
      for (const m of this.monsters) {
        if (m.zone !== p.zone || m.state === 'dead') continue;
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < bd) { bd = d; best = m; }
      }
      return best;
    }
    ammoOk(p, quiet) {   // อาวุธที่ต้องใช้กระสุน/ลูกธนู
      if (!p.ammoKind) return true;
      const a = ITEMS[p.equip.ammo];
      if (a && a.kind === p.ammoKind && (p.inv[p.equip.ammo] | 0) > 0) return true;
      if (!quiet || this.time - p.ammoWarn > 4) { p.ammoWarn = this.time; this.note(p, p.ammoKind === 'arrow' ? 'ไม่มีลูกธนู — ซื้อที่ร้านอาวุธแล้วสวมใส่ในช่องกระสุน' : 'ไม่มีกระสุน — ซื้อที่ร้านอาวุธแล้วสวมใส่ในช่องกระสุน'); }
      return false;
    }
    useAmmo(p) {
      if (!p.ammoKind) return;
      const k = p.equip.ammo;
      p.inv[k] = (p.inv[k] | 0) - 1;
      if (p.inv[k] <= 0) { delete p.inv[k]; p.equip.ammo = null; this.note(p, 'ลูกธนู/กระสุนหมดแล้ว'); this.applyLevel(p); this.emit(p.zone, { t: 'eq', id: p.id, eq: Object.assign({}, p.equip) }); }
    }
    skillRange(sk) { return sk.rng > 0 ? sk.rng : MELEE + 0.4; }
    useSkill(id, sid) {
      const p = this.players.get(id);
      if (!p || p.dead) return false;
      const r = this.resolveSkill(p, sid);
      if (!r) return false;
      const sk = r.sk, e = RPG.skillEff(sk, r.lvl, p.rb, p.fac);
      if (sk.k === 'P') { this.note(p, sk.name + ' เป็นสกิลติดตัว ไม่ต้องกดใช้'); return false; }
      if ((p.cd[sid] || 0) > this.time) return false;
      if (p.mp < e.mp) { this.note(p, 'MP ไม่พอ (ต้องใช้ ' + e.mp + ')'); return false; }
      const needT = sk.k === 'A' || sk.k === 'R' || sk.k === 'Z' || sk.k === 'T' || sk.k === 'Y';
      if (needT) {
        let m = this.monById.get(p.target);
        if (!m || m.state === 'dead' || m.zone !== p.zone) { m = this.nearestMonster(p, 14); if (!m) { this.note(p, 'ไม่มีมอนสเตอร์ใกล้ ๆ'); return false; } p.target = m.id; }
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d > this.skillRange(sk) + 0.3) { p.pend = sid; p.repath = 0; return true; }   // วิ่งเข้าไปก่อน แล้วค่อยร่าย (chase เป็นคนเรียกซ้ำ)
        return this.castSkill(p, sid, sk, r.lvl, e, m);
      }
      return this.castSkill(p, sid, sk, r.lvl, e, null);
    }
    castSkill(p, sid, sk, lvl, e, m) {
      const k = sk.k, hitList = [];
      if (sk.k === 'R' || sk.k === 'T' || sk.k === 'Y') { if (!this.ammoOk(p)) return false; }
      if (k === 'A' || k === 'R' || k === 'Z') {
        p.dir = dirOf(m.x - p.x, m.y - p.y); hitList.push(m);
      } else if (k === 'B' || k === 'X') {
        for (const q of this.monsters) if (q.zone === p.zone && q.state !== 'dead' && Math.hypot(q.x - p.x, q.y - p.y) <= e.radius) hitList.push(q);
        if (!hitList.length) { this.note(p, 'ไม่มีศัตรูอยู่รอบตัว'); p.pend = null; return false; }
      } else if (k === 'T' || k === 'Y') {
        for (const q of this.monsters) if (q.zone === p.zone && q.state !== 'dead' && Math.hypot(q.x - m.x, q.y - m.y) <= e.radius) hitList.push(q);
        p.dir = dirOf(m.x - p.x, m.y - p.y);
      } else if (k === 'U' || k === 'D') {
        p.buffs[sid] = Object.assign({ until: this.time + e.dur }, e.buff);
      } else if (k === 'H') {
        const who = [];
        for (const q of this.players.values()) if (q.zone === p.zone && !q.dead && Math.hypot(q.x - p.x, q.y - p.y) <= e.radius && q.hp < q.maxHp) who.push(q);
        if (!who.length) { this.note(p, 'เลือดเต็มอยู่แล้ว'); p.pend = null; return false; }
        for (const q of who) {
          const amt = Math.round(q.maxHp * e.heal * p.healMul);
          q.hp = Math.min(q.maxHp, q.hp + amt);
          this.emit(p.zone, { t: 'heal', id: q.id, amt, hp: q.hp });
          if (q !== p) this.tellMe(q);
        }
      }
      p.mp -= e.mp; p.cd[sid] = this.time + e.cd; p.pend = null;
      if (sk.k === 'R' || sk.k === 'T' || sk.k === 'Y') this.useAmmo(p);
      this.emit(p.zone, { t: 'sk', id: p.id, s: sid, k, job: sk.job, tx: m ? m.x : p.x, ty: m ? m.y : p.y, r: e.radius || 0 });
      for (const q of hitList) this.playerHit(p, q, e.mult, sk.sty);
      this.events.push({ _to: p.id, t: 'skillcd', id: sid, cd: e.cd });
      if (k === 'U' || k === 'D') this.applyLevel(p);
      this.tellMe(p);
      return true;
    }

    /* ---- สเตตัส / สกิล / อาชีพ ---- */
    statUp(id, k, n) {
      const p = this.players.get(id);
      if (!p || p.dead || RPG.STATS.indexOf(k) < 0) return false;
      n = clamp(Math.floor(Number(n)) || 1, 1, 10);
      let done = 0;
      for (let i = 0; i < n; i++) {
        const v = p.st[k], c = RPG.statCost(v);
        if (v >= RPG.MAX_STAT || p.sp < c) break;
        p.st[k]++; p.sp -= c; done++;
      }
      if (!done) { this.note(p, p.st[k] >= RPG.MAX_STAT ? 'สเตตัสนี้เต็มแล้ว' : 'แต้มสเตตัสไม่พอ'); return false; }
      this.applyLevel(p); this.tellMe(p);
      return true;
    }
    skillUp(id, sid) {
      const p = this.players.get(id), sk = SKILLS[sid];
      if (!p || p.dead || !sk) return false;
      const why = RPG.skillCanUp(p, sk);
      if (why) { this.note(p, why); return false; }
      p.skills[sid] = (p.skills[sid] | 0) + 1; p.skp -= sk.cost;
      this.applyLevel(p); this.tellMe(p);
      this.note(p, sk.name + ' → Lv ' + p.skills[sid]);
      return true;
    }
    changeJob(p, job, via) {
      const was = p.job;
      p.via = RPG.ALT[job] ? RPG.viaOf(job, via || (RPG.JOBS[was] && RPG.ALT[job].indexOf(was) >= 0 ? was : null)) : null;
      p.job = job; p.c4 = false;
      if (job === 'Solo Player') { p.fac = null; p.borrow = RPG.emptyBorrow(); this.grantRand(p); }
      this.dropIllegalGear(p);
      this.applyLevel(p);
      this.emit(p.zone, { t: 'job', id: p.id, job: p.job, fac: p.fac });
      this.tellMe(p);
    }
    grantRand(p) {
      const got = RPG.fillRand(p);
      for (const id of got) this.note(p, 'ได้รับสกิลสุ่ม: ' + SKILLS[id].name + ' (' + SKILLS[id].job + ')');
      return got.length;
    }
    advance(id, what, arg) {
      const p = this.players.get(id);
      if (!p || p.dead) return false;
      const a = RPG.advInfo(p);
      if (!a.ok) { this.note(p, 'ยังเลื่อนขั้นไม่ได้: ' + (a.need || 'ไม่มีขั้นถัดไป')); return false; }
      if (what === 'job' && a.kind === 'job' && a.jobs.indexOf(arg) >= 0) {
        if (arg !== 'Solo Player' && !p.gm && !p.qdone[WORLD.jobQuestId(arg, 0)]) { this.note(p, 'ต้องทำเควสต์เปลี่ยนอาชีพของ ' + arg + ' ให้สำเร็จก่อน — ดูในจดหมายนกพิราบ'); return false; }
        this.changeJob(p, arg, p.job); this.note(p, 'เลื่อนอาชีพเป็น ' + arg + '!');
        this.events.push({ t: 'advd', id: p.id, name: p.name, job: arg });
        return true;
      }
      if (what === 'fac' && a.kind === 'fac' && (arg === 'd' || arg === 'a')) {
        p.fac = arg; this.applyLevel(p);
        this.emit(p.zone, { t: 'job', id: p.id, job: p.job, fac: p.fac });
        this.note(p, arg === 'd' ? 'เลือกฝ่าย Dharma แล้ว' : 'เลือกฝ่าย Adharma แล้ว'); this.tellMe(p);
        return true;
      }
      if (what === 'c4' && a.kind === 'c4') {
        if (!p.gm && !p.qdone[WORLD.jobQuestId(p.job, 1)]) { this.note(p, 'ต้องทำเควสต์คลาส 4 ของ ' + p.job + ' ให้สำเร็จก่อน — ดูในจดหมายนกพิราบ'); return false; }
        p.c4 = true; this.applyLevel(p); this.tellMe(p);
        this.events.push({ t: 'advd', id: p.id, name: p.name, job: p.job, c4: 1 });
        this.note(p, 'เลื่อนเป็นคลาส 4! ปลดล็อกสกิลไม้ตายแล้ว');
        return true;
      }
      if (what === 'rebirth' && a.kind === 'rebirth') return this.rebirth(p, arg !== 'new');
      return false;
    }
    rebirth(p, keep) {
      const C = RPG.REBIRTH_COST;
      for (const k of Object.keys(C)) if ((p.inv[k] || 0) < C[k]) { this.note(p, 'เควสต์เกิดใหม่ต้องใช้: ก้อนวุ้นไผ่ ×' + C.jelly + ' เขี้ยวหมูป่า ×' + C.tusk + ' เหรียญ ' + C.coin); return false; }
      for (const k of Object.keys(C)) { p.inv[k] -= C[k]; if (p.inv[k] <= 0) delete p.inv[k]; }
      p.orig = p.orig || (p.job !== 'Adventurer' ? p.job : null);
      p.rb = Math.min(9, p.rb + 1);
      for (const k of Object.keys(p.qdone)) if (k.indexOf('jq') === 0) delete p.qdone[k];
      for (const k of Object.keys(p.quests)) if (k.indexOf('jq') === 0) delete p.quests[k];
      p.lv = 1; p.exp = 0; p.st = RPG.newStats(); p.skills = {}; p.borrow = RPG.emptyBorrow(); p.buffs = {}; p.c4 = false; p.pend = null;
      if (!keep) { p.job = 'Adventurer'; p.fac = null; }
      RPG.recalcPoints(p); this.dropIllegalGear(p, true); this.applyLevel(p); p.hp = p.maxHp; p.mp = p.maxMp;
      this.emit(p.zone, { t: 'job', id: p.id, job: p.job, fac: p.fac });
      this.events.push({ t: 'advd', id: p.id, name: p.name, job: p.job, rb: p.rb });
      this.note(p, 'เกิดใหม่ครั้งที่ ' + p.rb + '! กลับเป็น Lv 1 แต่สกิลแรงขึ้น');
      this.tellMe(p); this.tellQuests(p);
      return true;
    }
    resetPoints(id, what) {
      const p = this.players.get(id);
      if (!p || p.dead) return false;
      const cost = RPG.resetCost(p);
      if ((p.inv.coin || 0) < cost) { this.note(p, 'ต้องใช้ ' + cost + ' เหรียญในการรีเซ็ต'); return false; }
      if (cost) { p.inv.coin -= cost; if (p.inv.coin <= 0) delete p.inv.coin; }
      if (what === 'stats') p.st = RPG.newStats(); else { p.skills = {}; if (p.job !== 'Solo Player') p.borrow = RPG.emptyBorrow(); p.buffs = {}; }
      RPG.recalcPoints(p); this.dropIllegalGear(p); this.applyLevel(p);
      this.note(p, 'รีเซ็ต' + (what === 'stats' ? 'สเตตัส' : 'สกิล') + 'แล้ว' + (cost ? ' (-' + cost + ' เหรียญ)' : ' (ฟรี จนกว่าจะเปลี่ยนคลาส 2)'));
      this.tellMe(p);
      return true;
    }
    setBorrow(id, slot, sid) {
      const p = this.players.get(id);
      slot = Math.floor(Number(slot));
      if (!p || p.dead || p.job !== 'Adventurer' || !(slot >= 0 && slot < RPG.bslots(p))) return false;
      if (sid && RPG.ACTIVE_IDS().indexOf(sid) < 0) return false;
      p.borrow[slot] = sid || null; this.tellMe(p);
      return true;
    }
    gm(id, cmd, v) {
      const p = this.players.get(id);
      if (!p || !p.gm) return false;
      if (cmd === 'lv') { p.lv = clamp(Math.floor(Number(v)) || 1, 1, LVCAP); p.exp = 0; }
      else if (cmd === 'job' && RPG.JOBS[v]) { p.job = v; p.via = RPG.ALT[v] ? RPG.ALT[v][0] : null; p.c4 = false; if (v === 'Solo Player') p.borrow = RPG.emptyBorrow(); if (RPG.JOBS[v].tier >= 1 && !p.fac) p.fac = 'd'; if (RPG.JOBS[v].tier < 1) p.fac = null; }
      else if (cmd === 'via' && RPG.ALT[p.job] && RPG.ALT[p.job].indexOf(v) >= 0) p.via = v;
      else if (cmd === 'fac' && (v === 'd' || v === 'a')) p.fac = v;
      else if (cmd === 'c4') { if (p.job !== 'Adventurer') p.c4 = true; }
      else if (cmd === 'rb') { p.rb = clamp(Math.floor(Number(v)) || 0, 0, 9); p.orig = p.job; }
      else if (cmd === 'give' && v && ITEMS[v.item]) { p.inv[v.item] = Math.min(99999, (p.inv[v.item] || 0) + clamp(Math.floor(Number(v.n)) || 1, 1, 9999)); }
      else if (cmd === 'zone' && ZONES.indexOf(v) >= 0) { const f = this.arrival(v); this.moveZone(p, v, f[0], f[1]); }
      else if (cmd === 'coin') p.inv.coin = Math.min(99999, (p.inv.coin || 0) + 20000);
      else if (cmd === 'heal') { p.hp = p.maxHp; p.mp = p.maxMp; }
      else return false;
      RPG.recalcPoints(p); this.dropIllegalGear(p, true); this.applyLevel(p); this.grantRand(p);
      if (cmd === 'heal' || cmd === 'lv' || cmd === 'job') { p.hp = p.maxHp; p.mp = p.maxMp; }
      this.emit(p.zone, { t: 'job', id: p.id, job: p.job, fac: p.fac });
      this.emit(p.zone, { t: 'eq', id: p.id, eq: Object.assign({}, p.equip) });
      this.tellMe(p); this.tellQuests(p);
      return true;
    }
    arrival(zone) {   // จุดลงของโซน: เมือง = จุดเกิด, แมพล่ามอน = หน้าประตูแรก
      if (TOWNS.indexOf(zone) >= 0) { const s = this.pickSpawn(zone); return [s[0] + 0.5, s[1] + 0.5]; }
      return WORLD.frontOf(zone, WORLD.EXITS[zone][0].side);
    }
    travel(id, to) {   // เดินทางด่วนระหว่างเมืองที่เคยไปแล้ว (เสียเหรียญ)
      const p = this.players.get(id);
      if (!p || p.dead || TOWNS.indexOf(p.zone) < 0 || TOWNS.indexOf(to) < 0 || to === p.zone) return false;
      if (!p.seen[to]) { this.note(p, 'ยังไม่เคยไปเมืองนี้ — ต้องเดินไปให้ถึงก่อนครั้งหนึ่ง'); return false; }
      const cost = WORLD.travelCost(p.lv);
      if ((p.inv.coin || 0) < cost) { this.note(p, 'ค่าเดินทางด่วน ' + cost + ' เหรียญ — เหรียญไม่พอ'); return false; }
      p.inv.coin -= cost; if (p.inv.coin <= 0) delete p.inv.coin;
      const f = this.arrival(to); this.moveZone(p, to, f[0], f[1]);
      this.note(p, 'เดินทางไป ' + WORLD.ZD[to].n + ' (-' + cost + ' เหรียญ)');
      return true;
    }
    store(id, item, n, dir) {   // คาฟร่า: ฝาก/ถอนของจากคลัง
      const p = this.players.get(id);
      if (!p || p.dead || !this.nearNpc(p, 'kf_' + p.zone, 4)) { if (p) this.note(p, 'เดินเข้าไปใกล้คาฟร่าก่อนนะ'); return false; }
      if (!ITEMS[item] && item !== 'coin') return false;
      n = clamp(Math.floor(Number(n)) || 1, 1, 999999);
      const from = dir === 'out' ? p.storage : p.inv, to = dir === 'out' ? p.inv : p.storage;
      if (!(from[item] > 0)) return false;
      n = Math.min(n, from[item]);
      if (dir !== 'out' && !(to[item] > 0) && Object.keys(to).length >= STORE_SLOTS) { this.note(p, 'คลังเต็มแล้ว (สูงสุด ' + STORE_SLOTS + ' ชนิด)'); return false; }
      from[item] -= n; if (from[item] <= 0) delete from[item];
      to[item] = Math.min((to[item] || 0) + n, 999999);
      p.dirty = true; this.tellMe(p); this.tellQuests(p);
      return true;
    }
    savePoint(id) {   // คาฟร่า: บันทึกจุดเกิด (ตายแล้วฟื้นที่นี่)
      const p = this.players.get(id);
      if (!p || p.dead || TOWNS.indexOf(p.zone) < 0 || !this.nearNpc(p, 'kf_' + p.zone, 4)) { if (p) this.note(p, 'เดินเข้าไปใกล้คาฟร่าก่อนนะ'); return false; }
      p.home = p.zone; p.dirty = true; this.note(p, 'บันทึกจุดเกิดที่ ' + WORLD.ZD[p.zone].n + ' แล้ว'); this.tellMe(p);
      return true;
    }
    nearNpc(p, npcId, r) {
      const n = this.zones[p.zone].map.npcs.find(q => q.id === npcId);
      return !!n && Math.hypot(n.x + 0.5 - p.x, n.y + 0.5 - p.y) <= (r || 6);
    }
    buy(id, shop, item, n) {
      const p = this.players.get(id), it = ITEMS[item], sh = SHOPS[shop];
      if (!p || p.dead || !it || !sh || !it.buy || sh.buy.indexOf(item) < 0) return false;
      if (!this.nearNpc(p, sh.npc)) { this.note(p, 'เดินเข้าไปใกล้ร้านค้าก่อนนะ'); return false; }
      n = it.slot && it.slot !== 'ammo' ? 1 : clamp(Math.floor(Number(n)) || 1, 1, it.slot === 'ammo' ? 99 : 20);
      const cost = it.buy * n;
      if ((p.inv.coin || 0) < cost) { this.note(p, 'เหรียญไม่พอ (ต้องใช้ ' + cost + ')'); return false; }
      p.inv.coin -= cost; if (p.inv.coin <= 0) delete p.inv.coin;
      p.inv[item] = (p.inv[item] || 0) + n;
      this.note(p, 'ซื้อ ' + it.name + ' ×' + n + ' (-' + cost + ' เหรียญ)');
      this.tellMe(p); this.tellQuests(p);
      return true;
    }
    sell(id, shop, item, n) {
      const p = this.players.get(id), it = ITEMS[item], sh = SHOPS[shop];
      if (!p || p.dead || !it || !sh || !it.sell || !!it.slot !== sh.sellSlot) return false;
      if (!this.nearNpc(p, sh.npc)) { this.note(p, 'เดินเข้าไปใกล้ร้านค้าก่อนนะ'); return false; }
      const have = p.inv[item] || 0;
      if (have <= 0) return false;
      n = Math.floor(Number(n));
      if (!Number.isFinite(n) || n < 0) n = 1;
      n = n === 0 ? have : Math.min(n, have);   // 0 = ขายทั้งหมด
      p.inv[item] = have - n; if (p.inv[item] <= 0) delete p.inv[item];
      const gain = it.sell * n;
      p.inv.coin = Math.min(99999, (p.inv.coin || 0) + gain);
      this.note(p, 'ขาย ' + it.name + ' ×' + n + ' (+' + gain + ' เหรียญ)');
      this.tellMe(p); this.tellQuests(p);
      return true;
    }

    /* ---- เควสต์ ---- */
    questList(p) {
      const out = [];
      for (const id of Object.keys(QUESTS)) {
        const q = QUESTS[id];
        if (p.qdone[id]) continue;
        const act = p.quests[id];
        if (act) {
          const n = q.collect ? Math.min(q.n, p.inv[q.collect] || 0) : act.n;
          out.push({ id, st: n >= q.n ? 'ready' : 'active', n });
        } else if (p.lv >= q.minLv && (!q.prereq || p.qdone[q.prereq]) && this.jqOk(p, q)) out.push({ id, st: 'avail', n: 0 });
      }
      return out;
    }
    jqOk(p, q) {   // เควสต์เปลี่ยนอาชีพ: เห็นเฉพาะคนที่อยู่ในขั้นที่ถูกต้อง
      if (!q.job) return true;
      if (q.job.c4) return p.job === q.job.to && !p.c4;
      if (q.from.indexOf(p.job) < 0) return false;
      return !q.fac || !!p.fac;
    }
    tellQuests(p) { this.events.push({ _to: p.id, t: 'quests', list: this.questList(p), done: Object.keys(p.qdone) }); }
    acceptQuest(id, qid) {
      const p = this.players.get(id), q = QUESTS[qid];
      if (!p || p.dead || !q || p.quests[qid] || p.qdone[qid] || p.lv < q.minLv || (q.prereq && !p.qdone[q.prereq]) || !this.jqOk(p, q)) return false;
      if (!this.nearNpc(p, q.giver)) { this.note(p, 'เดินเข้าไปใกล้ผู้ให้เควสต์ก่อนนะ'); return false; }
      p.quests[qid] = { n: 0 };
      this.note(p, 'รับเควสต์: ' + q.title);
      this.tellQuests(p);
      return true;
    }
    turnIn(id, qid) {
      const p = this.players.get(id), q = QUESTS[qid];
      if (!p || p.dead || !q || !p.quests[qid]) return false;
      const cur = this.questList(p).find(x => x.id === qid);
      if (!cur || cur.st !== 'ready') return false;
      if (!this.nearNpc(p, q.giver)) { this.note(p, 'เดินเข้าไปใกล้ผู้ให้เควสต์ก่อนนะ'); return false; }
      if (q.collect) { p.inv[q.collect] -= q.n; if (p.inv[q.collect] <= 0) delete p.inv[q.collect]; }
      for (const k of Object.keys(q.rewards.items)) {
        p.inv[k] = Math.min(99999, (p.inv[k] || 0) + q.rewards.items[k]);
      }
      delete p.quests[qid]; p.qdone[qid] = 1;
      this.giveExp(p, q.rewards.exp);
      this.note(p, 'เควสต์สำเร็จ: ' + q.title);
      this.events.push({ _to: p.id, t: 'qdone', id: qid });
      this.tellMe(p); this.tellQuests(p);
      return true;
    }
    questKill(p, type) {
      let changed = false;
      for (const id of Object.keys(p.quests)) {
        const q = QUESTS[id];
        if (q.kill === type && p.quests[id].n < q.n) { p.quests[id].n++; changed = true; }
      }
      if (changed) this.tellQuests(p);
    }

    step(dt) {
      this.time += dt;
      for (const p of this.players.values()) this.stepPlayer(p, dt);
      for (const m of this.monsters) this.stepMonster(m, dt);
      this.npcTimer -= dt;
      if (this.npcTimer <= 0) {
        this.npcTimer = 9 + Math.random() * 12;
        for (const zn of ZONES) {
          const ns = this.zones[zn].map.npcs;
          if (!ns.length || !this.playersIn(zn).length || Math.random() < 0.4) continue;
          const n = ns[Math.floor(Math.random() * ns.length)];
          const text = n.lines[Math.floor(Math.random() * n.lines.length)];
          this.emit(zn, { t: 'chat', id: n.id, name: n.name, text, npc: 1 });
        }
      }
    }
    stepPlayer(p, dt) {
      p.atkCd = Math.max(0, p.atkCd - dt);
      p.warpCd = Math.max(0, p.warpCd - dt);
      if (p.dead) { p.respawn -= dt; if (p.respawn <= 0) this.revive(p); return; }
      p.buffT += dt;
      if (p.buffT >= 1) {
        p.buffT = 0;
        let ex = false;
        for (const id of Object.keys(p.buffs)) if (p.buffs[id].until <= this.time) { delete p.buffs[id]; ex = true; }
        if (ex) { this.applyLevel(p); this.tellMe(p); }
      }
      const wasMoving = p.moving, od = p.dir;
      if (p.target) this.chase(p); else p.pend = null;
      const moved = p.path.length ? advance(p, SPEED * (p.spdMul || 1), dt) : false;
      p.moving = p.path.length > 0;
      if (moved || wasMoving !== p.moving || od !== p.dir) p.dirty = true;
      if (p.warpCd <= 0) {
        for (const pt of this.zones[p.zone].map.portals) {
          if (p.x >= pt.x && p.x < pt.x + pt.w && p.y >= pt.y && p.y < pt.y + pt.h) { this.moveZone(p, pt.to, pt.tx, pt.ty); return; }
        }
      }
      if (p.mp < p.maxMp) {
        p.mpT += dt;
        if (p.mpT >= 1) { p.mpT = 0; p.mp = Math.min(p.maxMp, p.mp + Math.max(1, Math.round(p.maxMp * 0.04))); this.tellMe(p); }
      }
      if (p.hp < p.maxHp && this.time - p.lastCombat > 5) {
        p.regenT += dt;
        if (p.regenT >= 1) {
          p.regenT = 0;
          p.hp = Math.min(p.maxHp, p.hp + Math.max(1, Math.round(p.maxHp * 0.03)));
          this.tellMe(p);
        }
      }
    }
    chase(p) {
      const m = this.monById.get(p.target);
      if (!m || m.state === 'dead' || m.zone !== p.zone) { p.target = null; p.pend = null; return; }
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      let range = p.rng;
      const pk = p.pend && SKILLS[p.pend] ? SKILLS[p.pend] : (p.pend && /^b[0-4]$/.test(p.pend) && SKILLS[p.borrow[+p.pend[1]]]) || null;
      if (p.pend && pk) range = this.skillRange(pk);
      if (d <= range) {
        p.path = [];
        p.dir = dirOf(m.x - p.x, m.y - p.y);
        if (p.pend) { const sid = p.pend; p.pend = null; this.useSkill(p.id, sid); }
        else if (p.atkCd <= 0) {
          if (!this.ammoOk(p, true)) { p.target = null; return; }
          this.playerHit(p, m);
        }
      } else {
        p.repath -= 1 / 20;
        if (p.repath <= 0 || !p.path.length) {
          p.repath = 0.35;
          const path = findPath(this.zones[p.zone].map, Math.floor(p.x), Math.floor(p.y), Math.floor(m.x), Math.floor(m.y));
          if (path) p.path = path.length > 1 ? path.slice(1) : [];
          else { p.target = null; p.pend = null; p.path = []; }
        }
      }
    }
    playerHit(p, m, mult, sty) {
      const D = MON[m.type];
      const crit = Math.random() < p.crit;
      const basic = !mult;
      const base = (sty || p.sty) === 'd' ? p.atkD : (sty || p.sty) === 'i' ? p.atkI : p.atkS;
      let dmg = Math.round(base * (mult || 1) * (0.85 + Math.random() * 0.3));
      if (crit) dmg = Math.round(dmg * 1.6);
      dmg = Math.max(1, dmg);
      m.hp = Math.max(0, m.hp - dmg);
      if (basic) {
        p.atkCd = p.acd;
        if (p.rng > 2.5) { this.emit(m.zone, { t: 'shot', id: p.id, to: m.id, w: (ITEMS[p.equip.weapon] || {}).wt || '' }); this.useAmmo(p); }
      }
      p.lastCombat = this.time;
      if (m.state !== 'chase') { m.state = 'chase'; m.path = []; m.repath = 0; }
      m.target = p.id; m.dirty = true;
      this.emit(m.zone, { t: 'hit', id: m.id, dmg, crit: crit ? 1 : 0, hp: m.hp, from: p.id });
      if (m.hp <= 0) this.killMonster(m, p, D);
    }
    killMonster(m, p, D) {
      m.state = 'dead'; m.hp = 0; m.path = []; m.moving = false; m.target = null; m.respawn = D.respawn; m.dirty = true;
      p.target = null;
      this.emit(m.zone, { t: 'mdie', id: m.id });
      const gained = {};
      for (const d of D.drops) {
        if (Math.random() >= d[1]) continue;
        if (d[0] === '@gear') {
          const list = GEAR[Math.min(4, d[2][0])]; if (!list || !list.length) continue;
          const gid = list[Math.floor(Math.random() * list.length)]; p.inv[gid] = (p.inv[gid] || 0) + 1; gained[gid] = 1; continue;
        }
        const n = rnd(d[2][0], d[2][1]); p.inv[d[0]] = Math.min(99999, (p.inv[d[0]] || 0) + n); gained[d[0]] = n;
      }
      this.events.push({ _to: p.id, t: 'loot', exp: D.exp, items: gained });
      this.giveExp(p, D.exp);
      this.questKill(p, m.type);
      this.tellMe(p);
      if (Object.keys(p.quests).length) this.tellQuests(p);
    }
    giveExp(p, n) {
      if (p.lv >= LVCAP) return;
      p.exp += n;
      let up = false;
      while (p.lv < LVCAP && p.exp >= nextExp(p.lv)) {
        p.exp -= nextExp(p.lv); p.lv++; up = true;
        this.events.push({ t: 'lvup', id: p.id, lv: p.lv, name: p.name });
      }
      if (p.lv >= LVCAP) p.exp = 0;
      if (up) {
        RPG.recalcPoints(p); this.applyLevel(p); p.hp = p.maxHp; p.mp = p.maxMp;
        this.grantRand(p);
        this.tellQuests(p);
        if (p.sp > 0) this.note(p, 'มีแต้มสเตตัสที่ยังไม่ได้ใช้ ' + p.sp + ' แต้ม');
      }
    }
    stepMonster(m, dt) {
      const D = MON[m.type], map = this.zones[m.zone].map;
      if (m.state === 'dead') {
        m.respawn -= dt;
        if (m.respawn <= 0) {
          m.x = m.hx; m.y = m.hy; m.hp = m.maxHp; m.state = 'idle'; m.path = []; m.moving = false;
          m.target = null; m.wait = 2; m.dirty = true; m.wp = Math.floor(Math.random() * 5);
          this.emit(m.zone, { t: 'mspawn', m: pubM(m) });
        }
        return;
      }
      m.atkCd = Math.max(0, m.atkCd - dt);
      const was = m.moving, od = m.dir;
      let moved = false;
      const tile = (x, y) => [Math.floor(x), Math.floor(y)];
      if (m.state === 'chase') {
        const p = this.players.get(m.target);
        if (!p || p.dead || p.zone !== m.zone || Math.hypot(m.x - m.hx, m.y - m.hy) > LEASH) {
          m.state = 'return'; m.target = null; m.path = []; m.repath = 0;
        } else {
          const d = Math.hypot(p.x - m.x, p.y - m.y);
          if (d <= (D.rg || 1.3)) {
            m.path = []; m.dir = dirOf(p.x - m.x, p.y - m.y);
            if (m.atkCd <= 0) this.monsterHit(m, p, D);
          } else {
            m.repath -= dt;
            if (m.repath <= 0 || !m.path.length) {
              m.repath = 0.5;
              const a = tile(m.x, m.y), b = tile(p.x, p.y);
              const path = findPath(map, a[0], a[1], b[0], b[1]);
              m.path = path && path.length > 1 ? path.slice(1) : [];
            }
            moved = advance(m, D.speed, dt);
          }
        }
      } else if (m.state === 'return') {
        if (!m.path.length) {
          const a = tile(m.x, m.y), b = tile(m.hx, m.hy);
          const path = findPath(map, a[0], a[1], b[0], b[1]);
          m.path = path && path.length > 1 ? path.slice(1) : [];
        }
        moved = advance(m, D.speed * 1.4, dt);
        if (!m.path.length) { m.state = 'idle'; m.hp = m.maxHp; m.wait = 2; m.dirty = true; }
      } else if (m.state === 'wander') {
        moved = advance(m, D.speed * 0.5, dt);
        if (!m.path.length) { m.state = 'idle'; m.wait = 2 + Math.random() * 5; }
      } else {
        m.wait -= dt;
        if (m.wait <= 0) {
          m.wait = 2 + Math.random() * 5;
          const tx = Math.floor(m.hx + Math.random() * 8 - 4), ty = Math.floor(m.hy + Math.random() * 8 - 4);
          if (inb(tx, ty) && !map.solid[ty * W + tx]) {
            const a = tile(m.x, m.y);
            const path = findPath(map, a[0], a[1], tx, ty);
            if (path && path.length > 1) { m.path = path.slice(1); m.state = 'wander'; }
          }
        }
      }
      m.moving = m.path.length > 0;
      if (moved || was !== m.moving || od !== m.dir) m.dirty = true;
    }
    monsterHit(m, p, D) {
      m.atkCd = D.atkCd;
      if (Math.random() < p.dodge) { this.emit(m.zone, { t: 'hit', id: p.id, dmg: 0, miss: 1, hp: p.hp, pl: 1, from: m.id }); return; }
      let mul = 1;
      if (D.sk === 'rs') {   // วิญญาณใช้สกิลของผู้เล่นแบบสุ่ม: ตะโกนชื่อสกิล
        const sk = SKILLS[ACT_SK[Math.floor(Math.random() * ACT_SK.length)]];
        if (sk) { mul = 1.35; this.emit(m.zone, { t: 'mshout', id: m.id, text: sk.name + '!' }); }
      }
      if (D.rg > 2) this.emit(m.zone, { t: 'mshot', id: m.id, to: p.id });
      const dmg = Math.max(1, Math.round(rnd(D.atk[0], D.atk[1]) * mul) - p.def);
      p.hp -= dmg; p.lastCombat = this.time;
      this.emit(m.zone, { t: 'hit', id: p.id, dmg, hp: Math.max(0, p.hp), pl: 1, from: m.id });
      if (p.hp <= 0) this.killPlayer(p); else this.tellMe(p);
    }
    killPlayer(p) {
      p.hp = 0; p.dead = true; p.path = []; p.target = null; p.moving = false; p.respawn = 4; p.dirty = true;
      this.emit(p.zone, { t: 'pdie', id: p.id });
      this.tellMe(p);
    }
    revive(p) {
      const home = p.home || 'village', sp = this.pickSpawn(home);
      p.dead = false; p.hp = p.maxHp; p.mp = p.maxMp; p.path = []; p.moving = false; p.dirty = true;
      if (p.zone !== home) this.moveZone(p, home, sp[0] + 0.5, sp[1] + 0.5);
      else { p.x = sp[0] + 0.5; p.y = sp[1] + 0.5; }
      this.emit(home, { t: 'previve', id: p.id, x: p.x, y: p.y });
      this.tellMe(p);
    }

    // snapshot แยกตามแมพ: { village:{p,m}, field:{p,m} }
    snapshot() {
      const out = {};
      for (const z of ZONES) out[z] = { p: [], m: [] };
      for (const p of this.players.values()) {
        if (!p.dirty) continue;
        out[p.zone].p.push([p.id, Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, p.dir, p.moving ? 1 : 0, p.dead ? 1 : 0]);
        if (!p.moving) p.dirty = false;
      }
      for (const m of this.monsters) {
        if (!m.dirty || m.state === 'dead') continue;
        out[m.zone].m.push([m.id, Math.round(m.x * 100) / 100, Math.round(m.y * 100) / 100, m.dir, m.hp, m.moving ? 1 : 0]);
        if (!m.moving) m.dirty = false;
      }
      return out;
    }
    drainEvents() { const e = this.events; this.events = []; return e; }
  }

  const pub = p => ({ id: p.id, name: p.name, look: p.look, x: p.x, y: p.y, dir: p.dir, m: p.moving ? 1 : 0, lv: p.lv, dead: p.dead ? 1 : 0, eq: Object.assign({}, p.equip), job: p.job, fac: p.fac });
  const pubM = m => ({ id: m.id, type: m.type, wp: m.wp | 0, x: m.x, y: m.y, dir: m.dir, hp: m.hp, maxHp: m.maxHp, dead: m.state === 'dead' ? 1 : 0 });

  /* ------------------------------------------------------------------- hub
   * ตรรกะข้อความทั้งหมดอยู่ตรงนี้ — transport (WebSocket หรือโหมดเดโมในเบราว์เซอร์)
   * แค่ส่งสตริงเข้า hub.message() และรับสตริงกลับผ่านฟังก์ชัน send
   * trustSaves: เปิดเฉพาะโหมดออฟไลน์ (รับเลเวล/ของที่เซฟไว้ในเครื่องผู้เล่น)
   */
  class Hub {
    constructor() {
      this.world = new World(); this.conns = new Set(); this.byPlayer = new Map();
      this.n = 0; this.trustSaves = false;
      this.auth = null;      // (msg) => {key,name,look,save} | null  — เซิร์ฟเวอร์ออนไลน์ใช้ตรวจ token
      this.onLeave = null;   // (conn, save) => void — เซิร์ฟเวอร์ใช้บันทึกตัวละคร
    }
    connect(send) {
      const c = { send, player: null, lastChat: 0, lastMove: 0, lastAct: 0 };
      this.conns.add(c);
      return c;
    }
    // zone: ส่งเฉพาะคนในแมพนั้น (undefined = ทุกคน), exceptId: ข้ามผู้เล่นคนนี้
    bcast(obj, zone, exceptId) {
      const s = JSON.stringify(obj);
      for (const c of this.conns) {
        if (!c.player || c.player.id === exceptId) continue;
        if (zone && c.player.zone !== zone) continue;
        c.send(s);
      }
    }
    message(c, raw) {
      let m = raw;
      if (typeof raw === 'string') {
        if (raw.length > 1024) return;
        try { m = JSON.parse(raw); } catch (e) { return; }
      }
      if (!m || typeof m !== 'object') return;
      const now = Date.now();
      const w = this.world;
      if (m.t === 'join') {
        if (c.player) return;
        if (w.players.size >= MAX_PLAYERS) { c.send(JSON.stringify({ t: 'full' })); return; }
        let jn = m.name, jl = m.look, js = this.trustSaves ? m.save : null;
        if (this.auth) {
          const a = this.auth(m);
          if (!a) { c.send(JSON.stringify({ t: 'authfail' })); return; }
          for (const o of Array.from(this.conns)) if (o !== c && o.acct === a.key) { try { o.send(JSON.stringify({ t: 'kicked' })); } catch (e) {} if (o.kick) o.kick(); else this.drop(o); }
          c.acct = a.key; c.cid = a.cid; jn = a.name; jl = a.look; js = a.save; c.gm = !!a.gm;
        } else if (this.trustSaves && m.gm) c.gm = true;
        const p = w.addPlayer(jn, jl, js);
        p.gm = !!c.gm;
        c.player = p; this.byPlayer.set(p.id, c);
        c.send(JSON.stringify({
          t: 'init', id: p.id, zone: p.zone, phase: w.phase(now), dayMs: DAY_MS,
          players: w.playersIn(p.zone).map(pub),
          monsters: w.monsters.filter(q => q.zone === p.zone).map(pubM), me: w.meMsg(p),
          quests: w.questList(p), qdone: Object.keys(p.qdone), seen: Object.keys(p.seen)
        }));
        this.bcast({ t: 'join', p: pub(p) }, p.zone, p.id);
      } else if (!c.player) {
        return;
      } else if (m.t === 'move') {
        if (now - c.lastMove < 60) return;
        c.lastMove = now;
        const x = Number(m.x), y = Number(m.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        w.setTarget(c.player.id, x, y);
      } else if (m.t === 'attack') {
        if (now - c.lastAct < 100) return;
        c.lastAct = now;
        w.setAttack(c.player.id, String(m.id));
      } else if (m.t === 'use') {
        if (now - c.lastAct < 100) return;
        c.lastAct = now;
        w.useItem(c.player.id, String(m.item));
      } else if (m.t === 'skill') {
        if (now - c.lastAct < 100) return;
        c.lastAct = now;
        w.useSkill(c.player.id, String(m.id));
      } else if (m.t === 'stat' || m.t === 'skillup' || m.t === 'adv' || m.t === 'reset' || m.t === 'borrow' || m.t === 'gm') {
        if (now - c.lastAct < 80) return;
        c.lastAct = now;
        const id = c.player.id;
        if (m.t === 'stat') w.statUp(id, String(m.k), m.n);
        else if (m.t === 'skillup') w.skillUp(id, String(m.id));
        else if (m.t === 'adv') w.advance(id, String(m.w), m.a == null ? '' : String(m.a));
        else if (m.t === 'reset') w.resetPoints(id, m.w === 'stats' ? 'stats' : 'skills');
        else if (m.t === 'borrow') w.setBorrow(id, m.slot, m.id ? String(m.id) : null);
        else if (m.t === 'gm') w.gm(id, String(m.cmd), m.v);
      } else if (m.t === 'store' || m.t === 'savepoint') {
        if (now - c.lastAct < 80) return;
        c.lastAct = now;
        if (m.t === 'store') w.store(c.player.id, String(m.item), m.n, m.dir === 'out' ? 'out' : 'in'); else w.savePoint(c.player.id);
      } else if (m.t === 'travel') {
        if (now - c.lastAct < 300) return;
        c.lastAct = now;
        w.travel(c.player.id, String(m.to));
      } else if (m.t === 'qaccept' || m.t === 'qturnin') {
        if (now - c.lastAct < 100) return;
        c.lastAct = now;
        w[m.t === 'qaccept' ? 'acceptQuest' : 'turnIn'](c.player.id, String(m.id));
      } else if (m.t === 'equip') {
        if (now - c.lastAct < 100) return;
        c.lastAct = now;
        w.equip(c.player.id, String(m.item));
      } else if (m.t === 'unequip') {
        if (now - c.lastAct < 100) return;
        c.lastAct = now;
        w.unequip(c.player.id, String(m.slot));
      } else if (m.t === 'buy' || m.t === 'sell') {
        if (now - c.lastAct < 100) return;
        c.lastAct = now;
        w[m.t](c.player.id, String(m.shop), String(m.item), m.n);
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
        if (this.onLeave) { try { this.onLeave(c, this.world.saveOf(c.player)); } catch (e) {} }
        this.byPlayer.delete(c.player.id);
        this.world.removePlayer(c.player.id);
        this.bcast({ t: 'leave', id: c.player.id }, c.player.zone);
        c.player = null;
      }
    }
    tick(dt) {
      this.world.step(dt);
      for (const ev of this.world.drainEvents()) {
        const to = ev._to, z = ev._z, x = ev._x;
        const o = Object.assign({}, ev); delete o._to; delete o._z; delete o._x;
        if (to !== undefined) {
          const c = this.byPlayer.get(to);
          if (c) c.send(JSON.stringify(o));
        } else this.bcast(o, z, x);
      }
      this.n++;
      if (this.n % 2 === 0) {
        const snap = this.world.snapshot();
        for (const z of ZONES) if (snap[z].p.length || snap[z].m.length) this.bcast({ t: 'snap', p: snap[z].p, m: snap[z].m }, z);
      }
    }
  }

  return {
    W, H, T, SPEED, DAY_MS, START_HOUR, OUTFITS, HAIRS, HAIR_COLORS, MAX_NAME, MAX_CHAT, ITEMS, MON, SHOPS, QUESTS, SKILLS, ZONES, TOWNS, ZONE_LV, WORLD, nextExp,
    buildMap, findPath, nearestWalkable, World, Hub, cleanName, cleanText, cleanLook, rng, RPG, LVCAP
  };
});
