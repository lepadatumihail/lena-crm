"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { format, isToday, isTomorrow } from "date-fns";
import { MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { dateFnsLocale } from "@/i18n/dates";
import { eventReminderHref } from "@/lib/event-reminder";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

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
    .slice(0, 6);

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
        {t.rich(waitingBuyers > 0 ? "emptyWaiting" : "empty", {
          count: waitingBuyers,
          link: (chunks) => (
            <Link href="/calendar" className="text-primary hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((e) => {
        const remind = eventReminderHref(e);
        return (
          <div
            key={e.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                e.kind === "viewing" ? "bg-primary" : "bg-muted-foreground"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.title}</p>
              <p className="text-muted-foreground text-xs">
                {dayLabel(e.starts_at)} · {format(new Date(e.starts_at), "HH:mm")}
                {e.location ? ` · ${e.location}` : ""}
              </p>
            </div>
            {remind && (
              <a
                href={remind}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-8 shrink-0"
                )}
                title={t("remindTitle")}
                aria-label={t("remindAria")}
              >
                <MessageCircle className="size-4 text-[#25D366]" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
