import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/legal-page";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("terms", "en");
}

export default function Page() {
  return <LegalPage doc="terms" locale="en" />;
}
