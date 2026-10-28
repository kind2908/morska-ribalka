// Service worker: приложение открывается без интернета (данные погоды всё равно нужны онлайн).
// При выходе новой версии меняйте номер VERSION: пользователи увидят кнопку «Обновить».
const VERSION = '1.1.0';
const CACHE = 'fishing-web-' + VERSION;
const RUNTIME = 'fishing-runtime';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/data.js', 'js/i18n.js', 'js/model.js', 'js/api.js', 'js/dom.js', 'js/diary.js',
  'js/library.js', 'js/map.js', 'js/screens.js', 'js/app.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('fishing-web-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // APK и version.json не кэшируем
    if (url.pathname.includes('/downloads/') || url.pathname.endsWith('version.json')) return;
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // Leaflet (cdnjs) и фото рыб (Wikimedia): из кэша, если есть, и обновляем в фоне
  if (url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'upload.wikimedia.org') {
    e.respondWith(
      caches.open(RUNTIME).then(cache => cache.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }))
    );
  }
  // всё остальное (погода, карта, глубины) идёт напрямую в сеть
});
