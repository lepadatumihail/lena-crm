"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { taskStatusLabel } from "@/i18n/labels";
import { setTaskPriority, setTaskStatus } from "@/lib/actions/tasks";
import type { TaskRow } from "@/lib/data/tasks";
import { announceNotificationsChanged } from "@/lib/notifications";
import type { TaskPriority, TaskStatus } from "@/lib/tasks";

export type TaskChange =
  | { type: "update"; id: string; changes: Partial<TaskRow> }
  | { type: "remove"; id: string };

/** Reducer for useOptimistic over TaskRow[]. Never mutates. */
export function reduceTasks(state: TaskRow[], change: TaskChange): TaskRow[] {
  if (change.type === "remove") return state.filter((row) => row.id !== change.id);
  return state.map((row) => (row.id === change.id ? { ...row, ...change.changes } : row));
}

/**
 * The optimistic status and priority flow the tasks page, the client panel
 * and the Home panel share. `apply` is the surface's useOptimistic setter.
 */
export function useTaskActions({ rows, apply }: { rows: TaskRow[]; apply: (change: TaskChange) => void }) {
  const router = useRouter();
  const t = useTranslations("tasks.toasts");
  const tCommon = useTranslations("common");
  const tCrm = useTranslations("crm");
  const [, startTransition] = useTransition();

  // `from` is passed explicitly: an Undo fired from a toast runs with this
  // render's `rows`, where the task still has its old status, so looking the
  // status up again would see "nothing to change" and do nothing.
  function commitStatus(id: string, from: TaskStatus, to: TaskStatus, undo = false) {
    // Read the clock in the handler, not during render.
    const completedAt = to === "done" ? new Date().toISOString() : null;
    startTransition(async () => {
      apply({ type: "update", id, changes: { status: to, completed_at: completedAt } });
      const { error } = await setTaskStatus(id, to);
      if (error) {
        toast.error(t("statusFailed"), { description: error });
        return;
      }
      if (to === "done" || from === "done") announceNotificationsChanged();
      if (undo) toast.success(t(to === "done" ? "completed" : "reopened"));
      else if (to === "done")
        toast.success(t("completed"), {
          action: { label: tCommon("undo"), onClick: () => commitStatus(id, "done", from, true) },
        });
      else toast.success(t("statusChanged", { status: taskStatusLabel(tCrm, to) }));
      router.refresh();
    });
  }

  // `current` is the caller's own copy of the value, for a task no longer in
  // `rows` (the task drawer goes on showing a task the client panel dropped).
  function changeStatus(id: string, to: TaskStatus, current?: TaskStatus) {
    const from = rows.find((r) => r.id === id)?.status ?? current;
    if (from === undefined || from === to) return;
    commitStatus(id, from, to);
  }

  function changePriority(id: string, priority: TaskPriority, current?: TaskPriority) {
    const from = rows.find((r) => r.id === id)?.priority ?? current;
    if (from === undefined || from === priority) return;
    startTransition(async () => {
      apply({ type: "update", id, changes: { priority } });
      const { error } = await setTaskPriority(id, priority);
      if (error) {
        toast.error(t("priorityFailed"), { description: error });
        return;
      }
      router.refresh();
    });
  }

  /** The dialog already ran deleteTask; drop the row and refresh. */
  function removeLocally(id: string) {
    startTransition(() => {
      apply({ type: "remove", id });
      router.refresh();
    });
  }

  return { changeStatus, changePriority, removeLocally };
}
