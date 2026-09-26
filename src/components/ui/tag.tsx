import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { TONE_TAG, tagDotClass } from "@/lib/tones";
import { cn } from "@/lib/utils";

/*
  A status pill, Structurely-style: a pale fill with dark text of the same
  hue, or an outline for neutral. 12px medium, so a row of them reads as
  data, not as buttons. This is the app's only pill; its colours come from
  lib/tones.ts.
*/
const tagVariants = cva(
  "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs leading-none font-medium whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: { tone: TONE_TAG },
    defaultVariants: { tone: "neutral" },
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
          className={cn("size-1.5 rounded-full", tagDotClass(tone ?? "neutral"))}
        />
      ) : null}
      {children}
    </span>
  );
}

export { Tag, tagVariants };
