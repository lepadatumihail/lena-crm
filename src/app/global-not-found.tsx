import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { SITE_NAME } from "@/lib/site";

import "./globals.css";

/**
 * The 404 for URLs that match no route at all (enabled by
 * `experimental.globalNotFound` in next.config.ts).
 *
 * Next serves this at the routing level and skips the layout tree, so two
 * things hold that a plain not-found.tsx cannot guarantee: nothing streams,
 * which means the response is always a real 404 rather than a 200 carrying
 * the app shell, and the body stays small — a few hundred bytes of markup
 * instead of the whole client bundle's payload.
 *
 * The body doubles as a signpost for crawlers and AI agents that land on a
 * dead link: heading, one line, and the canonical entry points (home, the
 * sitemap, llms.txt). Anything that reads the page as text gets a short,
 * useful answer instead of a wall of app shell.
 *
 * `not-found.tsx` still handles `notFound()` thrown inside a route segment
 * (a client id that doesn't exist, say), where the app chrome belongs.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.notFound");
  // Layouts are skipped here, so the root layout's title template does not
  // apply and the title has to name the site itself.
  return {
    title: `404 — ${t("title")} · ${SITE_NAME}`,
    robots: { index: false, follow: false },
  };
}

const LINKS = [
  { href: "/", key: "home" },
  { href: "/sitemap.xml", key: "sitemap" },
  { href: "/llms.txt", key: "llms" },
] as const;

export default async function GlobalNotFound() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("landing.notFound"),
  ]);

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full">
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
          <div>
            <p className="text-muted-foreground text-sm">404</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">{t("body")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">{t("links")}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {LINKS.map(({ href, key }) => (
                <li key={href}>
                  <a
                    className="text-foreground decoration-foreground/25 hover:decoration-foreground font-medium underline underline-offset-4"
                    href={href}
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </body>
    </html>
  );
}
