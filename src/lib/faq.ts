import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { PRICES } from "@/lib/billing";

/**
 * The landing page FAQ. Copy lives in `landing.faq.items.<key>` (q + a) in
 * every language; this is the display order. The same entries feed the
 * FAQPage structured data, so the two can never disagree.
 */
export const FAQ_KEYS = [
  "what",
  "free",
  "price",
  "card",
  "agencies",
  "mobile",
  "whatsapp",
  "portals",
  "import",
  "privacy",
  "export",
  "cancel",
  "calendar",
] as const;

export type FaqKey = (typeof FAQ_KEYS)[number];

/** The homepage avoids repeating the offer already explained above pricing. */
export const LANDING_FAQ_KEYS = [
  "import",
  "mobile",
  "whatsapp",
  "calendar",
  "privacy",
  "export",
  "cancel",
] as const satisfies readonly FaqKey[];

type FaqMessageKey = `items.${FaqKey}.q` | `items.${FaqKey}.a`;

/** A `landing.faq` translator; loose values so the same call serves every answer. */
export type FaqT = (key: FaqMessageKey, values?: Record<string, string | number>) => string;

export type FaqEntry = { key: FaqKey; question: string; answer: string };

export function faqEntries(t: FaqT, keys: readonly FaqKey[] = FAQ_KEYS): FaqEntry[] {
  const values = {
    limit: FREE_CLIENT_LIMIT,
    monthly: PRICES.standard.monthly,
    yearly: PRICES.standard.yearly,
  };
  return keys.map((key) => ({
    key,
    question: t(`items.${key}.q`),
    answer: t(`items.${key}.a`, values),
  }));
}
