import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const STATUSES = ["none", "active", "past_due", "canceled"] as const;

export function AdminView({ overview }: { overview: AdminOverview }) {
  const t = useTranslations("admin");
  const billing = useTranslations("billing");
  const tag = intlTag(useLocale());
  const when = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(tag, { day: "numeric", month: "short" }) : "—";
  const { founderCount, profiles, referrals, credits } = overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl tabular-nums">
              {founderCount} / {FOUNDING_CAP}
            </CardTitle>
            <CardDescription>{t("stats.founders", { cap: FOUNDING_CAP })}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl tabular-nums">{profiles.length}</CardTitle>
            <CardDescription>{t("stats.agents", { limit: FREE_CLIENT_LIMIT })}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("agents.title")}</CardTitle>
          <CardDescription>{t("agents.description")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("agents.columns.agent")}</TableHead>
                <TableHead>{t("agents.columns.plan")}</TableHead>
                <TableHead>{t("agents.columns.status")}</TableHead>
                <TableHead>{t("agents.columns.clients")}</TableHead>
                <TableHead>{t("agents.columns.stripe")}</TableHead>
                <TableHead>{t("agents.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const plan = planState(p);
                const atCap = plan.tier === "free" && p.clientCount >= FREE_CLIENT_LIMIT;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.full_name || p.email || p.id.slice(0, 8)}</div>
                      <div className="text-muted-foreground text-xs">{p.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {plan.tier === "pro" ? (
                          <Badge>
                            {plan.source === "comp" ? t("agents.proComped") : t("agents.pro")}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{t("agents.free")}</Badge>
                        )}
                        {p.founding_number != null ? (
                          <Badge variant="warning">
                            {t("agents.founding", { number: p.founding_number })}
                          </Badge>
                        ) : null}
                        {p.is_admin ? (
                          <span className="text-muted-foreground text-xs">{t("agents.admin")}</span>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {p.plan
                          ? planName(billing, p.plan)
                          : plan.proUntil
                            ? t("agents.until", { date: when(plan.proUntil) })
                            : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{p.subscription_status}</span>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {p.clientCount}
                      {atCap ? (
                        <span className="text-warning ml-1">{t("agents.atCap")}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {p.stripe_customer_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={adminRecordPaidInvoice}>
                          <input type="hidden" name="userId" value={p.id} />
                          <Button type="submit" size="sm" variant="outline">
                            {t("agents.paidInvoice")}
                          </Button>
                        </form>
                        {p.founding_number == null ? (
                          <form action={adminAllocateFounding}>
                            <input type="hidden" name="userId" value={p.id} />
                            <Button type="submit" size="sm" variant="outline">
                              {t("agents.makeFounder")}
                            </Button>
                          </form>
                        ) : null}
                        <form action={adminCompMonth} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={p.id} />
                          <Input
                            name="months"
                            type="number"
                            min={1}
                            max={12}
                            defaultValue={1}
                            aria-label={t("agents.monthsToComp")}
                            className="h-8 w-14 text-xs"
                          />
                          <Button type="submit" size="sm" variant="outline">
                            {t("agents.comp")}
                          </Button>
                        </form>
                        <form action={adminSetStatus} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={p.id} />
                          <select
                            name="status"
                            defaultValue={p.subscription_status}
                            className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="ghost">
                            {t("agents.set")}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("referrals.title")}</CardTitle>
          <CardDescription>{t("referrals.description")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("referrals.columns.referrer")}</TableHead>
                <TableHead>{t("referrals.columns.referred")}</TableHead>
                <TableHead>{t("referrals.columns.status")}</TableHead>
                <TableHead>{t("referrals.columns.paidInvoices")}</TableHead>
                <TableHead>{t("referrals.columns.rewarded")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    {t("referrals.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.inviterEmail ?? r.inviter_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{r.inviteeEmail ?? r.invitee_id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{r.status}</span>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{r.paid_invoice_count}</TableCell>
                    <TableCell className="text-xs">{when(r.rewarded_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("credits.title")}</CardTitle>
          <CardDescription>{t("credits.description")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("credits.columns.agent")}</TableHead>
                <TableHead>{t("credits.columns.kind")}</TableHead>
                <TableHead>{t("credits.columns.value")}</TableHead>
                <TableHead>{t("credits.columns.reason")}</TableHead>
                <TableHead>{t("credits.columns.applied")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    {t("credits.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                credits.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{c.agentEmail ?? c.agent_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.kind === "pro_time" ? t("credits.kind.proTime") : t("credits.kind.balance")}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {c.kind === "pro_time"
                        ? t("credits.months", { count: c.months })
                        : `€${Number(c.amount_eur)}`}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.reason}</TableCell>
                    <TableCell className="text-xs">
                      {c.applied_to_stripe ? (
                        <Badge variant="success">{t("credits.applied")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("credits.pending")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
