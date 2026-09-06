"use client";

import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Bell,
  Building2,
  Check,
  MessageCircle,
  Send,
  Sparkles,
  Star,
} from "lucide-react";

import { stageLabel } from "@/i18n/labels";
import { BUYER_STAGES } from "@/lib/crm";
import { cn } from "@/lib/utils";

// Springs lifted from app-preview.tsx so the whole landing speaks one language.
const CARD_SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;
const TOAST_SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;
const POP_SPRING = { type: "spring", stiffness: 500, damping: 22 } as const;

// Section-entrance variants — identical to FeatureGrid so the two sections rhyme.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

function makeItem(reduced: boolean | null): Variants {
  return {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 22, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 130, damping: 18, mass: 0.7 },
    },
  };
}

/** Cursor-follow spotlight — set CSS vars on the element, never re-render. */
function handleMove(e: MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

/** Loop a step counter while `active`; pauses (and frees the timer) otherwise. */
function useLoopStep(count: number, active: boolean, intervalMs: number) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setStep((s) => (s + 1) % count),
      intervalMs
    );
    return () => clearInterval(id);
  }, [active, count, intervalMs]);
  return step;
}

/** Shared in-view gate for a tile's loop. */
function useTileLoop(count: number, intervalMs = 1150) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { margin: "0px 0px -10% 0px" });
  const active = inView && !reduced;
  const step = useLoopStep(count, active, intervalMs);
  // Reduced motion / pre-JS: rest on the final, fully-composed frame.
  const s = reduced ? count - 1 : step;
  return { ref, s, reduced };
}

const TILE_FRAME =
  "relative mt-auto h-52 overflow-hidden rounded-xl border bg-muted/30";

function TileGlow() {
  return (
    <div
      aria-hidden
      className="from-primary/12 absolute -inset-2 -z-0 rounded-2xl bg-gradient-to-tr to-transparent blur-2xl"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Step 01 — Plan the viewing                                          */
/* ------------------------------------------------------------------ */

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
// day1 = Monday → row 1; the hop runs along the second visual row (cols 2/4/6).

function CalendarTile() {
  const t = useTranslations("landing");
  // One key per language: the initials of Mon…Sun, comma separated.
  const week = t("howItWorks.tiles.calendar.weekdays").split(",");
  // s: 0 idle · 1 hop→12 · 2 land 14 + pill · 3 bell · 4/5 synced + hold
  const { ref, s, reduced } = useTileLoop(6);
  const selected = s === 0 ? 10 : s === 1 ? 12 : 14;
  const landed = s >= 2;
  const showPill = s >= 2;
  const ringBell = s >= 3;
  const showSync = s >= 4;

  return (
    <div ref={ref} className={TILE_FRAME} aria-hidden>
      <TileGlow />
      <div className="absolute inset-0 z-10 flex flex-col p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">
            {t("howItWorks.tiles.calendar.month")}
          </span>
          <span className="relative">
            <motion.span
              animate={ringBell && !reduced ? { rotate: [0, 12, -8, 0] } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="text-muted-foreground block"
            >
              <Bell className="size-4" />
            </motion.span>
            <AnimatePresence>
              {ringBell && (
                <motion.span
                  initial={reduced ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={reduced ? { duration: 0 } : POP_SPRING}
                  className="bg-warning absolute -top-0.5 -right-0.5 size-1.5 rounded-full"
                />
              )}
            </AnimatePresence>
          </span>
        </div>

        <div className="text-muted-foreground mt-1.5 grid grid-cols-7 text-center text-[9px]">
          {week.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>

        <div className="relative mt-1 flex-1">
          <div className="grid h-full grid-cols-7 grid-rows-5">
            {DAYS.map((d) => (
              <span
                key={d}
                className={cn(
                  "flex items-center justify-center rounded-md text-[10px]",
                  d === 10 && !landed && "ring-primary/30 ring-1",
                  landed && d === 14
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-foreground/70"
                )}
              >
                {d}
              </span>
            ))}
          </div>
          {/* hopping selection ring — composited transform, percentages are
              relative to the ring's own one-cell box so they map 1:1 to cells */}
          <motion.span
            className="border-primary bg-primary/10 pointer-events-none absolute top-0 left-0 rounded-md border"
            style={{ width: `${100 / 7}%`, height: `${100 / 5}%` }}
            animate={{
              x: `${((selected - 1) % 7) * 100}%`,
              y: `${Math.floor((selected - 1) / 7) * 100}%`,
            }}
            transition={reduced ? { duration: 0 } : CARD_SPRING}
          />
        </div>

        <div className="mt-1.5 flex h-5 items-center gap-1.5">
          <AnimatePresence>
            {showPill && (
              <motion.span
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={reduced ? { duration: 0.2 } : CARD_SPRING}
                className="bg-card flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] shadow-sm"
              >
                <Building2 className="text-primary size-3" />
                {t("howItWorks.tiles.calendar.event")}
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showSync && (
              <motion.span
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-muted-foreground ml-auto flex items-center gap-1 text-[9px]"
              >
                <Check className="text-success size-3" />{" "}
                {t("howItWorks.tiles.calendar.synced")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 02 — Move them down the pipeline                               */
/* ------------------------------------------------------------------ */

const STAGES = BUYER_STAGES;

function PipelineTile() {
  const t = useTranslations("landing");
  const tCrm = useTranslations("crm");
  // s: 0 Qualified · 1 Viewing · 2 offer climbs · 3 Reserved · 4/5 hold
  const { ref, s, reduced } = useTileLoop(6);
  const stageIndex = s <= 0 ? 2 : s === 1 ? 3 : s === 2 ? 3 : 4;
  const reserved = s >= 3;
  const progress = stageIndex / (STAGES.length - 1);

  const offer = useMotionValue(reduced ? 710 : 660);
  const offerText = useTransform(offer, (v) => `€${Math.round(v)}k`);
  const offerWidth = useTransform(offer, [600, 740], [0.5, 0.97]);

  useEffect(() => {
    if (reduced) return;
    const target = s >= 2 ? 710 : 662;
    const controls = animate(offer, target, { duration: 0.7, ease: "easeOut" });
    return () => controls.stop();
  }, [s, reduced, offer]);

  return (
    <div ref={ref} className={TILE_FRAME} aria-hidden>
      <TileGlow />
      <div className="absolute inset-0 z-10 flex flex-col p-3">
        {/* stage lane */}
        <div className="relative">
          <div className="bg-border absolute top-1/2 right-1 left-1 h-px -translate-y-1/2" />
          <motion.div
            className="bg-primary/60 absolute top-1/2 left-1 h-px"
            style={{ right: 4, y: "-50%", transformOrigin: "left" }}
            animate={{ scaleX: progress }}
            transition={CARD_SPRING}
          />
          <div className="relative flex justify-between">
            {STAGES.map((st, i) => (
              <span
                key={st}
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[8px] font-medium transition-colors",
                  i === stageIndex
                    ? "bg-primary text-primary-foreground"
                    : i < stageIndex
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {stageLabel(tCrm, st)}
              </span>
            ))}
          </div>
        </div>

        {/* Sofia's card */}
        <div className="bg-background relative mt-auto flex items-center gap-2 rounded-lg border p-2 shadow-sm">
          <span className="bg-primary/15 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
            SM
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-[11px] font-medium">Sofia Müller</p>
              <Star className="fill-warning text-warning size-3 shrink-0" />
            </div>
            <p className="text-muted-foreground truncate text-[10px]">
              Apartment · €600–800k
            </p>
          </div>
          <AnimatePresence>
            {reserved && (
              <motion.span
                initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={reduced ? { duration: 0.2 } : POP_SPRING}
                className="bg-success/15 text-success flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              >
                <Check className="size-3" /> {stageLabel(tCrm, "reserved")}
              </motion.span>
            )}
          </AnimatePresence>
          {/* one-shot success ring */}
          <AnimatePresence>
            {reserved && !reduced && (
              <motion.span
                key="reserved-ring"
                initial={{ scale: 1, opacity: 0.45 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="border-success pointer-events-none absolute inset-0 rounded-lg border"
              />
            )}
          </AnimatePresence>
        </div>

        {/* offer vs asking */}
        <div className="mt-2">
          <div className="text-muted-foreground mb-1 flex justify-between text-[9px]">
            <span className="flex items-center gap-1">
              {t("howItWorks.tiles.pipeline.offer")}{" "}
              <motion.span className="text-foreground font-medium tabular-nums">{offerText}</motion.span>
            </span>
            <span>/ €740k</span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full rounded-full"
              style={{ scaleX: offerWidth, transformOrigin: "left" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 03 — Let LeadWing follow up                                        */
/* ------------------------------------------------------------------ */

// Sample rows: the names play real clients, the stage and quiet count are labels.
const NUDGES = [
  { name: "Sofia Müller", stage: "qualified", days: 18 },
  { name: "Lars Nielsen", stage: "viewing", days: 16 },
  { name: "Anya Petrova", stage: "qualified", days: 12 },
] as const;

// The draft is client-facing copy: it follows the client's language, not the UI's.
const DRAFT_LINES = [
  "Hallo Sofia,",
  "zwei neue Apartments mit Meerblick — sollen wir diese Woche eine Besichtigung einplanen?",
];

function FollowUpTile() {
  const t = useTranslations("landing");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  // s: 0 rows in · 1 Sofia selected · 2 draft opens · 3 lines typed · 4 sent · 5 hold
  const { ref, s, reduced } = useTileLoop(6, 1250);
  const showDraft = s >= 2;
  const sent = s >= 4;

  return (
    <div ref={ref} className={TILE_FRAME} aria-hidden>
      <TileGlow />

      {/* Layer 1 — needs-a-nudge list */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col p-3"
        animate={{ opacity: showDraft ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-2 flex items-center justify-between px-0.5">
          <span className="text-xs font-semibold">{t("mock.needsNudge")}</span>
          <span className="bg-warning/20 text-warning rounded-full px-1.5 text-[10px] font-medium">
            3
          </span>
        </div>
        <div className="space-y-1.5">
          {NUDGES.map((n, i) => (
            <div
              key={n.name}
              className={cn(
                "bg-background flex items-center justify-between gap-2 rounded-lg border p-2 transition-colors",
                s >= 1 && i === 0 && "border-primary/40 bg-primary/[0.06]"
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium">{n.name}</p>
                <p className="text-muted-foreground text-[10px]">
                  {stageLabel(tCrm, n.stage)} · {t("mock.quiet", { days: n.days })}
                </p>
              </div>
              <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium">
                <Sparkles className="size-3" /> {t("mock.draft")}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Layer 2 — AI draft */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col p-3"
        initial={false}
        animate={{ opacity: showDraft ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: "none" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium">
            {t("mock.to", { name: "Sofia Müller" })}
          </span>
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
            <Sparkles className="size-3" /> {t("mock.aiDraft")}
          </span>
        </div>
        <div className="bg-background text-muted-foreground mt-2 flex-1 rounded-lg border p-2.5 text-[11px] leading-relaxed">
          {DRAFT_LINES.map((line, i) => (
            <motion.p
              key={i}
              className={cn("overflow-hidden", i === 0 ? "text-foreground" : "mt-1")}
              animate={{
                clipPath:
                  reduced || s >= 3 ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
              }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.45 }}
            >
              {line}
            </motion.p>
          ))}
        </div>
        <div className="mt-2 flex justify-end gap-1.5">
          <span className="rounded-md border px-2 py-1 text-[10px] font-medium">
            {tCommon("edit")}
          </span>
          <motion.span
            animate={sent && !reduced ? { scale: [1, 0.96, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium"
          >
            {sent ? <Check className="size-3" /> : <Send className="size-3" />}
            {sent ? t("mock.sent") : tCommon("send")}
          </motion.span>
        </div>
      </motion.div>

      {/* WhatsApp follow-up toast */}
      <AnimatePresence>
        {sent && (
          <motion.div
            initial={
              reduced ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.95 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.95 }}
            transition={reduced ? { duration: 0.2 } : TOAST_SPRING}
            className="bg-popover absolute right-2.5 bottom-2.5 z-20 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium shadow-md"
          >
            <MessageCircle className="size-3.5 shrink-0 text-[#25D366]" />
            {t("howItWorks.tiles.followUp.sentToast")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

/** Copy lives in `landing.howItWorks.steps.<key>`. */
const STEPS = [
  { number: "01", key: "plan", Tile: CalendarTile },
  { number: "02", key: "pipeline", Tile: PipelineTile },
  { number: "03", key: "followUp", Tile: FollowUpTile },
] as const;

export function HowItWorks() {
  const t = useTranslations("landing");
  const reduced = useReducedMotion();
  const item = makeItem(reduced);

  return (
    <motion.div
      className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {STEPS.map(({ number, key, Tile }) => (
        <motion.div
          key={number}
          variants={item}
          whileHover={
            reduced
              ? undefined
              : { y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }
          }
          onMouseMove={handleMove}
          style={{ "--mx": "50%", "--my": "0%" } as CSSProperties}
          className="group bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-[0_18px_44px_-16px_rgb(0_0_0/0.22)]"
        >
          {/* cursor-follow spotlight */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(16rem circle at var(--mx) var(--my), color-mix(in oklch, var(--primary) 16%, transparent), transparent 60%)",
            }}
          />
          {/* light catching the top edge */}
          <span
            aria-hidden
            className="via-primary/40 pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          {/* ghost numeral */}
          <span
            aria-hidden
            className="text-primary/[0.07] pointer-events-none absolute top-3 right-4 text-5xl font-semibold tabular-nums select-none"
          >
            {number}
          </span>

          <div className="relative flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
              {number}
            </span>
            <h3 className="font-semibold tracking-tight">
              {t(`howItWorks.steps.${key}.title`)}
            </h3>
          </div>
          <p className="text-muted-foreground relative mt-1.5 mb-5 text-sm leading-relaxed">
            {t(`howItWorks.steps.${key}.blurb`)}
          </p>

          <Tile />
        </motion.div>
      ))}
    </motion.div>
  );
}
