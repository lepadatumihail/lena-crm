"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  type Column,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronsUpDown,
  EyeOff,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  SquareArrowOutUpRight,
  Star,
} from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { StageBadge } from "@/components/clients/stage-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Money } from "@/components/ui/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { dealTypeLabel, sellerRoleLabel, stageLabel } from "@/i18n/labels";
import {
  clientFullName,
  stageIndex,
  stagesForSide,
  type ClientSide,
} from "@/lib/crm";
import type { ClientRow } from "@/lib/data/clients";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match TanStack's signature to merge
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Figures sit flush right: the header cell and body cells read this one flag. */
    align?: "right";
  }
}

function SortHead({
  column,
  children,
}: {
  column: Column<ClientRow>;
  children: ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "group/sort hover:text-foreground inline-flex items-center gap-1 transition-colors duration-150",
        column.columnDef.meta?.align === "right" && "flex-row-reverse"
      )}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="size-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3" />
      ) : (
        <ChevronsUpDown className="size-3 opacity-0 transition-opacity duration-150 group-hover/sort:opacity-60" />
      )}
    </button>
  );
}

/** A buyer's budget as one figure: a range, "up to X" or "from X". */
function Budget({
  min,
  max,
  locale,
  upTo,
  from,
}: {
  min: number | null;
  max: number | null;
  locale: string;
  upTo: (amount: ReactNode) => ReactNode;
  from: (amount: ReactNode) => ReactNode;
}) {
  if (min != null && max != null) {
    return (
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Money value={min} locale={locale} />
        <span className="text-muted-foreground">–</span>
        <Money value={max} locale={locale} />
      </span>
    );
  }
  if (max != null) return <>{upTo(<Money value={max} locale={locale} />)}</>;
  if (min != null) return <>{from(<Money value={min} locale={locale} />)}</>;
  return <span className="text-muted-foreground">—</span>;
}

export function ClientsTable({
  data,
  side,
  selection,
  onSelectionChange,
  onOpen,
  onTogglePriority,
  onStageChange,
  onSetActive,
  footer,
}: {
  data: ClientRow[];
  side: ClientSide;
  selection: RowSelectionState;
  onSelectionChange: (selection: RowSelectionState) => void;
  onOpen: (id: string) => void;
  onTogglePriority: (id: string, next: boolean) => void;
  onStageChange: (id: string, stage: string) => void;
  onSetActive: (id: string, active: boolean) => void;
  /** Summary cells under the rows. */
  footer?: ReactNode;
}) {
  const t = useTranslations("clients");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const tag = intlTag(locale);
  const [sorting, setSorting] = useState<SortingState>([]);
  const isBuyer = side === "buyer";

  const columns = useMemo<ColumnDef<ClientRow>[]>(() => {
    const when = (iso: string) =>
      formatDistanceToNowStrict(new Date(iso), {
        addSuffix: true,
        locale: dateFnsLocale(locale),
      });

    const amount: ColumnDef<ClientRow> = isBuyer
      ? {
          id: "budget",
          accessorFn: (c) => c.budget_max ?? c.budget_min ?? 0,
          meta: { align: "right" },
          header: ({ column }) => (
            <SortHead column={column}>{t("table.budget")}</SortHead>
          ),
          cell: ({ row }) => (
            <Budget
              min={row.original.budget_min}
              max={row.original.budget_max}
              locale={tag}
              upTo={(a) => t.rich("table.upTo", { amount: () => a })}
              from={(a) => t.rich("table.from", { amount: () => a })}
            />
          ),
        }
      : {
          id: "asking_price",
          accessorFn: (c) => c.asking_price ?? 0,
          meta: { align: "right" },
          header: ({ column }) => (
            <SortHead column={column}>{t("table.askingPrice")}</SortHead>
          ),
          cell: ({ row }) => (
            <Money value={row.original.asking_price} locale={tag} />
          ),
        };

    const tally: ColumnDef<ClientRow> = isBuyer
      ? {
          id: "viewings",
          accessorKey: "viewing_count",
          meta: { align: "right" },
          header: ({ column }) => (
            <SortHead column={column}>{t("table.viewings")}</SortHead>
          ),
          cell: ({ row }) =>
            row.original.viewing_count || (
              <span className="text-muted-foreground">0</span>
            ),
        }
      : {
          id: "properties",
          accessorKey: "property_count",
          meta: { align: "right" },
          header: ({ column }) => (
            <SortHead column={column}>{t("table.properties")}</SortHead>
          ),
          cell: ({ row }) =>
            row.original.property_count || (
              <span className="text-muted-foreground">0</span>
            ),
        };

    return [
      {
        id: "select",
        enableSorting: false,
        size: 40,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label={t("table.selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(event) => event.stopPropagation()}
            aria-label={t("table.selectRow", { name: clientFullName(row.original) })}
          />
        ),
      },
      {
        id: "name",
        accessorFn: (c) => clientFullName(c),
        header: ({ column }) => (
          <SortHead column={column}>{t("table.name")}</SortHead>
        ),
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <ClientAvatar name={clientFullName(c)} side={c.side} />
              <Link
                href={`/clients/${c.id}`}
                onClick={(event) => event.stopPropagation()}
                className="truncate font-medium hover:underline"
              >
                {clientFullName(c)}
              </Link>
              {c.priority ? (
                <Star
                  className="fill-primary text-primary size-3.5 shrink-0"
                  aria-label={t("priority.unflag")}
                />
              ) : null}
              {!c.is_active ? <Tag>{t("table.inactive")}</Tag> : null}
            </div>
          );
        },
      },
      {
        id: "stage",
        accessorKey: "stage",
        header: ({ column }) => (
          <SortHead column={column}>{t("table.stage")}</SortHead>
        ),
        sortingFn: (a, b) =>
          stageIndex(side, a.original.stage) - stageIndex(side, b.original.stage),
        cell: ({ row }) => <StageBadge stage={row.original.stage} dot />,
      },
      amount,
      tally,
      {
        id: "type",
        enableSorting: false,
        header: () => (isBuyer ? t("table.type") : t("table.role")),
        cell: ({ row }) => {
          const c = row.original;
          const label = isBuyer
            ? c.deal_type
              ? dealTypeLabel(tCrm, c.deal_type)
              : null
            : c.seller_role
              ? sellerRoleLabel(tCrm, c.seller_role)
              : null;
          return (
            <span className="text-muted-foreground text-[13px]">{label ?? "—"}</span>
          );
        },
      },
      {
        id: "agency",
        accessorKey: "agency",
        header: ({ column }) => (
          <SortHead column={column}>{t("table.agency")}</SortHead>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-[13px]">
            {row.original.agency || "—"}
          </span>
        ),
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        header: ({ column }) => (
          <SortHead column={column}>{t("table.lastActivity")}</SortHead>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[13px]">
            <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.75} />
            {when(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        size: 48,
        header: () => <span className="sr-only">{t("table.actions")}</span>,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-foreground data-[state=open]:bg-accent"
                    aria-label={t("table.actions")}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenuItem asChild>
                    <Link href={`/clients/${c.id}`}>
                      <SquareArrowOutUpRight />
                      {t("rowMenu.open")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/clients/${c.id}/edit`}>
                      <Pencil />
                      {t("rowMenu.edit")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>{t("rowMenu.moveTo")}</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                          value={c.stage}
                          onValueChange={(stage) => onStageChange(c.id, stage)}
                        >
                          {stagesForSide(side).map((s) => (
                            <DropdownMenuRadioItem key={s} value={s}>
                              {stageLabel(tCrm, s)}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem onSelect={() => onTogglePriority(c.id, !c.priority)}>
                    <Star className={cn(c.priority && "fill-primary text-primary")} />
                    {c.priority ? t("priority.unflag") : t("priority.flag")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onSetActive(c.id, !c.is_active)}>
                    {c.is_active ? <EyeOff /> : <RotateCcw />}
                    {c.is_active ? t("rowMenu.hide") : t("rowMenu.reactivate")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [isBuyer, side, t, tCrm, tag, locale, onStageChange, onTogglePriority, onSetActive]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection: selection },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater: Updater<RowSelectionState>) =>
      onSelectionChange(typeof updater === "function" ? updater(selection) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    header.column.id === "select" && "w-10 pl-4",
                    header.column.id === "actions" && "w-12 pr-3",
                    header.column.columnDef.meta?.align === "right" && "text-right"
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => onOpen(row.original.id)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    cell.column.id === "select" && "w-10 pl-4",
                    cell.column.id === "actions" && "w-12 pr-3",
                    cell.column.id === "name" && "max-w-[18rem]",
                    cell.column.columnDef.meta?.align === "right" &&
                      "text-right tabular-nums"
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {footer ? (
        <div className="flex flex-wrap items-center border-t">{footer}</div>
      ) : null}
    </div>
  );
}
