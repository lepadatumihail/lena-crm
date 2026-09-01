import { describe, expect, it } from "vitest";

import {
  INVITE_CODE_ALPHABET,
  claimMessage,
  formatInviteCode,
  freeMonthsFromCredit,
  generateInviteCode,
  inviteState,
  isValidInviteCode,
  normalizeInviteCode,
} from "./invites";

describe("invite codes", () => {
  it("generates 8-character Crockford codes", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(8);
      for (const ch of code) expect(INVITE_CODE_ALPHABET).toContain(ch);
      seen.add(code);
    }
    expect(seen.size).toBeGreaterThan(190);
  });

  it("normalizes what people actually type", () => {
    expect(normalizeInviteCode(" mar7-k2qo ")).toBe("MAR7K2Q0");
    expect(normalizeInviteCode("abcd efgh")).toBe("ABCDEFGH");
    expect(normalizeInviteCode("ilio1234")).toBe("11101234");
  });

  it("validates only full codes from the alphabet", () => {
    expect(isValidInviteCode("MAR7K2Q0")).toBe(true);
    expect(isValidInviteCode("MAR7K2Q")).toBe(false);
    expect(isValidInviteCode("MAR7K2QU")).toBe(false);
    expect(isValidInviteCode("mar7k2q0")).toBe(false);
  });

  it("formats for display and converts credit to months", () => {
    expect(formatInviteCode("MAR7K2Q0")).toBe("MAR7-K2Q0");
    expect(freeMonthsFromCredit(38)).toBe(2);
    expect(freeMonthsFromCredit(19)).toBe(1);
    expect(freeMonthsFromCredit(0)).toBe(0);
  });
});

describe("inviteState", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  const future = "2026-10-01T00:00:00Z";
  const past = "2026-08-01T00:00:00Z";

  it("reads the invite first, then the referral", () => {
    expect(inviteState({ status: "active", expires_at: future }, null, now)).toBe("available");
    expect(inviteState({ status: "active", expires_at: past }, null, now)).toBe("expired");
    expect(inviteState({ status: "revoked", expires_at: future }, null, now)).toBe("revoked");
    expect(inviteState({ status: "redeemed", expires_at: past }, "pending", now)).toBe("joined");
    expect(inviteState({ status: "redeemed", expires_at: past }, "qualified", now)).toBe("qualified");
    expect(inviteState({ status: "redeemed", expires_at: past }, "rewarded", now)).toBe("rewarded");
    expect(inviteState({ status: "redeemed", expires_at: past }, "void", now)).toBe("left");
  });
});

describe("claimMessage", () => {
  it("maps the RPC result to a tone", () => {
    expect(claimMessage("claimed")?.tone).toBe("success");
    expect(claimMessage("self_referral")?.tone).toBe("error");
    expect(claimMessage(undefined)).toBeNull();
  });
});
