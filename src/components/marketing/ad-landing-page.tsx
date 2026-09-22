import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, FileSpreadsheet, MessageCircle, UserRound } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing-nav";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { AppPreview } from "@/components/landing/app-preview";
import { LandingFooter } from "@/components/landing/footer";

/** Head tags for the ad landing: the usual canonical and hreflang, but search engines are told not to index it. */
export async function adLandingMetadata(locale: AppLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "marketing.start" });
  const base = await marketingMetadata("start", locale, {
    title: t("metaTitle"),
    description: t("metaDescription", { limit: FREE_CLIENT_LIMIT }),
  });
  return { ...base, robots: { index: false, follow: true } };
}

/**
 * Where the Facebook ad lands. The ad asks "still tracking clients in a
 * spreadsheet?", so the page answers exactly that and nothing else: one
 * headline in the same words, the live app board, three steps that start
 * with the spreadsheet import, one action repeated at the end. The nav is
 * the minimal one, so the only way forward is the button. Same stage and
 * type as the home page, so it reads as the same product.
 */
export async function AdLandingPage({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: "marketing.start" });
  const steps = ["signIn", "upload", "followUp"] as const;
  const changes = [
    { key: "card", icon: UserRound },
    { key: "drafts", icon: MessageCircle },
    { key: "yours", icon: FileSpreadsheet },
  ] as const;

  return (
    <div className="flex flex-1 flex-col">
      <MarketingNav variant="minimal" />

      <section className="px-3 pt-2 sm:px-4 sm:pt-3">
        <div className="bg-stage text-stage-foreground ring-foreground/[0.06] relative mx-auto max-w-[88rem] overflow-hidden rounded-[1.75rem] ring-1 sm:rounded-[2.25rem] sm:shadow-[0_24px_60px_-32px_rgb(0_0_0/0.22)] dark:ring-white/10 dark:sm:shadow-[0_30px_80px_-40px_rgb(0_0_0/0.5)]">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="hero-grid absolute inset-0 [--grid-line:rgb(0_0_0/0.05)] dark:[--grid-line:rgb(255_255_255/0.06)]" />
            <div className="hero-glow absolute inset-0" />
          </div>

          <div className="stagger-enter relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-12 pb-40 text-center sm:pt-20 sm:pb-56">
            <Eyebrow className="dark:text-stage-foreground/60 mb-6 text-[11px] sm:text-xs">
              {t("eyebrow")}
            </Eyebrow>
            <h1 className="display-1 max-w-4xl text-balance">
              {t.rich("title", {
                accent: (chunks) => (
                  <em className="bg-gradient-to-r from-[oklch(0.56_0.14_36)] to-[oklch(0.68_0.15_52)] bg-clip-text text-transparent dark:from-[oklch(0.74_0.13_42)] dark:to-[oklch(0.84_0.1_62)]">
                    {chunks}
                  </em>
                ),
              })}
            </h1>
            <p className="text-stage-foreground/70 mt-5 max-w-xl text-base text-pretty sm:mt-6 sm:text-lg lg:text-xl dark:font-light dark:text-stage-foreground/65">
              {t("subtitle")}
            </p>
            <Button asChild size="pill" className="mt-8 h-auto min-h-11 max-w-full px-6 py-2.5 text-center leading-snug text-balance whitespace-normal sm:mt-9">
              <Link href="/login">
                {t("cta")} <ArrowRight />
              </Link>
            </Button>
            <p className="text-stage-foreground/55 mt-5 max-w-sm text-sm text-pretty">
              {t("note", { limit: FREE_CLIENT_LIMIT })}
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-32 w-full max-w-6xl px-4 [animation-delay:320ms] animate-[fade-up_0.7s_var(--ease-out-quint)_both] motion-reduce:animate-none sm:-mt-44 sm:px-6">
          <AppPreview />
        </div>
      </section>

      {/* Three steps, the import first: that is the promise the ad made. */}
      <section className="section-y">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow className="mb-4">{t("steps.eyebrow")}</Eyebrow>
            <h2 className="display-2 text-balance">{t("steps.heading")}</h2>
          </Reveal>
          <ol className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step} className="bg-card text-card-foreground rounded-2xl border p-6">
                <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-sm font-semibold">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{t(`steps.${step}.title`)}</h3>
                <p className="text-muted-foreground mt-2 text-sm text-pretty">
                  {t(`steps.${step}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-y bg-muted/50">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow className="mb-4">{t("changes.eyebrow")}</Eyebrow>
            <h2 className="display-2 text-balance">{t("changes.heading")}</h2>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
            {changes.map(({ key, icon: Icon }) => (
              <div key={key} className="flex gap-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t(`changes.${key}.title`)}</h3>
                  <p className="text-muted-foreground mt-1 text-sm text-pretty">
                    {t(`changes.${key}.body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <Reveal className="mx-auto w-full max-w-6xl px-4 text-center">
          <h2 className="display-2 mx-auto max-w-3xl text-balance">{t("final.heading")}</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg text-pretty">
            {t("final.body")}
          </p>
          <Button asChild size="pill" className="mt-8 h-auto min-h-11 max-w-full px-6 py-2.5 text-center leading-snug text-balance whitespace-normal">
            <Link href="/login">
              {t("cta")} <ArrowRight />
            </Link>
          </Button>
          <p className="text-muted-foreground mx-auto mt-6 max-w-md text-sm">
            {t("founding", { price: PRICES.founding.monthly, cap: FOUNDING_CAP })}
          </p>
        </Reveal>
      </section>

      <LandingFooter />
    </div>
  );
}
