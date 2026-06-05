"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES, flagEmoji, parsePhone } from "@/lib/countries";
import { cn } from "@/lib/utils";

export function PhoneInput({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const [dial, setDial] = useState(() => parsePhone(value ?? "").dial);
  const [number, setNumber] = useState(() => parsePhone(value ?? "").number);
  const [lastValue, setLastValue] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Adjust state when `value` changes from outside (edit load / lead-paste
  // autofill) — React's "derive state during render" pattern, not an effect.
  // The guard skips our own emits (where value already equals the current pair)
  // so clearing the number never resets the chosen country.
  const current = number.trim() ? `${dial} ${number.trim()}` : "";
  if ((value ?? "") !== lastValue) {
    setLastValue(value ?? "");
    if ((value ?? "") !== current) {
      const p = parsePhone(value ?? "");
      setDial(p.dial);
      setNumber(p.number);
    }
  }

  function emit(nextDial: string, nextNumber: string) {
    onChange(nextNumber.trim() ? `${nextDial} ${nextNumber.trim()}` : "");
  }

  function selectDial(d: string) {
    setDial(d);
    emit(d, number);
    setOpen(false);
    setSearch("");
  }

  const selected = COUNTRIES.find((c) => c.dial === dial);
  const q = search.trim().toLowerCase();
  const filtered = COUNTRIES.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.iso.toLowerCase().includes(q)
  );

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-1.5 px-3 font-normal"
          >
            <span className="text-base leading-none">
              {selected ? flagEmoji(selected.iso) : "🌐"}
            </span>
            <span>{dial}</span>
            <ChevronDown className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <div className="relative border-b">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country…"
              className="w-full bg-transparent py-2.5 pr-3 pl-8 text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                No match
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => selectDial(c.dial)}
                  className={cn(
                    "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    c.dial === dial && "bg-accent"
                  )}
                >
                  <span className="text-base leading-none">
                    {flagEmoji(c.iso)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-muted-foreground">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        inputMode="tel"
        value={number}
        onChange={(e) => {
          setNumber(e.target.value);
          emit(dial, e.target.value);
        }}
        onBlur={onBlur}
        placeholder="600 000 000"
      />
    </div>
  );
}
