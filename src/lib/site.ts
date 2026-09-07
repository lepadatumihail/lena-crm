/**
 * Single source of truth for the brand and public site metadata.
 * Everything that names the product (SEO tags, OG image, manifest, JSON-LD)
 * reads from here so a rename is a one-file change.
 */

import site from "../../messages/en/site.json";

export const SITE_NAME = "LeadWing";

/** English copy, shared with the `site` message namespace (OG image, JSON-LD). */
export const SITE_TAGLINE: string = site.tagline;

export const SITE_DESCRIPTION: string = site.description;

/**
 * Public origin, no trailing slash. Falls back to the production domain, which
 * is the www host: the apex 308s to it, so canonicals, sitemap URLs and JSON-LD
 * @ids must name www or every one of them points at a redirect.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.leadwing.app"
).replace(/\/+$/, "");

export const SITE_LOCALE = "en_GB";

/**
 * Public profiles owned by the brand, for the Organization's `sameAs`. This is
 * what ties the domain to the listings carrying the same name, so it only
 * belongs here once a profile really exists and says the same name and URL.
 * Nothing is emitted while the list is empty.
 */
export const SITE_PROFILES: readonly string[] = [];

/** Brand palette, mirrored from globals.css (oklch → hex) for image rendering. */
export const BRAND = {
  primary: "#c0603f",
  primarySoft: "#f3d9cf",
  background: "#faf8f3",
  card: "#fffdf9",
  foreground: "#2b2926",
  muted: "#7b7469",
  border: "#e7e2d9",
} as const;

/** Absolute URL for a site path; the home page is the bare origin, no trailing slash. */
export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
