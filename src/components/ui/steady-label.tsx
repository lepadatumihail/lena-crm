import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A label that can switch between regular and medium weight without changing
 * width: an invisible medium copy, stacked in the same grid cell, reserves the
 * wider size. For tabs, segments and chips, where the chosen item turns 500
 * and its neighbours must not shift. Pass plain text or inline content only,
 * since it renders twice.
 */
export function SteadyLabel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("inline-grid justify-items-center", className)}>
      <span className="col-start-1 row-start-1">{children}</span>
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 font-medium select-none"
      >
        {children}
      </span>
    </span>
  );
}
