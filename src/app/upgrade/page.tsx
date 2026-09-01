import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/access";
import { signOut } from "@/lib/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Hard paywall. Reached when a trial has expired or a subscription lapsed
 * (see the gate in src/app/(app)/layout.tsx). Lives OUTSIDE the (app) group
 * so the access gate can't redirect-loop onto it. Data is retained, not
 * deleted — this only locks the door until the agent subscribes.
 */
export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at, founding_intent, price_locked_eur")
    .eq("id", user.id)
    .maybeSingle();

  // If they actually still have access, don't show the wall.
  if (profile && hasAccess(profile)) redirect("/home");

  // Loss-aversion hook: how much they'd lose by walking away.
  const { data: clientRows } = await supabase
    .from("clients")
    .select("agency")
    .eq("agent_id", user.id);
  const clientCount = clientRows?.length ?? 0;
  const agencyCount = new Set(
    (clientRows ?? []).map((c) => c.agency).filter(Boolean),
  ).size;

  const founding = profile?.founding_intent ?? false;
  const monthly = founding ? 19 : 29;
  const annual = founding ? 190 : 290;

  const links = {
    monthly: founding
      ? process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDING_MONTHLY
      : process.env.NEXT_PUBLIC_STRIPE_LINK_STANDARD_MONTHLY,
    annual: founding
      ? process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDING_ANNUAL
      : process.env.NEXT_PUBLIC_STRIPE_LINK_STANDARD_ANNUAL,
  };

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        {founding ? (
          <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
            Founding Agent · price locked for life
          </span>
        ) : null}

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Your trial&apos;s over — keep your leads
        </h1>

        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {clientCount > 0 ? (
            <>
              You&apos;ve added{" "}
              <span className="text-foreground font-medium">
                {clientCount} client{clientCount === 1 ? "" : "s"}
              </span>
              {agencyCount > 1 ? (
                <>
                  {" "}across{" "}
                  <span className="text-foreground font-medium">
                    {agencyCount} agencies
                  </span>
                </>
              ) : null}
              . Subscribe to keep working them — nothing is deleted, it&apos;s
              all here waiting.
            </>
          ) : (
            <>
              Subscribe to keep using LeadWing. Everything you&apos;ve added stays
              exactly where it is.
            </>
          )}
        </p>

        <div className="mt-6 space-y-3">
          <PlanButton
            href={links.annual}
            primary
            label={`Pay yearly — €${annual}`}
            hint="2 months free"
          />
          <PlanButton
            href={links.monthly}
            label={`Pay monthly — €${monthly}/mo`}
          />
        </div>

        {!links.monthly && !links.annual ? (
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Checkout isn&apos;t wired up yet (Stripe lands in Phase 1).
          </p>
        ) : null}

        <form action={signOut} className="mt-6 text-center">
          <button
            type="submit"
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

function PlanButton({
  href,
  label,
  hint,
  primary,
}: {
  href?: string;
  label: string;
  hint?: string;
  primary?: boolean;
}) {
  const className = cn(
    buttonVariants({ variant: primary ? "default" : "outline" }),
    "h-12 w-full justify-between text-base",
  );
  const content = (
    <>
      <span>{label}</span>
      {hint ? (
        <span className={primary ? "text-xs opacity-80" : "text-muted-foreground text-xs"}>
          {hint}
        </span>
      ) : null}
    </>
  );
  if (!href) {
    return (
      <span className={cn(className, "pointer-events-none opacity-50")}>
        {content}
      </span>
    );
  }
  return (
    <a href={href} className={className}>
      {content}
    </a>
  );
}
