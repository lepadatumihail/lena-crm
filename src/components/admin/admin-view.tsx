import { useLocale, useTranslations } from "next-intl";
import { Coins, Gift, Sparkles, Users } from "lucide-react";

import { Panel, PanelEmpty } from "@/components/shell/panel";
import { StatStrip } from "@/components/shell/stat-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import {
  adminAllocateFounding,
  adminCompMonth,
  adminRecordPaidInvoice,
  adminSetStatus,
} from "@/lib/actions/referrals";
import type { AdminOverview } from "@/lib/data/referrals";
import { intlTag } from "@/i18n/config";
import { FREE_CLIENT_LIMIT, planState } from "@/lib/access";
import { FOUNDING_CAP, planName } from "@/lib/billing";
import { initialsOf } from "@/lib/home";
import type { Enums } from "@/lib/supabase/types";
import { TONE_INK, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

const STATUSES = ["none", "active", "past_due", "canceled"] as const;

const STATUS_TONE: Record<Enums<"sub_status">, Tone> = {
  none: "neutral",
  active: "green",
  past_due: "amber",
  canceled: "neutral",
};

/** A raw status ("past_due") as a sentence-case label ("Past due"), like every other tag. */
function enumLabel(value: string): string {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* The agent-facing referral hues: pending neutral, qualified blue, won green. */
const REFERRAL_TONE: Record<Enums<"referral_status">, Tone> = {
  pending: "neutral",
  qualified: "blue",
  rewarded: "green",
  void: "neutral",
};

/**
 * The founder's console: the cohort in figures, then agents, referrals and
 * free months as edge-to-edge tables, with the by-hand billing actions on
 * each agent's row.
 */
export function AdminView({ overview }: { overview: AdminOverview }) {
  const t = useTranslations("admin");
  const billing = useTranslations("billing");
  const tag = intlTag(useLocale());
  const when = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(tag, { day: "numeric", month: "short" }) : "—";
  const { founderCount, profiles, referrals, credits } = overview;
  const plans = profiles.map((p) => planState(p));
  const proCount = plans.filter((p) => p.tier === "pro").length;
  const compedCount = plans.filter((p) => p.source === "comp").length;
  const rewardedCount = referrals.filter((r) => r.status === "rewarded").length;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground max-w-3xl text-sm text-pretty">{t("subtitle")}</p>

      <StatStrip
        items={[
          {
            label: t("stats.founders"),
            value: `${founderCount} / ${FOUNDING_CAP}`,
            hint: t("stats.foundersHint", { cap: FOUNDING_CAP }),
          },
          {
            label: t("stats.agents"),
            value: profiles.length,
            hint: t("stats.agentsHint", { limit: FREE_CLIENT_LIMIT }),
          },
          {
            label: t("stats.pro"),
            value: proCount,
            hint: t("stats.proHint", { count: compedCount }),
          },
          {
            label: t("stats.referrals"),
            value: referrals.length,
            hint: t("stats.referralsHint", { count: rewardedCount }),
          },
        ]}
      />

      <Panel
        title={t("agents.title")}
        icon={<Users className="size-3.5" />}
        count={profiles.length}
        footer={t("agents.description")}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("agents.columns.agent")}</TableHead>
              <TableHead>{t("agents.columns.plan")}</TableHead>
              <TableHead>{t("agents.columns.status")}</TableHead>
              <TableHead className="text-right">{t("agents.columns.clients")}</TableHead>
              <TableHead>{t("agents.columns.stripe")}</TableHead>
              <TableHead className="pr-4">{t("agents.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p, i) => {
              const plan = plans[i];
              const atCap = plan.tier === "free" && p.clientCount >= FREE_CLIENT_LIMIT;
              const display = p.full_name || p.email || p.id.slice(0, 8);
              const planLine = p.plan
                ? planName(billing, p.plan)
                : plan.proUntil
                  ? t("agents.until", { date: when(plan.proUntil) })
                  : null;
              return (
                <TableRow key={p.id}>
                  <TableCell className="py-2 pl-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium uppercase"
                      >
                        {initialsOf(display)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{display}</p>
                        {p.email && p.email !== display ? (
                          <p className="text-muted-foreground truncate text-xs">{p.email}</p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      {/* Pro is a quiet grey fill (comped time blue), Free an outline:
                          a column of solid ink pills shouted louder than the data. */}
                      {plan.tier === "pro" ? (
                        <Tag tone={plan.source === "comp" ? "blue" : "grey"}>
                          {plan.source === "comp" ? t("agents.proComped") : t("agents.pro")}
                        </Tag>
                      ) : (
                        <Tag>{t("agents.free")}</Tag>
                      )}
                      {p.founding_number != null ? (
                        <Tag>
                          <Sparkles />
                          {t("agents.founding", { number: p.founding_number })}
                        </Tag>
                      ) : null}
                      {p.is_admin ? (
                        <span className="text-muted-foreground text-xs">{t("agents.admin")}</span>
                      ) : null}
                    </div>
                    {planLine ? (
                      <p className="text-muted-foreground mt-1 text-xs">{planLine}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Tag tone={STATUS_TONE[p.subscription_status]}>
                      {enumLabel(p.subscription_status)}
                    </Tag>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.clientCount}
                    {atCap ? (
                      <span className={cn("ml-1.5 text-xs", TONE_INK.amber)}>
                        {t("agents.atCap")}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {p.stripe_customer_id ?? "—"}
                  </TableCell>
                  <TableCell className="py-2 pr-4 whitespace-normal">
                    {/* The by-hand actions on two fixed lines (billing events, then
                        comp and status), so every row lines up the same way. */}
                    <div className="flex min-w-64 flex-col items-start gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <form action={adminRecordPaidInvoice}>
                          <input type="hidden" name="userId" value={p.id} />
                          <Button type="submit" size="xs" variant="outline">
                            {t("agents.paidInvoice")}
                          </Button>
                        </form>
                        {p.founding_number == null ? (
                          <form action={adminAllocateFounding}>
                            <input type="hidden" name="userId" value={p.id} />
                            <Button type="submit" size="xs" variant="outline">
                              {t("agents.makeFounder")}
                            </Button>
                          </form>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <form action={adminCompMonth} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={p.id} />
                          <Input
                            name="months"
                            type="number"
                            min={1}
                            max={12}
                            defaultValue={1}
                            aria-label={t("agents.monthsToComp")}
                            className="h-7 w-12 px-2 text-xs md:text-xs"
                          />
                          <Button type="submit" size="xs" variant="outline">
                            {t("agents.comp")}
                          </Button>
                        </form>
                        <form action={adminSetStatus} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={p.id} />
                          <select
                            name="status"
                            defaultValue={p.subscription_status}
                            aria-label={t("agents.columns.status")}
                            className="border-input bg-background h-7 rounded-md border px-1.5 text-xs"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {enumLabel(s)}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="xs" variant="ghost">
                            {t("agents.set")}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>

      <Panel
        title={t("referrals.title")}
        icon={<Gift className="size-3.5" />}
        count={referrals.length}
        footer={t("referrals.description")}
      >
        {referrals.length === 0 ? (
          <PanelEmpty>{t("referrals.empty")}</PanelEmpty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("referrals.columns.referrer")}</TableHead>
                <TableHead>{t("referrals.columns.referred")}</TableHead>
                <TableHead>{t("referrals.columns.status")}</TableHead>
                <TableHead className="text-right">{t("referrals.columns.paidInvoices")}</TableHead>
                <TableHead className="pr-4">{t("referrals.columns.rewarded")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-4 text-[13px]">
                    {r.inviterEmail ?? r.inviter_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {r.inviteeEmail ?? r.invitee_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Tag tone={REFERRAL_TONE[r.status]}>{enumLabel(r.status)}</Tag>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.paid_invoice_count}</TableCell>
                  <TableCell className="text-muted-foreground pr-4 text-[13px]">
                    {when(r.rewarded_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Panel
        title={t("credits.title")}
        icon={<Coins className="size-3.5" />}
        count={credits.length}
        footer={t("credits.description")}
      >
        {credits.length === 0 ? (
          <PanelEmpty>{t("credits.empty")}</PanelEmpty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("credits.columns.agent")}</TableHead>
                <TableHead>{t("credits.columns.kind")}</TableHead>
                <TableHead className="text-right">{t("credits.columns.value")}</TableHead>
                <TableHead>{t("credits.columns.reason")}</TableHead>
                <TableHead className="pr-4">{t("credits.columns.applied")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-4 text-[13px]">
                    {c.agentEmail ?? c.agent_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Tag tone={c.kind === "pro_time" ? "blue" : "neutral"}>
                      {c.kind === "pro_time" ? t("credits.kind.proTime") : t("credits.kind.balance")}
                    </Tag>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.kind === "pro_time"
                      ? t("credits.months", { count: c.months })
                      : `€${Number(c.amount_eur)}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{c.reason}</TableCell>
                  <TableCell className="pr-4">
                    {c.applied_to_stripe ? (
                      <Tag tone="green">{t("credits.applied")}</Tag>
                    ) : (
                      <Tag>{t("credits.pending")}</Tag>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
