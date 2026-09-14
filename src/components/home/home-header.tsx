import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarPlus, Plus } from "lucide-react";

import { Greeting } from "@/components/home/greeting";
import { Button } from "@/components/ui/button";

/**
 * The top of Home: the greeting and today's date, then the three "new"
 * actions. Nothing here waits for data (the agent's name and time zone come
 * from the layout), so it paints with the first byte and never shifts.
 */
export function HomeHeader({ now }: { now: Date }) {
  const t = useTranslations("home");

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <Greeting nowISO={now.toISOString()} />
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
