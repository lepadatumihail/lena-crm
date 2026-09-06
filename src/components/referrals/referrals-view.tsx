import Link from "next/link";
import { ArrowRight, Gift, Link2, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/referrals/copy-button";
import { planState } from "@/lib/access";
import { FOUNDING_CAP, PRICES, foundingSpotsLabel, foundingSpotsLeft } from "@/lib/billing";
import type { ReferralOverview } from "@/lib/data/referrals";
import {
  REFERRAL_STATE_LABEL,
  type ReferralState,
  claimMessage,
  formatReferralCode,
} from "@/lib/referrals/links";
import { cn } from "@/lib/utils";

const STATE_VARIANT: Record<
  ReferralState,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
> = {
  signed_up: "secondary",
  subscribed: "default",
  rewarded: "success",
  left: "outline",
};

const TONE_CLASSES = {
  success: "border-success/40 bg-success/10",
  info: "border-border bg-muted",
  error: "border-destructive/40 bg-destructive/10",
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ReferralsView({
  overview,
  claimed,
}: {
  overview: ReferralOverview;
  claimed?: string;
}) {
  const { profile, referralUrl, referred, monthsEarned, unappliedCreditEur, referredBy, founderCount } =
    overview;
  const message = claimMessage(claimed);
  const isFounder = profile?.founding_number != null;
  const spotsLeft = foundingSpotsLeft(founderCount);
  const plan = planState(profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground text-sm">
          Share your link with the agents you co-broke with. When one of them subscribes and pays
          their second month, you both get a free month.
        </p>
      </div>

      {message ? (
        <div className={cn("rounded-lg border px-4 py-3 text-sm", TONE_CLASSES[message.tone])}>
          {message.text}
        </div>
      ) : null}

      {/* Founding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary size-4" />
            {isFounder
              ? `Founding Agent #${profile?.founding_number}`
              : spotsLeft > 0
                ? foundingSpotsLabel(spotsLeft)
                : "The founding cohort is full"}
          </CardTitle>
          <CardDescription>
            {isFounder ? (
              <>
                Your price is locked for life.{" "}
                {spotsLeft > 0
                  ? `${foundingSpotsLabel(spotsLeft)}.`
                  : "The founding cohort is full."}
              </>
            ) : spotsLeft > 0 ? (
              <>
                The first {FOUNDING_CAP} paying agents lock Pro at €{PRICES.founding.monthly} a
                month for life, instead of €{PRICES.standard.monthly}.
              </>
            ) : (
              <>Pro is €{PRICES.standard.monthly} a month, unlimited clients.</>
            )}
          </CardDescription>
        </CardHeader>
        {!isFounder && plan.source !== "subscription" ? (
          <CardContent>
            <Button asChild>
              <Link href="/pricing">
                See plans <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        ) : null}
      </Card>

      {/* Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="text-primary size-4" />
            Your referral link
          </CardTitle>
          <CardDescription>
            Anyone who signs up through it counts as your referral. New accounts only, and each
            agent can be referred once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile && referralUrl ? (
            <div className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-mono text-sm font-medium tracking-wider">
                  {formatReferralCode(profile.referral_code)}
                </div>
                <div className="text-muted-foreground truncate text-xs">{referralUrl}</div>
              </div>
              <CopyButton text={referralUrl} />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Your link will appear here shortly.</p>
          )}
        </CardContent>
      </Card>

      {/* Referred agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary size-4" />
            Agents you referred
          </CardTitle>
          <CardDescription>
            Signed up → Subscribed → Free month earned, once they pay their second month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referred.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No one yet. Send your link to a colleague you share deals with.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {referred.map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {agent.name || agent.email || "An agent"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Joined {formatDate(agent.joinedAt)}
                      {agent.paidInvoices > 0
                        ? ` · ${agent.paidInvoices} paid month${agent.paidInvoices === 1 ? "" : "s"}`
                        : ""}
                    </div>
                  </div>
                  <Badge variant={STATE_VARIANT[agent.state]}>
                    {REFERRAL_STATE_LABEL[agent.state]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="text-primary size-4" />
            Your free months
          </CardTitle>
          <CardDescription>
            On Pro, a free month comes off your next invoice. Not subscribed yet? You get a month
            of Pro straight away, no card needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {monthsEarned > 0 ? (
            <p>
              <span className="font-medium">
                {monthsEarned} free month{monthsEarned === 1 ? "" : "s"} earned
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground">Nothing earned yet.</p>
          )}
          {plan.source === "comp" && plan.proUntil ? (
            <p className="text-muted-foreground">
              You&apos;re on Pro until {formatDate(plan.proUntil)}.
            </p>
          ) : null}
          {unappliedCreditEur > 0 ? (
            <p className="text-muted-foreground">
              €{unappliedCreditEur} will come off your invoices once you subscribe.
            </p>
          ) : null}
          {referredBy ? (
            <p className="text-muted-foreground">
              Referred by {referredBy.name || referredBy.email}.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
