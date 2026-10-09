"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Languages } from "lucide-react";

import { setLocale } from "@/i18n/actions";
import { LOCALES, LOCALE_LABELS, isLocale, type AppLocale } from "@/i18n/config";
import { marketingCounterpart } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const switchTo = (locale: AppLocale) =>
    startTransition(async () => {
      await setLocale(locale);
      // Marketing pages have one URL per language: go there, so the address
      // bar, hreflang and the cookie agree. The app simply re-renders.
      const twin = marketingCounterpart(pathname, locale);
      if (twin && twin !== pathname) router.push(twin);
      else router.refresh();
    });
  return { pending, switchTo };
}

/**
 * The language menu on the marketing pages: a compact trigger with the
 * current code, opening every language by its own name. A row of one button
 * per language stopped fitting the phone header at three.
 */
export function LocaleMenu({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { pending, switchTo } = useSwitchLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label={`${t("language")}: ${isLocale(locale) ? LOCALE_LABELS[locale] : locale}`}
        className={cn(
          "text-muted-foreground hover:text-foreground data-[state=open]:text-foreground flex h-8 items-center gap-1 rounded-md px-2 text-xs uppercase outline-none transition-colors",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:size-3.5",
          className
        )}
      >
        <Languages aria-hidden />
        {locale}
        <ChevronDown aria-hidden className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            lang={l}
            onSelect={() => {
              if (l !== locale) switchTo(l);
            }}
          >
            <span className="w-4">{l === locale ? <Check className="size-4" /> : null}</span>
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Language picker for the app sidebar footer. */
export function LocaleSelect({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { pending, switchTo } = useSwitchLocale();
  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (isLocale(value) && value !== locale) switchTo(value);
      }}
      disabled={pending}
    >
      <SelectTrigger
        size="sm"
        aria-label={t("language")}
        className={cn("w-full text-xs", className)}
      >
        <Languages className="size-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((l) => (
          <SelectItem key={l} value={l}>
            {LOCALE_LABELS[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
