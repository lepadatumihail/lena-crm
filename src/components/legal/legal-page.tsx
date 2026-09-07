import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/config";
import { LEGAL_DOCS } from "@/content/legal";
import { LEGAL_UPDATED, type LegalDoc } from "@/lib/legal";
import { marketingMetadata } from "@/lib/seo";
import { LegalArticle } from "./legal-article";

/** Head tags for a legal page in one language; the page files call this from generateMetadata. */
export async function legalMetadata(doc: LegalDoc, locale: AppLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "legal" });
  return marketingMetadata(doc, locale, {
    title: t(`${doc}.title`),
    description: t(`${doc}.description`),
  });
}

/** One legal document in one language, inside the shared chrome. */
export async function LegalPage({ doc, locale }: { doc: LegalDoc; locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const Body = LEGAL_DOCS[doc][locale];
  return (
    <LegalArticle title={t(`${doc}.title`)} updated={LEGAL_UPDATED[doc]}>
      <Body />
    </LegalArticle>
  );
}
