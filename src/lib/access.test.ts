import { describe, expect, it } from "vitest";

import {
  FREE_CLIENT_LIMIT,
  canAddClient,
  clientLimit,
  isPro,
  planState,
} from "@/lib/access";

const NOW = new Date("2026-09-06T12:00:00Z");
const FUTURE = "2026-10-06T12:00:00Z";
const PAST = "2026-08-06T12:00:00Z";

describe("isPro", () => {
  it("is true for a live subscription", () => {
    expect(isPro({ subscription_status: "active", pro_until: null }, NOW)).toBe(true);
  });

  it("stays true during dunning — Stripe is still retrying", () => {
    expect(isPro({ subscription_status: "past_due", pro_until: null }, NOW)).toBe(true);
  });

  it("is true while comped Pro time is running, even without a subscription", () => {
    expect(isPro({ subscription_status: "none", pro_until: FUTURE }, NOW)).toBe(true);
    expect(isPro({ subscription_status: "canceled", pro_until: FUTURE }, NOW)).toBe(true);
  });

  it("is false once the comped time has run out", () => {
    expect(isPro({ subscription_status: "none", pro_until: PAST }, NOW)).toBe(false);
  });

  it("is false on Free, after cancelling, and with no profile at all", () => {
    expect(isPro({ subscription_status: "none", pro_until: null }, NOW)).toBe(false);
    expect(isPro({ subscription_status: "canceled", pro_until: null }, NOW)).toBe(false);
    expect(isPro(null, NOW)).toBe(false);
  });

  it("flips exactly at the pro_until boundary", () => {
    const until = "2026-09-06T12:00:00Z";
    const p = { subscription_status: "none" as const, pro_until: until };
    expect(isPro(p, new Date("2026-09-06T11:59:59Z"))).toBe(true);
    expect(isPro(p, new Date("2026-09-06T12:00:00Z"))).toBe(false);
  });
});

describe("client cap", () => {
  const free = { subscription_status: "none" as const, pro_until: null };
  const pro = { subscription_status: "active" as const, pro_until: null };

  it("caps Free at the limit and never caps Pro", () => {
    expect(clientLimit(free, NOW)).toBe(FREE_CLIENT_LIMIT);
    expect(clientLimit(pro, NOW)).toBeNull();
  });

  it("lets Free add a client until the cap, then blocks", () => {
    expect(canAddClient(free, 0, NOW)).toBe(true);
    expect(canAddClient(free, FREE_CLIENT_LIMIT - 1, NOW)).toBe(true);
    expect(canAddClient(free, FREE_CLIENT_LIMIT, NOW)).toBe(false);
    expect(canAddClient(free, FREE_CLIENT_LIMIT + 5, NOW)).toBe(false);
  });

  it("lets Pro add clients regardless of count", () => {
    expect(canAddClient(pro, 500, NOW)).toBe(true);
  });

  it("treats a missing profile as Free", () => {
    expect(canAddClient(null, FREE_CLIENT_LIMIT, NOW)).toBe(false);
  });
});

describe("planState", () => {
  it("explains why an agent is Pro", () => {
    expect(planState({ subscription_status: "active", pro_until: null }, NOW)).toEqual({
      tier: "pro",
      source: "subscription",
      proUntil: null,
      limit: null,
    });
    expect(planState({ subscription_status: "none", pro_until: FUTURE }, NOW)).toEqual({
      tier: "pro",
      source: "comp",
      proUntil: FUTURE,
      limit: null,
    });
  });

  it("prefers the subscription over comped time", () => {
    expect(
      planState({ subscription_status: "active", pro_until: FUTURE }, NOW).source,
    ).toBe("subscription");
  });

  it("is Free otherwise", () => {
    expect(planState({ subscription_status: "canceled", pro_until: PAST }, NOW)).toEqual({
      tier: "free",
      source: null,
      proUntil: null,
      limit: FREE_CLIENT_LIMIT,
    });
  });
});
