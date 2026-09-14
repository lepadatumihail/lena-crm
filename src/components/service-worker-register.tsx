"use client";

import { useEffect } from "react";

/**
 * Retires the service worker. The site used one for a network-first cache;
 * on iOS Safari it made every load after a deploy slow and, on a poor
 * connection, could leave the page unable to hear its own scroll events.
 * Installability comes from the manifest alone, so nothing is registered
 * any more; existing registrations are removed and their caches cleared.
 * public/sw.js is a self-unregistering kill switch for the same reason.
 * Both can go once no active installs remain.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((r) => r.unregister()))
      )
      .catch(() => {});
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }
  }, []);

  return null;
}
