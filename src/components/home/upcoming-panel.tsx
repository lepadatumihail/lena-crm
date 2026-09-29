"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { CalendarDays, MessageCircle } from "lucide-react";

import { useAgentTimeZone } from "@/components/shell/shell-context";
import { buttonVariants } from "@/components/ui/button";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { formatTimeInTimeZone } from "@/lib/attention";
import { EVENT_TONES } from "@/lib/calendar";
import { calendarHref } from "@/lib/calendar-view";
import type { CalendarEvent } from "@/lib/data/calendar";
import { eventReminderHref } from "@/lib/event-reminder";
import { dateKeyInTimeZone, groupByDay } from "@/lib/home";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";

const LIMIT = 6;

/**
 * What's next, a day at a time: a calendar leaf for each day (today's in
 * ink) beside that day's viewings and meetings. A leaf opens the calendar on
 * its week. Days and times are read in the agent's zone from values the
 * server and the browser share, so both render the same labels.
 */
export function UpcomingPanel({
  events,
  waitingBuyers = 0,
  nowISO,
}: {
  events: CalendarEvent[];
  /** Buyers who haven't reached the viewing stage; shapes the empty state. */
  waitingBuyers?: number;
  /** The instant Home was rendered for. */
  nowISO: string;
}) {
  const t = useTranslations("home.upcoming");
  const locale = useLocale();
  const tag = intlTag(locale);
  const timeZone = useAgentTimeZone();

  const todayKey = dateKeyInTimeZone(nowISO, timeZone);
  const next = [...events]
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .slice(0, LIMIT);
  const days = groupByDay(next, timeZone);

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-7 text-center">
        <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full">
          <CalendarDays className="size-4" strokeWidth={1.5} />
        </span>
        <p className="text-muted-foreground max-w-xs text-sm text-balance">
          {t.rich(waitingBuyers > 0 ? "emptyWaiting" : "empty", {
            count: waitingBuyers,
            link: (chunks) => (
              <Link
                href="/calendar"
                className="text-foreground decoration-foreground/25 hover:decoration-foreground font-medium underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {days.map((day) => {
        const date = parseISO(day.key);
        const isToday = day.key === todayKey;
        return (
          <li key={day.key} className="flex gap-3.5 px-4 py-3">
            <Link
              href={calendarHref("week", day.key)}
              aria-label={format(date, "EEEE d MMMM", { locale: dateFnsLocale(locale) })}
              className={cn(
                "focus-visible:ring-ring/50 flex h-11 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-lg leading-none outline-none transition-colors duration-150 focus-visible:ring-[3px]",
                isToday
                  ? "bg-foreground text-background"
                  : "bg-muted/60 hover:bg-muted text-foreground"
              )}
            >
              <span
                className={cn(
                  "text-[10px] first-letter:uppercase",
                  isToday ? "text-background/70" : "text-muted-foreground"
                )}
              >
                {format(date, "EEE", { locale: dateFnsLocale(locale) }).replace(".", "")}
              </span>
              <span className="text-[15px] font-semibold tabular-nums">
                {format(date, "d")}
              </span>
            </Link>
            <ul className="min-w-0 flex-1 space-y-2">
              {day.events.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  time={formatTimeInTimeZone(e.starts_at, timeZone, tag)}
                  remind={eventReminderHref(e, timeZone)}
                  remindTitle={t("remindTitle")}
                  remindAria={t("remindAria")}
                />
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function EventRow({
  event,
  time,
  remind,
  remindTitle,
  remindAria,
}: {
  event: CalendarEvent;
  time: string;
  /** A WhatsApp link with the reminder written, when the contact has a phone. */
  remind: string | null;
  remindTitle: string;
  remindAria: string;
}) {
  return (
    <li className="flex min-h-11 items-center gap-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", TONE_SOLID[EVENT_TONES[event.kind]])}
          />
          <span className="truncate text-sm leading-5 font-medium">{event.title}</span>
        </p>
        <p className="text-muted-foreground truncate pl-3.5 text-xs leading-5">
          <span className="tabular-nums">{time}</span>
          {event.location ? (
            <>
              <span className="mx-1">·</span>
              {event.location}
            </>
          ) : null}
        </p>
      </div>
      {remind ? (
        <a
          href={remind}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            "text-muted-foreground hover:text-foreground shrink-0"
          )}
          title={remindTitle}
          aria-label={remindAria}
        >
          {/* A thin grey channel icon, like the rest of the row. */}
          <MessageCircle className="size-4" strokeWidth={1.75} />
        </a>
      ) : null}
    </li>
  );
}
