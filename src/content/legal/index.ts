import type { ComponentType } from "react";

import type { AppLocale } from "@/i18n/config";
import type { LegalDoc } from "@/lib/legal";
import { LegalNoticeEn } from "./legal-notice.en";
import { LegalNoticeEs } from "./legal-notice.es";
import { LegalNoticeRu } from "./legal-notice.ru";
import { PrivacyEn } from "./privacy.en";
import { PrivacyEs } from "./privacy.es";
import { PrivacyRu } from "./privacy.ru";
import { TermsEn } from "./terms.en";
import { TermsEs } from "./terms.es";
import { TermsRu } from "./terms.ru";

/**
 * The legal documents, one component per language. Prose lives in TSX rather
 * than the message catalogs so it can carry headings, lists, tables and links
 * without a template language; the page titles and descriptions are in
 * `messages/<lang>/legal.json`.
 */
export const LEGAL_DOCS = {
  privacy: { en: PrivacyEn, es: PrivacyEs, ru: PrivacyRu },
  terms: { en: TermsEn, es: TermsEs, ru: TermsRu },
  legalNotice: { en: LegalNoticeEn, es: LegalNoticeEs, ru: LegalNoticeRu },
} satisfies Record<LegalDoc, Record<AppLocale, ComponentType>>;
