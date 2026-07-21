const CACHE = "penaflex-v2"; // version update kar di
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./screenshot1.png", // 1. Screenshots bhi cache
  "./screenshot2.png",
  "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.0/dist/browser.js"
];

// 1. INSTALL - Sab files cache karo
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log("PenaFlex Files Cached");
      return cache.addAll(FILES);
    }).catch(err => {
      console.log("Cache failed: ", err);
    })
  );
  self.skipWaiting(); // Naya SW foran active
});

// 2. ACTIVATE - Purana cache delete
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => {
          if(key !== CACHE){
            console.log("Old cache deleted:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 3. FETCH - Smart Caching Strategy
self.addEventListener("fetch", e => {
  // Sirf GET requests ko cache karo
  if(e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // Agar cache mein hai to wahi do
      if(cachedResponse){
        return cachedResponse;
      }

      // Nahi hai to network se lao
      return fetch(e.request).then(networkResponse => {
        // Agar CDN hai to usko cache mat karo, warna error aayega
        if(!e.request.url.startsWith('http://localhost') && !e.request.url.startsWith('https://chughatta870-boop.github.io')){
          return networkResponse;
        }

        // Apni files ko cache mein save karo
        return caches.open(CACHE).then(cache => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // 2. OFFLINE FALLBACK - Agar net nahi aur cache mein bhi nahi
        if(e.request.destination === 'document'){
          return caches.match('./index.html');
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});
