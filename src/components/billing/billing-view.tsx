import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Download,
  ExternalLink,
  Gift,
  Receipt,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshWhilePending } from "@/components/billing/refresh-while-pending";
import { openBillingPortal } from "@/lib/actions/billing";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import {
  PRICES,
  foundingSpotsLabel,
  foundingSpotsLeft,
  isFoundingPlan,
  planInterval,
  planLabel,
  planTier,
} from "@/lib/billing";
import { clientsPath } from "@/lib/crm";
import type { BillingOverview } from "@/lib/data/billing";
import {
  PHASE_BADGE,
  formatBillingDate,
  formatMoney,
  formatPeriod,
  intervalLabel,
  invoiceStatusBadge,
  paymentMethodLabel,
  subscriptionEndsOn,
  subscriptionPhase,
  type BadgeTone,
  type SubscriptionPhase,
} from "@/lib/subscription";
import type { ReferralCredit } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  success: "border-success/40 bg-success/10",
  info: "border-border bg-muted",
  warning: "border-warning/50 bg-warning/10",
} as const;

type Tone = keyof typeof TONE_CLASSES;

/** The ledger stores a machine reason; this is what the agent reads. */
const CREDIT_REASON: Record<string, string> = {
  referral_inviter: "An agent you referred paid their second month",
  referral_invitee: "You joined through a referral and paid your second month",
  manual_comp: "Comped by LeadWing",
};

export function BillingView({
  overview,
  upgraded,
  portalUnavailable,
}: {
  overview: BillingOverview;
  upgraded: boolean;
  portalUnavailable: boolean;
}) {
  const { profile, plan, stripe, stripeUnavailable } = overview;
  const subscribed = plan.source === "subscription";
  const canManage = Boolean(profile?.stripe_customer_id);
  // Landed from checkout before the webhook flipped the profile: keep refreshing.
  const pending = upgraded && !subscribed;
  const showPaymentCard = subscribed || stripe !== null;

  const notice: { tone: Tone; text: string } | null = pending
    ? {
        tone: "info",
        text: "Thanks! Stripe is confirming your payment. This page refreshes on its own for a few seconds; if nothing changes, give it a minute and reload.",
      }
    : upgraded
      ? {
          tone: "success",
          text: "Thank you — you're on Pro. Everything about your subscription lives here.",
        }
      : portalUnavailable
        ? {
            tone: "info",
            text: "The billing portal isn't available for this account yet. Get in touch and we'll sort it by hand.",
          }
        : null;

  return (
    <div className="space-y-6">
      {pending ? <RefreshWhilePending /> : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm">
          Your plan, next invoice, payment method and receipts.
        </p>
      </div>

      {notice ? (
        <div className={cn("rounded-lg border px-4 py-3 text-sm", TONE_CLASSES[notice.tone])}>
          {notice.text}
        </div>
      ) : null}

      {stripeUnavailable ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
            TONE_CLASSES.warning,
          )}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Stripe didn&apos;t answer just now, so the payment method and invoices may be
            missing below. Your plan is unaffected; reload in a moment.
          </span>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <PlanCard overview={overview} canManage={canManage} />
        <ClientsCard clientCount={overview.clientCount} limit={plan.limit} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {showPaymentCard ? <PaymentMethodCard overview={overview} canManage={canManage} /> : null}
        <CreditsCard overview={overview} wide={!showPaymentCard} />
      </div>

      <InvoicesCard overview={overview} canManage={canManage} />

      <p className="text-muted-foreground text-center text-xs">
        Prices exclude IVA. Cancel any time from the billing portal; your data stays exactly
        where it is.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function PortalButton({
  children,
  variant = "outline",
}: {
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  return (
    <form action={openBillingPortal}>
      <Button type="submit" variant={variant} className="w-full sm:w-auto">
        {children}
      </Button>
    </form>
  );
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
      {hint ? <dd className="text-muted-foreground text-xs">{hint}</dd> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function PlanCard({ overview, canManage }: { overview: BillingOverview; canManage: boolean }) {
  const { profile, plan, founderCount, clientCount, stripe } = overview;
  const sub = stripe?.subscription ?? null;
  const upcoming = stripe?.upcoming ?? null;
  const phase: SubscriptionPhase | null = sub ? subscriptionPhase(sub) : null;
  const endsOn = sub ? formatBillingDate(subscriptionEndsOn(sub)) : null;
  const foundingNumber = profile?.founding_number ?? null;
  // The profile's plan is what the webhook read at checkout; Stripe's price is the live check.
  const knownPlan = profile?.plan ?? sub?.plan ?? null;
  const founding = isFoundingPlan(knownPlan) || foundingNumber != null;
  const spotsLeft = foundingSpotsLeft(founderCount);

  let title: string;
  let description: string;
  let badge: { label: string; tone: BadgeTone };
  let priceMain: string;
  let priceNote: string | null;

  if (plan.source === "subscription") {
    title = founding ? "Pro · Founding" : "Pro";
    description = founding
      ? "Your price is locked for life. Unlimited clients, every feature."
      : "Unlimited clients, every feature.";
    badge = phase
      ? phase === "ending" && endsOn
        ? { label: `Ends ${endsOn}`, tone: "warning" }
        : PHASE_BADGE[phase]
      : profile?.subscription_status === "past_due"
        ? PHASE_BADGE.past_due
        : PHASE_BADGE.active;
    if (sub?.amountCents != null) {
      priceMain = formatMoney(sub.amountCents, sub.currency);
      priceNote = [intervalLabel(sub.interval), "+ IVA"].filter(Boolean).join(" ");
    } else if (knownPlan) {
      const interval = planInterval(knownPlan);
      priceMain = `€${PRICES[planTier(knownPlan)][interval]}`;
      priceNote = `per ${interval === "yearly" ? "year" : "month"} + IVA`;
    } else {
      priceMain = "Pro";
      priceNote = null;
    }
  } else if (plan.source === "comp") {
    title = "Pro";
    description = "Comped Pro time: no card, no subscription. Unlimited clients while it lasts.";
    badge = { label: `Until ${formatBillingDate(plan.proUntil)}`, tone: "default" };
    priceMain = "€0";
    priceNote = "for now";
  } else if (plan.source === "admin") {
    title = "Pro";
    description = "You're on Pro as the admin. Subscribing is only for testing checkout.";
    badge = { label: "Admin", tone: "secondary" };
    priceMain = "€0";
    priceNote = "admin account";
  } else {
    title = "Free";
    description = `Every feature, up to ${FREE_CLIENT_LIMIT} clients. Upgrade when you outgrow it; nothing is ever deleted.`;
    badge = { label: "Free plan", tone: "secondary" };
    priceMain = "€0";
    priceNote = "forever";
  }

  // The "next invoice" line: Stripe's preview when we have it, else the plan price.
  let nextInvoice: { value: string; hint: string | null } | null = null;
  if (plan.source === "subscription" && (phase === "active" || phase === "past_due" || !sub)) {
    const date = formatBillingDate(sub?.currentPeriodEnd);
    let amount: string | null = null;
    let hint: string | null = null;
    if (upcoming) {
      amount = `${formatMoney(upcoming.amountDueCents, upcoming.currency)} ${
        upcoming.taxCents > 0 ? "incl. IVA" : "+ IVA"
      }`;
      if (upcoming.creditAppliedCents > 0) {
        hint = `${formatMoney(upcoming.creditAppliedCents, upcoming.currency)} of free-month credit already taken off`;
      }
    } else if (sub?.amountCents != null) {
      amount = `${formatMoney(sub.amountCents, sub.currency)} + IVA`;
    }
    if (amount || date) {
      nextInvoice = {
        value: amount && date ? `${amount} on ${date}` : (amount ?? date ?? ""),
        hint,
      };
    }
  }

  const message: { tone: Tone; text: string } | null =
    phase === "past_due"
      ? {
          tone: "warning",
          text: "Your last payment didn't go through. Stripe is retrying; update your card to keep Pro without a gap.",
        }
      : phase === "ending"
        ? {
            tone: "info",
            text: `Your subscription ends on ${endsOn}. You keep Pro until then, and everything stays exactly where it is after. Changed your mind? Resume it from the portal.`,
          }
        : phase === "canceled" && plan.source === "subscription"
          ? {
              tone: "info",
              text: `Stripe shows this subscription ended on ${endsOn}. If that's a surprise, get in touch.`,
            }
          : null;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant={badge.tone} className="shrink-0">
            {badge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight">{priceMain}</span>
          {priceNote ? <span className="text-muted-foreground text-sm">{priceNote}</span> : null}
        </div>

        {foundingNumber != null ? (
          <p className="text-primary flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4" />
            Founding Agent #{foundingNumber}
          </p>
        ) : null}

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {plan.source === "subscription" ? (
            <>
              <Fact
                label="Plan"
                value={overview.planLabel ?? (sub?.plan ? planLabel(sub.plan) : "Pro")}
              />
              {nextInvoice ? (
                <Fact label="Next invoice" value={nextInvoice.value} hint={nextInvoice.hint} />
              ) : null}
              {phase === "ending" && endsOn ? <Fact label="Ends" value={endsOn} /> : null}
              {phase === "canceled" && endsOn ? <Fact label="Ended" value={endsOn} /> : null}
              {sub ? (
                <Fact label="Subscribed since" value={formatBillingDate(sub.startedAt) ?? "—"} />
              ) : null}
              {sub && phase !== "canceled" ? (
                <Fact
                  label="Current period"
                  value={formatPeriod(sub.currentPeriodStart, sub.currentPeriodEnd) ?? "—"}
                />
              ) : null}
            </>
          ) : plan.source === "comp" ? (
            <>
              <Fact label="Pro until" value={formatBillingDate(plan.proUntil) ?? "—"} />
              <Fact label="After that" value="Back to Free" hint="Nothing is deleted." />
            </>
          ) : plan.source === "admin" ? null : (
            <>
              <Fact label="Clients" value={`${clientCount} of ${FREE_CLIENT_LIMIT}`} />
              <Fact
                label="Founding price"
                value={
                  spotsLeft > 0 ? foundingSpotsLabel(spotsLeft, true) : "Cohort full"
                }
                hint={
                  spotsLeft > 0
                    ? `€${PRICES.founding.monthly} a month for life instead of €${PRICES.standard.monthly}.`
                    : null
                }
              />
              {sub && phase === "canceled" && endsOn ? (
                <Fact label="Previous subscription" value={`Ended ${endsOn}`} />
              ) : null}
            </>
          )}
        </dl>

        {message ? (
          <div className={cn("rounded-lg border px-4 py-3 text-sm", TONE_CLASSES[message.tone])}>
            {message.text}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {plan.source === "subscription" ? (
            canManage ? (
              <>
                <PortalButton variant={phase === "past_due" ? "default" : "outline"}>
                  {phase === "past_due"
                    ? "Update payment method"
                    : phase === "ending"
                      ? "Resume or manage"
                      : "Manage subscription"}
                </PortalButton>
                <span className="text-muted-foreground text-xs">
                  Change your card, download invoices or cancel. Handled by Stripe.
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">
                Your subscription is managed by hand. Get in touch to change anything.
              </span>
            )
          ) : plan.source === "comp" ? (
            <Button asChild>
              <Link href="/pricing">
                Subscribe to keep Pro <ArrowRight />
              </Link>
            </Button>
          ) : plan.source === "admin" ? (
            <Button asChild variant="ghost">
              <Link href="/pricing">
                See plans <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/pricing">
                Upgrade to Pro <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */

function ClientsCard({ clientCount, limit }: { clientCount: number; limit: number | null }) {
  const unlimited = limit === null;
  const used = unlimited ? clientCount : Math.min(clientCount, limit);
  const atCap = !unlimited && clientCount >= limit;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-primary size-4" />
          Clients
        </CardTitle>
        <CardDescription>
          {unlimited
            ? "Unlimited on Pro, buyers and sellers together."
            : `Up to ${limit} on Free, buyers and sellers together.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">{clientCount}</span>
          <span className="text-muted-foreground text-sm">
            {unlimited ? (clientCount === 1 ? "client" : "clients") : `of ${limit}`}
          </span>
        </div>
        {!unlimited ? (
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", atCap ? "bg-warning" : "bg-primary")}
              style={{ width: `${(used / limit) * 100}%` }}
            />
          </div>
        ) : null}
        {atCap ? (
          <p className="text-muted-foreground text-sm">
            You&apos;re at the cap. Adding another needs Pro; everything you have stays as it is.
          </p>
        ) : null}
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={clientsPath("buyer")}>
            Open pipelines <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */

function PaymentMethodCard({
  overview,
  canManage,
}: {
  overview: BillingOverview;
  canManage: boolean;
}) {
  const pm = overview.stripe?.paymentMethod ?? null;
  const label = pm ? paymentMethodLabel(pm) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="text-primary size-4" />
          Payment method
        </CardTitle>
        <CardDescription>Stored by Stripe. We never see the numbers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {label ? (
          <div>
            <div className="font-medium">{label.title}</div>
            {label.detail ? (
              <div className="text-muted-foreground text-sm">{label.detail}</div>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {overview.stripeUnavailable
              ? "Couldn't load it from Stripe just now."
              : "No payment method on file."}
          </p>
        )}
        {canManage ? <PortalButton>Change payment method</PortalButton> : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */

function creditLine(credit: ReferralCredit): { title: string; detail: string } {
  const title = CREDIT_REASON[credit.reason] ?? credit.reason;
  const months = `${credit.months} month${credit.months === 1 ? "" : "s"} of Pro`;
  const detail =
    credit.kind === "pro_time"
      ? months
      : credit.applied_to_stripe
        ? "credited to your Stripe balance"
        : "waiting for your first invoice";
  return { title, detail };
}

function CreditsCard({ overview, wide }: { overview: BillingOverview; wide: boolean }) {
  const { credits, monthsEarned, unappliedCreditEur, stripe, plan } = overview;
  // Stripe keeps the balance negative while the customer is in credit.
  const balanceCents = stripe?.balanceCents ?? 0;
  return (
    <Card className={cn(wide && "lg:col-span-2")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="text-primary size-4" />
          Free months
        </CardTitle>
        <CardDescription>
          One for every agent you refer who subscribes and pays their second month. They get one
          too.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">
            {monthsEarned}
          </span>
          <span className="text-muted-foreground text-sm">earned so far</span>
        </div>

        {balanceCents < 0 ? (
          <p className="text-sm">
            <span className="font-medium">{formatMoney(-balanceCents)}</span> of credit sits on
            your Stripe account and comes off your next invoice automatically.
          </p>
        ) : null}
        {unappliedCreditEur > 0 ? (
          <p className="text-sm">
            <span className="font-medium">€{unappliedCreditEur}</span> in free months is waiting
            and will come off your invoices once you subscribe.
          </p>
        ) : null}
        {plan.source === "comp" && plan.proUntil ? (
          <p className="text-sm">
            Pro is comped until{" "}
            <span className="font-medium">{formatBillingDate(plan.proUntil)}</span>.
          </p>
        ) : null}

        {credits.length ? (
          <ul className="divide-y text-sm">
            {credits.slice(0, 5).map((credit) => {
              const line = creditLine(credit);
              return (
                <li key={credit.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate">{line.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatBillingDate(credit.created_at)} · {line.detail}
                    </div>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    {credit.kind === "pro_time"
                      ? `+${credit.months} mo`
                      : `€${Number(credit.amount_eur)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nothing yet. Share your referral link with the agents you co-broke with.
          </p>
        )}

        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/referrals">
            Refer an agent <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */

function InvoicesCard({ overview, canManage }: { overview: BillingOverview; canManage: boolean }) {
  const { stripe, stripeUnavailable, plan } = overview;
  const invoices = stripe?.invoices ?? [];

  let empty: string | null = null;
  if (!invoices.length) {
    empty = stripeUnavailable
      ? "Couldn't load your invoices from Stripe just now. Reload in a moment, or open the billing portal."
      : plan.source === "subscription"
        ? "Your invoices will appear here once Stripe has issued the first one."
        : "No invoices yet. Invoices appear here once you subscribe.";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="text-primary size-4" />
              Invoices
            </CardTitle>
            <CardDescription className="mt-1">
              Every invoice Stripe has issued for your account, with a PDF for your accountant.
            </CardDescription>
          </div>
          {canManage && invoices.length ? <PortalButton>All invoices</PortalButton> : null}
        </div>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const status = invoiceStatusBadge(inv.status);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="whitespace-nowrap">
                        <div>{formatBillingDate(inv.createdAt)}</div>
                        {inv.number ? (
                          <div className="text-muted-foreground text-xs">{inv.number}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPeriod(inv.periodStart, inv.periodEnd) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {formatMoney(inv.totalCents, inv.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.tone}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          {inv.hostedUrl ? (
                            <Button asChild variant="ghost" size="sm">
                              <a href={inv.hostedUrl} target="_blank" rel="noreferrer">
                                View <ExternalLink />
                              </a>
                            </Button>
                          ) : null}
                          {inv.pdfUrl ? (
                            <Button asChild variant="ghost" size="sm">
                              <a href={inv.pdfUrl} target="_blank" rel="noreferrer">
                                PDF <Download />
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
