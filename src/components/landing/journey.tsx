"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  Bell,
  BellRing,
  CalendarClock,
  Check,
  ClipboardPaste,
  Hourglass,
  MessageCircle,
  Sparkles,
  Target,
} from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { WhatsAppIcon } from "@/components/clients/whatsapp-button";
import { TONE_TAG } from "@/lib/tones";
import { cn } from "@/lib/utils";

/*
  The five moments LeadWing covers, in the order the hero promises them: every
  buyer in one place, who to write to today, the message already written; then
  which listings fit and the viewing itself. Each has a small piece of the
  product, drawn with the app's own avatars, pills and colours.
*/

/** A piece of the app lifted off the page; `lg:` sizes it up for the wide stage. */
function Mock({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        // Drawn at the app's real size, then enlarged for the wide stage: a
        // transform keeps the text sharp and leaves the layout alone.
        "bg-card mock-lift w-full max-w-sm rounded-2xl p-4 lg:max-w-[26rem] lg:scale-110 lg:p-5 xl:scale-125",
        className
      )}
    >
      {children}
    </div>
  );
}

function CaptureVisual() {
  const t = useTranslations("landing.howItWorks.tiles.capture");
  return (
    <Mock>
      <div className="flex flex-wrap gap-1.5">
        {["Idealista", "WhatsApp", "Email"].map((source) => (
          <span key={source} className="bg-muted text-foreground/75 rounded-full px-2.5 py-1 text-[11px]">
            {source}
          </span>
        ))}
      </div>
      <p className="bg-muted/60 text-foreground/85 mt-3 rounded-2xl rounded-tl-md p-3 text-xs leading-relaxed lg:text-[13px]">
        {t("enquiry")}
      </p>
      <p className="text-muted-foreground my-2.5 flex items-center justify-center gap-1.5 text-[11px]">
        <ArrowDown className="size-3" /> {t("action")}
      </p>
      <div className="bg-background flex items-center gap-2.5 rounded-xl border p-3">
        <ClientAvatar name="Sofia Müller" side="buyer" size="md" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">Sofia Müller</p>
          <p className="text-muted-foreground truncate text-xs">{t("details")}</p>
        </div>
        <span className="bg-tone-green-soft text-tone-green-ink ml-auto flex size-6 shrink-0 items-center justify-center rounded-full">
          <Check className="size-3.5" strokeWidth={2.25} />
        </span>
      </div>
    </Mock>
  );
}

/** The client page's own Next step card, then a task due today. */
function AttentionVisual() {
  const t = useTranslations("landing.howItWorks.tiles.attention");
  const tNext = useTranslations("clientDetail.nextStep");
  const tLog = useTranslations("clientDetail.contactLog");
  const chip = "bg-background inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs shadow-xs";
  return (
    <Mock className="space-y-3">
      <div className="bg-tone-amber-soft/70 ring-tone-amber/35 rounded-xl px-3.5 pt-3 pb-3.5 ring-1 ring-inset">
        <p className="text-tone-amber-ink flex items-center gap-1.5 text-xs font-medium">
          <Hourglass className="size-3.5" strokeWidth={2} /> {tNext("quiet", { days: 16 })}
        </p>
        <p className="font-display mt-1 text-base tracking-[-0.02em] lg:text-lg">
          {tNext("quietTitle", { name: "Lars" })}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className={chip}>
            <WhatsAppIcon className="size-3.5" /> WhatsApp
          </span>
          <span className={chip}>
            <Check className="size-3.5" /> {tLog("trigger")}
          </span>
        </div>
      </div>
      <div className="bg-background rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium">{t("heading")}</p>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", TONE_TAG.amber)}>
            {t("today")}
          </span>
        </div>
        <div className="mt-2.5 flex items-start gap-2">
          <span className="border-input mt-0.5 size-3.5 shrink-0 rounded border shadow-xs" />
          <div className="min-w-0">
            <p className="text-xs">{t("task")}</p>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-[11px]">
              <Bell className="size-3 shrink-0" /> {t("reminder")}
            </p>
          </div>
        </div>
      </div>
    </Mock>
  );
}

/** The message as the client will read it: WhatsApp's own outgoing bubble. */
function DraftVisual() {
  const t = useTranslations("landing.howItWorks.tiles.draft");
  return (
    <Mock>
      <div className="flex items-center gap-2.5 border-b pb-3">
        <ClientAvatar name="Sofia Müller" side="buyer" size="md" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">Sofia Müller</p>
          <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <Sparkles className="size-3 shrink-0" /> {t("language")}
          </p>
        </div>
      </div>
      <div className="bg-muted/60 dark:bg-muted/30 mt-3 rounded-2xl p-2.5">
        {/* Client-facing sample: follows the client's language, not the page's. */}
        <div
          lang="de"
          className="ml-auto max-w-[92%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3 py-2 text-xs leading-relaxed text-[#111b21] shadow-xs lg:text-[13px] dark:bg-[#005c4b] dark:text-[#e9edef]"
        >
          <p>Hallo Sofia,</p>
          <p className="mt-1.5">
            wie hat Ihnen die Wohnung gefallen? Wenn Sie Fragen haben oder noch einmal besichtigen
            möchten, melden Sie sich gerne.
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <span className="bg-primary text-primary-foreground inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium shadow-xs">
          <WhatsAppIcon className="size-3.5 text-current" /> {t("openWhatsApp")}
        </span>
      </div>
    </Mock>
  );
}

function MatchVisual() {
  const t = useTranslations("landing.howItWorks.tiles.match");
  return (
    <Mock className="space-y-2">
      <div className="bg-muted/60 flex items-center gap-2.5 rounded-xl p-2.5">
        <ClientAvatar name="James Carter" side="buyer" size="md" />
        <p className="min-w-0 text-xs leading-relaxed lg:text-[13px]">
          {t.rich("query", {
            name: "James Carter",
            b: (chunks) => <span className="font-medium">{chunks}</span>,
          })}
        </p>
      </div>
      <p className="text-muted-foreground py-0.5 text-center text-[11px]">{t("count")}</p>
      {[
        { title: "Villa, Nueva Andalucía", meta: t("meta1") },
        { title: "Villa, El Paraíso", meta: t("meta2") },
      ].map((listing) => (
        <div
          key={listing.title}
          className="bg-background flex items-center justify-between gap-3 rounded-xl border p-3 text-xs"
        >
          <div className="min-w-0">
            <p className="truncate font-medium lg:text-[13px]">{listing.title}</p>
            <p className="text-muted-foreground mt-0.5">{listing.meta}</p>
          </div>
          <span className="bg-tone-green-soft text-tone-green-ink flex size-6 shrink-0 items-center justify-center rounded-full">
            <Check className="size-3.5" strokeWidth={2.25} />
          </span>
        </div>
      ))}
    </Mock>
  );
}

function ViewingVisual() {
  const t = useTranslations("landing.howItWorks.tiles.viewing");
  return (
    <Mock className="space-y-3">
      <div className="bg-background flex items-center gap-3 rounded-xl border p-3">
        <div className="bg-tone-teal-soft text-tone-teal-ink flex size-11 shrink-0 flex-col items-center justify-center rounded-lg">
          <span className="text-[9px] font-medium uppercase">{t("month")}</span>
          <span className="text-sm leading-none font-medium tabular-nums">14</span>
        </div>
        <div className="min-w-0 text-xs">
          <p className="truncate font-medium lg:text-[13px]">{t("event")}</p>
          <p className="text-muted-foreground mt-0.5">{t("when", { name: "Olivia Brown" })}</p>
        </div>
      </div>
      <div className="bg-muted/60 dark:bg-muted/30 rounded-2xl p-2.5">
        <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3 py-2 text-xs leading-relaxed text-[#111b21] shadow-xs lg:text-[13px] dark:bg-[#005c4b] dark:text-[#e9edef]">
          {t("reminder")}
        </div>
        <p className="text-muted-foreground mt-2 flex items-center justify-end gap-1.5 pr-1 text-[11px]">
          <WhatsAppIcon className="size-3" /> {t("whatsapp")}
        </p>
      </div>
    </Mock>
  );
}

const STEPS = [
  { key: "capture", icon: ClipboardPaste, Visual: CaptureVisual },
  { key: "attention", icon: BellRing, Visual: AttentionVisual },
  { key: "draft", icon: MessageCircle, Visual: DraftVisual },
  { key: "match", icon: Target, Visual: MatchVisual },
  { key: "viewing", icon: CalendarClock, Visual: ViewingVisual },
] as const satisfies readonly {
  key: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  Visual: ComponentType;
}[];

/* The brand's two hues as a pale wash: the ground every product mock sits on. */
const WASH = "bg-[linear-gradient(140deg,var(--tone-indigo-soft),var(--tone-teal-soft))]";

/**
 * How it works, as one explorer in place of a wall of feature blocks.
 *
 * Wide screens: the five steps are a list on the left with every word
 * visible, and the product mock on the right follows the step under the
 * pointer (or the one clicked or focused). Nothing changes height.
 *
 * Phones: the same five items are cards in one swipeable row, each with its
 * own mock on the same wash, so five steps take half a screen instead of
 * five stacked blocks, and dots show where you are.
 *
 * It is one list in the markup: on a wide screen the list and its items are
 * `display: contents`, which drops their text into the left column and stacks
 * every mock in the same cell on the right.
 */
export function Journey() {
  const t = useTranslations("landing.howItWorks.steps");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);

  /** On a phone the card nearest the middle of the row is the current one. */
  function onScroll() {
    const row = list.current;
    if (!row || row.scrollWidth <= row.clientWidth + 1) return;
    const middle = row.scrollLeft + row.clientWidth / 2;
    let nearest = 0;
    let gap = Infinity;
    Array.from(row.children).forEach((card, i) => {
      const el = card as HTMLElement;
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle);
      if (distance < gap) {
        gap = distance;
        nearest = i;
      }
    });
    setActive(nearest);
  }

  /** Select a step; on a phone that also brings its card into the middle. */
  function show(i: number) {
    setActive(i);
    const row = list.current;
    if (!row || row.scrollWidth <= row.clientWidth + 1) return;
    const card = row.children[i] as HTMLElement | undefined;
    if (!card) return;
    row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  }

  return (
    <div className="mt-10 lg:mt-14">
      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-x-8 lg:gap-y-1.5">
        {/* The stage behind the mocks, wide screens only. */}
        <div
          aria-hidden
          className={cn(
            "ring-foreground/[0.06] rounded-[1.75rem] ring-1 ring-inset max-lg:hidden lg:col-start-2 lg:row-span-5 lg:row-start-1 dark:ring-white/10",
            WASH
          )}
        />
        {/* Relative: the row is the containing block for anything absolutely
            placed inside a card, so nothing can widen the page on a phone. */}
        <ol
          ref={list}
          onScroll={onScroll}
          className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:contents"
        >
          {STEPS.map(({ key, icon: Icon, Visual }, i) => {
            const on = active === i;
            return (
              <li
                key={key}
                className="bg-card flex w-[84vw] max-w-[22rem] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border shadow-xs lg:contents"
              >
                <div
                  aria-hidden
                  className={cn(
                    "flex min-h-64 items-center justify-center p-4 max-lg:bg-[linear-gradient(140deg,var(--tone-indigo-soft),var(--tone-teal-soft))]",
                    "lg:z-10 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:p-10",
                    "lg:transition-[opacity,translate] lg:duration-300 lg:ease-(--ease-out-quint) motion-reduce:lg:transition-none",
                    on ? "lg:opacity-100" : "lg:pointer-events-none lg:translate-y-2 lg:opacity-0"
                  )}
                >
                  <Visual />
                </div>
                <div
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setActive(i);
                  }}
                  onClick={() => show(i)}
                  className={cn(
                    "flex flex-1 gap-3.5 p-4 lg:col-start-1 lg:cursor-pointer lg:rounded-2xl lg:px-5 lg:py-4",
                    "lg:transition-[background-color,box-shadow] lg:duration-200",
                    on && "lg:bg-card lg:ring-foreground/[0.06] lg:shadow-xs lg:ring-1 dark:lg:ring-white/10"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-[color,background-color] duration-200",
                      "bg-tone-indigo-soft text-tone-indigo-ink",
                      !on && "lg:bg-foreground/[0.05] lg:text-foreground/60"
                    )}
                  >
                    <Icon className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base leading-snug font-medium lg:text-lg">
                      <button
                        type="button"
                        aria-pressed={on}
                        onFocus={() => setActive(i)}
                        className={cn(
                          "focus-visible:ring-ring/50 -mx-1 rounded-md px-1 text-left outline-none transition-colors duration-200 focus-visible:ring-[3px]",
                          !on && "lg:text-foreground/75"
                        )}
                      >
                        {t(`${key}.title`)}
                      </button>
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{t(`${key}.blurb`)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Where you are in the row, phones only. */}
      <div className="mt-4 flex justify-center gap-1.5 lg:hidden">
        {STEPS.map(({ key }, i) => (
          <button
            key={key}
            type="button"
            aria-label={t(`${key}.title`)}
            aria-current={active === i ? "step" : undefined}
            onClick={() => show(i)}
            className="group flex h-6 w-5 items-center justify-center outline-none"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-200 group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50",
                active === i ? "bg-primary w-4" : "bg-foreground/20 w-1.5"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
