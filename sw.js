// El nombre del caché es fijo: no hay que subir ninguna versión a mano.
//  - HTML, JS, CSS y manifest: siempre se piden a la red revalidando con el servidor (cache:'no-cache');
//    si no hay conexión se usa la última copia guardada. Así una actualización se ve apenas hay internet
//    y nunca queda un index.html nuevo funcionando con un app.js viejo.
//  - Imágenes y fuentes: se sirven del caché al instante y se actualizan por detrás (stale-while-revalidate),
//    así un ícono o una figura que cambie con el mismo nombre no queda desactualizado para siempre.
const CACHE_NAME = 'washed';
const CODE_FILES = ['./index.html', './styles.css', './catalog.js', './features.js', './exercises.js', './routines.js', './stats.js', './app.js', './manifest.json'];
const IMAGE_FILES = ['./icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const MUSCLE_FILES = [
  'muscle-front', 'muscle-back',
  'muscle-front-abs', 'muscle-front-arms', 'muscle-front-chest', 'muscle-front-forearms', 'muscle-front-obliques', 'muscle-front-quads', 'muscle-front-shoulders',
  'muscle-back-arms', 'muscle-back-calves', 'muscle-back-espaldabaja', 'muscle-back-glutes', 'muscle-back-hamstrings', 'muscle-back-lats', 'muscle-back-shoulders', 'muscle-back-traps', 'muscle-back-upperback'
].map(n => `./musculos/${n}.png`);
const ASSETS = [...CODE_FILES, ...IMAGE_FILES, ...MUSCLE_FILES];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS.map(url => fetch(url, { cache: 'reload' }).then(res => { if(res.ok) return cache.put(url, res); }).catch(() => {})))
    )
  );
});

// Borra los cachés de versiones anteriores (washed-v4, barra-v3, etc.) que ya no se usan.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

function networkFirst(request){
  const fresh = fetch(request.mode === 'navigate' ? request.url : request, { cache: 'no-cache' });
  return fresh.then(res => {
    if(res && res.ok){
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
    }
    return res;
  }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')));
}

function staleWhileRevalidate(request){
  return caches.match(request).then(cached => {
    const update = fetch(request).then(res => {
      if(res && (res.ok || res.type === 'opaque')){
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      }
      return res;
    }).catch(() => cached);
    return cached || update;
  });
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if(list.length) return list[0].focus();
      return self.clients.openWindow('./');
    })
  );
});

self.addEventListener('fetch', (e) => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if(FONT_HOSTS.includes(url.hostname)){
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  if(url.origin !== self.location.origin) return;

  if(e.request.mode === 'navigate' || /\.(html|js|css|json)$/.test(url.pathname) || url.pathname.endsWith('/')){
    e.respondWith(networkFirst(e.request));
    return;
  }

  e.respondWith(staleWhileRevalidate(e.request));
});
