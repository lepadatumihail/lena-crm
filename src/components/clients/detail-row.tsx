import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Wrapper for a list of detail rows. On a narrow card it's a single tight
 * column with hairline dividers (compact, structured — no wasted whitespace);
 * once the card itself is wide enough it becomes a two-column grid.
 */
export const DETAIL_LIST =
  "flex flex-col divide-y divide-border/60 @sm:grid @sm:grid-cols-2 @sm:gap-x-8 @sm:gap-y-4 @sm:divide-y-0";

const CELL = "py-2.5 first:pt-0 last:pb-0 @sm:py-0";

/** Inline `icon · label … value` row for short, scalar values. */
export function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", CELL, className)}>
      <dt className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon className="size-4 shrink-0 opacity-70" />
        {label}
      </dt>
      <dd className="text-right text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/** Full-width stacked block for richer values (badges, long text). */
export function DetailBlock({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(CELL, "@sm:col-span-2", className)}>
      <dt className="text-muted-foreground flex items-center gap-2 text-xs">
        <Icon className="size-3.5 shrink-0 opacity-70" />
        {label}
      </dt>
      <dd className="mt-1.5 text-sm">{children}</dd>
    </div>
  );
}
