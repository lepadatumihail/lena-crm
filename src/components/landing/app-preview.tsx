"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, MessageCircle, Search, Star } from "lucide-react";

import { sideLabel, stageLabel } from "@/i18n/labels";
import { cn } from "@/lib/utils";

type ColId = "qualified" | "viewing" | "reserved";

type Card = {
  id: string;
  name: string;
  meta: string;
  initials: string;
  avatar: string;
  offer?: string;
  priority?: boolean;
};

type Board = Record<ColId, Card[]>;

const COLUMNS: { id: ColId; dot: string }[] = [
  { id: "qualified", dot: "bg-primary" },
  { id: "viewing", dot: "bg-warning" },
  { id: "reserved", dot: "bg-success" },
];

// Sample records. Names and their property/budget lines play real rows in the
// mock board, so they read the same in every UI language.
const CARDS: Record<string, Card> = {
  sofia: {
    id: "sofia",
    name: "Sofia Müller",
    meta: "Apartment · €600–800k",
    initials: "SM",
    avatar: "bg-primary/15 text-primary",
    priority: true,
  },
  james: {
    id: "james",
    name: "James Carter",
    meta: "Villa · Nueva Andalucía",
    initials: "JC",
    avatar: "bg-accent text-accent-foreground",
  },
  anya: {
    id: "anya",
    name: "Anya Petrova",
    meta: "Penthouse · Marbella",
    initials: "AP",
    avatar: "bg-secondary text-secondary-foreground",
  },
  olivia: {
    id: "olivia",
    name: "Olivia Brown",
    meta: "5 properties viewed",
    initials: "OB",
    avatar: "bg-warning/20 text-warning",
    offer: "€710k",
  },
  lars: {
    id: "lars",
    name: "Lars Nielsen",
    meta: "Apartment · Estepona",
    initials: "LN",
    avatar: "bg-primary/15 text-primary",
  },
  marie: {
    id: "marie",
    name: "Marie Dubois",
    meta: "Notary · 14 Jun",
    initials: "MD",
    avatar: "bg-success/20 text-success",
  },
  tom: {
    id: "tom",
    name: "Tom Wright",
    meta: "Villa · Benahavís",
    initials: "TW",
    avatar: "bg-warning/20 text-warning",
  },
};

function initialBoard(): Board {
  return {
    qualified: [CARDS.sofia, CARDS.james, CARDS.anya],
    viewing: [CARDS.olivia, CARDS.lars],
    reserved: [CARDS.marie],
  };
}

function move(board: Board, from: ColId, to: ColId, id: string): Board {
  const card = board[from].find((c) => c.id === id);
  if (!card) return board;
  const next: Board = {
    qualified: [...board.qualified],
    viewing: [...board.viewing],
    reserved: [...board.reserved],
  };
  next[from] = next[from].filter((c) => c.id !== id);
  next[to] = [card, ...next[to]];
  return next;
}

type ToastTone = "primary" | "warning" | "success" | "whatsapp";
/** Toasts carry a kind, not text: the copy is translated at render time. */
type ToastKind = "moved" | "newLead" | "offerAccepted" | "reminderSent";
type Toast = {
  id: number;
  kind: ToastKind;
  tone: ToastTone;
  icon: React.ComponentType<{ className?: string }>;
};

const TOAST_TONES: Record<ToastTone, string> = {
  primary: "text-primary",
  warning: "text-warning",
  success: "text-success",
  whatsapp: "text-[#25D366]",
};

export function AppPreview() {
  const t = useTranslations("landing");
  const tCrm = useTranslations("crm");
  const reduced = useReducedMotion();
  const [board, setBoard] = useState<Board>(initialBoard);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stepRef = useRef(0);
  const toastIdRef = useRef(0);

  useEffect(() => {
    if (reduced) return;

    function pushToast(kind: ToastKind, tone: ToastTone, icon: Toast["icon"]) {
      const id = ++toastIdRef.current;
      setToasts((t) => [...t, { id, kind, tone, icon }].slice(-2));
      setTimeout(
        () => setToasts((t) => t.filter((x) => x.id !== id)),
        2600
      );
    }

    const interval = setInterval(() => {
      const step = stepRef.current % 5;
      stepRef.current += 1;
      if (step === 0) {
        setBoard((b) => move(b, "qualified", "viewing", "sofia"));
        pushToast("moved", "primary", ArrowRight);
      } else if (step === 1) {
        setBoard((b) => ({ ...b, qualified: [CARDS.tom, ...b.qualified] }));
        pushToast("newLead", "warning", Search);
      } else if (step === 2) {
        setBoard((b) => move(b, "viewing", "reserved", "olivia"));
        pushToast("offerAccepted", "success", Check);
      } else if (step === 3) {
        pushToast("reminderSent", "whatsapp", MessageCircle);
      } else {
        setBoard(initialBoard());
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [reduced]);

  function toastText(kind: ToastKind): string {
    switch (kind) {
      case "moved":
        return t("preview.toasts.moved", {
          name: CARDS.sofia.name,
          stage: stageLabel(tCrm, "viewing"),
        });
      case "newLead":
        return t("preview.toasts.newLead");
      case "offerAccepted":
        return t("preview.toasts.offerAccepted", { name: CARDS.olivia.name });
      case "reminderSent":
        return t("preview.toasts.reminderSent", { name: "Lars" });
    }
  }

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-4xl">
      <div className="from-primary/12 absolute -inset-x-8 -top-8 -bottom-8 -z-10 rounded-[2.5rem] bg-gradient-to-tr to-transparent blur-2xl" />

      <div className="bg-card mock-lift overflow-hidden rounded-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4">
          <div className="bg-muted inline-flex rounded-lg p-0.5 text-xs">
            <span className="bg-background rounded-md px-2.5 py-1 font-medium shadow-sm">
              {sideLabel(tCrm, "buyer", true)}
            </span>
            <span className="text-muted-foreground px-2.5 py-1">
              {sideLabel(tCrm, "seller", true)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted/60 text-muted-foreground hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs sm:flex">
              <Search className="size-3.5" /> {t("preview.search")}
            </div>
            <span className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs font-medium">
              {t("preview.new")}
            </span>
          </div>
        </div>

        {/* Board */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 p-3 text-left sm:gap-3 sm:p-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className={cn("size-2 rounded-full", col.dot)} />
                    {stageLabel(tCrm, col.id)}
                  </span>
                  <span className="text-muted-foreground bg-muted rounded-full px-1.5 text-[10px]">
                    {board[col.id].length}
                  </span>
                </div>

                <AnimatePresence initial={false} mode="popLayout">
                  {board[col.id].map((card) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="bg-background flex items-center gap-2 rounded-lg border p-2 shadow-sm"
                    >
                      <span
                        className={cn(
                          "hidden size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold sm:flex",
                          card.avatar
                        )}
                      >
                        {card.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="truncate text-[11px] font-medium sm:text-xs">
                            {card.name}
                          </p>
                          {card.priority && (
                            <Star className="fill-warning text-warning size-3 shrink-0" />
                          )}
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate text-[10px] sm:text-[11px]">
                          {card.meta}
                        </p>
                      </div>
                      {card.offer && (
                        <span className="bg-success/15 text-success shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]">
                          {card.offer}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Toasts */}
          <div className="pointer-events-none absolute right-3 bottom-3 flex max-w-[70%] flex-col items-end gap-1.5">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 24, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 24, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="bg-popover flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium shadow-md"
                >
                  <toast.icon
                    className={cn("size-3.5 shrink-0", TOAST_TONES[toast.tone])}
                  />
                  <span className="truncate">{toastText(toast.kind)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
