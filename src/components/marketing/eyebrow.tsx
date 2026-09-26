import { cn } from "@/lib/utils";

/**
 * The small label above a marketing heading: tracked-out capitals in muted
 * grey, as text rather than a pill, so the headline under it leads. Pass a
 * colour class to recolour it on a dark surface. Badge stays for real
 * statuses ("Coming soon").
 */
export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-xs tracking-[0.12em] uppercase",
        className
      )}
      {...props}
    />
  );
}
