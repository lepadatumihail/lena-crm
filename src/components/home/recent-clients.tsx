import Link from "next/link";
import { Star } from "lucide-react";

import type { RecentClient } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/crm";
import { relativeAgo } from "@/lib/home";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

/**
 * The last few clients the agent touched. `sideLabel`/`stageLabel` are
 * resolved by the page; `whenLabel` turns an updated_at into "3 hours ago"
 * in the agent's language.
 */
export function RecentClients({
  clients,
  intlTag,
  nowISO,
  emptyLabel,
  priorityLabel,
  nowLabel,
  sideLabel,
  stageLabel,
}: {
  clients: RecentClient[];
  intlTag: string;
  /** The render instant, so "3 hours ago" agrees with the rest of the page. */
  nowISO: string;
  emptyLabel: string;
  priorityLabel: string;
  nowLabel: string;
  sideLabel: (side: RecentClient["side"]) => string;
  stageLabel: (stage: string) => string;
}) {
  if (clients.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  const rtf = new Intl.RelativeTimeFormat(intlTag, { numeric: "always" });
  const when = (iso: string) => {
    const { unit, value } = relativeAgo(iso, nowISO);
    return unit === "now" ? nowLabel : rtf.format(-value, unit);
  };

  return (
    <div className="space-y-1">
      {clients.map((c) => (
        <Link
          key={c.id}
          href={`/clients/${c.id}`}
          className="hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
        >
          <span
            className={cn(
              "bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
              c.side === "seller" && "bg-primary/10 text-primary"
            )}
          >
            {initials(c.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-medium">
              <span className="truncate">{c.name}</span>
              {c.priority && (
                <Star
                  className="fill-warning text-warning size-3 shrink-0"
                  aria-label={priorityLabel}
                />
              )}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {sideLabel(c.side)} · {stageLabel(c.stage)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {c.amount != null && (
              <p className="text-sm font-medium tabular-nums">
                {formatCurrency(c.amount, intlTag)}
              </p>
            )}
            <p className="text-muted-foreground text-xs">{when(c.updated_at)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
