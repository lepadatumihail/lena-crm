"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Meta's browser pixel, installed the way Meta's own snippet does it but only
 * after the visitor has accepted the cookie notice (see marketing-tracking).
 * It reports a PageView on load and on every client-side navigation, which
 * is what lets the ad account optimise for landing-page views. Automatic
 * event collection (button clicks, page microdata) is switched off: the
 * privacy policy promises page views, nothing more. `fbq` starts as Meta's
 * queueing stub, so calls made before fbevents.js arrives are replayed by it.
 */
type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

function fbq(...args: unknown[]): void {
  window.fbq?.(...args);
}

/** Installs the stub, fetches fbevents.js and initialises the pixel, once per page load. */
function loadPixel(pixelId: string): void {
  if (window.fbq) return;
  const stub = function (...args: unknown[]) {
    if (stub.callMethod) stub.callMethod(...args);
    else stub.queue.push(args);
  } as Fbq;
  stub.queue = [];
  stub.push = stub;
  stub.loaded = true;
  stub.version = "2.0";
  window.fbq = stub;
  if (!window._fbq) window._fbq = stub;

  const script = document.createElement("script");
  script.async = true;
  script.src = SCRIPT_SRC;
  document.head.appendChild(script);

  stub("set", "autoConfig", false, pixelId);
  stub("init", pixelId);
}

export function MetaPixel({ pixelId, enabled }: { pixelId: string; enabled: boolean }) {
  const pathname = usePathname();
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (enabled) {
      if (window.fbq) fbq("consent", "grant");
      else loadPixel(pixelId);
    } else if (window.fbq) {
      // Consent withdrawn after the pixel loaded: it stays silent from here on.
      fbq("consent", "revoke");
    }
  }, [enabled, pixelId]);

  useEffect(() => {
    if (!enabled) {
      tracked.current = null;
      return;
    }
    if (tracked.current === pathname) return;
    tracked.current = pathname;
    fbq("track", "PageView");
  }, [enabled, pathname]);

  return null;
}
