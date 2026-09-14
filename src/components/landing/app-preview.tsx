"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  EllipsisVertical,
  Home,
  LayoutGrid,
  List,
  MessageCircle,
  PanelLeft,
  Plus,
  Search,
  Star,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { intlTag } from "@/i18n/config";
import { stageLabel } from "@/i18n/labels";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { Money } from "@/components/ui/money";
import { Tag } from "@/components/ui/tag";
import { BUYER_STAGES, STAGE_TONES, type Stage } from "@/lib/crm";
import { TONE_INK, TONE_SOLID, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

/*
  The hero's live demo: the Buyers list inside the app shell, drawn with the
  same primitives as the real screen (tags, avatars, money, the 38/42px table
  rhythm), so what a visitor sees above the fold is what they get after
  signing in. A short loop plays out a week: a lead arrives, a buyer moves to
  a viewing, an offer is accepted, a reminder goes out; then the board resets.
  Decorative: aria-hidden, nothing in it takes focus.
*/

type Row = {
  id: string;
  name: string;
  stage: Stage;
  priority?: boolean;
  budgetMin: number | null;
  budgetMax: number | null;
  viewings: number;
  /** Hours since the agent last touched the record. */
  quietHours: number;
};

// Sample records. Names are proper nouns and figures are numbers, so the rows
// read the same in every UI language; only the labels around them translate.
const ROWS: Record<string, Row> = {
  sofia: {
    id: "sofia",
    name: "Sofia Müller",
    stage: "viewing",
    priority: true,
    budgetMin: 600_000,
    budgetMax: 800_000,
    viewings: 3,
    quietHours: 2,
  },
  james: {
    id: "james",
    name: "James Carter",
    stage: "qualified",
    budgetMin: null,
    budgetMax: 750_000,
    viewings: 0,
    quietHours: 26,
  },
  anya: {
    id: "anya",
    name: "Anya Petrova",
    stage: "contacted",
    budgetMin: 1_200_000,
    budgetMax: null,
    viewings: 0,
    quietHours: 120,
  },
  tom: {
    id: "tom",
    name: "Tom Wright",
    stage: "new",
    budgetMin: null,
    budgetMax: 2_400_000,
    viewings: 0,
    quietHours: 0,
  },
};

// Three at rest, most recent first. Every beat of the loop lands on a row that
// stays in view once Tom pushes Anya under the bottom edge.
const START = ["sofia", "james", "anya"];
const initialRows = (): Row[] => START.map((id) => ROWS[id]);

const STEP_MS = 3200;
const TOAST_MS = 2800;

/* One spring for every state change here; rows sliding get a touch longer. */
const SPRING = { type: "spring", duration: 0.3, bounce: 0 } as const;
const LAYOUT_SPRING = { type: "spring", duration: 0.4, bounce: 0 } as const;
const EXIT = {
  opacity: 0,
  y: -12,
  filter: "blur(4px)",
  transition: { duration: 0.15, ease: "easeOut" },
} as const;

type ToastKind = "newLead" | "moved" | "offerAccepted" | "reminderSent";
type ToastTone = Tone | "whatsapp";
type Toast = { id: number; kind: ToastKind; tone: ToastTone; icon: LucideIcon };

/** "2 hours ago", "yesterday", "last week": Intl does the wording per language. */
function sinceLabel(hours: number, tag: string): string {
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  if (hours < 1) return rtf.format(0, "second");
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return rtf.format(-Math.round(days / 7), "week");
}

/** A value that cross-fades when it changes: counts, the active-clients pill. */
function Flip({ value, className }: { value: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={SPRING}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/*
  Column templates per breakpoint: name and stage on a phone, budget from sm,
  the checkbox, activity and menu from md, the viewings tally from lg (where
  the sidebar takes its share of the width, the name still needs ~180px).
*/
const GRID =
  "grid grid-cols-[minmax(0,1fr)_7.5rem] items-center sm:grid-cols-[minmax(0,1fr)_7rem_10.5rem] md:grid-cols-[2.25rem_minmax(0,1fr)_7rem_10.5rem_8rem_2.5rem] lg:grid-cols-[2.25rem_minmax(0,1fr)_7rem_10.5rem_4.5rem_8rem_2.5rem]";

export function AppPreview() {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tCrm = useTranslations("crm");
  const tClients = useTranslations("clients");
  const tag = intlTag(useLocale());
  const reduced = useReducedMotion();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unread, setUnread] = useState(0);
  const stepRef = useRef(0);
  const toastIdRef = useRef(0);

  useEffect(() => {
    if (reduced) return;

    function pushToast(kind: ToastKind, tone: ToastTone, icon: LucideIcon) {
      const id = ++toastIdRef.current;
      setToasts((list) => [...list, { id, kind, tone, icon }].slice(-2));
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), TOAST_MS);
    }
    function patch(id: string, changes: Partial<Row>) {
      setRows((list) => list.map((r) => (r.id === id ? { ...r, ...changes } : r)));
    }

    const interval = setInterval(() => {
      const step = stepRef.current % 5;
      stepRef.current += 1;
      if (step === 0) {
        setRows((list) => [ROWS.tom, ...list]);
        setUnread((n) => n + 1);
        pushToast("newLead", "blue", UserPlus);
      } else if (step === 1) {
        patch("james", { stage: "viewing" });
        pushToast("moved", "brand", ArrowRight);
      } else if (step === 2) {
        patch("sofia", { stage: "reserved" });
        setUnread((n) => n + 1);
        pushToast("offerAccepted", "green", Check);
      } else if (step === 3) {
        patch("james", { quietHours: 0 });
        pushToast("reminderSent", "whatsapp", MessageCircle);
      } else {
        setRows(initialRows());
        setUnread(0);
      }
    }, STEP_MS);

    return () => clearInterval(interval);
  }, [reduced]);

  const stageCount = new Map<Stage, number>();
  for (const r of rows) stageCount.set(r.stage, (stageCount.get(r.stage) ?? 0) + 1);

  function toastText(kind: ToastKind): string {
    switch (kind) {
      case "newLead":
        return t("preview.toasts.newLead");
      case "moved":
        return t("preview.toasts.moved", {
          name: ROWS.james.name,
          stage: stageLabel(tCrm, "viewing"),
        });
      case "offerAccepted":
        return t("preview.toasts.offerAccepted", { name: ROWS.sofia.name });
      case "reminderSent":
        return t("preview.toasts.reminderSent", { name: "James" });
    }
  }

  const budget = (r: Row) => {
    const amount = (value: number) => <Money value={value} locale={tag} />;
    if (r.budgetMin != null && r.budgetMax != null) {
      return (
        <span className="inline-flex items-center gap-1 tabular-nums">
          {amount(r.budgetMin)}
          <span className="text-muted-foreground">–</span>
          {amount(r.budgetMax)}
        </span>
      );
    }
    if (r.budgetMax != null) {
      return tClients.rich("table.upTo", { amount: () => amount(r.budgetMax!) });
    }
    if (r.budgetMin != null) {
      return tClients.rich("table.from", { amount: () => amount(r.budgetMin!) });
    }
    return <span className="text-muted-foreground">—</span>;
  };

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-5xl">
      {/* The glow stays inside the page gutter on phones: anything wider
          than the viewport gives the whole page a horizontal scroll. */}
      <div className="from-primary/12 absolute -inset-x-3 -top-8 -bottom-8 -z-10 rounded-[2.5rem] bg-gradient-to-tr to-transparent blur-2xl sm:-inset-x-8" />

      <div className="bg-background text-foreground mock-lift flex overflow-hidden rounded-2xl text-left text-sm select-none">
        {/* Sidebar: the shell's destinations and the buyer pipeline. */}
        <aside className="bg-sidebar text-sidebar-foreground hidden w-52 shrink-0 flex-col border-r lg:flex">
          <div className="flex h-14 items-center gap-2.5 border-b px-3">
            <LogoMark className="size-8" />
            <span className="flex min-w-0 flex-col leading-none">
              <Wordmark className="text-[15px]" />
              <span className="text-muted-foreground mt-1 truncate text-[11px]">
                {tNav("tagline")}
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5 p-2">
            <SideItem icon={Home} label={tNav("home")} />
            <SideItem icon={Users} label={tNav("buyers")} badge={rows.length} active />
            <SideItem icon={Building2} label={tNav("sellers")} badge={3} />
            <SideItem icon={CalendarDays} label={tNav("calendar")} badge={2} />
          </div>
          <div className="px-2 pb-2">
            <p className="label-caps text-muted-foreground/80 flex h-7 items-center px-2">
              {tNav("pipeline")}
            </p>
            <div className="flex flex-col gap-0.5">
              {BUYER_STAGES.map((s) => (
                <SideItem
                  key={s}
                  dot={TONE_SOLID[STAGE_TONES[s]]}
                  label={stageLabel(tCrm, s)}
                  badge={stageCount.get(s) ?? 0}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* App bar: the section, its live figure, then search, the bell and the agent. */}
          <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3 md:px-4">
            <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center">
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="truncate text-[15px] font-medium tracking-tight">
                {tNav("buyers")}
              </span>
              <span className="bg-card text-muted-foreground hidden h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs whitespace-nowrap sm:inline-flex">
                <span className={cn("size-1.5 rounded-full", TONE_SOLID.green)} />
                <Flip value={tNav("active", { count: rows.length })} />
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-muted-foreground flex size-8 items-center justify-center">
                <Search className="size-4" strokeWidth={1.75} />
              </span>
              <span className="text-muted-foreground relative flex size-8 items-center justify-center">
                <Bell className="size-4" strokeWidth={1.75} />
                <AnimatePresence initial={false}>
                  {unread > 0 ? (
                    <motion.span
                      key="unread"
                      initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      transition={SPRING}
                      className="bg-primary text-primary-foreground ring-background absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold ring-2"
                    >
                      {unread}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </span>
              <span className="bg-card ml-1 flex h-8 items-center gap-2 rounded-full border pr-2.5 pl-0.5 text-xs font-medium">
                <span className="bg-primary/12 text-primary flex size-[26px] items-center justify-center rounded-full text-[10px] font-semibold">
                  MR
                </span>
                <span className="hidden sm:block">Marta</span>
              </span>
            </div>
          </div>

          {/* Room under the table for the toasts, so none of them covers a row.
              On a phone there is no side padding: the tabs, toolbar and list
              run edge to edge, so the window reads as one screen rather than
              a card inside a card. */}
          <div className="relative flex-1 space-y-3 pt-3 pb-14 sm:p-4 sm:pb-14">
            {/* Stage tabs: every stage with its live count. */}
            <div className="scrollbar-none flex items-end overflow-x-auto border-b max-md:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] sm:-mx-1 sm:px-1">
              <StageTab label={tClients("list.all")} count={rows.length} active />
              {BUYER_STAGES.map((s) => (
                <StageTab
                  key={s}
                  dot={TONE_SOLID[STAGE_TONES[s]]}
                  label={stageLabel(tCrm, s)}
                  count={stageCount.get(s) ?? 0}
                />
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 sm:px-0">
              <span className="bg-background text-muted-foreground flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border px-2.5 text-[13px] shadow-xs sm:max-w-64">
                <Search className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{tClients("list.searchPlaceholder")}</span>
              </span>
              <span className="bg-background text-muted-foreground hidden h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-xs sm:inline-flex">
                <Star className="size-3.5" />
                {tClients("list.priority")}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <span className="bg-muted hidden h-8 items-center rounded-lg p-0.5 sm:inline-flex">
                  <span className="bg-background text-foreground flex size-7 items-center justify-center rounded-md shadow-xs">
                    <List className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="text-muted-foreground flex size-7 items-center justify-center rounded-md">
                    <LayoutGrid className="size-4" strokeWidth={1.75} />
                  </span>
                </span>
                <span className="bg-primary text-primary-foreground inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium shadow-xs">
                  <Plus className="size-4" />
                  {tClients("list.newClient", { side: "buyer" })}
                </span>
              </span>
            </div>

            {/* The table: a flat list between two hairlines on a phone, a card from sm. */}
            <div className="bg-card overflow-hidden border-y sm:rounded-xl sm:border sm:shadow-xs">
              <div
                className={cn(
                  GRID,
                  "text-muted-foreground h-[38px] border-b text-xs [&>span]:px-3"
                )}
              >
                <span className="hidden md:block">
                  <span className="border-input block size-4 rounded-[4px] border shadow-xs" />
                </span>
                <span>{tClients("table.name")}</span>
                <span>{tClients("table.stage")}</span>
                <span className="hidden text-right sm:block">{tClients("table.budget")}</span>
                <span className="hidden text-right lg:block">
                  {tClients("table.viewings")}
                </span>
                <span className="hidden md:block">{tClients("table.lastActivity")}</span>
                <span className="hidden md:block" />
              </div>

              {/* A fixed window of three rows, so the board keeps its height
                  when the fourth arrives: the list scrolls the way a real one
                  would, and the last row slides out under the bottom edge.
                  125px is three 42px rows less the third row's bottom border,
                  which would otherwise double the card's own. */}
              <div className="relative h-[125px] overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  {rows.map((r) => (
                    <motion.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={EXIT}
                      transition={LAYOUT_SPRING}
                      className={cn(
                        GRID,
                        "relative h-[42px] border-b whitespace-nowrap last:border-0 [&>span]:px-3"
                      )}
                    >
                      {r.id === "tom" ? (
                        // A new lead lands on a brand-tinted row that settles
                        // into the list, so the eye finds it before reading.
                        <motion.span
                          aria-hidden
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
                          className="bg-primary/[0.07] pointer-events-none absolute inset-0 !px-0"
                        />
                      ) : null}
                      <span className="hidden md:block">
                        <span className="border-input block size-4 rounded-[4px] border shadow-xs" />
                      </span>
                      <span className="flex min-w-0 items-center gap-2.5">
                        <ClientAvatar name={r.name} side="buyer" />
                        <span className="truncate font-medium">{r.name}</span>
                        {r.priority ? (
                          <Star className="fill-warning text-warning size-3.5 shrink-0" />
                        ) : null}
                      </span>
                      <span className="relative flex items-center">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={r.stage}
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                            transition={SPRING}
                            className="inline-flex"
                          >
                            <Tag tone={STAGE_TONES[r.stage]} dot>
                              {stageLabel(tCrm, r.stage)}
                            </Tag>
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <span className="hidden text-right tabular-nums sm:block">{budget(r)}</span>
                      <span className="hidden text-right tabular-nums lg:block">
                        {r.viewings > 0 ? (
                          r.viewings
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </span>
                      <span className="text-muted-foreground hidden items-center gap-1.5 text-[13px] md:flex">
                        <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.75} />
                        <Flip value={sinceLabel(r.quietHours, tag)} />
                      </span>
                      <span className="text-muted-foreground hidden items-center justify-end md:flex">
                        <EllipsisVertical className="size-4" strokeWidth={1.75} />
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Toasts: in from below, out the way they came. */}
            <div className="pointer-events-none absolute right-3 bottom-3 flex max-w-[80%] flex-col items-end gap-2 sm:right-4 sm:bottom-4">
              <AnimatePresence initial={false}>
                {toasts.map((toast) => (
                  <motion.div
                    key={toast.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      transition: { duration: 0.15, ease: "easeOut" },
                    }}
                    transition={LAYOUT_SPRING}
                    className="bg-popover text-popover-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium shadow-lg"
                  >
                    <toast.icon
                      className={cn(
                        "size-4 shrink-0",
                        toast.tone === "whatsapp" ? "text-[#25D366]" : TONE_INK[toast.tone]
                      )}
                      strokeWidth={2}
                    />
                    <span className="truncate">{toastText(toast.kind)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A sidebar row: an icon or a stage dot, the label, a count on the right. */
function SideItem({
  icon: Icon,
  dot,
  label,
  badge,
  active = false,
}: {
  icon?: LucideIcon;
  dot?: string;
  label: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex h-8 items-center gap-2 rounded-lg px-2 text-sm",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-muted-foreground font-medium"
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.75} /> : null}
      {dot ? <span className={cn("mx-1 size-2 shrink-0 rounded-full", dot)} /> : null}
      <span className="truncate">{label}</span>
      {badge != null ? (
        <span
          className={cn(
            "text-muted-foreground bg-sidebar-accent/70 absolute right-2 flex h-[18px] min-w-6 items-center justify-center rounded-full border px-1.5 text-[11px] font-medium tabular-nums",
            badge === 0 && "opacity-50"
          )}
        >
          <Flip value={badge} />
        </span>
      ) : null}
    </span>
  );
}

/** One tab in the stage strip above the list. */
function StageTab({
  label,
  count,
  dot,
  active = false,
}: {
  label: string;
  count: number;
  dot?: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "-mb-px flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-medium whitespace-nowrap",
        active ? "border-foreground text-foreground" : "text-muted-foreground border-transparent"
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", dot)} /> : null}
      {label}
      <span
        className={cn(
          "inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums",
          active ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Flip value={count} />
      </span>
    </span>
  );
}
