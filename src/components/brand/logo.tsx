import { cn } from "@/lib/utils";
import { WING_PATHS, WING_VIEWBOX } from "@/lib/brand-mark";

/**
 * The wing mark on its rounded terracotta tile. Colours come from the theme
 * tokens so it holds up in light and dark mode. Decorative by default: the
 * wordmark (or adjacent text) carries the accessible name.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={WING_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="512" height="512" rx="112" className="fill-primary" />
      <g className="fill-primary-foreground">
        {WING_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** "LeadWing" with the second half in the brand colour. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      Lead<span className="text-primary">Wing</span>
    </span>
  );
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <Wordmark className={wordmarkClassName} />
    </span>
  );
}
