import type { ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { TONE_BG, TONE_BORDER, TONE_INK, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

const ICONS: Record<Tone, LucideIcon> = {
  neutral: Info,
  brand: Info,
  green: CircleCheck,
  amber: TriangleAlert,
  red: CircleAlert,
  sand: Info,
  apricot: Info,
  clay: Info,
  terracotta: Info,
};

/**
 * A sentence the page needs read: a confirmation, a heads-up, a failure.
 * The tone tints the box and the icon; the text stays in the page's ink so
 * a long message reads easily. The icon carries the meaning too, so colour
 * is never the only cue.
 */
export function Notice({
  tone = "neutral",
  icon,
  className,
  children,
}: {
  tone?: Tone;
  /** Replace the tone's icon, or `null` for none. */
  icon?: LucideIcon | null;
  className?: string;
  children: ReactNode;
}) {
  const Icon = icon === undefined ? ICONS[tone] : icon;
  const urgent = tone === "red" || tone === "amber";
  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
        TONE_BORDER[tone],
        TONE_BG[tone],
        className
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden
          className={cn("mt-0.5 size-4 shrink-0", TONE_INK[tone])}
          strokeWidth={1.75}
        />
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
