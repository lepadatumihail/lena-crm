import { describe, expect, it } from "vitest";

import {
  claimMessage,
  formatReferralCode,
  isValidReferralCode,
  joinPath,
  normalizeReferralCode,
  referralState,
} from "./links";

describe("referral codes", () => {
  it("normalizes what people actually type", () => {
    expect(normalizeReferralCode(" mar7-k2qo ")).toBe("MAR7K2Q0");
    expect(normalizeReferralCode("abcd efgh")).toBe("ABCDEFGH");
    expect(normalizeReferralCode("ilio1234")).toBe("11101234");
  });

  it("validates only full codes from the alphabet", () => {
    expect(isValidReferralCode("MAR7K2Q0")).toBe(true);
    expect(isValidReferralCode("MAR7K2Q")).toBe(false);
    expect(isValidReferralCode("MAR7K2QU")).toBe(false);
    expect(isValidReferralCode("mar7k2q0")).toBe(false);
  });

  it("formats for display and builds the join path", () => {
    expect(formatReferralCode("MAR7K2Q0")).toBe("MAR7-K2Q0");
    expect(joinPath("MAR7K2Q0")).toBe("/join/MAR7K2Q0");
  });
});

describe("referralState", () => {
  it("follows the referred agent's progress", () => {
    expect(referralState({ status: "pending", paid_invoice_count: 0 })).toBe("signed_up");
    expect(referralState({ status: "pending", paid_invoice_count: 1 })).toBe("subscribed");
    expect(referralState({ status: "qualified", paid_invoice_count: 2 })).toBe("subscribed");
    expect(referralState({ status: "rewarded", paid_invoice_count: 2 })).toBe("rewarded");
    expect(referralState({ status: "void", paid_invoice_count: 1 })).toBe("left");
  });
});

describe("claimMessage", () => {
  it("maps the RPC result to a tone", () => {
    expect(claimMessage("claimed")?.tone).toBe("success");
    expect(claimMessage("not_eligible")?.tone).toBe("info");
    expect(claimMessage("self_referral")?.tone).toBe("error");
    expect(claimMessage(undefined)).toBeNull();
  });
});
