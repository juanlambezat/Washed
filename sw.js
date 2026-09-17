const CACHE_NAME = 'barra-v3';
const ASSETS = ['./index.html', './styles.css', './app.js', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if(e.request.method !== 'GET') return;

  // La página principal (HTML): siempre intenta traer la versión más nueva de la red primero.
  // Si no hay conexión, usa la última copia guardada. Así las actualizaciones se ven apenas hay internet.
  if(e.request.mode === 'navigate' || e.request.url.endsWith('.html') || e.request.url.endsWith('/')){
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Íconos y manifest: cambian poco, se sirven de la caché primero para que cargue rápido.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
