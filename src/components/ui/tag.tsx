import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import {
  TONE_BG,
  TONE_BORDER,
  TONE_INK,
  TONES,
  tagDotClass,
  type Tone,
} from "@/lib/tones";
import { cn } from "@/lib/utils";

const TONE_TAG = Object.fromEntries(
  TONES.map((tone) => [tone, `${TONE_BORDER[tone]} ${TONE_BG[tone]} ${TONE_INK[tone]}`])
) as Record<Tone, string>;

/*
  A tinted pill: pale fill, hairline border in the same hue, readable text.
  Regular weight at 13px so a row of them reads as data, not as buttons.
  This is the app's only pill; its colours come from lib/tones.ts.
*/
const tagVariants = cva(
  "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full border px-2 text-[13px] leading-none whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
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
