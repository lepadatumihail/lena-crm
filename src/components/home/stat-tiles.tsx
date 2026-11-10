import type { ReactNode } from "react";
import Link from "next/link";

import { TONE_SOLID, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type StatSegment = { tone: Tone; percent: number; label: string };

export type StatDay = {
  key: string;
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
 * Home's four headline figures as small widgets: a card each, the label over
 * the figure, and beside the figure a mini chart of what's behind it (the
 * stage mix, the week's viewings) or a short note. Two by two until the row
 * is wide enough for four (its own width, which the sidebar narrows). Each
 * widget spans two rows of the grid as a subgrid, so when a narrow screen
 * wraps one label onto two lines, the figures beside it still line up. Each
 * widget links to the list behind it.
 */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    // Below the day's work on a phone (see HomeLayout).
    <div className="@container max-md:order-2">
      <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="bg-card hover:bg-muted/40 focus-visible:ring-ring/50 row-span-2 grid min-w-0 grid-rows-subgrid gap-y-1 rounded-xl border px-3.5 py-3 shadow-xs outline-none transition-colors duration-150 focus-visible:ring-[3px]"
          >
            <span className="text-muted-foreground line-clamp-2 self-start text-xs leading-4">
              {tile.label}
            </span>
            {/* The figure's row is the container the mini chart and the note
                measure: a container on the card itself would switch off its
                subgrid (containment makes it a layout of its own). */}
            <span className="@container/stat flex min-w-0 items-end justify-between gap-3 self-end">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="font-display text-[22px] leading-7 font-normal tracking-[-0.02em] tabular-nums">
                  {tile.value}
                </span>
                {tile.aside ? (
                  <span className="text-muted-foreground truncate text-xs @max-[11rem]/stat:hidden">
                    {tile.aside}
                  </span>
                ) : null}
              </span>
              {tile.footer ? <Mini footer={tile.footer} /> : null}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/*
  The mini charts stand on the figure's baseline (7px above the foot of its
  28px line) and grow with the widget: 30% of the figure's row, 56 to 96px.
*/
const MINI = "mb-[7px] w-[clamp(3.5rem,30cqi,6rem)] shrink-0";

function Mini({ footer }: { footer: StatFooter }) {
  if (footer.kind === "bar") return <StageBar segments={footer.segments} label={footer.label} />;
  if (footer.kind === "days") return <DayBars days={footer.days} tone={footer.tone} label={footer.label} />;
  // A note needs room beside the figure; a narrow widget leaves it out.
  return (
    <span
      title={footer.text}
      className="text-muted-foreground mb-[3px] flex min-w-0 items-center gap-1.5 text-xs leading-4 @max-[11rem]/stat:hidden"
    >
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
    <div role="img" aria-label={label} className={cn(MINI, "flex h-1.5 gap-[2px]")}>
      {live.length === 0 ? (
        <span className="bg-foreground/10 h-full flex-1 rounded-full" />
      ) : (
        live.map((s) => (
          <span
            key={s.label}
            title={s.label}
            className={cn("h-full min-w-1 basis-0 rounded-full", TONE_SOLID[s.tone])}
            style={{ flexGrow: s.percent }}
          />
        ))
      )}
    </div>
  );
}

const DAY_BAR_MAX = 20;

/**
 * A bar per day, today first; an empty day keeps a short stub, today's a
 * shade darker. The day and its count are in each bar's tooltip.
 */
function DayBars({ days, tone, label }: { days: StatDay[]; tone: Tone; label: string }) {
  const most = Math.max(1, ...days.map((d) => d.count));
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(MINI, "grid h-5 grid-cols-7 items-end gap-[3px]")}
    >
      {days.map((d) => (
        <span
          key={d.key}
          title={d.title}
          className={cn(
            "w-full rounded-[2px]",
            d.count > 0
              ? TONE_SOLID[tone]
              : d.today
                ? "bg-foreground/30"
                : "bg-foreground/15"
          )}
          style={{
            height: d.count > 0 ? Math.max(6, Math.round((d.count / most) * DAY_BAR_MAX)) : 3,
          }}
        />
      ))}
    </div>
  );
}
