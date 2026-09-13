import { cn } from "@/lib/utils";

/**
 * The small label above a marketing heading: tracked-out capitals in the
 * brand colour, as text rather than a pill. Pass a colour class to recolour
 * it on a dark surface. Badge stays for real statuses ("Coming soon").
 */
export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-primary text-xs font-medium tracking-[0.12em] uppercase",
        className
      )}
      {...props}
    />
  );
}
