"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { WhatsAppLink } from "./tracking";

/**
 * On a phone the form sits at the end of the page, so once the hero's button
 * has scrolled away a bar keeps it one tap away; it steps aside while the
 * form itself is on screen. Hidden from lg up, where the form is always in
 * view beside the profile. Watched with IntersectionObserver, never a scroll
 * listener.
 */
export function StickyCta({
  label,
  whatsappHref,
}: {
  label: string;
  whatsappHref: string | null;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("agent-hero-cta");
    const form = document.getElementById("enquiry");
    if (!hero || !form) return;
    const seen = new Map<Element, boolean>([
      [hero, true],
      [form, false],
    ]);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
      setShow(!seen.get(hero) && !seen.get(form));
    });
    observer.observe(hero);
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
        "transition-[translate,opacity] duration-300 ease-(--ease-out-quint) motion-reduce:transition-none",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+1rem)] opacity-0"
      )}
    >
      <div className="bg-background/85 mx-auto flex max-w-md items-center gap-2 rounded-full p-1.5 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.06] backdrop-blur-xl dark:ring-white/10">
        <a
          href="#enquiry"
          className="bg-primary text-primary-foreground flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium transition-[scale] duration-150 select-none active:scale-[0.96]"
        >
          {label}
        </a>
        {whatsappHref ? (
          <WhatsAppLink
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            aria-label="WhatsApp"
            className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-full transition-[scale] duration-150 select-none active:scale-[0.96]"
          >
            <MessageCircle className="size-5" strokeWidth={1.75} />
          </WhatsAppLink>
        ) : null}
      </div>
    </div>
  );
}
