"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ListChecks, Pencil, RotateCcw } from "lucide-react";

import { useAgentTimeZone } from "@/components/shell/shell-context";
import { ClientChip } from "@/components/tasks/client-chip";
import { dayLabel } from "@/components/tasks/day-label";
import { DueChip } from "@/components/tasks/due-chip";
import { PriorityMenu } from "@/components/tasks/priority-menu";
import { StatusMenu } from "@/components/tasks/status-menu";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskNotes } from "@/components/tasks/task-notes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CalendarClientOption } from "@/lib/data/calendar";
import type { TaskRow } from "@/lib/data/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import { isOpenStatus, type TaskPriority, type TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-9 grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3">
      <dt className="text-muted-foreground text-[13px]">{label}</dt>
      <dd className="flex min-w-0 items-center text-sm">{children}</dd>
    </div>
  );
}

/**
 * A task at full length without leaving the list: title and description, the
 * details, and the notes log. Status and priority change right here; title,
 * description, client and due date go through the edit dialog, which opens on
 * top of the drawer.
 */
export function TaskSheet({
  task,
  open,
  onOpenChange,
  todayKey,
  clients,
  fixedClient = false,
  onStatusChange,
  onPriorityChange,
  onDeleted,
}: {
  task: TaskRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todayKey: string;
  /** The edit dialog's client picker. */
  clients: CalendarClientOption[];
  /** The client cannot be changed (client detail page). */
  fixedClient?: boolean;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  /** After the edit dialog deleted the task, so the parent drops the row. */
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const timeZone = useAgentTimeZone();
  const [editing, setEditing] = useState(false);

  /** An instant as the agent's day: "11 Sep". */
  const day = (iso: string) => dayLabel(dateKeyInTimeZone(iso, timeZone), todayKey, locale);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="gap-0 sm:max-w-md"
          // Focus the panel, not the status menu: nothing should look "chosen"
          // the moment the drawer opens.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {task ? (
            <>
              <SheetHeader className="flex-row items-center gap-2 border-b py-3.5 pr-14">
                <SheetTitle className="label-caps text-muted-foreground flex items-center gap-2 font-medium">
                  <ListChecks className="size-3.5" strokeWidth={1.75} />
                  {t("sheet.title")}
                </SheetTitle>
                <SheetDescription className="sr-only">{task.title}</SheetDescription>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <section className="border-b px-5 py-5">
                  <h3
                    className={cn(
                      "text-lg font-semibold tracking-tight text-pretty break-words",
                      !isOpenStatus(task.status) && "text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </h3>
                  {task.description ? (
                    <p className="text-muted-foreground mt-2 text-sm break-words whitespace-pre-wrap">
                      {task.description}
                    </p>
                  ) : null}
                </section>

                <section className="border-b px-5 py-4">
                  <h4 className="label-caps text-muted-foreground mb-2">{t("sheet.details")}</h4>
                  <dl>
                    <DetailRow label={t("sheet.status")}>
                      <StatusMenu
                        status={task.status}
                        taskTitle={task.title}
                        onChange={(status) => onStatusChange(task.id, status)}
                        showLabel
                        className="-ml-2"
                      />
                    </DetailRow>
                    <DetailRow label={t("sheet.priority")}>
                      <PriorityMenu
                        priority={task.priority}
                        taskTitle={task.title}
                        onChange={(priority) => onPriorityChange(task.id, priority)}
                        showLabel
                        className="-ml-2"
                      />
                    </DetailRow>
                    <DetailRow label={t("sheet.client")}>
                      {task.client ? (
                        <ClientChip
                          client={task.client}
                          className="text-foreground text-sm hover:underline"
                        />
                      ) : (
                        <span className="text-muted-foreground">{t("dialog.noClient")}</span>
                      )}
                    </DetailRow>
                    <DetailRow label={t("sheet.dueDate")}>
                      {!task.due_on ? (
                        <span className="text-muted-foreground">{t("dialog.noDueDate")}</span>
                      ) : isOpenStatus(task.status) ? (
                        <DueChip dueOn={task.due_on} todayKey={todayKey} />
                      ) : (
                        // A done task is never overdue: the plain day, no red.
                        dayLabel(task.due_on, todayKey, locale)
                      )}
                    </DetailRow>
                    <DetailRow label={t("sheet.created")}>{day(task.created_at)}</DetailRow>
                    {task.completed_at ? (
                      <DetailRow label={t("sheet.completed")}>{day(task.completed_at)}</DetailRow>
                    ) : null}
                  </dl>
                </section>

                <TaskNotes key={task.id} taskId={task.id} todayKey={todayKey} />
              </div>

              <SheetFooter className="flex-row items-center justify-between gap-2 border-t">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditing(true)}
                  aria-label={tCommon("edit")}
                  title={tCommon("edit")}
                >
                  <Pencil />
                </Button>
                <div className="flex items-center gap-2">
                  <SheetClose asChild>
                    <Button variant="outline" size="sm">
                      {tCommon("close")}
                    </Button>
                  </SheetClose>
                  {isOpenStatus(task.status) ? (
                    <Button size="sm" onClick={() => onStatusChange(task.id, "done")}>
                      <Check /> {t("sheet.markDone")}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => onStatusChange(task.id, "todo")}>
                      <RotateCcw /> {t("sheet.reopen")}
                    </Button>
                  )}
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {task ? (
        <TaskDialog
          open={editing}
          onOpenChange={setEditing}
          payload={{ mode: "edit", task }}
          clients={clients}
          fixedClient={fixedClient}
          onDeleted={(id) => {
            onOpenChange(false);
            onDeleted(id);
          }}
        />
      ) : null}
    </>
  );
}
