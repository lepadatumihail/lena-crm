"use client";

import { useLocale, useTranslations } from "next-intl";

import { useAgentTimeZone } from "@/components/shell/shell-context";
import { ClientChip } from "@/components/tasks/client-chip";
import { dayLabel } from "@/components/tasks/day-label";
import { DueChip } from "@/components/tasks/due-chip";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import { PriorityMenu } from "@/components/tasks/priority-menu";
import type { TaskRow } from "@/lib/data/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import type { TaskPriority } from "@/lib/tasks";
import { cn } from "@/lib/utils";

/**
 * A board card's face. No dnd-kit hooks here, so it also renders inside the
 * DragOverlay and outside any DndContext (unit tests). Done cards never show
 * a due chip. The last row, quiet like Linear's, says when the task was
 * created, as the agent's day.
 */
export function CardBody({
  task,
  todayKey,
  overlay = false,
  onPriorityChange,
}: {
  task: TaskRow;
  todayKey: string;
  /** The copy that follows the pointer while dragging: glyphs only, no menus. */
  overlay?: boolean;
  onPriorityChange?: (id: string, priority: TaskPriority) => void;
}) {
  const t = useTranslations("tasks.card");
  const locale = useLocale();
  const timeZone = useAgentTimeZone();
  const done = task.status === "done";
  const showDue = !done && task.due_on != null;
  const created = dayLabel(dateKeyInTimeZone(task.created_at, timeZone), todayKey, locale);

  return (
    <div className="bg-card rounded-lg border p-3 shadow-xs">
      <div className="flex items-start gap-1.5">
        {overlay || !onPriorityChange ? (
          <span className="inline-flex size-7 shrink-0 items-center justify-center -my-1 -ml-1.5">
            <PriorityIcon priority={task.priority} />
          </span>
        ) : (
          <PriorityMenu
            priority={task.priority}
            taskTitle={task.title}
            onChange={(priority) => onPriorityChange(task.id, priority)}
            className="-my-1 -ml-1.5"
          />
        )}
        <p
          className={cn(
            "line-clamp-2 min-w-0 flex-1 text-sm leading-5 font-medium",
            done && "text-muted-foreground"
          )}
        >
          {task.title}
        </p>
      </div>
      {task.client || showDue ? (
        <div className="mt-2 flex items-center gap-2">
          {task.client ? <ClientChip client={task.client} /> : null}
          {showDue ? <DueChip dueOn={task.due_on} todayKey={todayKey} className="ml-auto" /> : null}
        </div>
      ) : null}
      <p className="text-muted-foreground mt-2.5 text-xs">{t("created", { date: created })}</p>
    </div>
  );
}
