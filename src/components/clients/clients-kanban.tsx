"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Star } from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { Budget } from "@/components/clients/clients-table";
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

/**
 * The card's figure, short so it fits a narrow column: a buyer's budget as
 * the table words it ("€600K – €800K", "up to €1.5M", "from €900K"), a
 * seller's asking price, else how to reach them.
 */
function CardFigure({ client }: { client: ClientRow }) {
  const t = useTranslations("clients.table");
  const tag = intlTag(useLocale());
  if (client.side === "buyer" && (client.budget_min != null || client.budget_max != null)) {
    return (
      <p className="truncate text-[13px]">
        <Budget
          compact
          min={client.budget_min}
          max={client.budget_max}
          locale={tag}
          upTo={(a) => t.rich("upTo", { amount: () => a })}
          from={(a) => t.rich("from", { amount: () => a })}
        />
      </p>
    );
  }
  if (client.side !== "buyer" && client.asking_price != null) {
    return (
      <p className="text-[13px]">
        <Money value={client.asking_price} locale={tag} compact />
      </p>
    );
  }
  if (client.email || client.phone) {
    return (
      <p className="text-muted-foreground truncate text-xs">{client.email || client.phone}</p>
    );
  }
  return null;
}

function CardBody({
  client,
  onTogglePriority,
}: {
  client: ClientRow;
  onTogglePriority?: (id: string, next: boolean) => void;
}) {
  const t = useTranslations("clients.priority");
  const tList = useTranslations("clients.list");
  // The star sits beside the name line only, and takes room from the name
  // only when it shows: always for a priority client (and on a touch screen,
  // which has no hover), otherwise while the pointer or focus is on the
  // card. Laptop columns are narrow, and a faint star on every card cut
  // names short for nothing.
  const reserve = client.priority
    ? "pr-6"
    : onTogglePriority
      ? "group-hover/card:pr-6 group-focus-within/card:pr-6 pointer-coarse:pr-6"
      : undefined;
  return (
    <div className="group/card bg-card relative rounded-lg border p-3 shadow-xs">
      <div className="flex items-start gap-2.5">
        <ClientAvatar name={clientFullName(client)} side={client.side} />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm leading-6 font-medium", reserve)}>
            {clientFullName(client)}
          </p>
          <CardFigure client={client} />
          {client.agency ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{client.agency}</p>
          ) : null}
        </div>
      </div>
      {onTogglePriority ? (
        <button
          type="button"
          aria-label={client.priority ? t("unflag") : t("flag")}
          className={cn(
            "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-2.5 right-2 rounded-md p-1 transition-[color,opacity] duration-150 outline-none focus-visible:ring-[3px]",
            !client.priority &&
              "opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 pointer-coarse:opacity-100"
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePriority(client.id, !client.priority);
          }}
        >
          <Star
            className={cn("size-4", client.priority && "fill-foreground text-foreground")}
          />
        </button>
      ) : client.priority ? (
        // The drag preview keeps the marker, without the button.
        <Star
          aria-label={tList("priority")}
          className="fill-foreground text-foreground absolute top-3.5 right-3 size-4"
        />
      ) : null}
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
      // No touch-none: a swipe across a card scrolls the board; a long press drags.
      className={cn(
        "cursor-grab select-none active:cursor-grabbing [-webkit-touch-callout:none]",
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
    // A phone shows one column at a time; wider, the columns share the width
    // (a buyer's five fit a laptop beside the sidebar) and scroll only below
    // their minimum.
    <div className="flex w-[85vw] max-w-72 shrink-0 snap-start flex-col sm:w-auto sm:max-w-80 sm:min-w-[13.5rem] sm:flex-1 sm:basis-0">
      <div className="flex h-9 items-center gap-2 px-1">
        <span
          aria-hidden
          className={cn("size-2 rounded-full", TONE_SOLID[STAGE_TONES[stage]])}
        />
        <span className="text-sm font-medium">{stageLabel(tCrm, stage)}</span>
        <span className="bg-muted text-muted-foreground inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums">
          {clients.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/40 flex-1 space-y-2 rounded-xl p-2 transition-[background-color,box-shadow] duration-150",
          isOver && "bg-accent ring-foreground/15 ring-2"
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
          <p className="text-muted-foreground px-2 py-6 text-center text-xs">
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
  stages: only,
  onStageChange,
  onTogglePriority,
  onOpen,
}: {
  data: ClientRow[];
  side: ClientSide;
  /**
   * The columns to draw, when a stage tab narrows the list to one stage:
   * the other columns could only be empty and would contradict the tabs'
   * counts. Every stage of the side by default.
   */
  stages?: readonly Stage[];
  onStageChange: (id: string, stage: string) => void;
  onTogglePriority: (id: string, next: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // A mouse drags after 8px; a finger has to hold for a moment first, so
  // swiping across the board scrolls it instead of moving someone's stage.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );
  const stages = only ?? stagesForSide(side);
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
      <div className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto pb-4 sm:snap-none">
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
