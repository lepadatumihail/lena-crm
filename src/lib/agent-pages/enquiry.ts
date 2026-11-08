import { z } from "zod";

import { PAGE_LANGS, type PageLang } from "./content";
import type { ReplyBucket } from "./copy";

/*
 * The page form: what a buyer or seller can send, and how it becomes a
 * client in the agent's LeadWing. Pure functions, shared by the server
 * action and its tests.
 */

/** Budget bands, in the order the form shows them (PageCopy.budgetOpts). */
export const BUDGETS = [
  { key: "u400", min: null, max: 400_000 },
  { key: "400-800", min: 400_000, max: 800_000 },
  { key: "800-1500", min: 800_000, max: 1_500_000 },
  { key: "1500+", min: 1_500_000, max: null },
] as const;
export type BudgetKey = (typeof BUDGETS)[number]["key"];

export const BEDS = ["1", "2", "3", "4+"] as const;
export type BedsKey = (typeof BEDS)[number];

/** Buying timelines, in the order of PageCopy.whenOpts. */
export const WHEN = ["looking", "soon", "now"] as const;
export type WhenKey = (typeof WHEN)[number];

/** Seller timelines, in the order of PageCopy.sellWhenOpts. */
export const SELL_WHEN = ["price", "soon", "asap"] as const;
export type SellWhenKey = (typeof SELL_WHEN)[number];

/** Home types, in the order of PageCopy.typeOpts; all are PROPERTY_TYPES values. */
export const HOME_TYPES = ["apartment", "townhouse", "villa", "plot"] as const;
export type HomeType = (typeof HOME_TYPES)[number];

const enumKeys = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);

export const enquiryInputSchema = z.object({
  slug: z.string().min(3).max(60),
  lang: z.enum(PAGE_LANGS),
  kind: z.enum(["buy", "sell"]),
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(3).max(200),
  message: z.string().trim().max(2000).optional(),
  budget: enumKeys(BUDGETS.map((b) => b.key) as [BudgetKey, ...BudgetKey[]]).optional(),
  beds: z.enum(BEDS).optional(),
  areas: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  when: z.enum(WHEN).optional(),
  where: z.string().trim().max(120).optional(),
  homeType: z.enum(HOME_TYPES).optional(),
  sellWhen: z.enum(SELL_WHEN).optional(),
  /** Hidden field people never see; bots fill it. */
  company: z.string().max(200).optional(),
  /** How long the form was open before sending, measured in the browser. */
  elapsedMs: z.number().int().min(0).max(86_400_000),
});
export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

/** Forms sent faster than a person can fill them in are dropped quietly. */
export const MIN_FILL_MS = 2_500;

export function looksLikeBot(input: Pick<EnquiryInput, "company" | "elapsedMs">): boolean {
  return Boolean(input.company?.trim()) || input.elapsedMs < MIN_FILL_MS;
}

/** "Anna  Berg Lind" → first "Anna", last "Berg Lind"; one word leaves last empty. */
export function splitName(name: string): { first: string; last: string } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const [first = "", ...rest] = words;
  return { first: first.slice(0, 100), last: rest.join(" ").slice(0, 100) };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The one contact field, read as an email or a phone number. A phone keeps
 * its leading + and digits only; it needs at least 7 digits, so "123" or a
 * stray word is refused.
 */
export function parseContact(raw: string): { email: string } | { phone: string } | null {
  const value = raw.trim();
  if (value.includes("@")) return EMAIL.test(value) ? { email: value.toLowerCase() } : null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return { phone: value.startsWith("+") || value.startsWith("00") ? `+${digits.replace(/^00/, "")}` : digits };
}

/** The client's language as the app stores it (an English name from LANGUAGES). */
export const CLIENT_LANGUAGE: Record<PageLang, string> = {
  en: "English",
  es: "Spanish",
  sv: "Swedish",
};

export function budgetRange(key: BudgetKey | undefined): { min: number | null; max: number | null } {
  const band = BUDGETS.find((b) => b.key === key);
  return band ? { min: band.min, max: band.max } : { min: null, max: null };
}

export function bedroomCount(key: BedsKey | undefined): number | null {
  if (!key) return null;
  return Number.parseInt(key, 10);
}

/** Only areas the page offers survive; anything else in the request is dropped. */
export function pickAreas(requested: readonly string[] | undefined, offered: readonly string[]): string[] {
  if (!requested?.length) return [];
  const byKey = new Map(offered.map((a) => [a.trim().toLowerCase(), a]));
  const kept: string[] = [];
  for (const area of requested) {
    const match = byKey.get(area.trim().toLowerCase());
    if (match && !kept.includes(match)) kept.push(match);
  }
  return kept;
}

/** What the form answered, stored on the enquiry as it was sent. */
export function enquiryDetails(input: EnquiryInput, areas: string[]): Record<string, string | string[]> {
  if (input.kind === "buy") {
    const details: Record<string, string | string[]> = {};
    if (input.budget) details.budget = input.budget;
    if (input.beds) details.beds = input.beds;
    if (areas.length) details.areas = areas;
    if (input.when) details.when = input.when;
    return details;
  }
  const details: Record<string, string | string[]> = {};
  if (input.where) details.where = input.where;
  if (input.homeType) details.homeType = input.homeType;
  if (input.sellWhen) details.sellWhen = input.sellWhen;
  return details;
}

/**
 * The reply-time line, from the page's recent enquiries. Each one counts with
 * the time it took to get a first logged contact; one still unanswered after
 * a day counts as slower than any band, so ignoring messages can't keep a
 * fast line. At least five samples, or no line at all.
 */
export const REPLY_MIN_SAMPLES = 5;

export function replyBucket(
  enquiries: readonly { received_at: string; first_reply_at: string | null }[],
  now: Date
): ReplyBucket | null {
  const DAY = 86_400_000;
  const waits: number[] = [];
  for (const e of enquiries) {
    const received = Date.parse(e.received_at);
    if (Number.isNaN(received)) continue;
    if (e.first_reply_at) {
      const replied = Date.parse(e.first_reply_at);
      if (!Number.isNaN(replied)) waits.push(Math.max(0, replied - received));
    } else if (now.getTime() - received > DAY) {
      waits.push(Number.POSITIVE_INFINITY);
    }
  }
  if (waits.length < REPLY_MIN_SAMPLES) return null;
  waits.sort((a, b) => a - b);
  // With an even count, the slower of the two middle values: the line errs
  // on the side of promising less.
  const median = waits[Math.floor(waits.length / 2)];
  const minutes = median / 60_000;
  if (minutes <= 60) return "hour";
  if (minutes <= 180) return "fewHours";
  if (minutes <= 1440) return "day";
  return null;
}
