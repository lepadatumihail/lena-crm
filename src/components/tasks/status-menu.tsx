"use client";

import { useTranslations } from "next-intl";

import { StatusIcon } from "@/components/tasks/status-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { taskStatusLabel } from "@/i18n/labels";
import { TASK_STATUSES, type TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";

/**
 * The menu lives inside a clickable row and a draggable card. React bubbles
 * events from the portalled content through the component tree, so both the
 * trigger and the content stop them. Never preventDefault: Radix opens on
 * pointerdown.
 */
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/** The status glyph, which is also the way to change the status. */
export function StatusMenu({
  status,
  taskTitle,
  onChange,
  className,
}: {
  status: TaskStatus;
  taskTitle: string;
  onChange: (status: TaskStatus) => void;
  className?: string;
}) {
  const t = useTranslations("tasks");
  const tCrm = useTranslations("crm");
  const label = taskStatusLabel(tCrm, status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("controls.changeStatus", { title: taskTitle, status: label })}
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
        <StatusIcon status={status} />
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
          {t("controls.status")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={status} onValueChange={(next) => onChange(next as TaskStatus)}>
          {TASK_STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <StatusIcon status={s} />
              {taskStatusLabel(tCrm, s)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
