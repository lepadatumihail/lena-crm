"use client";

import { format, parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";

import {
  useAgentFirstName,
  useAgentTimeZone,
} from "@/components/shell/shell-context";
import { dateFnsLocale } from "@/i18n/dates";
import { dateKeyInTimeZone, greetingPeriod, hourInTimeZone } from "@/lib/home";

/**
 * "Good afternoon, Mihail" over today's date. The instant comes from the
 * server, the name and time zone from the shell, so the server and the
 * browser render the same words and nothing here waits on a query.
 */
export function Greeting({ nowISO }: { nowISO: string }) {
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
        <span className="mx-1.5">·</span>
        {t("subtitle")}
      </p>
    </div>
  );
}
