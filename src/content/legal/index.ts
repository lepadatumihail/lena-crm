import type { ComponentType } from "react";

import type { AppLocale } from "@/i18n/config";
import type { LegalDoc } from "@/lib/legal";
import { LegalNoticeEn } from "./legal-notice.en";
import { LegalNoticeEs } from "./legal-notice.es";
import { PrivacyEn } from "./privacy.en";
import { PrivacyEs } from "./privacy.es";
import { TermsEn } from "./terms.en";
import { TermsEs } from "./terms.es";

/**
 * The legal documents, one component per language. Prose lives in TSX rather
 * than the message catalogs so it can carry headings, lists, tables and links
 * without a template language; the page titles and descriptions are in
 * `messages/<lang>/legal.json`.
 */
export const LEGAL_DOCS = {
  privacy: { en: PrivacyEn, es: PrivacyEs },
  terms: { en: TermsEn, es: TermsEs },
  legalNotice: { en: LegalNoticeEn, es: LegalNoticeEs },
} satisfies Record<LegalDoc, Record<AppLocale, ComponentType>>;
