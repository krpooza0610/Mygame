#!/usr/bin/env node
/* server.js — เซิร์ฟเวอร์ออนไลน์ของ Bamboo Creek
 * ไม่ต้องติดตั้งแพ็กเกจเพิ่ม (ใช้แค่ Node 18+) : node server.js
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

/* ------------------------------------------------------------- static files */
const FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/game.js': ['game.js', 'text/javascript; charset=utf-8']
};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, players: hub.world.players.size }));
    return;
  }
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

server.listen(PORT, () => {
  console.log('Bamboo Creek พร้อมแล้ว  →  http://localhost:' + PORT);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
