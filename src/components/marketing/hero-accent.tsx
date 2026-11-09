import { cn } from "@/lib/utils";

/**
 * The second beat of a hero headline ("Know what to say.", "spreadsheet?"):
 * the same face in the stage's ink at a lower strength, so it reads as a
 * quieter answer to the first line without a colour of its own. Upright,
 * because Sora has no italic and a browser-slanted one looks cheap. About
 * 4.5:1 on the grey stage by day and on the dark stage at night. Shared by the
 * home page and the ad landings so the two cannot drift apart.
 */
export function HeroAccent({
  className,
  ...props
}: React.ComponentProps<"em">) {
  return <em className={cn("text-stage-foreground/60 not-italic", className)} {...props} />;
}
