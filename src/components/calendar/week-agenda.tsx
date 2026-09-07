"use client";

import { useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { dateFnsLocale } from "@/i18n/dates";
import { Button } from "@/components/ui/button";
import { EventRow } from "@/components/calendar/event-row";
import { dayKey, eventEndMs } from "@/lib/calendar-view";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

/**
 * The week as a list, for phones: a heading per day with its events under
 * it. In the current week, days already gone fold into one line so today is
 * at the top.
 */
export function WeekAgenda({
  days,
  byDay,
  todayKey,
  now,
  onAddDay,
  onOpenEvent,
  className,
}: {
  days: Date[];
  byDay: Map<string, CalendarEvent[]>;
  todayKey: string | null;
  now: Date;
  onAddDay: (dateKey: string) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  className?: string;
}) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const dateLocale = dateFnsLocale(useLocale());
  const [showEarlier, setShowEarlier] = useState(false);
  const nowMs = now.getTime();
  const tomorrowKey = todayKey ? dayKey(addDays(parseISO(todayKey), 1)) : null;

  const currentWeek =
    todayKey != null && days.some((day) => dayKey(day) === todayKey);
  const folded =
    currentWeek && !showEarlier
      ? days.filter((day) => dayKey(day) < todayKey!)
      : [];
  const foldedCount = folded.reduce(
    (n, day) => n + (byDay.get(dayKey(day))?.length ?? 0),
    0
  );
  const shown = folded.length > 0 ? days.slice(folded.length) : days;

  return (
    <div className={cn("space-y-5", className)}>
      {foldedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowEarlier(true)}
          className="text-muted-foreground hover:text-foreground w-full rounded-lg border border-dashed py-2 text-center text-sm transition-colors"
        >
          {t("week.earlier", { count: foldedCount })}
        </button>
      )}

      {shown.map((day) => {
        const key = dayKey(day);
        const items = byDay.get(key) ?? [];
        const isToday = key === todayKey;
        const past = todayKey != null && key < todayKey;
        const relative = isToday
          ? tCommon("today")
          : key === tomorrowKey
            ? tCommon("tomorrow")
            : null;
        const longLabel = format(day, "EEEE d MMMM", { locale: dateLocale });
        return (
          <section key={key} aria-label={longLabel}>
            <div className="mb-2 flex items-center gap-2">
              <h2
                className={cn(
                  "text-sm font-semibold first-letter:uppercase",
                  past && "text-muted-foreground"
                )}
              >
                {relative ? (
                  <>
                    {relative}{" "}
                    <span className="text-muted-foreground font-normal">
                      · {format(day, "EEE d MMM", { locale: dateLocale })}
                    </span>
                  </>
                ) : (
                  format(day, "EEEE d MMM", { locale: dateLocale })
                )}
              </h2>
              {items.length === 0 && (
                <span className="text-muted-foreground text-xs">
                  {t("week.free")}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-7"
                aria-label={t("grid.addOn", { date: longLabel })}
                onClick={() => onAddDay(key)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    past={eventEndMs(e.starts_at, e.ends_at) < nowMs}
                    onOpen={() => onOpenEvent(e)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
