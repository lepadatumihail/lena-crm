import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";

/** Shown instead of the new-client form when a Free agent is at the cap. */
export function UpgradePrompt({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  const t = useTranslations("billing");
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
          <Lock className="size-5" />
        </div>
        <CardTitle>{t("upgradePrompt.title", { limit: FREE_CLIENT_LIMIT })}</CardTitle>
        <CardDescription className="text-pretty">
          {t("upgradePrompt.description", {
            standard: PRICES.standard.monthly,
            founding: PRICES.founding.monthly,
            cap: FOUNDING_CAP,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/pricing">
            {t("actions.seePlans")} <ArrowRight />
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
