/* world.js — โลกของ Chathai Online: 15 แมพ (เมือง 7 + แมพล่ามอน 8), มอนสเตอร์, ร้านค้า, เควสต์
 * ใช้ร่วมกันทั้งเซิร์ฟเวอร์ (Node) และเบราว์เซอร์ — ห้ามอ้างอิง DOM
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.World = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const W = 40, H = 32;
  const T = { GRASS: 0, PATH: 1, STONE: 2, WATER: 3, BRIDGE: 4, VOID: 5 };
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  let STRICT = false;
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------- โซน */
  // pos = ตำแหน่งบนแผนที่โลก (0-100) · lvr = ช่วงเลเวลที่แนะนำ (เมืองใช้ระดับของผู้เล่นที่มักมาถึง)
  const ZD = {
    village: { n: 'หมู่บ้านลำธารไผ่', en: 'Bamboo Creek Village', vi: 'Làng Suối Tre', ko: '대나무 시내 마을', theme: 'bamboo', kind: 'town', pos: [10, 78], blurb: 'หมู่บ้านสไตล์จีนยุทธ์ที่ทุกคนเริ่มต้น', bEn: 'A wuxia-style village where every journey begins.' },
    field: { n: 'ทุ่งไผ่เขียว', en: 'Green Bamboo Field', vi: 'Cánh đồng Tre Xanh', ko: '푸른 대나무 들판', theme: 'bamboo', kind: 'hunt', pos: [10, 50], blurb: 'ป่าแรกที่เต็มไปด้วยสัตว์เล็ก ๆ', bEn: 'The first forest, full of small critters.' },
    rosen: { n: 'โรเซนฮอลล์', en: 'Rosenhall', vi: 'Rosenhall', ko: '로젠홀', theme: 'euro', kind: 'town', pos: [26, 40], blurb: 'เมืองยุโรปที่ตั้งสมาคมนักผจญภัย รับเปลี่ยนอาชีพขั้นแรก', bEn: 'A European town and home of the Adventurers Guild.' },
    rain: { n: 'ป่าดิบชื้นมรกต', en: 'Emerald Rainforest', vi: 'Rừng mưa Ngọc Lục Bảo', ko: '에메랄드 열대우림', theme: 'jungle', kind: 'hunt', pos: [40, 30], blurb: 'ป่าฝนทึบ เต็มไปด้วยแมลงและสัตว์ดุ', bEn: 'Dense rainforest full of insects and fierce beasts.' },
    ruins: { n: 'มหานครร้างเวลเทอร์', en: 'Ruined City of Velter', vi: 'Thành phố hoang Velter', ko: '벨터 폐허 도시', theme: 'ruins', kind: 'hunt', pos: [26, 62], blurb: 'เมืองที่ล่มสลาย วิญญาณและโครงกระดูกเดินเพ่นพ่าน', bEn: 'A fallen city haunted by spirits and skeletons.' },
    treehouse: { n: 'หมู่บ้านต้นไม้ไอริน', en: 'Irin Treehouse Village', vi: 'Làng Nhà Cây Irin', ko: '아이린 나무집 마을', theme: 'treehouse', kind: 'town', pos: [54, 22], blurb: 'หมู่บ้านบนต้นไม้ยักษ์กลางป่า', bEn: 'A village high in the branches of giant trees.' },
    thai: { n: 'ตลาดน้ำศรีสยาม', en: 'Si Siam Floating Market', vi: 'Chợ nổi Si Siam', ko: '씨시암 수상시장', theme: 'thai', kind: 'town', pos: [68, 28], blurb: 'เมืองไทยริมคลอง บ้านใต้ถุนสูงและวัดเก่าแก่', bEn: 'A Thai canal town of stilt houses and old temples.' },
    sea: { n: 'วิหารปะการังใต้ทะเล', en: 'Coral Temple Depths', vi: 'Đền San Hô dưới biển', ko: '산호 신전 해저', theme: 'sea', kind: 'hunt', pos: [80, 44], blurb: 'ใต้ท้องทะเลลึก มีวิหารโบราณจมอยู่', bEn: 'A sunken ancient temple deep underwater.' },
    desert: { n: 'ทะเลทรายสุริยะ', en: 'Sunfire Desert', vi: 'Sa mạc Mặt Trời', ko: '태양의 사막', theme: 'desert', kind: 'hunt', pos: [42, 70], blurb: 'ทรายร้อนระอุ มีแมงป่องและมัมมี่', bEn: 'Scorching dunes of scorpions and mummies.' },
    oasis: { n: 'โอเอซิสสุริยา', en: 'Surya Oasis', vi: 'Ốc đảo Surya', ko: '수리야 오아시스', theme: 'oasis', kind: 'town', pos: [58, 76], blurb: 'เมืองทะเลทรายรอบบ่อน้ำศักดิ์สิทธิ์', bEn: 'A desert town around a sacred spring.' },
    neon: { n: 'นีออนซิตี้ 2099', en: 'Neon City 2099', vi: 'Neon City 2099', ko: '네온 시티 2099', theme: 'neon', kind: 'town', pos: [72, 66], blurb: 'มหานครไซเบอร์พังก์ ไฟนีออนไม่เคยดับ', bEn: 'A cyberpunk metropolis where the neon never sleeps.' },
    waste: { n: 'ซากโรงงานเหล็กไหม้', en: 'Burnt Steel Factory Ruins', vi: 'Tàn tích nhà máy Thép Cháy', ko: '불탄 강철 공장 폐허', theme: 'waste', kind: 'hunt', pos: [86, 58], blurb: 'โรงงานร้าง หุ่นยนต์ยังคงเดินตรวจตรา', bEn: 'An abandoned factory still patrolled by machines.' },
    snow: { n: 'ทุ่งหิมะนิรันดร์', en: 'Eternal Snowfield', vi: 'Cánh đồng tuyết vĩnh cửu', ko: '영원의 설원', theme: 'snow', kind: 'hunt', pos: [88, 32], blurb: 'ทุ่งหิมะกว้างใหญ่ หนาวจนลมหายใจเป็นน้ำแข็ง', bEn: 'A vast snowfield where breath freezes in the air.' },
    frost: { n: 'ฟรอสต์โฮล์ม', en: 'Frostholm', vi: 'Frostholm', ko: '프로스트홀름', theme: 'frost', kind: 'town', pos: [90, 14], blurb: 'เมืองน้ำแข็งของเหล่าอัศวินและนักเวท', bEn: 'An ice town of knights and mages.' },
    dungeon: { n: 'ดันเจี้ยนเงามืด', en: 'Shadow Dungeon', vi: 'Hầm ngục Bóng Tối', ko: '그림자 던전', theme: 'dungeon', kind: 'hunt', pos: [74, 6], blurb: 'ถ้ำใต้ธารน้ำแข็ง ที่อันตรายที่สุดในโลก', bEn: 'The deadliest cave beneath the glacier.' }
  };
  const ZONES = Object.keys(ZD);
  const TOWNS = ZONES.filter(z => ZD[z].kind === 'town');
  // เส้นทางระหว่างแมพ: [โซนต้นทาง, ด้านที่ออก, โซนปลายทาง]  (ปลายทางจะมีประตูฝั่งตรงข้าม)
  const LINKS = [
    ['village', 'N', 'field'], ['field', 'E', 'rosen'], ['rosen', 'E', 'rain'], ['rosen', 'S', 'ruins'],
    ['rain', 'E', 'treehouse'], ['treehouse', 'E', 'thai'], ['thai', 'S', 'sea'], ['ruins', 'E', 'desert'],
    ['desert', 'E', 'oasis'], ['oasis', 'E', 'neon'], ['neon', 'E', 'waste'], ['waste', 'N', 'snow'],
    ['snow', 'E', 'frost'], ['frost', 'N', 'dungeon']
  ];
  const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const PORTAL_RECT = { N: [19, 1, 2, 1], S: [19, 30, 2, 1], W: [1, 15, 1, 2], E: [38, 15, 1, 2] };
  const FRONT = { N: [20, 3.5], S: [20, 28.5], W: [3.5, 16], E: [36.5, 16] };
  const FRONT_OVR = { 'village:N': [20, 8.5], 'field:S': [20, 25] };   // หมู่บ้านกับทุ่งไผ่ใช้ประตูแบบเดิม
  const frontOf = (z, side) => FRONT_OVR[z + ':' + side] || FRONT[side];
  const EXITS = {};   // zone -> [{side,to}]
  ZONES.forEach(z => { EXITS[z] = []; });
  for (const [a, s, b] of LINKS) { EXITS[a].push({ side: s, to: b }); EXITS[b].push({ side: OPP[s], to: a }); }
  // พอร์ทัลใหม่ของโซน (ไม่รวมประตูเดิมของ village N / field S)
  function portalsFor(z) {
    const out = [];
    for (const e of EXITS[z]) {
      if ((z === 'village' && e.side === 'N') || (z === 'field' && e.side === 'S')) continue;
      const r = PORTAL_RECT[e.side], f = frontOf(e.to, OPP[e.side]);
      out.push({ x: r[0], y: r[1], w: r[2], h: r[3], to: e.to, tx: f[0], ty: f[1], name: ZD[e.to].n, side: e.side });
    }
    return out;
  }
  // เส้นทางที่สั้นที่สุดระหว่างโซน (BFS บนกราฟ)
  function route(a, b) {
    if (a === b) return [a];
    const prev = { [a]: null }, q = [a];
    while (q.length) {
      const c = q.shift();
      for (const e of EXITS[c]) if (!(e.to in prev)) { prev[e.to] = c; if (e.to === b) { const out = [b]; let k = c; while (k) { out.unshift(k); k = prev[k]; } return out; } q.push(e.to); }
    }
    return null;
  }

  /* ------------------------------------------------------------- มอนสเตอร์
   * [key, ชื่อไทย, ชื่ออังกฤษ, เลเวล, ตระกูลภาพ, สีหลัก, สีรอง, ตัวเลือก, ส่วนที่ดรอป(ไทย), (อังกฤษ)]
   * ตระกูลภาพ: blob quad biped bird snake insect fish crab ghost plant robot
   */
  const MROWS = [
    // ทุ่งไผ่เขียว (slime/boar เป็นของเดิม วาดด้วยโค้ดเฉพาะ)
    ['rabbit', 'กระต่ายหูยาว', 'Longear Rabbit', 2, 'quad', '#efe6d6', '#c9b79a', { sz: 0.75, tr: ['ear', 'tail'], spd: 1.3 }, 'ขน', 'Fur'],
    ['pig', 'หมูตุ๊ต๊ะ', 'Chubby Piglet', 3, 'quad', '#f2b2bd', '#d98a99', { sz: 0.9, tr: ['tail'], hp: 1.2 }, 'หนัง', 'Hide'],
    ['frog', 'กบหนองบัว', 'Lotus Pond Frog', 5, 'quad', '#6fbf5a', '#3f8a3c', { sz: 0.8, tr: ['frog'], atk: 0.9 }, 'ขา', 'Leg'],
    ['boarking', 'หมูป่าเฒ่าเขี้ยวทอง', 'Old Goldtusk Boar', 7, 'quad', '#8a5a2e', '#e8b64a', { sz: 1.6, tr: ['tusk', 'mane'], boss: 1 }, 'เขี้ยวทอง', 'Gold Tusk'],
    // ป่าดิบชื้นมรกต
    ['grasshopper', 'ตั๊กแตนยักษ์', 'Giant Grasshopper', 8, 'insect', '#7fcf4a', '#3f7a2a', { tr: ['wing', 'leap'], spd: 1.3 }, 'ปีก', 'Wing'],
    ['beetle', 'ด้วงเขาทอง', 'Goldhorn Beetle', 9, 'insect', '#c9a02a', '#5a3d12', { tr: ['horn'], hp: 1.3, spd: 0.8 }, 'กระดอง', 'Shell'],
    ['wilddog', 'หมาจรป่า', 'Feral Jungle Dog', 10, 'quad', '#b58a5a', '#6e4c2c', { tr: ['ear', 'tail'], spd: 1.2 }, 'หนัง', 'Hide'],
    ['vfrog', 'กบพิษลายคราม', 'Indigo Poison Frog', 11, 'quad', '#3a7fd0', '#e8d23a', { sz: 0.8, tr: ['frog', 'spot'], atk: 1.1 }, 'ต่อมพิษ', 'Venom Gland'],
    ['snake', 'งูเขียวหางไหม้', 'Firetail Viper', 12, 'snake', '#59b84a', '#d4452c', { atk: 1.1 }, 'เกล็ด', 'Scale'],
    ['mushroom', 'เห็ดพิษเดินได้', 'Walking Toadstool', 13, 'plant', '#d4453a', '#f2e8d8', { tr: ['cap'], hp: 1.2 }, 'สปอร์', 'Spore'],
    ['buffalo', 'ควายป่าเขาโค้ง', 'Curvehorn Buffalo', 14, 'quad', '#5a5048', '#2f2a26', { sz: 1.25, tr: ['horn'], hp: 1.5, spd: 0.85 }, 'หนัง', 'Hide'],
    ['flypig', 'หมูบินใบไม้', 'Leafwing Flying Pig', 16, 'bird', '#f0a8b8', '#6fae4e', { sz: 0.95, tr: ['tail'], f: 1 }, 'ปีกใบไม้', 'Leaf Wing'],
    ['bandit', 'โจรป่าหน้าดำ', 'Blackface Forest Bandit', 17, 'biped', '#6b5a3a', '#2a2a2a', { tr: ['hat', 'blade'], sk: 'rw', atk: 1.1 }, 'ผ้าโพกหัว', 'Headcloth'],
    ['wolf', 'หมาป่าดง', 'Jungle Wolf', 18, 'quad', '#8a8f98', '#4d525a', { tr: ['ear', 'tail', 'fur'], spd: 1.3 }, 'ขนหมาป่า', 'Wolf Pelt'],
    ['tiger', 'เสือลายเมฆ', 'Cloudstripe Tiger', 20, 'quad', '#e08a3a', '#2a1c10', { sz: 1.2, tr: ['stripe', 'tail'], atk: 1.15, hp: 1.3 }, 'หนังเสือ', 'Tiger Hide'],
    ['tigerking', 'เสือเฒ่าราชาป่าดิบ', 'Elder Tiger King', 22, 'quad', '#d8742a', '#1c1208', { sz: 1.7, tr: ['stripe', 'tail', 'mane'], boss: 1 }, 'เขี้ยวราชา', 'Royal Fang'],
    // มหานครร้างเวลเทอร์
    ['skeleton', 'นักรบโครงกระดูก', 'Skeleton Warrior', 22, 'biped', '#e8e2d0', '#8a8372', { tr: ['bone'], sk: 'rw' }, 'กระดูก', 'Bone'],
    ['bat', 'ค้างคาวซากปรักหักพัง', 'Rubble Bat', 24, 'bird', '#5a4a6e', '#2a2236', { sz: 0.8, tr: ['bat'], f: 1, spd: 1.4 }, 'ปีกค้างคาว', 'Bat Wing'],
    ['ghost', 'ผีเปรตเมืองร้าง', 'Ruin Wraith', 26, 'ghost', '#cfe6ee', '#7fa2b2', { tr: ['glow'], rg: 4, atk: 1.1 }, 'ผงวิญญาณ', 'Ectoplasm'],
    ['dancer', 'นางรำผีดิบ', 'Haunted Dancer', 28, 'biped', '#d85a7a', '#f2d070', { tr: ['dance', 'fem', 'glow'], atk: 1.1 }, 'ผ้าแพรผี', 'Spectral Silk'],
    ['werewolf', 'หมาป่ายืนสองขา', 'Upright Werewolf', 30, 'biped', '#6e6458', '#2f2a24', { tr: ['ear', 'tail', 'fur', 'claw'], sz: 1.2, hp: 1.3, spd: 1.2 }, 'กรงเล็บ', 'Claw'],
    ['deadspirit', 'วิญญาณนักผจญภัย', 'Fallen Adventurer Spirit', 32, 'ghost', '#b8c8ff', '#6a7ac8', { tr: ['glow', 'humanoid'], sk: 'rs', rg: 3, atk: 1.15 }, 'ผลึกวิญญาณ', 'Spirit Crystal'],
    ['skelord', 'จอมพลโครงกระดูก', 'Skeleton Marshal', 35, 'biped', '#d8d0b8', '#5a1c1c', { tr: ['bone', 'crown'], sk: 'rw', sz: 1.6, boss: 1 }, 'มงกุฎกระดูก', 'Bone Crown'],
    // วิหารปะการังใต้ทะเล
    ['crab', 'ปูเกราะหิน', 'Stonearmor Crab', 33, 'crab', '#e0683a', '#8a2f1a', { hp: 1.4, spd: 0.8 }, 'กระดอง', 'Shell'],
    ['jelly', 'แมงกะพรุนไฟฟ้า', 'Shock Jellyfish', 35, 'fish', '#c8a0ff', '#8a60d0', { tr: ['jelly', 'glow'], f: 1, rg: 3 }, 'วุ้นไฟฟ้า', 'Shock Jelly'],
    ['puffer', 'ปลาปักเป้าหนาม', 'Spiny Pufferfish', 36, 'fish', '#e8d070', '#a08a2a', { tr: ['puff', 'spike'], f: 1, hp: 1.3 }, 'หนาม', 'Spine'],
    ['seasnake', 'งูทะเลหัวเรือง', 'Glowhead Sea Serpent', 38, 'snake', '#3aa8b8', '#e8f070', { atk: 1.15, tr: ['glow'] }, 'เกล็ดทะเล', 'Sea Scale'],
    ['octopus', 'ปลาหมึกหมึกดำ', 'Inkblack Octopus', 39, 'fish', '#8a4aa8', '#5a2a78', { tr: ['octo'], f: 1, hp: 1.3, rg: 3 }, 'หนวดหมึก', 'Tentacle'],
    ['turtle', 'เต่าเกราะปะการัง', 'Coralback Turtle', 40, 'quad', '#4a9a6a', '#d87a5a', { tr: ['shell'], hp: 1.8, spd: 0.7, atk: 0.9 }, 'กระดองเต่า', 'Turtle Shell'],
    ['shark', 'ฉลามเขี้ยวเลื่อย', 'Sawtooth Shark', 41, 'fish', '#7a8ea0', '#d8e2ea', { tr: ['shark'], f: 1, atk: 1.2, spd: 1.2 }, 'ฟันฉลาม', 'Shark Tooth'],
    ['siren', 'นางเงือกขับร้อง', 'Singing Siren', 42, 'biped', '#58c8c0', '#f2a0c0', { tr: ['fem', 'fish', 'glow'], rg: 5, sk: 'rs' }, 'เกล็ดเงือก', 'Mermaid Scale'],
    ['kraken', 'ปลาหมึกยักษ์เบื้องลึก', 'Abyssal Kraken', 46, 'fish', '#6a2a8a', '#c8408a', { tr: ['octo', 'eye'], f: 1, sz: 1.8, boss: 1, rg: 3 }, 'ดวงตาเบื้องลึก', 'Abyssal Eye'],
    // ทะเลทรายสุริยะ
    ['scorpion', 'แมงป่องทรายแดง', 'Redsand Scorpion', 41, 'crab', '#c8803a', '#5a3010', { tr: ['tailsting'], atk: 1.15 }, 'เหล็กใน', 'Stinger'],
    ['sandsnake', 'งูเห่าทะเลทราย', 'Dune Cobra', 43, 'snake', '#d8b05a', '#7a5a20', { tr: ['hood'], atk: 1.2 }, 'เกล็ด', 'Scale'],
    ['vulture', 'แร้งกระหายเลือด', 'Bloodthirst Vulture', 44, 'bird', '#6a5a4a', '#e0c8a0', { tr: ['vult'], f: 1, spd: 1.3 }, 'ขนแร้ง', 'Vulture Feather'],
    ['cactus', 'กระบองเพชรจอมหนาม', 'Thorn Cactus Walker', 45, 'plant', '#4aa05a', '#f2d0e0', { tr: ['cactus'], atk: 1.1, hp: 1.3 }, 'หนามแคคตัส', 'Cactus Thorn'],
    ['sandhopper', 'ตั๊กแตนทรายยักษ์', 'Giant Sand Locust', 46, 'insect', '#e0c070', '#8a6a2a', { tr: ['wing', 'leap'], spd: 1.4 }, 'ปีก', 'Wing'],
    ['camel', 'ควายทรายโหนกคู่', 'Twin-hump Sand Ox', 47, 'quad', '#c89a5a', '#8a6a3a', { sz: 1.3, tr: ['horn', 'hump'], hp: 1.6, spd: 0.9 }, 'หนัง', 'Hide'],
    ['sandtiger', 'เสือทรายสุริยะ', 'Sunfire Sand Tiger', 49, 'quad', '#e8c070', '#7a4a1a', { sz: 1.2, tr: ['stripe', 'tail'], atk: 1.2 }, 'หนังเสือ', 'Tiger Hide'],
    ['mummy', 'มัมมี่ผ้าพันแผล', 'Bandaged Mummy', 50, 'biped', '#e0d6b8', '#8a7a58', { tr: ['wrap'], hp: 1.4, spd: 0.8 }, 'ผ้าพัน', 'Wrapping'],
    ['sandwolf', 'หมาป่าทรายสองขา', 'Sand Werejackal', 51, 'biped', '#c89a5a', '#4a3820', { tr: ['ear', 'tail', 'claw'], sz: 1.15, spd: 1.2 }, 'กรงเล็บ', 'Claw'],
    ['sanddancer', 'นางรำสายฟ้าทราย', 'Sandstorm Dancer', 52, 'biped', '#e8a02a', '#c8402e', { tr: ['dance', 'fem', 'veil'], atk: 1.15 }, 'ผ้าคลุมทอง', 'Gold Veil'],
    ['pharaoh', 'ฟาโรห์มัมมี่ทราย', 'Sand Pharaoh', 56, 'biped', '#e8d078', '#2a6a8a', { tr: ['wrap', 'crown'], sz: 1.7, boss: 1 }, 'หน้ากากทอง', 'Gold Mask'],
    // ซากโรงงานเหล็กไหม้
    ['robot', 'หุ่นยนต์ตรวจการณ์', 'Patrol Robot', 54, 'robot', '#9aa6b2', '#e8503a', { tr: ['arms', 'eyebar'] }, 'เศษเหล็ก', 'Scrap'],
    ['scrapdog', 'หมาเหล็กไล่ล่า', 'Scrapdog Hunter', 56, 'robot', '#8a92a0', '#58e0c8', { tr: ['quadbot', 'tail'], spd: 1.35 }, 'เฟือง', 'Gear'],
    ['cyberlizard', 'จิ้งจกครึ่งโรบอท', 'Half-robot Gecko', 58, 'robot', '#6ec86a', '#8a92a0', { tr: ['lizard', 'half'], atk: 1.1 }, 'วงจรหาง', 'Tail Circuit'],
    ['drone', 'โดรนยามเฝ้า', 'Sentry Drone', 59, 'robot', '#b8c2cc', '#ff4a4a', { tr: ['drone'], f: 1, rg: 5, atk: 0.9 }, 'ใบพัด', 'Rotor'],
    ['scrapboar', 'หมูป่าเหล็กหลอม', 'Moltensteel Boar', 60, 'robot', '#a0603a', '#ffb03a', { tr: ['quadbot', 'tusk'], hp: 1.4 }, 'เขี้ยวเหล็ก', 'Steel Tusk'],
    ['robobeetle', 'ด้วงเหล็กบดขยี้', 'Crusher Iron Beetle', 62, 'robot', '#5a6a7a', '#58e0c8', { tr: ['beetlebot', 'horn'], hp: 1.5, spd: 0.8 }, 'ปีกเหล็ก', 'Steel Wing'],
    ['cyberbandit', 'โจรไซเบอร์ดาบเลเซอร์', 'Laserblade Cyber Bandit', 63, 'robot', '#2f3a4a', '#ff3ab0', { tr: ['arms', 'hat', 'blade'], atk: 1.2, sk: 'rw' }, 'ชิปข้อมูล', 'Data Chip'],
    ['cyberwolf', 'หมาป่าไซเบอร์เขี้ยวไฟ', 'Firefang Cyberwolf', 64, 'robot', '#3a4a5e', '#ffb03a', { tr: ['quadbot', 'ear', 'tail'], spd: 1.4, atk: 1.2 }, 'แกนพลังงาน', 'Power Core'],
    ['mech', 'เมคเหล็กยักษ์', 'Giant Steel Mech', 66, 'robot', '#7a8696', '#ff8a2a', { tr: ['arms', 'eyebar', 'mech'], sz: 1.35, hp: 1.8, spd: 0.75 }, 'ชิ้นส่วนเมค', 'Mech Part'],
    ['megabot', 'เมก้าบอทผู้พิทักษ์', 'Megabot Guardian', 70, 'robot', '#56667a', '#ff3a3a', { tr: ['arms', 'eyebar', 'mech'], sz: 1.9, boss: 1 }, 'แกนเมก้า', 'Mega Core'],
    // ทุ่งหิมะนิรันดร์
    ['snowrabbit', 'กระต่ายหิมะตาแดง', 'Redeye Snow Hare', 68, 'quad', '#f4f8ff', '#a8c8e8', { sz: 0.8, tr: ['ear', 'tail'], spd: 1.4 }, 'ขนหิมะ', 'Snow Fur'],
    ['snowwolf', 'หมาป่าหิมะเงิน', 'Silver Snow Wolf', 70, 'quad', '#dfe8f2', '#8aa2c0', { tr: ['ear', 'tail', 'fur'], spd: 1.3 }, 'ขนหมาป่า', 'Wolf Pelt'],
    ['snowox', 'ควายหิมะขนยาว', 'Shaggy Snow Ox', 72, 'quad', '#e8eef4', '#7a8a9a', { sz: 1.35, tr: ['horn', 'fur'], hp: 1.7, spd: 0.85 }, 'หนัง', 'Hide'],
    ['mammoth', 'หมูป่าแมมมอธ', 'Mammoth Boar', 74, 'quad', '#a89078', '#f2f0e8', { sz: 1.4, tr: ['tusk', 'fur', 'mane'], hp: 1.7 }, 'งาแมมมอธ', 'Mammoth Tusk'],
    ['frostghost', 'ผีหิมะกระซิบ', 'Whispering Snow Spirit', 75, 'ghost', '#e8f4ff', '#8ac8f0', { tr: ['glow', 'hood'], rg: 4 }, 'ผลึกน้ำแข็ง', 'Ice Crystal'],
    ['yeti', 'เยติยักษ์', 'Great Yeti', 77, 'biped', '#f0f4f8', '#6a8aa8', { sz: 1.45, tr: ['fur', 'arms', 'claw'], hp: 1.7 }, 'ขนเยติ', 'Yeti Fur'],
    ['whitetiger', 'เสือขาวพายุหิมะ', 'Blizzard White Tiger', 78, 'quad', '#f2f6fa', '#4a6a8a', { sz: 1.25, tr: ['stripe', 'tail'], atk: 1.25, spd: 1.2 }, 'หนังเสือขาว', 'White Tiger Hide'],
    ['icedancer', 'นางรำน้ำแข็งเริงระบำ', 'Dancing Ice Maiden', 80, 'biped', '#a8e0ff', '#ffffff', { tr: ['dance', 'fem', 'glow', 'veil'], rg: 4, atk: 1.15 }, 'เกล็ดน้ำแข็ง', 'Ice Flake'],
    ['yetiking', 'ราชายักษ์หิมะ', 'Yeti King', 84, 'biped', '#e0eaf6', '#3a5a8a', { sz: 2.0, tr: ['fur', 'arms', 'claw', 'crown'], boss: 1 }, 'มงกุฎน้ำแข็ง', 'Ice Crown'],
    // ดันเจี้ยนเงามืด
    ['bonesoldier', 'อัศวินกระดูกนิรันดร์', 'Eternal Bone Knight', 82, 'biped', '#d6cfbc', '#3a3a52', { tr: ['bone', 'helm'], sk: 'rw', hp: 1.4 }, 'กระดูกดำ', 'Dark Bone'],
    ['shade', 'เงาทมิฬ', 'Dark Shade', 84, 'ghost', '#4a3a6e', '#b080ff', { tr: ['glow', 'hood'], rg: 4, atk: 1.2 }, 'ผงเงา', 'Shade Dust'],
    ['warspirit', 'วิญญาณนักรบพลัดถิ่น', 'Exiled Warrior Spirit', 86, 'ghost', '#c8d0ff', '#5a6ad8', { tr: ['glow', 'humanoid'], sk: 'rs', rg: 4, atk: 1.2 }, 'ผลึกนักรบ', 'Warrior Crystal'],
    ['imp', 'ปีศาจจิ๋วหางแหลม', 'Spiketail Imp', 88, 'bird', '#c8403a', '#2a1020', { sz: 0.9, tr: ['imp', 'horn', 'tail'], f: 1, rg: 4 }, 'เขาปีศาจ', 'Demon Horn'],
    ['shadowdancer', 'นางรำเงามรณะ', 'Death Shadow Dancer', 90, 'biped', '#5a3a8a', '#e04a8a', { tr: ['dance', 'fem', 'glow', 'veil'], atk: 1.25 }, 'ผ้าเงา', 'Shadow Silk'],
    ['abysstiger', 'เสืออเวจีนัยน์ตาเพลิง', 'Fireyed Abyss Tiger', 92, 'quad', '#3a2a4e', '#ff4a2a', { sz: 1.35, tr: ['stripe', 'tail', 'glow'], atk: 1.3, spd: 1.2 }, 'หนังอเวจี', 'Abyss Hide'],
    ['bonebeast', 'อสูรกระดูกแปดขา', 'Eightleg Bone Beast', 94, 'insect', '#e0d8c0', '#4a2a2a', { sz: 1.4, tr: ['bone', 'spider'], hp: 1.7 }, 'กระดูกอสูร', 'Beast Bone'],
    ['lichguard', 'ผู้พิทักษ์ลิช', 'Lich Guardian', 96, 'biped', '#6a58a8', '#b8ff80', { tr: ['crown', 'glow', 'hood'], rg: 5, sk: 'rs', atk: 1.25 }, 'ศิลาลิช', 'Lich Stone'],
    ['shadowking', 'ราชาเงามืด', 'Shadow King', 99, 'biped', '#2a1e44', '#c040ff', { tr: ['crown', 'glow', 'hood', 'arms'], sz: 2.1, boss: 1, rg: 4 }, 'มงกุฎเงา', 'Shadow Crown']
  ];
  const FAM_SPD = { blob: 2.2, quad: 3.0, biped: 2.6, bird: 3.2, snake: 2.8, insect: 3.0, fish: 2.6, crab: 2.2, ghost: 2.4, plant: 2.0, robot: 2.6 };
  const FAM_PART = { quad: ['หนัง', 'Hide'], bird: ['ขนนก', 'Feather'], insect: ['ปีก', 'Wing'], snake: ['เกล็ด', 'Scale'], fish: ['เกล็ด', 'Scale'], crab: ['กระดอง', 'Shell'], ghost: ['ผงวิญญาณ', 'Ectoplasm'], plant: ['สปอร์', 'Spore'], robot: ['เศษเหล็ก', 'Scrap'], biped: ['เศษซาก', 'Remnant'], blob: ['วุ้น', 'Gel'] };
  const nextExpF = lv => Math.round(20 * Math.pow(lv, 1.6));
  const HEAL_BY = [[8, 'herb'], [20, 'tonic'], [35, 'elixir'], [55, 'panacea'], [75, 'nectar'], [999, 'nectar2']];
  const MP_BY = [[20, 'dew'], [45, 'dew2'], [75, 'dew3'], [999, 'dew4']];
  const tierOf = lv => (lv < 10 ? 0 : lv < 28 ? 1 : lv < 50 ? 2 : lv < 72 ? 3 : 4);
  const pick = (tbl, lv) => { for (const r of tbl) if (lv < r[0]) return r[1]; return tbl[tbl.length - 1][1]; };

  // สร้างตารางมอนสเตอร์ + ไอเท็มวัตถุดิบ
  const MONX = {}, MITEMS = {}, MART = {}, NAMES = [];
  for (const r of MROWS) {
    const [key, th, en, lv, fam, c1, c2, o, ptTh, ptEn] = r;
    const boss = !!o.boss;
    const hp = Math.round((30 + 0.3 * lv * lv + 8 * lv) * (o.hp || 1) * (boss ? 9 : 1));
    const am = (2 + 1.5 * lv) * (o.atk || 1) * (boss ? 1.5 : 1);
    const exp = Math.round(nextExpF(lv) / (8 + lv * 0.35) * (o.hp ? Math.sqrt(o.hp) : 1) * (boss ? 14 : 1));
    const mid = 'm_' + key, drops = [['coin', 1, [Math.round(3 + lv * 2.2) * (boss ? 6 : 1), Math.round(8 + lv * 4) * (boss ? 6 : 1)]]];
    drops.push([mid, boss ? 0.8 : 0.55, boss ? [2, 3] : [1, 2]]);
    drops.push([pick(HEAL_BY, lv), boss ? 0.8 : 0.14, boss ? [2, 4] : [1, 2]]);
    if (lv >= 8) drops.push([pick(MP_BY, lv), boss ? 0.6 : 0.09, [1, 2]]);
    drops.push(['@gear', boss ? 0.5 : 0.03, [tierOf(lv + (boss ? 6 : 0))]]);
    if (boss) drops.push(['bm_' + key, 1, [1, 1]]);
    MONX[key] = {
      name: th, en, lv, hp, atk: [Math.max(2, Math.round(am * 0.78)), Math.max(3, Math.round(am * 1.22))],
      atkCd: boss ? 1.6 : (fam === 'ghost' || o.rg ? 1.9 : 1.3), speed: Math.round((FAM_SPD[fam] || 2.6) * (o.spd || 1) * 10) / 10,
      exp, respawn: boss ? 240 : Math.min(40, Math.round(14 + lv * 0.28)), drops, boss: boss ? 1 : 0, rg: o.rg || 0, sk: o.sk || '', fly: o.f ? 1 : 0
    };
    const part = o.pt ? o.pt : (ptTh ? [ptTh, ptEn] : FAM_PART[fam]);
    MITEMS[mid] = { name: part[0] + th, en: en + ' ' + part[1], desc: 'วัตถุดิบที่ได้จาก' + th + ' พ่อค้ารับซื้อเสมอ', sell: Math.round(3 + lv * 1.7) };
    if (boss) MITEMS['bm_' + key] = { name: 'ตรา' + th, en: 'Mark of ' + en, desc: 'ตราประจำตัวของ' + th + ' ใช้เป็นหลักฐานพิสูจน์ฝีมือ', sell: Math.round(lv * 30) };
    MART[key] = { fam, c1, c2, sz: o.sz || 1, tr: o.tr || [], boss: boss ? 1 : 0, f: o.f ? 1 : 0, rg: o.rg || 0, sk: o.sk || '' };
    NAMES.push([th, en]);
  }
  // ศิลปะของมอนสเตอร์เดิม (วาดด้วยโค้ดเฉพาะ)
  MART.slime = { fam: 'slime', c1: '#b9ec8e', c2: '#6fb85a', sz: 1, tr: [], boss: 0, f: 0, rg: 0, sk: '' };
  MART.boar = { fam: 'boar', c1: '#7a5334', c2: '#4f321d', sz: 1, tr: [], boss: 0, f: 0, rg: 0, sk: '' };
  // ยาและของใช้เพิ่มเติม (heal = เลือด, mp = มานา)
  const EXTRA_ITEMS = {
    elixir: { name: 'ยาอายุวัฒนะ', en: 'Elixir of Vigor', desc: 'ยาต้มเข้มข้น ฟื้นเลือด 300', heal: 300, buy: 220, sell: 60 },
    panacea: { name: 'ยาสารพัดนึก', en: 'Panacea', desc: 'ยาวิเศษจากสมุนไพรหายาก ฟื้นเลือด 800', heal: 800, buy: 600, sell: 170 },
    nectar: { name: 'น้ำทิพย์เทวา', en: 'Divine Nectar', desc: 'น้ำทิพย์ศักดิ์สิทธิ์ ฟื้นเลือด 2000', heal: 2000, buy: 1500, sell: 420 },
    nectar2: { name: 'น้ำทิพย์มหาเทพ', en: 'Supreme Nectar', desc: 'น้ำทิพย์ชั้นสูงสุด ฟื้นเลือด 5000', heal: 5000, buy: 4000, sell: 1100 },
    dew: { name: 'น้ำค้างกลางคืน', en: 'Night Dew', desc: 'น้ำค้างหอมเย็น ฟื้น MP 50', mp: 50, buy: 60, sell: 16 },
    dew2: { name: 'น้ำค้างจันทร์เพ็ญ', en: 'Full Moon Dew', desc: 'น้ำค้างเข้มข้น ฟื้น MP 150', mp: 150, buy: 180, sell: 50 },
    dew3: { name: 'น้ำค้างดวงดารา', en: 'Stardust Dew', desc: 'น้ำค้างจากดวงดาว ฟื้น MP 400', mp: 400, buy: 500, sell: 140 },
    dew4: { name: 'น้ำค้างจักรวาล', en: 'Cosmic Dew', desc: 'น้ำค้างจากขอบจักรวาล ฟื้น MP 1000', mp: 1000, buy: 1300, sell: 360 }
  };
  const ITEMS_X = Object.assign({}, EXTRA_ITEMS, MITEMS);
  for (const k of Object.keys(EXTRA_ITEMS)) NAMES.push([EXTRA_ITEMS[k].name, EXTRA_ITEMS[k].en]);
  for (const k of Object.keys(MITEMS)) NAMES.push([MITEMS[k].name, MITEMS[k].en]);
  const MON_ZONE = {};   // key -> โซนที่เกิด (เติมตอนสร้างแมพ)

  /* ------------------------------------------------------------- ตัวสร้างแมพ */
  const GATE_BOX = { N: [18, 0, 4, 7], S: [18, 25, 4, 7], W: [0, 14, 7, 4], E: [33, 14, 7, 4] };
  function Builder(zone, seed) {
    const z = ZD[zone], R = rng(seed || 1), I = (x, y) => y * W + x;
    const tiles = new Uint8Array(W * H), solid = new Uint8Array(W * H), prot = new Uint8Array(W * H), objs = [], npcs = [];
    const depth = (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y);
    const B = {
      R, I, tiles, solid, objs, npcs, prot, depth, theme: z.theme, zone,
      fill(t, x0, y0, w, h, sol) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inb(x, y)) { tiles[I(x, y)] = t; if (sol != null) solid[I(x, y)] = sol; } return B; },
      ellipse(t, cx, cy, rx, ry, sol) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy < 1) { tiles[I(x, y)] = t; if (sol != null) solid[I(x, y)] = sol; }
        }
        return B;
      },
      seg(x0, y0, x1, y1, wd, t) {   // เส้นทาง (กว้าง wd ช่อง) — ไม่ทับน้ำ
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
          for (let a = 0; a < wd; a++) for (let b = 0; b < wd; b++) {
            const xx = x + a - ((wd - 1) >> 1), yy = y + b - ((wd - 1) >> 1);
            if (inb(xx, yy) && tiles[I(xx, yy)] !== T.WATER && tiles[I(xx, yy)] !== T.BRIDGE) { tiles[I(xx, yy)] = t == null ? T.PATH : t; solid[I(xx, yy)] = 0; }
          }
        }
        return B;
      },
      free(x0, y0, w, h) {
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
          if (!inb(x, y)) return false;
          const i = I(x, y);
          if (solid[i] || tiles[i] === T.WATER || tiles[i] === T.VOID) return false;
        }
        return true;
      },
      occupy(x0, y0, w, h) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inb(x, y)) solid[I(x, y)] = 1; },
      bld(kind, x, y, w, h, name, extra) {
        if (!B.free(x, y, w, h)) { if (STRICT) throw new Error(zone + ': building ' + kind + ' at ' + x + ',' + y + ' overlaps'); return B; }
        objs.push(Object.assign({ type: 'building', kind, x, y, w, h }, name ? { name } : null, extra)); B.occupy(x, y, w, h); return B;
      },
      prop(kind, x, y, w, h, extra) {
        w = w || 1; h = h || 1;
        if (!B.free(x, y, w, h)) { if (STRICT) throw new Error(zone + ': prop ' + kind + ' at ' + x + ',' + y + ' overlaps'); return B; }
        objs.push(Object.assign({ type: 'prop', kind, x, y, w, h }, extra)); B.occupy(x, y, w, h); return B;
      },
      tryProp(kind, x, y, w, h, extra) { if (!B.free(x, y, w, h)) return false; objs.push(Object.assign({ type: 'prop', kind, x, y, w, h }, extra)); B.occupy(x, y, w, h); return true; },
      deco(kind, x, y, w, h, extra) {   // ของตกแต่งที่เดินผ่านได้ (ไม่กันทาง)
        objs.push(Object.assign({ type: 'prop', kind, x, y, w: w || 1, h: h || 1, walk: 1 }, extra)); return B;
      },
      tree(x, y, v) { if (!B.free(x, y, 1, 1)) return false; objs.push({ type: 'tree', x, y, w: 1, h: 1, v }); solid[I(x, y)] = 1; return true; },
      npc(id, name, x, y, look, lines, extra) {
        if (STRICT && (!inb(x, y) || tiles[I(x, y)] === T.WATER || tiles[I(x, y)] === T.VOID || solid[I(x, y)])) throw new Error(zone + ': npc ' + id + ' bad cell ' + x + ',' + y);
        npcs.push(Object.assign({ id, name, x, y, look: look || { o: 0, h: 0, c: 0 }, lines: lines || [] }, extra)); solid[I(x, y)] = 1; return B;
      },
      gate(side, t) {   // เปิดทางเข้า-ออกและวางประตูวาร์ป
        const bx = GATE_BOX[side];
        for (let y = bx[1]; y < bx[1] + bx[3]; y++) for (let x = bx[0]; x < bx[0] + bx[2]; x++) {
          tiles[I(x, y)] = t == null ? T.PATH : t; solid[I(x, y)] = 0; prot[I(x, y)] = 1;
        }
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i];
          if (o.x < bx[0] + bx[2] && o.x + o.w > bx[0] && o.y < bx[1] + bx[3] && o.y + o.h > bx[1]) objs.splice(i, 1);
        }
        return B;
      },
      protect() {   // กันต้นไม้ทับถนน อาคาร และบริเวณรอบ ๆ
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const t = tiles[I(x, y)];
          if (t === T.PATH || t === T.STONE || t === T.BRIDGE || solid[I(x, y)]) {
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, y + dy)) prot[I(x + dx, y + dy)] = 1;
          }
        }
        return B;
      },
      // โปรยต้นไม้/หิน: เข้มตามขอบ บางลงด้านใน  edge=[d<2,d<3,d<4], inner=ความหนาแน่นด้านใน, vs=น้ำหนักแบบต้นไม้
      scatter(edge, inner, vs, keep) {
        B.protect();
        const tot = vs.reduce((a, b) => a + b, 0);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = I(x, y);
          if (solid[i] || tiles[i] === T.WATER || tiles[i] === T.VOID || tiles[i] === T.BRIDGE) continue;
          if (keep && keep(x, y)) continue;
          const d = depth(x, y), t = tiles[i];
          if (B.gateAt(x, y)) continue;
          if (d >= 2 && (prot[i] || t === T.PATH || t === T.STONE)) continue;
          const p = d < 2 ? edge[0] : d < 3 ? edge[1] : d < 4 ? edge[2] : inner;
          if (R() >= p) continue;
          let r = R() * tot, v = 0; while (r > vs[v] && v < vs.length - 1) { r -= vs[v]; v++; }
          B.tree(x, y, v);
        }
        return B;
      },
      gateAt(x, y) { for (const s of Object.keys(B.gates)) { const b = GATE_BOX[s]; if (x >= b[0] && x < b[0] + b[2] && y >= b[1] && y < b[1] + b[3]) return true; } return false; },
      border(t, sol) {   // ผนังกั้นขอบแมพ (VOID/WATER) เว้นประตู
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (depth(x, y) < 2 && !B.gateAt(x, y)) { tiles[I(x, y)] = t; solid[I(x, y)] = sol == null ? 1 : sol; }
        return B;
      },
      finish(opts) {
        opts = opts || {};
        const portals = portalsFor(zone);
        for (const p of portals) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
          solid[I(x, y)] = 0; if (tiles[I(x, y)] === T.WATER || tiles[I(x, y)] === T.VOID) tiles[I(x, y)] = T.PATH;
        }
        return { name: zone, theme: z.theme, W, H, tiles, solid, objs, npcs, spawn: opts.spawn || [], spawns: opts.spawns || [], riverC: null, portals, fixedHour: opts.fixedHour == null ? null : opts.fixedHour };
      }
    };
    B.gates = {};
    B.openGates = function (t) { for (const e of EXITS[zone]) { B.gates[e.side] = 1; B.gate(e.side, t); } return B; };
    return B;
  }
  // ถนนเชื่อมทุกประตูเข้าศูนย์กลาง
  function roadsToCenter(B, cx, cy, wd, t) {
    for (const e of EXITS[B.zone]) {
      const s = e.side;
      const gx = s === 'W' ? 1 : s === 'E' ? 38 : 19.5, gy = s === 'N' ? 1 : s === 'S' ? 30 : 15.5;
      B.seg(Math.round(gx), Math.round(gy), cx, cy, wd, t);
    }
  }
  const rectCells = (B, x0, y0, x1, y1) => { const s = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y) && !B.solid[B.I(x, y)] && B.tiles[B.I(x, y)] !== T.WATER && B.tiles[B.I(x, y)] !== T.VOID) s.push([x, y]); return s; };

  /* ------------------------------------------------------------- NPC */
  const NPCINFO = {};   // id -> { zone, role, town, name, en }
  const ROLE_LINES = {
    mayor: [['ยินดีต้อนรับสู่เมืองของเรา', 'Welcome to our town.'], ['ถ้าเลือดหมดก็กลับมาพักที่นี่ได้เสมอ', 'If your health runs dry, you can always rest here.']],
    potion: [['ยาดี ราคาถูก เชิญเลือกชมก่อนครับ', 'Good potions at fair prices. Take a look!'], ['ออกไปล่าสัตว์อย่าลืมพกยานะ', 'Never go hunting without potions.']],
    smith: [['ดาบดี เกราะแกร่ง มาดูก่อนได้นะ', 'Fine blades and sturdy armor — have a look.'], ['เหล็กต้องตีตอนยังร้อน', 'Strike while the iron is hot.']],
    inn: [['ห้องพักว่างอยู่นะ นั่งพักก่อนไหม', 'Rooms are free. Care to sit and rest?'], ['เรื่องเล่าจากนักเดินทางมีให้ฟังทุกคืน', 'Travelers tell new tales here every night.']],
    guard: [['ผ่านได้ แต่อย่าก่อเรื่อง', 'You may pass, but cause no trouble.'], ['ข้านั่งเฝ้าทั้งวันทั้งคืน', 'I keep watch day and night.']],
    master: [['ผู้ที่พร้อมจะก้าวขึ้นไป ต้องพิสูจน์ตนเองก่อน', 'Those who wish to rise must first prove themselves.'], ['เส้นทางอาชีพไม่ได้ได้มาง่าย ๆ', 'A new path is never handed over for free.']],
    scholar: [['ความรู้คือพลังที่ใหญ่ที่สุด', 'Knowledge is the greatest power.'], ['โลกนี้กว้างกว่าที่เจ้าคิด', 'The world is wider than you think.']],
    merchant: [['ของแปลก ๆ จากทั่วทุกแห่งหน', 'Curious wares from every corner of the world.'], ['ซื้อมาขายไป กำไรงาม', 'Buy low, sell high.']],
    villager: [['วันนี้อากาศดีนะ', 'Lovely weather today.'], ['ระวังมอนสเตอร์นอกเมืองด้วยนะ', 'Beware the monsters outside town.']]
  };
  function NP(B, id, name, en, x, y, look, role, town) {
    const lines = ROLE_LINES[role].map(l => l[0]);
    B.npc(id, name, x, y, look, lines, { role });
    NPCINFO[id] = { zone: B.zone, role, name, en };
    NAMES.push([name, en]);
  }
  for (const r of Object.keys(ROLE_LINES)) for (const l of ROLE_LINES[r]) NAMES.push([l[0], l[1]]);
  const BNAMES = [];
  const bn = (th, en) => { BNAMES.push([th, en]); return th; };
  const LK = (o, h, c) => ({ o, h, c });

  /* ------------------------------------------------------------- เมือง */
  const SPEC = {};

  SPEC.rosen = function () {
    const B = Builder('rosen', 2201).openGates(T.PATH);
    B.seg(1, 15, 38, 15, 2, T.PATH); B.seg(19, 17, 19, 30, 2, T.PATH);
    B.ellipse(T.STONE, 20, 16, 6.5, 5);
    B.ellipse(T.WATER, 34, 6.5, 3, 2.2, 1);
    B.prop('fountain', 19, 15, 2, 2);
    B.bld('tavern', 3, 5, 6, 4, bn('โรงเตี๊ยมกุหลาบแดง', 'Red Rose Tavern'));
    B.bld('guild', 13, 2, 8, 5, bn('สมาคมนักผจญภัย', 'Adventurers Guild'));
    B.bld('church', 26, 3, 5, 5, bn('โบสถ์เซนต์โรส', "St. Rose's Chapel"));
    B.bld('house', 3, 10, 3, 3); B.bld('house', 8, 10, 3, 3, null, { v: 1 }); B.bld('house', 34, 10, 3, 3, null, { v: 2 });
    B.bld('shop', 5, 19, 4, 3, bn('ร้านยาเฮอร์บาล', 'Herbal Apothecary'));
    B.bld('smith', 11, 19, 5, 4, bn('ช่างเหล็กไอรอนเฮิร์ธ', 'Ironhearth Smithy'));
    B.bld('hall', 24, 19, 5, 4, bn('หอสมุดเมือง', 'Town Library'));
    B.bld('house', 31, 19, 3, 3, null, { v: 1 }); B.bld('house', 4, 25, 3, 3); B.bld('house', 9, 25, 3, 3, null, { v: 2 });
    B.bld('house', 25, 25, 3, 3, null, { v: 1 }); B.bld('house', 31, 25, 3, 3);
    B.bld('tower', 13, 25, 3, 4, bn('หอนาฬิกา', 'Clock Tower'));
    [[8, 14], [13, 14], [27, 14], [32, 14], [17, 18], [23, 18], [7, 18], [30, 18]].forEach(p => B.prop('lamp', p[0], p[1], 1, 1));
    [[23, 10], [22, 8], [10, 8]].forEach(p => B.prop('bench', p[0], p[1], 1, 1));
    B.prop('stall', 14, 12, 2, 1, { v: 0 }); B.prop('stall', 24, 12, 2, 1, { v: 1 });
    B.scatter([1, 0.8, 0.45], 0.05, [5, 2, 2, 2], (x, y) => B.prot[B.I(x, y)] && B.depth(x, y) >= 2);
    const sp = rectCells(B, 16, 13, 24, 19);
    NP(B, 'ro_mayor', 'นายกเทศมนตรีรอสโซ่', 'Mayor Rosso', 17, 13, LK(5, 2, 2), 'mayor');
    NP(B, 'ro_inn', 'เถ้าแก่โรงเตี๊ยมกุหลาบ', 'Rose Tavern Keeper', 5, 9, LK(0, 0, 0), 'inn');
    NP(B, 'ro_potion', 'เภสัชกรลิลลี่', 'Apothecary Lilly', 6, 22, LK(3, 3, 1), 'potion');
    NP(B, 'ro_smith', 'ช่างตีเหล็กกรอม', 'Smith Grom', 13, 23, LK(2, 0, 0), 'smith');
    NP(B, 'ro_q1', 'นักเขียนแผนที่เอ็ดการ์', 'Cartographer Edgar', 27, 13, LK(1, 1, 3), 'scholar');
    NP(B, 'ro_q2', 'ซิสเตอร์มารีย์', 'Sister Marie', 28, 9, LK(4, 3, 2), 'villager');
    NP(B, 'ro_q3', 'บรรณารักษ์ฟินน์', 'Librarian Finn', 26, 23, LK(3, 1, 0), 'scholar');
    NP(B, 'ro_guard', 'ทหารเฝ้าประตูตะวันตก', 'West Gate Guard', 5, 14, LK(5, 2, 0), 'guard');
    const JM1 = [['sw', 'ครูฝึกดาบเซอร์ไรเนอร์', 'Sword Instructor Sir Rainer', LK(5, 0, 0)], ['th', 'หัวหน้าตรอกมืดเวสป้า', 'Alley Boss Vespa', LK(2, 3, 3)], ['ar', 'นายพรานฮันเตอร์', 'Huntmaster Hunter', LK(1, 2, 1)], ['ma', 'เมจเจ้าสำนักอัลวิน', 'Archmage Alvin', LK(3, 1, 2)], ['ac', 'บาทหลวงโธมัส', 'Father Thomas', LK(4, 0, 2)]];
    JM1.forEach((j, i) => NP(B, 'jm_' + j[0] + '1', j[1], j[2], 12 + i * 2, 8, j[3], 'master'));
    return B.finish({ spawn: sp });
  };

  SPEC.treehouse = function () {
    const B = Builder('treehouse', 3303).openGates(T.PATH);
    B.seg(1, 15, 38, 15, 2, T.PATH);
    B.ellipse(T.PATH, 20, 12, 7, 5);
    B.fill(T.WATER, 2, 22, 36, 2, 1);   // ลำธาร
    B.fill(T.BRIDGE, 11, 22, 2, 2, 0); B.fill(T.BRIDGE, 27, 22, 2, 2, 0);
    B.seg(12, 16, 12, 21, 2, T.PATH); B.seg(28, 16, 28, 21, 2, T.PATH);
    B.prop('gianttree', 17, 7, 6, 5);
    B.bld('treehut', 4, 5, 5, 4, bn('กระท่อมพักแรมใบเฟิร์น', 'Fern Rest Hut'));
    B.bld('treehut', 11, 4, 4, 4, bn('ร้านสมุนไพรป่าลึก', 'Deepwood Herbalist'), { v: 1 });
    B.bld('treehut', 26, 4, 5, 4, bn('ช่างตีเหล็กรากไม้', 'Rootforge Smithy'), { v: 2 });
    B.bld('treehut', 33, 8, 4, 4, bn('บ้านผู้เฒ่าแห่งป่า', "Forest Elder's Home"), { v: 1 });
    B.bld('treehut', 4, 11, 3, 3, null, { v: 2 }); B.bld('treehut', 25, 10, 3, 3);
    B.bld('treehut', 4, 25, 4, 3, bn('ที่ทำการเหล่านักธนู', 'Archers Lodge'), { v: 1 });
    B.bld('treehut', 15, 25, 4, 4, null, { v: 2 }); B.bld('treehut', 24, 25, 4, 3); B.bld('treehut', 32, 25, 4, 3, null, { v: 1 });
    B.prop('stall', 7, 17, 2, 1, { v: 0 }); B.prop('stall', 31, 17, 2, 1, { v: 1 });
    [[9, 14], [31, 14], [15, 19], [23, 19], [10, 20], [30, 20]].forEach(p => B.prop('lamp', p[0], p[1], 1, 1));
    B.scatter([1, 0.85, 0.5], 0.07, [4, 2, 3, 2], (x, y) => B.prot[B.I(x, y)] && B.depth(x, y) >= 2);
    const sp = rectCells(B, 16, 13, 24, 18);
    NP(B, 'tr_mayor', 'ผู้เฒ่าไอริน', 'Elder Irin', 22, 14, LK(5, 2, 3), 'mayor');
    NP(B, 'tr_inn', 'เจ้าของกระท่อมพักแรม', 'Hut Keeper', 6, 9, LK(0, 1, 1), 'inn');
    NP(B, 'tr_potion', 'หมอยาป่าฟีโอน่า', 'Herbalist Fiona', 13, 8, LK(3, 3, 2), 'potion');
    NP(B, 'tr_smith', 'ช่างตีเหล็กโอ๊ค', 'Smith Oak', 28, 8, LK(2, 0, 1), 'smith');
    NP(B, 'tr_q1', 'หมอสมุนไพรเมย์', 'Healer May', 9, 18, LK(3, 2, 0), 'villager');
    NP(B, 'tr_q2', 'พรานป่าแจ็ค', 'Ranger Jack', 31, 18, LK(1, 0, 2), 'villager');
    NP(B, 'tr_q3', 'เด็กน้อยผู้หลงทางนิโก้', 'Lost Boy Niko', 20, 19, LK(1, 3, 1), 'villager');
    NP(B, 'jm_ar2', 'ปรมาจารย์ธนูเอลเดอร์', 'Archery Master Elder', 6, 28, LK(1, 2, 3), 'master');
    return B.finish({ spawn: sp });
  };

  SPEC.thai = function () {
    const B = Builder('thai', 4407).openGates(T.PATH);
    B.fill(T.WATER, 2, 22, 36, 2, 1);   // คลอง
    B.fill(T.BRIDGE, 19, 22, 2, 2, 0); B.fill(T.BRIDGE, 7, 22, 2, 2, 0); B.fill(T.BRIDGE, 31, 22, 2, 2, 0);
    B.seg(1, 15, 38, 15, 2, T.PATH); B.seg(19, 17, 19, 30, 2, T.PATH);
    B.seg(7, 16, 7, 28, 2, T.PATH); B.seg(31, 16, 31, 28, 2, T.PATH);
    B.fill(T.WATER, 30, 4, 7, 4, 1);    // สระบัว
    B.bld('wat', 12, 2, 8, 6, bn('วัดศรีสยามาราม', 'Wat Si Siamaram'));
    B.bld('stilt', 3, 4, 5, 4, bn('เรือนไทยสุขใจ', 'Suk Jai Inn'));
    B.bld('stilt', 23, 4, 5, 4, bn('ร้านสมุนไพรไทย', 'Thai Herbal Shop'), { v: 1 });
    B.bld('stilt', 3, 10, 4, 3, null, { v: 2 }); B.bld('stilt', 9, 10, 4, 3); B.bld('stilt', 25, 10, 4, 3, null, { v: 1 }); B.bld('stilt', 32, 10, 4, 3, null, { v: 2 });
    B.bld('stilt', 11, 18, 5, 3, bn('โรงตีเหล็กลายกนก', 'Kanok Smithy'), { v: 1 });
    B.bld('stilt', 23, 18, 5, 3, bn('สำนักมวยไทยเจ้าพายุ', 'Storm Muay Thai Gym'), { v: 2 });
    B.bld('stilt', 3, 18, 3, 3); B.bld('stilt', 33, 18, 4, 3);
    B.bld('stilt', 3, 26, 3, 3, null, { v: 2 }); B.bld('stilt', 22, 26, 4, 3); B.bld('stilt', 33, 26, 4, 3, null, { v: 1 });
    B.deco('boat', 4, 22, 2, 1, { v: 0 }); B.deco('boat', 13, 23, 2, 1, { v: 1 }); B.deco('boat', 24, 22, 2, 1, { v: 2 }); B.deco('boat', 35, 23, 2, 1, { v: 0 });
    B.prop('stall', 14, 13, 2, 1, { v: 0 }); B.prop('stall', 25, 13, 2, 1, { v: 1 });
    [[9, 14], [17, 14], [26, 14], [34, 14], [17, 20], [22, 20], [9, 20]].forEach(p => B.prop('lamp', p[0], p[1], 1, 1));
    B.scatter([1, 0.8, 0.4], 0.06, [4, 3, 3, 1], (x, y) => B.prot[B.I(x, y)] && B.depth(x, y) >= 2);
    const sp = rectCells(B, 16, 12, 24, 19);
    NP(B, 'th_mayor', 'กำนันสมศักดิ์', 'Headman Somsak', 17, 17, LK(5, 0, 2), 'mayor');
    NP(B, 'th_inn', 'ป้าแจ่มเจ้าของเรือนไทย', 'Auntie Jaem', 5, 9, LK(3, 3, 3), 'inn');
    NP(B, 'th_potion', 'หมอยาไทยลุงเปี๊ยก', 'Thai Healer Piak', 25, 9, LK(0, 0, 3), 'potion');
    NP(B, 'th_smith', 'ช่างเหล็กลุงทอง', 'Smith Thong', 13, 21, LK(2, 0, 0), 'smith');
    NP(B, 'th_q1', 'แม่ค้าเรือป้าพร', 'Boat Vendor Porn', 18, 21, LK(3, 2, 2), 'merchant');
    NP(B, 'th_q2', 'พระอาจารย์ธรรมโชติ', 'Abbot Thammachot', 14, 9, LK(4, 3, 3), 'villager');
    NP(B, 'th_q3', 'ชาวประมงตาเขียว', 'Fisher Khiao', 8, 24, LK(1, 0, 1), 'villager');
    NP(B, 'jm_th2', 'ปรมาจารย์เงาราตรี', 'Shadow Master Night', 29, 21, LK(2, 3, 3), 'master');
    NP(B, 'jm_ac2', 'ผู้ปกครองอารามแห่งแสง', 'Abbot of Radiant Temple', 25, 21, LK(4, 0, 2), 'master');
    return B.finish({ spawn: sp });
  };

  SPEC.oasis = function () {
    const B = Builder('oasis', 5509).openGates(T.PATH);
    B.seg(1, 15, 38, 15, 2, T.PATH); B.seg(20, 9, 20, 14, 2, T.PATH);
    B.ellipse(T.WATER, 20, 21.5, 5, 3.2, 1);
    B.ellipse(T.STONE, 20, 21.5, 7, 4.8);
    B.ellipse(T.WATER, 20, 21.5, 5, 3.2, 1);
    B.bld('adobe', 4, 5, 6, 4, bn('โรงแรมคาราวานทราย', 'Sand Caravan Inn'));
    B.bld('ziggurat', 15, 2, 9, 6, bn('วิหารสุริยะ', 'Temple of the Sun'));
    B.bld('adobe', 28, 5, 5, 3, bn('ร้านยาแห่งโอเอซิส', 'Oasis Apothecary'), { v: 1 });
    B.bld('adobe', 3, 10, 3, 3); B.bld('adobe', 9, 10, 3, 3, null, { v: 1 }); B.bld('adobe', 34, 10, 3, 3, null, { v: 2 }); B.bld('adobe', 30, 10, 3, 3);
    B.bld('arena', 3, 19, 7, 5, bn('สนามประลองสุริยะ', 'Sunfire Arena'));
    B.bld('adobe', 10, 17, 4, 3, bn('โรงตีเหล็กทรายร้อน', 'Hotsand Forge'), { v: 1 });
    B.bld('hall', 29, 19, 7, 5, bn('หอปราชญ์ทราย', 'Sand Sages Hall'));
    B.bld('adobe', 25, 26, 4, 3, null, { v: 2 }); B.bld('adobe', 5, 26, 4, 3); B.bld('adobe', 12, 26, 4, 3, null, { v: 1 }); B.bld('adobe', 32, 27, 4, 3);
    B.prop('tent', 22, 11, 3, 2, { v: 0 }); B.prop('tent', 26, 11, 3, 2, { v: 1 }); B.prop('tent', 11, 13, 3, 1, { v: 2 });
    B.prop('stall', 14, 12, 2, 1, { v: 0 }); B.prop('stall', 30, 13, 2, 1, { v: 1 });
    B.prop('statue', 19, 9, 2, 2);
    [[8, 14], [14, 17], [26, 17], [34, 14], [18, 8], [22, 8]].forEach(p => B.prop('lamp', p[0], p[1], 1, 1));
    B.scatter([1, 0.8, 0.5], 0.03, [5, 2, 1, 1], (x, y) => B.prot[B.I(x, y)] && B.depth(x, y) >= 2);
    // ปาล์มรอบบ่อน้ำ
    [[14, 21], [26, 22], [16, 25], [24, 25], [15, 18], [25, 18]].forEach(p => B.tree(p[0], p[1], 0));
    const sp = rectCells(B, 16, 13, 25, 17);
    NP(B, 'oa_mayor', 'เจ้าเมืองโอเอซิสซาฮีร์', 'Emir Zahir', 22, 14, LK(5, 2, 1), 'mayor');
    NP(B, 'oa_inn', 'เจ้าของโรงแรมคาราวาน', 'Caravan Innkeeper', 6, 9, LK(0, 0, 3), 'inn');
    NP(B, 'oa_potion', 'พ่อค้ายาลีล่า', 'Potion Merchant Leila', 30, 8, LK(3, 3, 2), 'potion');
    NP(B, 'oa_smith', 'ช่างตีเหล็กคาลิด', 'Smith Khalid', 12, 20, LK(2, 0, 0), 'smith');
    NP(B, 'oa_q1', 'พ่อค้าอูฐฮัสซัน', 'Camel Trader Hassan', 18, 12, LK(1, 1, 3), 'merchant');
    NP(B, 'oa_q2', 'นักโบราณคดีอานา', 'Archaeologist Ana', 21, 9, LK(3, 2, 0), 'scholar');
    NP(B, 'oa_q3', 'เด็กตักน้ำโอมาร์', 'Water Boy Omar', 27, 17, LK(1, 3, 2), 'villager');
    NP(B, 'jm_sw2', 'ผู้คุมสนามประลองบาฮิร์', 'Arena Warden Bahir', 6, 24, LK(5, 0, 1), 'master');
    NP(B, 'jm_ma2', 'จอมปราชญ์ทรายซาลิม', 'Sand Sage Salim', 32, 24, LK(3, 1, 3), 'master');
    return B.finish({ spawn: sp });
  };

  SPEC.neon = function () {
    const B = Builder('neon', 6611).openGates(T.STONE);
    B.fill(T.STONE, 1, 15, 38, 2); B.fill(T.STONE, 19, 8, 2, 8); B.fill(T.STONE, 19, 17, 2, 6);
    B.fill(T.STONE, 14, 11, 12, 10);
    B.fill(T.PATH, 2, 24, 36, 2); B.fill(T.PATH, 5, 8, 30, 1);
    B.bld('tower', 3, 3, 6, 4, bn('โรงแรมแคปซูลโมเสส', 'Moses Capsule Hotel'), { v: 0 });
    B.bld('tower', 11, 3, 5, 4, bn('ร้านยานาโน', 'Nano Pharmacy'), { v: 1 });
    B.bld('tower', 22, 2, 5, 5, bn('เวิร์คช็อปไซเบอร์', 'Cyber Workshop'), { v: 2 });
    B.bld('tower', 29, 1, 7, 6, bn('หอคอยเมกะคอร์ป', 'MegaCorp Tower'), { v: 3 });
    B.bld('tower', 2, 10, 4, 4, null, { v: 1 }); B.bld('tower', 8, 10, 4, 4, null, { v: 2 }); B.bld('tower', 28, 10, 4, 4, null, { v: 0 }); B.bld('tower', 34, 10, 4, 4, null, { v: 3 });
    B.bld('tower', 3, 18, 6, 5, bn('ศูนย์แฮ็กเกอร์ใต้ดิน', 'Underground Hacker Den'), { v: 2 });
    B.bld('tower', 10, 18, 4, 5, null, { v: 1 });
    B.bld('tower', 26, 18, 6, 5, bn('คลังวัตถุโบราณ', 'Relic Vault'), { v: 0 });
    B.bld('tower', 33, 18, 4, 5, null, { v: 3 });
    B.bld('tower', 4, 27, 5, 3, null, { v: 1 }); B.bld('tower', 11, 27, 4, 3, null, { v: 2 }); B.bld('tower', 24, 27, 5, 3, null, { v: 0 }); B.bld('tower', 31, 27, 5, 3, null, { v: 3 });
    B.prop('holo', 19, 12, 2, 2);
    B.prop('stall', 15, 13, 2, 1, { v: 1 }); B.prop('stall', 23, 13, 2, 1, { v: 0 });
    [[9, 14], [13, 14], [27, 14], [31, 14], [13, 17], [26, 17], [17, 23], [22, 23]].forEach(p => B.prop('lamp', p[0], p[1], 1, 1));
    B.scatter([1, 0.6, 0.3], 0.0, [3, 3, 2, 2], (x, y) => B.depth(x, y) >= 2);
    const sp = rectCells(B, 16, 13, 24, 19);
    NP(B, 'ne_mayor', 'ผู้ว่าการเมืองเอไอ-7', 'Governor AI-7', 17, 17, LK(5, 2, 3), 'mayor');
    NP(B, 'ne_inn', 'พนักงานต้อนรับแคปซูล', 'Capsule Receptionist', 5, 8, LK(0, 3, 2), 'inn');
    NP(B, 'ne_potion', 'เภสัชกรนาโนมิ', 'Nano Pharmacist Nanomi', 13, 8, LK(3, 1, 1), 'potion');
    NP(B, 'ne_smith', 'ช่างปรับแต่งไซเบอร์ริก', 'Cyber Tuner Rick', 24, 8, LK(2, 0, 3), 'smith');
    NP(B, 'ne_q1', 'พ่อค้าตลาดมืดซีโร่', 'Black Market Dealer Zero', 12, 17, LK(1, 3, 0), 'merchant');
    NP(B, 'ne_q2', 'วิศวกรหญิงลิน', 'Engineer Lin', 29, 17, LK(3, 2, 1), 'scholar');
    NP(B, 'ne_q3', 'นักข่าวไซเบอร์เคน', 'Cyber Reporter Ken', 22, 21, LK(1, 1, 2), 'villager');
    NP(B, 'jm_th3', 'ราชาแฮ็กเกอร์ไฟเบอร์', 'Hacker King Fiber', 6, 24 - 1, LK(2, 3, 2), 'master');
    NP(B, 'jm_ar3', 'สไนเปอร์ตำนานโรนิน', 'Legend Sniper Ronin', 13, 24 - 1, LK(1, 0, 3), 'master');
    NP(B, 'jm_anc', 'ผู้ฟื้นคืนวัตถุโบราณอาร์เคียส', 'Relic Reviver Arkeus', 28, 24 - 1, LK(3, 2, 3), 'master');
    return B.finish({ spawn: sp, fixedHour: 22 });
  };

  SPEC.frost = function () {
    const B = Builder('frost', 7713).openGates(T.STONE);
    B.seg(1, 15, 22, 15, 2, T.STONE); B.seg(19, 1, 19, 15, 2, T.STONE);
    B.seg(22, 15, 38 - 5, 15, 2, T.STONE);
    B.ellipse(T.STONE, 20, 16, 6, 4.5);
    B.ellipse(T.STONE, 31, 24, 6.5, 4);
    B.ellipse(T.WATER, 31, 24, 2.8, 1.8, 1);
    B.bld('castle', 3, 2, 10, 6, bn('ปราสาทอัศวินน้ำแข็ง', 'Ice Knights Keep'));
    B.bld('mtower', 13, 1, 4, 6, bn('หอเวทน้ำแข็ง', 'Frost Mage Tower'));
    B.bld('hall', 24, 2, 11, 6, bn('ห้องโถงแห่งตำนาน', 'Hall of Legends'));
    B.bld('cabin', 3, 11, 4, 3); B.bld('cabin', 9, 11, 4, 3, null, { v: 1 });
    B.bld('church', 28, 10, 5, 3, bn('วิหารแสงเหนือ', 'Aurora Chapel'));
    B.bld('cabin', 35, 11, 3, 3, null, { v: 1 });
    B.bld('cabin', 3, 19, 5, 4, bn('โรงเตี๊ยมหมีขาว', 'White Bear Inn'));
    B.bld('cabin', 10, 19, 4, 3, bn('ร้านยาน้ำแข็งใส', 'Cooling Apothecary'), { v: 1 });
    B.bld('cabin', 3, 26, 4, 3, null, { v: 1 }); B.bld('cabin', 9, 26, 4, 3); B.bld('cabin', 14, 26, 5, 3, bn('โรงตีเหล็กเกล็ดน้ำแข็ง', 'Icescale Forge'), { v: 1 });
    B.bld('cabin', 23, 19, 4, 3); B.bld('cabin', 23, 26, 4, 3, null, { v: 1 });
    B.prop('crystal', 17, 17, 1, 1, { v: 0 }); B.prop('crystal', 22, 13, 1, 1, { v: 1 });
    B.prop('statue', 19, 15, 2, 2);
    [[8, 14], [14, 14], [26, 14], [32, 14], [17, 20], [24, 18], [17, 9], [22, 9]].forEach(p => B.prop('lamp', p[0], p[1], 1, 1));
    B.scatter([1, 0.85, 0.5], 0.05, [5, 3, 2, 1], (x, y) => B.prot[B.I(x, y)] && B.depth(x, y) >= 2);
    const sp = rectCells(B, 17, 13, 23, 18);
    NP(B, 'fr_mayor', 'ลอร์ดฟรอสต์โฮล์มเอริค', 'Lord Erik of Frostholm', 22, 17, LK(5, 2, 0), 'mayor');
    NP(B, 'fr_inn', 'เจ้าของโรงเตี๊ยมหมีขาว', 'White Bear Innkeeper', 5, 23, LK(0, 0, 1), 'inn');
    NP(B, 'fr_potion', 'เภสัชกรอิเซีย', 'Apothecary Isia', 11, 22, LK(3, 3, 0), 'potion');
    NP(B, 'fr_smith', 'ช่างตีเหล็กโธรัน', 'Smith Thoran', 16, 29, LK(2, 0, 2), 'smith');
    NP(B, 'fr_q1', 'ทหารหน่วยลาดตระเวนวอลฟ์', 'Patrol Soldier Wolf', 12, 14, LK(5, 1, 2), 'guard');
    NP(B, 'fr_q2', 'นักล่าหิมะอิงกริด', 'Snow Hunter Ingrid', 25, 16, LK(1, 2, 3), 'villager');
    NP(B, 'fr_q3', 'ช่างแกะสลักน้ำแข็งโอลาฟ', 'Ice Sculptor Olaf', 33, 21, LK(1, 0, 0), 'villager');
    NP(B, 'jm_sw3', 'ผู้บัญชาการอัศวินเรนาร์', 'Knight Commander Renar', 7, 8, LK(5, 0, 3), 'master');
    NP(B, 'jm_hk', 'จอมอัศวินแสงอาร์เธอร์', 'Light Paladin Arthur', 10, 8, LK(5, 2, 0), 'master');
    NP(B, 'jm_ma3', 'อาร์คเมจแห่งหอคอยเฟรย่า', 'Archmage Freya', 15, 8, LK(3, 1, 2), 'master');
    NP(B, 'jm_ac3', 'อัครสังฆราชเซราฟิน', 'High Bishop Seraphin', 30, 14, LK(4, 3, 2), 'master');
    ['sw', 'th', 'ar', 'ma', 'ac'].forEach((c, i) => NP(B, 'jm_' + c + '4', ['จอมยุทธ์ดาบนิรันดร์', 'เจ้าแห่งเงาอมตะ', 'ราชันย์แห่งธนูฟ้า', 'จอมเวทอาณาจักรดาว', 'ผู้ศักดิ์สิทธิ์แห่งแสง'][i], ['Eternal Blade Sovereign', 'Immortal Shadow Lord', 'Skybow Monarch', 'Starrealm Archmage', 'Radiant Saint'][i], 25 + i * 2, 9, LK(i + 1, i % 4, (i + 2) % 4), 'master'));
    NP(B, 'jm_hk4', 'ผู้พิทักษ์อัศวินแสงสุดท้าย', 'Last Radiant Guardian', 35, 9, LK(5, 3, 0), 'master');
    NP(B, 'jm_anc4', 'ผู้สืบทอดพลังโบราณ', 'Heir of Ancient Power', 24, 9, LK(3, 0, 3), 'master');
    return B.finish({ spawn: sp });
  };

  /* ------------------------------------------------------------- แมพล่ามอนสเตอร์ */
  // เว้นช่องโล่ง (clearing) ในพื้นที่เกิดมอนสเตอร์ให้ต้นไม้บางลง
  const clearer = (B, rects) => (x, y) => { for (const r of rects) if (x >= r[1] && x <= r[3] && y >= r[2] && y <= r[4] && B.R() < 0.8) return true; return false; };
  const startCells = (B, side) => { const f = FRONT[side]; return rectCells(B, Math.floor(f[0]) - 1, Math.floor(f[1]) - 1, Math.floor(f[0]) + 1, Math.floor(f[1]) + 1); };

  const FIELD_SPAWN_X = [['rabbit', 16, 17, 24, 24, 3], ['pig', 5, 12, 12, 17, 3], ['frog', 24, 18, 35, 19, 3], ['boarking', 30, 3, 35, 6, 1]];
  function fieldExtra(map) {   // ทุ่งไผ่เขียว: เพิ่มประตูฝั่งตะวันออกไปโรเซนฮอลล์ + มอนสเตอร์ใหม่
    const I = (x, y) => y * W + x, bx = GATE_BOX.E;
    for (let y = bx[1]; y < bx[1] + bx[3]; y++) for (let x = bx[0]; x < bx[0] + bx[2]; x++) { map.tiles[I(x, y)] = T.PATH; map.solid[I(x, y)] = 0; }
    map.objs = map.objs.filter(o => !(o.x < bx[0] + bx[2] && o.x + o.w > bx[0] && o.y < bx[1] + bx[3] && o.y + o.h > bx[1]));
    const ports = portalsFor('field'); map.portals = map.portals.concat(ports);
    for (const p of ports) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) map.solid[I(x, y)] = 0;
    // ทางเดินจากบ่อน้ำไปประตู
    for (let x = 30; x <= 38; x++) for (const y of [15, 16]) { map.tiles[I(x, y)] = T.PATH; if (!(x >= 33)) { map.solid[I(x, y)] = map.solid[I(x, y)] && map.tiles[I(x, y)] === T.WATER ? 1 : 0; } }
    map.theme = 'bamboo'; map.fixedHour = null;
    return FIELD_SPAWN_X;
  }

  SPEC.rain = function () {
    const B = Builder('rain', 8801);
    B.fill(T.WATER, 0, 0, 0, 0);
    for (let y = 0; y < H; y++) { const cx = Math.round(15 + Math.sin(y * 0.45) * 1.6); B.fill(T.WATER, cx, y, 2, 1, 1); }
    B.openGates(T.PATH);
    B.ellipse(T.WATER, 31, 22.5, 3.2, 2.2, 1);
    for (let y = 14; y <= 17; y++) for (let x = 12; x <= 19; x++) if (B.tiles[B.I(x, y)] === T.WATER) { B.tiles[B.I(x, y)] = T.BRIDGE; B.solid[B.I(x, y)] = 0; }
    B.seg(1, 15, 12, 15, 2, T.PATH); B.seg(19, 15, 38, 15, 2, T.PATH);
    B.seg(24, 15, 24, 8, 2, T.PATH); B.seg(24, 8, 33, 5, 2, T.PATH); B.seg(25, 16, 29, 25, 2, T.PATH); B.seg(10, 15, 9, 6, 2, T.PATH); B.seg(10, 16, 10, 26, 2, T.PATH);
    const spawns = [['grasshopper', 6, 4, 13, 12, 4], ['beetle', 6, 19, 13, 27, 4], ['wilddog', 17, 18, 26, 25, 3], ['vfrog', 26, 20, 36, 27, 4],
      ['snake', 17, 4, 26, 11, 3], ['mushroom', 27, 3, 36, 10, 3], ['buffalo', 19, 11, 31, 13, 2], ['flypig', 18, 18, 30, 24, 2], ['bandit', 27, 10, 36, 13, 3],
      ['wolf', 27, 17, 36, 19, 3], ['tiger', 22, 3, 32, 8, 2], ['tigerking', 32, 4, 36, 7, 1]];
    B.scatter([1, 0.9, 0.6], 0.16, [4, 2, 3, 2], clearer(B, spawns));
    return B.finish({ spawn: startCells(B, 'W'), spawns });
  };

  SPEC.ruins = function () {
    const B = Builder('ruins', 9902);
    const R = B.R;
    for (const y of [8, 15, 23]) B.fill(T.STONE, 1, y, 38, 2);
    for (const x of [9, 19, 29]) B.fill(T.STONE, x, 1, 2, 30);
    B.ellipse(T.STONE, 20, 16, 5, 3.5);
    B.openGates(T.STONE);
    B.prop('fountain', 19, 15, 2, 2, { v: 1 });
    const bx = [[2, 7], [11, 18], [21, 28], [31, 37]], by = [[2, 7], [10, 14], [17, 22], [25, 30]];
    for (const yy of by) for (const xx of bx) {
      const n = 2 + (R() * 2 | 0);
      for (let k = 0; k < n; k++) {
        const horiz = R() < 0.5, len = 3 + (R() * 3 | 0);
        const x = xx[0] + (R() * (xx[1] - xx[0] - (horiz ? len : 0) + 1) | 0), y = yy[0] + (R() * (yy[1] - yy[0] - (horiz ? 0 : len) + 1) | 0);
        B.tryProp('ruinwall', x, y, horiz ? len : 1, horiz ? 1 : len, { v: R() * 3 | 0 });
      }
    }
    const spawns = [['skeleton', 3, 9, 18, 22, 5], ['bat', 11, 10, 28, 14, 3], ['ghost', 21, 17, 37, 22, 3], ['dancer', 11, 25, 28, 30, 3],
      ['werewolf', 22, 2, 37, 7, 3], ['deadspirit', 3, 17, 18, 22, 3], ['skelord', 31, 25, 37, 30, 1]];
    B.scatter([0.6, 0.4, 0.2], 0.05, [3, 3, 4, 1], clearer(B, spawns));
    return B.finish({ spawn: startCells(B, 'N'), spawns });
  };

  SPEC.sea = function () {
    const B = Builder('sea', 11103);
    B.openGates(T.PATH);
    B.fill(T.STONE, 12, 9, 16, 13);
    B.seg(20, 3, 20, 10, 3, T.PATH);
    B.border(T.WATER, 1);
    [[6, 26, 4, 2.5], [34, 24, 3, 3], [5, 10, 2.5, 2], [35, 8, 3, 2.2]].forEach(e => B.ellipse(T.WATER, e[0], e[1], e[2], e[3], 1));
    B.openGates(T.PATH);
    [[14, 10], [25, 10], [14, 20], [25, 20], [20, 9]].forEach(p => B.prop('pillar', p[0], p[1], 1, 1, { v: 2 }));
    B.prop('statue', 19, 14, 2, 2, { v: 2 });
    const spawns = [['crab', 5, 4, 14, 12, 4], ['jelly', 25, 4, 35, 8, 3], ['puffer', 4, 14, 11, 24, 3], ['seasnake', 28, 12, 36, 21, 3],
      ['octopus', 8, 25, 18, 29, 3], ['turtle', 21, 24, 27, 29, 2], ['shark', 13, 22, 27, 23, 2], ['siren', 15, 12, 25, 19, 3], ['kraken', 29, 25, 35, 29, 1]];
    B.scatter([1, 0.8, 0.5], 0.2, [5, 5, 3, 1], clearer(B, spawns.concat([['x', 12, 9, 28, 21]])));
    return B.finish({ spawn: startCells(B, 'N'), spawns, fixedHour: 12 });
  };

  SPEC.desert = function () {
    const B = Builder('desert', 12204);
    B.openGates(T.PATH);
    B.seg(1, 15, 38, 15, 2, T.PATH); B.seg(12, 15, 10, 6, 2, T.PATH); B.seg(24, 16, 26, 25, 2, T.PATH); B.seg(28, 15, 31, 12, 2, T.PATH);
    B.ellipse(T.WATER, 10, 5.5, 3, 2, 1);
    B.prop('pyramid', 27, 2, 9, 6);
    B.prop('ruinwall', 4, 22, 5, 1, { v: 1 }); B.prop('ruinwall', 14, 28, 1, 2, { v: 0 });
    const spawns = [['scorpion', 6, 8, 16, 13, 4], ['sandsnake', 7, 18, 18, 26, 4], ['vulture', 14, 3, 25, 9, 3], ['cactus', 22, 18, 33, 26, 4],
      ['sandhopper', 17, 10, 27, 13, 3], ['camel', 8, 20, 18, 24, 2], ['sandtiger', 24, 21, 34, 28, 3], ['mummy', 25, 10, 34, 13, 3],
      ['sandwolf', 14, 18, 24, 26, 3], ['sanddancer', 18, 3, 26, 8, 3], ['pharaoh', 30, 9, 36, 12, 1]];
    B.scatter([1, 0.9, 0.5], 0.09, [4, 3, 3, 2], clearer(B, spawns));
    return B.finish({ spawn: startCells(B, 'W'), spawns });
  };

  SPEC.waste = function () {
    const B = Builder('waste', 13305);
    B.fill(T.STONE, 6, 4, 14, 10); B.fill(T.STONE, 22, 18, 14, 10);
    B.openGates(T.PATH);
    B.seg(1, 15, 30, 15, 2, T.PATH); B.seg(19, 1, 19, 15, 2, T.PATH); B.seg(24, 16, 28, 27, 2, T.PATH);
    B.ellipse(T.WATER, 33, 10, 3, 1.8, 1); B.ellipse(T.WATER, 8, 27.5, 3, 1.8, 1);
    B.prop('factory', 22, 3, 7, 5); B.prop('factory', 3, 19, 6, 4); B.prop('factory', 31, 21, 6, 4, { v: 1 });
    B.prop('pipe', 14, 11, 8, 1); B.prop('pipe', 12, 21, 1, 5); B.prop('pipe', 34, 12, 1, 6);
    B.deco('conveyor', 9, 14, 8, 1);
    const spawns = [['robot', 7, 5, 15, 12, 4], ['scrapdog', 22, 9, 34, 13, 3], ['cyberlizard', 7, 17, 17, 28, 3], ['drone', 17, 17, 27, 23, 3],
      ['scrapboar', 26, 25, 35, 29, 3], ['robobeetle', 22, 9, 30, 14, 2], ['cyberbandit', 27, 16, 36, 20, 3], ['cyberwolf', 14, 24, 22, 29, 3],
      ['mech', 28, 22, 36, 28, 2], ['megabot', 30, 4, 36, 8, 1]];
    B.scatter([1, 0.8, 0.4], 0.07, [4, 3, 3, 1], clearer(B, spawns));
    return B.finish({ spawn: startCells(B, 'W'), spawns, fixedHour: 18 });
  };

  SPEC.snow = function () {
    const B = Builder('snow', 14406);
    B.ellipse(T.STONE, 13, 21, 7, 4.5); B.ellipse(T.WATER, 13, 21, 3, 1.8, 1);
    B.openGates(T.PATH);
    B.seg(19, 30, 19, 16, 2, T.PATH); B.seg(19, 16, 38, 16, 2, T.PATH); B.seg(19, 16, 8, 8, 2, T.PATH); B.seg(24, 16, 30, 8, 2, T.PATH);
    B.ellipse(T.WATER, 28, 25, 3.5, 2, 1);
    const spawns = [['snowrabbit', 4, 4, 14, 12, 4], ['snowwolf', 5, 13, 16, 17, 3], ['snowox', 4, 24, 12, 29, 3], ['mammoth', 22, 3, 34, 9, 3],
      ['frostghost', 21, 10, 32, 14, 3], ['yeti', 22, 18, 34, 23, 3], ['whitetiger', 22, 24, 35, 29, 3], ['icedancer', 8, 18, 18, 22, 3], ['yetiking', 31, 3, 36, 6, 1]];
    B.scatter([1, 0.9, 0.5], 0.1, [6, 2, 3, 1], clearer(B, spawns));
    return B.finish({ spawn: startCells(B, 'S'), spawns });
  };

  SPEC.dungeon = function () {
    const B = Builder('dungeon', 15507), R = B.R, I = B.I;
    let g = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[I(x, y)] = B.depth(x, y) < 2 || R() < 0.55 ? 1 : 0;
    for (let it = 0; it < 5; it++) {
      const n = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; c += !inb(xx, yy) || g[I(xx, yy)] ? 1 : 0; }
        n[I(x, y)] = B.depth(x, y) < 2 || c >= 5 ? 1 : 0;
      }
      g = n;
    }
    for (let i = 0; i < W * H; i++) { B.tiles[i] = g[i] ? T.VOID : T.STONE; B.solid[i] = g[i]; }
    const rooms = [[20, 27, 4, 2.5], [9, 20, 4, 3], [31, 20, 4, 3], [20, 16, 5, 3], [9, 8, 4, 3], [31, 8, 4, 3], [20, 5, 6, 3]];
    rooms.forEach(r => { B.ellipse(T.STONE, r[0], r[1], r[2], r[3], 0); });
    const link = (a, b) => B.seg(rooms[a][0], rooms[a][1], rooms[b][0], rooms[b][1], 2, T.STONE);
    link(0, 3); link(3, 1); link(3, 2); link(3, 6); link(1, 4); link(2, 5); link(4, 6); link(5, 6);
    B.openGates(T.STONE);
    B.seg(20, 30, 20, 27, 4, T.STONE);
    // ตัดโพรงที่เข้าไม่ถึงออก
    const seen = new Uint8Array(W * H), q = [[20, 28]]; seen[I(20, 28)] = 1;
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny) || seen[I(nx, ny)] || B.solid[I(nx, ny)] || B.tiles[I(nx, ny)] === T.VOID) continue; seen[I(nx, ny)] = 1; q.push([nx, ny]); } }
    for (let i = 0; i < W * H; i++) if (!seen[i] && B.tiles[i] !== T.VOID) { B.tiles[i] = T.VOID; B.solid[i] = 1; }
    // ตกแต่ง: คบเพลิงข้างผนัง ผลึก และกองกระดูก
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (B.tiles[I(x, y)] !== T.STONE || B.solid[I(x, y)]) continue;
      const wall = B.tiles[I(x, y - 1)] === T.VOID, r = R();
      if (wall && r < 0.18) B.deco('torch', x, y, 1, 1);
      else if (!wall && r < 0.03 && !B.prot[I(x, y)] && B.depth(x, y) > 4) B.tree(x, y, r < 0.015 ? 3 : 2);
    }
    const spawns = [['bonesoldier', 6, 17, 14, 23, 4], ['shade', 28, 17, 36, 23, 3], ['warspirit', 17, 12, 24, 19, 3], ['imp', 6, 5, 14, 11, 3],
      ['shadowdancer', 28, 5, 36, 11, 3], ['abysstiger', 8, 14, 14, 17, 2], ['bonebeast', 29, 13, 35, 17, 2], ['lichguard', 16, 3, 24, 8, 3], ['shadowking', 19, 3, 21, 5, 1]];
    return B.finish({ spawn: startCells(B, 'S'), spawns, fixedHour: 23 });
  };

  /* ------------------------------------------------------------- ร้านค้า */
  const TOWN_CODE = { rosen: 'ro', treehouse: 'tr', thai: 'th', oasis: 'oa', neon: 'ne', frost: 'fr' };
  const SHOP_POTIONS = {
    rosen: ['herb', 'tonic', 'elixir', 'dew'], treehouse: ['herb', 'tonic', 'elixir', 'dew', 'dew2'], thai: ['tonic', 'elixir', 'panacea', 'dew', 'dew2'],
    oasis: ['elixir', 'panacea', 'dew2', 'dew3'], neon: ['panacea', 'nectar', 'dew2', 'dew3'], frost: ['panacea', 'nectar', 'nectar2', 'dew3', 'dew4']
  };
  const SHOP_TIER = { rosen: [1, 2], treehouse: [1, 2], thai: [2, 3], oasis: [2, 3], neon: [3, 3], frost: [3, 4] };
  function makeShops(RPG) {
    const out = {};
    for (const t of Object.keys(TOWN_CODE)) {
      const c = TOWN_CODE[t];
      out['potion_' + t] = { npc: c + '_potion', title: 'ร้านยา · ' + ZD[t].n, buy: SHOP_POTIONS[t], sellSlot: false };
      out['smith_' + t] = { npc: c + '_smith', title: 'ร้านอาวุธและชุดเกราะ · ' + ZD[t].n, buy: RPG.smithList(SHOP_TIER[t][0], SHOP_TIER[t][1]), sellSlot: true };
    }
    return out;
  }
  const SHOP_OF_NPC = {};   // npc id -> shop id (เติมใน init)

  /* ------------------------------------------------------------- เควสต์ข้างทาง */
  // [id, ผู้ให้, ชื่อ, ชื่ออังกฤษ, minLv, ชนิด, เป้าหมาย(มอน/ของ), จำนวน, คำขอ, คำขออังกฤษ, คำตอบเมื่อสำเร็จ, อังกฤษ]
  const SIDE = [
    ['ro_q1', 'ro_q1', 'สีเขียวของแผนที่ป่าฝน', 'Green for the Jungle Map', 8, 'collect', 'grasshopper', 6, 'ข้ากำลังเขียนแผนที่ป่าดิบชื้น แต่สีเขียวหมดพอดี ปีกตั๊กแตนยักษ์บดแล้วทำสีได้สวยนัก ช่วยเก็บมา 6 ชิ้นได้ไหม', 'I am drawing a map of the rainforest but ran out of green. Ground grasshopper wings make a lovely dye — can you bring me 6?', 'สีสวยมาก! แผนที่ฉบับนี้จะเป็นที่กล่าวขานแน่ ขอบคุณมาก', 'Beautiful color! This map will be famous. Thank you!'],
    ['ro_q2', 'ro_q2', 'กบพิษในสวนโบสถ์', 'Poison Frogs in the Chapel Garden', 10, 'kill', 'vfrog', 8, 'กบพิษลายครามจากป่าดิบกระโดดเข้าสวนโบสถ์ เด็ก ๆ เล่นไม่ได้เลย ช่วยกำจัดมันที 8 ตัวนะ', 'Indigo poison frogs from the jungle have leapt into the chapel garden and the children cannot play. Please deal with 8 of them.', 'พระเจ้าคุ้มครอง ขอบคุณที่ช่วยเด็ก ๆ', 'Bless you for protecting the children.'],
    ['ro_q3', 'ro_q3', 'ตำราสัตว์เลื้อยคลาน', 'A Tome of Serpents', 12, 'collect', 'snake', 5, 'หอสมุดกำลังทำตำราสัตว์เลื้อยคลาน ข้าอยากได้เกล็ดงูเขียวหางไหม้ 5 ชิ้นไว้เป็นตัวอย่าง', 'The library is compiling a book on serpents. I need 5 Firetail Viper scales as specimens.', 'ตัวอย่างสมบูรณ์แบบ ตำราเล่มนี้จะสมบูรณ์เสียที', 'Perfect specimens! The tome is finally complete.'],
    ['tr_q1', 'tr_q1', 'สปอร์รักษาพิษ', 'Spores for the Cure', 14, 'collect', 'mushroom', 6, 'ลูกบ้านเราโดนพิษจากป่า ข้าต้องใช้สปอร์เห็ดพิษมาทำยาถอนพิษ ช่วยเก็บ 6 ชิ้น', 'Villagers have been poisoned by the forest. I need 6 toadstool spores to brew an antidote.', 'ยาถอนพิษเสร็จแล้ว ชาวบ้านรอดเพราะเจ้า', 'The antidote is ready. You saved the villagers.'],
    ['tr_q2', 'tr_q2', 'โจรขโมยธนู', 'The Bow Thieves', 16, 'kill', 'bandit', 8, 'โจรป่าหน้าดำขโมยธนูของพวกเราไปหลายคัน ปราบพวกมันให้ได้ 8 คน แล้วธนูจะกลับมา', 'Blackface bandits stole many of our bows. Defeat 8 of them and our bows will return.', 'ธนูกลับมาแล้ว! ขอบคุณจากใจจริง', 'Our bows are back! Heartfelt thanks.'],
    ['tr_q3', 'tr_q3', 'หมาป่าไล่เด็กน้อย', 'Wolves After the Boy', 17, 'kill', 'wolf', 6, 'หมาป่าดงไล่ข้าจนต้องปีนต้นไม้หนี ช่วยปราบมัน 6 ตัวทีนะพี่', 'Jungle wolves chased me up a tree! Please beat 6 of them, big sibling.', 'ไม่ต้องกลัวอีกแล้ว ขอบคุณพี่มาก!', 'No more scary wolves! Thank you!'],
    ['th_q1', 'th_q1', 'กระดองปูทำหม้อ', 'Crab Shells for Cooking Pots', 30, 'collect', 'crab', 6, 'ตลาดน้ำเรากำลังหาของเด็ด กระดองปูเกราะหินใช้ทำหม้อต้มน้ำแกงได้ไม่ร้าว ช่วยหามา 6 ชิ้น', 'Our floating market wants something special. Stonearmor crab shells make unbreakable soup pots — bring me 6.', 'ได้ของดีแล้ว น้ำแกงหม้อใหม่จะอร่อยแน่', 'Excellent! The new soup will be delicious.'],
    ['th_q2', 'th_q2', 'ส่งวิญญาณสู่สุคติ', 'Guide the Spirits to Rest', 24, 'kill', 'ghost', 8, 'ผีเปรตเมืองร้างยังวนเวียนไม่ไปไหน อาตมาอยากให้เจ้าช่วยปราบให้ 8 ตน เพื่อพวกเขาจะได้ไปสู่สุคติ', 'Wraiths of the ruined city still linger. Please lay 8 of them to rest so they may pass on.', 'บุญกุศลนี้ใหญ่หลวงนัก ขออนุโมทนา', 'A great merit indeed. May you be blessed.'],
    ['th_q3', 'th_q3', 'ปลาปักเป้ากัดอวน', 'Puffers Tear My Nets', 32, 'kill', 'puffer', 6, 'ปลาปักเป้าหนามกัดอวนข้าขาดหมด เจ้าช่วยไปจัดการมันในวิหารปะการังสัก 6 ตัวเถอะ', 'Spiny pufferfish keep tearing my nets. Please deal with 6 of them near the coral temple.', 'อวนข้าปลอดภัยแล้ว ขอบใจเจ้าหนุ่มสาว', 'My nets are safe now. Thanks, young one.'],
    ['oa_q1', 'oa_q1', 'งูเห่าในกองคาราวาน', 'Cobras in the Caravan', 40, 'kill', 'sandsnake', 8, 'งูเห่าทะเลทรายเลื้อยเข้ากองคาราวานข้าทุกคืน อูฐตกใจหมด ช่วยกำจัดมัน 8 ตัวที', 'Dune cobras slither into my caravan every night and spook the camels. Kill 8 of them.', 'อูฐหลับสบายแล้ว ขอบคุณมาก', 'The camels can sleep again. Thank you.'],
    ['oa_q2', 'oa_q2', 'ผ้าพันมัมมี่โบราณ', 'Ancient Mummy Wrappings', 44, 'collect', 'mummy', 5, 'ผ้าพันของมัมมี่ทรายมีอักษรโบราณ ข้าอยากถอดความ ช่วยเก็บมา 5 ชิ้นได้ไหม', 'Sand mummy wrappings bear ancient writing I want to decipher. Please fetch 5 pieces.', 'อักษรเหล่านี้บอกเล่าเรื่องราวอันน่าทึ่ง!', 'These glyphs tell an amazing story!'],
    ['oa_q3', 'oa_q3', 'แมงป่องใกล้บ่อน้ำ', 'Scorpions by the Spring', 38, 'kill', 'scorpion', 8, 'แมงป่องทรายแดงมาวนเวียนใกล้บ่อ ข้าตักน้ำไม่ได้ ช่วยปราบ 8 ตัวให้ที', 'Redsand scorpions lurk by the spring and I cannot fetch water. Please beat 8 of them.', 'ตักน้ำได้แล้ว! ขอบคุณพี่ชาย', 'I can fetch water again! Thanks!'],
    ['ne_q1', 'ne_q1', 'เศษเหล็กตลาดมืด', 'Black Market Scrap', 52, 'collect', 'robot', 8, 'ตลาดมืดต้องการเศษเหล็กหุ่นยนต์ตรวจการณ์ ราคาดีมาก ช่วยหามา 8 ชิ้น ไม่ถามที่มา', 'The black market pays well for patrol robot scrap. Bring 8 pieces — no questions asked.', 'ของดี เงินโอนให้เรียบร้อย', 'Quality goods. Credits transferred.'],
    ['ne_q2', 'ne_q2', 'ใบพัดโดรน', 'Drone Rotors', 56, 'collect', 'drone', 6, 'ฉันกำลังสร้างโดรนของตัวเอง ใบพัดจากโดรนยามเฝ้าคุณภาพดีที่สุด ช่วยเก็บ 6 ชิ้นนะ', 'I am building my own drone and sentry drone rotors are the best. Collect 6 for me, please.', 'ใบพัดสมบูรณ์แบบ โดรนฉันขึ้นบินได้แล้ว', 'Perfect rotors! My drone can fly now.'],
    ['ne_q3', 'ne_q3', 'ข่าวด่วน: โจรไซเบอร์', 'Breaking News: Cyber Bandits', 58, 'kill', 'cyberbandit', 6, 'ผมจะทำข่าวโจรไซเบอร์ดาบเลเซอร์ ขอหลักฐานคือการปราบมันให้ได้ 6 ตัว เป็นพาดหัวข่าวเลย', 'I am covering the laserblade cyber bandits. Defeat 6 of them — that will be the headline!', 'พาดหัวข่าวพรุ่งนี้คือชื่อคุณ!', "Tomorrow's headline is your name!"],
    ['fr_q1', 'fr_q1', 'หมาป่าหิมะรุกล้ำ', 'Snow Wolves at the Gates', 66, 'kill', 'snowwolf', 8, 'ฝูงหมาป่าหิมะเงินมาใกล้กำแพงเมืองทุกคืน ช่วยลดจำนวนมันลง 8 ตัว', 'Silver snow wolves prowl near the walls every night. Thin their numbers by 8.', 'เมืองปลอดภัยขึ้นมาก ขอบคุณ', 'The town is safer now. Thank you.'],
    ['fr_q2', 'fr_q2', 'หนังเสือขาวทำเสื้อ', 'White Tiger Coat', 72, 'collect', 'whitetiger', 4, 'เสื้อคลุมหนังเสือขาวกันหนาวได้ดีที่สุด ข้าต้องการหนัง 4 ผืน เสือขาวพายุหิมะนั้นดุนะ ระวังตัว', 'A white tiger hide coat beats any cold. I need 4 hides — blizzard tigers are fierce, be careful.', 'หนังสวยเหลือเกิน ฤดูหนาวนี้ข้าไม่หนาวแน่', 'Gorgeous hides. I will not freeze this winter.'],
    ['fr_q3', 'fr_q3', 'ผลึกน้ำแข็งแกะสลัก', 'Crystals for Carving', 70, 'collect', 'frostghost', 6, 'งานแกะสลักชิ้นใหม่ของข้าต้องการผลึกน้ำแข็งจากผีหิมะกระซิบ 6 ชิ้น', 'My next sculpture needs 6 ice crystals from whispering snow spirits.', 'ผลึกใสสะอาดมาก งานชิ้นนี้จะเป็นผลงานชั้นเอก', 'Pure crystal. This will be a masterpiece.']
  ];
  const potionFor = lv => pick(HEAL_BY, lv), dewFor = lv => pick(MP_BY, lv);
  function sideQuests() {
    const out = {};
    for (const s of SIDE) {
      const [id, giver, title, titleEn, minLv, kind, tgt, n, offer, offerEn, done, doneEn] = s;
      const isKill = kind === 'kill', mon = isKill ? tgt : tgt, item = 'm_' + tgt;
      const q = {
        title, giver, minLv, nav: mon, goal: (isKill ? 'ล่า' : 'เก็บ') + (isKill ? MONX[tgt].name : MITEMS[item].name), n,
        rewards: { exp: Math.round(nextExpF(minLv) * 0.45), items: { coin: minLv * 40 + 80, [potionFor(minLv)]: 3, [dewFor(minLv)]: 2 } },
        offer, progress: 'ยังทำไม่ครบนะ ลองดูเป้าหมายในจดหมายนกพิราบ', done, side: 1
      };
      if (isKill) q.kill = tgt; else q.collect = item;
      out[id] = q;
      NAMES.push([title, titleEn], [offer, offerEn], [done, doneEn]);
    }
    return out;
  }
  NAMES.push(['ยังทำไม่ครบนะ ลองดูเป้าหมายในจดหมายนกพิราบ', 'Not done yet — check your goals in the pigeon letter.']);

  /* ------------------------------------------------------------- เควสต์เปลี่ยนอาชีพ */
  const CODE = { Swordman: 'sw', Thief: 'th', Archer: 'ar', Magician: 'ma', Acolyte: 'ac' };
  const FLAV = {
    Swordman: ['เส้นทางดาบไม่มีทางลัด', 'The way of the sword has no shortcuts.'],
    Thief: ['เงามืดเลือกเฉพาะผู้มีฝีมือ', 'The shadows only choose the skilled.'],
    Archer: ['นักธนูที่ดีต้องอดทนและแม่นยำ', 'A true archer is patient and precise.'],
    Magician: ['เวทมนตร์ต้องใช้ทั้งปัญญาและประสบการณ์', 'Magic demands both wisdom and experience.'],
    Acolyte: ['ผู้รับใช้แสงต้องผ่านบททดสอบแห่งศรัทธา', 'Servants of the light must pass a trial of faith.']
  };
  const POOL1 = ['grasshopper', 'beetle', 'wilddog', 'vfrog', 'snake', 'mushroom'];
  const POOL2 = ['skeleton', 'bat', 'ghost', 'dancer', 'werewolf', 'deadspirit', 'crab', 'jelly', 'puffer', 'seasnake', 'octopus', 'turtle'];
  const POOL3 = ['scorpion', 'sandsnake', 'vulture', 'cactus', 'sandhopper', 'camel', 'sandtiger', 'mummy', 'sandwolf', 'sanddancer', 'robot', 'scrapdog', 'cyberlizard', 'drone', 'scrapboar', 'robobeetle'];
  const BOSS4 = [['megabot', 2], ['yetiking', 2], ['shadowking', 1]];
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const strHash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h >>> 0; };
  const jobQuestId = (job, c4) => (c4 ? 'jq4_' : 'jq_') + slug(job);

  function makeJobQuests(RPG) {
    const J = RPG.JOBS, LV = RPG.LV, out = {};
    for (const name of RPG.JOB_LIST) {
      const j = J[name]; if (!j.tier) continue;
      const code = CODE[j.root], fl = FLAV[j.root], hsh = strHash(name);
      const specs = [];
      const from = j.alt ? j.alt.slice() : [j.parent];
      const giver = name === 'Holy Knight' ? 'jm_hk' : name === 'Ancient Controller' ? 'jm_anc' : 'jm_' + code + j.tier;
      if (j.tier === 1) specs.push({ c4: 0, minLv: LV.c1, pool: POOL1, kn: 10, cn: 6, giver, from });
      else if (j.tier === 2) specs.push({ c4: 0, minLv: LV.c2, pool: POOL2, kn: 18, cn: 10, giver, from, fac: 1 });
      else {
        specs.push({ c4: 0, minLv: LV.c3, pool: POOL3, kn: 25, cn: 12, giver, from, fac: 1 });
        const g4 = name === 'Holy Knight' ? 'jm_hk4' : name === 'Ancient Controller' ? 'jm_anc4' : 'jm_' + code + '4';
        specs.push({ c4: 1, minLv: LV.c4, boss: BOSS4[hsh % BOSS4.length], giver: g4, from: [name], fac: 1 });
      }
      for (const sp of specs) {
        const id = jobQuestId(name, sp.c4), q = { giver: sp.giver, minLv: sp.minLv, job: { to: name, c4: sp.c4 }, from: sp.from, fac: sp.fac ? 1 : 0, side: 0 };
        let aTh, aEn;
        if (sp.boss) {
          const b = sp.boss[0], n = sp.boss[1], it = 'bm_' + b;
          q.collect = it; q.n = n; q.nav = b; q.goal = 'เก็บ' + MITEMS[it].name;
          aTh = 'ไปล่า' + MONX[b].name + 'ให้ได้ตรา ' + n + ' อัน แล้วนำมาให้ข้าดู';
          aEn = 'hunt ' + MONX[b].en + ' and bring me ' + n + ' Mark' + (n > 1 ? 's' : '') + ' as proof.';
        } else if ((hsh >>> 3) % 2 === 0) {
          const m = sp.pool[(hsh >>> 5) % sp.pool.length];
          q.kill = m; q.n = sp.kn; q.nav = m; q.goal = 'ล่า' + MONX[m].name;
          aTh = 'ไปปราบ' + MONX[m].name + 'ให้ครบ ' + sp.kn + ' ตัว แล้วกลับมาหาข้า';
          aEn = 'defeat ' + sp.kn + ' ' + MONX[m].en + ' and return to me.';
        } else {
          const m = sp.pool[(hsh >>> 5) % sp.pool.length], it = 'm_' + m;
          q.collect = it; q.n = sp.cn; q.nav = m; q.goal = 'เก็บ' + MITEMS[it].name;
          aTh = 'ไปเก็บ' + MITEMS[it].name + 'ให้ได้ ' + sp.cn + ' ชิ้น แล้วนำมาให้ข้า';
          aEn = 'collect ' + sp.cn + ' × ' + MITEMS[it].en + ' and bring them to me.';
        }
        const lbl = sp.c4 ? ['บททดสอบคลาส 4: ', 'Class 4 Trial: '] : ['บททดสอบเปลี่ยนอาชีพ: ', 'Job Trial: '];
        q.title = lbl[0] + name;
        q.offer = fl[0] + ' ผู้ที่จะเป็น ' + name + ' ต้องพิสูจน์ตนเองก่อน — ' + aTh;
        q.progress = 'ยังไม่ครบนะ ไปทำให้เสร็จแล้วค่อยกลับมา';
        q.done = sp.c4 ? 'ยอดเยี่ยม! เจ้าพร้อมก้าวสู่คลาส 4 ของ ' + name + ' แล้ว ข้าเลื่อนขั้นให้เจ้าเรียบร้อย!' : 'ดีมาก! จากนี้เจ้าคือ ' + name + ' แล้ว ข้าส่งชุดเริ่มต้นไปที่กล่องจดหมายของเจ้า ไปรับได้เลย';
        q.rewards = { exp: Math.round(nextExpF(sp.minLv) * 0.7), items: { coin: sp.minLv * 60, [potionFor(sp.minLv)]: 3, [dewFor(sp.minLv)]: 2 } };
        out[id] = q;
        NAMES.push([q.title, lbl[1] + name], [q.offer, fl[1] + ' To become ' + name + ', you must prove yourself — ' + aEn], [q.done, sp.c4 ? 'Superb! You are now Class 4 ' + name + '!' : 'Well done! You are now a ' + name + '. I sent your starter gear to your mailbox.'],
          [q.goal, (q.kill ? 'Hunt ' + MONX[q.kill].en : 'Collect ' + (MITEMS[q.collect].en))]);
      }
    }
    NAMES.push(['ยังไม่ครบนะ ไปทำให้เสร็จแล้วค่อยกลับมา', 'Not done yet — finish it and come back.']);
    return out;
  }

  /* ------------------------------------------------------------- เริ่มต้นและส่งออก */
  const BUILT = {};
  // คาฟร่า: พนักงานบริการประจำเมือง (คลังเก็บของ / บันทึกจุดเกิด / เดินทางด่วน)
  const KAFRA_NAME = 'คาฟร่า · พนักงานบริการ';
  function addKafra(m, zone) {
    if (m.npcs.some(n => n.id === 'kf_' + zone)) return;
    let sp = m.spawn && m.spawn.length ? m.spawn : [20, 16];
    if (Array.isArray(sp[0])) sp = sp[Math.floor(sp.length / 2)];
    const W_ = m.W || 40, H_ = m.H || 32;
    const free = (x, y) => x > 1 && y > 1 && x < W_ - 2 && y < H_ - 2 && !m.solid[y * W_ + x] && [0, 1, 2].indexOf(m.tiles[y * W_ + x]) >= 0 &&
      !m.npcs.some(n => Math.hypot(n.x - x, n.y - y) < 2) && !(m.portals || []).some(p => x >= p.x - 2 && x <= p.x + p.w + 1 && y >= p.y - 2 && y <= p.y + p.h + 1);
    let best = null;
    for (let r = 2; r <= 9 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = Math.floor(sp[0]) + dx, y = Math.floor(sp[1]) + dy;
      if (free(x, y)) { best = [x, y]; break; }
    }
    if (!best) return;
    m.npcs.push({ id: 'kf_' + zone, name: KAFRA_NAME, x: best[0], y: best[1], look: { o: 3, h: 1, c: 1, g: 1 }, role: 'kafra',
      lines: ['ยินดีให้บริการค่ะ ฝากของ บันทึกจุดเกิด หรือเดินทางด่วน ถามคาฟร่าได้เลยนะคะ', 'ของล้นถุงแล้วหรือคะ? ฝากไว้กับคาฟร่าได้ค่ะ'] });
    m.solid[best[1] * W_ + best[0]] = 1;
  }
  function build(zone) {
    if (!BUILT[zone]) {
      const m = SPEC[zone]();
      if (TOWNS.indexOf(zone) >= 0) addKafra(m, zone);
      for (const s of m.spawns || []) if (!MON_ZONE[s[0]]) MON_ZONE[s[0]] = zone;
      BUILT[zone] = m;
    }
    return BUILT[zone];
  }
  function init(RPG) {
    // สร้างแมพทุกแห่งหนึ่งครั้งเพื่อเก็บรายชื่อ NPC/มอนสเตอร์
    for (const s of FIELD_SPAWN_X) if (!MON_ZONE[s[0]]) MON_ZONE[s[0]] = 'field';
    MON_ZONE.slime = 'field'; MON_ZONE.boar = 'field';
    for (const z of ZONES) if (SPEC[z]) build(z);
    for (const z of TOWNS) NPCINFO['kf_' + z] = { zone: z, role: 'kafra', name: KAFRA_NAME, en: 'Kafra · Service Staff' };
    NAMES.push([KAFRA_NAME, 'Kafra · Service Staff']);
    NPCINFO.n1 = { zone: 'village', role: 'mayor', name: 'ผู้ใหญ่บ้าน', en: 'Village Chief' };
    NPCINFO.n2 = { zone: 'village', role: 'potion', name: 'เจ้าของร้านยา', en: 'Apothecary' };
    NPCINFO.n3 = { zone: 'village', role: 'inn', name: 'เถ้าแก่โรงเตี๊ยม', en: 'Innkeeper' };
    NPCINFO.n4 = { zone: 'village', role: 'guard', name: 'ทหารเฝ้าประตู', en: 'Gate Guard' };
    NPCINFO.n5 = { zone: 'village', role: 'smith', name: 'ช่างตีเหล็ก', en: 'Blacksmith' };
    const shops = makeShops(RPG), quests = Object.assign(sideQuests(), makeJobQuests(RPG));
    for (const k of Object.keys(shops)) SHOP_OF_NPC[shops[k].npc] = k;
    return { shops, quests };
  }
  const travelCost = lv => 150 + lv * 15;
  const LABEL_NAMES = [['หมู่บ้านลำธารไผ่', 'Bamboo Creek Village']];
  for (const z of ZONES) { NAMES.push([ZD[z].n, ZD[z].en], [ZD[z].blurb, ZD[z].bEn]); }

  return {
    W, H, T, ZD, ZONES, TOWNS, LINKS, EXITS, OPP, FRONT, frontOf, portalsFor, route, build, fieldExtra, FIELD_SPAWN_X, init,
    addKafra, MONX, MART, MROWS, ITEMS_X, NPCINFO, MON_ZONE, TOWN_CODE, SHOP_OF_NPC, NAMES, BNAMES, travelCost, jobQuestId, tierOf, setStrict(v) { STRICT = v; }, SPEC
  };
});
