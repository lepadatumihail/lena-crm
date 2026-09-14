import Link from "next/link";

import type { AttentionItem } from "@/lib/data/dashboard";
import { PanelEmpty } from "@/components/shell/panel";
import { cn } from "@/lib/utils";
import { TONE_SOLID, type Tone } from "@/lib/tones";

const KIND_TONE: Record<AttentionItem["kind"], Tone> = {
  new_lead: "blue",
  stalled_offer: "brand",
  follow_up: "amber",
  reservation: "green",
};

/**
 * Action items as single-line rows on a wide screen (name, then the reason
 * in muted ink), two lines on a phone. The right-hand word says what the
 * click does: open the client, or open with a message drafted.
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
        <li key={a.id}>
          <Link
            href={a.href}
            className="hover:bg-muted/40 flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 sm:h-11 sm:py-0"
          >
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", TONE_SOLID[KIND_TONE[a.kind]])}
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
        </li>
      ))}
    </ul>
  );
}
