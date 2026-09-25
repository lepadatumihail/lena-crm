"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, fold } from "@/lib/utils";

export type SearchSelectOption = {
  /** What is stored. */
  value: string;
  /** What is shown, in the agent's UI language. */
  label: string;
  /** Other words that should find this option (the English name, a country). */
  keywords?: string[];
  /** A flag or icon before the label. */
  prefix?: ReactNode;
};

type Labels = {
  placeholder: string;
  search: string;
  /** The row that clears the field. */
  none: string;
  /**
   * The row that keeps what was typed when it is not in the list. Leave it
   * out for a strict picker (a client, say), where only listed values count.
   */
  useTyped?: (typed: string) => string;
  /** Shown when nothing matches, in a strict picker. */
  empty?: string;
};

/**
 * A text field picked from a searchable list. The value stays free text: one
 * that is not in the list (older data, a lead pasted in) is shown as it is,
 * and the agent can keep whatever they typed, unless `labels.useTyped` is
 * left out, which makes it a strict picker. Extra props (the form's id and
 * aria attributes) land on the trigger button.
 */
export function SearchSelect({
  value,
  onChange,
  options,
  labels,
  className,
  ...triggerProps
}: Omit<ComponentProps<"button">, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => fold(o.value) === fold(value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between gap-3 px-3 font-normal", className)}
          {...triggerProps}
        >
          <span
            className={cn(
              "flex min-w-0 items-center gap-2",
              !value && "text-muted-foreground"
            )}
          >
            {current?.prefix}
            <span className="truncate">
              {current?.label ?? (value || labels.placeholder)}
            </span>
          </span>
          <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-64 p-0"
      >
        <OptionList
          value={value}
          options={options}
          labels={labels}
          onPick={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function OptionList({
  value,
  options,
  labels,
  onPick,
}: {
  value: string;
  options: SearchSelectOption[];
  labels: Labels;
  onPick: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const typed = query.trim();
  const matches = useMemo(() => {
    const q = fold(typed);
    if (!q) return options;
    return options.filter((o) =>
      [o.label, o.value, ...(o.keywords ?? [])].some((word) =>
        fold(word).includes(q)
      )
    );
  }, [options, typed]);
  // Offer the typed text itself unless the list already has it.
  const offerTyped =
    labels.useTyped != null &&
    typed !== "" &&
    !options.some((o) => fold(o.label) === fold(typed) || fold(o.value) === fold(typed));

  // Open on the current choice rather than the top of the list.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "center" });
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = [
      ...(listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-value]") ?? []),
    ];
    if (event.key === "Enter" && event.target === inputRef.current) {
      event.preventDefault();
      const first = buttons[0]?.dataset.value;
      if (typed && first != null) onPick(first);
      return;
    }
    const focused = buttons.find((b) => b === event.target);
    if (event.key === "Enter" && focused) {
      event.preventDefault();
      onPick(focused.dataset.value ?? "");
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    if (next < 0) inputRef.current?.focus();
    else buttons[Math.min(next, buttons.length - 1)]?.focus();
  }

  const rowClass =
    "hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors duration-150";

  return (
    <div onKeyDown={onKeyDown}>
      <div className="relative border-b">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          strokeWidth={1.75}
        />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.search}
          aria-label={labels.search}
          className="placeholder:text-muted-foreground h-10 w-full bg-transparent pr-3 pl-9 text-sm outline-none"
        />
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label={labels.search}
        className="max-h-64 overflow-y-auto overscroll-contain p-1"
      >
        {!typed && value ? (
          <button
            type="button"
            role="option"
            data-value=""
            aria-selected={false}
            onClick={() => onPick("")}
            className={cn(rowClass, "text-muted-foreground")}
          >
            <Check className="invisible size-3.5 shrink-0" />
            {labels.none}
          </button>
        ) : null}
        {matches.map((o) => {
          const selected = fold(o.value) === fold(value);
          return (
            <button
              key={o.value}
              type="button"
              role="option"
              data-value={o.value}
              aria-selected={selected}
              onClick={() => onPick(o.value)}
              className={cn(rowClass, selected && "bg-accent/60")}
            >
              <Check
                className={cn("size-3.5 shrink-0", selected ? "text-primary" : "invisible")}
              />
              {o.prefix}
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
            </button>
          );
        })}
        {offerTyped && labels.useTyped ? (
          <button
            type="button"
            role="option"
            data-value={typed}
            aria-selected={false}
            onClick={() => onPick(typed)}
            className={rowClass}
          >
            <Check className="invisible size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{labels.useTyped(typed)}</span>
          </button>
        ) : null}
        {matches.length === 0 && !offerTyped && labels.empty ? (
          <p className="text-muted-foreground px-2 py-1.5 text-sm">{labels.empty}</p>
        ) : null}
      </div>
    </div>
  );
}
