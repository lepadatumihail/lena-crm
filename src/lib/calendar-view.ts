import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  type Locale,
} from "date-fns";

/**
 * The /calendar page's views and the date arithmetic behind them. Nothing
 * here touches the DOM or the database, so the server uses it to decide what
 * to fetch and the browser uses it to lay the same events out.
 */

export const CALENDAR_VIEWS = ["week", "month"] as const;
export type CalendarViewKind = (typeof CALENDAR_VIEWS)[number];

/** What an agent opens the calendar for: this week, hour by hour. */
export const DEFAULT_CALENDAR_VIEW: CalendarViewKind = "week";

/** Remembers the last view. The switcher writes it; the page reads it. */
export const CALENDAR_VIEW_COOKIE = "calendar_view";
export const CALENDAR_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Day keys ("2026-09-07") name a calendar day in the agent's own time zone. */
export const DAY_KEY = "yyyy-MM-dd";
const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

/** Weeks run Monday to Sunday. */
export const WEEK_STARTS_ON = 1;

/** Events without an end (viewings) take an hour, as they do in the ICS feed. */
export const DEFAULT_EVENT_MINUTES = 60;
/** Anything shorter is drawn this tall so its title stays readable. */
export const MIN_EVENT_MINUTES = 30;
/** Where the 24-hour grid opens when today isn't on screen. */
export const WORKDAY_START_HOUR = 8;

export function isCalendarView(value: unknown): value is CalendarViewKind {
  return (
    typeof value === "string" &&
    (CALENDAR_VIEWS as readonly string[]).includes(value)
  );
}

export function dayKey(date: Date): string {
  return format(date, DAY_KEY);
}

export type CalendarQuery = { view?: string; date?: string; month?: string };

/**
 * What /calendar should show. The URL wins, so links and the back button
 * behave; then the remembered view; then the default. `month` is the older
 * URL shape, honoured so existing links still open the month they name.
 */
export function resolveCalendarRequest(
  query: CalendarQuery,
  rememberedView: string | undefined,
  today: Date
): { view: CalendarViewKind; anchor: Date } {
  const monthParam =
    query.month && MONTH_KEY_RE.test(query.month)
      ? parseISO(`${query.month}-01`)
      : null;
  const dateParam =
    query.date && DAY_KEY_RE.test(query.date) ? parseISO(query.date) : null;
  const validMonth = monthParam && isValid(monthParam) ? monthParam : null;
  const validDate = dateParam && isValid(dateParam) ? dateParam : null;

  const view: CalendarViewKind = isCalendarView(query.view)
    ? query.view
    : validMonth
      ? "month"
      : isCalendarView(rememberedView)
        ? rememberedView
        : DEFAULT_CALENDAR_VIEW;

  return { view, anchor: validDate ?? validMonth ?? today };
}

/** First day on screen at local midnight, and the very end of the last day. */
export function visibleRange(
  view: CalendarViewKind,
  anchor: Date
): { start: Date; end: Date } {
  const weekStartsOn = WEEK_STARTS_ON;
  if (view === "week") {
    return {
      start: startOfWeek(anchor, { weekStartsOn }),
      end: endOfWeek(anchor, { weekStartsOn }),
    };
  }
  return {
    start: startOfWeek(startOfMonth(anchor), { weekStartsOn }),
    end: endOfWeek(endOfMonth(anchor), { weekStartsOn }),
  };
}

/** The anchor one step forward or back in the current view. */
export function shiftAnchor(
  view: CalendarViewKind,
  anchor: Date,
  direction: -1 | 1
): Date {
  return view === "week"
    ? addWeeks(anchor, direction)
    : addMonths(anchor, direction);
}

/** Link to a view. Without a date the page opens on today. */
export function calendarHref(view: CalendarViewKind, date?: Date | string): string {
  const params = new URLSearchParams({ view });
  if (date) params.set("date", typeof date === "string" ? date : dayKey(date));
  return `/calendar?${params.toString()}`;
}

/** Heading for what's on screen: "September 2026" or "7 – 13 September 2026". */
export function rangeLabel(
  view: CalendarViewKind,
  anchor: Date,
  locale: Locale
): string {
  const opts = { locale };
  if (view === "month") return format(anchor, "MMMM yyyy", opts);
  const { start, end } = visibleRange("week", anchor);
  if (isSameMonth(start, end)) {
    return `${format(start, "d", opts)} – ${format(end, "d MMMM yyyy", opts)}`;
  }
  if (isSameYear(start, end)) {
    return `${format(start, "d MMM", opts)} – ${format(end, "d MMM yyyy", opts)}`;
  }
  return `${format(start, "d MMM yyyy", opts)} – ${format(end, "d MMM yyyy", opts)}`;
}

/** When an event ends, in epoch ms. Events without a usable end take an hour. */
export function eventEndMs(startsAt: string, endsAt: string | null): number {
  const start = new Date(startsAt).getTime();
  if (endsAt) {
    const end = new Date(endsAt).getTime();
    if (end > start) return end;
  }
  return start + DEFAULT_EVENT_MINUTES * 60_000;
}

/** Minutes since local midnight. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** "09:30" for minutes since midnight. */
export function minutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type TimedItem = { id: string; startMin: number; endMin: number };
export type Placement = { column: number; columns: number };

/**
 * Side-by-side columns for events that overlap in time, the way desktop
 * calendars draw them. Every run of overlapping events shares one column
 * count, so nothing in the run is drawn underneath something else.
 */
export function layoutOverlaps(items: TimedItem[]): Map<string, Placement> {
  const sorted = [...items].sort(
    (a, b) => a.startMin - b.startMin || b.endMin - a.endMin
  );
  const out = new Map<string, Placement>();
  let run: { id: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let runEnd = -Infinity;

  const closeRun = () => {
    for (const member of run) {
      out.set(member.id, { column: member.column, columns: columnEnds.length });
    }
    run = [];
    columnEnds = [];
  };

  for (const item of sorted) {
    if (item.startMin >= runEnd) closeRun();
    let column = columnEnds.findIndex((end) => end <= item.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.endMin);
    } else {
      columnEnds[column] = item.endMin;
    }
    run.push({ id: item.id, column });
    runEnd = Math.max(runEnd, item.endMin);
  }
  closeRun();
  return out;
}
