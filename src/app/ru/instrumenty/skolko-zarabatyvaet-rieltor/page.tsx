import type { Metadata } from "next";

import { MarketingPage, marketingPageMetadata } from "@/components/marketing/marketing-page";
import { content } from "@/content/pages/tool-earnings.ru";

const ROUTE = "toolEarnings";
const LOCALE = "ru";

export function generateMetadata(): Promise<Metadata> {
  return marketingPageMetadata(ROUTE, LOCALE, content);
}

export default function Page() {
  return <MarketingPage route={ROUTE} locale={LOCALE} content={content} />;
}
