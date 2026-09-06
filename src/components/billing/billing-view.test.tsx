import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BillingView } from "@/components/billing/billing-view";
import { planState } from "@/lib/access";
import type { BillingOverview, StripeSnapshot } from "@/lib/data/billing";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import type { Profile } from "@/lib/supabase/types";

// The portal action pulls in the Supabase server client and the refresh
// helper needs the app router; neither matters for what the page shows.
vi.mock("@/lib/actions/billing", () => ({ openBillingPortal: vi.fn() }));
vi.mock("@/components/billing/refresh-while-pending", () => ({
  RefreshWhilePending: () => <div data-testid="refresh-while-pending" />,
}));

const NOW = "2026-09-06T12:00:00.000Z";
const PERIOD_END = "2026-10-06T12:00:00.000Z";

const founder: Profile = {
  id: "user-1",
  email: "agent@example.com",
  full_name: "Agent",
  is_admin: false,
  cohort: "founding",
  founding_number: 1,
  referral_code: "ABCDEFGH",
  referred_by: null,
  stripe_customer_id: "cus_1",
  subscription_status: "active",
  plan: "founding_monthly",
  plan_monthly_eur: 19,
  pro_until: null,
  created_at: NOW,
  updated_at: NOW,
};

const free: Profile = {
  ...founder,
  cohort: "standard",
  founding_number: null,
  stripe_customer_id: null,
  subscription_status: "none",
  plan: null,
  plan_monthly_eur: null,
};

const subscription: SubscriptionSnapshot = {
  id: "sub_1",
  status: "active",
  plan: "founding_monthly",
  amountCents: 1900,
  currency: "eur",
  interval: "month",
  startedAt: NOW,
  currentPeriodStart: NOW,
  currentPeriodEnd: PERIOD_END,
  cancelAtPeriodEnd: false,
  cancelAt: null,
  canceledAt: null,
  endedAt: null,
};

const stripe: StripeSnapshot = {
  subscription,
  paymentMethod: {
    type: "card",
    brand: "visa",
    last4: "4242",
    expMonth: 4,
    expYear: 2028,
    email: null,
  },
  balanceCents: 0,
  upcoming: {
    totalCents: 2299,
    amountDueCents: 2299,
    taxCents: 399,
    creditAppliedCents: 0,
    currency: "eur",
  },
  invoices: [
    {
      id: "in_1",
      number: "LW-0001",
      createdAt: NOW,
      status: "paid",
      totalCents: 2299,
      amountPaidCents: 2299,
      amountDueCents: 0,
      currency: "eur",
      hostedUrl: "https://invoice.stripe.com/i/one",
      pdfUrl: "https://pay.stripe.com/invoice/one/pdf",
      periodStart: NOW,
      periodEnd: PERIOD_END,
    },
  ],
};

function overview(profile: Profile, extra: Partial<BillingOverview> = {}): BillingOverview {
  return {
    email: profile.email ?? "",
    profile,
    plan: planState(profile, new Date(NOW)),
    planLabel: profile.plan ? "Founding · €19/mo" : null,
    clientCount: 12,
    founderCount: 1,
    credits: [],
    monthsEarned: 0,
    unappliedCreditEur: 0,
    stripe: null,
    stripeUnavailable: false,
    ...extra,
  };
}

function show(view: BillingOverview, flags: { upgraded?: boolean; portalUnavailable?: boolean } = {}) {
  return render(
    <BillingView
      overview={view}
      upgraded={flags.upgraded ?? false}
      portalUnavailable={flags.portalUnavailable ?? false}
    />,
  );
}

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(cleanup);

describe("BillingView", () => {
  it("shows a founding subscriber everything Stripe knows", () => {
    const { container } = show(overview(founder, { stripe }));
    const text = container.textContent ?? "";

    expect(screen.getByText("Pro · Founding")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("€19")).toBeTruthy();
    expect(screen.getByText("per month + IVA")).toBeTruthy();
    expect(text).toContain("Founding Agent #1");
    expect(text).toContain("€22.99 incl. IVA on 6 Oct 2026");
    expect(text).toContain("Visa ending 4242");
    expect(text).toContain("Expires 04/2028");
    expect(text).toContain("LW-0001");
    expect(screen.getByText("Paid")).toBeTruthy();
    expect(screen.getByRole("link", { name: /PDF/ }).getAttribute("href")).toBe(
      "https://pay.stripe.com/invoice/one/pdf",
    );
    expect(screen.getByRole("button", { name: "Manage subscription" })).toBeTruthy();
    expect(text).toContain("Unlimited on Pro");
  });

  it("falls back to the profile when Stripe is unreachable", () => {
    const { container } = show(overview(founder, { stripeUnavailable: true }));
    const text = container.textContent ?? "";

    expect(screen.getByText("Pro · Founding")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(text).toContain("Stripe didn't answer just now");
    expect(text).toContain("Couldn't load your invoices");
    expect(text).toContain("Founding · €19/mo");
  });

  it("flags a failed payment and points at the card", () => {
    show(
      overview(
        { ...founder, subscription_status: "past_due" },
        { stripe: { ...stripe, subscription: { ...subscription, status: "past_due" } } },
      ),
    );
    expect(screen.getByText("Payment past due")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update payment method" })).toBeTruthy();
  });

  it("shows when a scheduled cancellation takes effect", () => {
    const { container } = show(
      overview(founder, {
        stripe: { ...stripe, upcoming: null, subscription: { ...subscription, cancelAtPeriodEnd: true } },
      }),
    );
    expect(screen.getByText("Ends 6 Oct 2026")).toBeTruthy();
    expect(container.textContent).toContain("Your subscription ends on 6 Oct 2026");
    expect(screen.getByRole("button", { name: "Resume or manage" })).toBeTruthy();
  });

  it("sends a Free agent to the plans page and shows the founding spots", () => {
    const { container } = show(overview(free));
    const text = container.textContent ?? "";

    expect(screen.getByText("Free plan")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Upgrade to Pro/ }).getAttribute("href")).toBe(
      "/pricing",
    );
    expect(text).toContain("12 of 3");
    expect(text).toContain("19 spots left");
    expect(text).not.toContain("of 20");
    expect(screen.queryByText("Payment method")).toBeNull();
  });

  it("tells a comped agent how long Pro lasts", () => {
    const { container } = show(overview({ ...free, pro_until: PERIOD_END }));
    expect(screen.getByText("Until 6 Oct 2026")).toBeTruthy();
    expect(container.textContent).toContain("Pro is comped until");
    expect(screen.getByRole("link", { name: /Subscribe to keep Pro/ })).toBeTruthy();
  });

  it("keeps refreshing after checkout until the webhook lands", () => {
    const { container } = show(overview(free), { upgraded: true });
    expect(container.textContent).toContain("Stripe is confirming your payment");
    expect(screen.getByTestId("refresh-while-pending")).toBeTruthy();
  });

  it("thanks a subscriber who just came back from checkout", () => {
    const { container } = show(overview(founder, { stripe }), { upgraded: true });
    expect(container.textContent).toContain("Thank you — you're on Pro");
    expect(screen.queryByTestId("refresh-while-pending")).toBeNull();
  });
});
