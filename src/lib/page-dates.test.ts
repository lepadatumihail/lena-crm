import { describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

// A later check than the first publication, so the two dates can be told apart.
vi.mock("@/lib/seo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/seo")>()),
  CHECKED: { guideAndaluciaRegister: "2026-10-27" },
}));

// Outside a request next-intl has no config to read: translate straight from
// the catalogs instead.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async ({ locale, namespace }: { locale: AppLocale; namespace?: string }) =>
      createTranslator({ locale, messages: messagesFor(locale), namespace: namespace as never }),
  };
});

const { PUBLISHED, pageJsonLd } = await import("@/lib/seo");
const { content: guideEn } = await import("@/content/pages/guide-andalusia-register.en");
const { content: guideEs } = await import("@/content/pages/guide-andalusia-register.es");
const { content: crmSpainEn } = await import("@/content/pages/crm-spain.en");
const { default: sitemap } = await import("@/app/sitemap");

type Node = Record<string, unknown>;
const pageNode = async (...args: Parameters<typeof pageJsonLd>) =>
  ((await pageJsonLd(...args)) as { "@graph": Node[] })["@graph"][0];

describe("a re-checked page keeps its publication date", () => {
  it.each([
    ["en", guideEn],
    ["es", guideEs],
  ] as const)("the %s guide is published once and modified at each check", async (locale, content) => {
    expect(content.published).toBe(PUBLISHED.guideAndaluciaRegister);
    expect(content.modified).toBe("2026-10-27");
    const node = await pageNode("guideAndaluciaRegister", locale, content);
    expect(node.datePublished).toBe(PUBLISHED.guideAndaluciaRegister);
    expect(node.dateModified).toBe("2026-10-27");
  });

  it("leaves a page without a check date as it was", async () => {
    const node = await pageNode("crmSpain", "en", crmSpainEn);
    expect(node.dateModified).toBe(node.datePublished);
  });

  it("dates the guide's sitemap entries from the check", () => {
    const lastmod = (path: string) =>
      sitemap().find((entry) => entry.url.endsWith(path))?.lastModified;
    expect(lastmod("/guides/andalusia-agent-register")).toEqual(new Date("2026-10-27"));
    expect(lastmod("/es/guias/registro-agentes-inmobiliarios-andalucia")).toEqual(
      new Date("2026-10-27")
    );
    expect(lastmod("/real-estate-crm-spain")).toEqual(new Date(PUBLISHED.crmSpain));
  });
});
