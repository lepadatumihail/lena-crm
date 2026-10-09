import type { Metadata } from "next";

import { LegalPage, legalMetadata } from "@/components/legal/legal-page";

export function generateMetadata(): Promise<Metadata> {
  return legalMetadata("privacy", "ru");
}

export default function Page() {
  return <LegalPage doc="privacy" locale="ru" />;
}
