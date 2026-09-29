import type { ReactNode } from "react";
import Link from "next/link";

import { TONE_SOLID, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type StatSegment = { tone: Tone; percent: number; label: string };

export type StatDay = {
  key: string;
  /** The weekday in two letters: "Sa", "do". */
  letter: string;
  /** The day and its count in words, for the tooltip. */
  title: string;
  count: number;
  today: boolean;
};

/** What runs along a figure's foot. */
export type StatFooter =
  /** Where the clients stand: one segment per stage. */
  | { kind: "bar"; segments: StatSegment[]; label: string }
  /** A small bar per day, today first. */
  | { kind: "days"; days: StatDay[]; tone: Tone; label: string }
  /** A line of text, after a dot in `tone` when the line is a status. */
  | { kind: "note"; text: string; tone?: Tone };

export type StatTile = {
  label: string;
  value: ReactNode;
  /** A short word after the value, such as "+2 in 30 days". */
  aside?: ReactNode;
  footer?: StatFooter;
  href: string;
};

/**
 * Home's four headline figures as one card, split by hairlines: two by two
 * up to xl, then in a row. Each figure links to the list behind it. Each
 * figure spans three rows of the card's grid (label, value, foot) as a
 * subgrid, so when a narrow screen wraps one label onto two lines, the
 * values and feet beside it still line up. The foot is a fixed height, so a
 * bar, a week of bars and a line of text sit on the same floor.
 */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    // Below the day's work on a phone (see HomeLayout).
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs max-md:order-2">
      {/* The grid's gaps show its background: the hairlines between figures. */}
      <div className="bg-border grid grid-cols-2 gap-px xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="bg-card hover:bg-muted/40 focus-visible:ring-ring/50 row-span-3 grid min-w-0 grid-rows-subgrid gap-y-0 p-4 outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-inset sm:px-5"
          >
            <span className="text-muted-foreground line-clamp-2 self-start text-[13px] leading-snug sm:leading-5">
              {tile.label}
            </span>
            <span className="mt-2 flex min-w-0 items-baseline gap-2">
              <span className="text-2xl leading-8 font-semibold tracking-tight tabular-nums sm:text-[28px] sm:leading-9">
                {tile.value}
              </span>
              {tile.aside ? (
                <span className="text-muted-foreground truncate text-xs">
                  {tile.aside}
                </span>
              ) : null}
            </span>
            <div className="mt-3 flex h-8 items-end">
              {tile.footer ? <Footer footer={tile.footer} /> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Footer({ footer }: { footer: StatFooter }) {
  if (footer.kind === "bar") return <StageBar segments={footer.segments} label={footer.label} />;
  if (footer.kind === "days") return <DayBars days={footer.days} tone={footer.tone} label={footer.label} />;
  return (
    <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs leading-4">
      {footer.tone ? (
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", TONE_SOLID[footer.tone])} />
      ) : null}
      <span className="truncate">{footer.text}</span>
    </span>
  );
}

/**
 * The stages as rounded segments with a little air between them, each as
 * wide as its share. An empty side draws the bare track.
 */
function StageBar({ segments, label }: { segments: StatSegment[]; label: string }) {
  const live = segments.filter((s) => s.percent > 0);
  return (
    <div role="img" aria-label={label} className="flex h-2 w-full gap-[3px]">
      {live.length === 0 ? (
        <span className="bg-foreground/10 h-full flex-1 rounded-full" />
      ) : (
        live.map((s) => (
          <span
            key={s.label}
            title={s.label}
            className={cn("h-full min-w-1.5 basis-0 rounded-full", TONE_SOLID[s.tone])}
            style={{ flexGrow: s.percent }}
          />
        ))
      )}
    </div>
  );
}

const DAY_BAR_MAX = 18;

/** A bar per day, today's name in ink; an empty day keeps a short stub. */
function DayBars({ days, tone, label }: { days: StatDay[]; tone: Tone; label: string }) {
  const most = Math.max(1, ...days.map((d) => d.count));
  return (
    <div role="img" aria-label={label} className="grid h-full w-full grid-cols-7 gap-1">
      {days.map((d) => (
        <span key={d.key} title={d.title} className="flex flex-col items-center justify-end gap-1">
          <span
            className={cn(
              "w-full max-w-5 rounded-[3px]",
              d.count > 0 ? TONE_SOLID[tone] : "bg-foreground/10"
            )}
            style={{
              height: d.count > 0 ? Math.max(6, Math.round((d.count / most) * DAY_BAR_MAX)) : 3,
            }}
          />
          <span
            className={cn(
              "text-[10px] leading-none capitalize",
              d.today ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {d.letter}
          </span>
        </span>
      ))}
    </div>
  );
}
