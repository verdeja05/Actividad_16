// Service Worker de Inventario PWA
// Cambiar VERSION en cada liberación para que el navegador detecte la actualización
const VERSION = '1.1.0';
const CACHE = `inventario-v${VERSION}`;

const ARCHIVOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/db.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalación: guarda en caché los archivos de esta versión
self.addEventListener('install', (event) => {
  console.log(`[SW ${VERSION}] Instalando`);
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
});

// Activación: borra las cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSION}] Activado`);
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves
          .filter((clave) => clave.startsWith('inventario-') && clave !== CACHE)
          .map((clave) => {
            console.log(`[SW ${VERSION}] Eliminando caché anterior: ${clave}`);
            return caches.delete(clave);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// Mensaje desde la app para activar la nueva versión
self.addEventListener('message', (event) => {
  if (event.data && event.data.tipo === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Peticiones: primero caché, si no existe se busca en la red
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((respuesta) => {
      if (respuesta) return respuesta;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});