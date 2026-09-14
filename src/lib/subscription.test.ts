import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { messagesFor } from "@/i18n/messages";
import type { BillingT } from "@/lib/billing";
import {
  creditApplied,
  formatMoney,
  formatPeriod,
  invoiceStatusTag,
  paymentMethodLabel,
  subscriptionEndsOn,
  subscriptionPhase,
} from "@/lib/subscription";

// The label helpers take the `billing` translator; assert against the real
// English catalog rather than a stub, so a reworded key is caught here.
const t: BillingT = createTranslator({
  locale: "en",
  messages: messagesFor("en"),
  namespace: "billing",
});

// Noon UTC so the day is the same in every timezone a test might run in.
const base = {
  status: "active",
  cancelAtPeriodEnd: false,
  cancelAt: null,
  canceledAt: null,
  endedAt: null,
  currentPeriodEnd: "2026-10-06T12:00:00.000Z",
};

describe("subscriptionPhase", () => {
  it("is active while Stripe bills normally", () => {
    expect(subscriptionPhase(base)).toBe("active");
    expect(subscriptionPhase({ ...base, status: "trialing" })).toBe("active");
  });

  it("is past_due while Stripe retries a failed payment", () => {
    expect(subscriptionPhase({ ...base, status: "past_due" })).toBe("past_due");
    expect(subscriptionPhase({ ...base, status: "unpaid" })).toBe("past_due");
  });

  it("is ending once a cancellation is scheduled, even while still active", () => {
    expect(subscriptionPhase({ ...base, cancelAtPeriodEnd: true })).toBe("ending");
    expect(subscriptionPhase({ ...base, cancelAt: "2026-12-01T12:00:00.000Z" })).toBe("ending");
  });

  it("is canceled once the subscription has ended", () => {
    expect(
      subscriptionPhase({ ...base, status: "canceled", endedAt: "2026-10-06T12:00:00.000Z" }),
    ).toBe("canceled");
    expect(subscriptionPhase({ ...base, status: "incomplete_expired" })).toBe("canceled");
  });

  it("treats anything else as incomplete", () => {
    expect(subscriptionPhase({ ...base, status: "incomplete" })).toBe("incomplete");
    expect(subscriptionPhase({ ...base, status: "paused" })).toBe("incomplete");
  });
});

describe("subscriptionEndsOn", () => {
  it("prefers the real end, then the scheduled one, then the period end", () => {
    expect(
      subscriptionEndsOn({
        ...base,
        endedAt: "2026-09-30T12:00:00.000Z",
        cancelAt: "2026-10-06T12:00:00.000Z",
      }),
    ).toBe("2026-09-30T12:00:00.000Z");
    expect(subscriptionEndsOn({ ...base, cancelAt: "2026-12-01T12:00:00.000Z" })).toBe(
      "2026-12-01T12:00:00.000Z",
    );
    expect(subscriptionEndsOn({ ...base, cancelAtPeriodEnd: true })).toBe(
      "2026-10-06T12:00:00.000Z",
    );
    expect(subscriptionEndsOn(base)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("drops the cents on whole amounts only", () => {
    expect(formatMoney(1900)).toBe("€19");
    expect(formatMoney(2299)).toBe("€22.99");
    expect(formatMoney(0)).toBe("€0");
  });
});

describe("formatPeriod", () => {
  it("drops the first year when both dates share it", () => {
    // August rather than September: ICU's en-GB short month for September is "Sept".
    expect(formatPeriod("2026-08-06T12:00:00.000Z", "2026-10-06T12:00:00.000Z")).toBe(
      "6 Aug – 6 Oct 2026",
    );
    expect(formatPeriod("2026-12-06T12:00:00.000Z", "2027-01-06T12:00:00.000Z")).toBe(
      "6 Dec 2026 – 6 Jan 2027",
    );
    expect(formatPeriod(null, "2026-10-06T12:00:00.000Z")).toBeNull();
  });
});

describe("paymentMethodLabel", () => {
  const card = { type: "card", brand: "visa", last4: "4242", expMonth: 4, expYear: 2028, email: null };

  it("names cards by brand and last four", () => {
    expect(paymentMethodLabel(t, card)).toEqual({
      title: "Visa ending 4242",
      detail: "Expires 04/2028",
    });
    expect(paymentMethodLabel(t, { ...card, brand: "cartes_bancaires" }).title).toBe(
      "Cartes Bancaires ending 4242",
    );
    expect(paymentMethodLabel(t, { ...card, brand: "somethingnew" }).title).toBe(
      "Somethingnew ending 4242",
    );
    expect(paymentMethodLabel(t, { ...card, expMonth: null }).detail).toBeNull();
  });

  it("handles SEPA, Link, PayPal and anything new", () => {
    expect(
      paymentMethodLabel(t, { ...card, type: "sepa_debit", brand: null, last4: "3000" }),
    ).toEqual({ title: "SEPA direct debit ending 3000", detail: null });
    expect(paymentMethodLabel(t, { ...card, type: "link", email: "a@b.c" })).toEqual({
      title: "Link",
      detail: "a@b.c",
    });
    expect(paymentMethodLabel(t, { ...card, type: "paypal", email: "a@b.c" })).toEqual({
      title: "PayPal",
      detail: "a@b.c",
    });
    expect(paymentMethodLabel(t, { ...card, type: "us_bank_account" }).title).toBe(
      "Us Bank Account",
    );
  });
});

describe("invoiceStatusTag", () => {
  it("maps Stripe statuses to tags", () => {
    expect(invoiceStatusTag(t, "paid")).toEqual({ label: "Paid", tone: "green" });
    expect(invoiceStatusTag(t, "open").tone).toBe("amber");
    expect(invoiceStatusTag(t, "uncollectible").tone).toBe("red");
    expect(invoiceStatusTag(t, null).label).toBe("—");
  });
});

describe("creditApplied", () => {
  it("applies at most the invoice total from a negative balance", () => {
    expect(creditApplied(1900, -1900)).toBe(1900);
    expect(creditApplied(1900, -5000)).toBe(1900);
    expect(creditApplied(1900, -500)).toBe(500);
    expect(creditApplied(1900, 0)).toBe(0);
    expect(creditApplied(1900, 300)).toBe(0);
    expect(creditApplied(0, -1900)).toBe(0);
  });
});
