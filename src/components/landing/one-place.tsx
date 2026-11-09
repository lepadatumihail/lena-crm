"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Bell, CalendarClock, FileText, Home, MessageCircle } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { Tag } from "@/components/ui/tag";
import { sideLabel, stageLabel } from "@/i18n/labels";
import { cn } from "@/lib/utils";
import { useRevealFloor } from "@/hooks/use-reveal-floor";
import { STAGE_TONES } from "@/lib/crm";

/*
 * "One place" — the consolidation pitch as a loop. A client card sits on the
 * stage the whole time and starts empty: five dashed rows. The five apps an
 * agent juggles today fly into it one by one, and each fills its own row:
 * WhatsApp the phone, Notes the budget, Calendar the viewing, Reminders the
 * follow-up, Drive the documents. Each leaves a dashed outline where it
 * stood, so by the end the two sides have traded places. The full card
 * holds, then the loop rewinds.
 *
 * Nothing on the stage changes size, empty or full, so the section never
 * moves the page. Rest positions live in static anchors and the rows' icon
 * slots never transform, so every flight is measured from real layout: a row
 * of apps above the card on phones, a loose cloud beside it from md up.
 */

type AppKey = "whatsapp" | "notes" | "calendar" | "reminders" | "drive";
type RowKey = "phone" | "budget" | "viewing" | "followUp" | "docs";

type App = {
  key: AppKey;
  /** The card row this app fills. */
  row: RowKey;
  /** The row's icon once filled: the app's own thin grey icon, as in LeadWing. */
  Icon: typeof MessageCircle;
  /** Rest position in the md+ cloud, as a percentage of the cloud box. */
  left: string;
  top: string;
  rotate: number;
  /** Width of the placeholder bar while the row is empty. */
  skeleton: string;
};

// In row order, top to bottom, and stacked the same way in the cloud so the
// flights run side by side instead of crossing.
const APPS: readonly App[] = [
  { key: "whatsapp", row: "phone", Icon: MessageCircle, left: "14%", top: "0%", rotate: -8, skeleton: "70%" },
  { key: "notes", row: "budget", Icon: Home, left: "58%", top: "13%", rotate: 6, skeleton: "86%" },
  { key: "calendar", row: "viewing", Icon: CalendarClock, left: "24%", top: "39%", rotate: -4, skeleton: "80%" },
  { key: "reminders", row: "followUp", Icon: Bell, left: "68%", top: "55%", rotate: 5, skeleton: "52%" },
  { key: "drive", row: "docs", Icon: FileText, left: "34%", top: "79%", rotate: -6, skeleton: "62%" },
];

const N = APPS.length;
const STEP_MS = 380;
const REST_STEPS = 3; // a beat on the empty card before the first app moves
const LAUNCH_GAP = 2; // steps between one app leaving and the next
const launchStep = (i: number) => REST_STEPS + i * LAUNCH_GAP;
const FULL_STEP = launchStep(N - 1) + 2; // the last row has landed
const TOTAL_STEPS = FULL_STEP + 8; // hold on the full card, then rewind

/** Seconds from an app leaving its spot to landing in its row. */
const FLIGHT_S = 0.6;
/** A row fills as its app lands, a hair before the tile has fully faded. */
const LAND_S = FLIGHT_S - 0.06;

/* ------------------------------------------------------------------ */
/* App tiles — stylised, recognisable, no trademark artwork            */
/* ------------------------------------------------------------------ */

function Tile({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center overflow-hidden rounded-[22%] shadow-md ring-1 ring-black/5 sm:size-12 dark:ring-white/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

function WhatsAppTile() {
  return (
    <Tile className="bg-[#25D366] text-white">
      <MessageCircle className="size-5 sm:size-6" strokeWidth={2.25} />
    </Tile>
  );
}

function NotesTile() {
  return (
    <Tile className="flex-col items-stretch bg-[#fff6c2]">
      <div className="h-[24%] w-full bg-[#f5c400]" />
      <div className="flex flex-1 flex-col justify-center gap-[3px] px-2">
        <span className="h-px w-full bg-[#c7b56a]/70" />
        <span className="h-px w-3/4 bg-[#c7b56a]/70" />
        <span className="h-px w-full bg-[#c7b56a]/70" />
      </div>
    </Tile>
  );
}

function CalendarTile() {
  return (
    <Tile className="text-inverted flex-col items-stretch bg-white">
      <div className="bg-[#FF3B30] py-[1px] text-center text-[6px] font-medium tracking-wide text-white uppercase sm:text-[7px]">
        Thu
      </div>
      <div className="flex flex-1 items-center justify-center text-base leading-none font-medium tabular-nums sm:text-lg">
        14
      </div>
    </Tile>
  );
}

function RemindersTile() {
  return (
    <Tile className="flex-col items-stretch justify-center gap-[3px] bg-white px-2 sm:gap-1">
      {(["#FF3B30", "#FF9500", "#007AFF"] as const).map((c) => (
        <span key={c} className="flex items-center gap-1">
          <span
            className="size-[5px] shrink-0 rounded-full sm:size-1.5"
            style={{ backgroundColor: c }}
          />
          <span className="bg-inverted/20 h-px flex-1" />
        </span>
      ))}
    </Tile>
  );
}

function DriveTile() {
  return (
    <Tile className="bg-white">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={4}
        strokeLinejoin="round"
        className="size-5 sm:size-6"
      >
        <path d="M3.5 18.5H20.5" stroke="#4285F4" />
        <path d="M12 3.5L3.5 18.5" stroke="#1FA463" />
        <path d="M12 3.5L20.5 18.5" stroke="#FFBA00" />
      </svg>
    </Tile>
  );
}

const TILES: Record<AppKey, () => ReactNode> = {
  whatsapp: WhatsAppTile,
  notes: NotesTile,
  calendar: CalendarTile,
  reminders: RemindersTile,
  drive: DriveTile,
};

/* ------------------------------------------------------------------ */
/* The card                                                            */
/* ------------------------------------------------------------------ */

/**
 * One row of the card. Empty, it is a dashed slot and a grey bar; when its
 * app lands, the slot becomes the row's icon, the line of detail slides in
 * and a pale indigo flash marks the spot. Emptying, as the loop rewinds, is
 * quick and quiet. Every part is absolutely placed inside a fixed-height row.
 */
function CardRow({
  app,
  filled,
  reduced,
  slotRef,
}: {
  app: App;
  filled: boolean;
  reduced: boolean;
  slotRef: (el: HTMLSpanElement | null) => void;
}) {
  const t = useTranslations("landing.onePlace.card");
  const { Icon } = app;
  const instant = { duration: 0 } as const;
  const empty = reduced ? instant : ({ duration: 0.2 } as const);

  return (
    <li className="relative flex h-9 items-center gap-2.5 px-1.5">
      <motion.span
        className="bg-tone-indigo-soft absolute inset-0 rounded-lg"
        initial={false}
        animate={{ opacity: filled && !reduced ? [0, 1, 0] : 0 }}
        transition={
          filled && !reduced
            ? { duration: 1.2, times: [0, 0.18, 1], delay: LAND_S }
            : instant
        }
      />
      <span ref={slotRef} className="relative size-7 shrink-0">
        <motion.span
          className="border-foreground/15 absolute inset-0 rounded-lg border border-dashed"
          initial={false}
          animate={{ opacity: filled ? 0 : 1 }}
          transition={filled ? (reduced ? instant : { duration: 0.1, delay: LAND_S }) : empty}
        />
        <motion.span
          className="bg-muted text-muted-foreground absolute inset-0 flex items-center justify-center rounded-lg"
          initial={false}
          animate={filled ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={
            filled
              ? reduced
                ? instant
                : {
                    opacity: { duration: 0.1, delay: LAND_S },
                    scale: { type: "spring", stiffness: 520, damping: 17, delay: LAND_S },
                  }
              : empty
          }
        >
          <Icon className="size-3.5" />
        </motion.span>
      </span>
      <span className="relative h-5 min-w-0 flex-1">
        <motion.span
          className="bg-foreground/[0.07] absolute top-1.5 left-0 h-2 rounded-full"
          style={{ width: app.skeleton }}
          initial={false}
          animate={{ opacity: filled ? 0 : 1 }}
          transition={filled ? (reduced ? instant : { duration: 0.15, delay: LAND_S }) : empty}
        />
        <motion.span
          className="absolute inset-0 truncate text-xs leading-5 sm:text-[13px]"
          initial={false}
          animate={filled ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
          transition={
            filled
              ? reduced
                ? instant
                : { type: "spring", stiffness: 320, damping: 28, delay: LAND_S + 0.04 }
              : empty
          }
        >
          {t(app.row)}
        </motion.span>
      </span>
    </li>
  );
}

function ClientCard({
  filled,
  full,
  reduced,
  slots,
}: {
  filled: (i: number) => boolean;
  full: boolean;
  reduced: boolean;
  slots: RefObject<(HTMLSpanElement | null)[]>;
}) {
  const t = useTranslations("landing.onePlace.card");
  const tCrm = useTranslations("crm");

  return (
    <div className="bg-card relative w-full rounded-2xl border p-4 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.3)]">
      <div className="flex items-center gap-3">
        <ClientAvatar name="Sofia Müller" side="buyer" size="row" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Sofia Müller</p>
          <p className="text-muted-foreground truncate text-xs">
            🇩🇪 {t("language")} · {sideLabel(tCrm, "buyer")}
          </p>
        </div>
        <Tag tone={STAGE_TONES.viewing} className="shrink-0">
          {stageLabel(tCrm, "viewing")}
        </Tag>
      </div>

      <ul className="mt-3 space-y-0.5 border-t pt-2.5">
        {APPS.map((app, i) => (
          <CardRow
            key={app.key}
            app={app}
            filled={filled(i)}
            reduced={reduced}
            slotRef={(el) => {
              slots.current[i] = el;
            }}
          />
        ))}
      </ul>

      <div className="mt-2.5 h-8 border-t pt-2.5">
        <motion.p
          className="text-muted-foreground flex items-center gap-1.5 text-xs"
          initial={false}
          animate={full ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
          transition={reduced ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <LogoMark className="size-4" /> {t("footer")}
        </motion.p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Geometry — one curve per app, from its spot to its row              */
/* ------------------------------------------------------------------ */

type Point = { x: number; y: number };

/** Quadratic curve from a tile's rest centre to its row's icon slot, as offsets. */
type Curve = { dx: number; dy: number; cx: number; cy: number };
type Flight = { curve: Curve; /** Tile size to slot size. */ scale: number };

function curveFor(from: Point, to: Point, index: number): Curve {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  // Bow each path sideways, alternating, so neighbouring flights fan apart.
  const amp = Math.min(48, len * 0.16) * (index % 2 ? -1 : 1);
  return {
    dx,
    dy,
    cx: dx / 2 + (-dy / len) * amp,
    cy: dy / 2 + (dx / len) * amp,
  };
}

const SAMPLES = 12;
const TIMES = Array.from({ length: SAMPLES + 1 }, (_, i) => i / SAMPLES);
// Lift off gently and settle into the slot: distance follows an in-out curve.
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const PROGRESS = TIMES.map(easeInOutCubic);

function bezier(p: number, c: number, end: number): number {
  return 2 * (1 - p) * p * c + p * p * end;
}

function flightKeyframes(curve: Curve) {
  return {
    x: PROGRESS.map((p) => bezier(p, curve.cx, curve.dx)),
    y: PROGRESS.map((p) => bezier(p, curve.cy, curve.dy)),
  };
}

const REST = { x: 0, y: 0 };
const SNAP = { duration: 0 } as const;
const FLIGHT_XY = { duration: FLIGHT_S, times: TIMES, ease: "linear" } as const;

/* ------------------------------------------------------------------ */
/* The stage                                                           */
/* ------------------------------------------------------------------ */

export function OnePlace() {
  const t = useTranslations("landing.onePlace");
  const reduced = useReducedMotion() ?? false;

  const stageRef = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLDivElement | null)[]>([]);
  const slots = useRef<(HTMLSpanElement | null)[]>([]);
  const [flights, setFlights] = useState<Flight[] | null>(null);

  const inView = useInView(stageRef, { margin: "0px 0px -15% 0px" });
  // The floor starts the loop even where the observer never fires (see the hook).
  const floor = useRevealFloor();
  const active = (inView || floor) && !reduced;

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setStep((s) => (s + 1) % TOTAL_STEPS),
      STEP_MS,
    );
    return () => clearInterval(id);
  }, [active]);

  // Tile centres and slot centres, in the stage's own pixel space.
  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = stage.getBoundingClientRect();
    const ox = s.left + stage.clientLeft;
    const oy = s.top + stage.clientTop;
    const box = (el: Element | null | undefined) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - ox, y: r.top + r.height / 2 - oy, w: r.width };
    };
    const next: Flight[] = [];
    for (let i = 0; i < N; i++) {
      const from = box(anchors.current[i]);
      const to = box(slots.current[i]);
      if (!from || !to || !from.w) return;
      next.push({ curve: curveFor(from, to, i), scale: to.w / from.w });
    }
    setFlights(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [measure]);

  // Reduced motion rests on the composed frame: the apps in place, the card full.
  const launched = (i: number) => !reduced && step >= launchStep(i);
  const filled = (i: number) => reduced || step >= launchStep(i);
  const full = reduced || step >= FULL_STEP;

  return (
    <>
      <p className="sr-only">{t("srSummary")}</p>

      <div
        ref={stageRef}
        aria-hidden
        className="bg-muted/30 relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border px-3 py-7 sm:px-10 sm:py-10"
      >
        <div className="grid items-center justify-items-center gap-7 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-12">
          {/* The apps: a row above the card on phones, a loose cloud beside it
              from md up. Above the card in paint order, so they fly over it. */}
          <div className="relative z-10 flex w-full max-w-80 items-center justify-between px-2 md:block md:h-64 md:max-w-none md:px-0">
            {APPS.map((app, i) => {
              const Tile = TILES[app.key];
              const gone = launched(i);
              const flight = flights?.[i];
              const path = flight ? flightKeyframes(flight.curve) : REST;
              return (
                <div
                  key={app.key}
                  ref={(el) => {
                    anchors.current[i] = el;
                  }}
                  className="relative md:absolute md:top-(--top) md:left-(--left)"
                  style={{ "--left": app.left, "--top": app.top } as CSSProperties}
                >
                  {/* The spot it left: dashed, like the card's empty rows, so
                      the two sides trade places and the stage never looks bare. */}
                  <motion.div
                    className="border-foreground/15 absolute inset-0 rounded-[22%] border border-dashed"
                    style={{ rotate: app.rotate }}
                    initial={false}
                    animate={{ opacity: gone ? 1 : 0 }}
                    transition={gone ? { duration: 0.3, delay: 0.2 } : { duration: 0.15 }}
                  />
                  {/* afterimage, behind the tile */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 blur-[1px]"
                    initial={false}
                    animate={
                      gone
                        ? { ...path, rotate: 0, scale: flight?.scale ?? 0.6, opacity: [0.4, 0.4, 0] }
                        : { ...REST, rotate: app.rotate, scale: 1, opacity: 0 }
                    }
                    transition={
                      gone
                        ? {
                            x: { ...FLIGHT_XY, delay: 0.06 },
                            y: { ...FLIGHT_XY, delay: 0.06 },
                            rotate: { duration: FLIGHT_S, delay: 0.06 },
                            scale: { duration: FLIGHT_S, ease: "easeInOut", delay: 0.06 },
                            opacity: { duration: FLIGHT_S, times: [0, 0.6, 1], delay: 0.06 },
                          }
                        : SNAP
                    }
                  >
                    <Tile />
                  </motion.div>

                  <motion.div
                    className="relative"
                    initial={false}
                    animate={
                      gone
                        ? { ...path, scale: flight?.scale ?? 0.6, opacity: 0 }
                        : { ...REST, scale: 1, opacity: 1 }
                    }
                    transition={
                      gone
                        ? {
                            x: FLIGHT_XY,
                            y: FLIGHT_XY,
                            scale: { duration: FLIGHT_S, ease: "easeInOut" },
                            opacity: { duration: 0.12, delay: FLIGHT_S - 0.1 },
                          }
                        : {
                            x: SNAP,
                            y: SNAP,
                            scale: { type: "spring", stiffness: 260, damping: 20, delay: i * 0.06 },
                            opacity: { duration: 0.3, delay: i * 0.06 },
                          }
                    }
                  >
                    {/* Drifts at rest; straightens on the way to its square slot. */}
                    <motion.div
                      initial={false}
                      animate={
                        gone
                          ? { y: 0, rotate: 0 }
                          : { y: reduced ? 0 : [0, -5, 0], rotate: app.rotate }
                      }
                      transition={
                        gone
                          ? { duration: FLIGHT_S * 0.8, ease: "easeOut" }
                          : {
                              y: { duration: 3.2 + i * 0.35, repeat: Infinity, ease: "easeInOut" },
                              rotate: SNAP,
                            }
                      }
                    >
                      <Tile />
                    </motion.div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-80">
            <ClientCard filled={filled} full={full} reduced={reduced} slots={slots} />
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-sm text-balance">
        {t("caption")}
      </p>
    </>
  );
}
