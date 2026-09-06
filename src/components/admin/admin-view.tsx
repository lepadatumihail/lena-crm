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
import { FREE_CLIENT_LIMIT, planState } from "@/lib/access";
import { FOUNDING_CAP, planLabel } from "@/lib/billing";

const STATUSES = ["none", "active", "past_due", "canceled"] as const;

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
}

export function AdminView({ overview }: { overview: AdminOverview }) {
  const { founderCount, profiles, referrals, credits } = overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground text-sm">
          Founding cohort, plans and referrals. Until Stripe webhooks are live, payments are
          recorded here by hand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl tabular-nums">
              {founderCount} / {FOUNDING_CAP}
            </CardTitle>
            <CardDescription>
              Founding Agents allocated. Numbers go to the first {FOUNDING_CAP} paying agents, in
              order of payment.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl tabular-nums">{profiles.length}</CardTitle>
            <CardDescription>
              Agents signed up. Free holds {FREE_CLIENT_LIMIT} clients; Pro is unlimited.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>
            &quot;Paid invoice&quot; does what the Stripe webhook will do: marks them subscribed and
            counts the invoice towards their referrer&apos;s reward. &quot;Comp&quot; gives Pro time
            from the backend, no card involved.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Actions</TableHead>
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
                          <Badge>{plan.source === "comp" ? "Pro · comped" : "Pro"}</Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                        {p.founding_number != null ? (
                          <Badge variant="warning">Founding #{p.founding_number}</Badge>
                        ) : null}
                        {p.is_admin ? (
                          <span className="text-muted-foreground text-xs">admin</span>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {p.plan ? planLabel(p.plan) : plan.proUntil ? `until ${when(plan.proUntil)}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{p.subscription_status}</span>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {p.clientCount}
                      {atCap ? <span className="text-warning ml-1">at cap</span> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {p.stripe_customer_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={adminRecordPaidInvoice}>
                          <input type="hidden" name="userId" value={p.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Paid invoice
                          </Button>
                        </form>
                        {p.founding_number == null ? (
                          <form action={adminAllocateFounding}>
                            <input type="hidden" name="userId" value={p.id} />
                            <Button type="submit" size="sm" variant="outline">
                              Make founder
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
                            aria-label="Months to comp"
                            className="h-8 w-14 text-xs"
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Comp
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
                            Set
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
          <CardTitle>Referrals</CardTitle>
          <CardDescription>
            Qualifies at the referred agent&apos;s second paid invoice; both sides then get a free
            month.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid invoices</TableHead>
                <TableHead>Rewarded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No referrals yet.
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
          <CardTitle>Free months</CardTitle>
          <CardDescription>
            Balance credits are pushed to Stripe once the agent has a Stripe customer. Comped Pro
            time is applied the moment it is granted.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No free months yet.
                  </TableCell>
                </TableRow>
              ) : (
                credits.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{c.agentEmail ?? c.agent_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.kind === "pro_time" ? "pro time" : "balance"}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {c.kind === "pro_time"
                        ? `${c.months} month${c.months === 1 ? "" : "s"}`
                        : `€${Number(c.amount_eur)}`}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.reason}</TableCell>
                    <TableCell className="text-xs">
                      {c.applied_to_stripe ? (
                        <Badge variant="success">applied</Badge>
                      ) : (
                        <Badge variant="outline">pending</Badge>
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
