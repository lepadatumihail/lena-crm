import { useLocale, useTranslations } from "next-intl";
import { BellRing, Building2, CalendarDays, Euro, Users } from "lucide-react";

import { AttentionList } from "@/components/home/attention-list";
import { OnboardingCard } from "@/components/home/onboarding-card";
import { RecentClients } from "@/components/home/recent-clients";
import {
  StatTiles,
  type StatSegment,
  type StatTile,
} from "@/components/home/stat-tiles";
import { UpcomingPanel } from "@/components/home/upcoming-panel";
import { Panel, PanelAction } from "@/components/shell/panel";
import { Money } from "@/components/ui/money";
import { intlTag } from "@/i18n/config";
import { sideLabel, stageLabel } from "@/i18n/labels";
import {
  clientsPath,
  formatCurrency,
  STAGE_TONES,
  type ClientSide,
} from "@/lib/crm";
import type { CalendarEvent } from "@/lib/data/calendar";
import type {
  AttentionItem,
  PipelineCounts,
  RecentClient,
} from "@/lib/data/dashboard";
import {
  countViewingsWithin,
  onboardingSteps,
  pipelineSegments,
  showOnboarding,
  type OnboardingInput,
} from "@/lib/home";

const ATTENTION_LIMIT = 8;

/*
  Home's sections, given their data. home-sections.tsx loads the data and
  home-skeletons.tsx draws the same shapes while it loads.
*/

/** The getting-started checklist (young accounts only) and the four headline figures. */
export function SummaryPanel({
  counts,
  onboarding,
  events,
  commission,
  now,
}: {
  counts: PipelineCounts;
  onboarding: OnboardingInput;
  events: CalendarEvent[];
  commission: { pipeline: number; closed: number };
  now: Date;
}) {
  const t = useTranslations("home");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());

  const bar = (side: ClientSide): StatSegment[] =>
    pipelineSegments(side === "buyer" ? counts.buyer : counts.seller).map((s) => ({
      tone: STAGE_TONES[s.stage],
      percent: s.percent,
      label: `${stageLabel(tCrm, s.stage)} ${s.count}`,
    }));

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
      value: String(countViewingsWithin(events, now.toISOString(), 7)),
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
    <>
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
    </>
  );
}

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const t = useTranslations("home.attention");
  return (
    <Panel
      className="h-full"
      title={t("title")}
      icon={<BellRing className="size-3.5" />}
      count={items.length}
    >
      <AttentionList
        items={items.slice(0, ATTENTION_LIMIT)}
        emptyLabel={t("empty")}
        openLabel={t("open")}
        draftLabel={t("draft")}
      />
    </Panel>
  );
}

export function UpcomingEventsPanel({
  events,
  waitingBuyers,
  now,
}: {
  events: CalendarEvent[];
  /** Buyers who haven't reached the viewing stage; shapes the empty state. */
  waitingBuyers: number;
  now: Date;
}) {
  const t = useTranslations("home.upcoming");
  return (
    <Panel
      className="h-full"
      title={t("title")}
      icon={<CalendarDays className="size-3.5" />}
      action={<PanelAction href="/calendar">{t("calendar")}</PanelAction>}
    >
      <UpcomingPanel
        events={events}
        waitingBuyers={waitingBuyers}
        nowISO={now.toISOString()}
      />
    </Panel>
  );
}

export function RecentClientsPanel({
  clients,
  now,
}: {
  clients: RecentClient[];
  now: Date;
}) {
  const t = useTranslations("home.recent");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());
  return (
    <Panel
      title={t("title")}
      icon={<Users className="size-3.5" />}
      action={<PanelAction href={clientsPath("buyer")}>{t("all")}</PanelAction>}
    >
      <RecentClients
        clients={clients}
        intlTag={tag}
        nowISO={now.toISOString()}
        columns={{
          client: t("columns.client"),
          stage: t("columns.stage"),
          amount: t("columns.amount"),
          updated: t("columns.updated"),
        }}
        emptyLabel={t("empty")}
        priorityLabel={t("priority")}
        nowLabel={t("now")}
        sideLabel={(side) => sideLabel(tCrm, side)}
      />
    </Panel>
  );
}
