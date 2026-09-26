"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The strip the public nav sits in. At the top of the page it is a
 * transparent bar; once the visitor scrolls it turns into a floating pill
 * with a blurred backdrop, and on wide screens draws in a little.
 *
 * The pill's geometry never changes between the two states: only colour,
 * border, shadow and (from xl) max-width animate. Where the browser has
 * scroll timelines, `.nav-frame` in globals.css drives the surface from the
 * scroll position itself, so it condenses even if scroll events never reach
 * the page (iOS Safari after a slow load); this state is the fallback. Height, margin, padding
 * or radius transitions on a blurred element are what Safari renders as a
 * juddering header. The outer strip keeps one height so the page never
 * reflows, and it ignores the pointer so the gutters beside the pill stay
 * clickable. The two thresholds keep it from flickering when the page
 * rests near the switch-over point.
 */
export function NavFrame({ children }: { children: React.ReactNode }) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    // Browsers already deliver scroll events once per frame, and React drops
    // a state update that changes nothing, so there is nothing to throttle.
    const update = () => {
      const y = window.scrollY;
      setCondensed((current) => (current ? y > 8 : y > 32));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="pointer-events-none sticky top-0 z-30 h-16">
      <div
        className={cn(
          "nav-frame pointer-events-auto mx-3 mt-2 flex h-12 max-w-6xl transform-gpu items-center justify-between rounded-full border pl-4 pr-2 transition-[background-color,border-color,box-shadow,max-width] duration-300 ease-out xl:mx-auto",
          condensed
            ? "border-border/60 bg-background/95 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.3)] backdrop-blur-md xl:max-w-5xl"
            : "border-transparent bg-transparent shadow-none"
        )}
      >
        {children}
      </div>
    </header>
  );
}
