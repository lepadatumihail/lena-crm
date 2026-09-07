import type { MetadataRoute } from "next";

import { LOCALES, type AppLocale } from "@/i18n/config";
import { LEGAL_UPDATED } from "@/lib/legal";
import {
  MARKETING_ROUTES,
  marketingAlternates,
  marketingPath,
  type MarketingRoute,
} from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

const PRIORITY: Record<MarketingRoute, number> = {
  home: 1,
  privacy: 0.3,
  terms: 0.3,
  legalNotice: 0.3,
};

/** Legal pages date from their last revision; the home page from the deploy. */
function lastModified(route: MarketingRoute): Date {
  return route === "home" ? new Date() : new Date(LEGAL_UPDATED[route]);
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
      changeFrequency: route === "home" ? ("weekly" as const) : ("yearly" as const),
      priority: PRIORITY[route],
      alternates: { languages },
    }));
  });
}
