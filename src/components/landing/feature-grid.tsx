"use client";

import type { CSSProperties, MouseEvent } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Building2,
  Euro,
  FileText,
  Layers,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Layers,
    title: "A pipeline that moves",
    body: "Drag every buyer and seller through clear stages — new, contacted, qualified, viewing, reserved — so nothing stalls.",
  },
  {
    icon: Users,
    title: "Clients in focus",
    body: "Names, languages, nationalities, notes. Flag the hot ones, hide the cold, and always know who to call next.",
  },
  {
    icon: Building2,
    title: "Properties & viewings",
    body: "Log every property a buyer views, attach the window card and photos, and keep the details in one place.",
  },
  {
    icon: Euro,
    title: "Offers, tracked",
    body: "Record each offer against the asking price, so you always know exactly where a deal stands.",
  },
  {
    icon: FileText,
    title: "Documents, organised",
    body: "Contracts, IDs, reservation papers — upload anything and keep it filed against the right client.",
  },
  {
    icon: Tag,
    title: "One CRM, every agency",
    body: "Work with more than one agency? Tag each lead by agency so your whole book finally lives in a single place.",
  },
];

/** Track the cursor inside a card so the spotlight follows it — no re-render. */
function handleMove(e: MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

export function FeatureGrid() {
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
      className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {FEATURES.map((f) => (
        <motion.div
          key={f.title}
          variants={item}
          whileHover={
            reduced
              ? undefined
              : { y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }
          }
          onMouseMove={handleMove}
          style={{ "--mx": "50%", "--my": "0%" } as CSSProperties}
          className="group bg-card relative h-full overflow-hidden rounded-2xl border p-6 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-[0_18px_44px_-16px_rgb(0_0_0/0.22)]"
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

          <div className="relative">
            <div className="from-primary/20 to-primary/5 text-primary ring-primary/10 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 transition-[transform,box-shadow] duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-primary/15">
              <f.icon className="size-5 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110" />
            </div>
            <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {f.body}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
