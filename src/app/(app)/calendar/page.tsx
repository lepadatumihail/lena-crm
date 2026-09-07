import { cookies } from "next/headers";
import { addDays } from "date-fns";

import { getCalendarEvents, getCalendarFormData } from "@/lib/data/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";
import {
  CALENDAR_VIEW_COOKIE,
  dayKey,
  resolveCalendarRequest,
  visibleRange,
} from "@/lib/calendar-view";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; month?: string }>;
}) {
  const [query, cookieStore] = await Promise.all([searchParams, cookies()]);
  const { view, anchor } = resolveCalendarRequest(
    query,
    cookieStore.get(CALENDAR_VIEW_COOKIE)?.value,
    new Date()
  );
  const { start, end } = visibleRange(view, anchor);

  const [events, formData] = await Promise.all([
    // pad ±1 day so events near midnight at the edges aren't missed
    getCalendarEvents(
      addDays(start, -1).toISOString(),
      addDays(end, 1).toISOString()
    ),
    getCalendarFormData(),
  ]);

  return (
    <CalendarView
      view={view}
      anchorISO={dayKey(anchor)}
      events={events}
      clients={formData.clients}
    />
  );
}
