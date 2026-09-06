import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Clock,
  Mail,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthErrorListener } from "@/components/auth-error-listener";
import { MarketingNav } from "@/components/marketing-nav";
import { Reveal } from "@/components/reveal";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureDeepDives } from "@/components/landing/feature-deep-dives";
import { AppPreview } from "@/components/landing/app-preview";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { BUYER_STAGES } from "@/lib/crm";
import { stageLabel } from "@/i18n/labels";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES, yearlySavingPct } from "@/lib/billing";
import { Logo } from "@/components/brand/logo";

const BUYER_STEPS = BUYER_STAGES;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Structured data for the marketing page: who we are and what the product is.
// Kept in English on purpose — search engines index the canonical copy.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      slogan: SITE_TAGLINE,
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Pro monthly",
          price: String(PRICES.standard.monthly),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Pro yearly",
          price: String(PRICES.standard.yearly),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function Home() {
  const t = useTranslations("landing");
  const tSite = useTranslations("site");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-1 flex-col">
      <AuthErrorListener />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Backdrop: faint grid + slowly drifting aurora glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="bg-primary/10 absolute -top-32 left-1/2 size-[30rem] max-w-full -translate-x-1/2 animate-[aurora_18s_ease-in-out_infinite] rounded-full blur-[130px]" />
          <div className="bg-warning/10 absolute -top-10 left-[15%] size-56 animate-[aurora_24s_ease-in-out_infinite] rounded-full blur-[120px] [animation-delay:-8s]" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 pb-12 text-center animate-[fade-up_0.7s_ease-out_both] motion-reduce:animate-none sm:pt-24">
          <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5" />
            {t("hero.badge")}
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {t.rich("hero.title", {
              accent: (chunks) => (
                <span className="from-primary bg-gradient-to-r to-[oklch(0.66_0.12_46)] bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
            {tSite("description")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                {t("hero.ctaPrimary")} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">{t("hero.ctaSecondary")}</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">{t("hero.note")}</p>

          <AppPreview />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("features.heading")}
          </h2>
          <p className="text-muted-foreground mt-3">{t("features.body")}</p>
        </div>

        <FeatureGrid />
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t("howItWorks.badge")}
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("howItWorks.heading")}
          </h2>
          <p className="text-muted-foreground mt-3">{t("howItWorks.body")}</p>
        </div>

        <HowItWorks />
      </section>

      {/* Feature deep-dives */}
      <FeatureDeepDives />

      {/* Pipeline strip */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("pipelineStrip.heading")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
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
        </div>
      </section>

      {/* Anti-bloat / refreshingly simple */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t("simple.badge")}
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("simple.heading")}
          </h2>
          <p className="text-muted-foreground mt-3">{t("simple.body")}</p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="bg-card h-full rounded-2xl border p-6">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {t("simple.leftOutTitle")}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {(
                  [
                    "idx",
                    "dialers",
                    "leaderboards",
                    "marketplaces",
                    "dashboards",
                    "perSeat",
                  ] as const
                ).map((key) => (
                  <li
                    key={key}
                    className="text-muted-foreground flex items-center gap-2.5 text-sm"
                  >
                    <X className="text-muted-foreground/50 size-4 shrink-0" />
                    <span className="decoration-muted-foreground/40 line-through">
                      {t(`simple.leftOut.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="bg-card border-primary/30 h-full rounded-2xl border p-6 shadow-sm">
              <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                {t("simple.includedTitle")}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {(
                  [
                    "pipeline",
                    "followUps",
                    "properties",
                    "documents",
                    "installable",
                    "agencies",
                  ] as const
                ).map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-2.5 text-sm font-medium"
                  >
                    <Check className="text-primary size-4 shrink-0" />
                    {t(`simple.included.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <p className="text-muted-foreground mt-8 text-center text-sm">
            {t("simple.note")}
          </p>
        </Reveal>
      </section>

      {/* AI — built in */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Reveal className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="size-3.5" /> {t("ai.badge")}
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t.rich("ai.heading", {
              nowrap: (chunks) => (
                <span className="whitespace-nowrap">{chunks}</span>
              ),
            })}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
            {t("ai.body")}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
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
      </section>

      {/* Trust strip */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
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

      {/* Pricing */}
      <section id="pricing" className="bg-muted/40 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <Reveal>
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                {t("pricing.heading")}
              </h2>
              <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
                {t("pricing.body")}
              </p>
            </div>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
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
            <p className="text-muted-foreground mx-auto mt-8 max-w-xl text-center text-sm">
              {t("pricing.founding", {
                cap: FOUNDING_CAP,
                price: PRICES.founding.monthly,
              })}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Rentals coming soon */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <Reveal>
          <div className="from-primary/10 to-accent/40 relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br p-8 text-center sm:p-12">
            <Badge className="gap-1.5">{t("rentals.badge")}</Badge>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("rentals.heading")}
            </h2>
            <p className="text-muted-foreground max-w-lg">{t("rentals.body")}</p>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("finalCta.heading")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md">
            {t("finalCta.body")}
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/login">
              {t("hero.ctaPrimary")} <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo markClassName="size-5" wordmarkClassName="text-foreground font-medium" />
            <span>— {tSite("tagline")}</span>
          </div>
          <span>© {new Date().getFullYear()} LeadWing</span>
        </div>
      </footer>
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
  return (
    <div
      className={
        highlighted
          ? "bg-card border-primary/60 rounded-2xl border p-6 shadow-md"
          : "bg-card rounded-2xl border p-6 shadow-sm"
      }
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        <span className="text-muted-foreground text-sm">{period}</span>
      </div>
      {note ? <p className="text-muted-foreground mt-1 text-sm">{note}</p> : null}
      <ul className="mt-5 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-6 w-full" variant={highlighted ? "default" : "outline"}>
        <Link href="/login">{cta}</Link>
      </Button>
    </div>
  );
}
