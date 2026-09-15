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

const TILE_LABELS = ["w-24", "w-20", "w-28", "w-32"];

export function StatTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Loading />
      {TILE_LABELS.map((width) => (
        <div
          key={width}
          aria-hidden
          className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-4 shadow-xs"
        >
          <div className="flex h-4 items-center justify-between gap-2">
            <Skeleton className={cn("h-3", width)} />
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
    <Panel className="flex-1" title={t("title")} icon={<BellRing className="size-3.5" />}>
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
      className="h-full"
      title={t("title")}
      icon={<CalendarDays className="size-3.5" />}
      action={<PanelAction href="/calendar">{t("calendar")}</PanelAction>}
    >
      <Loading />
      <ul aria-hidden className="divide-y">
        {UPCOMING_ROWS.map((width) => (
          <li key={width} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-14 shrink-0 flex-col justify-center gap-1.5">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-2.5 w-8" />
            </div>
            <Skeleton className="size-2 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
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
