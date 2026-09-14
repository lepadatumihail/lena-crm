import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
  Labelled values on the client page: one value per row, label left and value
  right, hairlines between. The same rhythm as the list table, so a panel of
  details reads like a small table.
*/

export function KeyValueList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <dl className={cn("divide-y", className)}>{children}</dl>;
}

export function KeyValueRow({
  icon: Icon,
  label,
  href,
  wrap = false,
  actions,
  className,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  /** Turns the value into a link (mailto:, tel:, a page). */
  href?: string;
  /** Let the value wrap onto several lines (tags) instead of truncating. */
  wrap?: boolean;
  /** Small icon buttons after the value, e.g. copy. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const value = wrap ? (
    <div className="flex flex-wrap justify-end gap-1.5">{children}</div>
  ) : href ? (
    <a href={href} className="block truncate hover:underline">
      {children}
    </a>
  ) : (
    <span className="block truncate">{children}</span>
  );

  return (
    <div
      className={cn(
        "flex min-h-10 items-center justify-between gap-4 py-2 pl-4",
        actions ? "pr-2" : "pr-4",
        className
      )}
    >
      <dt className="text-muted-foreground flex shrink-0 items-center gap-2 text-[13px]">
        {Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={1.75} /> : null}
        {label}
      </dt>
      <dd className="flex min-w-0 items-center gap-1 text-right text-sm font-medium tabular-nums">
        <div className="min-w-0">{value}</div>
        {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
      </dd>
    </div>
  );
}

/** The 32px icon tile that opens a list row. */
export function RowIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
        className
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  );
}
