/* sw.js — ทำให้ติดตั้งเป็นแอปได้ และเปิดซ้ำได้แม้เน็ตช้า
 * ใช้ "เน็ตก่อน แล้วค่อยใช้ของที่เก็บไว้" เพื่อไม่ให้ค้างเวอร์ชันเก่าเวลาอัปเดตเกม */
const CACHE = 'chathai-online-v22';
const SHELL = ['./', 'index.html', 'game.js', 'rpg.js', 'jobart.js', 'swordman.png', 'archer.png', 'world.js', 'themeart.js', 'i18n.js', 'firebase-config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin || req.url.indexOf('/api/') >= 0) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
