import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LOCALES, type AppLocale } from "@/i18n/config";
import { PRICES } from "@/lib/billing";
import { faqEntries } from "@/lib/faq";
import { marketingAlternates, marketingPath, type MarketingRoute } from "@/lib/routes";
import { SITE_LOCALE, SITE_NAME, SITE_PROFILES, SITE_URL, absoluteUrl } from "@/lib/site";

const OG_LOCALES: Record<AppLocale, string> = { en: SITE_LOCALE, es: "es_ES" };

/**
 * Everything a public page needs in <head> for one language: title,
 * description, canonical, hreflang alternates and a complete Open Graph block
 * (page metadata replaces the layout's openGraph wholesale, so it is rebuilt
 * here rather than patched). Without `title` the site's own name and tagline
 * are used verbatim, for the home page.
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
    title: page ? page.title : { absolute: siteTitle },
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

type JsonLd = Record<string, unknown>;

/**
 * Structured data for the landing page in one language: who we are, what the
 * product is and costs, and the FAQ (FAQPage), built from the same copy the
 * page renders.
 */
export async function landingJsonLd(locale: AppLocale): Promise<JsonLd> {
  const [site, faq] = await Promise.all([
    getTranslations({ locale, namespace: "site" }),
    getTranslations({ locale, namespace: "landing.faq" }),
  ]);
  const organization = `${SITE_URL}/#organization`;
  const pageUrl = absoluteUrl(marketingPath("home", locale));
  const offer = (name: string, price: number) => ({
    "@type": "Offer",
    name,
    price: String(price),
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organization,
        name: SITE_NAME,
        url: SITE_URL,
        description: site("description"),
        logo: `${SITE_URL}/icon-512.png`,
        ...(SITE_PROFILES.length > 0 ? { sameAs: [...SITE_PROFILES] } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: [...LOCALES],
        publisher: { "@id": organization },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: pageUrl,
        inLanguage: locale,
        description: site("description"),
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        slogan: site("tagline"),
        offers: [
          offer("Free", 0),
          offer("Pro monthly", PRICES.standard.monthly),
          offer("Pro yearly", PRICES.standard.yearly),
        ],
        publisher: { "@id": organization },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        inLanguage: locale,
        mainEntity: faqEntries(faq).map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}
