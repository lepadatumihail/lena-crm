import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/legal-page";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("legalNotice", "en");
}

export default function Page() {
  return <LegalPage doc="legalNotice" locale="en" />;
}
