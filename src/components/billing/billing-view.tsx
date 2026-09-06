import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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
import { intlTag } from "@/i18n/config";
import { openBillingPortal } from "@/lib/actions/billing";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import {
  PRICES,
  foundingSpotsLeft,
  isFoundingPlan,
  planInterval,
  planName,
  planTier,
  type BillingKey,
  type BillingT,
} from "@/lib/billing";
import { clientsPath } from "@/lib/crm";
import type { BillingOverview } from "@/lib/data/billing";
import {
  formatBillingDate,
  formatMoney,
  formatPeriod,
  invoiceStatusBadge,
  paymentMethodLabel,
  phaseBadge,
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

/** The ledger stores a machine reason; this is the key the agent reads. */
const CREDIT_REASON = {
  referral_inviter: "credits.reason.referral_inviter",
  referral_invitee: "credits.reason.referral_invitee",
  manual_comp: "credits.reason.manual_comp",
} as const satisfies Record<string, BillingKey>;

export function BillingView({
  overview,
  upgraded,
  portalUnavailable,
}: {
  overview: BillingOverview;
  upgraded: boolean;
  portalUnavailable: boolean;
}) {
  const t = useTranslations("billing");
  const { profile, plan, stripe, stripeUnavailable } = overview;
  const subscribed = plan.source === "subscription";
  const canManage = Boolean(profile?.stripe_customer_id);
  // Landed from checkout before the webhook flipped the profile: keep refreshing.
  const pending = upgraded && !subscribed;
  const showPaymentCard = subscribed || stripe !== null;

  const notice: { tone: Tone; text: string } | null = pending
    ? { tone: "info", text: t("notices.pending") }
    : upgraded
      ? { tone: "success", text: t("notices.upgraded") }
      : portalUnavailable
        ? { tone: "info", text: t("notices.portalUnavailable") }
        : null;

  return (
    <div className="space-y-6">
      {pending ? <RefreshWhilePending /> : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
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
          <span>{t("notices.stripeUnavailable")}</span>
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

      <p className="text-muted-foreground text-center text-xs">{t("footer.note")}</p>
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
  const t = useTranslations("billing");
  const tag = intlTag(useLocale());
  const { profile, plan, founderCount, clientCount, stripe } = overview;
  const sub = stripe?.subscription ?? null;
  const upcoming = stripe?.upcoming ?? null;
  const phase: SubscriptionPhase | null = sub ? subscriptionPhase(sub) : null;
  const endsOn = sub ? formatBillingDate(subscriptionEndsOn(sub), tag) : null;
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
    title = founding ? t("plan.titleFounding") : t("plan.titlePro");
    description = founding ? t("plan.descFounding") : t("plan.descPro");
    badge = phase
      ? phase === "ending" && endsOn
        ? { label: t("plan.badgeEnds", { date: endsOn }), tone: "warning" }
        : phaseBadge(t, phase)
      : profile?.subscription_status === "past_due"
        ? phaseBadge(t, "past_due")
        : phaseBadge(t, "active");
    if (sub?.amountCents != null) {
      priceMain = formatMoney(sub.amountCents, sub.currency, tag);
      priceNote =
        sub.interval === "month"
          ? t("plan.perMonth")
          : sub.interval === "year"
            ? t("plan.perYear")
            : t("plan.plusIva");
    } else if (knownPlan) {
      const interval = planInterval(knownPlan);
      priceMain = `€${PRICES[planTier(knownPlan)][interval]}`;
      priceNote = interval === "yearly" ? t("plan.perYear") : t("plan.perMonth");
    } else {
      priceMain = t("plan.titlePro");
      priceNote = null;
    }
  } else if (plan.source === "comp") {
    title = t("plan.titlePro");
    description = t("plan.descComp");
    badge = {
      label: t("plan.badgeUntil", { date: formatBillingDate(plan.proUntil, tag) ?? "" }),
      tone: "default",
    };
    priceMain = "€0";
    priceNote = t("plan.priceForNow");
  } else if (plan.source === "admin") {
    title = t("plan.titlePro");
    description = t("plan.descAdmin");
    badge = { label: t("plan.badgeAdmin"), tone: "secondary" };
    priceMain = "€0";
    priceNote = t("plan.priceAdmin");
  } else {
    title = t("plan.titleFree");
    description = t("plan.descFree", { limit: FREE_CLIENT_LIMIT });
    badge = { label: t("plan.badgeFree"), tone: "secondary" };
    priceMain = "€0";
    priceNote = t("plan.priceForever");
  }

  // The "next invoice" line: Stripe's preview when we have it, else the plan price.
  let nextInvoice: { value: string; hint: string | null } | null = null;
  if (plan.source === "subscription" && (phase === "active" || phase === "past_due" || !sub)) {
    const date = formatBillingDate(sub?.currentPeriodEnd, tag);
    let amount: string | null = null;
    let hint: string | null = null;
    if (upcoming) {
      const money = formatMoney(upcoming.amountDueCents, upcoming.currency, tag);
      amount = t(upcoming.taxCents > 0 ? "nextInvoice.inclIva" : "nextInvoice.plusIva", {
        amount: money,
      });
      if (upcoming.creditAppliedCents > 0) {
        hint = t("nextInvoice.creditHint", {
          amount: formatMoney(upcoming.creditAppliedCents, upcoming.currency, tag),
        });
      }
    } else if (sub?.amountCents != null) {
      amount = t("nextInvoice.plusIva", {
        amount: formatMoney(sub.amountCents, sub.currency, tag),
      });
    }
    if (amount || date) {
      nextInvoice = {
        value:
          amount && date ? t("nextInvoice.onDate", { amount, date }) : (amount ?? date ?? ""),
        hint,
      };
    }
  }

  const message: { tone: Tone; text: string } | null =
    phase === "past_due"
      ? { tone: "warning", text: t("messages.pastDue") }
      : phase === "ending"
        ? { tone: "info", text: t("messages.ending", { date: endsOn ?? "" }) }
        : phase === "canceled" && plan.source === "subscription"
          ? { tone: "info", text: t("messages.canceled", { date: endsOn ?? "" }) }
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
            {t("plan.foundingAgent", { number: foundingNumber })}
          </p>
        ) : null}

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {plan.source === "subscription" ? (
            <>
              <Fact
                label={t("facts.plan")}
                value={knownPlan ? planName(t, knownPlan) : t("plan.titlePro")}
              />
              {nextInvoice ? (
                <Fact
                  label={t("facts.nextInvoice")}
                  value={nextInvoice.value}
                  hint={nextInvoice.hint}
                />
              ) : null}
              {phase === "ending" && endsOn ? (
                <Fact label={t("facts.ends")} value={endsOn} />
              ) : null}
              {phase === "canceled" && endsOn ? (
                <Fact label={t("facts.ended")} value={endsOn} />
              ) : null}
              {sub ? (
                <Fact
                  label={t("facts.subscribedSince")}
                  value={formatBillingDate(sub.startedAt, tag) ?? "—"}
                />
              ) : null}
              {sub && phase !== "canceled" ? (
                <Fact
                  label={t("facts.currentPeriod")}
                  value={formatPeriod(sub.currentPeriodStart, sub.currentPeriodEnd, tag) ?? "—"}
                />
              ) : null}
            </>
          ) : plan.source === "comp" ? (
            <>
              <Fact
                label={t("facts.proUntil")}
                value={formatBillingDate(plan.proUntil, tag) ?? "—"}
              />
              <Fact
                label={t("facts.afterThat")}
                value={t("facts.backToFree")}
                hint={t("facts.nothingDeleted")}
              />
            </>
          ) : plan.source === "admin" ? null : (
            <>
              <Fact
                label={t("facts.clients")}
                value={t("facts.clientsValue", { count: clientCount, limit: FREE_CLIENT_LIMIT })}
              />
              <Fact
                label={t("facts.foundingPrice")}
                value={
                  spotsLeft > 0
                    ? t("founding.spotsBare", { count: spotsLeft })
                    : t("facts.cohortFull")
                }
                hint={
                  spotsLeft > 0
                    ? t("facts.foundingHint", {
                        price: PRICES.founding.monthly,
                        standard: PRICES.standard.monthly,
                      })
                    : null
                }
              />
              {sub && phase === "canceled" && endsOn ? (
                <Fact
                  label={t("facts.previousSubscription")}
                  value={t("facts.endedOn", { date: endsOn })}
                />
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
                    ? t("actions.updatePaymentMethod")
                    : phase === "ending"
                      ? t("actions.resumeOrManage")
                      : t("actions.manageSubscription")}
                </PortalButton>
                <span className="text-muted-foreground text-xs">{t("actions.portalHint")}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">{t("actions.manualHint")}</span>
            )
          ) : plan.source === "comp" ? (
            <Button asChild>
              <Link href="/pricing">
                {t("actions.subscribeToKeepPro")} <ArrowRight />
              </Link>
            </Button>
          ) : plan.source === "admin" ? (
            <Button asChild variant="ghost">
              <Link href="/pricing">
                {t("actions.seePlans")} <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/pricing">
                {t("actions.upgradeToPro")} <ArrowRight />
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
  const t = useTranslations("billing");
  const unlimited = limit === null;
  const used = unlimited ? clientCount : Math.min(clientCount, limit);
  const atCap = !unlimited && clientCount >= limit;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-primary size-4" />
          {t("clients.title")}
        </CardTitle>
        <CardDescription>
          {unlimited ? t("clients.unlimited") : t("clients.limited", { limit })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">{clientCount}</span>
          <span className="text-muted-foreground text-sm">
            {unlimited
              ? t("clients.count", { count: clientCount })
              : t("clients.ofLimit", { limit })}
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
        {atCap ? <p className="text-muted-foreground text-sm">{t("clients.atCap")}</p> : null}
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={clientsPath("buyer")}>
            {t("clients.openPipelines")} <ArrowRight />
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
  const t = useTranslations("billing");
  const pm = overview.stripe?.paymentMethod ?? null;
  const label = pm ? paymentMethodLabel(t, pm) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="text-primary size-4" />
          {t("payment.title")}
        </CardTitle>
        <CardDescription>{t("payment.description")}</CardDescription>
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
            {overview.stripeUnavailable ? t("payment.loadFailed") : t("payment.none")}
          </p>
        )}
        {canManage ? <PortalButton>{t("payment.change")}</PortalButton> : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */

function creditLine(t: BillingT, credit: ReferralCredit): { title: string; detail: string } {
  const reasonKey = CREDIT_REASON[credit.reason as keyof typeof CREDIT_REASON];
  const title = reasonKey ? t(reasonKey) : credit.reason;
  const detail =
    credit.kind === "pro_time"
      ? t("credits.months", { count: credit.months })
      : credit.applied_to_stripe
        ? t("credits.creditedToStripe")
        : t("credits.waitingFirstInvoice");
  return { title, detail };
}

function CreditsCard({ overview, wide }: { overview: BillingOverview; wide: boolean }) {
  const t = useTranslations("billing");
  const tag = intlTag(useLocale());
  const { credits, monthsEarned, unappliedCreditEur, stripe, plan } = overview;
  // Stripe keeps the balance negative while the customer is in credit.
  const balanceCents = stripe?.balanceCents ?? 0;
  const bold = (chunks: React.ReactNode) => <span className="font-medium">{chunks}</span>;
  return (
    <Card className={cn(wide && "lg:col-span-2")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="text-primary size-4" />
          {t("credits.title")}
        </CardTitle>
        <CardDescription>{t("credits.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">
            {monthsEarned}
          </span>
          <span className="text-muted-foreground text-sm">{t("credits.earnedSoFar")}</span>
        </div>

        {balanceCents < 0 ? (
          <p className="text-sm">
            {t.rich("credits.onStripe", {
              amount: formatMoney(-balanceCents, "eur", tag),
              b: bold,
            })}
          </p>
        ) : null}
        {unappliedCreditEur > 0 ? (
          <p className="text-sm">
            {t.rich("credits.waiting", { amount: unappliedCreditEur, b: bold })}
          </p>
        ) : null}
        {plan.source === "comp" && plan.proUntil ? (
          <p className="text-sm">
            {t.rich("credits.compedUntil", {
              date: formatBillingDate(plan.proUntil, tag) ?? "",
              b: bold,
            })}
          </p>
        ) : null}

        {credits.length ? (
          <ul className="divide-y text-sm">
            {credits.slice(0, 5).map((credit) => {
              const line = creditLine(t, credit);
              return (
                <li key={credit.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate">{line.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatBillingDate(credit.created_at, tag)} · {line.detail}
                    </div>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    {credit.kind === "pro_time"
                      ? t("credits.monthsShort", { count: credit.months })
                      : `€${Number(credit.amount_eur)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t("credits.empty")}</p>
        )}

        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/referrals">
            {t("credits.referAnAgent")} <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */

function InvoicesCard({ overview, canManage }: { overview: BillingOverview; canManage: boolean }) {
  const t = useTranslations("billing");
  const common = useTranslations("common");
  const tag = intlTag(useLocale());
  const { stripe, stripeUnavailable, plan } = overview;
  const invoices = stripe?.invoices ?? [];

  let empty: string | null = null;
  if (!invoices.length) {
    empty = stripeUnavailable
      ? t("invoices.emptyStripeDown")
      : plan.source === "subscription"
        ? t("invoices.emptySubscribed")
        : t("invoices.empty");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="text-primary size-4" />
              {t("invoices.title")}
            </CardTitle>
            <CardDescription className="mt-1">{t("invoices.description")}</CardDescription>
          </div>
          {canManage && invoices.length ? (
            <PortalButton>{t("invoices.all")}</PortalButton>
          ) : null}
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
                  <TableHead>{t("invoices.date")}</TableHead>
                  <TableHead>{t("invoices.period")}</TableHead>
                  <TableHead className="text-right">{t("invoices.amount")}</TableHead>
                  <TableHead>{t("invoices.status")}</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">{t("invoices.open")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const status = invoiceStatusBadge(t, inv.status);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="whitespace-nowrap">
                        <div>{formatBillingDate(inv.createdAt, tag)}</div>
                        {inv.number ? (
                          <div className="text-muted-foreground text-xs">{inv.number}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPeriod(inv.periodStart, inv.periodEnd, tag) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {formatMoney(inv.totalCents, inv.currency, tag)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.tone}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          {inv.hostedUrl ? (
                            <Button asChild variant="ghost" size="sm">
                              <a href={inv.hostedUrl} target="_blank" rel="noreferrer">
                                {common("view")} <ExternalLink />
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
