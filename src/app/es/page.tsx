import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { LandingPage } from "@/components/landing/landing-page";
import { landingJsonLd, marketingMetadata } from "@/lib/seo";

const LOCALE = "es";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata("home", LOCALE);
}

/** Spanish home. The proxy pins /es to Spanish whatever the cookie says. */
export default async function HomeEs() {
  return (
    <>
      <JsonLd data={await landingJsonLd(LOCALE)} />
      <LandingPage />
    </>
  );
}
