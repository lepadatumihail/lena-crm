"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDistanceToNowStrict } from "date-fns";
import { Star } from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { Budget } from "@/components/clients/clients-table";
import { StageBadge } from "@/components/clients/stage-badge";
import { Money } from "@/components/ui/money";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { lastTouchedAt } from "@/lib/activity";
import { clientFullName, type ClientSide } from "@/lib/crm";
import type { ClientRow } from "@/lib/data/clients";
import { cn } from "@/lib/utils";

/**
 * The client list on a phone: one tap target per client instead of a table
 * that scrolls sideways. Name and stage on the first line; the money and
 * when they were last reached on the second. A tap opens the quick view,
 * where the stage, WhatsApp and Call are. Selection and totals stay on the
 * wider table.
 */
export function ClientsPhoneList({
  data,
  side,
  onOpen,
  className,
}: {
  data: ClientRow[];
  side: ClientSide;
  onOpen: (id: string) => void;
  className?: string;
}) {
  const t = useTranslations("clients");
  const locale = useLocale();
  const tag = intlTag(locale);
  const isBuyer = side === "buyer";

  return (
    <ul className={cn("bg-card divide-y overflow-hidden rounded-xl border", className)}>
      {data.map((c) => {
        const name = clientFullName(c);
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onOpen(c.id)}
              className="active:bg-muted/60 focus-visible:bg-muted/60 flex w-full items-center gap-3 px-3.5 py-3 text-left outline-none transition-colors duration-150"
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
                </span>
                <span className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px]">
                  <span className="truncate tabular-nums">
                    {isBuyer ? (
                      <Budget
                        min={c.budget_min}
                        max={c.budget_max}
                        locale={tag}
                        compact
                        upTo={(a) => t.rich("table.upTo", { amount: () => a })}
                        from={(a) => t.rich("table.from", { amount: () => a })}
                      />
                    ) : c.asking_price != null ? (
                      <Money value={c.asking_price} locale={tag} compact />
                    ) : (
                      "—"
                    )}
                  </span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0">
                    {formatDistanceToNowStrict(new Date(lastTouchedAt(c)), {
                      addSuffix: true,
                      locale: dateFnsLocale(locale),
                    })}
                  </span>
                </span>
              </span>
              <StageBadge stage={c.stage} dot className="shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
