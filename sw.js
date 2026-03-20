const CACHE_NAME = 'dasa-app-cache-v5'; // Bumped to v5 for Vercel!

// Vercel prefers absolute paths (starting with / instead of ./)
const urlsToCache = [
  '/',
  '/index.html',
  '/songs.js',
  '/icon.png',
  '/manifest.json'
];

// 1. Install and force the new engine to take over instantly
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. Wipe out old memory files immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); 
});

// 3. Vercel-Optimized Fetching
self.addEventListener('fetch', event => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      // If internet works, save a fresh copy
      let responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
      return response;
    }).catch(() => {
      // If offline, check the cache. 
      return caches.match(event.request, { ignoreSearch: true }).then(response => {
        // Vercel Fallback: If it gets confused by a Clean URL, force it to serve the main app!
        return response || caches.match('/index.html', { ignoreSearch: true }) || caches.match('/', { ignoreSearch: true });
      });
    })
  );
});