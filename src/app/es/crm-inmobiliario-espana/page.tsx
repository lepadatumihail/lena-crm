import type { Metadata } from "next";

import { content } from "@/content/pages/crm-spain.es";
import { MarketingPage, marketingPageMetadata } from "@/components/marketing/marketing-page";

const ROUTE = "crmSpain";
const LOCALE = "es";

export function generateMetadata(): Promise<Metadata> {
  return marketingPageMetadata(ROUTE, LOCALE, content);
}

export default function Page() {
  return <MarketingPage route={ROUTE} locale={LOCALE} content={content} />;
}
