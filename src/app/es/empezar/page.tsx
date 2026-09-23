import type { Metadata } from "next";

import { AdLandingPage, adLandingMetadata } from "@/components/marketing/ad-landing-page";

const LOCALE = "es";

export function generateMetadata(): Promise<Metadata> {
  return adLandingMetadata("start", LOCALE);
}

/** Spanish ad landing (the "spreadsheet" ad). The proxy pins /es/empezar to Spanish whatever the cookie says. */
export default function Page() {
  return <AdLandingPage variant="start" locale={LOCALE} />;
}
