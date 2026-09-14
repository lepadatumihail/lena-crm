"use client";

import { useTranslations } from "next-intl";

import { useAgentFirstName } from "@/components/shell/shell-context";
import type { GreetingPeriod } from "@/lib/home";

/** "Good afternoon, Mihail": the period from the server's clock, the name from the shell. */
export function Greeting({ period }: { period: GreetingPeriod }) {
  const t = useTranslations("home.greeting");
  const firstName = useAgentFirstName();
  return (
    <h2 className="truncate text-xl font-semibold tracking-tight">
      {t(period, { name: firstName ? t("named", { name: firstName }) : "" })}
    </h2>
  );
}
