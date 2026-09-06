import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFounderCount } from "@/lib/referrals/engine";
import { planState } from "@/lib/access";
import {
  checkoutUrl,
  currentTier,
  foundingSpotsLeft,
  paymentLink,
  planName,
} from "@/lib/billing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/billing/pricing-cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return {
    title: t("meta.pricingTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Plans page for signed-in agents. Lives OUTSIDE the (app) group: it is the
 * destination of the client-cap prompt and needs the user's id to tag the
 * Payment Links. Stripe's post-checkout redirect may still land here; it is
 * forwarded to /billing, where the subscription details live.
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const [{ upgraded }, supabase, t] = await Promise.all([
    searchParams,
    createClient(),
    getTranslations("billing"),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fpricing");
  if (upgraded === "1") redirect("/billing?upgraded=1");

  const [{ data: profile }, { count: clientCount }, { data: credits }, founderCount] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("referral_credits").select("kind, amount_eur, applied_to_stripe"),
      getFounderCount(createAdminClient()),
    ]);

  const state = planState(profile);
  const tier = currentTier(founderCount);
  const links = {
    monthly: checkoutUrl(paymentLink(tier, "monthly"), user.id, user.email),
    yearly: checkoutUrl(paymentLink(tier, "yearly"), user.id, user.email),
  };
  const unappliedCreditEur = (credits ?? [])
    .filter((c) => c.kind === "stripe_balance" && !c.applied_to_stripe)
    .reduce((acc, c) => acc + Number(c.amount_eur), 0);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/70 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/home">
              <ArrowLeft /> {t("pricingPage.back")}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("pricingPage.heading")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-pretty">
            {t("pricingPage.subheading")}
          </p>
        </div>

        <PricingCards
          tier={tier}
          spotsLeft={foundingSpotsLeft(founderCount)}
          links={links}
          clientCount={clientCount ?? 0}
          current={{
            tier: state.tier,
            source: state.source,
            proUntil: state.proUntil,
            planLabel: profile?.plan ? planName(t, profile.plan) : null,
            foundingNumber: profile?.founding_number ?? null,
          }}
          unappliedCreditEur={unappliedCreditEur}
        />
      </main>
    </div>
  );
}
