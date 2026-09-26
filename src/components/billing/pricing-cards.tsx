"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { asLocale, intlTag } from "@/i18n/config";
import { formatCurrency } from "@/lib/crm";
import { marketingPath } from "@/lib/routes";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import {
  FOUNDING_CAP,
  PRICES,
  yearlySavingPct,
  type BillingInterval,
  type BillingTier,
} from "@/lib/billing";
import { formatBillingDate } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export type CurrentPlan = {
  tier: "free" | "pro";
  source: "subscription" | "comp" | "admin" | null;
  proUntil: string | null;
  planLabel: string | null;
  foundingNumber: number | null;
};

// The full-width pill actions. A button keeps its label on one line, so the
// Spanish Pro label widened both cards past a phone screen; these let a long
// label take a second line instead, and one that fits renders as before.
// Beside an arrow the sides drop to 16px, which keeps that label on one line
// in the desktop card.
const PILL_ACTION =
  "h-auto min-h-11 w-full px-5 py-2.5 text-center leading-snug text-balance whitespace-normal has-[>svg]:px-4";

export function PricingCards({
  tier,
  spotsLeft,
  links,
  clientCount = 0,
  current,
  unappliedCreditEur = 0,
}: {
  /** The tier a new subscriber gets right now: founding while spots remain. */
  tier: BillingTier;
  spotsLeft: number;
  /** Checkout links, one per interval. Absent for a visitor who has to sign in first. */
  links?: Partial<Record<BillingInterval, string | undefined>>;
  clientCount?: number;
  /** The signed-in agent's plan, or null on the public pricing page. */
  current: CurrentPlan | null;
  unappliedCreditEur?: number;
}) {
  const t = useTranslations("billing");
  const locale = asLocale(useLocale());
  const tag = intlTag(locale);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const founding = tier === "founding";
  const price = PRICES[tier][interval];
  const standardPrice = PRICES.standard[interval];
  const link = links?.[interval];
  const subscribed = current?.source === "subscription";
  const comped = current?.source === "comp";
  // Anonymous: everything starts with signing in. Coming back to this page
  // after it keeps the visitor where they were reading, in their language.
  const signInToUpgrade = `/login?next=${encodeURIComponent(marketingPath("pricing", locale))}`;
  const bold = (chunks: React.ReactNode) => <span className="font-medium">{chunks}</span>;

  const freeFeatures = [
    t("pricing.freeFeatures.clients", { limit: FREE_CLIENT_LIMIT }),
    t("pricing.freeFeatures.everything"),
    t("pricing.freeFeatures.noCard"),
  ];
  const proFeatures = [
    t("pricing.proFeatures.unlimited"),
    t("pricing.proFeatures.everythingInFree"),
    t("pricing.proFeatures.referral"),
    ...(founding ? [t("pricing.proFeatures.founding")] : []),
  ];

  return (
    <div className="mt-10">
      <div className="flex justify-center">
        <div className="bg-muted inline-flex rounded-lg p-1 text-sm">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={interval === option}
              onClick={() => setInterval(option)}
              className={cn(
                "rounded-md px-4 py-1.5 transition-colors",
                interval === option
                  ? "bg-background text-foreground font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "monthly"
                ? t("pricing.monthly")
                : t("pricing.yearlySave", { pct: yearlySavingPct(tier) })}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
        {/* Free: its "Your plan" tag marks it, so the edge stays Pro's. */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t("pricing.freeTitle")}</h2>
              {current?.tier === "free" ? (
                <Tag>{t("pricing.yourPlan")}</Tag>
              ) : null}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-5xl leading-none tracking-tight">{formatCurrency(0, tag)}</span>
              <span className="text-muted-foreground text-sm">{t("pricing.forever")}</span>
            </div>
          </CardHeader>
          {/* The action sits on the card's floor, so the two plans' buttons
              line up however long either feature list runs. */}
          <CardContent className="flex flex-1 flex-col gap-5">
            <FeatureList items={freeFeatures} />
            {current === null ? (
              <Button asChild size="pill" variant="outline" className={cn(PILL_ACTION, "mt-auto")}>
                <Link href="/login">{t("pricing.ctaFree")}</Link>
              </Button>
            ) : current.tier === "free" ? (
              <p className="text-muted-foreground mt-auto text-sm">
                {t("pricing.clientsUsed", { count: clientCount, limit: FREE_CLIENT_LIMIT })}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Pro */}
        {/* The plan to pick stands out by its edge and its ink button, not a colour. */}
        <Card className="border-foreground/25 relative">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-medium">{t("pricing.proTitle")}</h2>
              {current?.tier === "pro" ? (
                <Tag>{t("pricing.yourPlan")}</Tag>
              ) : founding ? (
                <Tag tone="blue">
                  <Sparkles />
                  {t("founding.spots", { count: spotsLeft })}
                </Tag>
              ) : null}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-5xl leading-none tracking-tight">{formatCurrency(price, tag)}</span>
              {founding ? (
                <span className="text-muted-foreground text-sm line-through">{formatCurrency(standardPrice, tag)}</span>
              ) : null}
              <span className="text-muted-foreground text-sm">
                {interval === "monthly" ? t("plan.perMonth") : t("plan.perYear")}
              </span>
            </div>
            {founding ? (
              <p className="text-foreground mt-1 text-sm">
                {t("pricing.foundingLocked", { cap: FOUNDING_CAP })}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">{t("pricing.cohortFull")}</p>
            )}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-5">
            <FeatureList items={proFeatures} />

            {current === null ? (
              <Button asChild size="pill" className={cn(PILL_ACTION, "mt-auto")}>
                <Link href={signInToUpgrade}>
                  {t("pricing.ctaPro")} <ArrowRight />
                </Link>
              </Button>
            ) : subscribed ? (
              <div className="mt-auto space-y-3">
                <p className="text-sm">
                  {current.foundingNumber != null
                    ? t.rich("pricing.onPlanFounding", {
                        plan: current.planLabel ?? t("plan.titlePro"),
                        number: current.foundingNumber,
                        b: bold,
                        f: bold,
                      })
                    : t.rich("pricing.onPlan", {
                        plan: current.planLabel ?? t("plan.titlePro"),
                        b: bold,
                      })}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/billing">
                    {t("actions.manageSubscription")} <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-auto space-y-3">
                {comped && current.proUntil ? (
                  <p className="text-sm">
                    {t.rich("pricing.compedUntil", {
                      date: formatBillingDate(current.proUntil, tag) ?? "",
                      b: bold,
                    })}
                  </p>
                ) : current.source === "admin" ? (
                  <p className="text-sm">{t("pricing.adminNote")}</p>
                ) : null}
                {link ? (
                  <Button asChild size="pill" className={PILL_ACTION}>
                    <a href={link}>
                      {comped ? t("pricing.subscribe") : t("actions.upgradeToPro")} <ArrowRight />
                    </a>
                  </Button>
                ) : (
                  <Button size="pill" className={PILL_ACTION} disabled>
                    {t("pricing.checkoutSoon")}
                  </Button>
                )}
                {unappliedCreditEur > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    {t("pricing.creditWaiting", { amount: unappliedCreditEur })}
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">{t("pricing.footer")}</p>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="text-foreground mt-0.5 size-4 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
