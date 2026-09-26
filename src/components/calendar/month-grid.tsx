"use client";

import { format, isSameMonth } from "date-fns";
import { useLocale, useTranslations } from "next-intl";

import { dateFnsLocale } from "@/i18n/dates";
import { dayKey } from "@/lib/calendar-view";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";
import { TONE_BG, TONE_BG_HOVER, TONE_INK, TONE_SOLID } from "@/lib/tones";
import { EVENT_TONES } from "@/lib/calendar";

/** Chips per day on a desktop cell before "+N more". */
const MAX_CHIPS = 3;
/** Dots per day on a phone cell before "+N". */
const MAX_DOTS = 3;

/**
 * The month at a glance. Desktop cells list the first few events; phone cells
 * show a dot per event and the selected day's list appears below the grid.
 */
export function MonthGrid({
  days,
  anchor,
  byDay,
  todayKey,
  selectedKey,
  onSelectDay,
  onOpenEvent,
}: {
  days: Date[];
  anchor: Date;
  byDay: Map<string, CalendarEvent[]>;
  todayKey: string | null;
  selectedKey: string | null;
  onSelectDay: (dateKey: string) => void;
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  const t = useTranslations("calendar");
  const dateLocale = dateFnsLocale(useLocale());

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="grid grid-cols-7 border-b text-center">
        {/* The grid always starts on a Monday, so its first row names the week. */}
        {days.slice(0, 7).map((day) => (
          <div
            key={dayKey(day)}
            className="text-muted-foreground h-[38px] text-xs leading-[38px] first-letter:uppercase"
          >
            {format(day, "EEE", { locale: dateLocale })}
          </div>
        ))}
      </div>

      {/* Cell borders, not a gap over a grey backing: the tinted cells
          (other months, the selected day, hover) are translucent and would
          let that grey through. */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dayKey(day);
          const items = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const today = key === todayKey;
          const past = todayKey != null && key < todayKey;
          const selected = key === selectedKey;
          return (
            <div
              key={key}
              onClick={() => onSelectDay(key)}
              className={cn(
                "hover:bg-accent/50 flex min-h-16 cursor-pointer flex-col gap-1 border-r border-b p-1 transition-colors md:min-h-24 md:p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                !inMonth && "bg-muted/50",
                // A phone lists the selected day below; a desktop opens a dialog.
                selected && "max-md:bg-accent/60"
              )}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectDay(key);
                }}
                aria-label={format(day, "EEEE d MMMM", { locale: dateLocale })}
                aria-pressed={selected}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs",
                  (!inMonth || past) && "text-muted-foreground",
                  today && "bg-primary text-primary-foreground font-medium",
                  selected && !today && "ring-primary font-medium ring-1"
                )}
              >
                {format(day, "d")}
              </button>

              {items.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 px-1 md:hidden">
                  {items.slice(0, MAX_DOTS).map((e) => (
                    <span
                      key={e.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        TONE_SOLID[EVENT_TONES[e.kind]]
                      )}
                    />
                  ))}
                  {items.length > MAX_DOTS && (
                    <span className="text-muted-foreground text-[10px] leading-none">
                      +{items.length - MAX_DOTS}
                    </span>
                  )}
                </div>
              )}

              <div className="hidden flex-col gap-0.5 md:flex">
                {items.slice(0, MAX_CHIPS).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenEvent(e);
                    }}
                    title={e.title}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight transition-colors",
                      TONE_BG[EVENT_TONES[e.kind]],
                      TONE_INK[EVENT_TONES[e.kind]],
                      TONE_BG_HOVER[EVENT_TONES[e.kind]],
                      past && "opacity-70"
                    )}
                  >
                    <span className="tabular-nums">
                      {format(new Date(e.starts_at), "HH:mm")}
                    </span>{" "}
                    {e.title}
                  </button>
                ))}
                {items.length > MAX_CHIPS && (
                  <span className="text-muted-foreground px-1 text-[11px]">
                    {t("grid.more", { count: items.length - MAX_CHIPS })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
