import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatItem = {
  label: string;
  value: ReactNode;
  /** A quiet line under the value. The slot keeps its height when empty, so a row of figures lines up. */
  hint?: ReactNode;
};

/* Literal class strings, so Tailwind sees every one. */
const COLUMNS = {
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
} as const;

/**
 * Headline figures in one bordered strip with hairlines between the cells:
 * the client page, billing, referrals and admin. Two to four figures; four
 * fold to two by two below lg.
 */
export function StatStrip({
  items,
  className,
}: {
  items: StatItem[];
  className?: string;
}) {
  const columns = COLUMNS[Math.min(Math.max(items.length, 2), 4) as 2 | 3 | 4];
  return (
    <dl
      className={cn(
        "bg-border grid gap-px overflow-hidden rounded-xl border shadow-xs",
        columns,
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-card min-w-0 px-4 py-3.5">
          <dt className="text-muted-foreground truncate text-xs">{item.label}</dt>
          <dd className="mt-1.5 text-lg leading-6 font-medium break-words tabular-nums">
            {item.value}
          </dd>
          <dd className="text-muted-foreground mt-0.5 truncate text-xs">
            {item.hint ?? " "}
          </dd>
        </div>
      ))}
    </dl>
  );
}
