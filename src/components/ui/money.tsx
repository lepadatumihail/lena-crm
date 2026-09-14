import { Fragment } from "react";

import { cn } from "@/lib/utils";

/**
 * A euro amount with the currency sign set quieter than the digits, so a
 * column of figures reads as numbers first. Whole euros only.
 */
export function Money({
  value,
  locale,
  className,
}: {
  value: number | null | undefined;
  /** BCP 47 tag, e.g. "en-GB" or "es-ES". */
  locale: string;
  className?: string;
}) {
  if (value == null) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).formatToParts(value);

  return (
    <span className={cn("tabular-nums", className)}>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part.type === "currency" ? (
            <span className="text-muted-foreground">{part.value}</span>
          ) : (
            part.value
          )}
        </Fragment>
      ))}
    </span>
  );
}
