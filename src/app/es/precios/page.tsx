import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { PricingPage, pricingMetadata } from "@/components/marketing/pricing-page";
import { pricingJsonLd } from "@/lib/seo";

const LOCALE = "es";

export function generateMetadata(): Promise<Metadata> {
  return pricingMetadata(LOCALE);
}

/** Spanish pricing. The proxy pins /es/precios to Spanish whatever the cookie says. */
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
