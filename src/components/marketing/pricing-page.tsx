import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeftRight,
  ArrowRight,
  BellRing,
  CalendarDays,
  ClipboardPaste,
  Columns3,
  Crown,
  FileText,
  Gift,
  Handshake,
  Languages,
  LayoutTemplate,
  Repeat,
  Sparkles,
  Tags,
  Target,
  Users,
} from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { FREE_CLIENT_LIMIT, planState } from "@/lib/access";
import {
  FOUNDING_CAP,
  PRICES,
  checkoutUrl,
  currentTier,
  foundingSpotsLeft,
  paymentLink,
  planName,
  type BillingInterval,
} from "@/lib/billing";
import { faqEntries, type FaqKey } from "@/lib/faq";
import { getFounderCount } from "@/lib/referrals/engine";
import { PRICING_META, marketingMetadata } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/tag";
import type { Tone } from "@/lib/tones";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing-nav";
import { Reveal } from "@/components/reveal";
import { LandingFooter } from "@/components/landing/footer";
import { PricingCards, type CurrentPlan } from "@/components/billing/pricing-cards";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { FAQ_CARD, FaqList } from "@/components/marketing/faq-list";

/** Head tags for the pricing page in one language; the page files call this. */
export async function pricingMetadata(locale: AppLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "billing.pricingPage" });
  return marketingMetadata("pricing", locale, {
    title: t("meta.title", PRICING_META),
    description: t("meta.description", PRICING_META),
  });
}

/** Every feature, in the order the tiles read best. Icons only decorate. */
const FEATURES = [
  { key: "pipeline", icon: Columns3 },
  { key: "clients", icon: Users },
  { key: "viewings", icon: CalendarDays },
  { key: "documents", icon: FileText },
  { key: "agencies", icon: Tags },
  { key: "ai", icon: Sparkles },
  { key: "autoEngage", icon: BellRing },
  { key: "matching", icon: Target },
  { key: "portals", icon: ClipboardPaste },
  { key: "calendar", icon: Repeat },
  { key: "tools", icon: LayoutTemplate },
  { key: "transfer", icon: ArrowLeftRight },
  { key: "app", icon: Languages },
] as const;

/** The landing FAQ entries that are about money, in the order they answer. */
const PRICING_FAQ: readonly FaqKey[] = ["free", "price", "card", "cancel", "agencies"];

/**
 * How many agents already hold a founding number. It decides the price every
 * card on this page shows, so an anonymous visitor sees the same offer a
 * signed-in agent does. The page is public: if the service key or the
 * database is unavailable it must still render, and falling back to a full
 * cohort shows the standard price rather than promising a spot we cannot
 * confirm.
 */
async function publicFounderCount(): Promise<number> {
  try {
    return await getFounderCount(createAdminClient());
  } catch {
    return FOUNDING_CAP;
  }
}

/**
 * The public pricing page, rendered at /pricing and /es/precios.
 *
 * It is a marketing page first: anyone can read it, and it is indexable. For
 * a signed-in agent it also personalises — their current plan, their client
 * count and their own Stripe Payment Links — so the same URL serves both the
 * visitor deciding and the agent upgrading.
 */
export async function PricingPage({ locale }: { locale: AppLocale }) {
  const [t, tBilling, tNav, tFaq, supabase] = await Promise.all([
    getTranslations({ locale, namespace: "billing.pricingPage" }),
    getTranslations({ locale, namespace: "billing" }),
    getTranslations({ locale, namespace: "nav.marketing" }),
    getTranslations({ locale, namespace: "landing.faq" }),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous visitors skip every per-agent query; the founder count is
  // public, because the founding badge is part of the offer.
  const [founderCount, agent] = await Promise.all([
    publicFounderCount(),
    user
      ? Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase.from("referral_credits").select("kind, amount_eur, applied_to_stripe"),
        ])
      : null,
  ]);

  const tier = currentTier(founderCount);
  const spotsLeft = foundingSpotsLeft(founderCount);
  const founding = tier === "founding";

  let current: CurrentPlan | null = null;
  let links: Partial<Record<BillingInterval, string | undefined>> | undefined;
  let clientCount = 0;
  let unappliedCreditEur = 0;

  if (user && agent) {
    const [{ data: profile }, { count }, { data: credits }] = agent;
    const state = planState(profile);
    current = {
      tier: state.tier,
      source: state.source,
      proUntil: state.proUntil,
      planLabel: profile?.plan ? planName(tBilling, profile.plan) : null,
      foundingNumber: profile?.founding_number ?? null,
    };
    links = {
      monthly: checkoutUrl(paymentLink(tier, "monthly"), user.id, user.email),
      yearly: checkoutUrl(paymentLink(tier, "yearly"), user.id, user.email),
    };
    clientCount = count ?? 0;
    unappliedCreditEur = (credits ?? [])
      .filter((c) => c.kind === "stripe_balance" && !c.applied_to_stripe)
      .reduce((acc, c) => acc + Number(c.amount_eur), 0);
  }

  const faq = faqEntries(tFaq).filter((entry) => PRICING_FAQ.includes(entry.key));
  const ctaHref = user ? "/home" : "/login";

  return (
    <div className="flex flex-1 flex-col">
      <MarketingNav variant="page" signedIn={Boolean(user)} />

      {/* Hero + the two plans */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 sm:pt-20">
        <div className="text-center">
          <Eyebrow className="mb-5">{t("eyebrow")}</Eyebrow>
          <h1 className="display-1 mx-auto max-w-3xl text-balance">
            {t("heading")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg text-pretty">
            {t("subheading")}
          </p>
        </div>

        <PricingCards
          tier={tier}
          spotsLeft={spotsLeft}
          links={links}
          clientCount={clientCount}
          current={current}
          unappliedCreditEur={unappliedCreditEur}
        />
      </section>

      {/* Every feature, on both plans */}
      <section className="bg-muted/50">
        <div className="mx-auto w-full max-w-6xl section-y px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="display-2 text-balance">
              {t("features.heading")}
            </h2>
            <p className="text-muted-foreground mt-3 text-pretty">{t("features.body")}</p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon }, i) => (
              <Reveal key={key} delay={(i % 3) * 80}>
                <div className="bg-card h-full rounded-2xl border p-5 shadow-sm">
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-3 font-semibold">{t(`features.${key}.title`)}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {t(`features.${key}.body`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The three things agents ask about the plans */}
      <section className="mx-auto w-full max-w-6xl section-y px-4">
        <div className="grid gap-5 lg:grid-cols-3">
          <Reveal>
            <Explainer
              icon={Crown}
              title={t("explainers.founding.title")}
              body={t("explainers.founding.body", {
                cap: FOUNDING_CAP,
                price: PRICES.founding.monthly,
                standard: PRICES.standard.monthly,
              })}
              badge={
                founding
                  ? tBilling("founding.spots", { count: spotsLeft })
                  : tBilling("pricing.cohortFull")
              }
              badgeTone={founding ? "brand" : "neutral"}
            />
          </Reveal>
          <Reveal delay={80}>
            <Explainer
              icon={Gift}
              title={t("explainers.referrals.title")}
              body={t("explainers.referrals.body")}
            />
          </Reveal>
          <Reveal delay={160}>
            <Explainer
              icon={Handshake}
              title={t("explainers.cancel.title")}
              body={t("explainers.cancel.body", { limit: FREE_CLIENT_LIMIT })}
            />
          </Reveal>
        </div>
      </section>

      {/* FAQ — the money questions from the landing page's list */}
      <section id="faq" className="bg-muted/50">
        <div className="mx-auto w-full max-w-6xl scroll-mt-20 section-y px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="display-2 text-balance">
              {t("faqHeading")}
            </h2>
          </Reveal>
          <Reveal className={cn("mx-auto mt-10 max-w-3xl", FAQ_CARD)}>
            <FaqList entries={faq} />
          </Reveal>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto w-full max-w-6xl section-y px-4">
        <Reveal>
          <div className="from-primary/10 to-accent/40 flex flex-col items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br p-8 text-center sm:p-12">
            <h2 className="display-3 text-balance">
              {t("cta.heading")}
            </h2>
            <p className="text-muted-foreground max-w-lg text-pretty">{t("cta.body")}</p>
            <Button asChild size="pill" className="mt-2">
              <Link href={ctaHref}>
                {user ? tNav("backToApp") : t("cta.primary")} <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <LandingFooter />
    </div>
  );
}

function Explainer({
  icon: Icon,
  title,
  body,
  badge,
  badgeTone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  badge?: string;
  badgeTone?: Tone;
}) {
  return (
    <div className="bg-card flex h-full flex-col rounded-2xl border p-6 shadow-sm">
      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
      {badge ? (
        <Tag tone={badgeTone} className="mt-4 w-fit">
          {badge}
        </Tag>
      ) : null}
    </div>
  );
}
