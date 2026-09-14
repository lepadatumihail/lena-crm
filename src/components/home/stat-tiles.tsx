import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { TONE_SOLID, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type StatSegment = { tone: Tone; percent: number; label: string };

export type StatTile = {
  label: string;
  value: ReactNode;
  /** Small line under the value: a secondary figure or a nudge when empty. */
  hint?: string | null;
  /** A stacked bar under the value instead of a hint. */
  bar?: StatSegment[];
  href: string;
  icon: LucideIcon;
};

/**
 * Four headline figures. Each tile links to the list behind the number; the
 * bottom slot has a fixed height so a tile with a bar and one with a hint
 * line up.
 */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          href={tile.href}
          className="bg-card text-card-foreground hover:bg-muted/40 focus-visible:ring-ring/50 flex min-w-0 flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors duration-150 outline-none focus-visible:ring-[3px]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground line-clamp-2 text-xs leading-snug sm:truncate sm:leading-normal">
              {tile.label}
            </span>
            <tile.icon
              className="text-muted-foreground/70 size-4 shrink-0"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
            {tile.value}
          </span>
          <div className="flex h-4 items-center">
            {tile.bar ? (
              <MiniBar segments={tile.bar} />
            ) : tile.hint ? (
              <span className="text-muted-foreground truncate text-xs">
                {tile.hint}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function MiniBar({ segments }: { segments: StatSegment[] }) {
  const live = segments.filter((s) => s.percent > 0);
  return (
    <div
      className="bg-muted flex h-1.5 w-full gap-px overflow-hidden rounded-full"
      role="img"
      aria-label={segments.map((s) => s.label).join(", ")}
    >
      {live.map((s, i) => (
        <span
          key={i}
          className={cn("h-full", TONE_SOLID[s.tone])}
          style={{ width: `${s.percent}%` }}
        />
      ))}
    </div>
  );
}
