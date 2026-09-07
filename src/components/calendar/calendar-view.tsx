"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
} from "lucide-react";

import { dateFnsLocale } from "@/i18n/dates";
import { appointmentTypeLabel } from "@/i18n/labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentDialog } from "@/components/calendar/appointment-dialog";
import { CalendarSyncDialog } from "@/components/calendar/calendar-sync-dialog";
import { EventRow } from "@/components/calendar/event-row";
import { MonthGrid } from "@/components/calendar/month-grid";
import { TimeGrid } from "@/components/calendar/time-grid";
import { WeekStrip } from "@/components/calendar/week-strip";
import { ViewingDialog } from "@/components/clients/viewing-dialog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CALENDAR_VIEWS,
  CALENDAR_VIEW_COOKIE,
  CALENDAR_VIEW_COOKIE_MAX_AGE,
  calendarHref,
  dayKey,
  eventEndMs,
  minutesLabel,
  rangeLabel,
  shiftAnchor,
  visibleRange,
  type CalendarViewKind,
} from "@/lib/calendar-view";
import { cn } from "@/lib/utils";
import type {
  AppointmentWithRefs,
  CalendarClientOption,
  CalendarEvent,
} from "@/lib/data/calendar";
import type { Viewing } from "@/lib/supabase/types";

/** Kept as a plain cookie, like the sidebar's state: a preference, not data. */
function rememberView(view: CalendarViewKind) {
  document.cookie = `${CALENDAR_VIEW_COOKIE}=${view}; path=/; max-age=${CALENDAR_VIEW_COOKIE_MAX_AGE}; samesite=lax`;
}

/** The current minute, kept fresh while the page is open. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return now;
}

export function CalendarView({
  view,
  anchorISO,
  events,
  clients,
}: {
  view: CalendarViewKind;
  /** A day ("2026-09-07") inside the week or month on screen. */
  anchorISO: string;
  events: CalendarEvent[];
  clients: CalendarClientOption[];
}) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const tCrm = useTranslations("crm");
  const dateLocale = dateFnsLocale(useLocale());

  const anchor = useMemo(() => parseISO(anchorISO), [anchorISO]);
  const days = useMemo(() => {
    const { start, end } = visibleRange(view, anchor);
    return eachDayOfInterval({ start, end });
  }, [view, anchor]);
  const firstKey = dayKey(days[0]);
  const lastKey = dayKey(days[days.length - 1]);
  const inView = (key: string | null): key is string =>
    key != null && key >= firstKey && key <= lastKey;

  // Which day an event lands on depends on the browser's time zone, so the
  // server renders the empty grid and the events fill in on hydration.
  const hydrated = useHydrated();
  const isMobile = useIsMobile();
  const now = useNow();
  const todayKey = hydrated ? dayKey(now) : null;
  const nowMs = now.getTime();

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (!hydrated) return map;
    for (const e of events) {
      const key = dayKey(new Date(e.starts_at));
      const arr = map.get(key);
      if (arr) arr.push(e);
      else map.set(key, [e]);
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    }
    return map;
  }, [events, hydrated]);

  const buyers = useMemo(
    () =>
      clients
        .filter((c) => c.side === "buyer")
        .map((c) => ({ id: c.id, name: c.name })),
    [clients]
  );

  // Phone week view: the strip picks a day, the grid below shows its hours.
  // The pick lives in the URL too, so a reload or a saved event keeps it.
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const focusDay = inView(pickedDay) ? pickedDay : anchorISO;
  const focusDays = useMemo(() => [parseISO(focusDay)], [focusDay]);
  function pickDay(key: string) {
    setPickedDay(key);
    window.history.replaceState(null, "", calendarHref("week", key));
  }

  // Month view: the chosen day opens a dialog on a desktop and a list under
  // the grid on a phone, where it starts on today so the page opens on
  // something useful.
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const todayInView = inView(todayKey);
  const activeDay = inView(selectedDay)
    ? selectedDay
    : view === "month" && isMobile && todayInView
      ? todayKey
      : null;
  const dayDialogOpen = view === "month" && inView(selectedDay) && !isMobile;
  const dayList = activeDay ? (byDay.get(activeDay) ?? []) : [];

  const [choosing, setChoosing] = useState<{
    dateKey: string;
    time?: string;
  } | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<{
    appointment?: AppointmentWithRefs;
    dateKey?: string;
    time?: string;
  } | null>(null);
  const [editingViewing, setEditingViewing] = useState<{
    viewing?: Viewing;
    clientId?: string;
    dateKey?: string;
    time?: string;
  } | null>(null);

  function startChoosing(dateKey: string, time?: string) {
    if (!isMobile) setSelectedDay(null);
    setChoosing({ dateKey, time });
  }
  function startNew() {
    if (view === "week" && isMobile) startChoosing(focusDay);
    else startChoosing(activeDay ?? (todayInView ? todayKey : firstKey));
  }
  function chooseMeeting() {
    const picked = choosing;
    setChoosing(null);
    setEditingMeeting({ dateKey: picked?.dateKey, time: picked?.time });
  }
  function chooseViewing() {
    const picked = choosing;
    setChoosing(null);
    setEditingViewing({ dateKey: picked?.dateKey, time: picked?.time });
  }
  function openEvent(e: CalendarEvent) {
    if (!isMobile) setSelectedDay(null);
    if (e.kind === "meeting") setEditingMeeting({ appointment: e.appointment });
    else setEditingViewing({ viewing: e.viewing, clientId: e.buyerId });
  }

  const stepHref = (direction: -1 | 1) =>
    calendarHref(view, shiftAnchor(view, anchor, direction));
  const stepLabel = (direction: -1 | 1) =>
    t(
      view === "week"
        ? direction < 0
          ? "actions.previousWeek"
          : "actions.nextWeek"
        : direction < 0
          ? "actions.previousMonth"
          : "actions.nextMonth"
    );
  const newButton = (className?: string) => (
    <Button size="sm" className={className} onClick={startNew}>
      <Plus /> {t("actions.new")}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight first-letter:uppercase md:text-2xl">
            {rangeLabel(view, anchor, dateLocale)}
          </h1>
          {newButton("md:hidden")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={stepLabel(-1)}
            >
              <Link href={stepHref(-1)}>
                <ChevronLeft />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={calendarHref(view)}>{tCommon("today")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={stepLabel(1)}
            >
              <Link href={stepHref(1)}>
                <ChevronRight />
              </Link>
            </Button>
          </div>
          <nav
            aria-label={t("views.label")}
            className="bg-muted flex items-center rounded-md p-0.5 text-xs font-medium"
          >
            {CALENDAR_VIEWS.map((kind) => (
              <Link
                key={kind}
                href={calendarHref(kind, anchor)}
                onClick={() => rememberView(kind)}
                aria-current={kind === view ? "page" : undefined}
                className={cn(
                  "rounded-sm px-2.5 py-1 transition-colors",
                  kind === view
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`views.${kind}`)}
              </Link>
            ))}
          </nav>
          <CalendarSyncDialog />
          {newButton("hidden md:inline-flex")}
        </div>
      </div>

      {view === "week" ? (
        <>
          <TimeGrid
            className="hidden md:block"
            days={days}
            byDay={byDay}
            todayKey={todayKey}
            now={now}
            scrollKey={firstKey}
            onPickSlot={(key, minutes) => startChoosing(key, minutesLabel(minutes))}
            onOpenEvent={openEvent}
          />
          <div className="space-y-2 md:hidden">
            <WeekStrip
              days={days}
              byDay={byDay}
              todayKey={todayKey}
              selectedKey={focusDay}
              onSelect={pickDay}
            />
            <TimeGrid
              days={focusDays}
              byDay={byDay}
              todayKey={todayKey}
              now={now}
              showHeader={false}
              scrollKey={firstKey}
              onPickSlot={(key, minutes) =>
                startChoosing(key, minutesLabel(minutes))
              }
              onOpenEvent={openEvent}
            />
          </div>
        </>
      ) : (
        <>
          <MonthGrid
            days={days}
            anchor={anchor}
            byDay={byDay}
            todayKey={todayKey}
            selectedKey={activeDay}
            onSelectDay={setSelectedDay}
            onOpenEvent={openEvent}
          />
          {activeDay && (
            <section
              className="space-y-3 rounded-lg border p-3 md:hidden"
              aria-label={format(parseISO(activeDay), "EEEE d MMMM", {
                locale: dateLocale,
              })}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold first-letter:uppercase">
                  {format(parseISO(activeDay), "EEEE d MMMM", {
                    locale: dateLocale,
                  })}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startChoosing(activeDay)}
                >
                  <Plus /> {tCommon("add")}
                </Button>
              </div>
              {dayList.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("day.empty")}</p>
              ) : (
                <div className="space-y-2">
                  {dayList.map((e) => (
                    <EventRow
                      key={e.id}
                      event={e}
                      past={eventEndMs(e.starts_at, e.ends_at) < nowMs}
                      onOpen={() => openEvent(e)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Day list (month view on a desktop) */}
      <Dialog
        open={dayDialogOpen}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="first-letter:uppercase">
              {activeDay
                ? format(parseISO(activeDay), "EEEE d MMMM", {
                    locale: dateLocale,
                  })
                : ""}
            </DialogTitle>
            <DialogDescription>{t("day.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dayList.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("day.empty")}</p>
            ) : (
              dayList.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  past={eventEndMs(e.starts_at, e.ends_at) < nowMs}
                  onOpen={() => openEvent(e)}
                />
              ))
            )}
          </div>
          <Button
            onClick={() => activeDay && startChoosing(activeDay)}
            variant="outline"
            className="w-full"
          >
            <Plus /> {tCommon("add")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Meeting vs viewing chooser */}
      <Dialog open={choosing != null} onOpenChange={(open) => !open && setChoosing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {choosing
                ? t(choosing.time ? "add.titleAt" : "add.title", {
                    date: format(parseISO(choosing.dateKey), "EEE d MMM", {
                      locale: dateLocale,
                    }),
                    time: choosing.time ?? "",
                  })
                : ""}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("add.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={chooseMeeting}
              className="hover:border-primary hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors"
            >
              <Users className="size-5" /> {appointmentTypeLabel(tCrm, "meeting")}
            </button>
            <button
              type="button"
              onClick={chooseViewing}
              className="hover:border-primary hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors"
            >
              <CalendarClock className="size-5" />{" "}
              {appointmentTypeLabel(tCrm, "viewing")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AppointmentDialog
        open={editingMeeting != null}
        onOpenChange={(open) => !open && setEditingMeeting(null)}
        appointment={editingMeeting?.appointment}
        defaultDateKey={editingMeeting?.dateKey}
        defaultTime={editingMeeting?.time}
        clients={clients}
      />

      <ViewingDialog
        open={editingViewing != null}
        onOpenChange={(open) => !open && setEditingViewing(null)}
        viewing={editingViewing?.viewing}
        clientId={editingViewing?.clientId}
        buyers={buyers}
        defaultDateKey={editingViewing?.dateKey}
        defaultTime={editingViewing?.time}
      />
    </div>
  );
}
