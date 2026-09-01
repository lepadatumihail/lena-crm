/**
 * Single source of truth for the brand and public site metadata.
 * Everything that names the product (SEO tags, OG image, manifest, JSON-LD)
 * reads from here so a rename is a one-file change.
 */

export const SITE_NAME = "LeadWing";

export const SITE_TAGLINE = "The CRM for independent real-estate agents";

export const SITE_DESCRIPTION =
  "LeadWing is the CRM for independent real-estate agents. Track every buyer and seller from first hello to keys in hand, across all the agencies you work with, in one place.";

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
