import { DEFAULT_LOCALE, LOCALES, isLocale, type AppLocale } from "@/i18n/config";

/**
 * Which top-level paths need a signed-in agent.
 *
 * The proxy (src/proxy.ts → updateSession) sends anonymous visitors on these
 * prefixes to /login, keeping where they were going in `next`. Everything
 * else, including URLs that don't exist, passes through so it can 404 like a
 * normal site. The pages behind sign-in verify the session again themselves,
 * so a prefix missing here costs the `next` hand-off, not access control;
 * routes.test.ts keeps the list in step with the filesystem. robots.txt
 * disallows the same prefixes.
 */
export const PROTECTED_PREFIXES = [
  "/admin",
  "/billing",
  "/calculator",
  "/calendar",
  "/clients",
  "/home",
  "/notifications",
  "/referrals",
  "/settings",
  "/tasks",
  "/templates",
] as const;

/** The prefix itself or anything under it; never a look-alike such as "/clientsx". */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Public marketing pages, one URL per language. English lives at the root,
 * Spanish under /es and Russian under /ru (Latin transliterated slugs, so a
 * link pasted into WhatsApp or an e-mail stays readable), so search engines get a crawlable, linkable page per
 * language: the cookie switch the app uses is invisible to them. hreflang
 * tags, the sitemap, the footer and the language toggle all read this map;
 * routes.test.ts checks every path has a page file.
 */
export const MARKETING_ROUTES = {
  home: { en: "/", es: "/es", ru: "/ru" },
  pricing: { en: "/pricing", es: "/es/precios", ru: "/ru/tarify" },
  crmSpain: {
    en: "/real-estate-crm-spain",
    es: "/es/crm-inmobiliario-espana",
    ru: "/ru/crm-dlya-rieltorov-ispaniya",
  },
  crmMarbella: {
    en: "/crm-for-marbella-agents",
    es: "/es/crm-inmobiliario-marbella",
    ru: "/ru/crm-dlya-rieltorov-marbelya",
  },
  guideIdealista: {
    en: "/guides/idealista-lead-management",
    es: "/es/guias/gestionar-leads-idealista",
    ru: "/ru/gaidy/lidy-s-idealista",
  },
  guideFollowUp: {
    en: "/guides/real-estate-lead-follow-up",
    es: "/es/guias/seguimiento-leads-inmobiliarios",
    ru: "/ru/gaidy/povtornyi-kontakt-s-lidami",
  },
  guideAndaluciaRegister: {
    en: "/guides/andalusia-agent-register",
    es: "/es/guias/registro-agentes-inmobiliarios-andalucia",
    ru: "/ru/gaidy/reestr-agentov-nedvizhimosti-andalusii",
  },
  about: { en: "/about", es: "/es/sobre-nosotros", ru: "/ru/o-nas" },
  toolCommission: {
    en: "/tools/commission-calculator",
    es: "/es/herramientas/calculadora-comision-inmobiliaria",
    ru: "/ru/instrumenty/kalkulyator-komissii-rieltora",
  },
  toolSpreadsheet: {
    en: "/tools/client-spreadsheet",
    es: "/es/herramientas/plantilla-excel-inmobiliaria",
    ru: "/ru/instrumenty/tablitsa-klientov-excel",
  },
  toolEarnings: {
    en: "/tools/agent-earnings-calculator",
    es: "/es/herramientas/calculadora-ingresos-agente-inmobiliario",
    ru: "/ru/instrumenty/skolko-zarabatyvaet-rieltor",
  },
  tools: { en: "/tools", es: "/es/herramientas", ru: "/ru/instrumenty" },
  privacy: { en: "/privacy", es: "/es/privacidad", ru: "/ru/konfidentsialnost" },
  terms: { en: "/terms", es: "/es/terminos", ru: "/ru/usloviya" },
  legalNotice: { en: "/legal", es: "/es/aviso-legal", ru: "/ru/pravovaya-informatsiya" },
  start: { en: "/start", es: "/es/empezar", ru: "/ru/nachat" },
  quiet: { en: "/quiet", es: "/es/seguimiento", ru: "/ru/povtornyi-kontakt" },
} as const satisfies Record<string, Record<AppLocale, string>>;

export type MarketingRoute = keyof typeof MARKETING_ROUTES;

/**
 * Ad landings: a real marketing page (language pinned by URL, cookie notice,
 * pixel) that search engines are told not to index and that the sitemap and
 * footer leave out. They say what the home page says, shaped for one ad.
 */
export const UNLISTED_ROUTES = ["start", "quiet"] as const satisfies readonly MarketingRoute[];

export type UnlistedRoute = (typeof UNLISTED_ROUTES)[number];

export type ListedRoute = Exclude<MarketingRoute, UnlistedRoute>;

export function isListedRoute(route: MarketingRoute): route is ListedRoute {
  return !(UNLISTED_ROUTES as readonly MarketingRoute[]).includes(route);
}

/**
 * The written pages: one shared shell, one content module per language
 * (src/content/pages). They carry a publication date and their own JSON-LD,
 * which is what separates them from the home, pricing and legal pages.
 */
export const CONTENT_ROUTES = [
  "crmSpain",
  "crmMarbella",
  "guideIdealista",
  "guideFollowUp",
  "guideAndaluciaRegister",
  "about",
  "toolCommission",
  "toolSpreadsheet",
  "toolEarnings",
  "tools",
] as const satisfies readonly MarketingRoute[];

export type ContentRoute = (typeof CONTENT_ROUTES)[number];

export function isContentRoute(route: MarketingRoute): route is ContentRoute {
  return (CONTENT_ROUTES as readonly MarketingRoute[]).includes(route);
}

/**
 * The routes that carry a label and a blurb in the `marketing` catalogs, and
 * so can be shown as a footer link or a "keep reading" card. The home page is
 * named in nav.json and the legal pages in nav.legal, which is why neither is
 * here.
 */
export const LINKED_ROUTES = [
  "pricing",
  "crmSpain",
  "crmMarbella",
  "guideIdealista",
  "guideFollowUp",
  "guideAndaluciaRegister",
  "about",
  "toolCommission",
  "toolSpreadsheet",
  "toolEarnings",
  "tools",
] as const satisfies readonly MarketingRoute[];

export type LinkedRoute = (typeof LINKED_ROUTES)[number];

export function isLinkedRoute(route: MarketingRoute): route is LinkedRoute {
  return (LINKED_ROUTES as readonly MarketingRoute[]).includes(route);
}

/**
 * The free tools: written pages whose content module carries an interactive
 * part (MarketingPageContent.tool). The footer's "Free tools" column, the
 * /tools hub and llms.txt list them from here; the hub itself is a plain
 * written page, so it isn't one.
 */
export const TOOL_ROUTES = [
  "toolCommission",
  "toolSpreadsheet",
  "toolEarnings",
] as const satisfies readonly LinkedRoute[];

export type ToolRoute = (typeof TOOL_ROUTES)[number];

export function isToolRoute(route: MarketingRoute): route is ToolRoute {
  return (TOOL_ROUTES as readonly MarketingRoute[]).includes(route);
}

export function marketingPath(route: MarketingRoute, locale: AppLocale): string {
  return MARKETING_ROUTES[route][locale];
}

/** hreflang map for a marketing page: every language, and x-default → English. */
export function marketingAlternates(
  route: MarketingRoute
): Partial<Record<AppLocale | "x-default", string>> {
  const paths = MARKETING_ROUTES[route];
  return { ...paths, "x-default": paths[DEFAULT_LOCALE] };
}

function trimSlash(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

/** The marketing page a URL is, with its language, or null for anything else. */
export function marketingRouteAt(
  pathname: string
): { route: MarketingRoute; locale: AppLocale } | null {
  const clean = trimSlash(pathname);
  for (const route of Object.keys(MARKETING_ROUTES) as MarketingRoute[]) {
    for (const locale of LOCALES) {
      if (MARKETING_ROUTES[route][locale] === clean) return { route, locale };
    }
  }
  return null;
}

/** The same marketing page in another language, or null off the marketing site. */
export function marketingCounterpart(pathname: string, locale: AppLocale): string | null {
  const hit = marketingRouteAt(pathname);
  return hit ? marketingPath(hit.route, locale) : null;
}

/** The language a URL pins by its first segment ("/es/…" → "es"), or null. */
export function pathLocale(pathname: string): AppLocale | null {
  const first = pathname.split("/")[1];
  return first !== DEFAULT_LOCALE && isLocale(first) ? first : null;
}
