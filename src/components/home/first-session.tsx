import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronRight,
  ClipboardPaste,
  Plus,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { Greeting } from "@/components/home/greeting";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

type EntryKey = "import" | "paste" | "manual";

/** The three ways in, buyers first. The spreadsheet leads: it fills the book in one go. */
const ENTRIES: { key: EntryKey; href: string; icon: LucideIcon; featured?: boolean }[] = [
  { key: "import", href: "/clients/import?side=buyer", icon: Upload, featured: true },
  { key: "paste", href: "/clients/new?side=buyer&paste=1", icon: ClipboardPaste },
  { key: "manual", href: "/clients/new?side=buyer", icon: Plus },
];

const SELLER_LINK =
  "text-foreground font-medium underline underline-offset-4 decoration-foreground/25 hover:decoration-foreground";

/**
 * Home before the first client: the greeting, the ways to bring clients in,
 * and the one-line getting-started strip. The figures and panels that would
 * all read zero wait until there is a client to count.
 */
export function FirstSession({
  notice,
  onboarding,
  now,
}: {
  notice?: ReactNode;
  /** The getting-started strip, streamed by the page (null once hidden). */
  onboarding?: ReactNode;
  now: Date;
}) {
  const t = useTranslations("home.firstSession");
  return (
    <div className="flex flex-col gap-5">
      {notice}
      <Greeting nowISO={now.toISOString()} subtitle={t("subtitle")} />
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
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
      {onboarding}
    </div>
  );
}

/**
 * A way in. From sm up a card: icon and kicker, title, what it does, and the
 * action. On a phone a compact row: icon, title, up to two lines of detail and a
 * chevron, so all three fit above the fold. The featured card is marked by a
 * darker border and a filled grey kicker, not by colour.
 */
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
  const kickerTone = featured ? "grey" : "neutral";
  return (
    <Link
      href={href}
      className={cn(
        "bg-card text-card-foreground hover:bg-muted/40 focus-visible:ring-ring/50 group flex min-w-0 items-center gap-3 rounded-xl border p-3 shadow-xs transition-colors duration-150 outline-none focus-visible:ring-[3px] sm:flex-col sm:items-stretch sm:p-4",
        featured && "border-foreground/20"
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="bg-muted text-foreground/70 flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9">
          <Icon className="size-[18px] sm:size-5" strokeWidth={1.5} />
        </span>
        <Tag tone={kickerTone} className="max-sm:hidden">
          {kicker}
        </Tag>
      </div>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium sm:whitespace-normal">{title}</span>
        <span className="text-muted-foreground mt-0.5 line-clamp-2 text-[13px] leading-snug sm:line-clamp-none sm:leading-relaxed sm:text-pretty">
          {detail}
        </span>
      </span>
      <span className="text-foreground inline-flex items-center gap-1 text-sm max-sm:hidden">
        {action}
        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
      <ChevronRight
        aria-hidden
        className="text-muted-foreground size-4 shrink-0 sm:hidden"
      />
    </Link>
  );
}
