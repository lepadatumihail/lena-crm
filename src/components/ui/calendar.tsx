"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { dateFnsLocale } from "@/i18n/dates";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale,
  labels,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const uiLocale = useLocale();
  const t = useTranslations("common.calendar");
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      // Month and weekday names follow the agent's UI language unless a caller
      // pins a locale of its own.
      locale={locale ?? dateFnsLocale(uiLocale)}
      labels={{
        labelPrevious: () => t("previousMonth"),
        labelNext: () => t("nextMonth"),
        ...labels,
      }}
      className={cn("relative p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-4",
        month_caption: "flex h-7 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground w-9 text-[0.8rem] font-normal",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-md p-0 font-normal",
          "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
        ),
        today:
          "[&>button:not([aria-selected=true])]:bg-accent [&>button:not([aria-selected=true])]:text-accent-foreground",
        outside: "[&>button]:text-muted-foreground/40",
        disabled: "[&>button]:pointer-events-none [&>button]:opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4", chevronClassName)} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
