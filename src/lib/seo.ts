import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LOCALES, type AppLocale } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { PRICES } from "@/lib/billing";
import { faqEntries, LANDING_FAQ_KEYS } from "@/lib/faq";
import type { MarketingPageContent } from "@/lib/marketing";
import {
  isToolRoute,
  marketingAlternates,
  marketingPath,
  type ContentRoute,
  type MarketingRoute,
} from "@/lib/routes";
import {
  SITE_ALTERNATE_NAMES,
  SITE_FOUNDED,
  SITE_LOCALE,
  SITE_NAME,
  SITE_PROFILES,
  SITE_URL,
  SUPPORT_EMAIL,
  absoluteUrl,
} from "@/lib/site";

const OG_LOCALES: Record<AppLocale, string> = { en: SITE_LOCALE, es: "es_ES", ru: "ru_RU" };

/**
 * Everything a public page needs in <head> for one language: title,
 * description, canonical, hreflang alternates and a complete Open Graph block
 * (page metadata replaces the layout's openGraph wholesale, so it is rebuilt
 * here rather than patched). Without `title` the site's own name and tagline
 * are used verbatim, for the home page. A page title that already names the
 * brand, like the About page's, is used as it is too: the layout's
 * " · LeadWing" suffix would only repeat it.
 */
export async function marketingMetadata(
  route: MarketingRoute,
  locale: AppLocale,
  page?: { title: string; description: string }
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "site" });
  const siteTitle = `${SITE_NAME} — ${t("tagline")}`;
  const title = page?.title ?? siteTitle;
  const description = page?.description ?? t("description");
  const path = marketingPath(route, locale);
  const ogLocale = OG_LOCALES[locale];

  return {
    title: page && !page.title.includes(SITE_NAME) ? page.title : { absolute: title },
    description,
    alternates: { canonical: path, languages: marketingAlternates(route) },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      locale: ogLocale,
      alternateLocale: LOCALES.map((l) => OG_LOCALES[l]).filter((l) => l !== ogLocale),
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Publication date of each written page (ISO). One date per route, shared by
 * both languages: the two modules say the same thing, so they are revised
 * together. Shown on the page as "Updated …", emitted as datePublished /
 * dateModified, and used as the sitemap's lastmod — bump it when the copy
 * really changes, not on every deploy.
 */
export const PUBLISHED: Record<ContentRoute, string> = {
  crmSpain: "2026-09-13",
  crmMarbella: "2026-09-13",
  guideIdealista: "2026-09-13",
  guideFollowUp: "2026-09-13",
  guideAndaluciaRegister: "2026-09-29",
  guidePortalPrices: "2026-10-18",
  guideBecomeAgent: "2026-10-19",
  about: "2026-09-15",
  toolCommission: "2026-09-29",
  toolSpreadsheet: "2026-09-29",
  toolEarnings: "2026-10-09",
  tools: "2026-09-29",
};

/**
 * For a page revised or re-checked against its sources after publication
 * (the Andalucía register guide on a schedule, the commission calculator's
 * "who pays" section, the hub's third tool): the day of the last revision or
 * check. It drives the page's "Updated" date, dateModified and the sitemap's
 * lastmod, so a revision never moves datePublished, which stays the PUBLISHED
 * date.
 */
export const CHECKED: Partial<Record<ContentRoute, string>> = {
  guideAndaluciaRegister: "2026-10-19",
  guidePortalPrices: "2026-10-18",
  guideBecomeAgent: "2026-10-19",
  toolCommission: "2026-10-19",
  tools: "2026-10-09",
};

/**
 * The numbers the pricing page's title and description interpolate: the free
 * cap and the lowest price anyone can pay today. Shared by the head tags and
 * the structured data so the two can never disagree — and a reminder that
 * "from €{price}" is the founding price, which needs revisiting once the
 * founding cohort is full.
 */
export const PRICING_META = {
  limit: FREE_CLIENT_LIMIT,
  price: PRICES.founding.monthly,
} as const;

type JsonLd = Record<string, unknown>;

/**
 * Stable node ids, so every page can point at the same three entities instead
 * of describing them again. The home page defines the Organization and
 * WebSite nodes and the About page repeats the Organization; the other pages
 * reference them by @id, which is how a consumer stitches the site together.
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#app`;

/**
 * Who is behind the site, built by this one function wherever it is defined
 * in full (the home page and the About page), so an engine meets the same
 * node on both. The alternate names, the disambiguating sentence and `sameAs`
 * are what tell this LeadWing apart from everything else that shares the word.
 */
async function organizationJsonLd(locale: AppLocale): Promise<JsonLd> {
  const site = await getTranslations({ locale, namespace: "site" });
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: SITE_URL,
    description: site("description"),
    disambiguatingDescription: site("disambiguation"),
    slogan: site("tagline"),
    foundingDate: SITE_FOUNDED,
    logo: `${SITE_URL}/icon-512.png`,
    email: SUPPORT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      availableLanguage: [...LOCALES],
    },
    ...(SITE_PROFILES.length > 0 ? { sameAs: [...SITE_PROFILES] } : {}),
  };
}

/**
 * The product itself, with its offers. Shared by the landing page and the
 * pricing page: one node, one @id, so the two can never describe two
 * different products. `pageUrl` is the page in this language that the node
 * is being served from.
 */
export async function softwareApplicationJsonLd(
  locale: AppLocale,
  pageUrl: string
): Promise<JsonLd> {
  const site = await getTranslations({ locale, namespace: "site" });
  const offer = (name: string, price: number) => ({
    "@type": "Offer",
    name,
    price: String(price),
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
  });

  return {
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: SITE_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: pageUrl,
    inLanguage: locale,
    description: site("description"),
    disambiguatingDescription: site("disambiguation"),
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "CRM",
    operatingSystem: "Web",
    offers: [
      offer("Free", 0),
      offer("Pro monthly", PRICES.standard.monthly),
      offer("Pro yearly", PRICES.standard.yearly),
    ],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * Structured data for the landing page in one language: who we are, what the
 * product is and costs, and the FAQ (FAQPage), built from the same copy the
 * page renders.
 */
export async function landingJsonLd(locale: AppLocale): Promise<JsonLd> {
  const pageUrl = absoluteUrl(marketingPath("home", locale));
  const [faq, organization, app] = await Promise.all([
    getTranslations({ locale, namespace: "landing.faq" }),
    organizationJsonLd(locale),
    softwareApplicationJsonLd(locale, pageUrl),
  ]);

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        inLanguage: [...LOCALES],
        publisher: { "@id": ORGANIZATION_ID },
      },
      app,
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        inLanguage: locale,
        mainEntity: faqEntries(faq, LANDING_FAQ_KEYS).map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}

/**
 * The pricing page: the page itself, and the product whose prices it lists.
 * The Organization and WebSite nodes are only referenced — they are defined
 * once, on the home page.
 */
export async function pricingJsonLd(locale: AppLocale): Promise<JsonLd> {
  const pageUrl = absoluteUrl(marketingPath("pricing", locale));
  const [t, app] = await Promise.all([
    getTranslations({ locale, namespace: "billing.pricingPage" }),
    softwareApplicationJsonLd(locale, pageUrl),
  ]);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: t("meta.title", PRICING_META),
        description: t("meta.description", PRICING_META),
        inLanguage: locale,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": APP_ID },
      },
      app,
    ],
  };
}

/** How each kind of written page is typed in the structured data. */
const PAGE_TYPES: Record<MarketingPageContent["kind"], string> = {
  article: "Article",
  page: "WebPage",
  about: "AboutPage",
  tool: "WebPage",
};

/**
 * A free tool as its page describes it: an app that runs in the browser (the
 * calculator), or a spreadsheet to download (the client tracker), whose file
 * is the one in the page's language.
 */
function toolJsonLd(
  schema: NonNullable<MarketingPageContent["tool"]>["schema"],
  id: string,
  url: string,
  locale: AppLocale,
  content: MarketingPageContent
): JsonLd {
  if (schema["@type"] === "SpreadsheetDigitalDocument") {
    return {
      "@type": schema["@type"],
      "@id": id,
      name: content.heading,
      url,
      description: content.description,
      contentUrl: absoluteUrl(schema.contentPath),
      encodingFormat: schema.encodingFormat,
      isAccessibleForFree: true,
      inLanguage: locale,
      publisher: { "@id": ORGANIZATION_ID },
    };
  }
  return {
    "@type": schema["@type"],
    "@id": id,
    name: content.heading,
    url,
    description: content.description,
    applicationCategory: schema.applicationCategory,
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: locale,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * Structured data for a written page: the page (an Article for guides, a
 * WebPage for the product pages and the tools, an AboutPage for the About
 * page), where it sits in the site, and its FAQ. A tool page also describes
 * the tool itself, and the page is about that tool rather than the CRM. Built
 * from the same content module the page renders, so the two agree.
 */
export async function pageJsonLd(
  route: MarketingRoute,
  locale: AppLocale,
  content: MarketingPageContent
): Promise<JsonLd> {
  const article = content.kind === "article";
  // The About page is about the company rather than the product, so it
  // carries the Organization node itself, as the home page does.
  const aboutPage = content.kind === "about";
  const [t, organization] = await Promise.all([
    getTranslations({ locale, namespace: "marketing" }),
    aboutPage ? organizationJsonLd(locale) : null,
  ]);
  const pageUrl = absoluteUrl(marketingPath(route, locale));
  const home = absoluteUrl(marketingPath("home", locale));
  const { tool } = content;
  const toolId = `${pageUrl}#tool`;
  const subject = { "@id": aboutPage ? ORGANIZATION_ID : tool ? toolId : APP_ID };

  // Google rejects a ListItem without `item` anywhere but the last position,
  // so there is no "Guides" level until /guides is a real page. The tools
  // have one: /tools, the hub.
  const parents = isToolRoute(route)
    ? [{ name: t("breadcrumb.tools"), item: absoluteUrl(marketingPath("tools", locale)) }]
    : [];
  const crumbs: JsonLd[] = [
    { name: t("breadcrumb.home"), item: home },
    ...parents,
    { name: content.heading, item: pageUrl },
  ].map((crumb, i) => ({ "@type": "ListItem", position: i + 1, ...crumb }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": PAGE_TYPES[content.kind],
        "@id": pageUrl,
        url: pageUrl,
        ...(article ? { headline: content.heading } : { name: content.heading }),
        description: content.description,
        inLanguage: locale,
        datePublished: content.published,
        dateModified: content.modified ?? content.published,
        author: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        isPartOf: { "@id": WEBSITE_ID },
        about: content.topic ?? subject,
        ...(aboutPage || tool ? { mainEntity: subject } : {}),
      },
      ...(tool ? [toolJsonLd(tool.schema, toolId, pageUrl, locale, content)] : []),
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: crumbs,
      },
      ...(organization ? [organization] : []),
      ...(content.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              inLanguage: locale,
              mainEntity: content.faq.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ]
        : []),
    ],
  };
}
