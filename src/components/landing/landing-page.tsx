import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthErrorListener } from "@/components/auth-error-listener";
import { MarketingNav } from "@/components/marketing-nav";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { OnePlace } from "@/components/landing/one-place";
import { Workflow } from "@/components/landing/workflow";
import { FeatureDeepDives } from "@/components/landing/feature-deep-dives";
import { AppPreview } from "@/components/landing/app-preview";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";
import { asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES, yearlySavingPct } from "@/lib/billing";
import { cn } from "@/lib/utils";

/**
 * The marketing home page. Rendered at / (English) and /es (Spanish); the
 * proxy pins the language per URL and the page files add metadata + JSON-LD.
 *
 * It reads as chapters: a framed stage for the hero (warm sand by day, dark
 * at night), sections that alternate between the page background and a
 * faint tint, one inverted chapter for pricing, then the footer. Headlines sit in the display face and
 * every chapter opens with a small tracked label rather than a pill.
 */
export function LandingPage() {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav.marketing");
  const locale = asLocale(useLocale());

  return (
    <div className="flex flex-1 flex-col">
      <AuthErrorListener />

      {/* Nav */}
      <MarketingNav />

      {/* Hero — a stage inset from the page edges. The live board below
          straddles its bottom edge, so the stage's bottom padding and the
          board's negative margin are tuned as a pair. No horizontal clip here:
          the board's glow stays inside the gutter on its own. */}
      <section className="px-3 pt-2 sm:px-4 sm:pt-3">
        <div className="bg-stage text-stage-foreground ring-foreground/[0.06] relative mx-auto max-w-[88rem] overflow-hidden rounded-[1.75rem] ring-1 sm:rounded-[2.25rem] sm:shadow-[0_24px_60px_-32px_rgb(0_0_0/0.22)] dark:ring-white/10 dark:sm:shadow-[0_30px_80px_-40px_rgb(0_0_0/0.5)]">
          {/* Backdrop: a faint grid and three warm glows, painted once. Animated
              blur layers here cost iOS Safari so much that the page could
              stall on a slow load and stop receiving scroll updates. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="hero-grid absolute inset-0 [--grid-line:rgb(0_0_0/0.05)] dark:[--grid-line:rgb(255_255_255/0.06)]" />
            <div className="hero-glow absolute inset-0" />
          </div>

          <div className="stagger-enter relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-14 pb-40 text-center sm:pt-24 sm:pb-56">
            <Eyebrow className="dark:text-stage-foreground/60 mb-6 text-[11px] sm:text-xs">
              {t("hero.badge")}
            </Eyebrow>
            <h1 className="display-1 max-w-5xl text-balance">
              {t.rich("hero.title", {
                nowrap: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
                accent: (chunks) => (
                  <em className="block bg-gradient-to-r from-[oklch(0.56_0.14_36)] to-[oklch(0.68_0.15_52)] bg-clip-text text-transparent dark:from-[oklch(0.74_0.13_42)] dark:to-[oklch(0.84_0.1_62)]">
                    {chunks}
                  </em>
                ),
              })}
            </h1>
            {/* Light weight at night only: cream on a dark ground reads a step
                heavier than the same face on sand. */}
            <p className="text-stage-foreground/70 mt-5 max-w-xl text-base text-pretty sm:mt-6 sm:text-lg lg:text-xl dark:font-light dark:text-stage-foreground/65">
              {t("hero.subtitle")}
            </p>
            {/* Stacked and equal-width on phones, side by side from sm. */}
            <div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
              <Button asChild size="pill">
                <Link href="/login">
                  {t("hero.ctaPrimary")} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="pill" variant="stage">
                <Link href="#how-it-works">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>
            <p className="text-stage-foreground/55 mt-5 text-sm">
              {t("hero.note", { limit: FREE_CLIENT_LIMIT })}
            </p>
          </div>
        </div>

        {/* The live board breaks over the stage's bottom edge, arriving a beat
            after the headline. */}
        <div className="relative z-10 mx-auto -mt-32 w-full max-w-6xl px-4 [animation-delay:320ms] animate-[fade-up_0.7s_var(--ease-out-quint)_both] motion-reduce:animate-none sm:-mt-44 sm:px-6">
          <AppPreview />
        </div>
      </section>

      <Testimonials />

      {/* One place — the apps agents juggle today, folded into one card */}
      <section className="section-y pt-0">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow className="mb-4">{t("onePlace.badge")}</Eyebrow>
            <h2 className="display-2 text-balance">{t("onePlace.heading")}</h2>
            <p className="text-muted-foreground mt-4 text-lg text-pretty">
              {t("onePlace.body")}
            </p>
          </Reveal>

          <OnePlace />
        </div>
      </section>

      {/* How it works — the first tinted chapter */}
      <section id="how-it-works" className="section-y bg-muted/50 scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="mb-4">{t("howItWorks.badge")}</Eyebrow>
            <h2 className="display-2 text-balance">{t("howItWorks.heading")}</h2>
            <p className="text-muted-foreground mt-4 text-lg text-pretty">
              {t("howItWorks.body")}
            </p>
          </div>

          <Workflow />
        </div>
      </section>

      {/* Feature deep-dives */}
      <FeatureDeepDives />

      {/* Pricing — the inverted chapter */}
      <section
        id="pricing"
        className="section-y bg-inverted text-inverted-foreground scroll-mt-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal>
            <div className="text-center">
              <Eyebrow className="mb-4">{tNav("pricing")}</Eyebrow>
              <h2 className="display-2 text-balance">{t("pricing.heading")}</h2>
              <p className="text-inverted-foreground/70 mx-auto mt-4 max-w-xl text-lg text-pretty">
                {t("pricing.body")}
              </p>
            </div>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
            <Reveal>
              <PlanCard
                name={t("pricing.free.name")}
                price={t("pricing.free.price")}
                period={t("pricing.free.period")}
                cta={t("pricing.ctaFree")}
                items={[
                  t("pricing.free.limit", { limit: FREE_CLIENT_LIMIT }),
                  t("pricing.free.allFeatures"),
                  t("pricing.free.noCard"),
                ]}
              />
            </Reveal>
            <Reveal delay={100}>
              <PlanCard
                highlighted
                name={t("pricing.pro.name")}
                price={t("pricing.pro.price", {
                  amount: PRICES.standard.monthly,
                })}
                period={t("pricing.pro.period")}
                note={t("pricing.pro.note", {
                  yearly: PRICES.standard.yearly,
                  pct: yearlySavingPct("standard"),
                })}
                cta={t("pricing.ctaPro")}
                items={[
                  t("pricing.pro.unlimited"),
                  t("pricing.pro.everythingFree"),
                  t("pricing.pro.referral"),
                ]}
              />
            </Reveal>
          </div>
          <Reveal>
            <p className="text-inverted-foreground/60 mx-auto mt-8 max-w-xl text-center text-sm">
              {t("pricing.founding", {
                cap: FOUNDING_CAP,
                price: PRICES.founding.monthly,
              })}
            </p>
            <p className="mt-3 text-center text-sm">
              <Link
                href={marketingPath("pricing", locale)}
                className="text-inverted-foreground hover:text-primary font-medium underline underline-offset-4 transition-colors"
              >
                {t("pricing.fullPage")}
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <Faq />

      {/* Final CTA */}
      <section className="section-y">
        <Reveal className="mx-auto w-full max-w-6xl px-4 text-center">
          <h2 className="display-2 text-balance">{t("finalCta.heading")}</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg text-pretty">
            {t("finalCta.body")}
          </p>
          <Button asChild size="pill" className="mt-8">
            <Link href="/login">
              {t("hero.ctaPrimary")} <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </section>

      <LandingFooter />
    </div>
  );
}

/**
 * One plan on the inverted pricing chapter. The highlighted plan is the one
 * light card on the dark surface; the other is frosted glass, so the eye
 * lands on Pro without a badge saying so.
 */
function PlanCard({
  name,
  price,
  period,
  note,
  items,
  cta,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  note?: string;
  items: string[];
  cta: string;
  highlighted?: boolean;
}) {
  const muted = highlighted
    ? "text-muted-foreground"
    : "text-inverted-foreground/60";
  return (
    <div
      className={cn(
        "rounded-2xl p-6 ring-1",
        highlighted
          ? "bg-card text-card-foreground ring-primary/50 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]"
          : "bg-inverted-foreground/5 ring-inverted-foreground/10"
      )}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-5xl leading-none tracking-tight">
          {price}
        </span>
        <span className={cn("text-sm", muted)}>{period}</span>
      </div>
      {note ? <p className={cn("mt-2 text-sm", muted)}>{note}</p> : null}
      <ul className="mt-6 space-y-2.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {/* Buttons never wrap by default, and the Spanish Pro label is wider
          than a phone's card: let it take a second line instead of widening
          both plans past the screen. Sides of 20px keep the English label on
          one line down to 320px. */}
      <Button
        asChild
        size="pill"
        className="mt-7 h-auto min-h-11 w-full px-5 py-2.5 text-center leading-snug text-balance whitespace-normal"
        variant={highlighted ? "default" : "glass"}
      >
        <Link href="/login">{cta}</Link>
      </Button>
    </div>
  );
}
