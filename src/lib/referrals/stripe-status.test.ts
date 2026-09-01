import { describe, expect, it } from "vitest";

import { mapStripeSubscriptionStatus } from "./stripe-status";

describe("mapStripeSubscriptionStatus", () => {
  it("collapses Stripe's states onto ours", () => {
    expect(mapStripeSubscriptionStatus("active")).toBe("active");
    expect(mapStripeSubscriptionStatus("trialing")).toBe("active");
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("unpaid")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("canceled")).toBe("canceled");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("canceled");
  });
  it("ignores transitional states", () => {
    expect(mapStripeSubscriptionStatus("incomplete")).toBeNull();
    expect(mapStripeSubscriptionStatus("paused")).toBeNull();
  });
});
