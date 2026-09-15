"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";

import { CardBody } from "@/components/tasks/task-card";
import { taskStatusLabel } from "@/i18n/labels";
import type { TaskRow } from "@/lib/data/tasks";
import {
  compareTasks,
  groupTasksByStatus,
  TASK_STATUS_TONES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";

function BoardCard({
  task,
  todayKey,
  onOpen,
  onPriorityChange,
}: {
  task: TaskRow;
  todayKey: string;
  onOpen: (id: string) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
}) {
  const t = useTranslations("tasks");
  // A named group, not dnd-kit's default role="button": a button's children
  // are presentational, which would hide the priority menu and client link
  // from screen readers and read the title twice. The role description
  // replaces dnd-kit's English "draggable".
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    attributes: { role: "group", roleDescription: t("board.cardRole") },
  });

  // No transform on the source: the DragOverlay follows the pointer and the
  // source stays behind as a faded placeholder, so it cannot stretch the
  // board's scroll area mid-drag.
  return (
    <div
      ref={setNodeRef}
      aria-label={t("controls.open", { title: task.title })}
      {...attributes}
      {...listeners}
      // A swipe that starts on a card scrolls the board; press-and-hold picks it up.
      className={cn(
        "focus-visible:ring-ring/50 cursor-grab touch-manipulation rounded-lg outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-[3px] active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        if (
          e.target === e.currentTarget &&
          (e.key === "Enter" || e.key === " ")
        ) {
          e.preventDefault();
          onOpen(task.id);
        }
      }}
    >
      <CardBody
        task={task}
        todayKey={todayKey}
        onPriorityChange={onPriorityChange}
      />
    </div>
  );
}

function BoardColumn({
  status,
  tasks,
  countLabel,
  todayKey,
  onOpen,
  onPriorityChange,
  onViewAll,
}: {
  status: TaskStatus;
  tasks: TaskRow[];
  countLabel: string;
  todayKey: string;
  onOpen: (id: string) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  /** Done only: a link to the full Done tab under the cards. */
  onViewAll?: () => void;
}) {
  const t = useTranslations("tasks.board");
  const tCrm = useTranslations("crm");
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="flex h-9 items-center gap-2 px-1">
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            TONE_SOLID[TASK_STATUS_TONES[status]],
          )}
        />
        <span className="text-sm font-medium">
          {taskStatusLabel(tCrm, status)}
        </span>
        <span className="bg-muted text-muted-foreground inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums">
          {countLabel}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/40 min-h-32 flex-1 space-y-2 rounded-xl p-2 transition-[background-color,box-shadow] duration-150",
          isOver && "bg-accent ring-primary/40 ring-2",
        )}
      >
        {tasks.map((task) => (
          <BoardCard
            key={task.id}
            task={task}
            todayKey={todayKey}
            onOpen={onOpen}
            onPriorityChange={onPriorityChange}
          />
        ))}
        {tasks.length === 0 ? (
          <p className="text-muted-foreground/60 px-2 py-6 text-center text-xs">
            {t("dropHere")}
          </p>
        ) : onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            aria-label={t("viewAllDoneLabel")}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 w-full rounded-md py-1.5 text-xs font-medium outline-none transition-colors duration-150 focus-visible:ring-[3px]"
          >
            {t("viewAllDone")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Tasks as columns by status; drag a card to another column to change its
 * status. The Done column shows what the parent passes (at most
 * BOARD_DONE_LIMIT cards) and points at the Done tab for the rest.
 */
export function TaskBoard({
  open,
  done,
  doneCount,
  doneHasMore,
  todayKey,
  onOpen,
  onStatusChange,
  onPriorityChange,
  onViewAllDone,
}: {
  open: TaskRow[];
  /** Already capped at BOARD_DONE_LIMIT by the parent. */
  done: TaskRow[];
  /** All loaded done tasks, for the column header. */
  doneCount: number;
  /** More done tasks exist than were loaded: the count gets a trailing "+". */
  doneHasMore: boolean;
  todayKey: string;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  onViewAllDone: () => void;
}) {
  const t = useTranslations("tasks.board");
  const tCrm = useTranslations("crm");
  // A stable id: dnd-kit's own counter differs between server and browser and breaks hydration.
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  const all = [...open, ...done];
  const byStatus = groupTasksByStatus(open);
  const activeTask = all.find((task) => task.id === activeId) ?? null;

  const titleOf = (id: UniqueIdentifier) =>
    all.find((task) => task.id === id)?.title ?? "";
  const statusOf = (id: UniqueIdentifier) =>
    taskStatusLabel(tCrm, String(id) as TaskStatus);

  // dnd-kit's defaults are English and read raw uuids and status keys.
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t("announce.pickedUp", { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) =>
      over
        ? t("announce.over", {
            title: titleOf(active.id),
            status: statusOf(over.id),
          })
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? t("announce.dropped", {
            title: titleOf(active.id),
            status: statusOf(over.id),
          })
        : t("announce.cancelled", { title: titleOf(active.id) }),
    onDragCancel: ({ active }) =>
      t("announce.cancelled", { title: titleOf(active.id) }),
  };

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const task = all.find((row) => row.id === active.id);
    // Dropping on Done goes through the same handler and shows the Undo toast.
    if (task && task.status !== over.id)
      onStatusChange(task.id, over.id as TaskStatus);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      accessibility={{
        screenReaderInstructions: { draggable: t("dragHint") },
        announcements,
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) =>
          status === "done" ? (
            <BoardColumn
              key={status}
              status={status}
              tasks={done}
              countLabel={`${doneCount}${doneHasMore ? "+" : ""}`}
              todayKey={todayKey}
              onOpen={onOpen}
              onPriorityChange={onPriorityChange}
              onViewAll={onViewAllDone}
            />
          ) : (
            <BoardColumn
              key={status}
              status={status}
              tasks={[...byStatus[status]].sort(compareTasks)}
              countLabel={String(byStatus[status].length)}
              todayKey={todayKey}
              onOpen={onOpen}
              onPriorityChange={onPriorityChange}
            />
          ),
        )}
      </div>
      <DragOverlay>
        {activeTask ? (
          <CardBody task={activeTask} todayKey={todayKey} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
