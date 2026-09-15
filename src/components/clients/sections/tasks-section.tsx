"use client";

import { useOptimistic, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ListChecks, Plus } from "lucide-react";

import { Panel, PanelEmpty } from "@/components/shell/panel";
import { TaskDialog, type TaskDialogPayload } from "@/components/tasks/task-dialog";
import { TaskItem } from "@/components/tasks/task-item";
import { reduceTasks, useTaskActions } from "@/components/tasks/use-task-actions";
import { Button } from "@/components/ui/button";
import type { ClientSide } from "@/lib/crm";
import type { TaskRow } from "@/lib/data/tasks";
import { compareTasks, isOpenStatus } from "@/lib/tasks";
import { tasksHref } from "@/lib/tasks-view";

/**
 * The client's open tasks, first in the client page's main column. New tasks
 * are created for this client only; finished ones live on /tasks.
 */
export function TasksSection({
  clientId,
  clientName,
  side,
  tasks,
  todayKey,
}: {
  clientId: string;
  clientName: string;
  side: ClientSide;
  tasks: TaskRow[];
  todayKey: string;
}) {
  const t = useTranslations("tasks");
  const [rows, applyOptimistic] = useOptimistic(tasks, reduceTasks);
  const { changeStatus, changePriority, removeLocally } = useTaskActions({
    rows,
    apply: applyOptimistic,
  });
  const open = [...rows.filter((row) => isOpenStatus(row.status))].sort(compareTasks);

  // The payload stays put while the dialog animates closed.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payload, setPayload] = useState<TaskDialogPayload>({ mode: "create", clientId });

  function openCreate() {
    setPayload({ mode: "create", clientId });
    setDialogOpen(true);
  }
  function openEdit(id: string) {
    const task = rows.find((row) => row.id === id);
    if (!task) return;
    setPayload({ mode: "edit", task });
    setDialogOpen(true);
  }
  // While editing, show the freshest copy of the task (after a priority change, say).
  const dialogPayload: TaskDialogPayload =
    payload.mode === "edit"
      ? { mode: "edit", task: rows.find((row) => row.id === payload.task.id) ?? payload.task }
      : payload;

  return (
    <>
      <Panel
        title={t("clientPanel.title")}
        icon={<ListChecks className="size-3.5" />}
        count={open.length}
        action={
          <Button variant="outline" size="xs" onClick={openCreate}>
            <Plus /> {t("new")}
          </Button>
        }
        footer={
          <Link
            href={tasksHref({ tab: "done", clientId })}
            className="hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors duration-150"
          >
            {t("clientPanel.doneLink")}
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        {open.length === 0 ? (
          <PanelEmpty>{t("clientPanel.empty")}</PanelEmpty>
        ) : (
          <ul className="divide-y">
            {open.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                todayKey={todayKey}
                showClient={false}
                onOpen={openEdit}
                onStatusChange={changeStatus}
                onPriorityChange={changePriority}
              />
            ))}
          </ul>
        )}
      </Panel>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payload={dialogPayload}
        clients={[{ id: clientId, name: clientName, side }]}
        fixedClient
        onDeleted={removeLocally}
      />
    </>
  );
}
