import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarPlus,
  ClipboardPaste,
  Kanban,
  Plus,
} from "lucide-react";

import { getCalendarEvents } from "@/lib/data/calendar";
import { getCommissionSummary } from "@/lib/data/buyer";
import { getNeedsAttention, getPipelineCounts } from "@/lib/data/dashboard";
import { intlTag } from "@/i18n/config";
import { sideLabel, stageLabel } from "@/i18n/labels";
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
  const t = await getTranslations("home");
  const tCrm = await getTranslations("crm");
  const locale = await getLocale();
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/clients/new?side=buyer">
            <Plus /> {t("actions.newBuyer")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/clients/new?side=seller">
            <Plus /> {t("actions.newSeller")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/calendar">
            <CalendarPlus /> {t("actions.newAppointment")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/clients/new?side=buyer">
            <ClipboardPaste /> {t("actions.pasteLead")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="text-primary size-4" />
              {t("upcoming.title")}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link href="/calendar">
                {t("upcoming.calendar")} <ArrowRight />
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
              <BellRing className="text-primary size-4" />
              {t("attention.title")}
              {attention.length > 0 && (
                <Badge variant="secondary">{attention.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("attention.empty")}
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
                      {a.kind === "reservation"
                        ? t("attention.open")
                        : t("attention.draft")}
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Kanban className="text-primary size-4" />
            {t("pipeline.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PipelineRow
            label={sideLabel(tCrm, "buyer", true)}
            href={clientsPath("buyer")}
            total={counts.buyerTotal}
            stages={counts.buyer.map((s) => ({
              stage: s.stage,
              label: stageLabel(tCrm, s.stage),
              count: s.count,
            }))}
          />
          <PipelineRow
            label={sideLabel(tCrm, "seller", true)}
            href={clientsPath("seller")}
            total={counts.sellerTotal}
            stages={counts.seller.map((s) => ({
              stage: s.stage,
              label: stageLabel(tCrm, s.stage),
              count: s.count,
            }))}
          />
          {hasCommission && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              {commission.pipeline > 0 && (
                <Badge variant="warning">
                  {t("pipeline.commissionPipeline", {
                    amount: formatCurrency(commission.pipeline, intlTag(locale)),
                  })}
                </Badge>
              )}
              {commission.closed > 0 && (
                <Badge variant="success">
                  {t("pipeline.commissionClosed", {
                    amount: formatCurrency(commission.closed, intlTag(locale)),
                  })}
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
  /** Stage counts with their labels already translated by the page. */
  stages: { stage: string; label: string; count: number }[];
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
