"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { openBillingPortal } from "@/lib/actions/billing";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import {
  FOUNDING_CAP,
  PRICES,
  yearlySavingPct,
  type BillingInterval,
  type BillingTier,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

export type CurrentPlan = {
  tier: "free" | "pro";
  source: "subscription" | "comp" | null;
  proUntil: string | null;
  planLabel: string | null;
  foundingNumber: number | null;
  /** A Stripe customer exists, so the portal can open. */
  canManage: boolean;
};

const FREE_FEATURES = [
  `Up to ${FREE_CLIENT_LIMIT} clients, buyers and sellers together`,
  "Every feature: pipelines, viewings, offers, calendar, templates, calculator",
  "Free forever, no card",
];

const PRO_FEATURES = [
  "Unlimited clients",
  "Everything in Free",
  "A free month for every agent you refer who subscribes",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const founding = tier === "founding";
  const price = PRICES[tier][interval];
  const standardPrice = PRICES.standard[interval];
  const per = interval === "monthly" ? "month" : "year";
  const link = links[interval];
  const subscribed = current.source === "subscription";
  const comped = current.source === "comp";

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
              {option === "monthly" ? "Monthly" : `Yearly · save ${yearlySavingPct(tier)}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
        {/* Free */}
        <Card className={cn(current.tier === "free" && "border-primary/40")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Free</h2>
              {current.tier === "free" ? <Badge variant="secondary">Your plan</Badge> : null}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">€0</span>
              <span className="text-muted-foreground text-sm">forever</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <FeatureList items={FREE_FEATURES} />
            {current.tier === "free" ? (
              <p className="text-muted-foreground text-sm">
                {clientCount} of {FREE_CLIENT_LIMIT} clients used.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-primary/60 relative shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Pro</h2>
              {current.tier === "pro" ? (
                <Badge>Your plan</Badge>
              ) : founding ? (
                <Badge variant="warning" className="gap-1">
                  <Sparkles className="size-3" />
                  {spotsLeft} of {FOUNDING_CAP} founding spots left
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">€{price}</span>
              {founding ? (
                <span className="text-muted-foreground text-sm line-through">€{standardPrice}</span>
              ) : null}
              <span className="text-muted-foreground text-sm">per {per} + IVA</span>
            </div>
            {founding ? (
              <p className="text-primary mt-1 text-sm font-medium">
                Founding price, locked for life for the first {FOUNDING_CAP} paying agents.
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">
                The founding cohort is full. This is the standard price.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <FeatureList
              items={[
                ...PRO_FEATURES,
                ...(founding ? ["A Founding Agent number, and this price for good"] : []),
              ]}
            />

            {subscribed ? (
              <div className="space-y-3">
                <p className="text-sm">
                  You&apos;re on{" "}
                  <span className="font-medium">{current.planLabel ?? "Pro"}</span>
                  {current.foundingNumber != null ? (
                    <span className="text-primary"> · Founding Agent #{current.foundingNumber}</span>
                  ) : null}
                  .
                </p>
                {current.canManage ? (
                  <form action={openBillingPortal}>
                    <Button type="submit" variant="outline" className="w-full">
                      Manage subscription
                    </Button>
                  </form>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Your subscription is managed by hand for now.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {comped && current.proUntil ? (
                  <p className="text-sm">
                    You&apos;re on Pro until{" "}
                    <span className="font-medium">{formatDate(current.proUntil)}</span>, earned
                    from a referral. Subscribe to keep it going.
                  </p>
                ) : null}
                {link ? (
                  <Button asChild size="lg" className="w-full">
                    <a href={link}>
                      {comped ? "Subscribe" : "Upgrade to Pro"} <ArrowRight />
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" disabled>
                    Checkout coming soon
                  </Button>
                )}
                {unappliedCreditEur > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    €{unappliedCreditEur} in free months is waiting and will come off your invoices
                    once you subscribe.
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        Prices exclude IVA. Yearly plans are billed once a year. Cancel any time from the billing
        portal; your data stays exactly where it is.
      </p>
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
