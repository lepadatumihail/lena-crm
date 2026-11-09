import { cn } from "@/lib/utils";

/**
 * The quieter beat of a hero headline: the same face in the stage's ink at a
 * lower strength, with no colour of its own. On the home page it is the
 * set-up ("Your buyers go quiet.") so the punchline after it lands in full
 * ink; on the ad landings it is the turn ("They go quiet.", "spreadsheet?").
 * Upright, because Sora has no italic and a browser-slanted one looks cheap. About
 * 4.5:1 on the grey stage by day and on the dark stage at night. Shared by the
 * home page and the ad landings so the two cannot drift apart.
 */
export function HeroAccent({
  className,
  ...props
}: React.ComponentProps<"em">) {
  return <em className={cn("text-stage-foreground/60 not-italic", className)} {...props} />;
}
