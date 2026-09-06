"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Star } from "lucide-react";

import { stageLabel } from "@/i18n/labels";
import {
  clientFullName,
  stagesForSide,
  type ClientSide,
  type Stage,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase/types";

function CardBody({
  client,
  onTogglePriority,
}: {
  client: Client;
  onTogglePriority?: (id: string, next: boolean) => void;
}) {
  const t = useTranslations("clients.priority");
  return (
    <div className="bg-card rounded-lg border p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{clientFullName(client)}</span>
        {onTogglePriority && (
          <button
            type="button"
            aria-label={client.priority ? t("unflag") : t("flag")}
            className="-mt-0.5 -mr-0.5 p-0.5"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePriority(client.id, !client.priority);
            }}
          >
            <Star
              className={cn(
                "size-4",
                client.priority
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            />
          </button>
        )}
      </div>
      {(client.email || client.phone) && (
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {client.email || client.phone}
        </p>
      )}
      {client.agency && (
        <p className="text-muted-foreground/80 mt-1 truncate text-xs">
          {client.agency}
        </p>
      )}
    </div>
  );
}

function KanbanCard({
  client,
  onTogglePriority,
}: {
  client: Client;
  onTogglePriority: (id: string, next: boolean) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: client.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      <CardBody client={client} onTogglePriority={onTogglePriority} />
    </div>
  );
}

function KanbanColumn({
  stage,
  clients,
  onTogglePriority,
}: {
  stage: Stage;
  clients: Client[];
  onTogglePriority: (id: string, next: boolean) => void;
}) {
  const t = useTranslations("clients.kanban");
  const tCrm = useTranslations("crm");
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-sm font-medium">{stageLabel(tCrm, stage)}</span>
        <span className="text-muted-foreground text-xs">{clients.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/40 flex-1 space-y-2 rounded-xl p-2 transition-colors",
          isOver && "bg-accent ring-primary/40 ring-2"
        )}
      >
        {clients.map((c) => (
          <KanbanCard key={c.id} client={c} onTogglePriority={onTogglePriority} />
        ))}
        {clients.length === 0 && (
          <p className="text-muted-foreground/60 px-2 py-6 text-center text-xs">
            {t("dropHere")}
          </p>
        )}
      </div>
    </div>
  );
}

export function ClientsKanban({
  data,
  side,
  onStageChange,
  onTogglePriority,
}: {
  data: Client[];
  side: ClientSide;
  onStageChange: (id: string, stage: string) => void;
  onTogglePriority: (id: string, next: boolean) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const stages = stagesForSide(side);
  const activeClient = data.find((c) => c.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const client = data.find((c) => c.id === active.id);
    const newStage = String(over.id);
    if (client && client.stage !== newStage) {
      onStageChange(client.id, newStage);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            clients={data.filter((c) => c.stage === stage)}
            onTogglePriority={onTogglePriority}
          />
        ))}
      </div>
      <DragOverlay>
        {activeClient ? <CardBody client={activeClient} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
