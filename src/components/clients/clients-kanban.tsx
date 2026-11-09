"use client";

import { useState, type ReactNode } from "react";
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
import { Eye, Star } from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { Budget } from "@/components/clients/clients-table";
import { LatestActivityLine } from "@/components/clients/row-contact";
import { Money } from "@/components/ui/money";
import { intlTag } from "@/i18n/config";
import { propertyTypeLabel, stageLabel } from "@/i18n/labels";
import {
  clientFullName,
  stagesForSide,
  STAGE_TONES,
  type ClientSide,
  type Stage,
} from "@/lib/crm";
import type { ClientRow } from "@/lib/data/clients";
import { TONE_SOLID, TONE_TAG, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

/**
 * The card's figure, short so it fits a narrow column: a buyer's budget as
 * the table words it ("€600K – €800K", "up to €1.5M", "from €900K"), a
 * seller's asking price, else how to reach them. Money is set in the display
 * face, the one number on the card the eye should find first.
 */
function CardFigure({ client }: { client: ClientRow }) {
  const t = useTranslations("clients.table");
  const tag = intlTag(useLocale());
  if (client.side === "buyer" && (client.budget_min != null || client.budget_max != null)) {
    return (
      <p className="font-display truncate text-[15px] leading-6 tracking-[-0.01em]">
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
      <p className="font-display text-[15px] leading-6 tracking-[-0.01em]">
        <Money value={client.asking_price} locale={tag} compact />
      </p>
    );
  }
  if (client.email || client.phone) {
    return (
      <p className="text-muted-foreground truncate text-xs leading-6">{client.email || client.phone}</p>
    );
  }
  return null;
}

type Chip = { key: string; tone: Tone; icon?: ReactNode; label: ReactNode };

/**
 * What else is worth a glance, as small pills in the colour of what they
 * mean: a reserved buyer's commission (green), viewings so far (teal), the
 * property types they want (grey); for a seller, how many properties.
 */
function useCardChips(client: ClientRow): Chip[] {
  const t = useTranslations("clients.kanban");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());
  const chips: Chip[] = [];
  if (client.side === "buyer") {
    if (client.commission != null) {
      const commission = client.commission;
      chips.push({
        key: "commission",
        tone: "green",
        label: t.rich("commission", {
          amount: () => <Money value={commission} locale={tag} compact />,
        }),
      });
    }
    if (client.viewing_count > 0) {
      chips.push({
        key: "viewings",
        tone: "teal",
        icon: <Eye />,
        label: t("viewings", { count: client.viewing_count }),
      });
    }
    const types = client.property_types.slice(0, 2).map((type) => propertyTypeLabel(tCrm, type));
    if (types.length > 0) chips.push({ key: "types", tone: "grey", label: types.join(", ") });
  } else if (client.property_count > 1) {
    chips.push({
      key: "properties",
      tone: "grey",
      label: t("properties", { count: client.property_count }),
    });
  }
  return chips;
}

function CardBody({
  client,
  followUp = false,
  onTogglePriority,
}: {
  client: ClientRow;
  /** Home's Needs follow-up rule: an amber dot on the avatar, as on Home. */
  followUp?: boolean;
  onTogglePriority?: (id: string, next: boolean) => void;
}) {
  const t = useTranslations("clients.priority");
  const tList = useTranslations("clients.list");
  const chips = useCardChips(client);
  const name = clientFullName(client);
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
    <div className="group/card bg-card relative rounded-xl border p-3 shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-foreground/15 hover:shadow-md">
      <div className="flex items-start gap-2.5">
        <span className="relative flex shrink-0">
          <ClientAvatar name={name} side={client.side} size="md" />
          {followUp ? (
            <span
              aria-hidden
              className="bg-tone-amber ring-card absolute -top-px -right-px size-2.5 rounded-full ring-2"
            />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm leading-5 font-medium", reserve)}>
            {name}
            {followUp ? <span className="sr-only">, {tList("followUp")}</span> : null}
          </p>
          <CardFigure client={client} />
          {client.agency ? (
            <p className="text-muted-foreground truncate text-xs">{client.agency}</p>
          ) : null}
        </div>
      </div>
      {chips.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className={cn(
                "inline-flex h-5 max-w-full items-center gap-1 rounded-full border px-2 text-[11px] leading-none [&_svg]:size-3 [&_svg]:shrink-0",
                TONE_TAG[chip.tone]
              )}
            >
              {chip.icon}
              <span className="truncate">{chip.label}</span>
            </span>
          ))}
        </div>
      ) : null}
      {/* Who said what last, the same line as the table's: the card's pulse. */}
      <div className="mt-2.5 border-t pt-2">
        <LatestActivityLine activity={client.latest_activity} className="text-xs" />
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
  followUp,
  onTogglePriority,
  onOpen,
}: {
  client: ClientRow;
  followUp: boolean;
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
      <CardBody client={client} followUp={followUp} onTogglePriority={onTogglePriority} />
    </div>
  );
}

/*
  Each column is washed in its stage's tone, faintly: indigo while new, teal
  while viewing, green once reserved, yellow for a seller's valuation; the
  stages being worked stay grey. The board reads as the pipeline it is.
*/
const COLUMN_TINTS: Record<Tone, string> = {
  indigo: "bg-tone-indigo-soft/45",
  teal: "bg-tone-teal-soft/50",
  green: "bg-tone-green-soft/50",
  amber: "bg-tone-amber-soft/50",
  red: "bg-muted/40",
  neutral: "bg-muted/40",
  grey: "bg-muted/40",
  ink: "bg-muted/40",
};

function KanbanColumn({
  stage,
  side,
  clients,
  followUpIds,
  onTogglePriority,
  onOpen,
}: {
  stage: Stage;
  side: ClientSide;
  clients: ClientRow[];
  followUpIds?: ReadonlySet<string>;
  onTogglePriority: (id: string, next: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const t = useTranslations("clients.kanban");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const tone = STAGE_TONES[stage];
  // What the column is worth: buyers' top budgets, sellers' asking prices.
  const total = clients.reduce(
    (sum, c) =>
      sum + ((side === "buyer" ? (c.budget_max ?? c.budget_min) : c.asking_price) ?? 0),
    0
  );

  return (
    // A phone shows one column at a time; wider, the columns share the width
    // (a buyer's five fit a laptop beside the sidebar) and scroll only below
    // their minimum.
    <div className="flex w-[85vw] max-w-72 shrink-0 snap-start flex-col sm:w-auto sm:max-w-80 sm:min-w-[13.5rem] sm:flex-1 sm:basis-0">
      <div className="flex h-9 items-center gap-2 px-1">
        <span aria-hidden className={cn("size-2 rounded-full", TONE_SOLID[tone])} />
        <span className="text-sm font-medium">{stageLabel(tCrm, stage)}</span>
        <span className="bg-muted text-muted-foreground inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums">
          {clients.length}
        </span>
        {total > 0 ? (
          <span className="text-muted-foreground ml-auto truncate text-xs tabular-nums">
            <span className="sr-only">{side === "buyer" ? t("totalBudget") : t("totalAsking")}: </span>
            <Money value={total} locale={tag} compact />
          </span>
        ) : null}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-xl p-2 transition-[background-color,box-shadow] duration-150",
          COLUMN_TINTS[tone],
          isOver && "ring-primary/40 ring-2"
        )}
      >
        {clients.map((c) => (
          <KanbanCard
            key={c.id}
            client={c}
            followUp={followUpIds?.has(c.id) ?? false}
            onTogglePriority={onTogglePriority}
            onOpen={onOpen}
          />
        ))}
        {clients.length === 0 ? (
          <p className="text-muted-foreground border-foreground/10 flex h-20 items-center justify-center rounded-lg border-2 border-dashed px-2 text-center text-xs">
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
  followUpIds,
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
  /** Clients who need a follow-up (the list's own rule): an amber dot on their card. */
  followUpIds?: ReadonlySet<string>;
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
      {/* Relative, so the columns' screen-reader labels (absolutely placed)
          are clipped by this scroller instead of widening the page on a phone. */}
      <div className="relative flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto pb-4 sm:snap-none">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            side={side}
            clients={data.filter((c) => c.stage === stage)}
            followUpIds={followUpIds}
            onTogglePriority={onTogglePriority}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {activeClient ? (
          <CardBody client={activeClient} followUp={followUpIds?.has(activeClient.id) ?? false} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
