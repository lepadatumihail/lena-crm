"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { intlTag } from "@/i18n/config";
import { formatCurrency } from "@/lib/crm";
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

export function PricingCards({
  tier,
  spotsLeft,
  links,
  clientCount,
  current,
  unappliedCreditEur,
}: {
  /** The tier a new subscriber gets right now: founding while spots remain. */
  tier: BillingTier;
  spotsLeft: number;
  links: Record<BillingInterval, string | undefined>;
  clientCount: number;
  current: CurrentPlan;
  unappliedCreditEur: number;
}) {
  const t = useTranslations("billing");
  const tag = intlTag(useLocale());
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const founding = tier === "founding";
  const price = PRICES[tier][interval];
  const standardPrice = PRICES.standard[interval];
  const link = links[interval];
  const subscribed = current.source === "subscription";
  const comped = current.source === "comp";
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
        <div className="bg-muted inline-flex rounded-full p-1 text-sm">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setInterval(option)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition-colors",
                interval === option
                  ? "bg-background text-foreground shadow-sm"
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
        {/* Free */}
        <Card className={cn(current.tier === "free" && "border-primary/40")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("pricing.freeTitle")}</h2>
              {current.tier === "free" ? (
                <Badge variant="secondary">{t("pricing.yourPlan")}</Badge>
              ) : null}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{formatCurrency(0, tag)}</span>
              <span className="text-muted-foreground text-sm">{t("pricing.forever")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <FeatureList items={freeFeatures} />
            {current.tier === "free" ? (
              <p className="text-muted-foreground text-sm">
                {t("pricing.clientsUsed", { count: clientCount, limit: FREE_CLIENT_LIMIT })}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-primary/60 relative shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{t("pricing.proTitle")}</h2>
              {current.tier === "pro" ? (
                <Badge>{t("pricing.yourPlan")}</Badge>
              ) : founding ? (
                <Badge variant="warning" className="gap-1">
                  <Sparkles className="size-3" />
                  {t("founding.spots", { count: spotsLeft })}
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">{formatCurrency(price, tag)}</span>
              {founding ? (
                <span className="text-muted-foreground text-sm line-through">{formatCurrency(standardPrice, tag)}</span>
              ) : null}
              <span className="text-muted-foreground text-sm">
                {interval === "monthly" ? t("plan.perMonth") : t("plan.perYear")}
              </span>
            </div>
            {founding ? (
              <p className="text-primary mt-1 text-sm font-medium">
                {t("pricing.foundingLocked", { cap: FOUNDING_CAP })}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">{t("pricing.cohortFull")}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <FeatureList items={proFeatures} />

            {subscribed ? (
              <div className="space-y-3">
                <p className="text-sm">
                  {current.foundingNumber != null
                    ? t.rich("pricing.onPlanFounding", {
                        plan: current.planLabel ?? t("plan.titlePro"),
                        number: current.foundingNumber,
                        b: bold,
                        f: (chunks) => <span className="text-primary">{chunks}</span>,
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
              <div className="space-y-3">
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
                  <Button asChild size="lg" className="w-full">
                    <a href={link}>
                      {comped ? t("pricing.subscribe") : t("actions.upgradeToPro")} <ArrowRight />
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" disabled>
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
          <Check className="text-primary mt-0.5 size-4 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
