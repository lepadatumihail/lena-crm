import Link from "next/link";
import { ArrowRight, CalendarPlus, ClipboardPaste, Plus } from "lucide-react";

import { getCalendarEvents } from "@/lib/data/calendar";
import { getCommissionSummary } from "@/lib/data/buyer";
import {
  getNeedsAttention,
  getPipelineCounts,
  type StageCount,
} from "@/lib/data/dashboard";
import { UpcomingPanel } from "@/components/home/upcoming-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientsPath, formatCurrency } from "@/lib/crm";
import { cn } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

const ATTENTION_DOT: Record<string, string> = {
  stalled_offer: "bg-primary",
  follow_up: "bg-warning",
  reservation: "bg-success",
};

export default async function HomePage() {
  const now = new Date().getTime();
  const [events, commission, attention, counts] = await Promise.all([
    getCalendarEvents(
      new Date(now - 60 * 60 * 1000).toISOString(),
      new Date(now + 30 * DAY).toISOString()
    ),
    getCommissionSummary(),
    getNeedsAttention(),
    getPipelineCounts(),
  ]);

  const hasCommission =
    commission && (commission.pipeline > 0 || commission.closed > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-muted-foreground text-sm">
          Everything that needs you, in one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/clients/new?side=buyer">
            <Plus /> New buyer
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/clients/new?side=seller">
            <Plus /> New seller
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/calendar">
            <CalendarPlus /> New appointment
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/clients/new?side=buyer">
            <ClipboardPaste /> Paste a lead
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming</CardTitle>
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link href="/calendar">
                Calendar <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <UpcomingPanel events={events} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Needs attention
              {attention.length > 0 && (
                <Badge variant="secondary">{attention.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                You&apos;re all caught up. Nice.
              </p>
            ) : (
              <div className="space-y-2">
                {attention.slice(0, 8).map((a) => (
                  <Link
                    key={a.id}
                    href={a.href}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        ATTENTION_DOT[a.kind] ?? "bg-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {a.detail}
                      </p>
                    </div>
                    <span className="text-primary shrink-0 text-xs font-medium">
                      {a.kind === "reservation" ? "Open" : "Draft"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PipelineRow
            label="Buyers"
            href={clientsPath("buyer")}
            total={counts.buyerTotal}
            stages={counts.buyer}
          />
          <PipelineRow
            label="Sellers"
            href={clientsPath("seller")}
            total={counts.sellerTotal}
            stages={counts.seller}
          />
          {hasCommission && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              {commission.pipeline > 0 && (
                <Badge variant="warning">
                  {formatCurrency(commission.pipeline)} in pipeline
                </Badge>
              )}
              {commission.closed > 0 && (
                <Badge variant="success">
                  {formatCurrency(commission.closed)} closed
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineRow({
  label,
  href,
  total,
  stages,
}: {
  label: string;
  href: string;
  total: number;
  stages: StageCount[];
}) {
  return (
    <div>
      <Link href={href} className="text-sm font-medium hover:underline">
        {label} <span className="text-muted-foreground">({total})</span>
      </Link>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {stages.map((s) => (
          <span
            key={s.stage}
            className="bg-muted rounded-full px-2 py-0.5 text-xs"
          >
            {s.label} <span className="font-semibold">{s.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
