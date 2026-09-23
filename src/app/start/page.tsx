import type { Metadata } from "next";

import { AdLandingPage, adLandingMetadata } from "@/components/marketing/ad-landing-page";

const LOCALE = "en";

export function generateMetadata(): Promise<Metadata> {
  return adLandingMetadata("start", LOCALE);
}

/** English ad landing (the "spreadsheet" ad). Not indexed; see UNLISTED_ROUTES. */
export default function Page() {
  return <AdLandingPage variant="start" locale={LOCALE} />;
}
