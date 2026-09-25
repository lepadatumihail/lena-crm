import Link from "next/link";

import type { AttentionItem } from "@/lib/data/dashboard";
import { LogContactButton } from "@/components/clients/contact-log";
import { PanelEmpty } from "@/components/shell/panel";
import { cn } from "@/lib/utils";
import { TONE_SOLID, type Tone } from "@/lib/tones";

/* The dot says how late an item is, not what kind it is: red overdue, amber today. */
const URGENCY_TONE: Record<NonNullable<AttentionItem["urgency"]>, Tone> = {
  overdue: "red",
  today: "amber",
};

/**
 * Action items as single-line rows on a wide screen (name, then the reason
 * in muted ink), two lines on a phone. The right-hand word says what the
 * click does: open the client, or open with a message drafted. The check at
 * the end logs a contact made elsewhere, which clears a quiet lead or a new
 * one from the list without leaving Home.
 */
export function AttentionList({
  items,
  emptyLabel,
  openLabel,
  draftLabel,
}: {
  items: AttentionItem[];
  emptyLabel: string;
  openLabel: string;
  draftLabel: string;
}) {
  if (items.length === 0) return <PanelEmpty>{emptyLabel}</PanelEmpty>;

  return (
    <ul className="divide-y">
      {items.map((a) => (
        <li
          key={a.id}
          className="hover:bg-muted/40 relative flex items-center gap-2 pr-2.5 transition-colors duration-150"
        >
          {/* The link stretches over the row; the log button sits above it. */}
          <Link
            href={a.href}
            className="focus-visible:after:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-inset sm:h-11 sm:py-0"
          >
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", TONE_SOLID[a.urgency ? URGENCY_TONE[a.urgency] : "neutral"])}
            />
            <span className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-2">
              <span className="block truncate text-sm font-medium">
                {a.title}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {a.detail}
              </span>
            </span>
            <span className="text-primary shrink-0 text-xs font-medium">
              {a.href.includes("compose=") ? draftLabel : openLabel}
            </span>
          </Link>
          <LogContactButton
            client={a.client}
            iconOnly
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground relative z-10 shrink-0"
          />
        </li>
      ))}
    </ul>
  );
}
