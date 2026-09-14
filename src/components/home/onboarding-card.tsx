import Link from "next/link";
import { ArrowRight, CircleCheck, ListChecks } from "lucide-react";

import { Panel } from "@/components/shell/panel";
import type { OnboardingStep } from "@/lib/home";
import { cn } from "@/lib/utils";

const STEP_HREF: Record<OnboardingStep, string> = {
  addClient: "/clients/new?side=buyer",
  scheduleAppointment: "/calendar",
  createTemplate: "/templates",
  inviteColleague: "/referrals",
};

/** The "getting started" checklist for young accounts. */
export function OnboardingCard({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: { step: OnboardingStep; done: boolean; title: string; detail: string }[];
}) {
  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);

  return (
    <Panel
      title={title}
      icon={<ListChecks className="size-3.5" />}
      action={
        <span className="text-muted-foreground text-xs tabular-nums">
          {subtitle}
        </span>
      }
    >
      <div className="px-4 pt-3">
        <div
          className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300 ease-(--ease-standard)"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <ul className="grid gap-1 p-2 sm:grid-cols-2">
        {steps.map((s) => {
          const inner = (
            <>
              <CircleCheck
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  s.done ? "text-success" : "text-muted-foreground/40"
                )}
                strokeWidth={1.75}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    s.done && "text-muted-foreground line-through"
                  )}
                >
                  {s.title}
                </span>
                {!s.done ? (
                  <span className="text-muted-foreground block text-xs">
                    {s.detail}
                  </span>
                ) : null}
              </span>
              {!s.done ? (
                <ArrowRight className="text-muted-foreground size-4 shrink-0 self-center" />
              ) : null}
            </>
          );
          return (
            <li key={s.step}>
              {s.done ? (
                <div className="flex items-start gap-3 rounded-lg px-3 py-2.5">
                  {inner}
                </div>
              ) : (
                <Link
                  href={STEP_HREF[s.step]}
                  className="hover:bg-muted/50 flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150"
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
