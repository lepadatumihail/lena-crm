"use client";

import { useTranslations } from "next-intl";

import { ClientChip } from "@/components/tasks/client-chip";
import { DueChip } from "@/components/tasks/due-chip";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import { PriorityMenu } from "@/components/tasks/priority-menu";
import { StatusMenu } from "@/components/tasks/status-menu";
import { taskPriorityLabel } from "@/i18n/labels";
import { clientFullName } from "@/lib/crm";
import type { TaskRow } from "@/lib/data/tasks";
import { isOpenStatus, type TaskPriority, type TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";

/**
 * One task as a 42px row: status and priority controls, the title (which
 * opens the task), the client and the due date. On phones the priority and
 * the client move to a second line under the title.
 */
export function TaskItem({
  task,
  todayKey,
  showClient = true,
  onOpen,
  onStatusChange,
  onPriorityChange,
}: {
  task: TaskRow;
  todayKey: string;
  /** Off where every row is the same client's (the client page). */
  showClient?: boolean;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
}) {
  const t = useTranslations("tasks");
  const tCrm = useTranslations("crm");
  const open = isOpenStatus(task.status);
  const client = showClient ? task.client : null;

  return (
    <li
      className="hover:bg-muted/40 flex min-h-[42px] cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors duration-150 md:h-[42px] md:py-0 md:pr-4"
      onClick={() => onOpen(task.id)}
    >
      <StatusMenu
        status={task.status}
        taskTitle={task.title}
        onChange={(status) => onStatusChange(task.id, status)}
      />
      <PriorityMenu
        priority={task.priority}
        taskTitle={task.title}
        onChange={(priority) => onPriorityChange(task.id, priority)}
        className="hidden md:flex"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          aria-label={t("controls.open", { title: task.title })}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(task.id);
          }}
          className={cn(
            "focus-visible:ring-ring/50 block max-w-full truncate rounded-sm text-left text-sm font-medium outline-none focus-visible:ring-[3px]",
            !open && "text-muted-foreground",
          )}
        >
          {task.title}
        </button>
        <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs md:hidden">
          <PriorityIcon priority={task.priority} className="size-3" />
          {/* The glyph is aria-hidden and the priority menu is desktop-only. */}
          {task.priority !== "none" ? (
            <span className="sr-only">
              {taskPriorityLabel(tCrm, task.priority)}
            </span>
          ) : null}
          {client ? (
            <span className="truncate">{clientFullName(client)}</span>
          ) : null}
        </div>
      </div>
      {client ? (
        <ClientChip
          client={client}
          className="hidden max-w-44 md:inline-flex"
        />
      ) : null}
      {open ? <DueChip dueOn={task.due_on} todayKey={todayKey} /> : null}
    </li>
  );
}
