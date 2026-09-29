import Link from "next/link";
import { createTranslator } from "next-intl";
import { ArrowRight } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { TOOL_ROUTES, marketingPath } from "@/lib/routes";

/**
 * One card per free tool, for the /tools hub: the same label and blurb as the
 * footer's "Free tools" column, so a new tool shows up in both. It sits in the
 * hub's article, whose link styles would underline a whole card, hence the
 * two `!` overrides and spans rather than headings and paragraphs.
 */
export function ToolCards({ locale }: { locale: AppLocale }) {
  const t = createTranslator({ locale, messages: messagesFor(locale), namespace: "marketing.routes" });
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      {TOOL_ROUTES.map((route) => (
        <Link
          key={route}
          href={marketingPath(route, locale)}
          className="bg-card hover:bg-muted/40 group flex h-full flex-col rounded-2xl border p-6 font-normal! no-underline! shadow-xs transition-colors"
        >
          <span className="font-medium">{t(`${route}.label`)}</span>
          <span className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t(`${route}.blurb`)}
          </span>
          <ArrowRight
            className="text-muted-foreground group-hover:text-foreground mt-4 size-4 transition-[color,translate] duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
