"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Tailwind's `sm`: from here up the frame is 16:9 and plays the wide cut, below it 4:5. */
const WIDE = "(min-width: 40rem)";

type Cut = { src: string; poster: string };
type Cuts = { wide: Cut; tall: Cut };

/** The film's on-screen words follow the page: one pair of cuts per language. */
const CUTS: Record<AppLocale, Cuts> = {
  en: {
    wide: { src: "/video/leadwing-film-16x9.mp4", poster: "/video/leadwing-film-16x9.webp" },
    tall: { src: "/video/leadwing-film-4x5.mp4", poster: "/video/leadwing-film-4x5.webp" },
  },
  es: {
    wide: { src: "/video/leadwing-film-es-16x9.mp4", poster: "/video/leadwing-film-es-16x9.webp" },
    tall: { src: "/video/leadwing-film-es-4x5.mp4", poster: "/video/leadwing-film-es-4x5.webp" },
  },
};

/**
 * Points the video at the cut for its frame's shape. The poster loads right
 * away; with preload="none" the film itself waits for play().
 */
function loadCut(video: HTMLVideoElement, cuts: Cuts) {
  const cut = window.matchMedia(WIDE).matches ? cuts.wide : cuts.tall;
  if (video.getAttribute("src") === cut.src) return;
  const playing = !video.paused;
  video.poster = cut.poster;
  video.src = cut.src;
  if (playing) void video.play().catch(() => null);
}

/**
 * The 30-second film, built to cost nothing while the page loads: the server
 * HTML carries neither a video nor a poster URL. The poster arrives when the
 * frame is a screen away, and the film plays muted and looping only while at
 * least half of it is on screen, so it never plays behind the reader's back.
 * With reduced motion it stays on the poster with the native controls. The
 * sound button unmutes (and starts it). The cut is the page's language.
 */
export function FilmPlayer({
  label,
  soundOn,
  soundOff,
  className,
}: {
  label: string;
  soundOn: string;
  soundOff: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const still = useReducedMotion() === true;
  const cuts = CUTS[useLocale()];

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadCut(video, cuts);
      },
      { rootMargin: "100% 0px" }
    );
    near.observe(video);

    // A phone turned sideways swaps the frame's shape, so swap the cut too.
    const wide = window.matchMedia(WIDE);
    const reshape = () => {
      if (video.hasAttribute("src")) loadCut(video, cuts);
    };
    wide.addEventListener("change", reshape);

    const inView = still
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              loadCut(video, cuts);
              void video.play().catch(() => null);
            } else video.pause();
          },
          { threshold: 0.5 }
        );
    inView?.observe(video);

    return () => {
      near.disconnect();
      inView?.disconnect();
      wide.removeEventListener("change", reshape);
    };
  }, [still, cuts]);

  function toggleSound() {
    const video = ref.current;
    if (!video) return;
    loadCut(video, cuts);
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) void video.play().catch(() => null);
  }

  return (
    <div
      className={cn(
        "ring-foreground/10 relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-neutral-950 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.35)] ring-1 sm:aspect-video sm:max-w-none",
        className
      )}
    >
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        controls={still}
        aria-label={label}
        className="size-full object-cover"
      />
      {!still && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75"
        >
          {muted ? <VolumeX className="size-3.5" aria-hidden /> : <Volume2 className="size-3.5" aria-hidden />}
          {muted ? soundOn : soundOff}
        </button>
      )}
    </div>
  );
}
