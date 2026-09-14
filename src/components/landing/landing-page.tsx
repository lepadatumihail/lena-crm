import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Clock,
  Mail,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { AuthErrorListener } from "@/components/auth-error-listener";
import { MarketingNav } from "@/components/marketing-nav";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureDeepDives } from "@/components/landing/feature-deep-dives";
import { AppPreview } from "@/components/landing/app-preview";
import { OnePlace } from "@/components/landing/one-place";
import { Faq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";
import { BUYER_STAGES } from "@/lib/crm";
import { stageLabel } from "@/i18n/labels";
import { asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES, yearlySavingPct } from "@/lib/billing";
import { cn } from "@/lib/utils";

const BUYER_STEPS = BUYER_STAGES;

/**
 * The marketing home page. Rendered at / (English) and /es (Spanish); the
 * proxy pins the language per URL and the page files add metadata + JSON-LD.
 *
 * It reads as chapters: a framed dark stage for the hero, sections that
 * alternate between the page background and a faint tint, one inverted
 * chapter for pricing, then the footer. Headlines sit in the display face and
 * every chapter opens with a small tracked label rather than a pill.
 */
export function LandingPage() {
  const t = useTranslations("landing");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav.marketing");
  const locale = asLocale(useLocale());

  return (
    <div className="flex flex-1 flex-col">
      <AuthErrorListener />

      {/* Nav */}
      <MarketingNav />

      {/* Hero — a dark stage inset from the page edges. The live board below
          straddles its bottom edge, so the stage's bottom padding and the
          board's negative margin are tuned as a pair. No horizontal clip here:
          the board's glow stays inside the gutter on its own. */}
      <section className="px-3 pt-2 sm:px-4 sm:pt-3">
        <div className="bg-inverted text-inverted-foreground relative mx-auto max-w-[88rem] overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] sm:shadow-[0_30px_80px_-40px_rgb(0_0_0/0.5)]">
          {/* Backdrop: a faint grid and two warm glows, painted once. Animated
              blur layers here cost iOS Safari so much that the page could
              stall on a slow load and stop receiving scroll updates. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="hero-grid absolute inset-0 [--grid-line:rgb(255_255_255/0.06)]" />
            <div className="hero-glow absolute inset-0" />
          </div>

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-14 pb-40 text-center animate-[fade-up_0.7s_ease-out_both] motion-reduce:animate-none sm:pt-24 sm:pb-56">
            <Eyebrow className="text-inverted-foreground/60 mb-6 text-[11px] sm:text-xs">
              {t("hero.badge")}
            </Eyebrow>
            <h1 className="display-1 max-w-4xl text-balance">
              {t.rich("hero.title", {
                accent: (chunks) => (
                  <em className="bg-gradient-to-r from-[oklch(0.74_0.13_42)] to-[oklch(0.84_0.1_62)] bg-clip-text text-transparent">
                    {chunks}
                  </em>
                ),
              })}
            </h1>
            {/* Light weight: cream on a dark ground reads a step heavier than the
                same face on the page, and the regular looked bold on a phone. */}
            <p className="text-inverted-foreground/65 mt-5 max-w-xl text-base font-light text-pretty sm:mt-6 sm:text-lg lg:text-xl">
              {t("hero.subtitle")}
            </p>
            {/* Stacked and equal-width on phones, side by side from sm. */}
            <div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
              <Button asChild size="pill">
                <Link href="/login">
                  {t("hero.ctaPrimary")} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="pill" variant="glass">
                <Link href="#how-it-works">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>
            <p className="text-inverted-foreground/50 mt-5 text-sm">
              {t("hero.note")}
            </p>
          </div>
        </div>

        {/* The live board breaks over the stage's bottom edge */}
        <div className="relative z-10 mx-auto -mt-32 w-full max-w-6xl px-4 sm:-mt-44 sm:px-6">
          <AppPreview />
        </div>
      </section>

      {/* One place — the apps agents juggle today, folded into one card */}
      <section className="section-y">
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

          <HowItWorks />
        </div>
      </section>

      {/* Feature deep-dives */}
      <FeatureDeepDives />

      {/* What you get and the pipeline strip share one tinted chapter */}
      <div className="bg-muted/50">
        <section
          id="features"
          className="section-y mx-auto w-full max-w-6xl scroll-mt-20 px-4"
        >
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow className="mb-4">{t("features.badge")}</Eyebrow>
            <h2 className="display-2 text-balance">{t("features.heading")}</h2>
            <p className="text-muted-foreground mt-4 text-lg text-pretty">
              {t("features.body")}
            </p>
          </Reveal>

          <FeatureGrid />
        </section>

        {/* Pipeline strip */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 text-center sm:pb-24 lg:pb-32">
          <h2 className="display-3 text-balance">{t("pipelineStrip.heading")}</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-pretty">
            {t("pipelineStrip.body")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {BUYER_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="bg-background flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm">
                  <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                    {i + 1}
                  </span>
                  {stageLabel(tCrm, step)}
                </div>
                {i < BUYER_STEPS.length - 1 && (
                  <ArrowRight className="text-muted-foreground/50 size-4" />
                )}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-sm">
            {t("pipelineStrip.note")}
          </p>
        </section>
      </div>

      {/* AI — built in */}
      <section className="section-y">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <Eyebrow className="mb-4">{t("ai.badge")}</Eyebrow>
            <h2 className="display-2 text-balance">
              {t.rich("ai.heading", {
                nowrap: (chunks) => (
                  <span className="whitespace-nowrap">{chunks}</span>
                ),
              })}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg text-pretty">
              {t("ai.body")}
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="bg-card flex h-full flex-col rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <Mail className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("ai.email.title")}</h3>
                </div>
                <p className="text-muted-foreground mt-3 text-sm">
                  {t("ai.email.body")}
                </p>

                <div
                  aria-hidden
                  className="bg-muted/40 mt-5 rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      {t("mock.to", { name: "Sofia Müller" })}
                    </span>
                    <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Sparkles className="size-3" /> {t("mock.aiDraft")}
                    </span>
                  </div>
                  {/* Sample client-facing message: written in the client's own
                      language, so it stays German in every UI language. */}
                  <div className="bg-background text-muted-foreground mt-2 rounded-lg border p-3 text-xs leading-relaxed">
                    <p className="text-foreground">Hallo Sofia,</p>
                    <p className="mt-1">
                      zwei neue Apartments in Nueva Andalucía sind in Ihrem Budget
                      aufgetaucht — beide mit Meerblick. Sollen wir diese Woche
                      eine Besichtigung einplanen?
                    </p>
                    <p className="mt-1">Beste Grüße, María</p>
                  </div>
                  <div className="mt-2 flex justify-end gap-1.5">
                    <span className="rounded-md border px-2 py-1 text-[10px] font-medium">
                      {tCommon("edit")}
                    </span>
                    <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium">
                      <Send className="size-3" /> {tCommon("send")}
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="bg-card flex h-full flex-col rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <Clock className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{t("ai.nudge.title")}</h3>
                </div>
                <p className="text-muted-foreground mt-3 text-sm">
                  {t("ai.nudge.body")}
                </p>

                <div
                  aria-hidden
                  className="bg-muted/40 mt-5 rounded-xl border p-3"
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold">
                      {t("mock.needsNudge")}
                    </span>
                    <span className="bg-warning/20 text-warning rounded-full px-1.5 text-[10px] font-medium">
                      3
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(
                      [
                        { n: "James Carter", s: "qualified", d: 21 },
                        { n: "Lars Nielsen", s: "viewing", d: 16 },
                        { n: "Anya Petrova", s: "qualified", d: 12 },
                      ] as const
                    ).map((r) => (
                      <div
                        key={r.n}
                        className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{r.n}</p>
                          <p className="text-muted-foreground text-[10px]">
                            {stageLabel(tCrm, r.s)} ·{" "}
                            {t("mock.quiet", { days: r.d })}
                          </p>
                        </div>
                        <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium">
                          <Sparkles className="size-3" /> {t("mock.draft")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust strip — closes the AI chapter, right before the inverted one */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 lg:pb-28">
        <div className="grid gap-5 sm:grid-cols-3">
          <TrustItem
            icon={Smartphone}
            title={t("trust.everywhere.title")}
            body={t("trust.everywhere.body")}
          />
          <TrustItem
            icon={ShieldCheck}
            title={t("trust.data.title")}
            body={t("trust.data.body")}
          />
          <TrustItem
            icon={Check}
            title={t("trust.setup.title")}
            body={t("trust.setup.body")}
          />
        </div>
      </section>

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

      {/* Rentals coming soon */}
      <section className="section-y">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal>
            <div className="from-primary/10 to-accent/40 relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border bg-gradient-to-br p-8 text-center sm:p-12">
              <Tag tone="brand">{t("rentals.badge")}</Tag>
              <h2 className="display-3 text-balance">{t("rentals.heading")}</h2>
              <p className="text-muted-foreground max-w-lg text-pretty">
                {t("rentals.body")}
              </p>
            </div>
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

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      </div>
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
      <Button
        asChild
        size="pill"
        className="mt-7 w-full"
        variant={highlighted ? "default" : "glass"}
      >
        <Link href="/login">{cta}</Link>
      </Button>
    </div>
  );
}
