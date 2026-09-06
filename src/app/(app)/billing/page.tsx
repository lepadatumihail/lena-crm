import type { Metadata } from "next";

import { getMyBillingOverview } from "@/lib/data/billing";
import { BillingView } from "@/components/billing/billing-view";

export const metadata: Metadata = {
  title: "Billing",
};

/**
 * The agent's own billing page, inside the app shell. Stripe is read live
 * for the subscription, payment method and invoices; the profile is the
 * fallback. Checkout and the Customer Portal both return here.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; portal?: string }>;
}) {
  const [{ upgraded, portal }, overview] = await Promise.all([
    searchParams,
    getMyBillingOverview(),
  ]);
  return (
    <BillingView
      overview={overview}
      upgraded={upgraded === "1"}
      portalUnavailable={portal === "unavailable"}
    />
  );
}
