import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import type { MarketingPageContent } from "@/lib/marketing";
import { CONTENT_ROUTES } from "@/lib/routes";

const DIR = join(process.cwd(), "src/content/pages");

/** Every content module, one per written page and language (`<name>.<lang>.tsx`). */
const FILES = readdirSync(DIR).filter((file) => /^[a-z0-9-]+\.[a-z]{2}\.tsx$/.test(file));

const PAGES = await Promise.all(
  FILES.map(async (file) => {
    const { content } = (await import(`./${file.replace(/\.tsx$/, "")}`)) as {
      content: MarketingPageContent;
    };
    return [file, content] as const;
  })
);

describe("content modules", () => {
  it("has one per written page and language", () => {
    expect(PAGES.length).toBe(CONTENT_ROUTES.length * LOCALES.length);
  });

  it.each(PAGES)("%s: is a tool page if and only if it carries a tool", (_, content) => {
    expect(content.kind === "tool").toBe(content.tool !== undefined);
  });

  it.each(PAGES)("%s: keeps the title within 60 characters", (_, content) => {
    expect(content.title.length).toBeLessThanOrEqual(60);
  });

  it.each(PAGES)("%s: keeps the description between 140 and 160 characters", (_, content) => {
    expect(content.description.length).toBeGreaterThanOrEqual(140);
    expect(content.description.length).toBeLessThanOrEqual(160);
  });
});

/**
 * The CNMC rule (plan 018): no commission percentage or split anywhere a
 * visitor can read it (the copy, the labels, the component that renders the
 * defaults), not even as an example. The only percentages allowed are the tax
 * rates (IVA 21, IGIC 7, IRPF 15 and 7) and 100.
 */
describe("the commission calculator names no commission rate", () => {
  const ALLOWED = new Set([21, 7, 15, 100]);
  const SOURCES = [
    "src/content/pages/tool-commission.en.tsx",
    "src/content/pages/tool-commission.es.tsx",
    "src/content/pages/tool-commission.ru.tsx",
    // The hub describes the calculator too.
    "src/content/pages/tools.en.tsx",
    "src/content/pages/tools.es.tsx",
    "src/content/pages/tools.ru.tsx",
    "src/components/tools/commission-calculator.tsx",
    "messages/en/tools.json",
    "messages/es/tools.json",
    "messages/ru/tools.json",
  ];

  it.each(SOURCES)("%s", (path) => {
    const text = readFileSync(join(process.cwd(), path), "utf8");
    const found = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s?%/g)].map((m) =>
      Number(m[1].replace(",", "."))
    );
    expect(found.filter((value) => !ALLOWED.has(value))).toEqual([]);
  });
});

/**
 * The same rule on the earnings calculator, whose copy also names the Social
 * Security rate (31.5), the quarterly IRPF advances (20) and the share of
 * withheld income that waives them (70). Its labels live in the tools
 * catalogs, which the block above already scans.
 */
describe("the earnings calculator names no commission rate", () => {
  const ALLOWED = new Set([21, 7, 15, 100, 31.5, 20, 70]);
  const SOURCES = [
    "src/content/pages/tool-earnings.en.tsx",
    "src/content/pages/tool-earnings.es.tsx",
    "src/content/pages/tool-earnings.ru.tsx",
    "src/components/tools/earnings-calculator.tsx",
    "src/components/tools/cuota-table.tsx",
  ];

  it.each(SOURCES)("%s", (path) => {
    const text = readFileSync(join(process.cwd(), path), "utf8");
    const found = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s?%/g)].map((m) =>
      Number(m[1].replace(",", "."))
    );
    expect(found.filter((value) => !ALLOWED.has(value))).toEqual([]);
  });
});
