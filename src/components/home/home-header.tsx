import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarPlus, Plus } from "lucide-react";

import { Greeting } from "@/components/home/greeting";
import { Button } from "@/components/ui/button";
import { intlTag } from "@/i18n/config";
import { AGENT_TIME_ZONE, greetingPeriod, hourInTimeZone } from "@/lib/home";

/**
 * The top of Home: the greeting and today's date, then the three "new"
 * actions. Nothing here waits for data (the agent's name comes from the
 * layout), so it paints with the first byte and never shifts.
 */
export function HomeHeader({ now }: { now: Date }) {
  const t = useTranslations("home");
  const tag = intlTag(useLocale());
  const period = greetingPeriod(hourInTimeZone(now.toISOString(), AGENT_TIME_ZONE));
  const dateLabel = new Intl.DateTimeFormat(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: AGENT_TIME_ZONE,
  }).format(now);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Greeting period={period} />
        <p className="text-muted-foreground text-sm">
          <span className="inline-block first-letter:uppercase">{dateLabel}</span>
          <span className="mx-1.5">·</span>
          {t("subtitle")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/clients/new?side=buyer">
            <Plus /> {t("actions.newBuyer")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/clients/new?side=seller">
            <Plus /> {t("actions.newSeller")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/calendar">
            <CalendarPlus /> {t("actions.newAppointment")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
