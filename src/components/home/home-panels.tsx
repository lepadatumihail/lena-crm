import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { BellRing, CalendarDays, Users } from "lucide-react";

import { AttentionList } from "@/components/home/attention-list";
import { RecentClients } from "@/components/home/recent-clients";
import {
  StatTiles,
  type StatFooter,
  type StatTile,
} from "@/components/home/stat-tiles";
import { UpcomingPanel } from "@/components/home/upcoming-panel";
import { Panel, PanelAction } from "@/components/shell/panel";
import { Money } from "@/components/ui/money";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { sideLabel, stageLabel } from "@/i18n/labels";
import { EVENT_TONES } from "@/lib/calendar";
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
import { pipelineSegments } from "@/lib/home";

const ATTENTION_LIMIT = 8;

/*
  Home's sections, given their data. home-sections.tsx loads the data and
  home-skeletons.tsx draws the same shapes while it loads.
*/

/** The four headline figures. */
export function SummaryPanel({
  counts,
  added,
  viewings,
  commission,
}: {
  counts: PipelineCounts;
  /** Clients added in the last 30 days, per side. */
  added: { buyer: number; seller: number };
  /** Viewings on each of the next seven days, today first. */
  viewings: { key: string; count: number }[];
  commission: { pipeline: number; closed: number };
}) {
  const t = useTranslations("home");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const tag = intlTag(locale);
  const dateLocale = dateFnsLocale(locale);

  const bar = (side: ClientSide): StatFooter => {
    const segments = pipelineSegments(side === "buyer" ? counts.buyer : counts.seller).map(
      (s) => ({
        tone: STAGE_TONES[s.stage],
        percent: s.percent,
        label: `${stageLabel(tCrm, s.stage)} ${s.count}`,
      })
    );
    return { kind: "bar", segments, label: segments.map((s) => s.label).join(", ") };
  };

  // "+2 in 30 days", the figure in green: the book is growing.
  const growth = (count: number): ReactNode =>
    count > 0 ? (
      <span title={t("stats.addedTitle", { count })}>
        {t.rich("stats.added", {
          count,
          up: (chunks) => (
            <span className="text-tone-green-ink font-medium tabular-nums">{chunks}</span>
          ),
        })}
      </span>
    ) : null;

  const days = viewings.map((d, i) => {
    const date = parseISO(d.key);
    return {
      key: d.key,
      title: t("stats.viewingsOn", {
        date: format(date, "EEEE d MMM", { locale: dateLocale }),
        count: d.count,
      }),
      count: d.count,
      today: i === 0,
    };
  });

  const tiles: StatTile[] = [
    {
      label: t("stats.buyers"),
      value: String(counts.buyerTotal),
      aside: growth(added.buyer),
      footer: bar("buyer"),
      href: clientsPath("buyer"),
    },
    {
      label: t("stats.sellers"),
      value: String(counts.sellerTotal),
      aside: growth(added.seller),
      footer: bar("seller"),
      href: clientsPath("seller"),
    },
    {
      label: t("stats.viewings"),
      value: String(viewings.reduce((sum, d) => sum + d.count, 0)),
      footer: {
        kind: "days",
        days,
        tone: EVENT_TONES.viewing,
        label: days.map((d) => d.title).join(", "),
      },
      href: "/calendar",
    },
    {
      label: t("stats.commission"),
      value: <Money value={commission.pipeline} locale={tag} />,
      footer:
        commission.closed > 0
          ? {
              kind: "note",
              tone: "green",
              text: t("stats.commissionClosed", {
                amount: formatCurrency(commission.closed, tag),
              }),
            }
          : commission.pipeline === 0
            ? { kind: "note", text: t("stats.commissionHint") }
            : undefined,
      href: `${clientsPath("buyer")}?stage=reserved`,
    },
  ];

  return <StatTiles tiles={tiles} />;
}

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const t = useTranslations("home.attention");
  return (
    <Panel
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
    // Sized to its rows, not stretched to the left column: a short week
    // leaves page space under the card, not an empty card.
    <Panel
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
        emptyLabel={t("empty")}
        priorityLabel={t("priority")}
        nowLabel={t("now")}
        sideLabel={(side) => sideLabel(tCrm, side)}
      />
    </Panel>
  );
}
