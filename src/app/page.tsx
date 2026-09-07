import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { LandingPage } from "@/components/landing/landing-page";
import { landingJsonLd, marketingMetadata } from "@/lib/seo";

const LOCALE = "en";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata("home", LOCALE);
}

/** English home. The proxy pins this URL to English, so copy and tags agree. */
export default async function Home() {
  return (
    <>
      <JsonLd data={await landingJsonLd(LOCALE)} />
      <LandingPage />
    </>
  );
}
