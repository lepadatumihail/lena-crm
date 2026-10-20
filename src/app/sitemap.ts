import type { MetadataRoute } from "next";

import { LOCALES, type AppLocale } from "@/i18n/config";
import { LEGAL_UPDATED } from "@/lib/legal";
import {
  MARKETING_ROUTES,
  isContentRoute,
  isListedRoute,
  marketingAlternates,
  marketingPath,
  type ListedRoute,
  type MarketingRoute,
} from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

const PRIORITY: Record<ListedRoute, number> = {
  home: 1,
  pricing: 0.8,
  crmSpain: 0.7,
  crmMarbella: 0.6,
  guideIdealista: 0.6,
  guideFollowUp: 0.6,
  guideAndaluciaRegister: 0.6,
  guidePortalPrices: 0.6,
  guideBecomeAgent: 0.6,
  guideFreeCrm: 0.6,
  guideBestCrm: 0.6,
  guideCrmAlternatives: 0.6,
  about: 0.5,
  toolCommission: 0.7,
  toolSpreadsheet: 0.7,
  toolEarnings: 0.7,
  tools: 0.6,
  privacy: 0.3,
  terms: 0.3,
  legalNotice: 0.3,
};

const CHANGE_FREQUENCY: Record<ListedRoute, "weekly" | "monthly" | "yearly"> = {
  home: "weekly",
  pricing: "monthly",
  crmSpain: "monthly",
  crmMarbella: "monthly",
  guideIdealista: "monthly",
  guideFollowUp: "monthly",
  guideAndaluciaRegister: "monthly",
  guidePortalPrices: "monthly",
  guideBecomeAgent: "monthly",
  guideFreeCrm: "monthly",
  guideBestCrm: "monthly",
  guideCrmAlternatives: "monthly",
  about: "monthly",
  toolCommission: "monthly",
  toolSpreadsheet: "monthly",
  toolEarnings: "monthly",
  tools: "monthly",
  privacy: "yearly",
  terms: "yearly",
  legalNotice: "yearly",
};

/**
 * Written pages date from their last revision, legal pages from their
 * effective date; the home and pricing pages change with the product, so
 * they date from the deploy.
 */
function lastModified(route: ListedRoute): Date {
  if (isContentRoute(route)) return new Date(CHECKED[route] ?? PUBLISHED[route]);
  if (route === "home" || route === "pricing") return new Date();
  return new Date(LEGAL_UPDATED[route]);
}

/** Every listed marketing page in every language, each carrying its hreflang twins; ad landings stay out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = (Object.keys(MARKETING_ROUTES) as MarketingRoute[]).filter(isListedRoute);
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
