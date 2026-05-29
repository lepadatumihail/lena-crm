"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutGrid, List, Plus, Search, Star, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsKanban } from "@/components/clients/clients-kanban";
import {
  setClientPriority,
  updateClientStage,
} from "@/lib/actions/clients";
import {
  formatCurrency,
  STAGE_LABELS,
  stagesForSide,
  type ClientSide,
  type Stage,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase/types";

type ViewMode = "table" | "kanban";

export function ClientsView({
  clients,
  side,
  view: initialView,
  includeInactive,
  commission,
}: {
  clients: Client[];
  side: ClientSide;
  view: ViewMode;
  includeInactive: boolean;
  commission?: { pipeline: number; closed: number } | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticClients, applyOptimistic] = useOptimistic(
    clients,
    (state: Client[], update: { id: string; changes: Partial<Client> }) =>
      state.map((c) => (c.id === update.id ? { ...c, ...update.changes } : c))
  );
  const [view, setView] = useState<ViewMode>(initialView);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityOnly, setPriorityOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return optimisticClients.filter((c) => {
      if (priorityOnly && !c.priority) return false;
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (!q) return true;
      const haystack = [
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.agency,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [optimisticClients, search, stageFilter, priorityOnly]);

  function handleStageChange(id: string, stage: string) {
    startTransition(async () => {
      applyOptimistic({ id, changes: { stage } });
      const { error } = await updateClientStage(id, stage);
      if (error) toast.error("Couldn't move client", { description: error });
      else toast.success(`Moved to ${STAGE_LABELS[stage as Stage] ?? stage}`);
    });
  }

  function handleTogglePriority(id: string, next: boolean) {
    startTransition(async () => {
      applyOptimistic({ id, changes: { priority: next } });
      const { error } = await setClientPriority(id, next);
      if (error)
        toast.error("Couldn't update priority", { description: error });
    });
  }

  function toggleInactive(checked: boolean) {
    const params = new URLSearchParams({ side });
    if (checked) params.set("inactive", "1");
    router.push(`/clients?${params.toString()}`);
  }

  const stages = stagesForSide(side);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {side === "buyer" ? "Buyers" : "Sellers"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {optimisticClients.length}{" "}
            {optimisticClients.length === 1 ? "client" : "clients"}
            {includeInactive ? " (incl. inactive)" : ""}
          </p>
          {commission && (commission.pipeline > 0 || commission.closed > 0) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {commission.pipeline > 0 && (
                <Badge variant="warning">
                  {formatCurrency(commission.pipeline)} in pipeline
                </Badge>
              )}
              {commission.closed > 0 && (
                <Badge variant="success">
                  {formatCurrency(commission.closed)} closed
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button asChild>
          <Link href={`/clients/new?side=${side}`}>
            <Plus /> New {side}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-50 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search name, email, phone, agency…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={priorityOnly ? "default" : "outline"}
          onClick={() => setPriorityOnly((p) => !p)}
        >
          <Star className={cn(priorityOnly && "fill-current")} />
          Priority
        </Button>

        <div className="bg-muted ml-auto inline-flex rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
              view === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" /> Table
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
              view === "kanban"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-4" /> Board
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="inactive"
            checked={includeInactive}
            onCheckedChange={toggleInactive}
          />
          <Label htmlFor="inactive" className="text-muted-foreground text-sm">
            Inactive
          </Label>
        </div>
      </div>

      {optimisticClients.length === 0 ? (
        <EmptyState side={side} />
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
          No clients match your filters.
        </p>
      ) : view === "table" ? (
        <ClientsTable
          data={filtered}
          side={side}
          onTogglePriority={handleTogglePriority}
        />
      ) : (
        <ClientsKanban
          data={filtered}
          side={side}
          onStageChange={handleStageChange}
          onTogglePriority={handleTogglePriority}
        />
      )}
    </div>
  );
}

function EmptyState({ side }: { side: ClientSide }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div className="bg-muted text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-full">
        <Users className="size-6" />
      </div>
      <h3 className="font-medium">No {side}s yet</h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-sm">
        Add your first {side} to start tracking them through your pipeline.
      </p>
      <Button asChild className="mt-4">
        <Link href={`/clients/new?side=${side}`}>
          <Plus /> New {side}
        </Link>
      </Button>
    </div>
  );
}
