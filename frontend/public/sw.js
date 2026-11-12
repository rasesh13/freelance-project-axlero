// Self-cleanup worker: replaces any stale localhost service worker from prior apps and unregisters itself immediately.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .catch(() => undefined)
      .then(() => self.registration.unregister())
      .catch(() => undefined)
  );
});

