import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * The line under the greeting that sums up the day: who is waiting, what is
 * due, how full the week is. The panels below hold the detail. On a phone
 * the week gives way, so the line keeps to one row there.
 */
export function DaySummary({
  attention,
  tasks,
  week,
}: {
  /** Clients in Needs attention. */
  attention: number;
  /** Open tasks due today or earlier; null while tasks aren't available. */
  tasks: number | null;
  /** Viewings and meetings from now to the end of the seventh day. */
  week: number;
}) {
  const t = useTranslations("home.summary");
  const b = (chunks: ReactNode) => (
    <span className="text-foreground font-medium tabular-nums">{chunks}</span>
  );
  const parts: { key: string; text: ReactNode; wide?: boolean }[] = [
    { key: "attention", text: t.rich("attention", { count: attention, b }) },
    ...(tasks === null ? [] : [{ key: "tasks", text: t.rich("tasks", { count: tasks, b }) }]),
    { key: "week", text: t.rich("week", { count: week, b }), wide: true },
  ];

  return (
    <p>
      {parts.map((part, i) => (
        <span key={part.key} className={cn(part.wide && "max-sm:hidden")}>
          {i > 0 ? (
            <Fragment>
              <span aria-hidden className="mx-1.5">
                ·
              </span>
              <span className="sr-only">, </span>
            </Fragment>
          ) : null}
          {part.text}
        </span>
      ))}
    </p>
  );
}
