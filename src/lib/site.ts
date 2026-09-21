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
 * One sentence that tells this LeadWing apart from everything else sharing the
 * word (a fishing fly, unrelated companies elsewhere). Emitted as
 * `disambiguatingDescription` and in llms.txt, because answer engines
 * otherwise blend every Leadwing they find into one entity.
 */
export const SITE_DISAMBIGUATION: string = site.disambiguation;

/** Other names the brand goes by, for `alternateName` in the structured data. */
export const SITE_ALTERNATE_NAMES: readonly string[] = ["LeadWing CRM"];

/** The year LeadWing launched, for the Organization's `foundingDate` and the About page. */
export const SITE_FOUNDED = "2026";

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
 * The one address behind support, contact and the legal pages. It is both the
 * mailbox the in-app help dialog delivers to and the address the legal
 * documents publish, so there is never a second inbox to keep an eye on.
 */
export const SUPPORT_EMAIL = "info@leadwing.app";

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

/**
 * Meta (Facebook) Pixel for the public website. The production site uses the
 * "LEADWING" dataset on the founder's ad account; a pixel id is public (it
 * sits in the page source of every site that has one), so like SITE_URL it
 * lives here rather than in a dashboard setting. NEXT_PUBLIC_META_PIXEL_ID
 * overrides it for any deployment, for instance to test on a preview;
 * otherwise only pages served from PRODUCTION_HOSTS load a pixel, so previews
 * and local runs never send Meta a thing. The pixel itself waits for the
 * visitor's answer to the cookie notice (src/lib/consent.ts).
 */
export const PRODUCTION_META_PIXEL_ID = "1625109429125373";

export const PRODUCTION_HOSTS: readonly string[] = ["leadwing.app", "www.leadwing.app"];

export const META_PIXEL_ID: string | null =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
