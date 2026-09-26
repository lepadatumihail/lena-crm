"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, ChevronDown, Lock, X } from "lucide-react";
import { toast } from "sonner";

import { useAgentId } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import {
  INVITE_UNLOCK_CLIENTS,
  nextOnboardingStep,
  onboardingCookie,
  onboardingExpected,
  onboardingProgress,
  onboardingState,
  onboardingSteps,
  readOnboardingCookie,
  type OnboardingCookieValue,
  type OnboardingInput,
  type OnboardingStep,
  type OnboardingStepState,
} from "@/lib/home";
import { TONE_BG, TONE_INK } from "@/lib/tones";
import { cn } from "@/lib/utils";

const STEP_HREF: Record<OnboardingStep, string> = {
  addName: "/settings",
  addClient: "/clients/import?side=buyer",
  scheduleAppointment: "/calendar?new=1",
  createTemplate: "/templates",
  inviteColleague: "/referrals",
};

/**
 * Getting started as one 44px line above the figures: a progress ring, how
 * many of the required steps are done, and a link to the next one. The
 * chevron opens the whole checklist underneath; the X hides the strip on
 * this device (a cookie the page reads, so it never flashes back), and the
 * account menu brings it back.
 */
export function GettingStartedStrip({ onboarding }: { onboarding: OnboardingInput }) {
  const t = useTranslations("home.onboarding");
  const router = useRouter();
  const agentId = useAgentId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  const steps = onboardingSteps(onboarding);
  const { done, total } = onboardingProgress(onboarding);
  const next = nextOnboardingStep(onboarding);

  function close() {
    document.cookie = onboardingCookie("hidden", agentId);
    setClosed(true);
    toast(t("hidden"));
    // Drops this Home from the router cache, so Back cannot bring the strip back.
    router.refresh();
  }

  const toggleLabel = open ? t("hideSteps") : t("showSteps");

  return (
    <section
      aria-label={t("title")}
      className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-xs"
    >
      <div className="flex h-[42px] items-center gap-2.5 pr-1.5 pl-3 sm:pl-4">
        <ProgressRing
          done={done}
          total={total}
          label={t("title")}
          valueText={t("progressLabel", { done, total })}
        />
        <span className="hidden shrink-0 text-sm font-medium sm:inline">{t("title")}</span>
        <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
          {t("progress", { done, total })}
        </span>
        {next ? (
          <>
            <span aria-hidden className="text-muted-foreground/60 shrink-0">
              ·
            </span>
            <Link
              href={STEP_HREF[next]}
              className="group/next focus-visible:ring-ring/50 flex min-w-0 items-center gap-1 rounded-sm text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]"
            >
              {/* The step's short name, and no "Next:" on a phone, so the
                  line reads in full at 375px in both languages. */}
              <span className="truncate">
                {t.rich("next", {
                  step: t(`steps.${next}.short`),
                  muted: (chunks) => (
                    <span className="text-muted-foreground max-sm:hidden">{chunks}</span>
                  ),
                })}
              </span>
              <ArrowRight
                aria-hidden
                className="size-3.5 shrink-0 transition-transform duration-150 group-hover/next:translate-x-0.5"
              />
            </Link>
          </>
        ) : null}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDown
              className={cn(
                "transition-transform duration-200 ease-(--ease-standard)",
                open && "rotate-180"
              )}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
            aria-label={t("dismiss")}
            title={t("dismiss")}
            onClick={close}
          >
            <X />
          </Button>
        </div>
      </div>
      <ul id={listId} hidden={!open} className="border-t py-1">
        {steps.map((s) => (
          <StepRow key={s.step} state={s} />
        ))}
      </ul>
    </section>
  );
}

/** One checklist line: a mark, the step, and on a wide screen what it is for. */
function StepRow({ state: s }: { state: OnboardingStepState }) {
  const t = useTranslations("home.onboarding");
  const detail = s.locked
    ? t("steps.inviteColleague.locked", { count: INVITE_UNLOCK_CLIENTS })
    : t(`steps.${s.step}.detail`);
  const row = "flex h-9 items-center gap-2.5 px-3 text-sm sm:px-4";

  const inner = (
    <>
      <StepMark done={s.done} locked={s.locked} />
      {s.done ? <span className="sr-only">{t("stepDone")}</span> : null}
      <span
        className={cn(
          "min-w-0 truncate md:shrink-0",
          (s.done || s.locked) && "text-muted-foreground"
        )}
      >
        {t(`steps.${s.step}.title`)}
      </span>
      {s.optional ? (
        <span className="text-muted-foreground shrink-0 text-xs">{t("optional")}</span>
      ) : null}
      {!s.done ? (
        // Read out on a phone too, where there is no room to show it.
        <span className="text-muted-foreground min-w-0 truncate text-xs max-md:sr-only">
          {detail}
        </span>
      ) : null}
      {!s.done && !s.locked ? (
        <ArrowRight
          aria-hidden
          className="text-muted-foreground ml-auto size-3.5 shrink-0 opacity-0 transition-opacity duration-150 group-hover/step:opacity-100 max-md:opacity-100"
        />
      ) : null}
    </>
  );

  return (
    <li>
      {s.done || s.locked ? (
        <div className={row}>{inner}</div>
      ) : (
        <Link
          href={STEP_HREF[s.step]}
          className={cn(
            row,
            "group/step hover:bg-muted/50 focus-visible:ring-ring/50 outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-inset"
          )}
        >
          {inner}
        </Link>
      )}
    </li>
  );
}

/** Done: a pale green check. To do: an empty ring. Locked: a small lock. */
function StepMark({ done, locked }: { done: boolean; locked: boolean }) {
  if (done) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full",
          TONE_BG.green,
          TONE_INK.green
        )}
      >
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (locked) {
    return (
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        <Lock className="text-muted-foreground/70 size-3.5" strokeWidth={1.75} />
      </span>
    );
  }
  return (
    <span aria-hidden className="border-foreground/25 size-4 shrink-0 rounded-full border-[1.5px]" />
  );
}

const RING_RADIUS = 6;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** A 16px ink ring that fills as the required steps get done. */
function ProgressRing({
  done,
  total,
  label,
  valueText,
}: {
  done: number;
  total: number;
  label: string;
  valueText: string;
}) {
  const share = total === 0 ? 0 : done / total;
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={valueText}
      className="shrink-0"
    >
      <svg viewBox="0 0 16 16" className="size-4 -rotate-90" aria-hidden>
        <circle
          cx="8"
          cy="8"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="2"
          className="stroke-foreground/15"
        />
        {/* A zero-length arc with round caps would still draw a dot. */}
        {share > 0 ? (
          <circle
            cx="8"
            cy="8"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - share)}
            className="stroke-foreground transition-[stroke-dashoffset] duration-300 ease-(--ease-standard)"
          />
        ) : null}
      </svg>
    </span>
  );
}

/**
 * Remembers on this device that the strip has nothing left to show (the
 * steps are done, or the book outgrew them), so Home and its loading
 * skeleton stop holding a place for it. Renders nothing.
 */
export function RememberOnboarding({ value }: { value: OnboardingCookieValue }) {
  const agentId = useAgentId();
  useEffect(() => {
    document.cookie = onboardingCookie(value, agentId);
  }, [value, agentId]);
  return null;
}

const noSubscription = () => () => {};

/**
 * Shows its children (the strip's skeleton, in loading.tsx) only while this
 * device still expects the strip. loading.tsx cannot read cookies on the
 * server without losing its instant prefetch, so the browser reads it; the
 * server render leaves the place out.
 */
export function IfOnboardingExpected({ children }: { children: ReactNode }) {
  const agentId = useAgentId();
  const expected = useSyncExternalStore(
    noSubscription,
    () => onboardingExpected(onboardingState(readOnboardingCookie(document.cookie), agentId)),
    () => false
  );
  return expected ? children : null;
}
