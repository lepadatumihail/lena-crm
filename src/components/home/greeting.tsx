"use client";

import { format, parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";

import {
  useAgentFirstName,
  useAgentTimeZone,
} from "@/components/shell/shell-context";
import { dateFnsLocale } from "@/i18n/dates";
import { dateKeyInTimeZone, greetingPeriod, hourInTimeZone } from "@/lib/home";
import { cn } from "@/lib/utils";

/**
 * "Good afternoon, Mihail" over today's date. The instant comes from the
 * server, the name and time zone from the shell, so the server and the
 * browser render the same words and nothing here waits on a query.
 */
export function Greeting({
  nowISO,
  subtitle,
}: {
  nowISO: string;
  /** Replaces the everyday line under the greeting. */
  subtitle?: string;
}) {
  const t = useTranslations("home");
  const tGreeting = useTranslations("home.greeting");
  const locale = useLocale();
  const firstName = useAgentFirstName();
  const timeZone = useAgentTimeZone();

  const period = greetingPeriod(hourInTimeZone(nowISO, timeZone));
  // Formatted from the day alone, so neither runtime's own zone can move it.
  const dateLabel = format(
    parseISO(dateKeyInTimeZone(nowISO, timeZone)),
    locale === "es" ? "EEEE, d 'de' MMMM" : "EEEE d MMMM",
    { locale: dateFnsLocale(locale) }
  );

  return (
    <div className="min-w-0">
      <h2 className="truncate text-xl font-semibold tracking-tight">
        {tGreeting(period, {
          name: firstName ? tGreeting("named", { name: firstName }) : "",
        })}
      </h2>
      <p className="text-muted-foreground text-sm">
        <span className="inline-block first-letter:uppercase">{dateLabel}</span>
        {/* On a phone the everyday line gives way to the day's work; a
            first-session line says something, so it stays. */}
        <span className={cn(!subtitle && "max-sm:hidden")}>
          <span className="mx-1.5">·</span>
          {subtitle ?? t("subtitle")}
        </span>
      </p>
    </div>
  );
}
