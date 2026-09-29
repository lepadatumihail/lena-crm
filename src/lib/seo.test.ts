import { describe, expect, it, vi } from "vitest";

import { content as toolEn } from "@/content/pages/tool-commission.en";
import { content as toolEs } from "@/content/pages/tool-commission.es";
import type { AppLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { marketingPath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

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
});
