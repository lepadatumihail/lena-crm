"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Menu as MenuIcon, Monitor, Moon, Sun, X } from "lucide-react";

import { LOCALES, LOCALE_LABELS, asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useSwitchLocale } from "@/components/locale-switcher";
import { useThemeSwitch } from "@/components/theme-toggle";
import { MenuTile } from "@/components/marketing/site-menu";
import {
  MENUS,
  menuAt,
  menuHref,
  type SiteMenu,
  type SiteMenuId,
} from "@/components/marketing/site-menu-items";

/**
 * The header's menu below lg: a button at the end of the bar that opens the
 * same menus as the desktop dropdowns, full screen. Its top row repeats the
 * bar (logo left, the close button exactly where the menu button was), so
 * opening it reads as the bar unfolding rather than a new page. Each menu is
 * a section that expands in place; the one holding the current page starts
 * open. Theme and language live at its foot on phones, where the bar has no
 * room for them beside the call to action, and the page's main action closes
 * the list.
 */
export function PhoneMenu({ onHome, action }: { onHome: boolean; action: ReactNode }) {
  const t = useTranslations("nav.marketing");
  const locale = asLocale(useLocale());
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SiteMenuId | null>(() => menuAt(pathname, locale));
  const pricing = onHome ? "#pricing" : marketingPath("pricing", locale);

  // The menu only exists below lg; widening the window past it closes it.
  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia("(min-width: 64rem)");
    const onChange = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("menu.open")}
          className="size-9 rounded-full lg:hidden"
        >
          <MenuIcon className="size-5" strokeWidth={1.75} />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        {/* Unseen under the menu, but Radix locks the page's scroll through
            the overlay: without it a drag on the menu's bar could scroll the
            page behind on iOS. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 lg:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          // Any link in the menu leads somewhere (or scrolls the home page):
          // close. Only the menu's own links: a click in the sign-up dialog
          // opened from its foot bubbles here through the React tree too.
          onClick={(event) => {
            const link = (event.target as Element).closest("a");
            if (link && event.currentTarget.contains(link)) setOpen(false);
          }}
          className="bg-background data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 flex flex-col outline-none data-[state=closed]:duration-150 data-[state=open]:duration-200 lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">{t("menu.title")}</DialogPrimitive.Title>

          {/* The header bar's geometry (NavFrame): same strip, same pill box. */}
          <div className="mx-3 mt-2 flex h-12 shrink-0 items-center justify-between border border-transparent pr-2 pl-4">
            <Link href={marketingPath("home", locale)} className="flex shrink-0 items-center gap-2">
              <Logo
                className="max-sm:text-sm"
                markClassName="max-sm:size-6"
                wordmarkClassName="max-[374px]:sr-only"
              />
            </Link>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("menu.close")}
                className="size-9 rounded-full"
              >
                <X
                  className="size-5 motion-safe:animate-[agent-pop_0.3s_var(--ease-standard)_both]"
                  strokeWidth={1.75}
                />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <nav
            aria-label={t("menu.label")}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <ul className="mx-auto w-full max-w-xl px-5 pt-3 pb-6">
              {MENUS.map((menu, index) => (
                <Section
                  key={menu.id}
                  menu={menu}
                  index={index}
                  expanded={section === menu.id}
                  onToggle={() => setSection((current) => (current === menu.id ? null : menu.id))}
                  onHome={onHome}
                  pathname={pathname}
                />
              ))}
              <li
                className="motion-safe:animate-[fade-up_0.45s_var(--ease-out-quint)_both]"
                style={{ animationDelay: `${60 + MENUS.length * 40}ms` }}
              >
                <Link
                  href={pricing}
                  aria-current={pathname === marketingPath("pricing", locale) ? "page" : undefined}
                  className="focus-visible:ring-ring/40 flex h-14 items-center rounded-md text-[17px] outline-none focus-visible:ring-[3px]"
                >
                  {t("pricing")}
                </Link>
              </li>
            </ul>
          </nav>

          <div
            className="mx-auto w-full max-w-xl shrink-0 space-y-3 border-t px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] motion-safe:animate-[fade-up_0.45s_var(--ease-out-quint)_both]"
            style={{ animationDelay: `${100 + MENUS.length * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <ThemeChoice />
              <LanguageChoice />
            </div>
            {action}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** One menu as a row that expands in place to its pages. */
function Section({
  menu,
  index,
  expanded,
  onToggle,
  onHome,
  pathname,
}: {
  menu: SiteMenu;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onHome: boolean;
  pathname: string;
}) {
  const t = useTranslations("nav.marketing");
  const tRoutes = useTranslations("marketing.routes");
  const locale = asLocale(useLocale());
  const panelId = `phone-menu-${menu.id}`;
  // A menu of one group needs no label under its own name; Guides has two.
  const labelled = menu.groups.length > 1;

  return (
    <li
      className="border-border/70 border-b motion-safe:animate-[fade-up_0.45s_var(--ease-out-quint)_both]"
      style={{ animationDelay: `${60 + index * 40}ms` }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="focus-visible:ring-ring/40 flex h-14 w-full items-center justify-between rounded-md text-left text-[17px] outline-none select-none focus-visible:ring-[3px]"
      >
        {t(`menu.${menu.id}`)}
        <ChevronDown
          aria-hidden
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-300 ease-(--ease-out-quint)",
            expanded && "rotate-180"
          )}
        />
      </button>
      {/* Rows animate open by height (0fr → 1fr), which no transform can do.
          The region reaches 8px past the column on each side, so a row's
          highlight isn't cut off by the clip the animation needs, while its
          icon still lines up with the section names. */}
      <div
        id={panelId}
        className={cn(
          "-mx-2 grid transition-[grid-template-rows] duration-300 ease-(--ease-out-quint) motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden" inert={!expanded}>
          <div className="pb-3">
            {menu.groups.map((group) => (
              <div key={group.key}>
                {labelled ? (
                  <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs">
                    {t(`menu.groups.${group.key}`)}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const href = menuHref(item.key, locale, onHome);
                    return (
                      <li key={item.key}>
                        <Link
                          href={href}
                          aria-current={href === pathname ? "page" : undefined}
                          className="group/item active:bg-muted aria-[current=page]:bg-muted/70 focus-visible:ring-ring/40 flex items-center gap-3 rounded-[14px] p-2 outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-inset"
                        >
                          <MenuTile icon={item.icon} className="size-9 rounded-[10px]" />
                          <span className="min-w-0">
                            <span className="block text-[15px] leading-5">
                              {item.key === "howItWorks"
                                ? t("howItWorks")
                                : tRoutes(`${item.key}.label`)}
                            </span>
                            <span className="text-muted-foreground block text-[13px] leading-[18px] text-pretty">
                              {t(`menu.items.${item.key}`)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {menu.more ? (
              <Link
                href={marketingPath(menu.more, locale)}
                aria-current={marketingPath(menu.more, locale) === pathname ? "page" : undefined}
                className="text-foreground/80 active:bg-muted aria-[current=page]:bg-muted/70 focus-visible:ring-ring/40 mt-0.5 flex items-center gap-2 rounded-[14px] p-2 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-inset"
              >
                {tRoutes(`${menu.more}.label`)}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Two small segmented controls, so a choice is one tap, not a menu in a menu. */
const SEGMENTS = "bg-muted inline-flex shrink-0 items-center rounded-full p-1";
// The chosen segment is a raised pill: white on the grey track by day, a
// lighter grey on the dark track at night (the page's ground would read as
// a hole there).
const SEGMENT =
  "text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground dark:aria-pressed:bg-white/[0.14] focus-visible:ring-ring/40 inline-flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-[13px] outline-none transition-[color,background-color,box-shadow] duration-150 select-none focus-visible:ring-[3px] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.08)] dark:aria-pressed:shadow-none disabled:opacity-60";

const THEMES = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

function ThemeChoice() {
  const t = useTranslations("nav.menu");
  const { theme, switchTheme } = useThemeSwitch();
  return (
    <div role="group" aria-label={t("theme")} className={SEGMENTS}>
      {THEMES.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          aria-label={t(value)}
          title={t(value)}
          onClick={() => switchTheme(value)}
          className={SEGMENT}
        >
          <Icon aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function LanguageChoice() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { pending, switchTo } = useSwitchLocale();
  return (
    <div role="group" aria-label={t("language")} className={SEGMENTS}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          aria-label={LOCALE_LABELS[l]}
          title={LOCALE_LABELS[l]}
          disabled={pending}
          onClick={() => {
            if (l !== locale) switchTo(l);
          }}
          className={cn(SEGMENT, "uppercase")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
