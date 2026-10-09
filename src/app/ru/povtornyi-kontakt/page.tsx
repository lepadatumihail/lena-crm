import type { Metadata } from "next";

import { AdLandingPage, adLandingMetadata } from "@/components/marketing/ad-landing-page";

const LOCALE = "ru";

export function generateMetadata(): Promise<Metadata> {
  return adLandingMetadata("quiet", LOCALE);
}

/** Russian ad landing (the "most leads go quiet" ad). The proxy pins /ru/povtornyi-kontakt to Russian whatever the cookie says. */
export default function Page() {
  return <AdLandingPage variant="quiet" locale={LOCALE} />;
}
