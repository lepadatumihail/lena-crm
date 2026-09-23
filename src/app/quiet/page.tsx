import type { Metadata } from "next";

import { AdLandingPage, adLandingMetadata } from "@/components/marketing/ad-landing-page";

const LOCALE = "en";

export function generateMetadata(): Promise<Metadata> {
  return adLandingMetadata("quiet", LOCALE);
}

/** English ad landing (the "most leads go quiet" ad). Not indexed; see UNLISTED_ROUTES. */
export default function Page() {
  return <AdLandingPage variant="quiet" locale={LOCALE} />;
}
