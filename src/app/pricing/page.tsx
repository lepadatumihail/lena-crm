import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { PricingPage, pricingMetadata } from "@/components/marketing/pricing-page";
import { pricingJsonLd } from "@/lib/seo";

const LOCALE = "en";

export function generateMetadata(): Promise<Metadata> {
  return pricingMetadata(LOCALE);
}

/**
 * English pricing. A public marketing page that also personalises for a
 * signed-in agent, which is why it lives outside the (app) group: it is the
 * destination of the client-cap prompt and needs the user's id to tag the
 * Stripe Payment Links. Stripe's post-checkout redirect may still land here;
 * it is forwarded to /billing, where the subscription details live.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;
  if (upgraded === "1") redirect("/billing?upgraded=1");

  return (
    <>
      <JsonLd data={await pricingJsonLd(LOCALE)} />
      <PricingPage locale={LOCALE} />
    </>
  );
}
