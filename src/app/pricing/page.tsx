import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  planLabel,
} from "@/lib/billing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/billing/pricing-cards";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Plans & pricing",
  robots: { index: false, follow: false },
};

/**
 * Plans page for signed-in agents. Lives OUTSIDE the (app) group: it is the
 * destination of the client-cap prompt and of Stripe's post-checkout
 * redirect, and needs the user's id to tag the Payment Links.
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string; upgraded?: string }>;
}) {
  const [{ portal, upgraded }, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fpricing");

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

  const notice =
    upgraded === "1"
      ? {
          tone: "success" as const,
          text: "Thank you — you're on Pro. If it doesn't show here yet, give it a few seconds and refresh.",
        }
      : portal === "unavailable"
        ? {
            tone: "info" as const,
            text: "The billing portal isn't available for this account yet. Get in touch and we'll sort it by hand.",
          }
        : null;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/70 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/home">
              <ArrowLeft /> Back to the app
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Free to start. One plan when you grow.
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-pretty">
            Every feature on both plans. The only difference is how many clients you can hold.
            Nothing you&apos;ve added is ever deleted.
          </p>
        </div>

        {notice ? (
          <div
            className={cn(
              "mx-auto mt-6 max-w-2xl rounded-lg border px-4 py-3 text-center text-sm",
              notice.tone === "success"
                ? "border-success/40 bg-success/10"
                : "border-border bg-muted",
            )}
          >
            {notice.text}
          </div>
        ) : null}

        <PricingCards
          tier={tier}
          spotsLeft={foundingSpotsLeft(founderCount)}
          links={links}
          clientCount={clientCount ?? 0}
          current={{
            tier: state.tier,
            source: state.source,
            proUntil: state.proUntil,
            planLabel: profile?.plan ? planLabel(profile.plan) : null,
            foundingNumber: profile?.founding_number ?? null,
            canManage: Boolean(profile?.stripe_customer_id),
          }}
          unappliedCreditEur={unappliedCreditEur}
        />
      </main>
    </div>
  );
}
