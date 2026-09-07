"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { dateFnsLocale } from "@/i18n/dates";
import { formatTimeRange } from "@/lib/calendar";
import {
  MIN_EVENT_MINUTES,
  WORKDAY_START_HOUR,
  dayKey,
  eventEndMs,
  layoutOverlaps,
  minutesLabel,
  minutesOfDay,
} from "@/lib/calendar-view";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

const HOUR_PX = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
/** Clicking a slot rounds down to this many minutes. */
const SNAP_MINUTES = 30;
const GUTTER = "3.25rem";

type Block = {
  event: CalendarEvent;
  startMin: number;
  endMin: number;
  /** Where the block is drawn to; short events are padded so text fits. */
  drawnEnd: number;
  past: boolean;
};

/** Minutes into the hour a click landed, rounded down to the snap. */
function snapWithinHour(event: React.MouseEvent<HTMLElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.height === 0) return 0;
  const ratio = (event.clientY - rect.top) / rect.height;
  const snapped = Math.floor((ratio * 60) / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(60 - SNAP_MINUTES, Math.max(0, snapped));
}

/**
 * A full day, midnight to midnight, one column per day given: seven on a
 * desktop, one on a phone under the week strip. Events are sized by
 * duration, a line marks the current time, and clicking an empty slot starts
 * a new event at that time. Scrolls itself to now, or to the working day.
 */
export function TimeGrid({
  days,
  byDay,
  todayKey,
  now,
  onPickSlot,
  onOpenEvent,
  showHeader = true,
  scrollKey,
  className,
}: {
  days: Date[];
  byDay: Map<string, CalendarEvent[]>;
  todayKey: string | null;
  now: Date;
  onPickSlot: (dateKey: string, minutes: number) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  /** Day names across the top; off when something else names the day. */
  showHeader?: boolean;
  /** The grid scrolls back to now (or the morning) whenever this changes. */
  scrollKey: string;
  className?: string;
}) {
  const t = useTranslations("calendar");
  const dateLocale = dateFnsLocale(useLocale());
  const nowMs = now.getTime();
  const nowMin = minutesOfDay(now);
  const single = days.length === 1;
  const columns = {
    gridTemplateColumns: `${GUTTER} repeat(${days.length}, minmax(0, 1fr))`,
  };

  const blocksByDay = useMemo(() => {
    const map = new Map<string, Block[]>();
    for (const day of days) {
      const key = dayKey(day);
      const blocks = (byDay.get(key) ?? []).map((event): Block => {
        const start = new Date(event.starts_at);
        const startMin = minutesOfDay(start);
        const endMs = eventEndMs(event.starts_at, event.ends_at);
        const endMin = startMin + Math.round((endMs - start.getTime()) / 60_000);
        return {
          event,
          startMin,
          endMin,
          drawnEnd: Math.max(endMin, startMin + MIN_EVENT_MINUTES),
          past: endMs < nowMs,
        };
      });
      map.set(key, blocks);
    }
    return map;
  }, [days, byDay, nowMs]);

  const top = (minutes: number) => (minutes / 60) * HOUR_PX;
  const todayShown =
    todayKey != null && days.some((day) => dayKey(day) === todayKey);

  const [hover, setHover] = useState<{ key: string; minutes: number } | null>(
    null
  );

  // Once per week: to now if today is on screen, otherwise to the morning.
  // Waits for hydration, when today becomes known, and then leaves the
  // scroll alone so switching days on a phone doesn't jump.
  const scroller = useRef<HTMLDivElement>(null);
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!el || todayKey == null || scrolledFor.current === scrollKey) return;
    scrolledFor.current = scrollKey;
    const target = todayShown
      ? top(nowMin) - el.clientHeight / 3
      : top(WORKDAY_START_HOUR * 60);
    el.scrollTop = Math.max(0, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey, todayKey, todayShown]);

  return (
    <div className={cn("bg-card overflow-hidden rounded-lg border", className)}>
      <div
        ref={scroller}
        className="max-h-[calc(100dvh-19rem)] min-h-80 overflow-y-auto overscroll-contain md:max-h-[calc(100dvh-11rem)]"
      >
        {showHeader && (
          <div
            className="bg-card/95 sticky top-0 z-20 grid border-b backdrop-blur"
            style={columns}
          >
            <div />
            {days.map((day) => {
              const key = dayKey(day);
              const today = key === todayKey;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-xs",
                    today ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="first-letter:uppercase">
                    {format(day, "EEE", { locale: dateLocale })}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm font-medium",
                      today && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative" onPointerLeave={() => setHover(null)}>
          <div className="grid" style={columns}>
            {HOURS.map((hour) => (
              <Fragment key={hour}>
                <div
                  className="text-muted-foreground relative border-t text-[11px] tabular-nums"
                  style={{ height: HOUR_PX }}
                >
                  {hour > 0 && !(todayShown && Math.abs(hour * 60 - nowMin) < 20) && (
                    <span className="bg-card absolute -top-2 right-2 px-0.5">
                      {minutesLabel(hour * 60)}
                    </span>
                  )}
                </div>
                {days.map((day) => {
                  const key = dayKey(day);
                  const today = key === todayKey;
                  const pastHour =
                    todayKey != null &&
                    (key < todayKey || (today && (hour + 1) * 60 <= nowMin));
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={t("grid.addAt", {
                        date: format(day, "EEE d MMM", { locale: dateLocale }),
                        time: minutesLabel(hour * 60),
                      })}
                      onClick={(event) => {
                        setHover(null);
                        onPickSlot(key, hour * 60 + snapWithinHour(event));
                      }}
                      onPointerMove={(event) => {
                        if (event.pointerType !== "mouse") return;
                        const minutes = hour * 60 + snapWithinHour(event);
                        if (hover?.key !== key || hover.minutes !== minutes) {
                          setHover({ key, minutes });
                        }
                      }}
                      onPointerLeave={() => setHover(null)}
                      className={cn(
                        "hover:bg-accent/40 focus-visible:bg-accent/40 border-t border-l outline-none transition-colors",
                        today && !single && "bg-primary/[0.04]",
                        pastHour && "bg-muted/40"
                      )}
                      style={{ height: HOUR_PX }}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-0 grid"
            style={columns}
          >
            <div className="relative">
              {todayShown && (
                <span
                  className="bg-destructive text-destructive-foreground absolute right-1 z-30 -translate-y-1/2 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums"
                  style={{ top: top(nowMin) }}
                  aria-hidden="true"
                >
                  {minutesLabel(nowMin)}
                </span>
              )}
            </div>
            {days.map((day) => {
              const key = dayKey(day);
              const blocks = blocksByDay.get(key) ?? [];
              const placement = layoutOverlaps(
                blocks.map((b) => ({
                  id: b.event.id,
                  startMin: b.startMin,
                  endMin: b.drawnEnd,
                }))
              );
              return (
                <div key={key} className="relative">
                  {blocks.map((b) => {
                    const place = placement.get(b.event.id) ?? {
                      column: 0,
                      columns: 1,
                    };
                    const width = 100 / place.columns;
                    const height = Math.max(
                      top(b.drawnEnd) - top(b.startMin) - 2,
                      18
                    );
                    const detail =
                      b.event.kind === "viewing"
                        ? b.event.buyerName
                        : b.event.location;
                    return (
                      <button
                        key={b.event.id}
                        type="button"
                        onClick={() => onOpenEvent(b.event)}
                        title={`${b.event.title} · ${formatTimeRange(
                          b.event.starts_at,
                          b.event.ends_at
                        )}`}
                        className={cn(
                          "pointer-events-auto absolute z-10 flex flex-col overflow-hidden rounded-md border-l-2 py-0.5 text-left leading-tight transition-colors",
                          single ? "px-2 text-xs" : "px-1.5 text-[11px]",
                          b.event.kind === "viewing"
                            ? "bg-primary/10 text-primary border-primary hover:bg-primary/20"
                            : "bg-secondary text-secondary-foreground border-muted-foreground hover:bg-secondary/70",
                          b.past && "opacity-55"
                        )}
                        style={{
                          top: top(b.startMin) + 1,
                          height,
                          left: `calc(${place.column * width}% + 2px)`,
                          width: `calc(${width}% - 4px)`,
                        }}
                      >
                        <span className="truncate font-medium">
                          {b.event.title}
                        </span>
                        {height >= 34 && (
                          <span className="truncate opacity-80 tabular-nums">
                            {formatTimeRange(b.event.starts_at, b.event.ends_at)}
                            {detail ? ` · ${detail}` : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {hover?.key === key && (
                    <div
                      className="text-muted-foreground absolute inset-x-0.5 flex items-start gap-1 rounded-md border border-dashed px-1.5 py-0.5 text-[11px]"
                      style={{ top: top(hover.minutes) + 1, height: HOUR_PX - 2 }}
                    >
                      <Plus className="size-3 shrink-0" />
                      <span className="truncate">
                        {t("week.newAt", { time: minutesLabel(hover.minutes) })}
                      </span>
                    </div>
                  )}

                  {todayShown && key === todayKey && (
                    <div
                      className="bg-destructive absolute inset-x-0 z-20 h-0.5"
                      style={{ top: top(nowMin) }}
                      aria-hidden="true"
                    >
                      <span className="bg-destructive absolute -top-[3px] -left-1 size-2 rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
