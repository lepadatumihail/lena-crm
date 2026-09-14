"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";

import { setLocale } from "@/i18n/actions";
import { LOCALES, LOCALE_LABELS, isLocale, type AppLocale } from "@/i18n/config";
import { marketingCounterpart } from "@/lib/routes";
import { cn } from "@/lib/utils";
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

/** Compact EN / ES toggle for the marketing pages and sign-in. */
export function LocaleToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { pending, switchTo } = useSwitchLocale();
  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "flex items-center rounded-md border p-0.5 text-xs font-medium",
        className
      )}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => l !== locale && switchTo(l)}
          disabled={pending}
          aria-pressed={l === locale}
          className={cn(
            "rounded-sm px-2 py-1 uppercase transition-colors",
            l === locale
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
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
