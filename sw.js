// MOM Trader — Service Worker v1.0
var CACHE_NAME = 'mom-trader-v1';
var STATIC_ASSETS = [
  './',
  './index.html',
  'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js'
];

// Install — cache static assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function() {
        // Some assets may fail (CDN) — continue anyway
        return cache.add('./index.html');
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Always network for API calls (proxy)
  if(url.indexOf('onrender.com') > -1 ||
     url.indexOf('alpaca') > -1 ||
     url.indexOf('yahoo') > -1 ||
     url.indexOf('anthropic') > -1) {
    return; // browser handles normally
  }

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful GET responses for static assets
      if(e.request.method === 'GET' && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Network failed — try cache
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
