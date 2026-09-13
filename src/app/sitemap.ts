import type { MetadataRoute } from "next";

import { LOCALES, type AppLocale } from "@/i18n/config";
import { LEGAL_UPDATED } from "@/lib/legal";
import {
  MARKETING_ROUTES,
  isContentRoute,
  marketingAlternates,
  marketingPath,
  type MarketingRoute,
} from "@/lib/routes";
import { PUBLISHED } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

const PRIORITY: Record<MarketingRoute, number> = {
  home: 1,
  pricing: 0.8,
  crmSpain: 0.7,
  crmMarbella: 0.6,
  guideIdealista: 0.6,
  guideFollowUp: 0.6,
  privacy: 0.3,
  terms: 0.3,
  legalNotice: 0.3,
};

const CHANGE_FREQUENCY: Record<MarketingRoute, "weekly" | "monthly" | "yearly"> = {
  home: "weekly",
  pricing: "monthly",
  crmSpain: "monthly",
  crmMarbella: "monthly",
  guideIdealista: "monthly",
  guideFollowUp: "monthly",
  privacy: "yearly",
  terms: "yearly",
  legalNotice: "yearly",
};

/**
 * Written pages date from their last revision, legal pages from their
 * effective date; the home and pricing pages change with the product, so
 * they date from the deploy.
 */
function lastModified(route: MarketingRoute): Date {
  if (isContentRoute(route)) return new Date(PUBLISHED[route]);
  if (route === "home" || route === "pricing") return new Date();
  return new Date(LEGAL_UPDATED[route]);
}

/** Every marketing page in every language, each carrying its hreflang twins. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = Object.keys(MARKETING_ROUTES) as MarketingRoute[];
  return routes.flatMap((route) => {
    const languages: Partial<Record<AppLocale | "x-default", string>> = {};
    for (const [lang, path] of Object.entries(marketingAlternates(route))) {
      languages[lang as AppLocale | "x-default"] = absoluteUrl(path);
    }
    return LOCALES.map((locale) => ({
      url: absoluteUrl(marketingPath(route, locale)),
      lastModified: lastModified(route),
      changeFrequency: CHANGE_FREQUENCY[route],
      priority: PRIORITY[route],
      alternates: { languages },
    }));
  });
}
