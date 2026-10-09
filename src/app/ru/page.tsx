import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { LandingPage } from "@/components/landing/landing-page";
import { landingJsonLd, marketingMetadata } from "@/lib/seo";

const LOCALE = "ru";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata("home", LOCALE);
}

/** Russian home. The proxy pins /ru to Russian whatever the cookie says. */
export default async function HomeRu() {
  return (
    <>
      <JsonLd data={await landingJsonLd(LOCALE)} />
      <LandingPage />
    </>
  );
}
