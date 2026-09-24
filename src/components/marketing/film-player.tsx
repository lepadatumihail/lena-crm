"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

type Cut = { src: string; poster: string; aspect: string };

/**
 * One cut of the 30-second film. It plays muted and looping only while at
 * least half of it is on screen, so it costs nothing until it is seen and
 * never plays behind the reader's back. With reduced motion it stays on the
 * poster with the native controls. The sound button unmutes (and starts it).
 */
function Clip({
  cut,
  label,
  soundOn,
  soundOff,
  className,
}: {
  cut: Cut;
  label: string;
  soundOn: string;
  soundOff: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const still = useReducedMotion() === true;

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    if (still) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => null);
        else video.pause();
      },
      { threshold: 0.5 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [still]);

  function toggleSound() {
    const video = ref.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) void video.play().catch(() => null);
  }

  return (
    <div
      className={cn("bg-card ring-foreground/10 relative overflow-hidden rounded-2xl shadow-[0_30px_70px_-30px_rgb(0_0_0/0.35)] ring-1", className)}
      style={{ aspectRatio: cut.aspect }}
    >
      <video
        ref={ref}
        src={cut.src}
        poster={cut.poster}
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

/** The 4:5 cut on phones, the 16:9 cut from `sm` up; only the visible one ever loads. */
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
  return (
    <div className={className}>
      <Clip
        cut={{ src: "/video/leadwing-film-4x5.mp4", poster: "/video/leadwing-film-4x5.jpg", aspect: "4 / 5" }}
        label={label}
        soundOn={soundOn}
        soundOff={soundOff}
        className="mx-auto max-w-md sm:hidden"
      />
      <Clip
        cut={{ src: "/video/leadwing-film-16x9.mp4", poster: "/video/leadwing-film-16x9.jpg", aspect: "16 / 9" }}
        label={label}
        soundOn={soundOn}
        soundOff={soundOff}
        className="hidden sm:block"
      />
    </div>
  );
}
