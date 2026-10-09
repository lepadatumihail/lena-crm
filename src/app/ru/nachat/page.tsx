import type { Metadata } from "next";

import { AdLandingPage, adLandingMetadata } from "@/components/marketing/ad-landing-page";

const LOCALE = "ru";

export function generateMetadata(): Promise<Metadata> {
  return adLandingMetadata("start", LOCALE);
}

/** Russian ad landing (the "spreadsheet" ad). The proxy pins /ru/nachat to Russian whatever the cookie says. */
export default function Page() {
  return <AdLandingPage variant="start" locale={LOCALE} />;
}
