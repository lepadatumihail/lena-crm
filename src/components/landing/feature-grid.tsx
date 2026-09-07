"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Building2, Layers, Tag, Users, type LucideIcon } from "lucide-react";

import { stageLabel } from "@/i18n/labels";
import { BUYER_STAGES } from "@/lib/crm";
import { cn } from "@/lib/utils";

/**
 * Four tiles in a 2-1 / 1-2 bento. Copy lives in `landing.features.items.<key>`;
 * the two wide tiles carry a small detail row so the claim is shown, not told.
 */
const FEATURES = [
  { key: "pipeline", icon: Layers, wide: true },
  { key: "clients", icon: Users, wide: false },
  { key: "deal", icon: Building2, wide: false },
  { key: "agencies", icon: Tag, wide: true },
] as const satisfies readonly {
  key: string;
  icon: LucideIcon;
  wide: boolean;
}[];

/** Track the cursor inside a card so the spotlight follows it — no re-render. */
function handleMove(e: MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

/** The buyer stages as a row of chips, last one lit: the deal crossed the line. */
function StageChips() {
  const tCrm = useTranslations("crm");
  const last = BUYER_STAGES.length - 1;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5">
      {BUYER_STAGES.map((stage, i) => (
        <span
          key={stage}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium",
            i === last
              ? "border-success/30 bg-success/10 text-success"
              : "bg-background text-muted-foreground",
          )}
        >
          {stageLabel(tCrm, stage)}
        </span>
      ))}
    </div>
  );
}

/** Sample agency tags — the one book, whichever agency the listing sits with. */
function AgencyChips() {
  const t = useTranslations("landing.features.items.agencies");
  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5">
      {t("tags")
        .split(",")
        .map((tag) => (
          <span
            key={tag}
            className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          >
            <Tag className="size-3" />
            {tag.trim()}
          </span>
        ))}
    </div>
  );
}

const DETAILS: Partial<
  Record<(typeof FEATURES)[number]["key"], () => React.ReactNode>
> = {
  pipeline: StageChips,
  agencies: AgencyChips,
};

export function FeatureGrid() {
  const t = useTranslations("landing");
  const reduced = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
  };

  const item: Variants = {
    hidden: reduced
      ? { opacity: 0 }
      : { opacity: 0, y: 22, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 130, damping: 18, mass: 0.7 },
    },
  };

  return (
    <motion.div
      className="mt-10 grid gap-5 md:grid-cols-3"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {FEATURES.map((f) => {
        const Detail = DETAILS[f.key];
        return (
          <motion.div
            key={f.key}
            variants={item}
            whileHover={
              reduced
                ? undefined
                : {
                    y: -6,
                    transition: { type: "spring", stiffness: 300, damping: 20 },
                  }
            }
            onMouseMove={handleMove}
            style={{ "--mx": "50%", "--my": "0%" } as CSSProperties}
            className={cn(
              "group bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-[0_18px_44px_-16px_rgb(0_0_0/0.22)]",
              f.wide && "md:col-span-2",
            )}
          >
            {/* Cursor-follow spotlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(16rem circle at var(--mx) var(--my), color-mix(in oklch, var(--primary) 16%, transparent), transparent 60%)",
              }}
            />
            {/* Light catching the top edge on hover */}
            <span
              aria-hidden
              className="via-primary/40 pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />

            <div className="relative flex flex-1 flex-col">
              <div className="from-primary/20 to-primary/5 text-primary ring-primary/10 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 transition-[transform,box-shadow] duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-primary/15">
                <f.icon className="size-5 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">
                {t(`features.items.${f.key}.title`)}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {t(`features.items.${f.key}.body`)}
              </p>
              {Detail ? (
                <div className="mt-auto">
                  <Detail />
                </div>
              ) : null}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
