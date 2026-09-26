import Link from "next/link";
import { Star } from "lucide-react";

import type { RecentClient } from "@/lib/data/dashboard";
import { relativeAgo } from "@/lib/home";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { StageBadge } from "@/components/clients/stage-badge";
import { PanelEmpty } from "@/components/shell/panel";
import { Money } from "@/components/ui/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * The last few clients the agent touched, as a small table in the same
 * language as the client lists. `sideLabel`/`stageLabel` are resolved by the
 * page; `whenLabel` turns an updated_at into "3 hours ago" in the agent's
 * language. The whole row is the link.
 */
export function RecentClients({
  clients,
  intlTag,
  nowISO,
  columns,
  emptyLabel,
  priorityLabel,
  nowLabel,
  sideLabel,
}: {
  clients: RecentClient[];
  intlTag: string;
  /** The render instant, so "3 hours ago" agrees with the rest of the page. */
  nowISO: string;
  columns: { client: string; stage: string; amount: string; updated: string };
  emptyLabel: string;
  priorityLabel: string;
  nowLabel: string;
  sideLabel: (side: RecentClient["side"]) => string;
}) {
  if (clients.length === 0) return <PanelEmpty>{emptyLabel}</PanelEmpty>;

  const rtf = new Intl.RelativeTimeFormat(intlTag, { numeric: "always" });
  const when = (iso: string) => {
    const { unit, value } = relativeAgo(iso, nowISO);
    return unit === "now" ? nowLabel : rtf.format(-value, unit);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">{columns.client}</TableHead>
          <TableHead className="max-sm:pr-4 max-sm:text-right">{columns.stage}</TableHead>
          <TableHead className="text-right max-sm:hidden">{columns.amount}</TableHead>
          <TableHead className="pr-4 text-right max-sm:hidden">{columns.updated}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((c) => (
          <TableRow key={c.id} className="relative">
            <TableCell className="pl-4 max-sm:py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <ClientAvatar name={c.name} side={c.side} />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Link
                      href={`/clients/${c.id}`}
                      className="truncate font-medium after:absolute after:inset-0 after:content-['']"
                    >
                      {c.name}
                    </Link>
                    {c.priority ? (
                      <Star
                        className="fill-foreground text-foreground size-3.5 shrink-0"
                        aria-label={priorityLabel}
                      />
                    ) : null}
                  </div>
                  {/* A phone has no room for the amount and updated columns:
                      they ride under the name instead. */}
                  <p className="text-muted-foreground text-xs sm:hidden">
                    {c.amount != null ? (
                      <>
                        <Money value={c.amount} locale={intlTag} compact />
                        <span className="mx-1">·</span>
                      </>
                    ) : null}
                    {when(c.updated_at)}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="max-sm:pr-4">
              <div className="flex items-center gap-2 max-sm:justify-end">
                <StageBadge stage={c.stage} />
                <span className="text-muted-foreground hidden text-xs md:inline">
                  {sideLabel(c.side)}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right max-sm:hidden">
              <Money value={c.amount} locale={intlTag} />
            </TableCell>
            <TableCell className="text-muted-foreground pr-4 text-right text-xs max-sm:hidden">
              {when(c.updated_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
