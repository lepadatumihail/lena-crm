"use client";

import { useOptimistic, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ListChecks, Plus } from "lucide-react";

import { Panel, PanelEmpty } from "@/components/shell/panel";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { reduceTasks, useTaskActions } from "@/components/tasks/use-task-actions";
import { useTaskSheet } from "@/components/tasks/use-task-sheet";
import { Button } from "@/components/ui/button";
import type { ClientSide } from "@/lib/crm";
import type { TaskRow } from "@/lib/data/tasks";
import { compareTasks, isOpenStatus } from "@/lib/tasks";
import { tasksHref } from "@/lib/tasks-view";

/**
 * The client's open tasks, first in the client page's main column. New tasks
 * are created for this client only; finished ones live on /tasks. A task
 * opens in the task drawer, which keeps showing it after it is done.
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
  const sheet = useTaskSheet({ rows, changeStatus, changePriority });
  const open = [...rows.filter((row) => isOpenStatus(row.status))].sort(compareTasks);
  const clients = [{ id: clientId, name: clientName, side }];

  const [dialogOpen, setDialogOpen] = useState(false);

  function openTask(id: string) {
    const task = rows.find((row) => row.id === id);
    if (task) sheet.show(task);
  }

  return (
    <>
      <Panel
        title={t("clientPanel.title")}
        icon={<ListChecks className="size-3.5" />}
        count={open.length}
        action={
          <Button variant="outline" size="xs" onClick={() => setDialogOpen(true)}>
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
                onOpen={openTask}
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
        payload={{ mode: "create", clientId }}
        clients={clients}
        fixedClient
      />

      <TaskSheet
        task={sheet.task}
        open={sheet.open}
        onOpenChange={sheet.setOpen}
        todayKey={todayKey}
        clients={clients}
        fixedClient
        onStatusChange={sheet.changeStatus}
        onPriorityChange={sheet.changePriority}
        onDeleted={removeLocally}
      />
    </>
  );
}
