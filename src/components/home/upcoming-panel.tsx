"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { format, isToday, isTomorrow } from "date-fns";
import { MessageCircle } from "lucide-react";

import { PanelEmpty } from "@/components/shell/panel";
import { buttonVariants } from "@/components/ui/button";
import { dateFnsLocale } from "@/i18n/dates";
import { eventReminderHref } from "@/lib/event-reminder";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

const LIMIT = 6;

export function UpcomingPanel({
  events,
  waitingBuyers = 0,
}: {
  events: CalendarEvent[];
  /** Buyers who haven't reached the viewing stage; shapes the empty state. */
  waitingBuyers?: number;
}) {
  const t = useTranslations("home.upcoming");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  function dayLabel(iso: string): string {
    const d = new Date(iso);
    if (isToday(d)) return tCommon("today");
    if (isTomorrow(d)) return tCommon("tomorrow");
    return format(d, "EEE d MMM", { locale: dateFnsLocale(locale) });
  }

  const sorted = [...events]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, LIMIT);

  if (sorted.length === 0) {
    return (
      <PanelEmpty>
        {t.rich(waitingBuyers > 0 ? "emptyWaiting" : "empty", {
          count: waitingBuyers,
          link: (chunks) => (
            <Link href="/calendar" className="text-primary hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </PanelEmpty>
    );
  }

  return (
    <ul className="divide-y">
      {sorted.map((e) => {
        const remind = eventReminderHref(e);
        return (
          <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-14 shrink-0 leading-tight">
              <p className="truncate text-xs font-medium first-letter:uppercase">
                {dayLabel(e.starts_at)}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {format(new Date(e.starts_at), "HH:mm")}
              </p>
            </div>
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                e.kind === "viewing" ? "bg-amber-500" : "bg-blue-500"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.title}</p>
              {e.location ? (
                <p className="text-muted-foreground truncate text-xs">
                  {e.location}
                </p>
              ) : null}
            </div>
            {remind ? (
              <a
                href={remind}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-xs" }),
                  "shrink-0 rounded-full"
                )}
                title={t("remindTitle")}
                aria-label={t("remindAria")}
              >
                <MessageCircle className="size-3.5 text-[#25D366]" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
