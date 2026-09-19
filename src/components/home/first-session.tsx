import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ClipboardPaste,
  Plus,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { Greeting } from "@/components/home/greeting";
import { GettingStarted } from "@/components/home/onboarding-card";
import { Tag } from "@/components/ui/tag";
import type { OnboardingInput } from "@/lib/home";
import { cn } from "@/lib/utils";

type EntryKey = "import" | "paste" | "manual";

/** The three ways in, buyers first. The spreadsheet leads: it fills the book in one go. */
const ENTRIES: { key: EntryKey; href: string; icon: LucideIcon; featured?: boolean }[] = [
  { key: "import", href: "/clients/import?side=buyer", icon: Upload, featured: true },
  { key: "paste", href: "/clients/new?side=buyer&paste=1", icon: ClipboardPaste },
  { key: "manual", href: "/clients/new?side=buyer", icon: Plus },
];

const SELLER_LINK =
  "text-foreground font-medium underline-offset-4 hover:underline";

/**
 * Home before the first client: the greeting, the ways to bring clients in,
 * and the getting-started checklist. The figures and panels that would all
 * read zero wait until there is a client to count.
 */
export function FirstSession({
  notice,
  onboarding,
  now,
}: {
  notice?: ReactNode;
  onboarding: OnboardingInput;
  now: Date;
}) {
  const t = useTranslations("home.firstSession");
  return (
    <div className="space-y-5">
      {notice}
      <Greeting nowISO={now.toISOString()} subtitle={t("subtitle")} />
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {ENTRIES.map((entry) => (
            <EntryCard
              key={entry.key}
              href={entry.href}
              icon={entry.icon}
              featured={entry.featured}
              kicker={t(`entries.${entry.key}.kicker`)}
              title={t(`entries.${entry.key}.title`)}
              detail={t(`entries.${entry.key}.detail`)}
              action={t(`entries.${entry.key}.action`)}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          {t.rich("sellers", {
            add: (chunks) => (
              <Link href="/clients/new?side=seller" className={SELLER_LINK}>
                {chunks}
              </Link>
            ),
            import: (chunks) => (
              <Link href="/clients/import?side=seller" className={SELLER_LINK}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
      <GettingStarted onboarding={onboarding} />
    </div>
  );
}

function EntryCard({
  href,
  icon: Icon,
  featured = false,
  kicker,
  title,
  detail,
  action,
}: {
  href: string;
  icon: LucideIcon;
  featured?: boolean;
  kicker: string;
  title: string;
  detail: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-card text-card-foreground hover:bg-muted/40 focus-visible:ring-ring/50 group flex min-w-0 flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors duration-150 outline-none focus-visible:ring-[3px]",
        featured && "border-primary/40 ring-1 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            featured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" strokeWidth={1.5} />
        </span>
        <Tag tone={featured ? "brand" : "neutral"}>{kicker}</Tag>
      </div>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-muted-foreground mt-0.5 block text-[13px] leading-relaxed text-pretty">
          {detail}
        </span>
      </span>
      <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
        {action}
        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
