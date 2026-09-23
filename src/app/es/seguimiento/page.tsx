import type { Metadata } from "next";

import { AdLandingPage, adLandingMetadata } from "@/components/marketing/ad-landing-page";

const LOCALE = "es";

export function generateMetadata(): Promise<Metadata> {
  return adLandingMetadata("quiet", LOCALE);
}

/** Spanish ad landing (the "most leads go quiet" ad). The proxy pins /es/seguimiento to Spanish whatever the cookie says. */
export default function Page() {
  return <AdLandingPage variant="quiet" locale={LOCALE} />;
}
