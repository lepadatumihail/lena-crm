"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { dateFnsLocale } from "@/i18n/dates";
import { formatTimeRange } from "@/lib/calendar";
import {
  GRID_START_HOUR,
  MIN_EVENT_MINUTES,
  dayKey,
  eventEndMs,
  gridHours,
  layoutOverlaps,
  minutesLabel,
  minutesOfDay,
} from "@/lib/calendar-view";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

const HOUR_PX = 48;
/** Clicking a slot rounds down to this many minutes. */
const SNAP_MINUTES = 30;
const COLUMNS = "grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]";

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
 * The week hour by hour: seven columns, events sized by duration, a line for
 * the current time. Clicking an empty slot starts a new event at that time.
 */
export function WeekGrid({
  days,
  byDay,
  todayKey,
  now,
  onPickSlot,
  onOpenEvent,
  className,
}: {
  days: Date[];
  byDay: Map<string, CalendarEvent[]>;
  todayKey: string | null;
  now: Date;
  onPickSlot: (dateKey: string, minutes: number) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  className?: string;
}) {
  const t = useTranslations("calendar");
  const dateLocale = dateFnsLocale(useLocale());
  const nowMs = now.getTime();
  const nowMin = minutesOfDay(now);
  const weekKey = dayKey(days[0]);

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

  const { startHour, endHour } = useMemo(
    () =>
      gridHours(
        [...blocksByDay.values()]
          .flat()
          .map((b) => ({ startMin: b.startMin, endMin: b.drawnEnd }))
      ),
    [blocksByDay]
  );
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const top = (minutes: number) => ((minutes - startHour * 60) / 60) * HOUR_PX;

  const showNow =
    todayKey != null &&
    days.some((d) => dayKey(d) === todayKey) &&
    nowMin >= startHour * 60 &&
    nowMin <= endHour * 60;

  const [hover, setHover] = useState<{ key: string; minutes: number } | null>(
    null
  );

  // Open on the current time, or on the start of the working day.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = showNow
      ? top(nowMin) - el.clientHeight / 3
      : top(GRID_START_HOUR * 60);
    el.scrollTop = Math.max(0, target);
    // Only when the week changes, not on every tick of the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey]);

  return (
    <div className={cn("bg-card overflow-hidden rounded-lg border", className)}>
      <div
        ref={scroller}
        className="max-h-[calc(100dvh-11rem)] min-h-96 overflow-y-auto"
      >
        <div
          className={cn(
            "bg-card/95 sticky top-0 z-20 grid border-b backdrop-blur",
            COLUMNS
          )}
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

        <div className="relative">
          <div className={cn("grid", COLUMNS)}>
            {hours.map((hour) => (
              <Fragment key={hour}>
                <div
                  className="text-muted-foreground relative border-t text-[11px] tabular-nums"
                  style={{ height: HOUR_PX }}
                >
                  <span className="bg-card absolute -top-2 right-2 px-0.5">
                    {minutesLabel(hour * 60)}
                  </span>
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
                      onClick={(event) =>
                        onPickSlot(key, hour * 60 + snapWithinHour(event))
                      }
                      onMouseMove={(event) => {
                        const minutes = hour * 60 + snapWithinHour(event);
                        if (hover?.key !== key || hover.minutes !== minutes) {
                          setHover({ key, minutes });
                        }
                      }}
                      onMouseLeave={() => setHover(null)}
                      className={cn(
                        "hover:bg-accent/40 focus-visible:bg-accent/40 border-t border-l outline-none transition-colors",
                        today && "bg-primary/[0.04]",
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
            className={cn(
              "pointer-events-none absolute inset-0 grid",
              COLUMNS
            )}
          >
            <div />
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
                          "pointer-events-auto absolute z-10 flex flex-col overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors",
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

                  {showNow && key === todayKey && (
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
