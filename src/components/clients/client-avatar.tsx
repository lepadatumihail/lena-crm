import { initialsOf } from "@/lib/home";
import type { ClientSide } from "@/lib/crm";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  /** Home's client rows: big enough for the gradient to read. */
  row: "size-10 text-[13px]",
  lg: "size-12 text-base",
  xl: "size-16 text-xl",
} as const;

/**
 * Initials on a soft indigo-to-teal disc, the brand's two hues, the same for
 * every client at every size: Home, the lists, the board, search, the quick
 * view and the client page. Decorative; the name next to it carries the
 * accessible label. `side` stays in the props so callers needn't change if
 * the sides ever get colours of their own again.
 */
export function ClientAvatar({
  name,
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
        "text-tone-indigo-ink inline-flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,var(--tone-indigo-soft),var(--tone-teal-soft))] font-medium uppercase ring-1 ring-foreground/[0.06] select-none ring-inset dark:ring-foreground/10",
        SIZES[size],
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
