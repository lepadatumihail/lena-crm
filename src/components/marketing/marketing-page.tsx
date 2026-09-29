import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { intlTag, type AppLocale } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import type { MarketingPageContent } from "@/lib/marketing";
import { isLinkedRoute, marketingPath, type MarketingRoute } from "@/lib/routes";
import { marketingMetadata, pageJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { MarketingNav } from "@/components/marketing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { FAQ_CARD, FaqList } from "@/components/marketing/faq-list";
import { Prose } from "@/components/marketing/prose";
import { SignUpDialog } from "@/components/marketing/sign-up-dialog";
import { ToolViewBeacon } from "@/components/marketing/tool-view-beacon";

export type { MarketingFaq, MarketingPageContent } from "@/lib/marketing";

/**
 * Head tags for a written page in one language. The content module owns the
 * title and description; everything else (canonical, hreflang, Open Graph)
 * comes from the route, exactly as it does for the home and legal pages.
 */
export async function marketingPageMetadata(
  route: MarketingRoute,
  locale: AppLocale,
  content: MarketingPageContent
): Promise<Metadata> {
  return marketingMetadata(route, locale, {
    title: content.title,
    description: content.description,
  });
}

/**
 * The shell every written page shares: nav, header, the article itself, its
 * FAQ, what to read next, a closing call to action and the footer. The page
 * files are one-liners around this; everything that differs between pages
 * lives in the content module.
 *
 * A tool page (content.tool) puts the tool straight under the header, outside
 * the prose styles, and drops the header's buttons so a phone shows the first
 * input without scrolling; its closing call to action signs up in a dialog,
 * so the new profile records the tool as its landing page.
 */
export async function MarketingPage({
  route,
  locale,
  content,
}: {
  route: MarketingRoute;
  locale: AppLocale;
  content: MarketingPageContent;
}) {
  const [t, jsonLd] = await Promise.all([
    getTranslations({ locale, namespace: "marketing" }),
    pageJsonLd(route, locale, content),
  ]);

  const updated = new Intl.DateTimeFormat(intlTag(locale), {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(content.modified ?? content.published));

  const pricing = marketingPath("pricing", locale);
  // Only routes the marketing catalog can name become cards; anything else a
  // content module lists is dropped rather than rendered as a missing key.
  const related = content.related.filter(isLinkedRoute).filter((r) => r !== route);
  const faq = content.faq.map(({ q, a }, i) => ({ key: `${i}`, question: q, answer: a }));
  const { Body } = content;
  const Tool = content.tool?.Component;

  const article = (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12">
      <Prose>
        <Body />
      </Prose>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={jsonLd} />
      <MarketingNav variant="page" />

      <main className="flex-1">
        <header className="mx-auto w-full max-w-3xl px-4 pt-12 pb-8 sm:pt-16">
          <Eyebrow className="mb-4">{content.eyebrow}</Eyebrow>
          <h1 className="display-2 text-balance">
            {content.heading}
          </h1>
          <p className="text-muted-foreground mt-5 text-lg text-pretty">{content.lead}</p>
          <p className="text-muted-foreground mt-4 text-sm">
            {t("article.updated", { date: updated })}
          </p>
          {Tool ? null : (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="pill">
                <Link href="/login">
                  {t("cta.primary")} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="pill" variant="outline">
                <Link href={pricing}>{t("cta.secondary")}</Link>
              </Button>
            </div>
          )}
        </header>

        {/* The tool shares the article's slot, so every other page keeps the
            exact tree it had (React's generated ids depend on it). */}
        {Tool ? (
          <>
            <section aria-label={content.heading} className="mx-auto w-full max-w-3xl px-4 pb-12">
              <ToolViewBeacon />
              <Tool />
            </section>
            {article}
          </>
        ) : (
          article
        )}

        {faq.length > 0 ? (
          <section id="faq" className="bg-muted/50">
            <div className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-16">
              <h2 className="display-3 text-balance">
                {t("faq.heading")}
              </h2>
              <div className={cn("mt-8", FAQ_CARD)}>
                <FaqList entries={faq} />
              </div>
            </div>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mx-auto w-full max-w-6xl px-4 py-16">
            <h2 className="display-3 text-balance">
              {t("related.heading")}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r}
                  href={marketingPath(r, locale)}
                  className="bg-card hover:bg-muted/40 group flex h-full flex-col rounded-2xl border p-6 shadow-xs transition-colors"
                >
                  <h3 className="font-medium">
                    {t(`routes.${r}.label`)}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {t(`routes.${r}.blurb`)}
                  </p>
                  <ArrowRight
                    className="text-muted-foreground group-hover:text-foreground mt-4 size-4 transition-[color,translate] duration-150 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto w-full max-w-6xl px-4 pb-20">
          <div className="bg-muted/50 flex flex-col items-center gap-3 overflow-hidden rounded-2xl border p-8 text-center sm:p-12">
            <h2 className="display-3 text-balance">
              {t("cta.heading")}
            </h2>
            <p className="text-muted-foreground max-w-lg text-pretty">
              {t("cta.body", { limit: FREE_CLIENT_LIMIT })}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              {Tool ? (
                <SignUpDialog>
                  {t("cta.primary")} <ArrowRight />
                </SignUpDialog>
              ) : (
                <Button asChild size="pill">
                  <Link href="/login">
                    {t("cta.primary")} <ArrowRight />
                  </Link>
                </Button>
              )}
              <Button asChild size="pill" variant="outline">
                <Link href={pricing}>{t("cta.secondary")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
