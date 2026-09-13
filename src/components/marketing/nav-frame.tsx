"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The strip the public nav sits in. At the top of the page it is flat and
 * transparent, aligned with the content; once the visitor scrolls it
 * condenses into a floating pill with a blurred backdrop. The outer strip
 * keeps one height in both states so the page never reflows, and it ignores
 * the pointer so the gutters beside the pill stay clickable.
 */
export function NavFrame({ children }: { children: React.ReactNode }) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const update = () => setCondensed(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="pointer-events-none sticky top-0 z-30 h-16">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex items-center justify-between border transition-[max-width,height,margin,padding,background-color,box-shadow,border-radius,border-color] duration-300 ease-out",
          condensed
            ? "border-border/60 bg-background/80 mx-3 mt-2 h-12 max-w-5xl rounded-full pr-2 pl-4 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.3)] backdrop-blur-md xl:mx-auto"
            : "h-16 max-w-6xl border-transparent px-4"
        )}
      >
        {children}
      </div>
    </header>
  );
}
