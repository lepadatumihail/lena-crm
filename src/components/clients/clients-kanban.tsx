"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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

import { ClientAvatar } from "@/components/clients/client-avatar";
import { Money } from "@/components/ui/money";
import { intlTag } from "@/i18n/config";
import { stageLabel } from "@/i18n/labels";
import {
  clientFullName,
  stagesForSide,
  STAGE_TONES,
  type ClientSide,
  type Stage,
} from "@/lib/crm";
import type { ClientRow } from "@/lib/data/clients";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";

function CardBody({
  client,
  onTogglePriority,
}: {
  client: ClientRow;
  onTogglePriority?: (id: string, next: boolean) => void;
}) {
  const t = useTranslations("clients.priority");
  const locale = useLocale();
  const amount =
    client.side === "buyer"
      ? (client.budget_max ?? client.budget_min)
      : client.asking_price;
  return (
    <div className="bg-card rounded-lg border p-3 shadow-xs">
      <div className="flex items-start gap-2.5">
        <ClientAvatar name={clientFullName(client)} side={client.side} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-6 font-medium">{clientFullName(client)}</p>
          {amount != null ? (
            <p className="text-[13px]">
              <Money value={amount} locale={intlTag(locale)} />
            </p>
          ) : client.email || client.phone ? (
            <p className="text-muted-foreground truncate text-xs">
              {client.email || client.phone}
            </p>
          ) : null}
          {client.agency ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{client.agency}</p>
          ) : null}
        </div>
        {onTogglePriority ? (
          <button
            type="button"
            aria-label={client.priority ? t("unflag") : t("flag")}
            className="-mt-0.5 -mr-1 rounded-md p-1"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePriority(client.id, !client.priority);
            }}
          >
            <Star
              className={cn(
                "size-4 transition-colors duration-150",
                client.priority
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function KanbanCard({
  client,
  onTogglePriority,
  onOpen,
}: {
  client: ClientRow;
  onTogglePriority: (id: string, next: boolean) => void;
  onOpen: (id: string) => void;
}) {
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
      onClick={() => onOpen(client.id)}
    >
      <CardBody client={client} onTogglePriority={onTogglePriority} />
    </div>
  );
}

function KanbanColumn({
  stage,
  clients,
  onTogglePriority,
  onOpen,
}: {
  stage: Stage;
  clients: ClientRow[];
  onTogglePriority: (id: string, next: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const t = useTranslations("clients.kanban");
  const tCrm = useTranslations("crm");
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="flex h-9 items-center gap-2 px-1">
        <span
          aria-hidden
          className={cn("size-2 rounded-full", TONE_SOLID[STAGE_TONES[stage]])}
        />
        <span className="text-sm font-medium">{stageLabel(tCrm, stage)}</span>
        <span className="bg-muted text-muted-foreground inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums">
          {clients.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/40 flex-1 space-y-2 rounded-xl p-2 transition-[background-color,box-shadow] duration-150",
          isOver && "bg-accent ring-primary/40 ring-2"
        )}
      >
        {clients.map((c) => (
          <KanbanCard
            key={c.id}
            client={c}
            onTogglePriority={onTogglePriority}
            onOpen={onOpen}
          />
        ))}
        {clients.length === 0 ? (
          <p className="text-muted-foreground/60 px-2 py-6 text-center text-xs">
            {t("dropHere")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ClientsKanban({
  data,
  side,
  onStageChange,
  onTogglePriority,
  onOpen,
}: {
  data: ClientRow[];
  side: ClientSide;
  onStageChange: (id: string, stage: string) => void;
  onTogglePriority: (id: string, next: boolean) => void;
  onOpen: (id: string) => void;
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
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {activeClient ? <CardBody client={activeClient} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
