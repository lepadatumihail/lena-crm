"use client";

import { useState } from "react";

import type { TaskRow } from "@/lib/data/tasks";
import type { TaskPriority, TaskStatus } from "@/lib/tasks";

type TaskActions = {
  changeStatus: (id: string, status: TaskStatus, current?: TaskStatus) => void;
  changePriority: (id: string, priority: TaskPriority, current?: TaskPriority) => void;
};

/**
 * The task drawer's state on a surface that lists tasks. The drawer follows
 * the task's live copy in `rows`, optimistic changes included, and keeps the
 * last copy it saw once the task leaves them: the client panel drops a task
 * the moment it is done, yet the drawer should go on showing it, as done.
 */
export function useTaskSheet({
  rows,
  changeStatus,
  changePriority,
}: { rows: TaskRow[] } & TaskActions) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<TaskRow | null>(null);

  const live = task ? rows.find((row) => row.id === task.id) : undefined;
  // Compared by content, not identity: while a change is pending,
  // useOptimistic rebuilds the rows on every render.
  if (live && JSON.stringify(live) !== JSON.stringify(task)) setTask(live);

  /** A task outside `rows` gets no optimistic copy, so the drawer updates its own. */
  function patchOutsideRows(id: string, changes: Partial<TaskRow>) {
    if (rows.some((row) => row.id === id)) return;
    setTask((current) => (current?.id === id ? { ...current, ...changes } : current));
  }

  return {
    task: live ?? task,
    open,
    setOpen,
    show(next: TaskRow) {
      setTask(next);
      setOpen(true);
    },
    changeStatus(id: string, status: TaskStatus) {
      changeStatus(id, status, task?.id === id ? task.status : undefined);
      patchOutsideRows(id, {
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
      });
    },
    changePriority(id: string, priority: TaskPriority) {
      changePriority(id, priority, task?.id === id ? task.priority : undefined);
      patchOutsideRows(id, { priority });
    },
  };
}
