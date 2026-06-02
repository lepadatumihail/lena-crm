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
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentDialog } from "@/components/calendar/appointment-dialog";
import { ViewingDialog } from "@/components/clients/viewing-dialog";
import { formatTimeRange } from "@/lib/calendar";
import { formatCurrency } from "@/lib/crm";
import { reminderMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type {
  AppointmentWithRefs,
  CalendarClientOption,
  CalendarEvent,
} from "@/lib/data/calendar";
import type { Viewing } from "@/lib/supabase/types";

const DAY_KEY = "yyyy-MM-dd";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventMeta(e: CalendarEvent): string {
  const parts = [
    e.kind === "viewing" ? "Viewing" : "Meeting",
    formatTimeRange(e.starts_at, e.ends_at),
  ];
  if (e.kind === "viewing" && e.buyerName) parts.push(e.buyerName);
  if (e.location) parts.push(e.location);
  return parts.join(" · ");
}

function eventDescription(e: CalendarEvent): string | null {
  if (e.kind === "viewing") return e.viewing.description?.trim() || null;
  return e.appointment.notes?.trim() || null;
}

/** One-tap WhatsApp reminder link for an event, or null if no usable phone. */
function reminderHref(e: CalendarEvent): string | null {
  if (!e.contact?.phone) return null;
  const when = format(new Date(e.starts_at), "EEE d MMM 'at' HH:mm");
  const text = reminderMessage(
    e.contact.firstName,
    e.contact.language,
    e.reminderWhat,
    when
  );
  return whatsappLink(e.contact.phone, text);
}

export function CalendarView({
  monthISO,
  events,
  clients,
}: {
  monthISO: string;
  events: CalendarEvent[];
  clients: CalendarClientOption[];
}) {
  const base = parseISO(`${monthISO}-01`);
  const gridStart = startOfWeek(startOfMonth(base), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(base), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const buyers = useMemo(
    () =>
      clients
        .filter((c) => c.side === "buyer")
        .map((c) => ({ id: c.id, name: c.name })),
    [clients]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = format(new Date(e.starts_at), DAY_KEY);
      const arr = map.get(key);
      if (arr) arr.push(e);
      else map.set(key, [e]);
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    }
    return map;
  }, [events]);

  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<{
    appointment?: AppointmentWithRefs;
    dateKey?: string;
  } | null>(null);
  const [editingViewing, setEditingViewing] = useState<{
    viewing?: Viewing;
    clientId?: string;
    dateKey?: string;
  } | null>(null);

  const prevMonth = format(subMonths(base, 1), "yyyy-MM");
  const nextMonth = format(addMonths(base, 1), "yyyy-MM");
  const todayKey = format(new Date(), DAY_KEY);
  const dayList = dayOpen ? byDay.get(dayOpen) ?? [] : [];

  function startChoosing(dateKey: string) {
    setDayOpen(null);
    setChoosing(dateKey);
  }
  function chooseMeeting() {
    const dateKey = choosing ?? undefined;
    setChoosing(null);
    setEditingMeeting({ dateKey });
  }
  function chooseViewing() {
    const dateKey = choosing ?? undefined;
    setChoosing(null);
    setEditingViewing({ dateKey });
  }
  function openEvent(e: CalendarEvent) {
    setDayOpen(null);
    if (e.kind === "meeting") setEditingMeeting({ appointment: e.appointment });
    else setEditingViewing({ viewing: e.viewing, clientId: e.buyerId });
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
          <Button size="sm" onClick={() => startChoosing(todayKey)}>
            <Plus /> New
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
                {items.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                      e.kind === "viewing"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {format(new Date(e.starts_at), "HH:mm")} {e.title}
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

      {/* Day list */}
      <Dialog open={dayOpen != null} onOpenChange={(o) => !o && setDayOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dayOpen ? format(parseISO(dayOpen), "EEEE d MMMM") : ""}
            </DialogTitle>
            <DialogDescription>
              Meetings and viewings scheduled for this day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dayList.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing scheduled.</p>
            ) : (
              dayList.map((e) => {
                const remind = reminderHref(e);
                const desc = eventDescription(e);
                return (
                  <div
                    key={e.id}
                    className="hover:bg-accent flex items-center gap-2 rounded-lg border p-3 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => openEvent(e)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          e.kind === "viewing"
                            ? "bg-primary"
                            : "bg-muted-foreground"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{e.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {eventMeta(e)}
                        </p>
                        {desc && (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm whitespace-pre-wrap">
                            {desc}
                          </p>
                        )}
                        {e.kind === "viewing" &&
                          (e.viewing.property_price != null ||
                            e.viewing.had_offer) && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {e.viewing.property_price != null &&
                                `Asking ${formatCurrency(
                                  e.viewing.property_price
                                )}`}
                              {e.viewing.had_offer &&
                                `${
                                  e.viewing.property_price != null ? " · " : ""
                                }Offer ${formatCurrency(e.viewing.offer_price)}`}
                            </p>
                          )}
                      </div>
                    </button>
                    {remind && (
                      <a
                        href={remind}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "icon" }),
                          "shrink-0"
                        )}
                        title="Remind on WhatsApp"
                        aria-label="Send a WhatsApp reminder"
                      >
                        <MessageCircle className="size-4 text-[#25D366]" />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <Button
            onClick={() => dayOpen && startChoosing(dayOpen)}
            variant="outline"
            className="w-full"
          >
            <Plus /> Add
          </Button>
        </DialogContent>
      </Dialog>

      {/* Meeting vs viewing chooser */}
      <Dialog open={choosing != null} onOpenChange={(o) => !o && setChoosing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Add to {choosing ? format(parseISO(choosing), "EEE d MMM") : ""}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose whether to add a meeting or a viewing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={chooseMeeting}
              className="hover:border-primary hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors"
            >
              <Users className="size-5" /> Meeting
            </button>
            <button
              type="button"
              onClick={chooseViewing}
              className="hover:border-primary hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors"
            >
              <CalendarClock className="size-5" /> Viewing
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AppointmentDialog
        open={editingMeeting != null}
        onOpenChange={(o) => !o && setEditingMeeting(null)}
        appointment={editingMeeting?.appointment}
        defaultDateKey={editingMeeting?.dateKey}
        clients={clients}
      />

      <ViewingDialog
        open={editingViewing != null}
        onOpenChange={(o) => !o && setEditingViewing(null)}
        viewing={editingViewing?.viewing}
        clientId={editingViewing?.clientId}
        buyers={buyers}
        defaultDateKey={editingViewing?.dateKey}
      />
    </div>
  );
}
