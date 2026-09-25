"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import {
  ContactIcons,
  LatestActivityLine,
  type RowChannel,
} from "@/components/clients/row-contact";
import { StageBadge } from "@/components/clients/stage-badge";
import { clientFullName } from "@/lib/crm";
import type { ClientRow } from "@/lib/data/clients";
import { cn } from "@/lib/utils";

/**
 * The client list on a phone: one tap target per client instead of a table
 * that scrolls sideways. Name and stage on the first line; how they were
 * last reached, and when, on the second. A tap opens the quick view; the
 * icon at the end opens WhatsApp (or the dialler) and logs the contact.
 * Selection and totals stay on the wider table.
 */
export function ClientsPhoneList({
  data,
  onOpen,
  onContact,
  className,
}: {
  data: ClientRow[];
  onOpen: (id: string) => void;
  onContact: (client: ClientRow, channel: RowChannel) => void;
  className?: string;
}) {
  const t = useTranslations("clients");

  return (
    <ul className={cn("bg-card divide-y overflow-hidden rounded-xl border", className)}>
      {data.map((c) => {
        const name = clientFullName(c);
        return (
          <li key={c.id} className="relative">
            {/* Every row keeps room for the icon, so the stages line up. */}
            <button
              type="button"
              onClick={() => onOpen(c.id)}
              className="active:bg-muted/60 focus-visible:bg-muted/60 flex w-full items-center gap-3 py-3 pr-12 pl-3.5 text-left outline-none transition-colors duration-150"
            >
              <ClientAvatar name={name} side={c.side} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-medium">{name}</span>
                  {c.priority ? (
                    <Star
                      aria-label={t("list.priority")}
                      className="fill-primary text-primary size-3.5 shrink-0"
                    />
                  ) : null}
                  <StageBadge stage={c.stage} dot className="ml-auto" />
                </span>
                <LatestActivityLine
                  activity={c.latest_activity}
                  className="mt-1 gap-1 text-[13px]"
                />
              </span>
            </button>
            <ContactIcons
              single
              client={c}
              onContact={(channel) => onContact(c, channel)}
              className="absolute top-1/2 right-2 -translate-y-1/2"
            />
          </li>
        );
      })}
    </ul>
  );
}
