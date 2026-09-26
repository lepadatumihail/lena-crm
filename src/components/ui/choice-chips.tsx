"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SteadyLabel } from "@/components/ui/steady-label";

export type ChoiceChip<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
};

/**
 * A row of single-choice chips: every option stays one tap away, where a
 * select would take two. Wraps onto a second line on a narrow screen. Chips
 * are rectangles like the toolbar's (pills mean status); the chosen one is a
 * quiet grey fill in ink at 500, and keeps its width so the row never reflows.
 */
export function ChoiceChips<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: readonly ChoiceChip<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The group's accessible name. */
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] whitespace-nowrap outline-none",
              "transition-[color,background-color,border-color,scale] duration-150 active:scale-[0.97]",
              "focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:size-3.5 [&_svg]:shrink-0",
              active
                ? "border-foreground/20 bg-muted text-foreground font-medium"
                : "bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {item.icon}
            <SteadyLabel>{item.label}</SteadyLabel>
          </button>
        );
      })}
    </div>
  );
}
