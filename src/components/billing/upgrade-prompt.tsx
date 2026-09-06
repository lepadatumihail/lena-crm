import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";

/** Shown instead of the new-client form when a Free agent is at the cap. */
export function UpgradePrompt({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
          <Lock className="size-5" />
        </div>
        <CardTitle>You&apos;ve used your {FREE_CLIENT_LIMIT} free clients</CardTitle>
        <CardDescription className="text-pretty">
          Pro is unlimited: €{PRICES.standard.monthly} a month, or €{PRICES.founding.monthly} a
          month for life while spots for the first {FOUNDING_CAP}{" "}
          paying agents last. Everything
          you&apos;ve added stays exactly where it is.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/pricing">
            See plans <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={backHref}>
            <ArrowLeft /> {backLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
