import { Fragment } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * The pieces the free calculators share: their number formats, their labelled
 * fields and switches, and the result rows on the grey side of the card.
 */

/** 44 px to a thumb on a phone, the kit's own sizes from md up. */
export const INPUT = "h-11 md:h-9";
export const CHIPS = "[&>button]:h-11 md:[&>button]:h-8";

export function formatters(tag: string) {
  const money = new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const percent = new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 2 });
  const euros = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const percentText = new Intl.NumberFormat(tag, { maximumFractionDigits: 4, useGrouping: false });
  return {
    money,
    percent: (fraction: number) => percent.format(fraction),
    /** A number as the page's language writes it in an input: "437.500", "16.250,50", "3,5". */
    text: (value: number, kind: "money" | "number") =>
      kind === "number"
        ? percentText.format(value)
        : (Number.isInteger(value) ? euros : cents).format(value),
  };
}

export type Formatters = ReturnType<typeof formatters>;

export function Field({
  id,
  label,
  aside,
  children,
}: {
  id: string;
  label: string;
  /** A quiet word after the label, such as "Optional". */
  aside?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {aside ? <span className="text-muted-foreground text-xs">{aside}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** The whole row is the label, so the text is a 44 px target for the switch. */
export function SwitchRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label htmlFor={id} className="flex min-h-11 cursor-pointer justify-between gap-4 leading-snug">
      <span>{label}</span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </Label>
  );
}

export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-medium">{title}</h3>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

/** An amount with cents, the currency sign in the quieter colour. */
export function Money({ value, format }: { value: number; format: Formatters }) {
  return format.money.formatToParts(value).map((part, i) => (
    <Fragment key={i}>
      {part.type === "currency" ? (
        <span className="text-muted-foreground">{part.value}</span>
      ) : (
        part.value
      )}
    </Fragment>
  ));
}

/** One line of a result: its amount with cents, or a dash until the inputs are complete. */
export function Row({
  label,
  value,
  format,
  total = false,
  indent = false,
}: {
  label: string;
  value: number | null | undefined;
  format: Formatters;
  total?: boolean;
  /** A part of the row above it. */
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-1 text-sm",
        total ? "mt-1 border-t pt-2 font-medium" : "text-muted-foreground"
      )}
    >
      <dt className={cn(indent && "pl-3")}>{label}</dt>
      <dd className="text-foreground text-right tabular-nums">
        {value == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <Money value={value} format={format} />
        )}
      </dd>
    </div>
  );
}
