"use client";

import {
  useMemo,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Building2,
  CalendarSearch,
  Coins,
  Euro,
  EyeOff,
  Plus,
  Search,
  Star,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { ClientSheet } from "@/components/clients/client-sheet";
import { ClientsKanban } from "@/components/clients/clients-kanban";
import { ClientsTable } from "@/components/clients/clients-table";
import {
  FilterSelect,
  ToolbarChip,
  ToolbarTabs,
  ViewToggle,
} from "@/components/shell/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { intlTag } from "@/i18n/config";
import { dealTypeLabel, sellerRoleLabel, stageLabel } from "@/i18n/labels";
import {
  setClientActive,
  setClientPriority,
  updateClientStage,
} from "@/lib/actions/clients";
import {
  clientsPath,
  stagesForSide,
  STAGE_TONES,
  type ClientSide,
  type Stage,
} from "@/lib/crm";
import type { ClientRow } from "@/lib/data/clients";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "kanban";
type Update = { id: string; changes: Partial<ClientRow> };

const BUYER_TYPES = ["direct", "collab"] as const;
const SELLER_ROLES = ["owner", "representative"] as const;

export function ClientsView({
  clients,
  side,
  view: initialView,
  includeInactive,
  initialStage = "all",
  commission,
}: {
  clients: ClientRow[];
  side: ClientSide;
  view: ViewMode;
  includeInactive: boolean;
  /** Stage the filter starts on ("all" or a stage of this side). */
  initialStage?: string;
  commission?: { pipeline: number; closed: number } | null;
}) {
  const router = useRouter();
  const t = useTranslations("clients.list");
  const tTable = useTranslations("clients.table");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const tag = intlTag(locale);
  const [, startTransition] = useTransition();
  const [optimisticClients, applyOptimistic] = useOptimistic(
    clients,
    (state: ClientRow[], update: Update) =>
      state.map((c) => (c.id === update.id ? { ...c, ...update.changes } : c))
  );
  const [view, setView] = useState<ViewMode>(initialView);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(initialStage);
  // A sidebar link to another stage re-renders this same instance with a new
  // `initialStage`; adopt it (React's derived-state pattern, no effect).
  const [seenInitialStage, setSeenInitialStage] = useState(initialStage);
  if (initialStage !== seenInitialStage) {
    setSeenInitialStage(initialStage);
    setStageFilter(initialStage);
  }
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const isBuyer = side === "buyer";
  const stages = stagesForSide(side);

  // Rows hidden optimistically drop out at once unless inactive ones are shown.
  const visible = useMemo(
    () =>
      includeInactive
        ? optimisticClients
        : optimisticClients.filter((c) => c.is_active),
    [optimisticClients, includeInactive]
  );

  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of visible) counts.set(c.stage, (counts.get(c.stage) ?? 0) + 1);
    return counts;
  }, [visible]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible.filter((c) => {
      if (priorityOnly && !c.priority) return false;
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (typeFilter !== "all") {
        const type = isBuyer ? c.deal_type : c.seller_role;
        if (type !== typeFilter) return false;
      }
      if (!q) return true;
      return [c.first_name, c.last_name, c.email, c.phone, c.agency]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [visible, search, priorityOnly, stageFilter, typeFilter, isBuyer]);

  const selectedIds = useMemo(
    () =>
      Object.keys(selection).filter(
        (id) => selection[id] && filtered.some((c) => c.id === id)
      ),
    [selection, filtered]
  );
  const openRow = openId ? (optimisticClients.find((c) => c.id === openId) ?? null) : null;

  function changeStageFilter(stage: string) {
    setStageFilter(stage);
    // Keep the URL in step (so the sidebar highlights the stage) without a
    // server round-trip: the router picks this up from the history API.
    const url = new URL(window.location.href);
    if (stage === "all") url.searchParams.delete("stage");
    else url.searchParams.set("stage", stage);
    window.history.replaceState(null, "", url.toString());
  }

  function handleStageChange(id: string, stage: string) {
    startTransition(async () => {
      applyOptimistic({ id, changes: { stage } });
      const { error } = await updateClientStage(id, stage);
      if (error) toast.error(t("toasts.moveFailed"), { description: error });
      else toast.success(t("toasts.moved", { stage: stageLabel(tCrm, stage) }));
    });
  }

  function handleTogglePriority(id: string, next: boolean) {
    startTransition(async () => {
      applyOptimistic({ id, changes: { priority: next } });
      const { error } = await setClientPriority(id, next);
      if (error) toast.error(t("toasts.priorityFailed"), { description: error });
    });
  }

  function handleSetActive(id: string, active: boolean) {
    startTransition(async () => {
      applyOptimistic({ id, changes: { is_active: active } });
      if (openId === id && !active && !includeInactive) setOpenId(null);
      const { error } = await setClientActive(id, active);
      if (error) toast.error(t("toasts.updateFailed"), { description: error });
      router.refresh();
    });
  }

  /** Apply one action to every selected row, then report once. */
  function bulk(
    run: (id: string) => Promise<{ error: string | null }>,
    changes: Partial<ClientRow>,
    done: (count: number) => string
  ) {
    const ids = selectedIds;
    if (ids.length === 0) return;
    setSelection({});
    startTransition(async () => {
      for (const id of ids) applyOptimistic({ id, changes });
      const results = await Promise.all(ids.map(run));
      const failed = results.filter((r) => r.error).length;
      if (failed) toast.error(t("bulk.toasts.failed", { count: failed }));
      else toast.success(done(ids.length));
      router.refresh();
    });
  }

  function toggleInactive(checked: boolean) {
    router.push(`${clientsPath(side)}${checked ? "?inactive=1" : ""}`);
  }

  const typeOptions = [
    { value: "all", label: t("typeAll") },
    ...(isBuyer
      ? BUYER_TYPES.map((v) => ({ value: v, label: dealTypeLabel(tCrm, v) }))
      : SELLER_ROLES.map((v) => ({ value: v, label: sellerRoleLabel(tCrm, v) }))),
  ];

  const summary = (
    <Summary
      side={side}
      rows={filtered}
      commission={commission ?? null}
      locale={tag}
      selectedCount={selectedIds.length}
      stages={stages}
      stageLabelFor={(s) => stageLabel(tCrm, s)}
      onBulkStage={(stage) =>
        bulk(
          (id) => updateClientStage(id, stage),
          { stage },
          (count) => t("bulk.toasts.moved", { count, stage: stageLabel(tCrm, stage) })
        )
      }
      onBulkFlag={() =>
        bulk(
          (id) => setClientPriority(id, true),
          { priority: true },
          (count) => t("bulk.toasts.flagged", { count })
        )
      }
      onBulkHide={() =>
        bulk(
          (id) => setClientActive(id, false),
          { is_active: false },
          (count) => t("bulk.toasts.hidden", { count })
        )
      }
      onClear={() => setSelection({})}
    />
  );

  return (
    <div className="space-y-4">
      <StageTabs
        value={stageFilter}
        onChange={changeStageFilter}
        total={visible.length}
        stages={stages}
        counts={stageCounts}
        allLabel={t("all")}
        labelFor={(s) => stageLabel(tCrm, s)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 md:text-[13px]"
          />
        </div>

        <ToolbarChip pressed={priorityOnly} onClick={() => setPriorityOnly((p) => !p)}>
          <Star className={cn(priorityOnly && "fill-current")} />
          {t("priority")}
        </ToolbarChip>

        <FilterSelect
          label={isBuyer ? tTable("type") : tTable("role")}
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={typeOptions}
        />

        <label className="text-muted-foreground bg-background inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-medium shadow-xs">
          <Switch
            checked={includeInactive}
            onCheckedChange={toggleInactive}
            className="scale-90"
          />
          {t("inactive")}
        </label>

        <div className="ml-auto flex items-center gap-2">
          <ViewToggle
            view={view}
            onChange={setView}
            tableLabel={t("table")}
            boardLabel={t("board")}
          />
          <Button asChild size="sm" className="rounded-full">
            <Link href={`/clients/new?side=${side}`}>
              <Plus /> {t("newClient", { side })}
            </Link>
          </Button>
        </div>
      </div>

      {optimisticClients.length === 0 ? (
        <EmptyState side={side} />
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-xl border border-dashed py-16 text-center text-sm">
          {t("noMatches")}
        </p>
      ) : view === "table" ? (
        <ClientsTable
          data={filtered}
          side={side}
          selection={selection}
          onSelectionChange={setSelection}
          onOpen={setOpenId}
          onTogglePriority={handleTogglePriority}
          onStageChange={handleStageChange}
          onSetActive={handleSetActive}
          footer={summary}
        />
      ) : (
        <ClientsKanban
          data={filtered}
          side={side}
          onStageChange={handleStageChange}
          onTogglePriority={handleTogglePriority}
          onOpen={setOpenId}
        />
      )}

      <ClientSheet
        row={openRow}
        side={side}
        open={openRow != null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onTogglePriority={handleTogglePriority}
        onStageChange={handleStageChange}
      />
    </div>
  );
}

/* Stage filter as underlined tabs with a dot and a count per stage. */
function StageTabs({
  value,
  onChange,
  total,
  stages,
  counts,
  allLabel,
  labelFor,
}: {
  value: string;
  onChange: (stage: string) => void;
  total: number;
  stages: readonly Stage[];
  counts: Map<string, number>;
  allLabel: string;
  labelFor: (stage: Stage) => string;
}) {
  return (
    <ToolbarTabs
      value={value}
      onChange={onChange}
      tabs={[
        { value: "all", label: allLabel, count: total },
        ...stages.map((s) => ({
          value: s,
          label: labelFor(s),
          count: counts.get(s) ?? 0,
          dot: TONE_SOLID[STAGE_TONES[s]],
        })),
      ]}
    />
  );
}

function SummaryCell({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="text-muted-foreground flex h-9 items-center gap-1.5 border-l px-3 text-xs first:border-l-0 first:pl-4">
      {Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={1.75} /> : null}
      <span className="whitespace-nowrap">{label}</span>
      {value != null ? (
        <span className="text-foreground font-medium tabular-nums">{value}</span>
      ) : null}
    </div>
  );
}

/**
 * The strip under the table: totals for the rows in view, or — while rows
 * are ticked — the actions that apply to all of them at once.
 */
function Summary({
  side,
  rows,
  commission,
  locale,
  selectedCount,
  stages,
  stageLabelFor,
  onBulkStage,
  onBulkFlag,
  onBulkHide,
  onClear,
}: {
  side: ClientSide;
  rows: ClientRow[];
  commission: { pipeline: number; closed: number } | null;
  locale: string;
  selectedCount: number;
  stages: readonly Stage[];
  stageLabelFor: (stage: Stage) => string;
  onBulkStage: (stage: string) => void;
  onBulkFlag: () => void;
  onBulkHide: () => void;
  onClear: () => void;
}) {
  const t = useTranslations("clients.list");
  const isBuyer = side === "buyer";

  if (selectedCount > 0) {
    return (
      <div className="flex h-9 w-full items-center gap-1 px-2 text-xs">
        <span className="text-foreground px-2 font-medium tabular-nums">
          {t("selected", { count: selectedCount })}
        </span>
        <Select value="" onValueChange={onBulkStage}>
          <SelectTrigger
            size="sm"
            className="hover:bg-muted h-7 gap-1 border-0 bg-transparent px-2 text-xs shadow-none"
          >
            <SelectValue placeholder={t("bulk.moveTo")} />
          </SelectTrigger>
          <SelectContent>
            {stages.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {stageLabelFor(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="xs" onClick={onBulkFlag}>
          <Star /> {t("bulk.flag")}
        </Button>
        <Button variant="ghost" size="xs" onClick={onBulkHide}>
          <EyeOff /> {t("bulk.hide")}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground ml-auto"
          aria-label={t("clearSelection")}
          onClick={onClear}
        >
          <X />
        </Button>
      </div>
    );
  }

  const total = rows.reduce(
    (sum, c) => sum + ((isBuyer ? c.budget_max ?? c.budget_min : c.asking_price) ?? 0),
    0
  );
  const tally = rows.reduce(
    (sum, c) => sum + (isBuyer ? c.viewing_count : c.property_count),
    0
  );
  const priority = rows.filter((c) => c.priority).length;

  return (
    <>
      <SummaryCell
        icon={isBuyer ? Users : Building2}
        label={t("inView", { count: rows.length })}
      />
      <SummaryCell
        icon={Coins}
        label={isBuyer ? t("summary.budgetTotal") : t("summary.askingTotal")}
        value={<Money value={total} locale={locale} />}
      />
      <SummaryCell
        icon={CalendarSearch}
        label={isBuyer ? t("summary.viewings") : t("summary.properties")}
        value={tally}
      />
      {priority > 0 ? (
        <SummaryCell icon={Star} label={t("summary.priority")} value={priority} />
      ) : null}
      {commission && commission.pipeline > 0 ? (
        <SummaryCell
          icon={Euro}
          label={t("summary.commission")}
          value={<Money value={commission.pipeline} locale={locale} />}
        />
      ) : null}
      {commission && commission.closed > 0 ? (
        <SummaryCell
          label={t("summary.closed")}
          value={<Money value={commission.closed} locale={locale} />}
        />
      ) : null}
    </>
  );
}

function EmptyState({ side }: { side: ClientSide }) {
  const t = useTranslations("clients.list");
  return (
    <div className="bg-card flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div className="bg-muted text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-full">
        <Users className="size-6" strokeWidth={1.5} />
      </div>
      <h3 className="font-medium">{t("empty.title", { side })}</h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-sm">
        {t("empty.body", { side })}
      </p>
      <Button asChild className="mt-4">
        <Link href={`/clients/new?side=${side}`}>
          <Plus /> {t("newClient", { side })}
        </Link>
      </Button>
    </div>
  );
}
