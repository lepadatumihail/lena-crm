import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

import type { AttentionItem } from "@/lib/data/dashboard";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { LogContactButton } from "@/components/clients/contact-log";
import { StageBadge } from "@/components/clients/stage-badge";
import { PanelEmpty } from "@/components/shell/panel";
import { cn } from "@/lib/utils";
import { TONE_SOLID, type Tone } from "@/lib/tones";

/* The dot says how late an item is, not what kind it is: red overdue, amber today. */
const URGENCY_TONE: Record<NonNullable<AttentionItem["urgency"]>, Tone> = {
  overdue: "red",
  today: "amber",
};

/**
 * Action items as inbox rows: the client's initials with a dot for how late
 * the item is, the name over why it's here, and at the end the stage as a
 * pill beside the check. The whole row opens the client (with a message
 * drafted, where there's one to send), which a hover names on a wide screen.
 * The check logs a contact made elsewhere, which clears a quiet lead or a
 * new one from the list without leaving Home.
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
      {items.map((a) => {
        const drafts = a.href.includes("compose=");
        return (
          <li
            key={a.id}
            className="group hover:bg-muted/40 relative flex items-center gap-3 py-2.5 pr-2.5 pl-4 transition-colors duration-150"
          >
            <span className="relative flex shrink-0">
              <ClientAvatar name={a.title} side={a.client.side} size="row" />
              {a.urgency ? (
                <span
                  aria-hidden
                  className={cn(
                    "ring-card absolute -top-px -right-px size-2.5 rounded-full ring-2",
                    TONE_SOLID[URGENCY_TONE[a.urgency]]
                  )}
                />
              ) : null}
            </span>
            {/* The link stretches over the row; the log button sits above it. */}
            <Link
              href={a.href}
              className="focus-visible:after:ring-ring/50 min-w-0 flex-1 outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-inset"
            >
              <span className="block truncate text-sm leading-5 font-medium">{a.title}</span>
              <span className="text-muted-foreground block truncate text-[13px] leading-5">
                {a.detail}
              </span>
              <span className="sr-only">, {drafts ? draftLabel : openLabel}</span>
            </Link>
            <span
              aria-hidden
              className="text-muted-foreground hidden shrink-0 items-center gap-1 text-xs opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 sm:inline-flex"
            >
              {drafts ? (
                <PenLine className="size-3.5" strokeWidth={1.75} />
              ) : null}
              {drafts ? draftLabel : openLabel}
              {drafts ? null : <ArrowRight className="size-3.5" strokeWidth={1.75} />}
            </span>
            <StageBadge stage={a.client.stage} />
            <LogContactButton
              client={a.client}
              iconOnly
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground relative z-10 shrink-0"
            />
          </li>
        );
      })}
    </ul>
  );
}
