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

/** Public origin, no trailing slash. Falls back to the production domain. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://leadwing.app"
).replace(/\/+$/, "");

export const SITE_LOCALE = "en_GB";

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
