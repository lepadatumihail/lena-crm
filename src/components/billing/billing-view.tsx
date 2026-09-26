import type { ComponentProps, ReactNode } from "react";
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
  Users,
} from "lucide-react";

import { RefreshWhilePending } from "@/components/billing/refresh-while-pending";
import { KeyValueList, KeyValueRow, RowIcon } from "@/components/shell/key-value";
import { Panel, PanelAction, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
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
import { clientsPath, formatCurrency } from "@/lib/crm";
import type { BillingOverview } from "@/lib/data/billing";
import {
  formatBillingDate,
  formatMoney,
  formatPeriod,
  invoiceStatusTag,
  paymentMethodLabel,
  phaseTag,
  subscriptionEndsOn,
  subscriptionPhase,
  type SubscriptionPhase,
} from "@/lib/subscription";
import type { ReferralCredit } from "@/lib/supabase/types";
import { TONE_SOLID, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

/** The ledger stores a machine reason; this is the key the agent reads. */
const CREDIT_REASON = {
  referral_inviter: "credits.reason.referral_inviter",
  referral_invitee: "credits.reason.referral_invitee",
  manual_comp: "credits.reason.manual_comp",
} as const satisfies Record<string, BillingKey>;

/**
 * The agent's billing page on the shell's panels: the plan and what it costs
 * beside the client count and the card, then invoices beside free months.
 */
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
  const showPaymentPanel = subscribed || stripe !== null;

  const notice: { tone: Tone; text: string } | null = pending
    ? { tone: "neutral", text: t("notices.pending") }
    : upgraded
      ? { tone: "green", text: t("notices.upgraded") }
      : portalUnavailable
        ? { tone: "neutral", text: t("notices.portalUnavailable") }
        : null;

  return (
    <div className="space-y-4">
      {pending ? <RefreshWhilePending /> : null}

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {stripeUnavailable ? (
        <Notice tone="amber">{t("notices.stripeUnavailable")}</Notice>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <PlanPanel overview={overview} canManage={canManage} className="lg:col-span-2" />
        <div className="grid gap-4">
          <ClientsPanel clientCount={overview.clientCount} limit={plan.limit} />
          {showPaymentPanel ? (
            <PaymentMethodPanel overview={overview} canManage={canManage} />
          ) : null}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <InvoicesPanel overview={overview} canManage={canManage} className="lg:col-span-2" />
        <CreditsPanel overview={overview} />
      </div>

      <p className="text-muted-foreground text-center text-xs text-pretty">
        {t("footer.note")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function PortalButton({
  children,
  variant = "outline",
  size = "sm",
  className,
}: {
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  return (
    <form action={openBillingPortal} className={className}>
      <Button type="submit" variant={variant} size={size} className="w-full sm:w-auto">
        {children}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------------ */

function PlanPanel({
  overview,
  canManage,
  className,
}: {
  overview: BillingOverview;
  canManage: boolean;
  className?: string;
}) {
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
  let badge: { label: string; tone: Tone };
  let priceMain: string;
  let priceNote: string | null;

  if (plan.source === "subscription") {
    title = founding ? t("plan.titleFounding") : t("plan.titlePro");
    description = founding ? t("plan.descFounding") : t("plan.descPro");
    badge = phase
      ? phase === "ending" && endsOn
        ? { label: t("plan.badgeEnds", { date: endsOn }), tone: "amber" }
        : phaseTag(t, phase)
      : profile?.subscription_status === "past_due"
        ? phaseTag(t, "past_due")
        : phaseTag(t, "active");
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
      priceMain = formatCurrency(PRICES[planTier(knownPlan)][interval], tag);
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
      tone: "blue",
    };
    priceMain = formatCurrency(0, tag);
    priceNote = t("plan.priceForNow");
  } else if (plan.source === "admin") {
    title = t("plan.titlePro");
    description = t("plan.descAdmin");
    badge = { label: t("plan.badgeAdmin"), tone: "neutral" };
    priceMain = formatCurrency(0, tag);
    priceNote = t("plan.priceAdmin");
  } else {
    title = t("plan.titleFree");
    description = t("plan.descFree", { limit: FREE_CLIENT_LIMIT });
    badge = { label: t("plan.badgeFree"), tone: "neutral" };
    priceMain = formatCurrency(0, tag);
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
      ? { tone: "amber", text: t("messages.pastDue") }
      : phase === "ending"
        ? { tone: "neutral", text: t("messages.ending", { date: endsOn ?? "" }) }
        : phase === "canceled" && plan.source === "subscription"
          ? { tone: "neutral", text: t("messages.canceled", { date: endsOn ?? "" }) }
          : null;

  // The facts under the price, one row each.
  const facts: ReactNode[] = [];
  if (plan.source === "subscription") {
    facts.push(
      <KeyValueRow key="plan" label={t("facts.plan")}>
        {knownPlan ? planName(t, knownPlan) : t("plan.titlePro")}
      </KeyValueRow>
    );
    if (nextInvoice) {
      facts.push(
        <KeyValueRow key="next" label={t("facts.nextInvoice")} hint={nextInvoice.hint} wrap>
          {nextInvoice.value}
        </KeyValueRow>
      );
    }
    if (phase === "ending" && endsOn) {
      facts.push(
        <KeyValueRow key="ends" label={t("facts.ends")}>
          {endsOn}
        </KeyValueRow>
      );
    }
    if (phase === "canceled" && endsOn) {
      facts.push(
        <KeyValueRow key="ended" label={t("facts.ended")}>
          {endsOn}
        </KeyValueRow>
      );
    }
    if (sub) {
      facts.push(
        <KeyValueRow key="since" label={t("facts.subscribedSince")}>
          {formatBillingDate(sub.startedAt, tag) ?? "—"}
        </KeyValueRow>
      );
    }
    if (sub && phase !== "canceled") {
      facts.push(
        <KeyValueRow key="period" label={t("facts.currentPeriod")}>
          {formatPeriod(sub.currentPeriodStart, sub.currentPeriodEnd, tag) ?? "—"}
        </KeyValueRow>
      );
    }
  } else if (plan.source === "comp") {
    facts.push(
      <KeyValueRow key="until" label={t("facts.proUntil")}>
        {formatBillingDate(plan.proUntil, tag) ?? "—"}
      </KeyValueRow>,
      <KeyValueRow key="after" label={t("facts.afterThat")} hint={t("facts.nothingDeleted")}>
        {t("facts.backToFree")}
      </KeyValueRow>
    );
  } else if (plan.source !== "admin") {
    facts.push(
      <KeyValueRow key="clients" label={t("facts.clients")}>
        {t("facts.clientsValue", { count: clientCount, limit: FREE_CLIENT_LIMIT })}
      </KeyValueRow>,
      <KeyValueRow
        key="founding"
        label={t("facts.foundingPrice")}
        wrap
        hint={
          spotsLeft > 0
            ? t("facts.foundingHint", {
                price: PRICES.founding.monthly,
                standard: PRICES.standard.monthly,
              })
            : null
        }
      >
        {spotsLeft > 0 ? t("founding.spotsBare", { count: spotsLeft }) : t("facts.cohortFull")}
      </KeyValueRow>
    );
    if (sub && phase === "canceled" && endsOn) {
      facts.push(
        <KeyValueRow key="previous" label={t("facts.previousSubscription")}>
          {t("facts.endedOn", { date: endsOn })}
        </KeyValueRow>
      );
    }
  }

  return (
    <Panel
      className={className}
      title={t("pricing.yourPlan")}
      icon={<Sparkles className="size-3.5" />}
      action={<Tag tone={badge.tone}>{badge.label}</Tag>}
    >
      <div className="space-y-4 px-4 py-5">
        <div className="space-y-1">
          <p className="text-lg leading-6 font-medium">{title}</p>
          <p className="text-muted-foreground text-sm text-pretty">{description}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
              {priceMain}
            </span>
            {priceNote ? <span className="text-muted-foreground text-sm">{priceNote}</span> : null}
          </p>
          {foundingNumber != null ? (
            <Tag>
              <Sparkles />
              {t("plan.foundingAgent", { number: foundingNumber })}
            </Tag>
          ) : null}
        </div>
      </div>

      {facts.length > 0 ? <KeyValueList className="border-t">{facts}</KeyValueList> : null}

      <div className="space-y-3 border-t px-4 py-4">
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
                <span className="text-muted-foreground text-xs text-pretty">
                  {t("actions.portalHint")}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">{t("actions.manualHint")}</span>
            )
          ) : plan.source === "comp" ? (
            <Button asChild size="sm">
              <Link href="/pricing">
                {t("actions.subscribeToKeepPro")} <ArrowRight />
              </Link>
            </Button>
          ) : plan.source === "admin" ? (
            <Button asChild variant="ghost" size="sm" className="self-start">
              <Link href="/pricing">
                {t("actions.seePlans")} <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/pricing">
                {t("actions.upgradeToPro")} <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------------ */

function ClientsPanel({ clientCount, limit }: { clientCount: number; limit: number | null }) {
  const t = useTranslations("billing");
  const unlimited = limit === null;
  const used = unlimited ? clientCount : Math.min(clientCount, limit);
  const atCap = !unlimited && clientCount >= limit;
  return (
    <Panel
      title={t("clients.title")}
      icon={<Users className="size-3.5" />}
      action={<PanelAction href={clientsPath("buyer")}>{t("clients.openPipelines")}</PanelAction>}
    >
      <div className="space-y-3 px-4 py-4">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {clientCount}
          </span>
          <span className="text-muted-foreground text-sm">
            {unlimited
              ? t("clients.count", { count: clientCount })
              : t("clients.ofLimit", { limit })}
          </span>
        </p>
        {!unlimited ? (
          <div
            className="bg-muted h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-valuenow={used}
          >
            {/* The same meter as the sidebar's plan card: grey, ink once full. */}
            <div
              className={cn("h-full rounded-full", TONE_SOLID[atCap ? "ink" : "grey"])}
              style={{ width: `${(used / limit) * 100}%` }}
            />
          </div>
        ) : null}
        <p className="text-muted-foreground text-[13px] text-pretty">
          {atCap
            ? t("clients.atCap")
            : unlimited
              ? t("clients.unlimited")
              : t("clients.limited", { limit })}
        </p>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------------ */

function PaymentMethodPanel({
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
    <Panel title={t("payment.title")} icon={<CreditCard className="size-3.5" />}>
      <div className="flex items-center gap-3 px-4 py-4">
        <RowIcon icon={CreditCard} className="mt-0" />
        <div className="min-w-0 flex-1">
          {label ? (
            <>
              <p className="truncate text-sm font-medium">{label.title}</p>
              {label.detail ? (
                <p className="text-muted-foreground truncate text-xs">{label.detail}</p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              {overview.stripeUnavailable ? t("payment.loadFailed") : t("payment.none")}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t px-4 py-3">
        <p className="text-muted-foreground text-xs text-pretty">{t("payment.description")}</p>
        {canManage ? <PortalButton size="xs">{t("payment.change")}</PortalButton> : null}
      </div>
    </Panel>
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

function CreditsPanel({ overview }: { overview: BillingOverview }) {
  const t = useTranslations("billing");
  const tag = intlTag(useLocale());
  const { credits, monthsEarned, unappliedCreditEur, stripe, plan } = overview;
  // Stripe keeps the balance negative while the customer is in credit.
  const balanceCents = stripe?.balanceCents ?? 0;
  const bold = (chunks: ReactNode) => (
    <span className="text-foreground font-medium">{chunks}</span>
  );
  return (
    <Panel
      title={t("credits.title")}
      icon={<Gift className="size-3.5" />}
      action={<PanelAction href="/referrals">{t("credits.referAnAgent")}</PanelAction>}
      footer={t("credits.description")}
    >
      <div className="space-y-2 px-4 py-4">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {monthsEarned}
          </span>
          <span className="text-muted-foreground text-sm">{t("credits.earnedSoFar")}</span>
        </p>
        {balanceCents < 0 ? (
          <p className="text-muted-foreground text-[13px] text-pretty">
            {t.rich("credits.onStripe", {
              amount: formatMoney(-balanceCents, "eur", tag),
              b: bold,
            })}
          </p>
        ) : null}
        {unappliedCreditEur > 0 ? (
          <p className="text-muted-foreground text-[13px] text-pretty">
            {t.rich("credits.waiting", { amount: unappliedCreditEur, b: bold })}
          </p>
        ) : null}
        {plan.source === "comp" && plan.proUntil ? (
          <p className="text-muted-foreground text-[13px] text-pretty">
            {t.rich("credits.compedUntil", {
              date: formatBillingDate(plan.proUntil, tag) ?? "",
              b: bold,
            })}
          </p>
        ) : null}
      </div>

      {credits.length ? (
        <ul className="divide-y border-t">
          {credits.slice(0, 5).map((credit) => {
            const line = creditLine(t, credit);
            return (
              <li key={credit.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  {/* A third-width panel: the reason wraps rather than lose its end. */}
                  <p className="text-sm text-pretty">{line.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {formatBillingDate(credit.created_at, tag)} · {line.detail}
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums">
                  {credit.kind === "pro_time"
                    ? t("credits.monthsShort", { count: credit.months })
                    : formatCurrency(Number(credit.amount_eur), tag)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground border-t px-4 py-3 text-[13px] text-pretty">
          {t("credits.empty")}
        </p>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------------ */

function InvoicesPanel({
  overview,
  canManage,
  className,
}: {
  overview: BillingOverview;
  canManage: boolean;
  className?: string;
}) {
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
    <Panel
      className={className}
      title={t("invoices.title")}
      icon={<Receipt className="size-3.5" />}
      count={invoices.length}
      action={
        canManage && invoices.length ? (
          // Looks like every other panel's header link (PanelAction), but it
          // posts: the portal URL is minted per visit.
          <form action={openBillingPortal}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -mr-1.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs outline-none transition-colors duration-150 focus-visible:ring-[3px]"
            >
              {t("invoices.all")} <ExternalLink className="size-3.5" />
            </button>
          </form>
        ) : null
      }
      footer={t("invoices.description")}
    >
      {empty ? (
        <PanelEmpty>{empty}</PanelEmpty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("invoices.date")}</TableHead>
              {/* On a phone the row keeps date, amount, status and the links. */}
              <TableHead className="hidden sm:table-cell">{t("invoices.period")}</TableHead>
              <TableHead className="text-right">{t("invoices.amount")}</TableHead>
              <TableHead>{t("invoices.status")}</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">{t("invoices.open")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const status = invoiceStatusTag(t, inv.status);
              return (
                <TableRow key={inv.id}>
                  <TableCell className="pl-4">
                    <span className="tabular-nums">{formatBillingDate(inv.createdAt, tag)}</span>
                    {inv.number ? (
                      <span className="text-muted-foreground ml-2 hidden text-xs sm:inline">
                        {inv.number}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-[13px] sm:table-cell">
                    {formatPeriod(inv.periodStart, inv.periodEnd, tag) ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(inv.totalCents, inv.currency, tag)}
                  </TableCell>
                  <TableCell>
                    <Tag tone={status.tone}>{status.label}</Tag>
                  </TableCell>
                  <TableCell className="pr-4 text-right max-sm:pl-1">
                    <div className="flex justify-end gap-1">
                      {/* Icons only on a phone; the label stays for screen readers. */}
                      {inv.hostedUrl ? (
                        <Button asChild variant="ghost" size="xs" className="max-sm:px-1.5!">
                          <a href={inv.hostedUrl} target="_blank" rel="noreferrer">
                            <span className="sr-only sm:not-sr-only">{common("view")}</span>
                            <ExternalLink />
                          </a>
                        </Button>
                      ) : null}
                      {inv.pdfUrl ? (
                        <Button asChild variant="ghost" size="xs" className="max-sm:px-1.5!">
                          <a href={inv.pdfUrl} target="_blank" rel="noreferrer">
                            <span className="sr-only sm:not-sr-only">PDF</span>
                            <Download />
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
      )}
    </Panel>
  );
}
