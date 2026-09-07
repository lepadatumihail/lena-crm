import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  negotiateLocale,
  type AppLocale,
} from "@/i18n/config";
import { marketingPath, marketingRouteAt, pathLocale } from "@/lib/routes";
import { updateSession } from "@/lib/supabase/middleware";

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

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest, service worker, robots, sitemap, llms.txt, generated OG/Twitter images
     * - static asset file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|llms.txt|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
