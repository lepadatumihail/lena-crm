import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown, Plus } from "lucide-react";

import { Greeting } from "@/components/home/greeting";
import { NEW_ACTIONS } from "@/components/shell/new-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The top of Home: the greeting and today's date, then one "New" button.
 * Its menu lists what the phone's + sheet and ⌘K list (a buyer, a seller,
 * a pasted lead, a task, an appointment), so Home's corner holds a single
 * ink action instead of a row of them. Nothing here waits for data (the
 * agent's name and time zone come from the layout), so it paints with the
 * first byte and never shifts.
 */
export function HomeHeader({ now }: { now: Date }) {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  return (
    // No wrap: on a narrow window the greeting's line wraps, and New stays
    // in the corner rather than dropping under it.
    <div className="flex items-end justify-between gap-3">
      <Greeting nowISO={now.toISOString()} />
      {/* On a phone the tab bar's + opens the same list. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="group max-md:hidden">
            <Plus /> {t("actions.new")}
            <ChevronDown className="-mr-0.5 opacity-60 transition-transform duration-200 ease-(--ease-standard) group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-48">
          {NEW_ACTIONS.map((action) => (
            <DropdownMenuItem key={action.id} asChild>
              <Link href={action.href}>
                <action.icon strokeWidth={1.75} />
                {tNav(action.labelKey)}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
