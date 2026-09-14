"use client";

import type { ComponentProps, ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/*
  Toolbar controls above a list: 32px tall, 12px type, hairline borders. The
  filter chip pairs a muted label with the chosen value in one outline, so a
  row of them scans as "Stage: Any · Type: All" rather than as loose menus.
*/

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-background inline-flex h-8 items-stretch overflow-hidden rounded-lg border text-xs shadow-xs",
        className
      )}
    >
      <span className="text-muted-foreground flex items-center border-r px-2.5">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          size="sm"
          className="h-full gap-1.5 rounded-none border-0 bg-transparent px-2.5 text-xs font-medium shadow-none focus-visible:ring-0 data-[size=sm]:h-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** A toggle in the toolbar: outline at rest, brand-tinted when pressed. */
export function ToolbarChip({
  pressed = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium whitespace-nowrap shadow-xs transition-[color,background-color,border-color,scale] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.96] [&_svg]:size-3.5 [&_svg]:shrink-0",
        pressed
          ? "border-primary/30 bg-primary/10 text-primary"
          : "bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Table ⇄ board. Icons only; labels go to the accessible name. */
export function ViewToggle({
  view,
  onChange,
  tableLabel,
  boardLabel,
}: {
  view: "table" | "kanban";
  onChange: (view: "table" | "kanban") => void;
  tableLabel: string;
  boardLabel: string;
}) {
  const item = (value: "table" | "kanban", label: string, icon: ReactNode) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={view === value}
      onClick={() => onChange(value)}
      className={cn(
        "flex size-7 items-center justify-center rounded-md transition-[color,background-color,box-shadow] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4",
        view === value
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );
  return (
    <div role="group" className="bg-muted inline-flex h-8 items-center rounded-lg p-0.5">
      {item("table", tableLabel, <List strokeWidth={1.75} />)}
      {item("kanban", boardLabel, <LayoutGrid strokeWidth={1.75} />)}
    </div>
  );
}
