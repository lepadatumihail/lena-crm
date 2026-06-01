"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

/** Group digits with "." every three, European style: 1200000 → "1.200.000". */
export function groupThousands(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * A money input that shows grouped digits ("750.000") while keeping the raw
 * digit string ("750000") as the form value, so existing numeric validation
 * and server coercion keep working unchanged.
 */
export function PriceInput({
  value,
  onChange,
  ...props
}: Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      inputMode="numeric"
      value={groupThousands(value)}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      {...props}
    />
  );
}
