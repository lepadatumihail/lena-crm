import { SUPPORT_EMAIL } from "@/lib/site";

/**
 * Who is behind LeadWing, as the legal pages state it. Spanish law (LSSI-CE
 * art. 10) and the GDPR require these to be real and current: fill in every
 * bracketed value before the pages go live. While any is still a placeholder
 * the pages carry a "draft" notice, so a half-filled version can't pass as
 * final.
 */
export const LEGAL_ENTITY = {
  /** Legal name: the founder's full name as an autónomo, or the company name. */
  name: "[Legal name]",
  /** NIF (autónomo) or CIF (company). */
  taxId: "[NIF]",
  /** Full postal address with postcode, city and country. */
  address: "[Street, postcode, city, Spain]",
  /** Mailbox for legal, privacy and support requests; must be monitored. */
  email: SUPPORT_EMAIL,
  /** Companies only: Registro Mercantil details. Leave empty as an autónomo. */
  registry: "",
  /** Where the database and files live, as shown in the Supabase dashboard. */
  hostingRegion: "[Supabase project region, e.g. eu-west-1 (Ireland)]",
} as const;

/** Effective date of each document (ISO); shown on the page and used by the sitemap. */
export const LEGAL_UPDATED = {
  privacy: "2026-09-24",
  terms: "2026-09-17",
  legalNotice: "2026-09-07",
} as const;

/** True while any entity detail is still a bracketed placeholder. */
export function legalEntityPending(): boolean {
  return Object.values(LEGAL_ENTITY).some((value) => value.startsWith("["));
}

export type LegalDoc = keyof typeof LEGAL_UPDATED;
