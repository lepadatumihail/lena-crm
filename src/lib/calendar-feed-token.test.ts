import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { feedToken, verifyFeedToken } from "./calendar-feed-token";

beforeEach(() => {
  // Never use a real key — the signing secret only needs to be stable.
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-signing-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("feedToken / verifyFeedToken", () => {
  it("round-trips an agent id", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    expect(verifyFeedToken(feedToken(id))).toBe(id);
  });

  it("returns null for a tampered signature", () => {
    const token = feedToken("some-uuid");
    const last = token.slice(-1);
    const flipped = last === "A" ? "B" : "A";
    const tampered = token.slice(0, -1) + flipped;
    expect(verifyFeedToken(tampered)).toBeNull();
  });

  it("returns null when the id part is swapped but the old signature is kept", () => {
    const token = feedToken("agent-one");
    const sig = token.slice(token.indexOf(".") + 1);
    const otherId = Buffer.from("agent-two").toString("base64url");
    const forged = `${otherId}.${sig}`;
    expect(verifyFeedToken(forged)).toBeNull();
  });

  it("returns null when there is no dot separator", () => {
    expect(verifyFeedToken("nodothere")).toBeNull();
  });

  it("returns null for an empty id part", () => {
    const token = feedToken("x");
    const sig = token.slice(token.indexOf(".") + 1);
    expect(verifyFeedToken(`.${sig}`)).toBeNull();
  });
});
