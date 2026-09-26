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
    <div className="grid grid-cols-2 gap-3 max-md:order-2 xl:grid-cols-4">
      <Loading />
      {TILE_LABELS.map((width) => (
        <div
          key={width}
          aria-hidden
          className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-4 shadow-xs"
        >
          {/* The label row is one 18px line from sm up and two lines on a
              phone, as the tiles keep (stat-tiles.tsx). */}
          <div className="flex h-[18px] items-center justify-between gap-2 max-sm:h-[2lh] max-sm:items-start max-sm:text-xs max-sm:leading-snug">
            <Skeleton className={cn("h-3 max-sm:mt-0.5", width)} />
            <Skeleton className="size-4 rounded" />
          </div>
          <Skeleton className="h-6 w-16" />
          <div className="flex h-4 items-center">
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
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

export function AttentionSkeleton() {
  const t = useTranslations("home.attention");
  return (
    <Panel title={t("title")} icon={<BellRing className="size-3.5" />}>
      <Loading />
      <ul aria-hidden className="divide-y">
        {ATTENTION_ROWS.map(([name, detail]) => (
          <li key={name + detail} className="flex h-11 items-center gap-3 px-4">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className={cn("h-3", name)} />
            <Skeleton className={cn("hidden h-2.5 sm:block", detail)} />
            <Skeleton className="ml-auto h-2.5 w-8" />
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

const UPCOMING_ROWS = ["w-44", "w-36", "w-48", "w-32"];

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
          <li key={width} className="flex items-center gap-3 px-4 py-2.5">
            {/* The real row's day column and its two text lines (36px). */}
            <div className="flex h-9 w-[4.75rem] shrink-0 flex-col justify-center gap-1.5">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-2.5 w-8" />
            </div>
            <Skeleton className="size-2 shrink-0 rounded-full" />
            <div className="flex h-9 min-w-0 flex-1 flex-col justify-center gap-2">
              <Skeleton className={cn("h-3", width)} />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const RECENT_ROWS = ["w-28", "w-32", "w-24", "w-36", "w-28"];

export function RecentSkeleton() {
  const t = useTranslations("home.recent");
  return (
    <Panel
      title={t("title")}
      icon={<Users className="size-3.5" />}
      action={<PanelAction href={clientsPath("buyer")}>{t("all")}</PanelAction>}
    >
      <Loading />
      <div aria-hidden>
        <div className="flex h-[38px] items-center gap-4 border-b px-4">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="ml-[20%] h-2.5 w-10" />
          <Skeleton className="ml-auto h-2.5 w-14" />
          <Skeleton className="h-2.5 w-14" />
        </div>
        {RECENT_ROWS.map((width, i) => (
          <div
            key={width + i}
            className="flex h-[42px] items-center gap-4 border-b px-4 last:border-b-0"
          >
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <Skeleton className={cn("h-3", width)} />
            <Skeleton className="ml-[8%] h-[22px] w-20 rounded-full" />
            <Skeleton className="ml-auto h-3 w-20" />
            <Skeleton className="hidden h-2.5 w-20 sm:block" />
          </div>
        ))}
      </div>
    </Panel>
  );
}
