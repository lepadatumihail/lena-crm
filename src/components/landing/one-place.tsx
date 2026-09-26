"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Bell,
  CalendarClock,
  Check,
  FileText,
  Home,
  Mail,
  MessageCircle,
  Star,
  Table2,
} from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Tag } from "@/components/ui/tag";
import { sideLabel, stageLabel } from "@/i18n/labels";
import { cn } from "@/lib/utils";
import { useRevealFloor } from "@/hooks/use-reveal-floor";
import { STAGE_TONES } from "@/lib/crm";
import { TONE_BG, TONE_INK } from "@/lib/tones";

/*
 * "One place" — the consolidation pitch as a loop:
 *   the apps an agent juggles today drift on the left, get pulled one by one
 *   into the wing, and a single complete client card pops out on the right.
 *
 * Every icon's rest position lives in a static, never-transformed anchor, so
 * the flight vector to the wing is measured from real layout (mobile stacks
 * the three parts, desktop puts them side by side) instead of hand-tuned.
 */

type AppKey =
  "whatsapp" | "notes" | "calendar" | "reminders" | "drive" | "sheets" | "mail";

type App = { key: AppKey; left: string; top: string; rotate: number };

// Rest positions as a percentage of the cloud box, scattered on purpose.
const APPS: readonly App[] = [
  { key: "whatsapp", left: "0%", top: "8%", rotate: -8 },
  { key: "notes", left: "30%", top: "0%", rotate: 6 },
  { key: "calendar", left: "62%", top: "12%", rotate: -4 },
  { key: "reminders", left: "12%", top: "48%", rotate: 5 },
  { key: "drive", left: "44%", top: "40%", rotate: -6 },
  { key: "sheets", left: "78%", top: "52%", rotate: 8 },
  { key: "mail", left: "28%", top: "78%", rotate: -5 },
];

const N = APPS.length;
const STEP_MS = 380;
const REST_STEPS = 3; // icons drifting, card hidden
const CARD_STEP = REST_STEPS + N; // first step with every icon absorbed
const TOTAL_STEPS = CARD_STEP + 8; // hold on the finished card, then wrap

const POP_SPRING = { type: "spring", stiffness: 420, damping: 24 } as const;
// The card leaving the wing: fast out, settles without a wobble.
const OUT_SPRING = { type: "spring", stiffness: 170, damping: 24 } as const;
const BEAM = {
  pathLength: { duration: 0.45, ease: "easeOut" },
  opacity: { duration: 0.25 },
} as const;
/**
 * Card width in px (18rem) — the slot is measured, the card is not. 18rem is
 * the room the longest Spanish row needs ("Apartamento · 600–800 k€ · vistas
 * al mar", 231px at 12px) to show without an ellipsis.
 */
const CARD_W = 288;
// Silhouettes trailing the card out of the wing: [peak opacity, delay].
const CARD_GHOSTS: readonly [number, number][] = [
  [0.45, 0.07],
  [0.22, 0.14],
];

const cardRows: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const cardRow: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

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

function SheetsTile() {
  return (
    <Tile className="bg-[#1E8E3E] text-white">
      <Table2 className="size-5 sm:size-6" strokeWidth={2} />
    </Tile>
  );
}

function MailTile() {
  return (
    <Tile className="bg-white text-[#EA4335]">
      <Mail className="size-5 sm:size-6" strokeWidth={2.25} />
    </Tile>
  );
}

const TILES: Record<AppKey, () => ReactNode> = {
  whatsapp: WhatsAppTile,
  notes: NotesTile,
  calendar: CalendarTile,
  reminders: RemindersTile,
  drive: DriveTile,
  sheets: SheetsTile,
  mail: MailTile,
};

/* ------------------------------------------------------------------ */
/* The card that comes out                                             */
/* ------------------------------------------------------------------ */

// The card is LeadWing's own, so it is drawn like the app: thin grey icons,
// WhatsApp included.
const ROWS = [
  { key: "phone", Icon: MessageCircle, tone: "text-muted-foreground" },
  { key: "budget", Icon: Home, tone: "text-muted-foreground" },
  { key: "viewing", Icon: CalendarClock, tone: "text-muted-foreground" },
  { key: "followUp", Icon: Bell, tone: "text-muted-foreground" },
  { key: "docs", Icon: FileText, tone: "text-muted-foreground" },
] as const;

function ClientCard({
  reduced,
  from,
}: {
  reduced: boolean | null;
  /** Offset from the card's resting spot back to the wing centre. */
  from: Point;
}) {
  const t = useTranslations("landing.onePlace.card");
  const tCrm = useTranslations("crm");

  return (
    <motion.div
      initial={
        reduced ? false : { opacity: 0, scale: 0.25, x: from.x, y: from.y }
      }
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{
        x: OUT_SPRING,
        y: OUT_SPRING,
        scale: OUT_SPRING,
        opacity: { duration: 0.2 },
      }}
      className="bg-card relative w-[18rem] max-w-full rounded-2xl border p-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-medium",
            TONE_BG.neutral,
            TONE_INK.neutral
          )}
        >
          SM
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">Sofia Müller</p>
            <Star className="fill-foreground text-foreground size-3.5 shrink-0" />
          </div>
          <p className="text-muted-foreground truncate text-xs">
            🇩🇪 {t("language")} · {sideLabel(tCrm, "buyer")}
          </p>
        </div>
        <Tag tone={STAGE_TONES.viewing} className="shrink-0">
          {stageLabel(tCrm, "viewing")}
        </Tag>
      </div>

      <motion.ul
        variants={cardRows}
        initial={reduced ? false : "hidden"}
        animate="show"
        className="mt-3 space-y-2 border-t pt-3"
      >
        {ROWS.map(({ key, Icon, tone }) => (
          <motion.li
            key={key}
            variants={cardRow}
            className="flex items-center gap-2 text-xs"
          >
            <Icon className={cn("size-3.5 shrink-0", tone)} />
            <span className="truncate">{t(key)}</span>
          </motion.li>
        ))}
      </motion.ul>

      <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-[11px]">
        <Check className="text-foreground size-3.5" /> {t("footer")}
      </p>
    </motion.div>
  );
}

/**
 * The card plus its result trail: two blurred silhouettes that leave the wing
 * a beat later and fade as the card settles. The wrapper owns the exit so the
 * whole group leaves together when the loop wraps.
 */
function CardWithTrail({
  reduced,
  from,
}: {
  reduced: boolean | null;
  from: Point;
}) {
  return (
    <motion.div
      className="relative"
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.22 } }}
    >
      {!reduced &&
        CARD_GHOSTS.map(([peak, delay], k) => (
          <motion.div
            key={k}
            aria-hidden
            className="bg-card pointer-events-none absolute inset-0 rounded-2xl border shadow-lg blur-[2px]"
            initial={{ opacity: 0, scale: 0.25, x: from.x, y: from.y }}
            animate={{ opacity: [peak, peak, 0], scale: 1, x: 0, y: 0 }}
            transition={{
              x: { ...OUT_SPRING, delay },
              y: { ...OUT_SPRING, delay },
              scale: { ...OUT_SPRING, delay },
              opacity: { duration: 0.75, times: [0, 0.55, 1], delay },
            }}
          />
        ))}
      <ClientCard reduced={reduced} from={from} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Geometry — one curve per icon, shared by the guide and the flight    */
/* ------------------------------------------------------------------ */

type Point = { x: number; y: number };
type Geometry = {
  wing: Point;
  icons: Point[];
  /** Where the card settles, and the edge nearest the wing the beam lands on. */
  card: { rest: Point; edge: Point } | null;
};

/** Quadratic curve from an icon's rest centre into the wing, as offsets. */
type Curve = { dx: number; dy: number; cx: number; cy: number };

function curveFor(icon: Point, wing: Point, index: number): Curve {
  const dx = wing.x - icon.x;
  const dy = wing.y - icon.y;
  const len = Math.hypot(dx, dy) || 1;
  // Bow each path sideways, alternating, so the trails fan into the wing.
  const amp = Math.min(64, len * 0.2) * (index % 2 ? -1 : 1);
  return {
    dx,
    dy,
    cx: dx / 2 + (-dy / len) * amp,
    cy: dy / 2 + (dx / len) * amp,
  };
}

const SAMPLES = 10;
const T = Array.from({ length: SAMPLES + 1 }, (_, i) => i / SAMPLES);
// Distance fraction p is reached at time √p: the icon accelerates into the wing.
const TIMES = T.map(Math.sqrt);
const FLIGHT_S = 0.64;

function bezier(p: number, c: number, end: number): number {
  return 2 * (1 - p) * p * c + p * p * end;
}

function flightKeyframes(curve: Curve) {
  return {
    x: T.map((p) => bezier(p, curve.cx, curve.dx)),
    y: T.map((p) => bezier(p, curve.cy, curve.dy)),
  };
}

const REST = { x: 0, y: 0 };
const SNAP = { duration: 0 } as const;

// Afterimages behind a flying icon: [peak opacity, scale, delay in seconds].
const GHOSTS: readonly [number, number, number][] = [[0.45, 0.9, 0.05]];

/* ------------------------------------------------------------------ */
/* The stage                                                           */
/* ------------------------------------------------------------------ */

export function OnePlace() {
  const t = useTranslations("landing.onePlace");
  const reduced = useReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const wingRef = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLDivElement | null)[]>([]);
  const cardSlotRef = useRef<HTMLDivElement>(null);
  const [geom, setGeom] = useState<Geometry | null>(null);

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

  // Rest centres and the wing centre, in the stage's own pixel space.
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const wing = wingRef.current;
    if (!stage || !wing) return;
    const s = stage.getBoundingClientRect();
    const ox = s.left + stage.clientLeft;
    const oy = s.top + stage.clientTop;
    const centre = (el: Element): Point => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - ox, y: r.top + r.height / 2 - oy };
    };
    const wingAt = centre(wing);
    // The card is centred in its slot; on desktop the slot is right-aligned,
    // on phones it is full width. Below the wing means the stacked layout.
    let card: Geometry["card"] = null;
    const slot = cardSlotRef.current;
    if (slot) {
      const r = slot.getBoundingClientRect();
      const stacked = r.top - oy >= wingAt.y;
      const w = Math.min(CARD_W, r.width);
      const cy = r.top + r.height / 2 - oy;
      const rest = stacked
        ? { x: r.left + r.width / 2 - ox, y: cy }
        : { x: r.right - w / 2 - ox, y: cy };
      const edge = stacked
        ? { x: rest.x, y: r.top - oy + 6 }
        : { x: r.right - w - ox + 6, y: cy };
      card = { rest, edge };
    }
    setGeom({
      wing: wingAt,
      icons: APPS.map((_, i) => {
        const el = anchors.current[i];
        return el ? centre(el) : { x: 0, y: 0 };
      }),
      card,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [measure]);

  // Reduced motion rests on the fully composed frame: apps, wing and card.
  const absorbed = reduced
    ? 0
    : Math.max(0, Math.min(N, step - REST_STEPS + 1));
  const showCard = reduced ? true : step >= CARD_STEP;

  const curves = geom
    ? geom.icons.map((icon, i) => curveFor(icon, geom.wing, i))
    : null;

  return (
    <>
      <p className="sr-only">{t("srSummary")}</p>

      <div
        ref={stageRef}
        aria-hidden
        className="bg-muted/30 relative mx-auto mt-10 max-w-5xl overflow-hidden rounded-3xl border px-4 py-8 sm:px-8 sm:py-10"
      >
        {/* Dotted guides: every app has a channel that flows into the wing. */}
        {geom && curves && (
          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
            {curves.map((c, i) => {
              const o = geom.icons[i];
              const gone = i < absorbed;
              return (
                <motion.path
                  key={APPS[i].key}
                  d={`M ${o.x} ${o.y} Q ${o.x + c.cx} ${o.y + c.cy} ${geom.wing.x} ${geom.wing.y}`}
                  fill="none"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="2 6"
                  className="stroke-foreground animate-[dash-flow_1s_linear_infinite] motion-reduce:animate-none"
                  initial={false}
                  animate={{ opacity: gone ? (showCard ? 0.14 : 0.7) : 0.3 }}
                  transition={{ duration: 0.4 }}
                />
              );
            })}
            {/* Result beam: solid where the inputs were dotted — one thing came out. */}
            {geom.card &&
              (() => {
                const w = geom.wing;
                const e = geom.card.edge;
                const len = Math.hypot(e.x - w.x, e.y - w.y) || 1;
                const amp = -Math.min(28, len * 0.12);
                const cx = (w.x + e.x) / 2 + (-(e.y - w.y) / len) * amp;
                const cy = (w.y + e.y) / 2 + ((e.x - w.x) / len) * amp;
                const d = `M ${w.x} ${w.y} Q ${cx} ${cy} ${e.x} ${e.y}`;
                return (
                  <>
                    <motion.path
                      d={d}
                      fill="none"
                      strokeWidth={8}
                      strokeLinecap="round"
                      className="stroke-foreground"
                      initial={false}
                      animate={{
                        pathLength: showCard ? 1 : 0,
                        opacity: showCard ? 0.12 : 0,
                      }}
                      transition={BEAM}
                    />
                    <motion.path
                      d={d}
                      fill="none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      className="stroke-foreground"
                      initial={false}
                      animate={{
                        pathLength: showCard ? 1 : 0,
                        opacity: showCard ? 0.6 : 0,
                      }}
                      transition={BEAM}
                    />
                  </>
                );
              })()}
          </svg>
        )}

        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          {/* Scattered apps */}
          <div className="relative h-44 sm:h-52 md:h-64">
            {APPS.map((app, i) => {
              const Tile = TILES[app.key];
              const gone = i < absorbed;
              const curve = curves?.[i];
              const path = curve ? flightKeyframes(curve) : REST;
              const flight = {
                x: { duration: FLIGHT_S, times: TIMES, ease: "linear" },
                y: { duration: FLIGHT_S, times: TIMES, ease: "linear" },
              } as const;
              return (
                <div
                  key={app.key}
                  ref={(el) => {
                    anchors.current[i] = el;
                  }}
                  className="absolute"
                  style={{ left: app.left, top: app.top }}
                >
                  {/* afterimages — rendered first so they sit behind the icon */}
                  {GHOSTS.map(([peak, size, delay], k) => (
                    <motion.div
                      key={k}
                      className="pointer-events-none absolute inset-0 blur-[1px]"
                      style={{ rotate: app.rotate }}
                      initial={false}
                      animate={
                        gone
                          ? {
                              ...path,
                              scale: [size, size * 0.8, 0.1],
                              opacity: [peak, peak, 0],
                            }
                          : { ...REST, scale: size, opacity: 0 }
                      }
                      transition={
                        gone
                          ? {
                              x: { ...flight.x, delay },
                              y: { ...flight.y, delay },
                              scale: {
                                duration: FLIGHT_S,
                                times: [0, 0.7, 1],
                                delay,
                              },
                              opacity: {
                                duration: FLIGHT_S,
                                times: [0, 0.75, 1],
                                delay,
                              },
                            }
                          : SNAP
                      }
                    >
                      <Tile />
                    </motion.div>
                  ))}

                  <motion.div
                    className="relative"
                    animate={
                      gone
                        ? { ...path, scale: 0.15, opacity: 0 }
                        : { ...REST, scale: 1, opacity: 1 }
                    }
                    transition={
                      gone
                        ? {
                            ...flight,
                            scale: { duration: FLIGHT_S, ease: "easeIn" },
                            opacity: { duration: 0.15, delay: FLIGHT_S - 0.16 },
                          }
                        : {
                            x: SNAP,
                            y: SNAP,
                            scale: {
                              type: "spring",
                              stiffness: 260,
                              damping: 22,
                              delay: i * 0.05,
                            },
                            opacity: { duration: 0.3, delay: i * 0.05 },
                          }
                    }
                  >
                    <motion.div
                      animate={reduced ? undefined : { y: [0, -5, 0] }}
                      transition={{
                        duration: 3.2 + i * 0.35,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ rotate: app.rotate }}
                    >
                      <Tile />
                    </motion.div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* The wing */}
          <div className="relative flex items-center justify-center">
            {absorbed > 0 && !showCard && (
              <motion.span
                key={absorbed}
                initial={{ scale: 0.7, opacity: 0.55 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="border-foreground/30 absolute size-16 rounded-full border-2 sm:size-20"
              />
            )}
            <div ref={wingRef}>
              <motion.div
                className="bg-muted relative flex size-24 items-center justify-center rounded-3xl shadow-sm ring-1 ring-black/5 sm:size-28 dark:ring-white/10"
                animate={{ scale: showCard ? 1 : 1 + absorbed * 0.012 }}
                transition={POP_SPRING}
              >
                <LogoMark className="size-16 sm:size-20" />
              </motion.div>
            </div>
          </div>

          {/* The card that comes out — pushed to the far side. The slot is as
              tall as the card (240px at every width; its lines truncate), so
              the stacked phone layout keeps its height while the card comes
              and goes instead of nudging the page by 24px each loop. */}
          <div
            ref={cardSlotRef}
            className="relative flex min-h-60 items-center justify-center md:mr-10 md:justify-end"
          >
            <AnimatePresence>
              {showCard && (
                <CardWithTrail
                  key="card"
                  reduced={reduced}
                  from={
                    geom?.card
                      ? {
                          x: geom.wing.x - geom.card.rest.x,
                          y: geom.wing.y - geom.card.rest.y,
                        }
                      : { x: 0, y: 0 }
                  }
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {t("caption")}
      </p>
    </>
  );
}
