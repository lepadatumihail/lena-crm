import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A bordered surface with a slim header: tracked-caps title, an optional
 * count, an action on the right. Rows inside butt against the edges, so a
 * panel of rows reads like a small table.
 */
export function Panel({
  title,
  icon,
  count,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  icon?: ReactNode;
  count?: number | null;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-card text-card-foreground flex min-w-0 flex-col overflow-hidden rounded-xl border shadow-xs",
        className
      )}
    >
      {title || action ? (
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b px-4">
          <h3 className="label-caps text-muted-foreground flex min-w-0 items-center gap-2">
            {icon}
            <span className="truncate">{title}</span>
            {count != null && count > 0 ? (
              <span className="bg-muted text-foreground/80 inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tracking-normal normal-case tabular-nums">
                {count}
              </span>
            ) : null}
          </h3>
          {action}
        </header>
      ) : null}
      <div className={cn("min-w-0 flex-1", bodyClassName)}>{children}</div>
      {footer ? (
        <footer className="text-muted-foreground flex min-h-9 flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-1.5 text-xs">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

/** The panel header's link to the full page. */
export function PanelAction({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground -mr-1.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors duration-150"
    >
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

export function PanelEmpty({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground px-4 py-10 text-center text-sm text-balance",
        className
      )}
    >
      {children}
    </p>
  );
}
