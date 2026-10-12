/**
 * EduVerse — Service Worker (sw.js)
 * Provides offline caching for the EduVerse Smart Learning Ecosystem
 * and ZeroNet Scholar offline learning resources.
 */

const CACHE_NAME = 'eduverse-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './js/progress.js',
  './js/mindshift.js',
  './js/whatif-lab.js',
  './js/errordna.js',
  './js/boardbridge.js',
  './js/silentsignal.js',
  './js/zeronet-scholar.js',
  './js/escape2learn.js',
  './modules/mindshift.html',
  './modules/whatif-lab.html',
  './modules/errordna.html',
  './modules/boardbridge.html',
  './modules/silentsignal.html',
  './modules/zeronet-scholar.html',
  './modules/escape2learn.html'
];

// Install event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[EduVerse SW] Caching application shell assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[EduVerse SW] Pre-caching partial failure, proceeding:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[EduVerse SW] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for dynamic requests, falling back to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore cross-origin non-http(s) requests (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Fetch from network with cache update in background
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, if we have cached response return it
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML navigation failed and nothing cached, fallback to index
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
          return new Response('EduVerse offline asset unavailable.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });

      return cachedResponse || fetchPromise;
    })
  );
});
