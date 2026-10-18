import type { Json } from "@/lib/supabase/types";

/**
 * Where a sign-up came from: the utm_* tags on the page the visitor signed up
 * on, that page's path, and the other site that linked to it. It is saved
 * once, on the new profile (profiles.signup_source), so a sign-up can be
 * traced back to the ad and the hook that brought it, or to the search engine
 * or AI assistant when the link carried no tags. An email-code sign-up
 * carries it in the user metadata the database trigger copies; a Google one
 * through the auth callback's URL.
 */
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type UtmKey = (typeof UTM_KEYS)[number];
export type SignupSource = Partial<Record<UtmKey | "landing" | "referrer", string>>;

const MAX = 100;
const KEYS: readonly string[] = [...UTM_KEYS, "landing", "referrer"];

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, MAX);
  return v || null;
}

/**
 * A hostname as it is stored: lower case, without "www.", and only letters,
 * digits, dots and hyphens, so a full address (whose path or query might
 * carry a search or an email address) can never pass for one.
 */
export function cleanHost(value: unknown): string | null {
  const v = clean(value)?.toLowerCase().replace(/^www\./, "");
  return v && /^[a-z0-9.-]+$/.test(v) ? v : null;
}

/**
 * The other site that linked to this page (document.referrer) as a bare
 * hostname: "https://www.google.com/search?q=…" → "google.com". Null with no
 * referrer, an unreadable one, or one from this site (`ownHost`, the page's
 * location.hostname), since a page load inside the site says nothing about
 * where the visitor came from. Search engines and most AI assistants add no
 * utm tags (ChatGPT does), so this is the only way they show up.
 */
export function readReferrer(referrer: string, ownHost: string): string | null {
  if (!referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return null;
  }
  const found = cleanHost(host);
  return found && found !== cleanHost(ownHost) ? found : null;
}

/** The utm tags on a query string, trimmed and capped; missing tags are left out. */
export function readUtm(search: string): Partial<Record<UtmKey, string>> {
  const params = new URLSearchParams(search);
  const utm: Partial<Record<UtmKey, string>> = {};
  for (const key of UTM_KEYS) {
    const value = clean(params.get(key));
    if (value) utm[key] = value;
  }
  return utm;
}

/**
 * Tags, landing page and referring site (see readReferrer) for the page being
 * signed up from, or null when there is nothing to record.
 */
export function readSignupSource(
  search: string,
  pathname: string,
  referrer: string | null = null
): SignupSource | null {
  const source: SignupSource = readUtm(search);
  // The sign-in page itself says nothing about where someone came from.
  const landing = clean(pathname);
  if (landing && landing !== "/login") source.landing = landing;
  const host = cleanHost(referrer);
  if (host) source.referrer = host;
  return Object.keys(source).length ? source : null;
}

/**
 * Re-validates a source that travelled through a URL: known keys, strings,
 * capped, and the referrer only as a hostname.
 */
export function parseSignupSource(raw: string | null): SignupSource | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source: SignupSource = {};
  for (const [key, v] of Object.entries(value)) {
    if (!KEYS.includes(key)) continue;
    const s = key === "referrer" ? cleanHost(v) : clean(v);
    if (s) source[key as keyof SignupSource] = s;
  }
  return Object.keys(source).length ? source : null;
}

export const asJson = (source: SignupSource): Json => source as Json;
