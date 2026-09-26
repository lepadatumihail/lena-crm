"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { addDays, format, parseISO } from "date-fns";
import { MessageCircle } from "lucide-react";

import { PanelEmpty } from "@/components/shell/panel";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { buttonVariants } from "@/components/ui/button";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { formatTimeInTimeZone } from "@/lib/attention";
import { eventReminderHref } from "@/lib/event-reminder";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";
import { TONE_SOLID } from "@/lib/tones";
import { EVENT_TONES } from "@/lib/calendar";
import { dateKeyInTimeZone } from "@/lib/home";

const LIMIT = 6;

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
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const tag = intlTag(locale);
  const timeZone = useAgentTimeZone();

  // Days and times are read in the agent's zone from values the server and
  // the browser share, so both render the same labels.
  const todayKey = dateKeyInTimeZone(nowISO, timeZone);
  const tomorrowKey = format(addDays(parseISO(todayKey), 1), "yyyy-MM-dd");
  function dayLabel(iso: string): string {
    const key = dateKeyInTimeZone(iso, timeZone);
    if (key === todayKey) return tCommon("today");
    if (key === tomorrowKey) return tCommon("tomorrow");
    return format(parseISO(key), "EEE d MMM", { locale: dateFnsLocale(locale) });
  }

  const sorted = [...events]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, LIMIT);

  if (sorted.length === 0) {
    return (
      <PanelEmpty>
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
      </PanelEmpty>
    );
  }

  return (
    <ul className="divide-y">
      {sorted.map((e) => {
        const remind = eventReminderHref(e);
        return (
          <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
            {/* Wide enough for "Wed 30 Sep" and "mié 30 sept" in full. */}
            <div className="w-[4.75rem] shrink-0 leading-tight">
              <p className="truncate text-xs first-letter:uppercase">
                {dayLabel(e.starts_at)}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {formatTimeInTimeZone(e.starts_at, timeZone, tag)}
              </p>
            </div>
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                TONE_SOLID[EVENT_TONES[e.kind]]
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.title}</p>
              {e.location ? (
                <p className="text-muted-foreground truncate text-xs">
                  {e.location}
                </p>
              ) : null}
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
                title={t("remindTitle")}
                aria-label={t("remindAria")}
              >
                {/* A thin grey channel icon, like the rest of the row. */}
                <MessageCircle className="size-4" strokeWidth={1.75} />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
