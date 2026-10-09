import type { Metadata } from "next";

import { content } from "@/content/pages/crm-marbella.ru";
import { MarketingPage, marketingPageMetadata } from "@/components/marketing/marketing-page";

const ROUTE = "crmMarbella";
const LOCALE = "ru";

export function generateMetadata(): Promise<Metadata> {
  return marketingPageMetadata(ROUTE, LOCALE, content);
}

export default function Page() {
  return <MarketingPage route={ROUTE} locale={LOCALE} content={content} />;
}
