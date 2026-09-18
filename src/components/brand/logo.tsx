import { cn } from "@/lib/utils";
import {
  WING_PATHS,
  WING_VIEWBOX,
  WORDMARK_PATHS,
  WORDMARK_VIEWBOX,
} from "@/lib/brand-mark";

/**
 * The freestanding 1A wing inherits the theme's foreground in either mode.
 * Decorative by default: the wordmark (or adjacent text) carries the name.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={WING_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={cn("text-foreground size-7 shrink-0 fill-current", className)}
    >
      {WING_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** Outlined lettering keeps the approved wordmark identical in every context. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-foreground inline-flex shrink-0", className)}>
      <svg
        viewBox={WORDMARK_VIEWBOX}
        role="img"
        aria-label="LeadWing"
        focusable="false"
        className="h-[1.25em] w-auto fill-current"
      >
        {WORDMARK_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
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
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <LogoMark className={markClassName} />
      <Wordmark className={wordmarkClassName} />
    </span>
  );
}
