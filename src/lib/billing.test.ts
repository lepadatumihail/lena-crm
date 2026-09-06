import { describe, expect, it } from "vitest";

import {
  FOUNDING_CAP,
  checkoutUrl,
  currentTier,
  foundingSpotsLeft,
  isFoundingPlan,
  planFromLookupKey,
  planId,
  planLabel,
  planMonthlyEur,
  yearlySavingPct,
} from "@/lib/billing";

describe("plans", () => {
  it("builds and reads plan ids", () => {
    expect(planId("founding", "yearly")).toBe("founding_yearly");
    expect(isFoundingPlan("founding_monthly")).toBe(true);
    expect(isFoundingPlan("standard_yearly")).toBe(false);
    expect(isFoundingPlan(null)).toBe(false);
  });

  it("only accepts our own lookup keys", () => {
    expect(planFromLookupKey("standard_monthly")).toBe("standard_monthly");
    expect(planFromLookupKey("price_1abc")).toBeNull();
    expect(planFromLookupKey(null)).toBeNull();
  });

  it("values a free month at the plan's monthly equivalent", () => {
    expect(planMonthlyEur("founding_monthly")).toBe(19);
    expect(planMonthlyEur("founding_yearly")).toBe(15);
    expect(planMonthlyEur("standard_monthly")).toBe(29);
    expect(planMonthlyEur("standard_yearly")).toBe(23);
  });

  it("labels plans for humans", () => {
    expect(planLabel("founding_monthly")).toBe("Founding · €19/mo");
    expect(planLabel("standard_yearly")).toBe("Pro · €276/yr");
  });

  it("yearly saves about a fifth", () => {
    expect(yearlySavingPct("founding")).toBe(21);
    expect(yearlySavingPct("standard")).toBe(21);
  });
});

describe("founding cohort", () => {
  it("counts spots down to zero and then closes", () => {
    expect(foundingSpotsLeft(0)).toBe(FOUNDING_CAP);
    expect(foundingSpotsLeft(FOUNDING_CAP - 1)).toBe(1);
    expect(foundingSpotsLeft(FOUNDING_CAP)).toBe(0);
    expect(foundingSpotsLeft(FOUNDING_CAP + 3)).toBe(0);
    expect(currentTier(FOUNDING_CAP - 1)).toBe("founding");
    expect(currentTier(FOUNDING_CAP)).toBe("standard");
  });
});

describe("checkoutUrl", () => {
  it("tags the Payment Link with the agent's identity", () => {
    const url = checkoutUrl("https://buy.stripe.com/test_abc", "user-1", "a@b.c");
    expect(url).toBe(
      "https://buy.stripe.com/test_abc?client_reference_id=user-1&prefilled_email=a%40b.c",
    );
  });

  it("is undefined when the link is not configured", () => {
    expect(checkoutUrl(undefined, "user-1")).toBeUndefined();
  });
});
