/* rpg.js — ระบบ RPG ของ Chathai Online (ใช้ร่วมกันทั้งเซิร์ฟเวอร์และเบราว์เซอร์)
 * สเตตัส · อาชีพ/คลาส · สกิล · ชนิดอาวุธ/เกราะ/กระสุน · สูตรคำนวณ
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RPG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const STATS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];
  const STAT_TH = { str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };
  const MAX_LV = 99, MAX_STAT = 99;
  const LV = { c1: 10, fac: 30, c2: 35, c3: 60, c4: 80, rebirth: 99, solo: 50 };

  /* ------------------------------------------------------------------ jobs */
  const TREE = [
    ['Swordman', [['Knight', ['Lord Knight', 'War Master']], ['Paladin', ['Warlock', 'Shield Master', 'Shieldfly']], ['Samurai', ['Sword Master', 'Onimusha']]]],
    ['Thief', [['Rogue', ['Shadow Master', 'Bandit Lord']], ['Assassin', ['Supreme Assassin', 'Ninja']], ['Jester', ['Weapon Controller', 'Beast Controller']]]],
    ['Archer', [['Sniper', ['Snimaster', 'Longbowter']], ['Engineer', ['Craftmaster', 'Roboter', 'AI Laser']], ['Animal Master', ['Wolfmaster', 'Eaglemaster']], ['Wildwalker', ['Wildman', 'Masterman']]]],
    ['Magician', [['Wizard', ['High Wizard', 'Galaxy Magic']], ['Sage', ['Sagemaster', 'Elemental']], ['Summoner', ['Summonmonster', 'Darksummon']], ['Magic Sword', ['Lightsaber', 'Flysword']]]],
    ['Acolyte', [['Priest', ['High Priest', 'Dark Priest']], ['Monk', ['Ashura', 'Taekwondo', 'Muay Thai']], ['Assen', ['Ringmaster', 'Biwposter']]]]
  ];
  const JOBS = { Adventurer: { name: 'Adventurer', tier: 0, parent: null, root: 'Adventurer', kids: [] }, 'Solo Player': { name: 'Solo Player', tier: 0, parent: null, root: 'Solo Player', kids: [], special: 1 } };
  for (const [c1, c2s] of TREE) {
    JOBS[c1] = { name: c1, tier: 1, parent: 'Adventurer', root: c1, kids: [] }; JOBS.Adventurer.kids.push(c1);
    for (const [c2, c3s] of c2s) {
      JOBS[c2] = { name: c2, tier: 2, parent: c1, root: c1, kids: [] }; JOBS[c1].kids.push(c2);
      for (const c3 of c3s) { JOBS[c3] = { name: c3, tier: 3, parent: c2, root: c1, kids: [] }; JOBS[c2].kids.push(c3); }
    }
  }
  // อาชีพคลาส 3 ที่มาจากได้สองสาย (via = คลาส 2 ที่มา)
  const ALT = { 'Holy Knight': ['Paladin', 'Priest'], 'Ancient Controller': ['Engineer', 'Summoner'] };
  for (const k of Object.keys(ALT)) {
    JOBS[k] = { name: k, tier: 3, parent: ALT[k][0], root: JOBS[ALT[k][0]].root, kids: [], alt: ALT[k] };
    for (const par of ALT[k]) JOBS[par].kids.push(k);
  }
  const JOB_LIST = Object.keys(JOBS);
  const viaOf = (job, via) => (ALT[job] && ALT[job].indexOf(via) >= 0 ? via : ALT[job] ? ALT[job][0] : null);
  const chain = (job, via) => {
    const out = []; let j = JOBS[job], first = true;
    while (j) { out.unshift(j.name); const par = first && ALT[job] ? viaOf(job, via) : j.parent; first = false; j = par ? JOBS[par] : null; }
    return out;
  };
  const rootOf = p => (ALT[p.job] ? JOBS[viaOf(p.job, p.via)].root : JOBS[p.job].root);
  const LINE_HP = { Adventurer: 1.0, 'Solo Player': 1.15, Swordman: 1.3, Thief: 1.0, Archer: 0.95, Magician: 0.8, Acolyte: 1.05 };
  const LINE_MP = { Adventurer: 1.0, 'Solo Player': 1.0, Swordman: 0.8, Thief: 0.9, Archer: 0.95, Magician: 1.5, Acolyte: 1.35 };

  /* ----------------------------------------------------------- weapon types */
  // h:1/2 = ถือกี่มือ, off = ช่องมืออีกข้าง, sty = สูตรโจมตี (s=STR d=DEX i=INT), st = สเตตัสที่ต้องมี, adv = ต้อง Lv10, jobs = จำกัดอาชีพ
  const WT = {
    sword: { n: 'ดาบ', h: 1, cd: 1.0, rng: 1.6, st: 'str', sty: 's', mul: 1.0 },
    sword2h: { n: 'ดาบสองมือ', h: 2, cd: 1.25, rng: 1.8, st: 'str', sty: 's', mul: 1.5, adv: 1 },
    shield: { n: 'โล่', off: 1, st: 'vit', mul: 0 },
    greatshield: { n: 'โล่ยักษ์', h: 2, cd: 1.3, rng: 1.6, st: 'vit', sty: 's', mul: 0.9, adv: 1, jobs: ['Shield Master'], guard: 1 },
    katana: { n: 'คาตานะ', h: 2, cd: 0.9, rng: 1.8, st: 'str', sty: 's', mul: 1.25, adv: 1, jobs: ['Samurai', 'Sword Master', 'Onimusha'] },
    orbglove: { n: 'ถุงมือลูกแก้ว', off: 1, st: 'int', adv: 1, jobs: ['Onimusha', 'Magic Sword', 'Lightsaber', 'Flysword'] },
    lightsaber: { n: 'ไลท์เซเบอร์', h: 1, cd: 0.85, rng: 2.0, st: 'int', sty: 'i', mul: 1.4, adv: 1, jobs: ['Lightsaber'] },
    dagger: { n: 'มีด', h: 1, cd: 0.8, rng: 1.6, st: 'agi', sty: 'd', mul: 0.8 },
    katar: { n: 'กะตาร์', h: 1, cd: 0.75, rng: 1.6, st: 'agi', sty: 'd', mul: 1.1, adv: 1, jobs: ['Assassin', 'Supreme Assassin', 'Ninja'] },
    kunai: { n: 'คุไน', h: 1, cd: 0.85, rng: 3.5, st: 'agi', sty: 'd', mul: 0.95, adv: 1, jobs: ['Ninja'] },
    whip: { n: 'แส้', h: 1, cd: 1.0, rng: 3.5, st: 'dex', sty: 'd', mul: 1.0, adv: 1, jobs: ['Beast Controller'] },
    bow: { n: 'ธนู', h: 2, cd: 1.0, rng: 6.0, st: 'dex', sty: 'd', mul: 1.0, ammo: 'arrow' },
    longbow: { n: 'ธนูยาว', h: 2, cd: 1.3, rng: 8.5, st: 'dex', sty: 'd', mul: 1.5, ammo: 'arrow', adv: 1, jobs: ['Longbowter'] },
    gun: { n: 'ปืน', h: 1, cd: 1.0, rng: 5.5, st: 'dex', sty: 'd', mul: 1.15, ammo: 'bullet' },
    staff: { n: 'คทา', h: 2, cd: 1.2, rng: 5.5, st: 'int', sty: 'i', mul: 1.0, mag: 1 },
    wand: { n: 'ไม้เท้าเวท', h: 1, cd: 0.9, rng: 5.0, st: 'int', sty: 'i', mul: 0.75, mag: 1 },
    book: { n: 'คัมภีร์', off: 1, st: 'int', mul: 0.5, mag: 1 },
    fists: { n: 'ถุงมือหมัดยักษ์', h: 2, cd: 0.8, rng: 1.6, st: 'str', sty: 's', mul: 1.0, adv: 1, jobs: ['Monk', 'Ashura', 'Muay Thai', 'Biwposter'] },
    shoes: { n: 'รองเท้าพลัง', h: 2, cd: 0.7, rng: 1.7, st: 'agi', sty: 's', mul: 1.0, adv: 1, jobs: ['Taekwondo'] },
    club: { n: 'กระบอง', h: 1, cd: 1.1, rng: 1.7, st: 'str', sty: 's', mul: 1.2, adv: 1, jobs: ['Assen', 'Ringmaster', 'Biwposter'] },
    glove: { n: 'ถุงมือเสริม', off: 1, st: 'str', mul: 0.5, adv: 1, jobs: ['Biwposter'] }
  };
  const TIERS = [
    { lv: 1, n: 0, atk: 5, name: 'ฝึกหัด', pr: 120 }, { lv: 10, n: 8, atk: 12, name: 'เหล็กกล้า', pr: 450 }, { lv: 28, n: 22, atk: 26, name: 'เงินแท้', pr: 1700 },
    { lv: 50, n: 40, atk: 46, name: 'มังกร', pr: 6500 }, { lv: 72, n: 58, atk: 76, name: 'ตำนาน', pr: 24000 }
  ];
  const SHOP_TIERS = 3;
  function genItems(ITEMS) {
    const out = {};
    // ของเดิม
    const patch = (id, o) => { if (ITEMS[id]) Object.assign(ITEMS[id], o); };
    patch('sword_wood', { wt: 'sword', sty: 's', req: { lv: 1, s: 'str', n: 0 } });
    patch('sword_iron', { wt: 'sword', sty: 's', req: { lv: 8, s: 'str', n: 8 } });
    patch('robe_cloth', { wt: 'cloth', req: { lv: 1, s: 'vit', n: 0 } });
    patch('armor_hide', { wt: 'leather', req: { lv: 5, s: 'vit', n: 5 } });
    for (const k of Object.keys(WT)) {
      const w = WT[k];
      for (let t = 0; t < TIERS.length; t++) {
        const id = k + t;
        if (k === 'sword' && t < 2) continue;
        const T = TIERS[t];
        const lv = t === 0 && w.adv ? 10 : T.lv, n = t === 0 && w.adv ? 10 : T.n;
        const it = { name: w.n + T.name, wt: k, slot: w.off ? 'off' : 'weapon', two: w.h === 2 ? 1 : 0, req: { lv, s: w.st, n }, buy: Math.round(T.pr * (w.adv ? 1.3 : 1)), sell: Math.round(T.pr * 0.3) };
        if (w.off) {
          if (k === 'shield') it.def = [3, 7, 14, 26, 44][t];
          else if (w.mag) it.matk = Math.round(T.atk * w.mul);
          else if (k === 'orbglove') { it.matk = Math.round(T.atk * 0.6); it.atk = Math.round(T.atk * 0.3); }
          else it.atk = Math.round(T.atk * w.mul);
        } else {
          if (w.mag) it.matk = Math.round(T.atk * w.mul); else it.atk = Math.round(T.atk * w.mul);
          if (k === 'greatshield') it.def = [2, 5, 10, 18, 30][t];
          if (w.sty) it.sty = w.sty;
        }
        it.desc = (w.jobs ? 'เฉพาะ ' + w.jobs.join(' / ') + ' · ' : '') + 'ต้อง Lv ' + lv + (n ? ' · ' + STAT_TH[w.st] + ' ' + n : '') + (w.two && k !== 'greatshield' ? ' · ถือสองมือ' : '') + (k === 'greatshield' ? ' · เป็นทั้งอาวุธและโล่ (ถือสองมือ)' : '') + (w.ammo ? ' · ต้องใช้' + (w.ammo === 'arrow' ? 'ลูกธนู' : 'กระสุน') : '');
        out[id] = it;
      }
    }
    const AR = { cloth: ['เสื้อคลุม', [2, 5, 10, 18, 30], 'int', 0.06], leather: ['เกราะหนัง', [4, 8, 15, 26, 42], 'vit', 0], plate: ['เกราะเหล็ก', [6, 12, 22, 38, 62], 'vit', 0] };
    for (const k of Object.keys(AR)) {
      for (let t = 0; t < 5; t++) {
        const id = k + t; if (ITEMS[id] || (k === 'cloth' && t === 0) || (k === 'leather' && t === 0)) continue;
        const T = TIERS[t], a = AR[k];
        out[id] = { name: a[0] + T.name, wt: k, slot: 'armor', def: a[1][t], mpp: a[3] * t, req: { lv: T.lv, s: a[2], n: Math.round(T.n * 0.8) }, buy: Math.round(T.pr * 0.9), sell: Math.round(T.pr * 0.27), desc: 'ต้อง Lv ' + T.lv + (T.n ? ' · ' + STAT_TH[a[2]] + ' ' + Math.round(T.n * 0.8) : '') + (a[3] ? ' · เพิ่ม MP สูงสุด' : '') };
      }
    }
    out.arrow0 = { name: 'ลูกธนูไม้', slot: 'ammo', kind: 'arrow', atk: 2, buy: 3, sell: 1, desc: 'ลูกธนูพื้นฐาน ยิงแล้วหมดไป ต้องซื้อเติม' };
    out.arrow1 = { name: 'ลูกธนูเหล็ก', slot: 'ammo', kind: 'arrow', atk: 7, buy: 9, sell: 3, desc: 'ปลายเหล็ก แรงกว่าธนูไม้ ยิงแล้วหมดไป' };
    out.bullet0 = { name: 'กระสุนตะกั่ว', slot: 'ammo', kind: 'bullet', atk: 3, buy: 5, sell: 2, desc: 'กระสุนปืนพื้นฐาน ยิงแล้วหมดไป ต้องซื้อเติม' };
    out.arrow2 = { name: 'ลูกธนูเงินแท้', slot: 'ammo', kind: 'arrow', atk: 16, buy: 24, sell: 8, desc: 'ลูกธนูปลายเงิน ทะลวงเกราะหนา' };
    out.arrow3 = { name: 'ลูกธนูมังกร', slot: 'ammo', kind: 'arrow', atk: 30, buy: 60, sell: 20, desc: 'ลูกธนูปลายเกล็ดมังกร แรงสะท้านฟ้า' };
    out.bullet2 = { name: 'กระสุนเงินแท้', slot: 'ammo', kind: 'bullet', atk: 22, buy: 32, sell: 10, desc: 'กระสุนเงินแท้ แรงกว่ากระสุนเหล็ก' };
    out.bullet3 = { name: 'กระสุนพลังงาน', slot: 'ammo', kind: 'bullet', atk: 40, buy: 80, sell: 26, desc: 'กระสุนอัดพลังงาน ทะลุทะลวงทุกสิ่ง' };
    out.bullet1 = { name: 'กระสุนเหล็กกล้า', slot: 'ammo', kind: 'bullet', atk: 9, buy: 14, sell: 4, desc: 'กระสุนเจาะเกราะ แรงกว่ากระสุนตะกั่ว' };
    return out;
  }
  // รายการสินค้าร้านอาวุธ/เกราะ
  function smithList(lo, hi) {
    lo = lo == null ? 0 : lo; hi = hi == null ? SHOP_TIERS - 1 : hi;
    const l = lo === 0 ? ['sword_wood', 'sword_iron', 'robe_cloth', 'armor_hide'] : [];
    for (const k of Object.keys(WT)) for (let t = lo; t <= hi; t++) { if (k === 'sword' && t < 2) continue; l.push(k + t); }
    for (const k of ['cloth', 'leather', 'plate']) for (let t = lo; t <= hi; t++) { if ((k === 'cloth' || k === 'leather') && t === 0) continue; l.push(k + t); }
    if (lo <= 1) l.push('arrow0', 'arrow1', 'bullet0', 'bullet1');
    if (hi >= 2 && lo <= 3) l.push('arrow2', 'bullet2');
    if (hi >= 3) l.push('arrow3', 'bullet3');
    return l;
  }

  /* ----------------------------------------------------------------- stats */
  const statCost = v => 1 + Math.floor((v - 1) / 10);          // แต้มที่ต้องใช้เพื่อเพิ่มจาก v → v+1
  function spentStats(st) { let s = 0; for (const k of STATS) for (let v = 1; v < (st[k] || 1); v++) s += statCost(v); return s; }
  function totalStatPts(lv, rb) { let s = 5 + 12 * (rb || 0); for (let L = 2; L <= lv; L++) s += 3 + Math.floor(L / 10); return s; }
  const totalSkillPts = lv => Math.floor((lv - 1) * 0.75);
  const newStats = () => ({ str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 });

  /* ---------------------------------------------------------------- skills */
  // [สไตล์, ชนิดสกิล 5 ตัว (3 ปกติ + คลาส4 + พิเศษ), โบนัสพาสซีฟ, ระยะ, ชื่อ 5 อัน]
  // A=ตีเป้าหมาย R=ยิงไกล B=กวาดรอบตัว T=ระเบิดที่เป้าหมาย U=บัฟโจมตี D=บัฟป้องกัน H=ฟื้นเลือด P=พาสซีฟ X=ท่าไม้ตายรอบตัว Y=ท่าไม้ตายไกล Z=ท่าไม้ตายเดี่ยว
  const SPEC = {
    Swordman: ['s', 'ABPZX', 'atk', 0, ['Bash', 'Magnum Break', 'Sword Mastery', 'Heavenly Cleave', 'Valor Awakening']],
    Knight: ['s', 'AAPXZ', 'atk', 0, ['Pierce', 'Spear Stab', 'Cavalry Mastery', 'Charge Storm', 'Dragon Oath']],
    'Lord Knight': ['s', 'ABUXZ', 'atk', 0, ['Blade Dance', 'Aura Blade', 'Berserk', 'Judgement Blade', 'Crown of Swords']],
    'War Master': ['s', 'ABUXZ', 'crit', 0, ['War Cry', 'Hammer Fall', 'Battle Trance', 'Warpath Ruin', 'Titan Roar']],
    Paladin: ['s', 'ADPXH', 'def', 0, ['Holy Strike', 'Guard Stance', 'Faith Plate', 'Sanctum Burst', 'Divine Bulwark']],
    Warlock: ['s', 'ABUXZ', 'atk', 0, ['Cursed Slash', 'Hex Wave', 'Dark Vow', 'Void Cleave', 'Soul Rend']],
    'Shield Master': ['s', 'ADPXH', 'def', 0, ['Shield Bash', 'Iron Wall', 'Fortress', 'Bulwark Quake', 'Immortal Aegis']],
    Shieldfly: ['s', 'RTPYX', 'def', 6, ['Shield Throw', 'Orbit Barrage', 'Floating Guard', 'Aegis Storm', 'Skybound Bastion']],
    Samurai: ['s', 'AAPXZ', 'crit', 0, ['Iai Slash', 'Crescent Cut', 'Bushido', 'Thousand Cuts', 'Way of the Blade']],
    'Sword Master': ['s', 'ABUXZ', 'aspd', 0, ['Swift Draw', 'Wind Blade', 'Zen Focus', 'Mirage Slash', 'Ten Thousand Blades']],
    Onimusha: ['s', 'ABUXZ', 'atk', 0, ['Demon Cut', 'Oni Roar', 'Dark Aura', 'Hundred Demons', 'Netherblade']],
    Thief: ['d', 'ABPZX', 'dodge', 0, ['Double Strike', 'Sand Throw', 'Evasion', 'Shadow Flurry', 'Midnight Heist']],
    Rogue: ['d', 'AAUZX', 'dodge', 0, ['Backstab', 'Cutthroat', 'Smoke Veil', 'Phantom Rush', 'Dagger Storm']],
    'Shadow Master': ['d', 'AAUZX', 'crit', 0, ['Shadow Step', 'Umbra Slash', 'Eclipse', 'Nightfall', 'Void Embrace']],
    'Bandit Lord': ['d', 'ABPXZ', 'atk', 0, ['Plunder', 'Coin Storm', 'Greed', 'Gold Rush', 'Crown Heist']],
    Assassin: ['d', 'AAPZX', 'crit', 0, ['Sonic Blow', 'Poison Edge', 'Deadly Art', 'Death Mark', 'Grim Reaper']],
    'Supreme Assassin': ['d', 'AAUZX', 'crit', 0, ['Crimson Strike', 'Venom Spiral', 'Blood Frenzy', 'Execution', 'Red Moon']],
    Ninja: ['d', 'RTUYX', 'dodge', 5, ['Kunai Throw', 'Shuriken Rain', 'Shadow Clone', 'Thousand Kunai', 'Hidden Mist Art']],
    Jester: ['d', 'RRPYX', 'crit', 5, ['Knife Juggle', 'Dagger Toss', 'Fool Luck', 'Carnival Barrage', 'Grand Finale']],
    'Weapon Controller': ['d', 'RTUYX', 'atk', 6, ['Floating Blade', 'Blade Ring', 'Weapon Link', 'Sword Rain', 'Arsenal Overlord']],
    'Beast Controller': ['d', 'RTUYX', 'atk', 5, ['Whip Crack', 'Beast Rush', 'Wild Bond', 'Panther Hunt', 'Jungle King']],
    Archer: ['d', 'RTPYX', 'atk', 7, ['Double Shot', 'Arrow Rain', 'Eagle Eye', 'Piercing Volley', 'Hawk Storm']],
    Sniper: ['d', 'RRPZX', 'crit', 9, ['Snipe', 'Pinpoint', 'Focus Aim', 'Headshot', 'Dead Eye']],
    Snimaster: ['d', 'RRUZX', 'crit', 10, ['Deadshot', 'Silent Round', 'Perfect Aim', 'Long Shadow', 'One Shot One Kill']],
    Longbowter: ['d', 'RTPYX', 'atk', 10, ['Longshot', 'Piercing Arrow', 'Steady Draw', 'Meteor Arrows', 'Horizon Breaker']],
    Engineer: ['d', 'RTPYX', 'atk', 6, ['Gun Burst', 'Grenade', 'Tinker', 'Barrage Protocol', 'Prototype Zero']],
    Craftmaster: ['d', 'RTUYX', 'atk', 6, ['Bolt Rifle', 'Mine Field', 'Overclock', 'Siege Cannon', 'Masterwork']],
    Roboter: ['d', 'RTUYX', 'def', 6, ['Robo Strike', 'Missile Pod', 'Armor Plating', 'Mecha Barrage', 'Titan Core']],
    'AI Laser': ['d', 'RTUYX', 'mp', 8, ['Laser Shot', 'Beam Array', 'Neural Boost', 'Orbital Beam', 'Singularity']],
    'Animal Master': ['d', 'RTUYX', 'atk', 7, ['Call Beast', 'Pack Hunt', 'Wild Instinct', 'Stampede', 'Primal Rage']],
    Wolfmaster: ['d', 'RTUYX', 'dodge', 7, ['Wolf Fang', 'Howling Charge', 'Pack Leader', 'Lunar Hunt', 'Fenrir Call']],
    Eaglemaster: ['d', 'RTUYX', 'crit', 8, ['Talon Strike', 'Dive Bomb', 'Sky Sense', 'Storm Wings', 'Phoenix Dive']],
    Wildwalker: ['d', 'AAPXZ', 'dodge', 0, ['Trail Cut', 'Snare Trap', 'Forest Step', 'Thorn Burst', 'Wild Heart']],
    Wildman: ['d', 'AAPXZ', 'hp', 0, ['Savage Hack', 'Bear Trap', 'Hardy Hide', 'Primal Slam', 'Wild Spirit']],
    Masterman: ['d', 'AAUXZ', 'atk', 0, ['Blade and Bow', 'Dual Strike', 'Hunter Focus', 'Royal Hunt', 'Peerless Hunter']],
    Magician: ['i', 'RTPYX', 'mp', 6, ['Fire Bolt', 'Cold Bolt', 'Mana Spring', 'Meteor Shower', 'Arcane Nova']],
    Wizard: ['i', 'RTPYX', 'mp', 7, ['Lightning Bolt', 'Storm Gust', 'Spell Mastery', 'Judgement Thunder', 'Archmage Wrath']],
    'High Wizard': ['i', 'RTUYX', 'mp', 7, ['Fire Pillar', 'Frost Nova', 'Mana Surge', 'Inferno', 'Elemental Cataclysm']],
    'Galaxy Magic': ['i', 'RTUYX', 'mp', 8, ['Star Fall', 'Gravity Well', 'Cosmic Veil', 'Supernova', 'Galaxy Collapse']],
    Sage: ['i', 'RTPYX', 'mp', 7, ['Spell Break', 'Magic Burst', 'Sage Insight', 'Mind Blast', 'Book of Ages']],
    Sagemaster: ['i', 'RTUYX', 'mp', 7, ['Arcane Lance', 'Rune Storm', 'Grand Insight', 'Tome Eruption', 'Infinite Library']],
    Elemental: ['i', 'RTUYX', 'atk', 7, ['Elemental Spear', 'Tri Element', 'Attunement', 'Elemental Tempest', 'Primordial Chaos']],
    Summoner: ['i', 'RTUYX', 'hp', 6, ['Summon Imp', 'Spirit Pack', 'Bond Link', 'Horde Call', 'Legion of Souls']],
    Summonmonster: ['i', 'RTUYX', 'hp', 6, ['Slime Burst', 'Monster Stampede', 'Beast Pact', 'Grand Summon', 'Titan Summon']],
    Darksummon: ['i', 'RTUYX', 'mp', 7, ['Soul Bolt', 'Wraith Wave', 'Dark Pact', 'Abyss Gate', 'Reaper Summon']],
    'Magic Sword': ['i', 'ABUXZ', 'atk', 0, ['Spell Slash', 'Mana Edge', 'Enchant Blade', 'Arcane Cleave', 'Blade of Stars']],
    Lightsaber: ['i', 'ABUXZ', 'aspd', 0, ['Saber Strike', 'Force Wave', 'Saber Focus', 'Twin Light', 'Photon Blade']],
    Flysword: ['i', 'RTUYX', 'dodge', 7, ['Sword Throw', 'Orbiting Blades', 'Wind Ride', 'Blade Storm', 'Heavenly Swords']],
    Acolyte: ['i', 'RHPYH', 'heal', 6, ['Holy Light', 'Divine Heal', 'Divine Protection', 'Holy Nova', 'Angel Grace']],
    Priest: ['i', 'RHUYH', 'heal', 6, ['Judgement', 'Sanctuary', 'Blessing', 'Holy Judgement', 'Resurrection Light']],
    'High Priest': ['i', 'RHUYH', 'heal', 7, ['Lux Aeterna', 'Mass Heal', 'Gloria', 'Heaven Gate', 'Seraph Hymn']],
    'Dark Priest': ['i', 'RTUYX', 'mp', 7, ['Dark Judgement', 'Curse Wave', 'Blood Pact', 'Doom Hymn', 'Ruin Covenant']],
    Monk: ['s', 'AAUXZ', 'atk', 0, ['Palm Strike', 'Chain Combo', 'Spirit Gather', 'Asura Palm', 'Golden Body']],
    Ashura: ['s', 'ABUXZ', 'atk', 0, ['Asura Strike', 'Fury Fist', 'Berserk Spirit', 'Ragnarok Palm', 'Blood Asura']],
    Taekwondo: ['s', 'AAUXZ', 'aspd', 0, ['Roundhouse', 'Flying Kick', 'Sprint Step', 'Tornado Kick', 'Heaven Heel']],
    'Muay Thai': ['s', 'AAUXZ', 'crit', 0, ['Elbow Strike', 'Knee Crash', 'Ancient Art', 'Tiger Fist', 'Wai Kru Fury']],
    Assen: ['s', 'ABPXZ', 'hp', 0, ['Club Smash', 'Ground Pound', 'Thick Skin', 'Rampage', 'Mountain Fall']],
    Ringmaster: ['s', 'ABUXZ', 'atk', 0, ['Whip Show', 'Fire Hoop', 'Showtime', 'Grand Parade', 'Circus Ruin']],
    Biwposter: ['s', 'ABUXZ', 'atk', 0, ['Poster Slap', 'Billboard Bash', 'Hype Train', 'Mega Print', 'Viral Storm']],
    'Holy Knight': ['s', 'ABDXH', 'def', 0, ['Holy Strike', 'Radiant Cleave', 'Aegis of Light', 'Judgement Blade', 'Archangel Oath']],
    'Ancient Controller': ['i', 'RTUYX', 'mp', 6, ['Relic Bolt', 'Ruin Resonance', 'Artifact Sync', 'Titan Relic', 'Ancient Awakening']],
    'Solo Player': ['s', 'ABPZX', 'aspd', 0, ['Dual Slash', 'Whirling Blades', 'Dual Mastery', 'Eclipse Barrage', 'Black Moon Dance']]
  };
  const KIND_TH = { A: 'โจมตีเป้าหมาย', R: 'โจมตีระยะไกล', B: 'โจมตีรอบตัว', T: 'ระเบิดรอบเป้าหมาย', U: 'บัฟพลังโจมตี', D: 'บัฟป้องกัน', H: 'ฟื้นเลือด', P: 'พาสซีฟ', X: 'ท่าไม้ตายรอบตัว', Y: 'ท่าไม้ตายระยะไกล', Z: 'ท่าไม้ตายโจมตีหนัก' };
  const PAS_TH = { atk: 'พลังโจมตี', crit: 'โอกาสคริติคอล', dodge: 'โอกาสหลบ', hp: 'เลือดสูงสุด', mp: 'MP สูงสุด', def: 'พลังป้องกัน', aspd: 'ความเร็วโจมตี', heal: 'พลังฟื้นฟู' };
  const SK = {};      // id -> skill
  const SK_BY_JOB = {};
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  function addSkill(job, i, name, kind, o) {
    const J = JOBS[job];
    const id = o.id || slug(name);
    const sk = Object.assign({ id, job, i, name, k: kind, tier: J.tier, max: 5, cost: 1, pre: null, c4: 0, sp: 0 }, o);
    SK[id] = sk; (SK_BY_JOB[job] = SK_BY_JOB[job] || []).push(sk);
    return sk;
  }
  (function build() {
    // Adventurer (ใช้ id เดิมของเกม)
    addSkill('Adventurer', 0, 'Strike', 'A', { id: 'strike', sty: 's', rng: 0, min: 2, pas: null, bm: 2.0 });
    addSkill('Adventurer', 1, 'Whirl', 'B', { id: 'whirl', sty: 's', rng: 0, min: 8, pas: null, pre: 'strike', bm: 1.2 });
    addSkill('Adventurer', 2, 'Mend', 'H', { id: 'mend', sty: 'i', rng: 0, min: 5, pas: null, bm: 1 });
    for (const job of Object.keys(SPEC)) {
      const [sty, kinds, pas, rng, names] = SPEC[job], J = JOBS[job];
      const base = job === 'Solo Player' ? 50 : [1, 10, 35, 60][J.tier];
      for (let i = 0; i < 5; i++) {
        const o = { sty, rng, pas, min: i < 3 ? Math.min(79, base + i * 4) : 80 };
        if (job === 'Solo Player') o.min = [50, 54, 58, 70, 80][i];
        if (i === 3) { o.max = 3; o.cost = 2; o.c4 = 1; }
        if (i === 4) { o.max = 3; o.cost = 2; o.sp = 1; o.c4 = 1; }
        if (job === 'Solo Player' && i >= 3) { o.c4 = 0; o.sp = 0; }
        if (i > 0 && i < 3 && kinds[i] !== 'P') o.pre = SK_BY_JOB[job][i - 1].id;
        addSkill(job, i, names[i], kinds[i], o);
      }
    }
  })();
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  // ค่าจริงของสกิลที่เลเวล l (rb = จำนวนครั้งที่เกิดใหม่, fac = ฝ่าย)
  function skillEff(sk, l, rb, fac) {
    l = Math.max(1, l | 0); rb = rb || 0;
    const t = sk.tier, i = sk.i, k = sk.k, rbm = 1 + 0.15 * rb;
    const e = { mp: 0, cd: 0, mult: 0, radius: 0, rng: sk.rng, heal: 0, dur: 0, buff: null };
    const adh = fac === 'a' ? 1.08 : 1, dha = fac === 'd' ? 1.08 : 1;
    if (sk.job === 'Adventurer') {
      const b = { strike: [2.0, 8, 3], whirl: [1.2, 20, 6], mend: [0, 14, 8] }[sk.id];
      e.mult = (b[0] + 0.22 * (l - 1)) * rbm * adh; e.mp = b[1] + 2 * (l - 1); e.cd = b[2];
      if (sk.id === 'whirl') e.radius = 2.4 + 0.1 * (l - 1);
      if (sk.id === 'mend') e.heal = (0.35 + 0.05 * (l - 1)) * dha;
      return e;
    }
    const big = sk.c4;
    const sm = sk.sp ? 1.8 : 1;
    if (k === 'A' || k === 'R') { e.mult = (1.5 + 0.45 * t + 0.3 * i + 0.2 * (l - 1)) * rbm * adh; e.mp = 8 + 5 * t + 4 * i + 2 * l; e.cd = 2.5 + i + t * 0.4; }
    else if (k === 'B' || k === 'T') { e.mult = (1.1 + 0.35 * t + 0.25 * i + 0.15 * (l - 1)) * rbm * adh; e.mp = 12 + 6 * t + 4 * i + 2 * l; e.cd = 4 + i + t * 0.5; e.radius = 2.3 + 0.15 * (l - 1); }
    else if (k === 'X' || k === 'Y') { e.mult = (2.6 + 0.5 * t + 0.5 * (l - 1)) * sm * rbm * adh; e.mp = 40 + 10 * t + (sk.sp ? 25 : 0); e.cd = sk.sp ? 40 : 25; e.radius = 3.3 + 0.2 * (l - 1); }
    else if (k === 'Z') { e.mult = (5.0 + 0.8 * t + 1.0 * (l - 1)) * sm * rbm * adh; e.mp = 35 + 10 * t + (sk.sp ? 25 : 0); e.cd = sk.sp ? 36 : 22; }
    else if (k === 'U') { e.dur = 25 + 5 * l; e.buff = { atk: 0.12 + 0.04 * l, aspd: sk.pas === 'aspd' ? 0.08 + 0.02 * l : 0.04 }; e.mp = 12 + 4 * t + 2 * l; e.cd = e.dur + 15; if (sk.sp) { e.buff.atk *= 1.6; e.mult = 0; } }
    else if (k === 'D') { e.dur = 25 + 5 * l; e.buff = { def: 0.25 + 0.08 * l }; e.mp = 12 + 4 * t + 2 * l; e.cd = e.dur + 15; }
    else if (k === 'H') { e.heal = ((big ? 0.7 : 0.25) + 0.06 * l + (sk.pas === 'heal' ? 0.05 : 0)) * rbm * dha; e.mp = 16 + 5 * t + 3 * l + (big ? 30 : 0); e.cd = big ? 30 : 6 + t; e.radius = 4.5; }
    else if (k === 'P') { e.pas = sk.pas; e.v = { atk: (1.5 + 1.2 * t) * l, crit: 0.012 * l, dodge: 0.012 * l, hp: 0.03 * l, mp: 0.04 * l, def: (0.8 + 0.8 * t) * l, aspd: 0.015 * l, heal: 0.05 * l }[sk.pas] || 0; }
    if (big && (k === 'X' || k === 'Y' || k === 'Z') && sk.sp) e.mult = e.mult; // พิเศษ: คูณไปแล้ว
    e.mp = Math.round(e.mp); e.cd = Math.round(e.cd * 10) / 10;
    return e;
  }
  function skillDesc(sk, l) {
    const e = skillEff(sk, l || 1, 0, null), r = e.rng ? ' · ระยะ ' + e.rng + ' ช่อง' : '';
    const pc = v => Math.round(v * 100) + '%';
    switch (sk.k) {
      case 'A': case 'R': case 'Z': return 'ดาเมจ ' + pc(e.mult) + ' ของพลังโจมตี' + r;
      case 'B': case 'X': return 'โจมตีศัตรูรอบตัวในรัศมี ' + e.radius.toFixed(1) + ' ช่อง ดาเมจ ' + pc(e.mult);
      case 'T': case 'Y': return 'ระเบิดรอบเป้าหมายรัศมี ' + e.radius.toFixed(1) + ' ช่อง ดาเมจ ' + pc(e.mult) + r;
      case 'U': return 'พลังโจมตี +' + pc(e.buff.atk) + ' นาน ' + e.dur + ' วินาที';
      case 'D': return 'ป้องกัน +' + pc(e.buff.def) + ' นาน ' + e.dur + ' วินาที';
      case 'H': return 'ฟื้นเลือด ' + pc(e.heal) + ' ของเลือดสูงสุด (รวมเพื่อนใกล้ ๆ)';
      case 'P': return PAS_TH[sk.pas] + ' +' + (['atk', 'def'].indexOf(sk.pas) >= 0 ? Math.round(e.v) : (e.v * 100).toFixed(1) + '%') + ' (ถาวร)';
    }
    return '';
  }
  const skillShape = sk => (sk.k === 'P' ? 'sq' : sk.k === 'U' || sk.k === 'D' ? 'rr' : 'ci');   // สี่เหลี่ยมคม = พาสซีฟ, มนเหลี่ยม = บัฟ, วงกลม = ใช้งาน
  const ACTIVE_IDS = () => Object.keys(SK).filter(id => SK[id].k !== 'P' && !SK[id].sp && !SK[id].c4 && SK[id].job !== 'Adventurer' && SK[id].job !== 'Solo Player');

  /* ------------------------------------------------- player-rpg state helpers */
  const BSLOTS = 5;
  // Adventurer: ยืมสกิลเองได้ที่ Lv10/30/50/70 · Solo Player: ได้สกิลสุ่มจากอาชีพอื่นทุก 10 เลเวล (Lv50,60,70,80,90)
  const bslots = p => (p.job === 'Adventurer' ? [10, 30, 50, 70].filter(v => p.lv >= v).length : p.job === 'Solo Player' ? clamp(Math.floor(p.lv / 10) - 4, 0, 5) : 0);
  const emptyBorrow = () => [null, null, null, null, null];
  function fillRand(p) {   // Solo Player: เติมสกิลสุ่มให้ช่องที่ปลดล็อกแล้ว (คืนค่า = สกิลใหม่)
    const got = [];
    if (p.job !== 'Solo Player') return got;
    const n = bslots(p), pool = ACTIVE_IDS();
    for (let i = 0; i < n; i++) {
      if (p.borrow[i]) continue;
      const left = pool.filter(id => p.borrow.indexOf(id) < 0);
      if (!left.length) break;
      p.borrow[i] = left[Math.floor(Math.random() * left.length)]; got.push(p.borrow[i]);
    }
    return got;
  }
  const borrowLv = p => clamp(1 + Math.floor(p.lv / 25), 1, 5);
  function skillLevel(p, id) { return (p.skills && p.skills[id]) | 0; }
  // เงื่อนไขของสกิล → null ถ้าเรียนได้ / ข้อความ ถ้ายัง
  function skillLock(p, sk) {
    if (sk.job !== 'Adventurer' && chain(p.job, p.via).indexOf(sk.job) < 0) return 'ต้องเป็นอาชีพ ' + sk.job;
    if (sk.job === 'Solo Player' && p.job !== 'Solo Player') return 'เฉพาะ Solo Player';
    if (p.lv < sk.min) return 'ต้องเลเวล ' + sk.min;
    if (sk.c4 && !p.c4) return 'ต้องเลื่อนเป็นคลาส 4 (Lv 80)';
    if (sk.sp && !(p.rb >= 1 && p.job === p.orig)) return 'ปลดล็อกหลังเกิดใหม่ (เฉพาะอาชีพเดิม)';
    if (sk.pre && !skillLevel(p, sk.pre)) return 'ต้องเรียน ' + SK[sk.pre].name + ' ก่อน';
    return null;
  }
  function skillCanUp(p, sk) {   // → '' ถ้าอัปได้
    const l = skillLevel(p, sk.id), lock = skillLock(p, sk);
    if (lock) return lock;
    if (l >= sk.max) return 'เลเวลสูงสุดแล้ว';
    if (l >= 1 && p.lv < sk.min + 4 * l) return 'อัปต่อได้ที่เลเวล ' + (sk.min + 4 * l);
    if ((p.skp | 0) < sk.cost) return 'แต้มสกิลไม่พอ (ต้องใช้ ' + sk.cost + ')';
    return '';
  }
  const spentSkills = p => { let s = 0; for (const id of Object.keys(p.skills || {})) if (SK[id]) s += SK[id].cost * p.skills[id]; return s; };
  function recalcPoints(p) {
    p.sp = Math.max(0, totalStatPts(p.lv, p.rb) - spentStats(p.st));
    p.skp = Math.max(0, totalSkillPts(p.lv) + (p.rb || 0) * 4 - spentSkills(p));
  }

  /* ----------------------------------------------------------------- derive */
  function reqCheck(p, it, jobOnly) {   // เหตุผลที่ใส่ไม่ได้ ('' = ได้)
    const w = WT[it.wt];
    if (w && w.jobs && w.jobs.indexOf(p.job) < 0) return 'เฉพาะ ' + w.jobs.join(' / ');
    if (it.req) {
      if (p.lv < it.req.lv) return 'ต้อง Lv ' + it.req.lv;
      if (it.req.n && (p.st[it.req.s] | 0) < it.req.n) return 'ต้อง ' + STAT_TH[it.req.s] + ' ' + it.req.n;
    }
    return '';
  }
  // คำนวณค่าสถานะทั้งหมดของผู้เล่น (เขียนทับ p.maxHp ฯลฯ) — time = เวลาโลก (วินาที) ใช้เช็กบัฟ
  function derive(p, ITEMS, time) {
    const st = p.st, lv = p.lv, rb = p.rb || 0;
    const w = ITEMS[p.equip.weapon], off = ITEMS[p.equip.off], ar = ITEMS[p.equip.armor];
    const gb = { atk: 0, def: 0, aspd: 0, crit: 0, dodge: 0, hp: 0, mp: 0, heal: 0, spd: 0 };
    for (const id of Object.keys(p.skills || {})) {
      const sk = SK[id]; if (!sk || sk.k !== 'P' || !p.skills[id]) continue;
      if (chain(p.job, p.via).indexOf(sk.job) < 0 && sk.job !== 'Adventurer') continue;
      const e = skillEff(sk, p.skills[id], rb, p.fac); gb[sk.pas] += e.v;
    }
    let bAtk = 0, bDef = 0, bAspd = 0, bSpd = 0;
    for (const id of Object.keys(p.buffs || {})) {
      const b = p.buffs[id];
      if (b.until <= time) { delete p.buffs[id]; continue; }
      bAtk += b.atk || 0; bDef += b.def || 0; bAspd += b.aspd || 0; bSpd += b.spd || 0;
    }
    const ammo = ITEMS[p.equip.ammo];
    const wtA = (w && w.atk) || 0, wtM = (w && w.matk) || 0, oA = (off && off.atk) || 0, oM = (off && off.matk) || 0;
    const ammoA = w && WT[w.wt] && WT[w.wt].ammo && ammo && ammo.kind === WT[w.wt].ammo && (p.inv[p.equip.ammo] | 0) > 0 ? ammo.atk : 0;
    const dual = p.job === 'Solo Player' && w && off && w.wt === 'sword' && off.wt === 'sword';
    p.dual = dual ? 1 : 0;
    const base = 6 + lv / 2;
    const luk = st.luk * 0.3;
    const fm = (1 + bAtk) * (p.fac === 'a' ? 1.0 : 1.0);
    p.atkS = Math.round((base + st.str * 1.6 + st.dex * 0.4 + luk + gb.atk + wtA + oA + ammoA * 0) * fm);
    p.atkD = Math.round((base + st.dex * 1.6 + st.str * 0.4 + luk + gb.atk + wtA + oA + ammoA) * fm);
    p.atkI = Math.round((base + st.int * 1.8 + st.dex * 0.3 + luk + gb.atk + wtA + wtM + oM + oA) * fm);
    const wt = w && WT[w.wt];
    p.sty = wt && wt.sty ? wt.sty : 's';
    p.atk = p.sty === 'd' ? p.atkD : p.sty === 'i' ? p.atkI : p.atkS;
    if (dual) p.atk = Math.round(p.atk * 1.1);
    p.rng = wt && wt.rng ? wt.rng : 1.6;
    p.ammoKind = wt && wt.ammo ? wt.ammo : null;
        const aspdB = Math.min(0.6, st.agi * 0.005 + st.dex * 0.002 + gb.aspd + bAspd + (dual ? 0.15 : 0));
    p.acd = Math.max(0.3, (wt && wt.cd ? wt.cd : 1.0) * (1 - aspdB));
    p.crit = Math.min(0.75, 0.05 + st.luk * 0.003 + gb.crit);
    p.dodge = Math.min(0.5, st.agi * 0.004 + gb.dodge);
    p.def = Math.floor(st.vit * 0.5 + lv / 4 + gb.def + ((ar && ar.def) || 0) + ((off && off.def) || 0) + ((w && w.def) || 0));
    p.def = Math.round(p.def * (1 + bDef) * (p.fac === 'd' ? 1.05 : 1));
    p.healMul = 1 + gb.heal + st.int * 0.003;
    const hpm = (LINE_HP[rootOf(p)] || 1) * (1 + 0.1 * rb), mpm = LINE_MP[rootOf(p)] || 1;
    p.maxHp = Math.round((60 + 15 * (lv - 1)) * hpm * (1 + st.vit * 0.012 + gb.hp));
    p.maxMp = Math.round((30 + 6 * (lv - 1)) * mpm * (1 + st.int * 0.012 + gb.mp + ((ar && ar.mpp) || 0)));
    p.spdMul = 1 + bSpd;
    return p;
  }
  // อุปกรณ์ที่ใส่อยู่แต่ใช้ไม่ได้แล้ว (เปลี่ยนอาชีพ/รีเซ็ตสเตตัส) → รายการช่องที่ต้องถอด
  function illegalGear(p, ITEMS) {
    const bad = [];
    for (const slot of ['weapon', 'off', 'armor']) {
      const it = ITEMS[p.equip[slot]]; if (it && reqCheck(p, it)) bad.push(slot);
    }
    const o = ITEMS[p.equip.off];
    if (o && o.slot === 'weapon' && !(p.job === 'Solo Player' && o.wt === 'sword') && bad.indexOf('off') < 0) bad.push('off');
    const w = ITEMS[p.equip.weapon];
    if (w && w.two && p.equip.off && bad.indexOf('off') < 0) bad.push('off');
    return bad;
  }

  /* --------------------------------------------------------- advancement */
  // ตัวเลือกการเลื่อนขั้นของผู้เล่นตอนนี้
  function advInfo(p) {
    const out = { kind: null, jobs: [], need: '', ok: false };
    const J = JOBS[p.job];
    if (p.job === 'Adventurer') {
      out.kind = 'job'; out.jobs = JOBS.Adventurer.kids.slice(); out.ok = p.lv >= LV.c1; out.need = out.ok ? '' : 'ถึง Lv ' + LV.c1;
      if (p.lv >= LV.solo) { out.jobs.push('Solo Player'); out.opt = 'special'; }
      return out;
    }
    if (p.job === 'Solo Player') { out.need = 'คุณคือ Solo Player แล้ว — ไม่มีคลาสถัดไป'; return out; }
    if (J.tier === 1 && !p.fac) { out.kind = 'fac'; out.ok = p.lv >= LV.fac; out.need = out.ok ? '' : 'ถึง Lv ' + LV.fac; return out; }
    if (J.kids.length) {
      const need = J.tier === 1 ? LV.c2 : LV.c3;
      out.kind = 'job'; out.jobs = J.kids.slice(); out.ok = p.lv >= need; out.need = out.ok ? '' : 'ถึง Lv ' + need;
      return out;
    }
    if (!p.c4) { out.kind = 'c4'; out.ok = p.lv >= LV.c4; out.need = out.ok ? '' : 'ถึง Lv ' + LV.c4; return out; }
    if (p.lv >= LV.rebirth) { out.kind = 'rebirth'; out.ok = true; return out; }
    out.kind = 'rebirth'; out.need = 'ถึง Lv ' + LV.rebirth; return out;
  }
  const REBIRTH_COST = { jelly: 100, tusk: 50, coin: 5000 };
  const resetCost = p => (JOBS[p.job].tier >= 2 || p.job === 'Solo Player' ? 3000 : 0);

  /* ----------------------------------------------------------- save format */
  function fromSave(p, save, ITEMS) {
    save = save && typeof save === 'object' ? save : {};
    p.st = newStats();
    if (save.st && typeof save.st === 'object') for (const k of STATS) p.st[k] = clamp(Math.floor(Number(save.st[k])) || 1, 1, MAX_STAT);
    if (save.job === 'Passerby') save.job = 'Solo Player';
    p.job = typeof save.job === 'string' && JOBS[save.job] ? save.job : 'Adventurer';
    p.via = ALT[p.job] ? viaOf(p.job, save.via) : null;
    p.fac = save.fac === 'd' || save.fac === 'a' ? save.fac : null;
    p.rb = clamp(Math.floor(Number(save.rb)) || 0, 0, 9);
    p.c4 = !!save.c4 && p.job !== 'Adventurer';
    p.orig = typeof save.orig === 'string' && JOBS[save.orig] ? save.orig : null;
    p.skills = {};
    if (save.skills && typeof save.skills === 'object') for (const id of Object.keys(save.skills)) if (SK[id]) p.skills[id] = clamp(Math.floor(Number(save.skills[id])) || 0, 0, SK[id].max);
    p.borrow = Array.isArray(save.borrow) ? save.borrow.slice(0, 5).map(x => (typeof x === 'string' && SK[x] ? x : null)) : emptyBorrow();
    while (p.borrow.length < 5) p.borrow.push(null);
    if (p.job === 'Solo Player') fillRand(p);
    p.buffs = {};
    // ถ้าแต้มที่ใช้เกินที่ควรมี (เซฟเก่า/ดัดแปลง) → รีเซ็ต
    if (spentStats(p.st) > totalStatPts(p.lv, p.rb)) p.st = newStats();
    if (spentSkills(p) > totalSkillPts(p.lv) + p.rb * 4) p.skills = {};
    recalcPoints(p);
  }
  function toSave(p) {
    return { st: Object.assign({}, p.st), job: p.job, via: p.via || null, fac: p.fac, rb: p.rb, c4: p.c4 ? 1 : 0, orig: p.orig, skills: Object.assign({}, p.skills), borrow: (p.borrow || []).slice() };
  }

  return {
    STATS, STAT_TH, MAX_LV, MAX_STAT, LV, TREE, JOBS, JOB_LIST, chain, WT, TIERS, genItems, smithList, SHOP_TIERS,
    statCost, spentStats, totalStatPts, totalSkillPts, newStats, SK, SK_BY_JOB, SPEC, KIND_TH, PAS_TH, ROMAN,
    viaOf, rootOf, ALT, emptyBorrow, fillRand, BSLOTS, skillEff, skillDesc, skillShape, ACTIVE_IDS, bslots, borrowLv, skillLevel, skillLock, skillCanUp, spentSkills, recalcPoints,
    reqCheck, derive, illegalGear, advInfo, REBIRTH_COST, resetCost, fromSave, toSave, clamp
  };
});
