"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpDown, ChevronRight, Star } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/clients/stage-badge";
import {
  clientFullName,
  DEAL_TYPE_LABELS,
  SELLER_ROLE_LABELS,
  stageIndex,
  type ClientSide,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase/types";

function SortHeader({
  label,
  column,
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: any;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 px-2"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="text-muted-foreground/60" />
    </Button>
  );
}

export function ClientsTable({
  data,
  side,
  onTogglePriority,
}: {
  data: Client[];
  side: ClientSide;
  onTogglePriority: (id: string, next: boolean) => void;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        id: "priority",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <button
              type="button"
              aria-label={c.priority ? "Unflag priority" : "Flag priority"}
              className="flex items-center justify-center p-1"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePriority(c.id, !c.priority);
              }}
            >
              <Star
                className={cn(
                  "size-4 transition-colors",
                  c.priority
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
              />
            </button>
          );
        },
      },
      {
        id: "name",
        accessorFn: (c) => clientFullName(c),
        header: ({ column }) => <SortHeader label="Name" column={column} />,
        cell: ({ row }) => (
          <span className="font-medium">{clientFullName(row.original)}</span>
        ),
      },
      {
        id: "stage",
        accessorKey: "stage",
        header: ({ column }) => <SortHeader label="Stage" column={column} />,
        sortingFn: (a, b) =>
          stageIndex(side, a.original.stage) -
          stageIndex(side, b.original.stage),
        cell: ({ row }) => <StageBadge stage={row.original.stage} />,
      },
      {
        id: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          const label =
            c.side === "buyer"
              ? c.deal_type
                ? DEAL_TYPE_LABELS[c.deal_type]
                : null
              : c.seller_role
                ? SELLER_ROLE_LABELS[c.seller_role]
                : null;
          return (
            <span className="text-muted-foreground text-sm">
              {label ?? "—"}
            </span>
          );
        },
      },
      {
        id: "agency",
        accessorKey: "agency",
        header: ({ column }) => <SortHeader label="Agency" column={column} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.agency || "—"}
          </span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <span className="text-muted-foreground text-sm">
              {c.email || c.phone || "—"}
            </span>
          );
        },
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        header: ({ column }) => <SortHeader label="Updated" column={column} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(new Date(row.original.updated_at), {
              addSuffix: true,
            })}
          </span>
        ),
      },
      {
        id: "open",
        header: "",
        enableSorting: false,
        cell: () => (
          <ChevronRight className="text-muted-foreground/50 size-4" />
        ),
      },
    ],
    [side, onTogglePriority]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => router.push(`/clients/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
