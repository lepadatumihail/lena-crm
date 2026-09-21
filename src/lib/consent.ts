/**
 * The visitor's answer to the cookie notice on the public website. Only the
 * Meta Pixel (src/components/marketing/meta-pixel.tsx) waits for it: the
 * cookies the site needs to work never ask. The answer lives in localStorage,
 * so it stays on the visitor's device and is never sent to the server, and it
 * expires after a year, when the notice asks again.
 */
export const CONSENT_STORAGE_KEY = "lw_consent";
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
/** Fired on `window` when the answer changes; `detail` is the new choice. */
export const CONSENT_CHANGE_EVENT = "lw:consent-change";
/** Fired on `window` to show the notice again (the Cookies link in the footer). */
export const CONSENT_OPEN_EVENT = "lw:consent-open";

export type ConsentChoice = "granted" | "denied";

type StoredConsent = { choice: ConsentChoice; at: number };

function isChoice(value: unknown): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

/** The answer a stored value holds, or null when there is none, it is malformed or it has expired. */
export function parseConsent(raw: string | null, now = Date.now()): ConsentChoice | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { choice, at } = parsed as Partial<StoredConsent>;
    if (!isChoice(choice) || typeof at !== "number" || !Number.isFinite(at)) return null;
    if (now - at > CONSENT_MAX_AGE_MS) return null;
    return choice;
  } catch {
    return null;
  }
}

export function serializeConsent(choice: ConsentChoice, now = Date.now()): string {
  return JSON.stringify({ choice, at: now } satisfies StoredConsent);
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Blocked site data or a private window: the notice asks on every visit.
    return null;
  }
}

export function readConsent(): ConsentChoice | null {
  try {
    return parseConsent(storage()?.getItem(CONSENT_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

/** Stores the answer and tells the page, so the pixel and the notice react at once. */
export function writeConsent(choice: ConsentChoice): void {
  try {
    storage()?.setItem(CONSENT_STORAGE_KEY, serializeConsent(choice));
  } catch {
    // Storage full or blocked: the answer still holds for this page view.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_CHANGE_EVENT, { detail: choice }));
  }
}

/**
 * Subscribes to answer changes from this tab (writeConsent) and from other
 * tabs (the storage event), for useSyncExternalStore.
 */
export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function openConsentNotice(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
