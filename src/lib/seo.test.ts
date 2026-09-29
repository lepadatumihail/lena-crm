import { describe, expect, it, vi } from "vitest";

import { content as toolEn } from "@/content/pages/tool-commission.en";
import { content as toolEs } from "@/content/pages/tool-commission.es";
import { content as spreadsheetEn } from "@/content/pages/tool-spreadsheet.en";
import { content as spreadsheetEs } from "@/content/pages/tool-spreadsheet.es";
import { content as hubEn } from "@/content/pages/tools.en";
import type { AppLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { marketingPath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";
import { XLSX_TYPE, trackerPath } from "@/lib/tools/tracker-files";

import { pageJsonLd } from "./seo";

// Outside a request next-intl has no config to read: translate straight from
// the catalogs instead.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async ({ locale, namespace }: { locale: AppLocale; namespace?: string }) =>
      createTranslator({ locale, messages: messagesFor(locale), namespace: namespace as never }),
  };
});

type Node = Record<string, unknown>;

describe("pageJsonLd for a tool page", () => {
  it.each([
    ["en", toolEn],
    ["es", toolEs],
  ] as const)("describes the %s calculator as the page's subject", async (locale, content) => {
    const jsonLd = (await pageJsonLd("toolCommission", locale, content)) as { "@graph": Node[] };
    const graph = jsonLd["@graph"];
    const pageUrl = absoluteUrl(marketingPath("toolCommission", locale));
    const byType = (type: string) => graph.filter((node) => node["@type"] === type);

    expect(graph.map((node) => node["@type"])).toEqual([
      "WebPage",
      "WebApplication",
      "BreadcrumbList",
      "FAQPage",
    ]);

    const [page] = byType("WebPage");
    const [tool] = byType("WebApplication");
    expect(tool["@id"]).toBe(`${pageUrl}#tool`);
    expect(page.mainEntity).toEqual({ "@id": `${pageUrl}#tool` });
    expect(page.about).toEqual({ "@id": `${pageUrl}#tool` });
    expect(tool).toMatchObject({
      name: content.heading,
      url: pageUrl,
      applicationCategory: "FinanceApplication",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      inLanguage: locale,
    });

    const [faq] = byType("FAQPage");
    expect((faq.mainEntity as unknown[]).length).toBe(content.faq.length);
  });

  it.each([
    ["en", spreadsheetEn],
    ["es", spreadsheetEs],
  ] as const)("describes the %s client tracker as a spreadsheet to download", async (locale, content) => {
    const jsonLd = (await pageJsonLd("toolSpreadsheet", locale, content)) as { "@graph": Node[] };
    const graph = jsonLd["@graph"];
    const pageUrl = absoluteUrl(marketingPath("toolSpreadsheet", locale));

    expect(graph.map((node) => node["@type"])).toEqual([
      "WebPage",
      "SpreadsheetDigitalDocument",
      "BreadcrumbList",
      "FAQPage",
    ]);
    const [page, file] = graph;
    expect(page.mainEntity).toEqual({ "@id": `${pageUrl}#tool` });
    expect(file).toMatchObject({
      "@id": `${pageUrl}#tool`,
      name: content.heading,
      url: pageUrl,
      contentUrl: absoluteUrl(trackerPath(locale)),
      encodingFormat: XLSX_TYPE,
      isAccessibleForFree: true,
      inLanguage: locale,
    });
  });
});

describe("pageJsonLd breadcrumbs", () => {
  const crumbsOf = async (...args: Parameters<typeof pageJsonLd>) => {
    const { "@graph": graph } = (await pageJsonLd(...args)) as { "@graph": Node[] };
    const list = graph.find((node) => node["@type"] === "BreadcrumbList");
    return (list?.itemListElement as Node[]).map(({ position, name, item }) => ({ position, name, item }));
  };

  it("puts a tool under the Tools hub", async () => {
    expect(await crumbsOf("toolSpreadsheet", "es", spreadsheetEs)).toEqual([
      { position: 1, name: "Inicio", item: absoluteUrl("/es") },
      { position: 2, name: "Herramientas", item: absoluteUrl("/es/herramientas") },
      {
        position: 3,
        name: spreadsheetEs.heading,
        item: absoluteUrl("/es/herramientas/plantilla-excel-inmobiliaria"),
      },
    ]);
  });

  it("keeps the hub itself one level below home", async () => {
    expect(await crumbsOf("tools", "en", hubEn)).toEqual([
      { position: 1, name: "Home", item: absoluteUrl("/") },
      { position: 2, name: hubEn.heading, item: absoluteUrl("/tools") },
    ]);
  });
});
