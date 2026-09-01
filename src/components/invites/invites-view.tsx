import Link from "next/link";
import { ArrowRight, Gift, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/invites/copy-button";
import { createMyInviteCodes } from "@/lib/actions/referrals";
import type { ReferralOverview } from "@/lib/data/referrals";
import {
  FOUNDING_CAP,
  FOUNDING_INVITE_QUOTA,
  FOUNDING_PRICE_EUR,
  FREE_MONTH_EUR,
  INVITE_STATE_LABEL,
  type InviteState,
  claimMessage,
  formatInviteCode,
  freeMonthsFromCredit,
  joinPath,
} from "@/lib/invites";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const STATE_VARIANT: Record<InviteState, "default" | "secondary" | "outline" | "success" | "warning" | "destructive"> = {
  available: "secondary",
  expired: "outline",
  revoked: "outline",
  joined: "default",
  qualified: "warning",
  rewarded: "success",
  left: "destructive",
};

const TONE_CLASSES = {
  success: "border-success/40 bg-success/10",
  info: "border-border bg-muted",
  error: "border-destructive/40 bg-destructive/10",
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function InvitesView({
  overview,
  claimed,
}: {
  overview: ReferralOverview;
  claimed?: string;
}) {
  const { profile, invites, quota, totalCreditEur, unappliedCreditEur, referredBy, founderCount } =
    overview;
  const isFounder = profile?.cohort === "founding";
  const hasIntent = Boolean(profile?.founding_intent) && !isFounder;
  const message = claimMessage(claimed);
  const months = freeMonthsFromCredit(totalCreditEur);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invites & referrals</h1>
        <p className="text-muted-foreground text-sm">
          Invite the agents you co-broke with. Your shared deals get cleaner, and you both get a
          free month.
        </p>
      </div>

      {message ? (
        <div className={cn("rounded-lg border px-4 py-3 text-sm", TONE_CLASSES[message.tone])}>
          {message.text}
        </div>
      ) : null}

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary size-4" />
            {isFounder
              ? `Founding Agent #${profile?.founding_number}`
              : hasIntent
                ? "Your Founding spot is reserved"
                : "The Founding circle"}
          </CardTitle>
          <CardDescription>
            {isFounder ? (
              <>
                €{FOUNDING_PRICE_EUR} a month, locked for life. {founderCount} of {FOUNDING_CAP} founding
                spots are taken.
              </>
            ) : hasIntent ? (
              <>
                Subscribe at €{FOUNDING_PRICE_EUR} a month, locked for life, to take your Founding
                number and unlock {FOUNDING_INVITE_QUOTA} invites. {founderCount} of {FOUNDING_CAP}{" "}
                spots are taken so far.
              </>
            ) : (
              <>
                The first {FOUNDING_CAP} paying agents get €{FOUNDING_PRICE_EUR} a month for life, a
                Founding number and {FOUNDING_INVITE_QUOTA} invites each. Founders hand out the codes;
                ask the agent who told you about LeadWing.
              </>
            )}
          </CardDescription>
        </CardHeader>
        {hasIntent ? (
          <CardContent>
            <Button asChild>
              <Link href="/upgrade">
                Subscribe at €{FOUNDING_PRICE_EUR}/mo <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        ) : referredBy ? (
          <CardContent className="text-muted-foreground text-sm">
            Invited by {referredBy.name || referredBy.email}.
          </CardContent>
        ) : null}
      </Card>

      {/* Codes */}
      {isFounder || invites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="text-primary size-4" />
              Your invites
            </CardTitle>
            <CardDescription>
              {quota.used} of {quota.quota} used. Each code works once and lasts 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.length === 0 ? (
              <p className="text-muted-foreground text-sm">No codes yet.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {invites.map((invite) => {
                  const url = `${SITE_URL}${joinPath(invite.code)}`;
                  return (
                    <li
                      key={invite.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium tracking-wider">
                            {formatInviteCode(invite.code)}
                          </span>
                          <Badge variant={STATE_VARIANT[invite.state]}>
                            {INVITE_STATE_LABEL[invite.state]}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {invite.redeemedBy
                            ? `${invite.redeemedBy.name || invite.redeemedBy.email} joined${
                                invite.paidInvoices ? ` · ${invite.paidInvoices} paid invoice${invite.paidInvoices === 1 ? "" : "s"}` : ""
                              }`
                            : invite.state === "available"
                              ? `Expires ${formatDate(invite.expires_at)}`
                              : ""}
                        </p>
                      </div>
                      {invite.state === "available" ? <CopyButton text={url} /> : null}
                    </li>
                  );
                })}
              </ul>
            )}
            {quota.remaining > 0 ? (
              <form action={createMyInviteCodes}>
                <Button type="submit" variant="outline" size="sm">
                  Create {quota.remaining} invite code{quota.remaining === 1 ? "" : "s"}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Credits */}
      <Card>
        <CardHeader>
          <CardTitle>Free months</CardTitle>
          <CardDescription>
            When someone you invited pays their second month, you both get €{FREE_MONTH_EUR} off the
            next invoice. That is one free month each.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {totalCreditEur > 0 ? (
            <p>
              <span className="text-foreground font-medium">
                €{totalCreditEur} earned, {months} free month{months === 1 ? "" : "s"}
              </span>
              {unappliedCreditEur > 0 ? (
                <span className="text-muted-foreground">
                  {" "}
                  · €{unappliedCreditEur} will be applied to your next invoice
                </span>
              ) : null}
            </p>
          ) : (
            <p className="text-muted-foreground">Nothing earned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
