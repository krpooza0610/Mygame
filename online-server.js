#!/usr/bin/env node
/* online-server.js — เซิร์ฟเวอร์ออนไลน์ของ Chathai Online
 * ไม่ต้องติดตั้งแพ็กเกจเพิ่ม (ใช้แค่ Node 18+) : node online-server.js
 * - เสิร์ฟ index.html / game.js
 * - WebSocket ที่ /ws (เขียน RFC 6455 แบบย่อเอง)
 * - เซิร์ฟเวอร์เป็นผู้ตัดสินการเดิน: ไคลเอนต์ส่งแค่ "อยากไปช่องไหน"
 */
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Game = require('./game.js');

const PORT = Number(process.env.PORT) || 3000;
const TICK_MS = 50;                 // จำลองโลก 20 ครั้ง/วินาที (ส่ง snapshot 10 ครั้ง/วินาที)
const MAX_FRAME = 8 * 1024;         // ข้อความจากไคลเอนต์ใหญ่สุด
const MAX_CONNS = 300;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const hub = new Game.Hub();

/* ------------------------------------------------------------------ บัญชีผู้เล่น
 * เก็บใน DATA_DIR/accounts.json (ค่าเริ่มต้น ./data) — รหัสผ่านเก็บแบบ scrypt ไม่เก็บตัวจริง
 * ล็อกอินสำเร็จได้ token ที่เซ็นด้วย HMAC (อายุ 30 วัน) ใช้ยืนยันตอนเข้า WebSocket
 * Google: ตั้ง GOOGLE_CLIENT_ID แล้วปุ่ม G จะใช้งานได้
 */
const https = require('https');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'accounts.json');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const TOKEN_TTL = 30 * 24 * 3600 * 1000;
let db = { secret: crypto.randomBytes(32).toString('hex'), users: {} };
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
try { const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); if (d && d.users) db = Object.assign(db, d); } catch (e) {}
let dirty = true;
function flush() {
  if (!dirty) return;
  dirty = false;
  try { fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db)); fs.renameSync(DB_FILE + '.tmp', DB_FILE); }
  catch (e) { dirty = true; console.error('บันทึกบัญชีไม่ได้:', e.message); }
}
setInterval(flush, 8000).unref();

const scrypt = (pw, salt) => new Promise((ok, no) => crypto.scrypt(pw, salt, 32, (e, k) => (e ? no(e) : ok(k.toString('hex')))));
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const signTok = key => {
  const body = Buffer.from(JSON.stringify({ k: key, e: Date.now() + TOKEN_TTL })).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', db.secret).update(body).digest('base64url');
};
function verifyTok(tok) {
  if (typeof tok !== 'string' || tok.length > 400) return null;
  const [body, sig] = tok.split('.');
  if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', db.secret).update(body).digest('base64url');
  if (!safeEq(sig, good)) return null;
  try { const o = JSON.parse(Buffer.from(body, 'base64url').toString()); return o.e > Date.now() && db.users[o.k] ? o.k : null; } catch (e) { return null; }
}
function newRecovery() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i = 0; i < 12; i++) s += a[crypto.randomInt(a.length)];
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8);
}
const normId = s => String(s || '').trim().toLowerCase();
const idOk = s => /^[a-z0-9_]{3,16}$/.test(s);
const pwOk = s => typeof s === 'string' && s.length >= 6 && s.length <= 64;
const MAX_CHARS = 5;
const TEST_ID = 'phutest', TEST_PW = process.env.TEST_PW || 'Chathai#2026';
const isGm = k => !process.env.GM_OFF && (k === TEST_ID || (db.users[k] && (db.users[k].gm || db.users[k].label === TEST_ID + '@chathai.online')));
// ย้ายบัญชีเก่า (ตัวละครเดียว u.char) → รายการตัวละคร u.chars
function chars(u) {
  if (!u.chars) u.chars = [];
  if (u.char) { u.chars.push({ cid: 'c' + crypto.randomBytes(5).toString('hex'), name: u.char.name, look: u.char.look, save: u.char.save }); delete u.char; dirty = true; }
  return u.chars;
}
const profile = k => { const u = db.users[k]; return { id: u.label || k, gm: isGm(k) ? 1 : 0, max: MAX_CHARS, chars: chars(u).map(c => ({ cid: c.cid, name: c.name, look: c.look, lv: (c.save && c.save.lv) || 1, job: (c.save && c.save.job) || 'Adventurer' })) }; };
const nameTaken = name => Object.keys(db.users).some(k => chars(db.users[k]).some(c => c.name.toLowerCase() === name.toLowerCase()));

const hits = new Map();   // ip -> [เวลา...]
const fails = new Map();  // id -> {n, until}
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000);
  a.push(now); hits.set(ip, a);
  return a.length > 30;
}
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 60000)) hits.delete(k); for (const [k, f] of fails) if (f.until < now) fails.delete(k); }, 60000).unref();
function locked(id) { const f = fails.get(id); return !!f && f.n >= 8 && f.until > Date.now(); }
function failed(id) { const f = fails.get(id) || { n: 0, until: 0 }; f.n++; f.until = Date.now() + 5 * 60000; fails.set(id, f); }

function googleVerify(cred) {
  return new Promise(ok => {
    if (!GOOGLE_CLIENT_ID || typeof cred !== 'string' || cred.length > 4000) return ok(null);
    https.get('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred), r => {
      let d = ''; r.on('data', c => { d += c; if (d.length > 8000) r.destroy(); });
      r.on('end', () => { try { const o = JSON.parse(d); ok(o && o.aud === GOOGLE_CLIENT_ID && o.sub && (o.email_verified === true || o.email_verified === 'true') ? o : null); } catch (e) { ok(null); } });
    }).on('error', () => ok(null)).setTimeout(6000, function () { this.destroy(); });
  });
}


/* ---------------------------------------------------------- Firebase Authentication
 * ไคลเอนต์ล็อกอินกับ Firebase (อีเมล / Google / เกสต์) แล้วส่ง ID token มาให้เซิร์ฟเวอร์
 * เซิร์ฟเวอร์ตรวจลายเซ็น RS256 ด้วยใบรับรองสาธารณะของ Google (ไม่ต้องติดตั้งแพ็กเกจ)
 * ตั้ง FIREBASE_PROJECT_ID ให้ตรงกับโปรเจกต์ (ค่าเริ่มต้น mygame-88bab)
 */
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'mygame-88bab';
const FB_CERTS_URL = process.env.FIREBASE_CERTS_URL || 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let fbCerts = {}, fbCertsAt = 0, fbCertsBusy = null;
function loadCerts() {
  if (fbCertsBusy) return fbCertsBusy;
  fbCertsBusy = new Promise(ok => {
    const lib = FB_CERTS_URL.startsWith('http:') ? http : https;
    lib.get(FB_CERTS_URL, r => {
      let d = ''; r.on('data', c => { d += c; if (d.length > 100000) r.destroy(); });
      r.on('end', () => { try { const o = JSON.parse(d); if (o && typeof o === 'object') { fbCerts = o; fbCertsAt = Date.now(); } } catch (e) {} ok(); });
    }).on('error', () => ok()).setTimeout(8000, function () { this.destroy(); });
  }).then(() => { fbCertsBusy = null; });
  return fbCertsBusy;
}
loadCerts();
setInterval(loadCerts, 6 * 3600 * 1000).unref();
const looksJwt = t => typeof t === 'string' && t.length < 4000 && t.split('.').length === 3;
function fbVerify(tok) {   // ตรวจแบบ sync จากใบรับรองที่โหลดไว้แล้ว → payload หรือ null
  try {
    const [h, p, sig] = tok.split('.');
    const head = JSON.parse(Buffer.from(h, 'base64url').toString());
    const cert = fbCerts[head.kid];
    if (head.alg !== 'RS256' || !cert) return null;
    if (!crypto.createVerify('RSA-SHA256').update(h + '.' + p).verify(cert, sig, 'base64url')) return null;
    const pl = JSON.parse(Buffer.from(p, 'base64url').toString()), now = Date.now() / 1000;
    if (pl.aud !== FB_PROJECT || pl.iss !== 'https://securetoken.google.com/' + FB_PROJECT) return null;
    if (!pl.sub || pl.sub.length > 128 || !(pl.exp > now) || pl.iat > now + 300) return null;
    return pl;
  } catch (e) { return null; }
}
function fbUser(pl) {   // payload → key ของผู้ใช้ (สร้างระเบียนให้ถ้ายังไม่มี)
  const key = 'f' + pl.sub;
  const anon = !!(pl.firebase && pl.firebase.sign_in_provider === 'anonymous');
  const label = String(pl.email || pl.name || (anon ? 'เกสต์' : 'ผู้เล่น')).slice(0, 40);
  if (!db.users[key]) { db.users[key] = { label, chars: [], made: Date.now(), anon }; dirty = true; }
  else if (db.users[key].label !== label) { db.users[key].label = label; dirty = true; }
  return key;
}
async function resolveKey(b) {
  const t = b.idToken || b.token;
  if (looksJwt(t)) {
    if (!fbCerts || !Object.keys(fbCerts).length) await loadCerts();
    let pl = fbVerify(t);
    if (!pl && Date.now() - fbCertsAt > 60000) { await loadCerts(); pl = fbVerify(t); }   // กุญแจอาจถูกหมุน
    return pl ? fbUser(pl) : null;
  }
  return verifyTok(t);
}

async function api(route, b) {
  switch (route) {
    case 'config': return { ok: 1, google: GOOGLE_CLIENT_ID || null, firebase: FB_PROJECT };
    case 'signup': {
      const id = normId(b.id);
      if (!idOk(id)) return { err: 'ไอดีต้องเป็น a-z 0-9 _ ยาว 3-16 ตัว' };
      if (!pwOk(b.pw)) return { err: 'รหัสผ่านต้องยาว 6-64 ตัว' };
      if (db.users[id]) return { err: 'ไอดีนี้มีคนใช้แล้ว' };
      if (Object.keys(db.users).length >= 20000) return { err: 'ระบบรับสมัครเต็มชั่วคราว' };
      const salt = crypto.randomBytes(16).toString('hex'), rsalt = crypto.randomBytes(16).toString('hex'), code = newRecovery();
      db.users[id] = { salt, hash: await scrypt(b.pw, salt), rsalt, rhash: await scrypt(code, rsalt), chars: [], made: Date.now() };
      dirty = true;
      return { ok: 1, token: signTok(id), recovery: code, me: profile(id) };
    }
    case 'login': {
      const id = normId(b.id);
      if (locked(id)) return { err: 'ใส่ผิดหลายครั้ง รอ 5 นาทีแล้วลองใหม่' };
      const u = db.users[id];
      if (!u || !u.hash || !pwOk(b.pw) || !safeEq(await scrypt(b.pw, u.salt), u.hash)) { failed(id); return { err: 'ไอดีหรือรหัสผ่านไม่ถูกต้อง' }; }
      fails.delete(id);
      return { ok: 1, token: signTok(id), me: profile(id) };
    }
    case 'forgot': {
      const id = normId(b.id);
      if (locked(id)) return { err: 'ใส่ผิดหลายครั้ง รอ 5 นาทีแล้วลองใหม่' };
      const u = db.users[id], code = String(b.code || '').trim().toUpperCase();
      if (!pwOk(b.pw)) return { err: 'รหัสผ่านใหม่ต้องยาว 6-64 ตัว' };
      if (!u || !u.rhash || !safeEq(await scrypt(code, u.rsalt), u.rhash)) { failed(id); return { err: 'ไอดีหรือรหัสกู้คืนไม่ถูกต้อง' }; }
      fails.delete(id);
      const nc = newRecovery();
      u.salt = crypto.randomBytes(16).toString('hex'); u.hash = await scrypt(b.pw, u.salt);
      u.rsalt = crypto.randomBytes(16).toString('hex'); u.rhash = await scrypt(nc, u.rsalt);
      dirty = true;
      return { ok: 1, token: signTok(id), recovery: nc, me: profile(id) };
    }
    case 'google': {
      const g = await googleVerify(b.credential);
      if (!g) return { err: 'ล็อกอินด้วย Google ไม่สำเร็จ' };
      const key = 'g' + g.sub;
      if (!db.users[key]) { db.users[key] = { label: String(g.name || g.email || 'Google').slice(0, 24), chars: [], made: Date.now() }; dirty = true; }
      return { ok: 1, token: signTok(key), me: profile(key) };
    }
    case 'guest': {
      if (Object.keys(db.users).length >= 20000) return { err: 'ระบบรับสมัครเต็มชั่วคราว' };
      const key = 'u' + crypto.randomBytes(8).toString('hex');
      db.users[key] = { label: 'เกสต์', chars: [], made: Date.now(), anon: true }; dirty = true;
      return { ok: 1, token: signTok(key), me: profile(key) };
    }
    case 'me': {
      const k = await resolveKey(b);
      return k ? { ok: 1, me: profile(k) } : { err: 'หมดเวลาเข้าสู่ระบบ ล็อกอินใหม่อีกครั้ง', relogin: 1 };
    }
    case 'char': {
      const k = await resolveKey(b);
      if (!k) return { err: 'หมดเวลาเข้าสู่ระบบ ล็อกอินใหม่อีกครั้ง', relogin: 1 };
      const u = db.users[k], cs = chars(u);
      if (cs.length >= MAX_CHARS) return { err: 'สร้างตัวละครได้สูงสุด ' + MAX_CHARS + ' ตัว' };
      const name = Game.cleanName(b.name);
      if (name.length < 2) return { err: 'ชื่อตัวละครสั้นเกินไป (อย่างน้อย 2 ตัว)' };
      if (nameTaken(name)) return { err: 'ชื่อนี้มีคนใช้แล้ว' };
      const cid = 'c' + crypto.randomBytes(5).toString('hex');
      cs.push({ cid, name, look: Game.cleanLook(b.look), save: null });
      dirty = true;
      return { ok: 1, cid, me: profile(k) };
    }
    case 'delchar': {
      const k = await resolveKey(b);
      if (!k) return { err: 'หมดเวลาเข้าสู่ระบบ ล็อกอินใหม่อีกครั้ง', relogin: 1 };
      const cs = chars(db.users[k]), i = cs.findIndex(c => c.cid === b.cid);
      if (i < 0) return { err: 'ไม่พบตัวละครนี้' };
      for (const c of Array.from(hub.conns)) if (c.acct === k && c.cid === b.cid) hub.drop(c);
      cs.splice(i, 1); dirty = true;
      return { ok: 1, me: profile(k) };
    }
  }
  return { err: 'ไม่รู้จักคำสั่งนี้' };
}

function handleApi(req, res, route) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const out = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  if (limited(ip)) return out(429, { err: 'ลองถี่เกินไป รอสักครู่นะ' });
  if (route === 'config' && req.method === 'GET') return out(200, { ok: 1, google: GOOGLE_CLIENT_ID || null, firebase: FB_PROJECT });
  if (req.method !== 'POST') return out(405, { err: 'method' });
  let body = '', over = false;
  req.on('data', c => { body += c; if (body.length > 4096) { over = true; req.destroy(); } });
  req.on('end', () => {
    if (over) return;
    let b; try { b = JSON.parse(body || '{}'); } catch (e) { return out(400, { err: 'ข้อมูลไม่ถูกต้อง' }); }
    if (!b || typeof b !== 'object') return out(400, { err: 'ข้อมูลไม่ถูกต้อง' });
    api(route, b).then(r => out(r.err ? 400 : 200, r), () => out(500, { err: 'เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง' }));
  });
}

hub.auth = m => {
  let k = null;
  if (looksJwt(m.token)) { const pl = fbVerify(m.token); k = pl ? fbUser(pl) : null; } else k = verifyTok(m.token);
  const u = k && db.users[k];
  const ch = u && chars(u).find(c => c.cid === m.cid);
  return ch ? { key: k, cid: ch.cid, name: ch.name, look: ch.look, save: ch.save, gm: isGm(k) } : null;
};
hub.onLeave = (c, save) => {
  const u = c.acct && db.users[c.acct], ch = u && chars(u).find(x => x.cid === c.cid);
  if (ch) { ch.save = save; dirty = true; }
};
setInterval(() => {   // เซฟผู้เล่นที่ออนไลน์อยู่ทุก 30 วินาที กันเซิร์ฟเวอร์ดับกะทันหัน
  for (const c of hub.conns) if (c.player && c.acct) hub.onLeave(c, hub.world.saveOf(c.player));
}, 30000).unref();

/* ------------------------------------------------------------- static files */
const FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/game.js': ['game.js', 'text/javascript; charset=utf-8'],
  '/rpg.js': ['rpg.js', 'text/javascript; charset=utf-8'],
  '/jobart.js': ['jobart.js', 'text/javascript; charset=utf-8'],
  '/world.js': ['world.js', 'text/javascript; charset=utf-8'],
  '/themeart.js': ['themeart.js', 'text/javascript; charset=utf-8'],
  '/i18n.js': ['i18n.js', 'text/javascript; charset=utf-8'],
  '/sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
  '/firebase-config.js': ['firebase-config.js', 'text/javascript; charset=utf-8'],
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json; charset=utf-8'],
  '/icon-192.png': ['icon-192.png', 'image/png'],
  '/icon-512.png': ['icon-512.png', 'image/png'],
  '/icon-maskable-512.png': ['icon-maskable-512.png', 'image/png'],
  '/swordman.png': ['swordman.png', 'image/png'],
  '/archer.png': ['archer.png', 'image/png']
};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, players: hub.world.players.size }));
    return;
  }
  if (url.startsWith('/api/')) { handleApi(req, res, url.slice(5)); return; }
  const f = FILES[url];
  if (!f || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  fs.readFile(path.join(__dirname, f[0]), (err, data) => {
    if (err) { res.writeHead(500); res.end('Error'); return; }
    res.writeHead(200, {
      'Content-Type': f[1],
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

/* ---------------------------------------------------------------- websocket */
function encodeFrame(payload, op) {
  const n = payload.length;
  let head;
  if (n < 126) head = Buffer.from([0x80 | op, n]);
  else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(n, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeUInt32BE(0, 2); head.writeUInt32BE(n, 6); }
  return Buffer.concat([head, payload]);
}

function parseFrame(b) {
  if (b.length < 2) return null;
  const fin = !!(b[0] & 0x80), op = b[0] & 0x0f, masked = !!(b[1] & 0x80);
  let len = b[1] & 0x7f, off = 2;
  if (len === 126) { if (b.length < 4) return null; len = b.readUInt16BE(2); off = 4; }
  else if (len === 127) {
    if (b.length < 10) return null;
    if (b.readUInt32BE(2) !== 0) return { bad: 1009 };
    len = b.readUInt32BE(6); off = 10;
  }
  if (len > MAX_FRAME) return { bad: 1009 };
  if (!masked) return { bad: 1002 };            // ไคลเอนต์ต้อง mask เสมอ
  const need = off + 4 + len;
  if (b.length < need) return null;
  const mask = b.subarray(off, off + 4);
  const payload = Buffer.allocUnsafe(len);
  for (let i = 0; i < len; i++) payload[i] = b[off + 4 + i] ^ mask[i & 3];
  return { fin, op, payload, size: need };
}

let conns = 0;
server.on('upgrade', (req, socket) => {
  const url = (req.url || '').split('?')[0];
  const key = req.headers['sec-websocket-key'];
  const origin = req.headers.origin;
  const bad = url !== '/ws' || !key || String(req.headers.upgrade).toLowerCase() !== 'websocket' ||
    conns >= MAX_CONNS || (ALLOWED_ORIGINS.length && origin && !ALLOWED_ORIGINS.includes(origin));
  if (bad) { socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'); return; }

  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  conns++;

  let buf = Buffer.alloc(0);
  let frag = null;
  let alive = true;
  let closed = false;

  const send = str => {
    if (closed || !socket.writable) return;
    if (socket.writableLength > 1 << 20) { end(1013); return; }   // ช้าเกินไป ตัดทิ้ง
    socket.write(encodeFrame(Buffer.from(str), 0x1));
  };
  const conn = hub.connect(send);
  conn.kick = () => { end(4001); socket.destroy(); };

  function end(code) {
    if (closed) return;
    closed = true;
    conns--;
    hub.drop(conn);
    clearInterval(beat);
    try {
      const p = Buffer.alloc(2); p.writeUInt16BE(code || 1000, 0);
      socket.end(encodeFrame(p, 0x8));
    } catch (e) { socket.destroy(); }
  }

  const beat = setInterval(() => {
    if (!alive) { end(1001); socket.destroy(); return; }
    alive = false;
    if (socket.writable) socket.write(encodeFrame(Buffer.alloc(0), 0x9));
  }, 20000);

  socket.on('data', chunk => {
    if (closed) return;
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      const f = parseFrame(buf);
      if (!f) break;
      if (f.bad) { end(f.bad); return; }
      buf = buf.subarray(f.size);
      alive = true;
      if (f.op === 0x8) { end(1000); return; }
      if (f.op === 0x9) { socket.write(encodeFrame(f.payload, 0xA)); continue; }
      if (f.op === 0xA) continue;
      if (f.op === 0x1 || f.op === 0x0) {
        if (f.op === 0x1) frag = [];
        if (!frag) continue;
        frag.push(f.payload);
        if (frag.reduce((n, p) => n + p.length, 0) > MAX_FRAME) { end(1009); return; }
        if (f.fin) {
          const text = Buffer.concat(frag).toString('utf8');
          frag = null;
          hub.message(conn, text);
        }
      }
    }
  });
  socket.on('close', () => end(1001));
  socket.on('error', () => end(1011));
});

/* ----------------------------------------------------------------- game loop */
let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  hub.tick(dt);
}, TICK_MS);

(async () => {   // บัญชีทดสอบ phutest (เป็น GM) — ปิดได้ด้วย GM_OFF=1
  if (process.env.GM_OFF || db.users[TEST_ID]) return;
  const salt = crypto.randomBytes(16).toString('hex'), rsalt = crypto.randomBytes(16).toString('hex');
  db.users[TEST_ID] = { salt, hash: await scrypt(TEST_PW, salt), rsalt, rhash: await scrypt(newRecovery(), rsalt), chars: [], made: Date.now(), gm: true };
  dirty = true;
})();
server.listen(PORT, () => {
  console.log('Chathai Online พร้อมแล้ว  →  http://localhost:' + PORT);
});

function bye() {
  for (const c of Array.from(hub.conns)) hub.drop(c);   // บันทึกตัวละครทุกคนก่อนปิด
  flush(); process.exit(0);
}
process.on('SIGINT', bye);
process.on('SIGTERM', bye);
