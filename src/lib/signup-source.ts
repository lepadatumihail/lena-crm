import type { Json } from "@/lib/supabase/types";

/**
 * Where a sign-up came from: the utm_* tags on the page the visitor signed up
 * on, plus that page's path. It is saved once, on the new profile
 * (profiles.signup_source), so a sign-up can be traced back to the ad and the
 * hook that brought it. An email-code sign-up carries it in the user metadata
 * the database trigger copies; a Google one through the auth callback's URL.
 */
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type UtmKey = (typeof UTM_KEYS)[number];
export type SignupSource = Partial<Record<UtmKey | "landing", string>>;

const MAX = 100;
const KEYS: readonly string[] = [...UTM_KEYS, "landing"];

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, MAX);
  return v || null;
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

/** Tags plus landing page for the page being signed up from, or null when there is nothing to record. */
export function readSignupSource(search: string, pathname: string): SignupSource | null {
  const source: SignupSource = readUtm(search);
  // The sign-in page itself says nothing about where someone came from.
  const landing = clean(pathname);
  if (landing && landing !== "/login") source.landing = landing;
  return Object.keys(source).length ? source : null;
}

/** Re-validates a source that travelled through a URL: known keys, strings, capped. */
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
    const s = clean(v);
    if (KEYS.includes(key) && s) source[key as keyof SignupSource] = s;
  }
  return Object.keys(source).length ? source : null;
}

export const asJson = (source: SignupSource): Json => source as Json;
