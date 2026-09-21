import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CONSENT_CHANGE_EVENT,
  CONSENT_MAX_AGE_MS,
  CONSENT_OPEN_EVENT,
  CONSENT_STORAGE_KEY,
  openConsentNotice,
  parseConsent,
  readConsent,
  serializeConsent,
  subscribeConsent,
  writeConsent,
} from "./consent";

const NOW = Date.UTC(2026, 8, 21, 12, 0, 0);

describe("parseConsent", () => {
  it("returns null for nothing, garbage and unknown choices", () => {
    expect(parseConsent(null, NOW)).toBeNull();
    expect(parseConsent("", NOW)).toBeNull();
    expect(parseConsent("not json", NOW)).toBeNull();
    expect(parseConsent("42", NOW)).toBeNull();
    expect(parseConsent(JSON.stringify({ choice: "maybe", at: NOW }), NOW)).toBeNull();
    expect(parseConsent(JSON.stringify({ choice: "granted" }), NOW)).toBeNull();
  });

  it("round-trips both answers", () => {
    expect(parseConsent(serializeConsent("granted", NOW), NOW)).toBe("granted");
    expect(parseConsent(serializeConsent("denied", NOW), NOW)).toBe("denied");
  });

  it("expires after a year so the notice asks again", () => {
    const stored = serializeConsent("granted", NOW);
    expect(parseConsent(stored, NOW + CONSENT_MAX_AGE_MS)).toBe("granted");
    expect(parseConsent(stored, NOW + CONSENT_MAX_AGE_MS + 1)).toBeNull();
  });
});

describe("readConsent / writeConsent", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("stores the answer under the documented key and announces it", () => {
    const heard = vi.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, heard);
    writeConsent("denied");
    window.removeEventListener(CONSENT_CHANGE_EVENT, heard);

    expect(readConsent()).toBe("denied");
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain('"denied"');
    expect(heard).toHaveBeenCalledOnce();
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toBe("denied");
  });

  it("reads nothing when the stored value is unusable", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "{oops");
    expect(readConsent()).toBeNull();
  });

  it("notifies subscribers of a new answer until they unsubscribe", () => {
    const heard = vi.fn();
    const unsubscribe = subscribeConsent(heard);
    writeConsent("granted");
    expect(heard).toHaveBeenCalledOnce();
    unsubscribe();
    writeConsent("denied");
    expect(heard).toHaveBeenCalledOnce();
  });

  it("can ask the page to show the notice again", () => {
    const heard = vi.fn();
    window.addEventListener(CONSENT_OPEN_EVENT, heard);
    openConsentNotice();
    window.removeEventListener(CONSENT_OPEN_EVENT, heard);
    expect(heard).toHaveBeenCalledOnce();
  });
});
