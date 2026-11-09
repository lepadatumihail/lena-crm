import Link from "next/link";
import { Star } from "lucide-react";

import type { RecentClient } from "@/lib/data/dashboard";
import { relativeAgo } from "@/lib/home";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { StageBadge } from "@/components/clients/stage-badge";
import { PanelEmpty } from "@/components/shell/panel";
import { Money } from "@/components/ui/money";

/**
 * The last few clients the agent touched, as rows in the same shape as Needs
 * attention: initials, the name and a line with the side, the budget or
 * asking price and when, then the stage as a pill. `sideLabel` is resolved
 * by the page; the times are "3 hours ago" in the agent's language. The
 * whole row is the link.
 */
export function RecentClients({
  clients,
  intlTag,
  nowISO,
  emptyLabel,
  priorityLabel,
  nowLabel,
  sideLabel,
}: {
  clients: RecentClient[];
  intlTag: string;
  /** The render instant, so "3 hours ago" agrees with the rest of the page. */
  nowISO: string;
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
    <ul className="divide-y">
      {clients.map((c) => (
        <li
          key={c.id}
          className="hover:bg-muted/40 relative flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
        >
          <ClientAvatar name={c.name} side={c.side} size="row" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={`/clients/${c.id}`}
                className="focus-visible:after:ring-ring/50 truncate text-sm leading-5 font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-inset"
              >
                {c.name}
              </Link>
              {c.priority ? (
                <Star
                  className="fill-foreground text-foreground size-3 shrink-0"
                  aria-label={priorityLabel}
                />
              ) : null}
            </div>
            {/* A phone keeps the amount short and leaves the side to the pill. */}
            <p className="text-muted-foreground truncate text-xs leading-5">
              <span className="max-sm:hidden">
                {sideLabel(c.side)}
                <span className="mx-1">·</span>
              </span>
              {c.amount != null ? (
                <>
                  <Money value={c.amount} locale={intlTag} className="max-sm:hidden" />
                  <Money value={c.amount} locale={intlTag} compact className="sm:hidden" />
                  <span className="mx-1">·</span>
                </>
              ) : null}
              {when(c.updated_at)}
            </p>
          </div>
          <StageBadge stage={c.stage} />
        </li>
      ))}
    </ul>
  );
}
