import type { Metadata } from "next";

import { content } from "@/content/pages/guide-crm-alternatives.ru";
import { MarketingPage, marketingPageMetadata } from "@/components/marketing/marketing-page";

const ROUTE = "guideCrmAlternatives";
const LOCALE = "ru";

export function generateMetadata(): Promise<Metadata> {
  return marketingPageMetadata(ROUTE, LOCALE, content);
}

export default function Page() {
  return <MarketingPage route={ROUTE} locale={LOCALE} content={content} />;
}
