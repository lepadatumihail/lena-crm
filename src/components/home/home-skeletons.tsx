import { useTranslations } from "next-intl";
import { BellRing, CalendarDays, ListChecks, Users } from "lucide-react";

import { Panel, PanelAction } from "@/components/shell/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { clientsPath } from "@/lib/crm";
import { cn } from "@/lib/utils";

/*
  Placeholders in the shape of each Home section: the same panel header, the
  same row heights. loading.tsx shows them the instant Home is navigated to,
  and the page's Suspense boundaries keep them up until each section's data
  lands, so the swap changes content without moving anything.
*/

function Loading() {
  const tCommon = useTranslations("common");
  return <span className="sr-only">{tCommon("loading")}</span>;
}

/** The summary line under the greeting: one line of text. */
export function DaySummarySkeleton() {
  return (
    <div className="flex h-5 items-center">
      <Loading />
      <Skeleton aria-hidden className="h-3 w-72 max-w-full" />
    </div>
  );
}

/**
 * The getting-started strip: the same 44px card, a ring, the progress and
 * the next step, and the two icon buttons. The page only draws it when the
 * strip is expected, so the swap never moves the figures below it.
 */
export function OnboardingStripSkeleton() {
  return (
    <div className="bg-card flex h-11 items-center gap-2.5 rounded-xl border pr-1.5 pl-3 shadow-xs sm:pl-4">
      <Loading />
      <Skeleton aria-hidden className="size-4 shrink-0 rounded-full" />
      <Skeleton aria-hidden className="hidden h-3 w-24 sm:block" />
      <Skeleton aria-hidden className="h-3 w-10 shrink-0" />
      <Skeleton aria-hidden className="h-3 w-44 min-w-0 shrink" />
      <div aria-hidden className="ml-auto flex shrink-0 items-center gap-0.5">
        <span className="flex size-7 items-center justify-center">
          <Skeleton className="size-3.5 rounded-sm" />
        </span>
        <span className="flex size-7 items-center justify-center">
          <Skeleton className="size-3.5 rounded-sm" />
        </span>
      </div>
    </div>
  );
}

const TILE_LABELS = ["w-24", "w-20", "w-28", "w-32"];

export function StatTilesSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs max-md:order-2">
      <Loading />
      <div aria-hidden className="bg-border grid grid-cols-2 gap-px xl:grid-cols-4">
        {TILE_LABELS.map((width) => (
          <div
            key={width}
            className="bg-card row-span-3 grid min-w-0 grid-rows-subgrid gap-y-0 p-4 sm:px-5"
          >
            {/* One line of label, as the figures take where it fits (stat-tiles.tsx). */}
            <div className="flex h-[1lh] items-center text-[13px] leading-snug sm:leading-5">
              <Skeleton className={cn("h-3", width)} />
            </div>
            <div className="mt-2 flex h-8 items-center sm:h-9">
              <Skeleton className="h-6 w-12 sm:h-7" />
            </div>
            <div className="mt-3 flex h-8 items-end">
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ATTENTION_ROWS = [
  ["w-28", "w-40"],
  ["w-24", "w-32"],
  ["w-32", "w-36"],
  ["w-20", "w-28"],
  ["w-28", "w-24"],
];

/** Two-line rows behind a round avatar, as AttentionList draws them. */
export function AttentionSkeleton() {
  const t = useTranslations("home.attention");
  return (
    <Panel title={t("title")} icon={<BellRing className="size-3.5" />}>
      <Loading />
      <ul aria-hidden className="divide-y">
        {ATTENTION_ROWS.map(([name, detail]) => (
          <li key={name + detail} className="flex items-center gap-3 py-2.5 pr-2.5 pl-4">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex h-10 min-w-0 flex-1 flex-col justify-center gap-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className={cn("h-3", name)} />
                <Skeleton className="h-3.5 w-14 rounded-full" />
              </div>
              <Skeleton className={cn("h-2.5", detail)} />
            </div>
            <span className="size-7 shrink-0" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const DUE_TASK_ROWS = ["w-40", "w-32", "w-48"];

export function DueTasksSkeleton() {
  const t = useTranslations("home.dueTasks");
  return (
    <Panel
      title={t("title")}
      icon={<ListChecks className="size-3.5" />}
      action={<PanelAction href="/tasks">{t("all")}</PanelAction>}
    >
      <Loading />
      <ul aria-hidden className="divide-y">
        {DUE_TASK_ROWS.map((width) => (
          <li key={width} className="flex h-11 items-center gap-3 px-4">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className={cn("h-3", width)} />
            <Skeleton className="ml-auto h-[22px] w-16 rounded-full" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const UPCOMING_ROWS = ["w-40", "w-32", "w-44"];

/** A calendar leaf beside a two-line event per day, as UpcomingPanel draws them. */
export function UpcomingSkeleton() {
  const t = useTranslations("home.upcoming");
  return (
    <Panel
      title={t("title")}
      icon={<CalendarDays className="size-3.5" />}
      action={<PanelAction href="/calendar">{t("calendar")}</PanelAction>}
    >
      <Loading />
      <ul aria-hidden className="divide-y">
        {UPCOMING_ROWS.map((width) => (
          <li key={width} className="flex gap-3.5 px-4 py-3">
            <Skeleton className="h-11 w-10 shrink-0 rounded-lg" />
            <div className="flex h-11 min-w-0 flex-1 flex-col justify-center gap-2.5">
              <Skeleton className={cn("h-3", width)} />
              <Skeleton className="ml-3.5 h-2.5 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const RECENT_ROWS = ["w-28", "w-32", "w-24", "w-36", "w-28", "w-32"];

/** Avatar rows with a stage pill, as RecentClients draws them. */
export function RecentSkeleton() {
  const t = useTranslations("home.recent");
  return (
    <Panel
      title={t("title")}
      icon={<Users className="size-3.5" />}
      action={<PanelAction href={clientsPath("buyer")}>{t("all")}</PanelAction>}
    >
      <Loading />
      <ul aria-hidden className="divide-y">
        {RECENT_ROWS.map((width, i) => (
          <li key={width + i} className="flex items-center gap-3 px-4 py-2.5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex h-10 min-w-0 flex-1 flex-col justify-center gap-2.5">
              <Skeleton className={cn("h-3", width)} />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <Skeleton className="h-[22px] w-16 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
