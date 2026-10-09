"use client";

import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";

import {
  useAgentFirstName,
  useAgentTimeZone,
} from "@/components/shell/shell-context";
import { dateFnsLocale } from "@/i18n/dates";
import { dateKeyInTimeZone, greetingPeriod, hourInTimeZone } from "@/lib/home";

/**
 * Today's date over "Good afternoon, Mihail", then a line about the day. The
 * instant comes from the server, the name and time zone from the shell, so
 * the server and the browser render the same words and nothing here waits on
 * a query. The line under it may: Home streams its summary of the day there.
 */
export function Greeting({
  nowISO,
  subtitle,
}: {
  nowISO: string;
  /** The line under the greeting. */
  subtitle?: ReactNode;
}) {
  const tGreeting = useTranslations("home.greeting");
  const locale = useLocale();
  const firstName = useAgentFirstName();
  const timeZone = useAgentTimeZone();

  const period = greetingPeriod(hourInTimeZone(nowISO, timeZone));
  // Formatted from the day alone, so neither runtime's own zone can move it.
  const dateLabel = format(
    parseISO(dateKeyInTimeZone(nowISO, timeZone)),
    locale === "es" ? "EEEE, d 'de' MMMM" : locale === "ru" ? "EEEE, d MMMM" : "EEEE d MMMM",
    { locale: dateFnsLocale(locale) }
  );

  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-[13px] leading-5 first-letter:uppercase">
        {dateLabel}
      </p>
      <h2 className="truncate text-2xl font-semibold tracking-tight sm:text-[28px] sm:leading-9">
        {tGreeting(period, {
          name: firstName ? tGreeting("named", { name: firstName }) : "",
        })}
      </h2>
      {subtitle ? (
        <div className="text-muted-foreground mt-1 text-sm">{subtitle}</div>
      ) : null}
    </div>
  );
}
