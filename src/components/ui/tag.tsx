import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { TONE_SOLID, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

/*
  A tinted pill: pale fill, hairline border in the same hue, readable text.
  Regular weight at 13px so a row of them reads as data, not as buttons.
*/
const tagVariants = cva(
  "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full border px-2 text-[13px] leading-none whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-foreground/75",
        blue: "border-blue-500/25 bg-blue-500/10 text-blue-800 dark:border-blue-300/20 dark:bg-blue-400/15 dark:text-blue-200",
        purple:
          "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:border-violet-300/20 dark:bg-violet-400/15 dark:text-violet-200",
        teal: "border-teal-500/25 bg-teal-500/10 text-teal-800 dark:border-teal-300/20 dark:bg-teal-400/15 dark:text-teal-200",
        green:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/15 dark:text-emerald-200",
        amber:
          "border-amber-500/30 bg-amber-500/12 text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/15 dark:text-amber-200",
        orange:
          "border-orange-500/30 bg-orange-500/12 text-orange-900 dark:border-orange-300/20 dark:bg-orange-400/15 dark:text-orange-200",
        red: "border-red-500/25 bg-red-500/10 text-red-800 dark:border-red-300/20 dark:bg-red-400/15 dark:text-red-200",
        brand: "border-primary/25 bg-primary/10 text-primary",
      } satisfies Record<Tone, string>,
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

function Tag({
  className,
  tone,
  dot = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof tagVariants> & {
    /** A solid dot in the tone's hue before the label. */
    dot?: boolean;
  }) {
  return (
    <span
      data-slot="tag"
      className={cn(tagVariants({ tone }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", TONE_SOLID[tone ?? "neutral"])}
        />
      ) : null}
      {children}
    </span>
  );
}

export { Tag, tagVariants };
