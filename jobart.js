/* jobart.js — ภาพลักษณ์ของอาชีพ/อาวุธ (วาดด้วยโค้ด) ใช้ทั้งในเกมและไอคอนไอเท็ม */
(function () {
  'use strict';
  let C = null;
  // [ชุด, ทรงผม, สีผม, อาวุธ[], ของสวมหัว[], เอฟเฟกต์[], สีประจำสาย]
  const J = {
 'Adventurer': ['#8a7a5a',2,'#5a3b24',['dagger'],[],['pack'],'#c9b37a'],
 'Swordman': ['#c0392b',0,'#5a3b24',['sword','shield'],['headband'],[],'#e07a6e'],
 'Knight': ['#a93226',0,'#3b2a1d',['sword2h'],['helm'],['cape:#7b241c'],'#e07a6e'],
 'Lord Knight': ['#922b21',0,'#cfd3d8',['sword2h'],['helm:gold'],['cape:#5b1a14','aura:#ffd24a'],'#ffd24a'],
 'War Master': ['#b03a2e',1,'#1d1a1a',['sword2h'],['headband'],['sparks:#ff8a5c'],'#ff8a5c'],
 'Paladin': ['#d4ac0d',0,'#cfd3d8',['sword','shield'],['helm:white'],['cape:#f4f1e8'],'#fff2a8'],
 'Warlock': ['#6c3483',0,'#1d1a1a',['sword','shield'],['hood:#4a235a'],['cape:#2c1338','aura:#b57edc'],'#b57edc'],
 'Shield Master': ['#5d6d7e',0,'#5a3b24',['greatshield'],['helm'],[],'#aebdca'],
 'Shieldfly': ['#2e86c1',3,'#a8442a',['sword','shield'],['helm:white'],['fshield','aura:#8fd8ff'],'#8fd8ff'],
 'Samurai': ['#7b241c',3,'#1d1a1a',['katana'],['headband:white'],[],'#e07a6e'],
 'Sword Master': ['#a93226',3,'#1d1a1a',['katana'],['headband:white'],['sparks:#ffe27a'],'#ffe27a'],
 'Onimusha': ['#2c1f3a',1,'#cfd3d8',['katana','orbglove'],['horns'],['flames:#8e44ad','aura:#8e44ad'],'#b57edc'],
 'Thief': ['#3d3d4e',2,'#5a3b24',['dagger'],['hood:#2b2b3a'],[],'#8a8aa8'],
 'Rogue': ['#2c2c3e',2,'#1d1a1a',['dagger'],['hood:#1f1f2b'],['cape:#171722'],'#8a8aa8'],
 'Shadow Master': ['#1f1f2b',2,'#1d1a1a',['dagger2'],['hood:#14141c'],['shadow','aura:#6c5ce7'],'#6c5ce7'],
 'Bandit Lord': ['#6e2c00',1,'#a8442a',['dagger'],['headband:#e0a020'],['coins','cape:#4a1c00'],'#ffd24a'],
 'Assassin': ['#1f1f2b',0,'#1d1a1a',['katar'],['mask'],[],'#c0392b'],
 'Supreme Assassin': ['#17171f',0,'#cfd3d8',['katar2'],['mask'],['cape:#7b241c','aura:#c0392b'],'#ff4a3c'],
 'Ninja': ['#1c2833',3,'#1d1a1a',['kunai'],['headband:#c0392b','mask'],['sparks:#cfd6dc'],'#aebdca'],
 'Jester': ['#8e44ad',1,'#e0a020',['dagger'],['jester'],[],'#ffd24a'],
 'Weapon Controller': ['#7d3c98',1,'#e0a020',['dagger'],['jester'],['fdagger','aura:#ffd24a'],'#ffd24a'],
 'Beast Controller': ['#a04000',1,'#1d1a1a',['whip'],['jester'],['panther'],'#ff9a3c'],
 'Archer': ['#2f9e5b',1,'#5a3b24',['bow'],['feather'],[],'#8fe0a8'],
 'Sniper': ['#1e8449',2,'#1d1a1a',['bow'],['hood:#145a32'],[],'#8fe0a8'],
 'Snimaster': ['#145a32',2,'#cfd3d8',['bow'],['goggles:#8fd8ff','hood:#0e3d22'],['aura:#8fe0a8'],'#8fe0a8'],
 'Longbowter': ['#27ae60',0,'#a8442a',['longbow'],['feather'],['cape:#1e8449'],'#8fe0a8'],
 'Engineer': ['#d68910',0,'#5a3b24',['gun'],['goggles'],[],'#ffd24a'],
 'Craftmaster': ['#ca6f1e',0,'#1d1a1a',['gun'],['goggles'],['sparks:#ffd24a','gear'],'#ffd24a'],
 'Roboter': ['#b9770e',2,'#5a3b24',['gun'],['goggles'],['robot'],'#9fb4c7'],
 'AI Laser': ['#2c3e50',0,'#1d1a1a',['gun'],['goggles:#7df9ff'],['drones:#7df9ff','aura:#7df9ff'],'#7df9ff'],
 'Animal Master': ['#6e4b2a',1,'#5a3b24',['bow'],['feather'],[],'#d9b382'],
 'Wolfmaster': ['#5d6d7e',3,'#cfd3d8',['bow'],['ears'],['wolf'],'#cfd6dc'],
 'Eaglemaster': ['#a04000',2,'#a8442a',['bow'],['feather'],['eagle'],'#ffb36b'],
 'Wildwalker': ['#1d6f42',3,'#5a3b24',['dagger','bow'],['hood:#145a32'],[],'#8fe0a8'],
 'Wildman': ['#196f3d',3,'#a8442a',['dagger','bow'],['hood:#0e3d22'],['cape:#0e3d22'],'#8fe0a8'],
 'Masterman': ['#7d6608',0,'#1d1a1a',['sword','bow'],['feather'],['cape:#5c4a06'],'#e8d26a'],
 'Magician': ['#2e86c1',0,'#1d1a1a',['wand'],['hat'],[],'#8fd8ff'],
 'Wizard': ['#1f618d',0,'#cfd3d8',['staff:#8fd8ff'],['hat'],[],'#8fd8ff'],
 'High Wizard': ['#154360',0,'#cfd3d8',['staff:#ff7a3c'],['hat:#0e2a40'],['cape:#0e2a40','orbs:#ff7a3c,#8fd8ff'],'#ff7a3c'],
 'Galaxy Magic': ['#1b1464',1,'#cfd3d8',['staff:#e0a8ff'],['hat:#120d44'],['cape:#120d44','stars','aura:#a29bfe'],'#a29bfe'],
 'Sage': ['#5b2c83',0,'#5a3b24',['wand','book'],['hat:#4a235a'],[],'#d2a8ff'],
 'Sagemaster': ['#4a235a',2,'#cfd3d8',['wand','book'],['hat:#341a42'],['aura:#d2a8ff'],'#d2a8ff'],
 'Elemental': ['#117864',1,'#1d1a1a',['wand'],['hat:#0b5345'],['orbs:#ff5c3c,#4fc3f7,#7ed957'],'#7ed957'],
 'Summoner': ['#117a65',3,'#1d1a1a',['wand','book'],['hood:#0b5345'],[],'#7ee0c4'],
 'Summonmonster': ['#0e6655',3,'#a8442a',['wand','book'],['hood:#0b4a3e'],['slime'],'#7ee0c4'],
 'Darksummon': ['#2c1338',3,'#cfd3d8',['book'],['hood:#1b0a24','horns:#8e44ad'],['ghost','aura:#9b59b6'],'#b57edc'],
 'Magic Sword': ['#2874a6',0,'#1d1a1a',['sword'],['headband:#8fd8ff'],[],'#8fd8ff'],
 'Lightsaber': ['#1a5276',0,'#cfd3d8',['lightsaber','orbglove'],['headband:#7df9ff'],['aura:#7df9ff'],'#7df9ff'],
 'Flysword': ['#21618c',3,'#1d1a1a',['sword'],['headband:#8fd8ff'],['fsword','aura:#8fd8ff'],'#8fd8ff'],
 'Acolyte': ['#e9e4d4',1,'#5a3b24',['wand'],['halo'],[],'#fff2a8'],
 'Priest': ['#f4f1e8',1,'#cfd3d8',['staff:#ffe27a'],['halo'],[],'#fff2a8'],
 'High Priest': ['#fbeec1',1,'#cfd3d8',['staff:#ffe27a'],['halo'],['wings','aura:#fff2a8'],'#fff2a8'],
 'Dark Priest': ['#4a235a',1,'#cfd3d8',['staff:#c56cf0'],['hood:#2c1338','halo:#9b59b6'],['cape:#2c1338','orbs:#9b59b6'],'#b57edc'],
 'Monk': ['#e67e22',3,'#1d1a1a',['fists'],['headband:white'],[],'#ffb36b'],
 'Ashura': ['#922b21',3,'#cfd3d8',['fists'],['headband:#ffd24a'],['orbs:#ff4a3c,#ff4a3c','aura:#ff4a3c'],'#ff4a3c'],
 'Taekwondo': ['#f4f1e8',0,'#1d1a1a',['shoes'],['headband:#2e86c1'],['aura:#8fd8ff'],'#8fd8ff'],
 'Muay Thai': ['#d4ac0d',0,'#1d1a1a',['fists'],['headband:#c0392b'],['sparks:#ffd24a'],'#ffd24a'],
 'Assen': ['#7e5109',0,'#5a3b24',['club'],['headband:#e0a020'],[],'#e0b070'],
 'Ringmaster': ['#922b21',0,'#1d1a1a',['club'],['tophat'],['cape:#5b1a14','sparks:#ffd24a'],'#ffd24a'],
 'Biwposter': ['#5d4037',2,'#1d1a1a',['club','glove'],['headband:#cfd6dc'],['aura:#e0b070'],'#e0b070'],
 'Holy Knight': ['#e8dcae',0,'#e0b73a',['sword','shield'],['helm:gold'],['cape:#fff6d0','aura:#ffe27a','sparks:#ffe27a'],'#ffe27a'],
 'Ancient Controller': ['#7a5c2e',3,'#2c3e50',['staff:#e0b73a','book'],['hood:#4a3a1e'],['cape:#4a3a1e','orbs:#e0b73a,#7ee0c4','aura:#e0b73a'],'#e0b73a'],
 'Solo Player': ['#17171f',1,'#1d1a1a',['sword2'],['headband:#c0392b'],['cape:#0d0d12','aura:#8a96a3','sparks:#cfd6dc'],'#9aa5b1']
};
const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const ln = (x1,y1,x2,y2,c,w) => { C.strokeStyle=c; C.lineWidth=w; C.lineCap='round'; C.beginPath(); C.moveTo(x1,y1); C.lineTo(x2,y2); C.stroke(); };
const circ = (x,y,r,f,s,lw) => { C.beginPath(); C.arc(x,y,r,0,6.2832); if (f) { C.fillStyle=f; C.fill(); } if (s) { C.strokeStyle=s; C.lineWidth=lw||1; C.stroke(); } };
const pg = (pts,f,s,lw) => { C.beginPath(); pts.forEach((p,i)=>i?C.lineTo(p[0],p[1]):C.moveTo(p[0],p[1])); C.closePath(); if (f) { C.fillStyle=f; C.fill(); } if (s) { C.strokeStyle=s; C.lineWidth=lw||1; C.stroke(); } };
const glow = (x,y,r,col) => { const g = C.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,tint(col,.95)); g.addColorStop(.35,tint(col,.45)); g.addColorStop(1,tint(col,0)); C.fillStyle=g; C.beginPath(); C.arc(x,y,r,0,6.2832); C.fill(); };
const star = (x,y,r,c) => { C.fillStyle=c; C.beginPath(); for (let i=0;i<10;i++){ const a=-1.5708+i*0.62832, rr=i%2?r*.45:r; C.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);} C.closePath(); C.fill(); };
const STEEL = '#e6edf4', STEEL2 = '#9fb0bf', WOOD = '#7a4b22', GOLD = '#e0b73a';
const arg = (s) => { const i = s.indexOf(':'); return i < 0 ? [s, null] : [s.slice(0, i), s.slice(i + 1)]; };

function weapon(spec) {
  const [k, a] = arg(spec);
  switch (k) {
    case 'sword': ln(13,-18,14.5,-54,STEEL2,5); ln(13,-18,14.5,-54,STEEL,3); ln(8.5,-19,17.5,-19,'#8a5a2b',3); circ(13,-13.5,2,'#8a5a2b'); break;
    case 'sword2h': ln(13,-14,15.5,-72,STEEL2,8); ln(13,-14,15.5,-72,STEEL,5); ln(13.8,-20,14.8,-66,'#fff',1.2); ln(6,-18,21,-18,'#8a5a2b',4); circ(13,-9,2.6,'#8a5a2b'); break;
    case 'katana': C.strokeStyle='#dfe6ee'; C.lineWidth=3; C.lineCap='round'; C.beginPath(); C.moveTo(13,-24); C.quadraticCurveTo(10,-48,21,-68); C.stroke(); circ(13,-22,3.4,GOLD,'#7a5a10',1); ln(13,-14,13,-22,'#a93226',4); break;
    case 'dagger': ln(13,-17,14.2,-34,STEEL2,4.2); ln(13,-17,14.2,-34,STEEL,2.4); ln(9.5,-18,16.5,-18,'#6b4a2e',2.6); break;
    case 'sword2': weapon('sword'); C.save(); C.scale(-1,1); weapon('sword'); C.restore(); break;
    case 'dagger2': weapon('dagger'); C.save(); C.scale(-1,1); weapon('dagger'); C.restore(); break;
    case 'katar': pg([[9.5,-18],[16.5,-18],[13,-48]],STEEL,STEEL2,1.4); ln(9,-17,17,-17,'#5a3b24',3); break;
    case 'katar2': weapon('katar'); C.save(); C.scale(-1,1); weapon('katar'); C.restore(); break;
    case 'kunai': circ(13,-12,3.4,null,'#2b2b2b',1.8); pg([[13,-15.5],[16,-24],[13,-38],[10,-24]],'#cfd6dc','#6b7886',1.2); break;
    case 'whip': C.strokeStyle='#6b3a14'; C.lineWidth=2.4; C.lineCap='round'; C.beginPath(); C.moveTo(13,-16); C.bezierCurveTo(34,-28,-6,-46,24,-64); C.stroke(); ln(12,-12,13,-18,'#2b1a0c',4); break;
    case 'bow': C.strokeStyle=WOOD; C.lineWidth=3.2; C.lineCap='round'; C.beginPath(); C.moveTo(-14,-58); C.quadraticCurveTo(-36,-30,-14,-2); C.stroke(); ln(-14,-58,-14,-2,'#eee',.9); break;
    case 'longbow': C.strokeStyle='#5a3414'; C.lineWidth=3.6; C.lineCap='round'; C.beginPath(); C.moveTo(-14,-76); C.quadraticCurveTo(-42,-36,-14,4); C.stroke(); ln(-14,-76,-14,4,'#eee',.9); ln(-14,-34,-6,-34,'#c0392b',1.4); break;
    case 'gun': C.fillStyle='#3a3f47'; C.fillRect(10,-26,23,5.5); C.fillRect(10,-23,6,12); C.fillStyle='#a67c2b'; C.fillRect(18,-27.5,6,2.2); C.fillStyle='#8a5a2b'; C.fillRect(10,-18,6,7); break;
    case 'staff': ln(14,-2,14,-68,WOOD,3.2); glow(14,-74,13,a||'#8fd8ff'); circ(14,-74,5.2,a||'#8fd8ff','#fff',1.4); break;
    case 'wand': ln(13,-16,22,-38,WOOD,2.6); star(22.5,-41,5,'#ffe27a'); break;
    case 'book': pg([[-27,-33],[-11,-30],[-11,-12],[-27,-15]],'#5b2c83','#2a1240',1.4); pg([[-26,-31.5],[-12.5,-29],[-12.5,-14],[-26,-16.5]],'#f5eedd'); ln(-24,-26,-15,-24.5,'#999',1); ln(-24,-21,-15,-19.5,'#999',1); break;
    case 'fists': for (const s of [-1,1]) { circ(s*12.5,-14,7,'#cfb26a','#5a4a22',2); for (let i=-1;i<=1;i++) circ(s*12.5+i*3.4,-19.5,1.5,'#6b5a2a'); } break;
    case 'glove': circ(-12.5,-14,7,'#cfb26a','#5a4a22',2); break;
    case 'shoes': glow(0,-3,26,'#8fd8ff'); for (const s of [-1,1]) { C.fillStyle='#e8f6ff'; C.strokeStyle='#2e86c1'; C.lineWidth=1.6; C.beginPath(); C.ellipse(s*4.4,-3.5,7.2,5.6,0,0,6.3); C.fill(); C.stroke(); } break;
    case 'club': ln(13,-12,15,-54,'#8a5a2b',7); ln(13,-12,15,-54,'#b07a3c',3.4); ln(10.5,-24,17.5,-24,'#d9a93a',2); ln(11.5,-38,18.5,-38,'#d9a93a',2); circ(15,-56,3.6,'#8a5a2b'); break;
    case 'shield': circ(-17,-24,12.5,'#d5dbe1','#5a6672',2.2); circ(-17,-24,4.4,GOLD,'#7a5a10',1); break;
    case 'greatshield': C.fillStyle='#aeb8c2'; C.strokeStyle='#4a5560'; C.lineWidth=2.6; C.beginPath(); C.moveTo(-26,-70); C.lineTo(16,-70); C.lineTo(16,-26); C.quadraticCurveTo(-5,-4,-26,-26); C.closePath(); C.fill(); C.stroke(); pg([[-20,-62],[10,-62],[10,-28],[-5,-12],[-20,-28]],'#c0392b','#7b241c',1.6); star(-5,-42,9,GOLD); break;
    case 'orbglove': circ(-12.5,-14,6.4,'#34495e','#9fb0bf',1.6); glow(-14,-34,15,'#c56cf0'); circ(-14,-34,6,'#e8c8ff','#8e44ad',1.6); C.strokeStyle='rgba(255,255,255,.7)'; C.lineWidth=1.2; C.beginPath(); C.ellipse(-14,-34,10,3.4,-.4,0,6.3); C.stroke(); break;
    case 'lightsaber': ln(13,-18,15,-70,'rgba(125,249,255,.35)',9); ln(13,-18,15,-70,'#7df9ff',4.4); ln(13,-18,15,-70,'#fff',1.8); ln(13,-14,13.4,-22,'#555',4); break;
  }
}
function head(spec, o) {
  const [k, a] = arg(spec);
  switch (k) {
    case 'helm': C.fillStyle = a==='gold'?'#e0b73a':a==='white'?'#f4f1e8':'#aeb8c2'; C.strokeStyle='#4a5560'; C.lineWidth=1.6; C.beginPath(); C.arc(0,-43,14.2,Math.PI,0); C.lineTo(14.2,-38); C.lineTo(-14.2,-38); C.closePath(); C.fill(); C.stroke(); ln(0,-57,0,-43,'#4a5560',1.4); C.fillStyle=a==='gold'?'#c0392b':'#c0392b'; C.beginPath(); C.moveTo(0,-57); C.quadraticCurveTo(8,-70,16,-56); C.quadraticCurveTo(8,-62,0,-57); C.fill(); break;
    case 'horns': pg([[-8,-52],[-12,-60],[-18,-68],[-5,-57]],a||'#e8d8c0','#6b5a40',1.2); pg([[8,-52],[12,-60],[18,-68],[5,-57]],a||'#e8d8c0','#6b5a40',1.2); break;
    case 'hat': C.fillStyle=a||'#1f4e79'; C.strokeStyle='rgba(0,0,0,.35)'; C.lineWidth=1.4; C.beginPath(); C.ellipse(0,-50,20,5.6,0,0,6.3); C.fill(); C.stroke(); pg([[-12,-51],[12,-51],[3,-82],[-3,-80]],a||'#1f4e79','rgba(0,0,0,.35)',1.4); ln(-12,-53,12,-53,GOLD,2.4); star(0,-60,3.6,'#ffe27a'); break;
    case 'hood': C.fillStyle=a||'#2b2b3a'; C.beginPath(); C.arc(0,-42,15.6,Math.PI*.9,Math.PI*2.1); C.lineTo(15,-27); C.lineTo(-15,-27); C.closePath(); C.moveTo(10.6,-38); C.ellipse(0,-38,10.6,10.2,0,0,6.2832); C.fill('evenodd'); break;
    case 'headband': ln(-12,-45,12,-45,a||'#c0392b',4); ln(12,-45,22,-40,a||'#c0392b',3); ln(12,-45,21,-48,a||'#c0392b',3); break;
    case 'halo': C.strokeStyle=a||'#ffe27a'; C.lineWidth=3; C.beginPath(); C.ellipse(0,-62,11,3.8,0,0,6.3); C.stroke(); glow(0,-62,16,a||'#ffe27a'); break;
    case 'goggles': ln(-13,-46,13,-46,'#5a3b24',3.4); for (const s of [-1,1]) { circ(s*5.6,-47.5,4.6,a||'#8fd8ff','#b07a2a',2); } break;
    case 'feather': ln(9,-52,16,-70,'#2f9e5b',3); ln(9,-52,16,-70,'#8fe0a8',1); ln(10,-52,15,-60,'#c0392b',1.4); break;
    case 'mask': C.fillStyle='rgba(20,20,28,.96)'; C.beginPath(); C.moveTo(-9.6,-37); C.lineTo(9.6,-37); C.lineTo(7,-29); C.lineTo(-7,-29); C.closePath(); C.fill(); break;
    case 'jester': pg([[-12,-50],[-24,-64],[-6,-55]],'#8e44ad','#4a235a',1.2); pg([[12,-50],[24,-64],[6,-55]],'#e0a020','#7a5a10',1.2); pg([[-9,-52],[9,-52],[0,-62]],'#c0392b','#7b241c',1.2); circ(-24,-65,2.6,'#ffd24a'); circ(24,-65,2.6,'#ffd24a'); break;
    case 'ears': pg([[-11,-51],[-9,-66],[-2,-54]],'#9aa7b3','#4a5560',1.2); pg([[11,-51],[9,-66],[2,-54]],'#9aa7b3','#4a5560',1.2); pg([[-9,-54],[-8.5,-62],[-5,-55]],'#e8a0a0'); pg([[9,-54],[8.5,-62],[5,-55]],'#e8a0a0'); break;
    case 'tophat': C.fillStyle='#1b1b24'; C.beginPath(); C.ellipse(0,-52,17,4.4,0,0,6.3); C.fill(); C.fillRect(-10,-76,20,24); ln(-10,-56,10,-56,'#c0392b',4); C.beginPath(); C.ellipse(0,-76,10,3,0,0,6.3); C.fill(); break;
  }
}
function pet(k, side) {
  C.save(); C.translate(side * 34, 0);
  if (k === 'wolf') { C.scale(side, 1); C.fillStyle='#9aa7b3'; C.strokeStyle='#4a5560'; C.lineWidth=1.4; C.beginPath(); C.ellipse(0,-12,13,7.5,0,0,6.3); C.fill(); C.stroke(); C.beginPath(); C.ellipse(11,-19,6.6,6,0,0,6.3); C.fill(); C.stroke(); pg([[8,-23],[9,-31],[13,-24]],'#9aa7b3','#4a5560',1.2); pg([[13,-24],[16,-30],[17,-22]],'#9aa7b3','#4a5560',1.2); circ(13,-19.5,1.1,'#222'); for (const x of [-8,-3,5,9]) ln(x,-6,x,0,'#6c7a86',2.6); C.strokeStyle='#9aa7b3'; C.lineWidth=3.4; C.beginPath(); C.moveTo(-12,-14); C.quadraticCurveTo(-22,-20,-20,-28); C.stroke(); }
  if (k === 'panther') { C.scale(side, 1); C.fillStyle='#2c2c3a'; C.strokeStyle='#14141c'; C.lineWidth=1.4; C.beginPath(); C.ellipse(0,-12,14,6.4,0,0,6.3); C.fill(); C.stroke(); C.beginPath(); C.ellipse(12,-17,6,5.4,0,0,6.3); C.fill(); C.stroke(); circ(14,-18,1.4,'#ffd24a'); circ(10.5,-18,1.4,'#ffd24a'); for (const x of [-9,-4,6,10]) ln(x,-6,x,0,'#14141c',3); C.strokeStyle='#2c2c3a'; C.lineWidth=3; C.beginPath(); C.moveTo(-13,-13); C.quadraticCurveTo(-26,-14,-24,-26); C.stroke(); }
  if (k === 'robot') { C.fillStyle='#9fb4c7'; C.strokeStyle='#3d4f60'; C.lineWidth=1.6; C.fillRect(-9,-30,18,14); C.strokeRect(-9,-30,18,14); C.fillRect(-11,-16,22,14); C.strokeRect(-11,-16,22,14); circ(-3.5,-24,2.6,'#7df9ff'); circ(3.5,-24,2.6,'#7df9ff'); ln(0,-30,0,-38,'#3d4f60',1.6); circ(0,-39,2,'#ff4a3c'); ln(-11,-10,-17,-6,'#3d4f60',3); ln(11,-10,17,-6,'#3d4f60',3); }
  if (k === 'slime') { C.fillStyle='rgba(126,224,196,.92)'; C.strokeStyle='#1f8a70'; C.lineWidth=1.6; C.beginPath(); C.moveTo(-14,0); C.quadraticCurveTo(-16,-24,0,-24); C.quadraticCurveTo(16,-24,14,0); C.closePath(); C.fill(); C.stroke(); circ(-5,-13,2,'#16423a'); circ(5,-13,2,'#16423a'); }
  if (k === 'ghost') { glow(0,-26,22,'#9b59b6'); C.fillStyle='rgba(235,225,250,.92)'; C.beginPath(); C.moveTo(-12,-6); C.quadraticCurveTo(-14,-34,0,-34); C.quadraticCurveTo(14,-34,12,-6); C.lineTo(7,-10); C.lineTo(2,-5); C.lineTo(-3,-10); C.lineTo(-8,-5); C.closePath(); C.fill(); circ(-4.5,-24,2.3,'#4a235a'); circ(4.5,-24,2.3,'#4a235a'); C.fillStyle='#4a235a'; C.beginPath(); C.ellipse(0,-17,2.2,3,0,0,6.3); C.fill(); }
  C.restore();
}
function extrasBack(list, acc) {
  for (const e of list) { const [k, a] = arg(e);
    if (k === 'aura') { glow(0,-30,56,a); }
    if (k === 'cape') { pg([[-12,-32],[12,-32],[20,-2],[-20,-2]],a,'rgba(0,0,0,.4)',1.4); }
    if (k === 'wings') { for (const s of [-1,1]) { C.fillStyle='rgba(255,252,235,.96)'; C.strokeStyle='#d9c27a'; C.lineWidth=1.6; C.beginPath(); C.moveTo(s*8,-40); C.bezierCurveTo(s*40,-78,s*52,-40,s*30,-14); C.bezierCurveTo(s*34,-26,s*24,-30,s*22,-30); C.bezierCurveTo(s*24,-24,s*16,-22,s*10,-22); C.closePath(); C.fill(); C.stroke(); } }
    if (k === 'shadow') { C.fillStyle='rgba(20,20,40,.45)'; C.beginPath(); C.ellipse(-22,-30,9,26,0.15,0,6.3); C.fill(); circ(-22,-56,8,'rgba(20,20,40,.45)'); }
    if (k === 'fsword') { for (let i=0;i<3;i++) { C.save(); C.translate(-30+i*8, -60+i*16); C.rotate(-0.5+i*0.1); ln(0,0,0,-22,STEEL2,5); ln(0,0,0,-22,STEEL,3); ln(-4,-1,4,-1,'#8a5a2b',2.4); C.restore(); } }
    if (k === 'fshield') { for (const s of [-1,1]) { circ(s*30,-60+(s>0?10:0),9.5,'#d5dbe1','#5a6672',2); circ(s*30,-60+(s>0?10:0),3.4,GOLD); } }
    if (k === 'fdagger') { for (let i=0;i<3;i++) { C.save(); C.translate(26+i*3, -66+i*14); C.rotate(0.4*i); ln(0,0,0,-14,STEEL2,4); ln(0,0,0,-14,STEEL,2.2); C.restore(); } }
    if (k === 'pack') { C.fillStyle='#8a5a2b'; C.strokeStyle='#4a2c10'; C.lineWidth=1.6; C.beginPath(); C.ellipse(-14,-26,7,10,0.2,0,6.3); C.fill(); C.stroke(); }
  }
}
function extrasFront(list, acc) {
  const orbs = (cols) => cols.forEach((c, i) => { const a = i / cols.length * 6.28 + 0.6, x = Math.cos(a) * 36, y = -42 + Math.sin(a) * 12 - i * 4; glow(x,y,12,c); circ(x,y,4.6,c,'#fff',1); });
  for (const e of list) { const [k, a] = arg(e);
    if (k === 'orbs') orbs(a.split(','));
    if (k === 'sparks') for (let i=0;i<7;i++) { const x=-34+i*11+(i%2)*4, y=-62+((i*37)%52); star(x,y,3+(i%3),a); }
    if (k === 'stars') for (let i=0;i<9;i++) { const x=-38+i*9.5, y=-70+((i*29)%62); star(x,y,2.6+(i%3),['#fff','#ffe27a','#c9b8ff'][i%3]); }
    if (k === 'flames') for (let i=0;i<5;i++) { const x=-30+i*15, y=-8-((i*13)%16); glow(x,y,13,a); circ(x,y,3.4,'#e8c8ff'); }
    if (k === 'coins') for (let i=0;i<4;i++) { circ(-28+i*18,-70+((i*31)%24),4.2,'#ffd24a','#a67c10',1.2); }
    if (k === 'gear') { C.strokeStyle='#8a6a2a'; C.lineWidth=3; circ(-28,-58,6,null,'#8a6a2a',3); for (let i=0;i<8;i++) { const a2=i*.785; ln(-28+Math.cos(a2)*6,-58+Math.sin(a2)*6,-28+Math.cos(a2)*9,-58+Math.sin(a2)*9,'#8a6a2a',3); } }
    if (k === 'drones') for (let i=0;i<2;i++) { const x=-32+i*64, y=-72+i*6; glow(x,y,13,a); C.fillStyle='#2c3e50'; C.strokeStyle=a; C.lineWidth=1.4; C.beginPath(); C.ellipse(x,y,7.5,4.2,0,0,6.3); C.fill(); C.stroke(); circ(x,y,2,a); }
    if (k === 'eagle') { const x=-17, y=-56; C.fillStyle='#6e3b12'; C.beginPath(); C.ellipse(x,y,9,6.4,-0.3,0,6.3); C.fill(); circ(x+7,y-6,4.4,'#f5eedd','#6e3b12',1); pg([[x+10,y-6],[x+16,y-4],[x+10,y-3]],'#ffb300'); pg([[x-6,y],[x-18,y+8],[x-4,y+4]],'#4e2a0c'); }
  }
}

  const wpnMap = { sword: 'sword', sword2h: 'sword2h', shield: 'shield', greatshield: 'greatshield', katana: 'katana', orbglove: 'orbglove', lightsaber: 'lightsaber', dagger: 'dagger', katar: 'katar', kunai: 'kunai', whip: 'whip', bow: 'bow', longbow: 'longbow', gun: 'gun', staff: 'staff:#8fd8ff', wand: 'wand', book: 'book', fists: 'fists', shoes: 'shoes', club: 'club', glove: 'glove' };
  window.JobArt = {
    J, wpnMap,
    bind(c) { C = c; },
    weapon(spec) { weapon(spec); },
    head(spec) { head(spec); },
    pet(k, side) { pet(k, side); },
    back(job, t) { const sp = J[job]; if (!sp) return; extrasBack(sp[5], sp[6]); for (const e of sp[5]) if (['wolf', 'panther', 'robot', 'slime', 'ghost'].indexOf(e) >= 0) pet(e, -1); },
    front(job, t) { const sp = J[job]; if (sp) extrasFront(sp[5], sp[6]); },
    heads(job) { const sp = J[job]; if (sp) for (const h of sp[4]) head(h); },
    glowAura(x, y, r, col) { glow(x, y, r, col); }
  };
})();
