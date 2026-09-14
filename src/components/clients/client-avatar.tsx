import { initialsOf } from "@/lib/home";
import type { ClientSide } from "@/lib/crm";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-12 text-base",
} as const;

/**
 * Initials on a tinted disc: brand tint for buyers, teal for sellers, so a
 * mixed list tells the two apart before a word is read. Decorative; the name
 * next to it carries the accessible label.
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
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ring-1 ring-black/[0.06] select-none ring-inset dark:ring-white/10",
        SIZES[size],
        side === "seller"
          ? "bg-teal-500/12 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200"
          : "bg-primary/12 text-primary",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
