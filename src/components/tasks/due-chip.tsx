"use client";

import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { CalendarDays, CircleAlert } from "lucide-react";

import { Tag } from "@/components/ui/tag";
import { dateFnsLocale } from "@/i18n/dates";
import { dueState, DUE_TONES } from "@/lib/tasks";

/**
 * A task's due date against the agent's today: red with an alert icon when
 * overdue, amber today. The visible text is short ("Today", "16 Sep"); screen
 * readers hear one full sentence instead, so colour is never the only cue.
 */
export function DueChip({
  dueOn,
  todayKey,
  className,
}: {
  dueOn: string | null;
  todayKey: string;
  className?: string;
}) {
  const t = useTranslations("tasks.due");
  const locale = useLocale();
  if (!dueOn) return null;

  const state = dueState(dueOn, todayKey);
  // parseISO on a date-only key is local midnight of that day, so the day never shifts.
  const date = format(parseISO(dueOn), "d MMM", { locale: dateFnsLocale(locale) });
  const sentence = state === "overdue" ? t("overdueOn", { date }) : t("dueOn", { date });
  const visible = state === "today" ? t("today") : state === "tomorrow" ? t("tomorrow") : date;

  return (
    <Tag tone={DUE_TONES[state]} title={sentence} className={className}>
      {state === "overdue" ? <CircleAlert aria-hidden /> : <CalendarDays aria-hidden />}
      <span aria-hidden>{visible}</span>
      <span className="sr-only">{sentence}</span>
    </Tag>
  );
}
