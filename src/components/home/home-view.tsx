import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  BellRing,
  Building2,
  CalendarDays,
  CalendarPlus,
  Euro,
  Plus,
  Users,
} from "lucide-react";

import type { CalendarEvent } from "@/lib/data/calendar";
import type { AttentionItem, HomeOverview } from "@/lib/data/dashboard";
import { intlTag } from "@/i18n/config";
import { sideLabel, stageLabel } from "@/i18n/labels";
import { AttentionList } from "@/components/home/attention-list";
import { OnboardingCard } from "@/components/home/onboarding-card";
import { RecentClients } from "@/components/home/recent-clients";
import { StatTiles, type StatSegment, type StatTile } from "@/components/home/stat-tiles";
import { UpcomingPanel } from "@/components/home/upcoming-panel";
import { Panel, PanelAction } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import {
  clientsPath,
  formatCurrency,
  STAGE_TONES,
  type ClientSide,
} from "@/lib/crm";
import {
  AGENT_TIME_ZONE,
  buyersBeforeViewing,
  countViewingsWithin,
  greetingPeriod,
  hourInTimeZone,
  onboardingSteps,
  pipelineSegments,
  showOnboarding,
} from "@/lib/home";

const ATTENTION_LIMIT = 8;

export type HomeViewProps = {
  events: CalendarEvent[];
  commission: { pipeline: number; closed: number };
  attention: AttentionItem[];
  overview: HomeOverview;
  /** The instant the page is rendered for; injectable for previews. */
  now?: Date;
};

/**
 * The Home cockpit, given its data. `home/page.tsx` does the fetching.
 * Headline figures first, then what needs doing and what is coming up, then
 * the clients most recently touched. The stage breakdown lives in the
 * sidebar's pipeline group and under the buyer/seller tiles.
 */
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

  const bar = (side: ClientSide): StatSegment[] =>
    pipelineSegments(side === "buyer" ? counts.buyer : counts.seller).map((s) => ({
      tone: STAGE_TONES[s.stage],
      percent: s.percent,
      label: `${stageLabel(tCrm, s.stage)} ${s.count}`,
    }));

  const viewingsThisWeek = countViewingsWithin(events, nowISO, 7);
  const tiles: StatTile[] = [
    {
      label: t("stats.buyers"),
      value: String(counts.buyerTotal),
      href: clientsPath("buyer"),
      icon: Users,
      bar: bar("buyer"),
    },
    {
      label: t("stats.sellers"),
      value: String(counts.sellerTotal),
      href: clientsPath("seller"),
      icon: Building2,
      bar: bar("seller"),
    },
    {
      label: t("stats.viewings"),
      value: String(viewingsThisWeek),
      href: "/calendar",
      icon: CalendarDays,
    },
    {
      label: t("stats.commission"),
      value: <Money value={commission.pipeline} locale={tag} />,
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {greeting}
          </h2>
          <p className="text-muted-foreground text-sm">
            <span className="inline-block first-letter:uppercase">{dateLabel}</span>
            <span className="mx-1.5">·</span>
            {t("subtitle")}
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

      {showOnboarding(onboarding) ? (
        <OnboardingCard
          title={t("onboarding.title")}
          subtitle={t("onboarding.subtitle", {
            done: steps.filter((s) => s.done).length,
            total: steps.length,
          })}
          steps={steps}
        />
      ) : null}

      <StatTiles tiles={tiles} />

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title={t("attention.title")}
          icon={<BellRing className="size-3.5" />}
          count={attention.length}
        >
          <AttentionList
            items={attention.slice(0, ATTENTION_LIMIT)}
            emptyLabel={t("attention.empty")}
            openLabel={t("attention.open")}
            draftLabel={t("attention.draft")}
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title={t("upcoming.title")}
          icon={<CalendarDays className="size-3.5" />}
          action={<PanelAction href="/calendar">{t("upcoming.calendar")}</PanelAction>}
        >
          <UpcomingPanel
            events={events}
            waitingBuyers={buyersBeforeViewing(counts.buyer)}
          />
        </Panel>
      </div>

      <Panel
        title={t("recent.title")}
        icon={<Users className="size-3.5" />}
        action={<PanelAction href={clientsPath("buyer")}>{t("recent.all")}</PanelAction>}
      >
        <RecentClients
          clients={recent}
          intlTag={tag}
          nowISO={nowISO}
          columns={{
            client: t("recent.columns.client"),
            stage: t("recent.columns.stage"),
            amount: t("recent.columns.amount"),
            updated: t("recent.columns.updated"),
          }}
          emptyLabel={t("recent.empty")}
          priorityLabel={t("recent.priority")}
          nowLabel={t("recent.now")}
          sideLabel={(side) => sideLabel(tCrm, side)}
        />
      </Panel>
    </div>
  );
}
