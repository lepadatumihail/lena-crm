import { cn } from "@/lib/utils";

/**
 * Fade-and-rise as a block scrolls into view, done in CSS with a view
 * timeline (`.reveal` in globals.css). Nothing here depends on JavaScript,
 * scroll events or IntersectionObserver: the content is visible in the
 * server HTML, browsers without scroll-driven animations show it plainly,
 * and iOS Safari, which can stop delivering scroll updates to the page after
 * a slow load, still animates it on the compositor.
 *
 * `delay` is accepted for call-site compatibility and has no effect: a view
 * timeline is driven by position, not time.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={cn("reveal", className)}>{children}</div>;
}
