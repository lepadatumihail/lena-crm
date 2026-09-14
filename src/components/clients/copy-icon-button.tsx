"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COPIED_FOR_MS = 1600;

/**
 * Copies a value to the clipboard. The glyph cross-fades to a check (scale
 * 0.25, 4px blur) and back; the colour and shape change is the static cue,
 * the motion only softens it.
 */
export function CopyIconButton({
  value,
  label,
  className,
}: {
  value: string;
  /** Accessible name and tooltip, e.g. "Copy email". */
  label: string;
  className?: string;
}) {
  const tCommon = useTranslations("common");
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_FOR_MS);
    } catch {
      toast.error(tCommon("errors.tryAgain"));
    }
  }

  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.25, filter: "blur(4px)" };
  const shown = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, filter: "blur(0px)" };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "copied" : "copy"}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className="flex"
        >
          {copied ? <Check className="text-success" /> : <Copy />}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {copied ? tCommon("copied") : ""}
      </span>
    </Button>
  );
}
