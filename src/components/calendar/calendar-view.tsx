"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
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
import { Panel } from "@/components/shell/panel";
import { Segmented } from "@/components/shell/toolbar";
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
import { EVENT_TONES } from "@/lib/calendar";
import { TONE_BG, TONE_INK, TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";
import type {
  AppointmentWithRefs,
  CalendarClientOption,
  CalendarEvent,
} from "@/lib/data/calendar";
import type { Viewing } from "@/lib/supabase/types";

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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

  // The day a new appointment starts on: the day in focus on a phone's week,
  // else the picked day, else today when it is on screen.
  const newDay = view === "week" && isMobile ? focusDay : activeDay ?? (todayInView ? todayKey : firstKey);

  // ?new=1 (the phone's + sheet, ⌘K) opens the meeting-or-viewing chooser on
  // that day, adopted once the browser knows what today is. React's
  // derived-state pattern, as TasksView does for its own ?new=1.
  const searchParams = useSearchParams();
  const intentNew = searchParams.get("new") === "1";
  const [seenNew, setSeenNew] = useState(false);
  if (hydrated && intentNew !== seenNew) {
    setSeenNew(intentNew);
    if (intentNew) setChoosing({ dateKey: newDay });
  }
  // One-shot: take it off the URL so a refresh or Back doesn't reopen it.
  // Deferred a task, for the reason TasksView gives.
  useEffect(() => {
    if (!intentNew) return;
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.toString());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [intentNew]);

  function startChoosing(dateKey: string, time?: string) {
    if (!isMobile) setSelectedDay(null);
    setChoosing({ dateKey, time });
  }
  function startNew() {
    startChoosing(newDay);
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
  return (
    <div className="space-y-4">
      {/* Toolbar: today and the step arrows, the range, then the view,
          sync and the one "new" action. Folds to two rows on a phone. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="sm">
            <Link href={calendarHref(view)}>{tCommon("today")}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            aria-label={stepLabel(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href={stepHref(-1)}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            aria-label={stepLabel(1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href={stepHref(1)}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
        <h2 className="min-w-0 flex-1 truncate text-lg font-medium first-letter:uppercase">
          {rangeLabel(view, anchor, dateLocale)}
        </h2>
        <div className="flex items-center gap-2">
          <EventLegend className="hidden xl:flex" />
          <Segmented
            label={t("views.label")}
            value={view}
            items={CALENDAR_VIEWS.map((kind) => ({
              value: kind,
              label: t(`views.${kind}`),
              href: calendarHref(kind, anchor),
              onSelect: () => rememberView(kind),
            }))}
          />
          <CalendarSyncDialog />
          {/* On a phone the tab bar's + opens the same chooser (?new=1), as
              it opens the task dialog on the task list. */}
          <Button size="sm" onClick={startNew} className="hidden md:inline-flex">
            <Plus /> {t("actions.new")}
          </Button>
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
            <Panel
              className="md:hidden"
              // Spanish weekdays come lowercase ("sábado"); a heading starts with a capital.
              title={upperFirst(
                format(parseISO(activeDay), "EEEE d MMMM", { locale: dateLocale })
              )}
              count={dayList.length}
              action={
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => startChoosing(activeDay)}
                >
                  <Plus /> {tCommon("add")}
                </Button>
              }
              bodyClassName="divide-y"
            >
              {dayList.length === 0 ? (
                <p className="text-muted-foreground px-4 py-3 text-sm">
                  {t("day.empty")}
                </p>
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
            </Panel>
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
          {dayList.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("day.empty")}</p>
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {dayList.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  past={eventEndMs(e.starts_at, e.ends_at) < nowMs}
                  onOpen={() => openEvent(e)}
                  className="px-3"
                />
              ))}
            </div>
          )}
          <Button
            onClick={() => activeDay && startChoosing(activeDay)}
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
            {(
              [
                { kind: "viewing", icon: KeyRound, onClick: chooseViewing },
                { kind: "meeting", icon: Users, onClick: chooseMeeting },
              ] as const
            ).map(({ kind, icon: Icon, onClick }) => (
              <button
                key={kind}
                type="button"
                onClick={onClick}
                className="hover:bg-muted/60 focus-visible:ring-ring/50 flex flex-col items-center gap-2.5 rounded-xl border p-4 text-sm font-medium transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.96]"
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    TONE_BG[EVENT_TONES[kind]],
                    TONE_INK[EVENT_TONES[kind]]
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                {appointmentTypeLabel(tCrm, kind)}
              </button>
            ))}
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

/** What the two event colours mean, beside the view switch. */
function EventLegend({ className }: { className?: string }) {
  const tCrm = useTranslations("crm");
  return (
    <div className={cn("text-muted-foreground mr-1 items-center gap-3 text-xs", className)}>
      {(["viewing", "meeting"] as const).map((kind) => (
        <span key={kind} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("size-2 rounded-full", TONE_SOLID[EVENT_TONES[kind]])}
          />
          {appointmentTypeLabel(tCrm, kind)}
        </span>
      ))}
    </div>
  );
}
