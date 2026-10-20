import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  negotiateLocale,
  type AppLocale,
} from "@/i18n/config";
import { markdownRoute, prefersMarkdown } from "@/lib/markdown";
import { marketingPath, marketingRouteAt, pathLocale } from "@/lib/routes";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * RFC 8288 Link header for the home page, so an agent that reads only the
 * response headers still finds the plain-text brief. `describedby` is the
 * relation that fits: there is no public API, so api-catalog or service-desc
 * would advertise something that doesn't exist. `type` is what llms.txt serves.
 */
const AGENT_LINK = '</llms.txt>; rel="describedby"; type="text/plain"';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The language header is ours alone: never trust one a client sent.
  request.headers.delete(LOCALE_HEADER);

  const page = marketingRouteAt(pathname);
  if (page) {
    // Marketing pages have one URL per language, and the URL is the source
    // of truth: /es is always Spanish, whatever the cookie says. Only the
    // English URLs (the defaults) forward a visitor to the language they
    // chose earlier (cookie) or, failing that, the one their browser prefers.
    // Crawlers send neither and see exactly the URL they asked for.
    if (page.locale === DEFAULT_LOCALE) {
      const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
      const preferred: AppLocale | null = isLocale(fromCookie)
        ? fromCookie
        : negotiateLocale(request.headers.get("accept-language"));
      if (preferred && preferred !== DEFAULT_LOCALE) {
        const url = request.nextUrl.clone();
        url.pathname = marketingPath(page.route, preferred);
        return NextResponse.redirect(url, 307);
      }
    }
    request.headers.set(LOCALE_HEADER, page.locale);
  } else {
    // Anything else under /es (a 404, say) still renders in Spanish.
    const pinned = pathLocale(pathname);
    if (pinned) request.headers.set(LOCALE_HEADER, pinned);
  }

  // An agent asking for a marketing page as markdown gets the markdown route,
  // which converts that page's own HTML (src/app/markdown).
  const response =
    page && prefersMarkdown(request.headers.get("accept"))
      ? NextResponse.rewrite(
          new URL(markdownRoute(marketingPath(page.route, page.locale)), request.url)
        )
      : await updateSession(request);
  // React's font preloads are appended to this same header during render
  // (vercel/next.js#73431), so both reach the client.
  if (page?.route === "home") response.headers.append("Link", AGENT_LINK);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest, service worker, robots, sitemap, llms.txt, generated OG/Twitter images
     * - static asset file extensions (images, the film on the ad landings, and
     *   plain text such as the IndexNow key file)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|llms.txt|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|txt)$).*)",
  ],
};
