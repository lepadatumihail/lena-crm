import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import {
  getAppointmentsInRange,
  getCalendarFormData,
} from "@/lib/data/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const monthParam =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;
  const base = monthParam ? parseISO(`${monthParam}-01`) : new Date();

  const gridStart = startOfWeek(startOfMonth(base), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(base), { weekStartsOn: 1 });

  const [appointments, formData] = await Promise.all([
    // pad ±1 day so events near midnight at the grid edges aren't missed
    getAppointmentsInRange(
      addDays(gridStart, -1).toISOString(),
      addDays(gridEnd, 1).toISOString()
    ),
    getCalendarFormData(),
  ]);

  return (
    <CalendarView
      monthISO={format(base, "yyyy-MM")}
      appointments={appointments}
      clients={formData.clients}
      properties={formData.properties}
    />
  );
}
