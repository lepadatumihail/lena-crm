import { describe, expect, it } from "vitest";

import { accessState, hasAccess } from "@/lib/access";

const NOW = new Date("2026-06-25T12:00:00Z");
const FUTURE = "2026-06-30T12:00:00Z";
const PAST = "2026-06-20T12:00:00Z";

describe("accessState", () => {
  it("grants access to active subscriptions", () => {
    expect(accessState({ subscription_status: "active", trial_ends_at: null }, NOW)).toEqual({
      ok: true,
    });
  });

  it("grants access during dunning (past_due) — Stripe still retrying", () => {
    expect(
      accessState({ subscription_status: "past_due", trial_ends_at: null }, NOW),
    ).toEqual({ ok: true });
  });

  it("grants access while the trial is live", () => {
    expect(
      accessState({ subscription_status: "trialing", trial_ends_at: FUTURE }, NOW),
    ).toEqual({ ok: true });
  });

  it("blocks once the trial has expired", () => {
    expect(
      accessState({ subscription_status: "trialing", trial_ends_at: PAST }, NOW),
    ).toEqual({ ok: false, reason: "trial_expired" });
  });

  it("blocks a trialing profile with no end date", () => {
    expect(
      accessState({ subscription_status: "trialing", trial_ends_at: null }, NOW),
    ).toEqual({ ok: false, reason: "trial_expired" });
  });

  it("blocks canceled subscriptions", () => {
    expect(
      accessState({ subscription_status: "canceled", trial_ends_at: null }, NOW),
    ).toEqual({ ok: false, reason: "canceled" });
  });

  it("blocks when there is no subscription", () => {
    expect(
      accessState({ subscription_status: "none", trial_ends_at: null }, NOW),
    ).toEqual({ ok: false, reason: "no_subscription" });
  });
});

describe("hasAccess", () => {
  it("is true at the boundary just before expiry and false after", () => {
    const ends = "2026-06-25T12:00:00Z";
    expect(
      hasAccess(
        { subscription_status: "trialing", trial_ends_at: ends },
        new Date("2026-06-25T11:59:59Z"),
      ),
    ).toBe(true);
    expect(
      hasAccess(
        { subscription_status: "trialing", trial_ends_at: ends },
        new Date("2026-06-25T12:00:01Z"),
      ),
    ).toBe(false);
  });
});
