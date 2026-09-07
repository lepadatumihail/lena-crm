"use client";

import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";

import { dateFnsLocale } from "@/i18n/dates";
import { dayKey } from "@/lib/calendar-view";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

const MAX_DOTS = 3;

/**
 * The seven days of the week across the top of a phone screen, a dot per
 * event under each. Tapping a day shows its hours below.
 */
export function WeekStrip({
  days,
  byDay,
  todayKey,
  selectedKey,
  onSelect,
  className,
}: {
  days: Date[];
  byDay: Map<string, CalendarEvent[]>;
  todayKey: string | null;
  selectedKey: string;
  onSelect: (dateKey: string) => void;
  className?: string;
}) {
  const t = useTranslations("calendar");
  const dateLocale = dateFnsLocale(useLocale());

  return (
    <div
      role="group"
      aria-label={t("week.pickDay")}
      className={cn("grid grid-cols-7", className)}
    >
      {days.map((day) => {
        const key = dayKey(day);
        const items = byDay.get(key) ?? [];
        const today = key === todayKey;
        const selected = key === selectedKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={selected}
            aria-label={format(day, "EEEE d MMMM", { locale: dateLocale })}
            className="flex flex-col items-center gap-1 py-1"
          >
            <span
              className={cn(
                "text-[11px] uppercase tracking-wide",
                today ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {format(day, "EEEEEE", { locale: dateLocale })}
            </span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                selected
                  ? today
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground text-background"
                  : today
                    ? "text-primary"
                    : "text-foreground"
              )}
            >
              {format(day, "d")}
            </span>
            <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
              {items.slice(0, MAX_DOTS).map((e) => (
                <span
                  key={e.id}
                  className={cn(
                    "size-1 rounded-full",
                    e.kind === "viewing" ? "bg-primary" : "bg-muted-foreground"
                  )}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
