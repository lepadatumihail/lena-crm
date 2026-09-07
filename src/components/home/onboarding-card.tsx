import Link from "next/link";
import { ArrowRight, CircleCheck, ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="text-primary size-4" />
          {title}
          <span className="text-muted-foreground ml-auto text-xs font-normal">
            {subtitle}
          </span>
        </CardTitle>
        <div
          className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {steps.map((s) => {
            const inner = (
              <>
                <CircleCheck
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    s.done ? "text-success" : "text-muted-foreground/40"
                  )}
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
                  {!s.done && (
                    <span className="text-muted-foreground block text-xs">
                      {s.detail}
                    </span>
                  )}
                </span>
                {!s.done && (
                  <ArrowRight className="text-muted-foreground size-4 shrink-0 self-center" />
                )}
              </>
            );
            return (
              <li key={s.step}>
                {s.done ? (
                  <div className="flex items-start gap-3 rounded-lg border border-dashed p-3">
                    {inner}
                  </div>
                ) : (
                  <Link
                    href={STEP_HREF[s.step]}
                    className="hover:bg-accent flex items-start gap-3 rounded-lg border p-3 transition-colors"
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
