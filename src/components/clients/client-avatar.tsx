import { initialsOf } from "@/lib/home";
import { SIDE_TONES, type ClientSide } from "@/lib/crm";
import { TONE_BG, TONE_INK } from "@/lib/tones";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-12 text-base",
  xl: "size-16 text-xl",
} as const;

/**
 * Initials on a neutral disc in the side's tone. Decorative; the name next to
 * it carries the accessible label.
 */
export function ClientAvatar({
  name,
  side,
  size = "sm",
  className,
}: {
  name: string;
  side: ClientSide | string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const tone = SIDE_TONES[side as ClientSide] ?? SIDE_TONES.buyer;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium uppercase ring-1 ring-foreground/[0.06] select-none ring-inset dark:ring-foreground/10",
        SIZES[size],
        TONE_BG[tone],
        TONE_INK[tone],
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
