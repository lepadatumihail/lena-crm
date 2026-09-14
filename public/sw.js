// Kill switch. An earlier worker cached every same-origin request network-first,
// which made each load after a deploy slow on iOS Safari and, on a bad
// connection, could leave the page unable to hear its own scroll events.
// Installability comes from the manifest alone, so the worker is retired:
// this version removes the caches and unregisters itself. Pages it still
// controls keep working and drop it on their next navigation.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
    })()
  );
});
