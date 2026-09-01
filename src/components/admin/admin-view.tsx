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
  adminRecordPaidInvoice,
  adminRevokeInvite,
  adminSeedInvites,
  adminSetStatus,
} from "@/lib/actions/referrals";
import type { AdminOverview } from "@/lib/data/referrals";
import { FOUNDING_CAP, formatInviteCode, joinPath } from "@/lib/invites";
import { SITE_URL } from "@/lib/site";

const STATUSES = ["none", "trialing", "active", "past_due", "canceled"] as const;

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
}

export function AdminView({ overview }: { overview: AdminOverview }) {
  const { founderCount, profiles, invites, referrals, credits } = overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground text-sm">
          Founding cohort, invites and referrals. Until Stripe webhooks are live, payments are
          recorded here by hand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl tabular-nums">
              {founderCount} / {FOUNDING_CAP}
            </CardTitle>
            <CardDescription>Founding Agents allocated. Numbers only go to paying founders.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Seed invites</CardTitle>
            <CardDescription>Founder codes, no inviter. Share the link over WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={adminSeedInvites} className="flex flex-wrap items-end gap-2">
              <div className="w-20">
                <label className="text-muted-foreground text-xs" htmlFor="count">
                  Count
                </label>
                <Input id="count" name="count" type="number" min={1} max={20} defaultValue={3} />
              </div>
              <div className="min-w-40 flex-1">
                <label className="text-muted-foreground text-xs" htmlFor="note">
                  Note
                </label>
                <Input id="note" name="note" placeholder="e.g. Marbella WhatsApp group" />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>
            &quot;Paid invoice&quot; does what the Stripe webhook will do: marks them active, allocates a
            Founding number if they were invited, and counts the invoice towards the referral reward.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial ends</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.full_name || p.email || p.id.slice(0, 8)}</div>
                    <div className="text-muted-foreground text-xs">{p.email}</div>
                  </TableCell>
                  <TableCell>
                    {p.founding_number != null ? (
                      <Badge>Founding #{p.founding_number}</Badge>
                    ) : p.founding_intent ? (
                      <Badge variant="warning">Founding intent</Badge>
                    ) : (
                      <Badge variant="outline">Standard</Badge>
                    )}
                    {p.is_admin ? <span className="text-muted-foreground ml-2 text-xs">admin</span> : null}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{p.subscription_status}</span>
                  </TableCell>
                  <TableCell className="text-xs">{when(p.trial_ends_at)}</TableCell>
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
                      {p.founding_intent && p.founding_number == null ? (
                        <form action={adminAllocateFounding}>
                          <input type="hidden" name="userId" value={p.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Make founder
                          </Button>
                        </form>
                      ) : null}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Inviter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Redeemed by</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Note</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No invites yet. Seed a few above.
                  </TableCell>
                </TableRow>
              ) : (
                invites.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-mono text-xs tracking-wider">{formatInviteCode(i.code)}</div>
                      <div className="text-muted-foreground text-xs">{`${SITE_URL}${joinPath(i.code)}`}</div>
                    </TableCell>
                    <TableCell className="text-xs">{i.inviterEmail ?? "founder"}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{i.status}</span>
                    </TableCell>
                    <TableCell className="text-xs">{i.redeemedEmail ?? "—"}</TableCell>
                    <TableCell className="text-xs">{when(i.expires_at)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{i.note ?? ""}</TableCell>
                    <TableCell>
                      {i.status === "active" ? (
                        <form action={adminRevokeInvite}>
                          <input type="hidden" name="inviteId" value={i.id} />
                          <Button type="submit" size="sm" variant="ghost">
                            Revoke
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>Qualifies at the invitee&apos;s second paid invoice; both sides are credited €19.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inviter</TableHead>
                <TableHead>Invitee</TableHead>
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
          <CardTitle>Credits</CardTitle>
          <CardDescription>Applied to Stripe automatically once the agent has a Stripe customer.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No credits yet.
                  </TableCell>
                </TableRow>
              ) : (
                credits.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{c.agentEmail ?? c.agent_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs tabular-nums">€{Number(c.amount_eur)}</TableCell>
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
