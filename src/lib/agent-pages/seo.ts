import type { Metadata, Viewport } from "next";

import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

import { agentPath, isIndexable, type AgentPage, type PageLang } from "./content";
import { PAGE_COPY, fill } from "./copy";

const OG_LOCALE: Record<PageLang, string> = { en: "en_GB", es: "es_ES", sv: "sv_SE" };

/**
 * Agent pages paint under the notch and the home indicator, so the phone's
 * bottom bar can sit above it (env(safe-area-inset-bottom) is 0 without
 * viewport-fit=cover); the page pads its own sides. The browser bar keeps the
 * root layout's colours.
 */
export const AGENT_PAGE_VIEWPORT: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161312" },
  ],
};

/**
 * "Elin Sandberg – svensk mäklare i Estepona": the name a buyer searches for,
 * then what they are. The root layout's template adds " · LeadWing".
 */
export function agentPageTitle(page: AgentPage, lang: PageLang): string {
  const copy = PAGE_COPY[lang];
  const role =
    page.content[lang]?.title ??
    (page.areas[0] ? fill(copy.defaultTitle, { area: page.areas[0] }) : copy.jobTitle);
  return `${page.displayName} – ${role}`;
}

/** hreflang map: every language the page exists in, plus x-default. */
export function agentPageAlternates(page: AgentPage): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const lang of page.langs) languages[lang] = agentPath(page.slug, lang, page.defaultLang);
  languages["x-default"] = agentPath(page.slug);
  return languages;
}

export function agentPageMetadata(page: AgentPage, lang: PageLang): Metadata {
  const title = agentPageTitle(page, lang);
  const description = page.content[lang]?.headline ?? "";
  const path = agentPath(page.slug, lang, page.defaultLang);
  const index = isIndexable(page, lang);
  return {
    title,
    description,
    alternates: { canonical: path, languages: agentPageAlternates(page) },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: {
      type: "profile",
      url: path,
      title,
      description,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * ProfilePage around a Person, the shape search engines read as "a page
 * about this person". No ratings: there are no reviews yet, and an agent's
 * own page could never earn review stars anyway.
 */
export function agentPageJsonLd(page: AgentPage, lang: PageLang): object {
  const copy = PAGE_COPY[lang];
  const url = absoluteUrl(agentPath(page.slug, lang, page.defaultLang));
  const text = page.content[lang];
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    inLanguage: lang,
    dateModified: page.updatedAt,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "Person",
      "@id": `${absoluteUrl(agentPath(page.slug))}#person`,
      name: page.displayName,
      jobTitle: copy.jobTitle,
      ...(text?.headline ? { description: text.headline } : {}),
      url,
      ...(page.photoUrl ? { image: page.photoUrl } : {}),
      knowsLanguage: page.spokenLanguages,
      workLocation: page.areas.map((name) => ({ "@type": "Place", name })),
      ...(page.works === "agency" && page.agencyName
        ? { worksFor: { "@type": "Organization", name: page.agencyName } }
        : {}),
    },
  };
}
