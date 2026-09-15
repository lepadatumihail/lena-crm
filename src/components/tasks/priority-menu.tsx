"use client";

import { useTranslations } from "next-intl";

import { PriorityIcon } from "@/components/tasks/priority-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { taskPriorityLabel } from "@/i18n/labels";
import { TASK_PRIORITIES, type TaskPriority } from "@/lib/tasks";
import { cn } from "@/lib/utils";

/** Linear's menu order: Urgent first, No priority last. */
const MENU_ORDER = [...TASK_PRIORITIES].reverse();

/** Same isolation as StatusMenu: stop on the trigger and the content, never preventDefault. */
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/** The priority glyph, which is also the way to change the priority. */
export function PriorityMenu({
  priority,
  taskTitle,
  onChange,
  className,
}: {
  priority: TaskPriority;
  taskTitle: string;
  onChange: (priority: TaskPriority) => void;
  className?: string;
}) {
  const t = useTranslations("tasks");
  const tCrm = useTranslations("crm");
  const label = taskPriorityLabel(tCrm, priority);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("controls.changePriority", { title: taskTitle, priority: label })}
        title={label}
        onClick={stop}
        onPointerDown={stop}
        onMouseDown={stop}
        onTouchStart={stop}
        className={cn(
          "hover:bg-muted data-[state=open]:bg-accent focus-visible:ring-ring/50 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none transition-colors duration-150 focus-visible:ring-[3px]",
          className
        )}
      >
        <PriorityIcon priority={priority} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-44"
        onClick={stop}
        onPointerDown={stop}
        onMouseDown={stop}
        onTouchStart={stop}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {t("controls.priority")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={priority} onValueChange={(next) => onChange(next as TaskPriority)}>
          {MENU_ORDER.map((p) => (
            <DropdownMenuRadioItem key={p} value={p}>
              <PriorityIcon priority={p} />
              {taskPriorityLabel(tCrm, p)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
