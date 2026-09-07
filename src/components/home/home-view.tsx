import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  CalendarPlus,
  Euro,
  Kanban,
  Plus,
  Users,
} from "lucide-react";

import type { CalendarEvent } from "@/lib/data/calendar";
import type { AttentionItem, HomeOverview } from "@/lib/data/dashboard";
import { intlTag } from "@/i18n/config";
import { sideLabel, stageLabel } from "@/i18n/labels";
import { UpcomingPanel } from "@/components/home/upcoming-panel";
import { StatTiles, type StatTile } from "@/components/home/stat-tiles";
import { PipelineBar } from "@/components/home/pipeline-bar";
import { RecentClients } from "@/components/home/recent-clients";
import { OnboardingCard } from "@/components/home/onboarding-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientsPath, formatCurrency, type ClientSide } from "@/lib/crm";
import {
  AGENT_TIME_ZONE,
  buyersBeforeViewing,
  countViewingsWithin,
  greetingPeriod,
  hourInTimeZone,
  onboardingSteps,
  showOnboarding,
} from "@/lib/home";
import { cn } from "@/lib/utils";

const ATTENTION_DOT: Record<string, string> = {
  new_lead: "bg-primary",
  stalled_offer: "bg-primary",
  follow_up: "bg-warning",
  reservation: "bg-success",
};

export type HomeViewProps = {
  events: CalendarEvent[];
  commission: { pipeline: number; closed: number };
  attention: AttentionItem[];
  overview: HomeOverview;
  /** The instant the page is rendered for; injectable for previews. */
  now?: Date;
};

/** The Home cockpit, given its data. `home/page.tsx` does the fetching. */
export async function HomeView({
  events,
  commission,
  attention,
  overview,
  now = new Date(),
}: HomeViewProps) {
  const t = await getTranslations("home");
  const tCrm = await getTranslations("crm");
  const locale = await getLocale();
  const tag = intlTag(locale);
  const nowISO = now.toISOString();
  const { counts, recent, onboarding, firstName } = overview;

  const greeting = t(`greeting.${greetingPeriod(hourInTimeZone(nowISO, AGENT_TIME_ZONE))}`, {
    name: firstName ? t("greeting.named", { name: firstName }) : "",
  });
  const dateLabel = new Intl.DateTimeFormat(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: AGENT_TIME_ZONE,
  }).format(now);

  const viewingsThisWeek = countViewingsWithin(events, nowISO, 7);
  const tiles: StatTile[] = [
    {
      label: t("stats.buyers"),
      value: String(counts.buyerTotal),
      href: clientsPath("buyer"),
      icon: Users,
    },
    {
      label: t("stats.sellers"),
      value: String(counts.sellerTotal),
      href: clientsPath("seller"),
      icon: Building2,
    },
    {
      label: t("stats.viewings"),
      value: String(viewingsThisWeek),
      href: "/calendar",
      icon: CalendarDays,
    },
    {
      label: t("stats.commission"),
      value: formatCurrency(commission.pipeline, tag),
      hint:
        commission.closed > 0
          ? t("stats.commissionClosed", {
              amount: formatCurrency(commission.closed, tag),
            })
          : commission.pipeline === 0
            ? t("stats.commissionHint")
            : null,
      href: `${clientsPath("buyer")}?stage=reserved`,
      icon: Euro,
    },
  ];

  const steps = onboardingSteps(onboarding).map((s) => ({
    ...s,
    title: t(`onboarding.steps.${s.step}.title`),
    detail: t(`onboarding.steps.${s.step}.detail`),
  }));

  const pipelineStages = (side: ClientSide) =>
    (side === "buyer" ? counts.buyer : counts.seller).map((s) => ({
      stage: s.stage,
      label: stageLabel(tCrm, s.stage),
      count: s.count,
      title: t("pipeline.viewStage", {
        stage: stageLabel(tCrm, s.stage).toLowerCase(),
        side: sideLabel(tCrm, side, true).toLowerCase(),
      }),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground text-sm first-letter:uppercase">
            {dateLabel}
          </p>
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
        </div>
      </div>

      {showOnboarding(onboarding) && (
        <OnboardingCard
          title={t("onboarding.title")}
          subtitle={t("onboarding.subtitle", {
            done: steps.filter((s) => s.done).length,
            total: steps.length,
          })}
          steps={steps}
        />
      )}

      <StatTiles tiles={tiles} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
            <UpcomingPanel
              events={events}
              waitingBuyers={buyersBeforeViewing(counts.buyer)}
            />
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
              <p className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
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
                      {a.href.includes("compose=")
                        ? t("attention.draft")
                        : t("attention.open")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="text-primary size-4" />
              {t("recent.title")}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <Link href={clientsPath("buyer")}>
                {t("recent.all")} <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentClients
              clients={recent}
              intlTag={tag}
              nowISO={nowISO}
              emptyLabel={t("recent.empty")}
              priorityLabel={t("recent.priority")}
              nowLabel={t("recent.now")}
              sideLabel={(side) => sideLabel(tCrm, side)}
              stageLabel={(stage) => stageLabel(tCrm, stage)}
            />
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
        <CardContent className="grid gap-6 md:grid-cols-2">
          <PipelineBar
            side="buyer"
            label={sideLabel(tCrm, "buyer", true)}
            total={counts.buyerTotal}
            emptyLabel={t("pipeline.empty", {
              side: sideLabel(tCrm, "buyer", true).toLowerCase(),
            })}
            stages={pipelineStages("buyer")}
          />
          <PipelineBar
            side="seller"
            label={sideLabel(tCrm, "seller", true)}
            total={counts.sellerTotal}
            emptyLabel={t("pipeline.empty", {
              side: sideLabel(tCrm, "seller", true).toLowerCase(),
            })}
            stages={pipelineStages("seller")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
