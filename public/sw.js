/*
 * Offline shell for the trip planner.
 *
 * The point is the day of the trip: at the villa and on the road the signal
 * comes and goes, and the schedule, the drivers' numbers and the room list
 * have to open anyway. Firestore keeps the trip data itself; this keeps the
 * app that renders it.
 *
 * Strategy: serve the cached build immediately, fetch a fresh copy in the
 * background for next time. A trip planner that opens instantly with
 * five-minute-old data beats one that spins on a weak connection.
 */

const CACHE = 'khaoyai-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html'])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Anything live — Firestore, fonts being revalidated — goes to the network.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      // Navigations fall back to the cached shell so the app still opens.
      if (request.mode === 'navigate') {
        return network.catch(() => caches.match('./index.html'));
      }
      return cached || network;
    })
  );
});
