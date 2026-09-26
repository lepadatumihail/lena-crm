"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Globe, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  listTimeZones,
  timeZoneCity,
  timeZoneRegion,
  utcOffsetLabel,
} from "@/lib/time-zones";
import { cn } from "@/lib/utils";

/* Regions in the order agents are most likely to look, Europe first. */
const REGIONS = [
  "Europe",
  "America",
  "Africa",
  "Asia",
  "Atlantic",
  "Australia",
  "Indian",
  "Pacific",
  "Antarctica",
  "Arctic",
  "UTC",
  "Other",
] as const;
type Region = (typeof REGIONS)[number];

type ZoneOption = { zone: string; city: string; region: Region; offset: string };

/** Lower-case and strip accents, so typing "sao paulo" finds "São Paulo". */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function regionOf(zone: string): Region {
  const region = timeZoneRegion(zone);
  return (REGIONS as readonly string[]).includes(region) ? (region as Region) : "Other";
}

/**
 * The time zone field: the chosen city and its UTC offset, opening a
 * searchable list grouped by region. Extra props (the form's id and aria
 * attributes) land on the trigger button.
 */
export function TimeZonePicker({
  value,
  onChange,
  className,
  ...triggerProps
}: Omit<ComponentProps<"button">, "value" | "onChange"> & {
  value: string;
  onChange: (zone: string) => void;
}) {
  const [open, setOpen] = useState(false);

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
          <span className="flex min-w-0 items-center gap-2">
            <Globe className="text-muted-foreground" strokeWidth={1.75} />
            <span className="truncate">{timeZoneCity(value)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground text-xs tabular-nums">
              {utcOffsetLabel(value)}
            </span>
            <ChevronsUpDown className="text-muted-foreground size-3.5" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-72 p-0"
      >
        <ZoneList
          value={value}
          onPick={(zone) => {
            onChange(zone);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function ZoneList({
  value,
  onPick,
}: {
  value: string;
  onPick: (zone: string) => void;
}) {
  const t = useTranslations("settings.timeZonePicker");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Built when the list opens: every zone, asked for its offset once.
  const [options] = useState<ZoneOption[]>(() => {
    const now = new Date();
    return listTimeZones().map((zone) => ({
      zone,
      city: timeZoneCity(zone),
      region: regionOf(zone),
      offset: utcOffsetLabel(zone, now),
    }));
  });

  const groups = useMemo(() => {
    const q = fold(query.trim());
    const matches = options.filter(
      (o) =>
        !q ||
        fold(o.city).includes(q) ||
        fold(o.zone).includes(q) ||
        fold(o.offset).includes(q)
    );
    return REGIONS.map((region) => ({
      region,
      items: matches
        .filter((o) => o.region === region)
        .sort((a, b) => a.city.localeCompare(b.city)),
    })).filter((group) => group.items.length > 0);
  }, [options, query]);

  // Open on the current choice rather than the top of a long list.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "center" });
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = [
      ...(listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-zone]") ?? []),
    ];
    if (event.key === "Enter" && event.target === inputRef.current) {
      event.preventDefault();
      const first = buttons[0]?.dataset.zone;
      if (query.trim() && first) onPick(first);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    if (next < 0) inputRef.current?.focus();
    else buttons[Math.min(next, buttons.length - 1)]?.focus();
  }

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
          placeholder={t("search")}
          aria-label={t("search")}
          className="placeholder:text-muted-foreground h-10 w-full bg-transparent pr-3 pl-9 text-sm outline-none"
        />
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label={t("search")}
        className="max-h-72 overflow-y-auto overscroll-contain p-1"
      >
        {groups.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">{t("empty")}</p>
        ) : (
          groups.map((group) => (
            <div key={group.region} role="group" aria-label={t(`regions.${group.region}`)}>
              <p className="section-label text-muted-foreground px-2 pt-2.5 pb-1">
                {t(`regions.${group.region}`)}
              </p>
              {group.items.map((o) => {
                const selected = o.zone === value;
                return (
                  <button
                    key={o.zone}
                    type="button"
                    role="option"
                    data-zone={o.zone}
                    aria-selected={selected}
                    onClick={() => onPick(o.zone)}
                    className={cn(
                      "hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors duration-150",
                      selected && "bg-accent/60"
                    )}
                  >
                    <Check
                      className={cn("size-3.5 shrink-0", selected ? "text-foreground" : "invisible")}
                    />
                    <span className="min-w-0 flex-1 truncate">{o.city}</span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {o.offset}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
