"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";

import { TONE_BG, TONE_INK, type Tone } from "@/lib/tones";
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

/** A tab in a list's filter strip: a label, a live count, an optional tone dot. */
export type ToolbarTab = {
  value: string;
  label: ReactNode;
  count?: number;
  /** A TONE_SOLID class for the dot before the label. */
  dot?: string;
  /** An icon before the label, for a tab that is not a stage. */
  icon?: ReactNode;
  /** Tints a count above zero, for a tab whose rows wait on the agent. */
  countTone?: Tone;
};

/**
 * Underlined filter tabs across the top of a list, each with its count. The
 * strip scrolls sideways on a phone rather than wrapping; children sit at its
 * right end, on the same hairline.
 */
export function ToolbarTabs({
  tabs,
  value,
  onChange,
  label,
  className,
  children,
}: {
  tabs: ToolbarTab[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the strip. */
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex items-end gap-3 border-b", className)}>
      <div
        role="tablist"
        aria-label={label}
        className="scrollbar-none -mx-1 flex min-w-0 flex-1 items-end overflow-x-auto px-1"
      >
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                "-mb-px flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:bg-muted/60 [&>svg]:size-3.5 [&>svg]:shrink-0",
                active
                  ? "border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              {tab.dot ? (
                <span aria-hidden className={cn("size-1.5 rounded-full", tab.dot)} />
              ) : null}
              {tab.icon}
              {tab.label}
              {tab.count != null ? (
                <span
                  className={cn(
                    "inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums",
                    tab.countTone && tab.count > 0
                      ? cn(TONE_BG[tab.countTone], TONE_INK[tab.countTone], "font-medium")
                      : active
                        ? "bg-foreground/10 text-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2 pb-1">{children}</div>
      ) : null}
    </div>
  );
}

export type SegmentedItem = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Makes the item a link: a view that lives in the URL. */
  href?: string;
  /** Runs before navigating or changing, e.g. to remember the choice. */
  onSelect?: () => void;
};

/**
 * Two or three exclusive choices in one muted track, the chosen one raised:
 * week or month, a language, a theme. Items with an href are links, the rest
 * are buttons.
 */
export function Segmented({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: SegmentedItem[];
  value: string;
  onChange?: (value: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("bg-muted inline-flex h-8 items-center rounded-lg p-0.5", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        const itemClass = cn(
          "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-3.5 [&_svg]:shrink-0",
          active
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        );
        return item.href ? (
          <Link
            key={item.value}
            href={item.href}
            onClick={item.onSelect}
            aria-current={active ? "page" : undefined}
            className={itemClass}
          >
            {item.icon}
            {item.label}
          </Link>
        ) : (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              item.onSelect?.();
              onChange?.(item.value);
            }}
            className={itemClass}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
