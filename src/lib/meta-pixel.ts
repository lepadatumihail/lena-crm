import { META_PIXEL_ID, PRODUCTION_HOSTS, PRODUCTION_META_PIXEL_ID } from "@/lib/site";

/**
 * The pixel a page served from `hostname` should load, or null for none: the
 * explicit NEXT_PUBLIC_META_PIXEL_ID wherever it is set, else the production
 * pixel on the production hosts only. Pure, so the rule is testable.
 */
export function metaPixelIdFor(hostname: string): string | null {
  if (META_PIXEL_ID) return META_PIXEL_ID;
  return PRODUCTION_HOSTS.includes(hostname.toLowerCase()) ? PRODUCTION_META_PIXEL_ID : null;
}

/** The pixel for the page in this browser; null during server rendering. */
export function metaPixelIdHere(): string | null {
  return typeof window === "undefined" ? null : metaPixelIdFor(window.location.hostname);
}

export const noPixelOnServer = (): string | null => null;

/** For useSyncExternalStore: the host never changes during a page's life. */
export function subscribeToNothing(): () => void {
  return () => {};
}
