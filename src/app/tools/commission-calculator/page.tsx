import type { Metadata } from "next";

import { MarketingPage, marketingPageMetadata } from "@/components/marketing/marketing-page";
import { content } from "@/content/pages/tool-commission.en";

const ROUTE = "toolCommission";
const LOCALE = "en";

export function generateMetadata(): Promise<Metadata> {
  return marketingPageMetadata(ROUTE, LOCALE, content);
}

export default function Page() {
  return <MarketingPage route={ROUTE} locale={LOCALE} content={content} />;
}
