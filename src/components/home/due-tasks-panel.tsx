"use client";

import { useOptimistic } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Circle, CircleCheck, ListChecks } from "lucide-react";

import { Panel, PanelAction, PanelEmpty } from "@/components/shell/panel";
import { DueChip } from "@/components/tasks/due-chip";
import { reduceTasks, useTaskActions } from "@/components/tasks/use-task-actions";
import { clientFullName } from "@/lib/crm";
import type { TaskRow } from "@/lib/data/tasks";
import { isOpenStatus } from "@/lib/tasks";
import { tasksHref } from "@/lib/tasks-view";

/**
 * Home's open tasks due today or earlier, under Needs attention. A task is
 * completed in place; the title opens it on /tasks.
 */
export function DueTasksPanel({
  tasks,
  total,
  todayKey,
}: {
  /** The first due tasks, already ordered by the server. */
  tasks: TaskRow[];
  /** Every due task, which can be more than `tasks` holds. */
  total: number;
  todayKey: string;
}) {
  const t = useTranslations("home.dueTasks");
  const [rows, applyOptimistic] = useOptimistic(tasks, reduceTasks);
  const { changeStatus } = useTaskActions({ rows, apply: applyOptimistic });
  const visible = rows.filter((row) => isOpenStatus(row.status));

  // Agree with the sidebar badge: the total, less what was completed here.
  const completedHere = tasks.length - visible.length;
  const count = Math.max(visible.length, total - completedHere);

  return (
    <Panel
      title={t("title")}
      icon={<ListChecks className="size-3.5" />}
      count={count}
      action={<PanelAction href="/tasks">{t("all")}</PanelAction>}
    >
      {visible.length === 0 ? (
        <PanelEmpty>
          {t.rich("empty", {
            link: (chunks) => (
              <Link
                href={tasksHref({ openNew: true })}
                className="text-foreground decoration-foreground/25 hover:decoration-foreground font-medium underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </PanelEmpty>
      ) : (
        <ul className="divide-y">
          {visible.map((task) => {
            const label = t("complete", { title: task.title });
            return (
              // On a phone a long title takes a second line rather than
              // losing its end to the due chip.
              <li
                key={task.id}
                className="flex min-h-11 items-center gap-3 px-4 py-1.5 sm:h-11 sm:py-0"
              >
                <button
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => changeStatus(task.id, "done")}
                  className="group text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -ml-1 flex size-7 shrink-0 items-center justify-center rounded-full outline-none transition-colors duration-150 focus-visible:ring-[3px]"
                >
                  <Circle
                    aria-hidden
                    className="size-4 group-hover:hidden group-focus-visible:hidden"
                    strokeWidth={1.75}
                  />
                  <CircleCheck
                    aria-hidden
                    className="hidden size-4 group-hover:block group-focus-visible:block"
                    strokeWidth={1.75}
                  />
                </button>
                <Link
                  href={tasksHref({ taskId: task.id })}
                  className="line-clamp-2 min-w-0 flex-1 text-sm font-medium break-words hover:underline sm:line-clamp-1"
                >
                  {task.title}
                </Link>
                {task.client ? (
                  <span className="text-muted-foreground hidden max-w-40 truncate text-xs sm:block">
                    {clientFullName(task.client)}
                  </span>
                ) : null}
                <DueChip dueOn={task.due_on} todayKey={todayKey} className="shrink-0" />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
