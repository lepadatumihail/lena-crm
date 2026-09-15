"use client";

import { useLocale, useTranslations } from "next-intl";
import { format, parseISO, subDays } from "date-fns";
import { Loader2 } from "lucide-react";

import { Panel, PanelEmpty } from "@/components/shell/panel";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { TaskItem } from "@/components/tasks/task-item";
import { Button } from "@/components/ui/button";
import { dateFnsLocale } from "@/i18n/dates";
import { taskStatusLabel } from "@/i18n/labels";
import type { TaskRow } from "@/lib/data/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import { TASK_STATUS_TONES, type TaskPriority, type TaskStatus } from "@/lib/tasks";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";

type ItemHandlers = {
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
};

/** Open tasks in one surface, a section per status that has any. */
export function TaskList({
  groups,
  todayKey,
  onOpen,
  onStatusChange,
  onPriorityChange,
}: {
  groups: { status: TaskStatus; tasks: TaskRow[] }[];
  todayKey: string;
} & ItemHandlers) {
  const tCrm = useTranslations("crm");

  return (
    <div className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-xs">
      {groups
        .filter((group) => group.tasks.length > 0)
        .map((group) => (
          <section key={group.status} className="border-t first:border-t-0">
            <header className="bg-muted/30 flex h-[38px] items-center gap-2 border-b px-4">
              <span
                aria-hidden
                className={cn("size-2 rounded-full", TONE_SOLID[TASK_STATUS_TONES[group.status]])}
              />
              <h3 className="label-caps text-muted-foreground">{taskStatusLabel(tCrm, group.status)}</h3>
              <span className="bg-muted text-muted-foreground inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums">
                {group.tasks.length}
              </span>
            </header>
            <ul className="divide-y">
              {group.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  todayKey={todayKey}
                  onOpen={onOpen}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

type DayGroup = { key: string; rows: TaskRow[] };

/** Rows arrive newest completed first, so consecutive rows share a day: the agent's day. */
function groupDoneByDay(rows: TaskRow[], timeZone: string): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const row of rows) {
    const key = dateKeyInTimeZone(row.completed_at ?? row.updated_at, timeZone);
    const last = groups.at(-1);
    if (last?.key === key) last.rows.push(row);
    else groups.push({ key, rows: [row] });
  }
  return groups;
}

/** Done tasks, one panel per day completed, with "Load more" below. */
export function DoneList({
  rows,
  todayKey,
  hasMore,
  loadingMore,
  onLoadMore,
  emptyMessage,
  onOpen,
  onStatusChange,
  onPriorityChange,
}: {
  /** Already sorted by sortDoneTasks. */
  rows: TaskRow[];
  todayKey: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  /** Shown in an empty panel when there are no rows; null shows nothing. */
  emptyMessage: string | null;
} & ItemHandlers) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const timeZone = useAgentTimeZone();
  const yesterdayKey = format(subDays(parseISO(todayKey), 1), "yyyy-MM-dd");

  function dayLabel(key: string) {
    if (key === todayKey) return tCommon("today");
    if (key === yesterdayKey) return t("done.yesterday");
    const label = format(parseISO(key), "EEEE d MMMM", { locale: dateFnsLocale(locale) });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        emptyMessage ? (
          <Panel>
            <PanelEmpty className="py-16">{emptyMessage}</PanelEmpty>
          </Panel>
        ) : null
      ) : (
        groupDoneByDay(rows, timeZone).map((group) => (
          <Panel key={group.key} title={dayLabel(group.key)} count={group.rows.length}>
            <ul className="divide-y">
              {group.rows.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  todayKey={todayKey}
                  onOpen={onOpen}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                />
              ))}
            </ul>
          </Panel>
        ))
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? <Loader2 className="animate-spin" /> : null}
            {t("done.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
