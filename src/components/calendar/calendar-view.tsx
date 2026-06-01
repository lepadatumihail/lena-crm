"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentDialog } from "@/components/calendar/appointment-dialog";
import { appointmentTitle, formatTimeRange } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type {
  AppointmentWithRefs,
  CalendarClientOption,
  CalendarPropertyOption,
} from "@/lib/data/calendar";

const DAY_KEY = "yyyy-MM-dd";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function clientName(a: AppointmentWithRefs): string | null {
  return a.client ? `${a.client.first_name} ${a.client.last_name}`.trim() : null;
}
function propertyLabel(a: AppointmentWithRefs): string | null {
  if (a.property_label) return a.property_label;
  if (a.property) return a.property.address || a.property.property_type || null;
  return null;
}
function titleOf(a: AppointmentWithRefs): string {
  return appointmentTitle(a, {
    clientName: clientName(a),
    property: propertyLabel(a),
  });
}

export function CalendarView({
  monthISO,
  appointments,
  clients,
  properties,
}: {
  monthISO: string;
  appointments: AppointmentWithRefs[];
  clients: CalendarClientOption[];
  properties: CalendarPropertyOption[];
}) {
  const base = parseISO(`${monthISO}-01`);
  const gridStart = startOfWeek(startOfMonth(base), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(base), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentWithRefs[]>();
    for (const a of appointments) {
      const key = format(new Date(a.starts_at), DAY_KEY);
      const arr = map.get(key);
      if (arr) arr.push(a);
      else map.set(key, [a]);
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    }
    return map;
  }, [appointments]);

  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    appointment?: AppointmentWithRefs;
    dateKey?: string;
  } | null>(null);

  const prevMonth = format(subMonths(base, 1), "yyyy-MM");
  const nextMonth = format(addMonths(base, 1), "yyyy-MM");
  const todayKey = format(new Date(), DAY_KEY);
  const dayList = dayOpen ? byDay.get(dayOpen) ?? [] : [];

  function openNew(dateKey: string) {
    setDayOpen(null);
    setEditing({ dateKey });
  }
  function openEdit(a: AppointmentWithRefs) {
    setDayOpen(null);
    setEditing({ appointment: a });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {format(base, "MMMM yyyy")}
        </h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon" aria-label="Previous month">
            <Link href={`/calendar?month=${prevMonth}`}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/calendar">Today</Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Next month">
            <Link href={`/calendar?month=${nextMonth}`}>
              <ChevronRight />
            </Link>
          </Button>
          <Button size="sm" onClick={() => openNew(todayKey)}>
            <Plus /> New appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-muted-foreground py-1 text-xs font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="bg-border grid grid-cols-7 gap-px overflow-hidden rounded-lg border">
        {days.map((day) => {
          const key = format(day, DAY_KEY);
          const items = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, base);
          const today = isToday(day);
          return (
            <button
              type="button"
              key={key}
              onClick={() => setDayOpen(key)}
              className={cn(
                "bg-card hover:bg-accent/50 flex min-h-24 flex-col gap-1 p-1.5 text-left transition-colors",
                !inMonth && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  !inMonth && "text-muted-foreground",
                  today && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                      a.type === "viewing"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {format(new Date(a.starts_at), "HH:mm")} {titleOf(a)}
                  </span>
                ))}
                {items.length > 3 && (
                  <span className="text-muted-foreground px-1 text-[11px]">
                    +{items.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={dayOpen != null} onOpenChange={(o) => !o && setDayOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dayOpen ? format(parseISO(dayOpen), "EEEE d MMMM") : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {dayList.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing scheduled.
              </p>
            ) : (
              dayList.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openEdit(a)}
                  className="hover:bg-accent flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      a.type === "viewing" ? "bg-primary" : "bg-muted-foreground"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{titleOf(a)}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatTimeRange(a.starts_at, a.ends_at)}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <Button
            onClick={() => dayOpen && openNew(dayOpen)}
            variant="outline"
            className="w-full"
          >
            <Plus /> Add appointment
          </Button>
        </DialogContent>
      </Dialog>

      <AppointmentDialog
        open={editing != null}
        onOpenChange={(o) => !o && setEditing(null)}
        appointment={editing?.appointment}
        defaultDateKey={editing?.dateKey}
        clients={clients}
        properties={properties}
      />
    </div>
  );
}
