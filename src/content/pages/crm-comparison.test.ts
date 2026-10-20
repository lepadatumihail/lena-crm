import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import { SOURCES } from "@/content/pages/crm-comparison.sources";

/**
 * The three CRM comparison guides (plan 025) name rivals' prices and limits,
 * so the three languages must never drift apart: a price fixed in English and
 * forgotten in Spanish would be a false claim about a competitor.
 */
const DIR = join(process.cwd(), "src/content/pages");
const GUIDES = ["guide-free-crm", "guide-best-crm", "guide-crm-alternatives"] as const;

/** A module's source without its comments, which are for whoever edits it next. */
const read = (guide: string, locale: string) =>
  readFileSync(join(DIR, `${guide}.${locale}.tsx`), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

/**
 * Every figure a module contains, as bare digits, so the same number written
 * the English, Spanish or Russian way compares equal: 1,040 / 1.040 /
 * 1 040 (non-breaking space), and 44.90 / 44,90.
 */
function figures(text: string): string[] {
  const found = text.match(/\d+(?:[.,  ]\d{3})*(?:[.,]\d{1,2})?/g) ?? [];
  return [...new Set(found.map((figure) => figure.replace(/\D/g, "")))].sort();
}

/** The sources a module cites, by key. */
function citations(text: string): string[] {
  return [...new Set(text.match(/\bS\.\w+/g) ?? [])].sort();
}

const TRANSLATIONS = GUIDES.flatMap((guide) =>
  LOCALES.filter((locale) => locale !== "en").map((locale) => [guide, locale] as const)
);

describe("the CRM comparison guides", () => {
  it.each(TRANSLATIONS)("%s (%s) prints the same figures as the English", (guide, locale) => {
    expect(figures(read(guide, locale))).toEqual(figures(read(guide, "en")));
  });

  it.each(TRANSLATIONS)("%s (%s) cites the same sources as the English", (guide, locale) => {
    expect(citations(read(guide, locale))).toEqual(citations(read(guide, "en")));
  });

  it("cites every source it lists, and nothing else", () => {
    const cited = new Set(GUIDES.flatMap((guide) => citations(read(guide, "en"))));
    expect(Object.keys(SOURCES).filter((key) => !cited.has(`S.${key}`))).toEqual([]);
    expect([...cited].filter((ref) => !(ref.slice(2) in SOURCES))).toEqual([]);
  });

  it("links only to https pages", () => {
    expect(Object.values(SOURCES).filter((url) => !url.startsWith("https://"))).toEqual([]);
  });
});
