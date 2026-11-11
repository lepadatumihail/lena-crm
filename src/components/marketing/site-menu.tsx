"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown } from "lucide-react";

import { asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MENUS,
  menuAt,
  menuHref,
  type MenuIcon,
  type SiteMenu as Menu,
  type SiteMenuId,
} from "@/components/marketing/site-menu-items";

/** How long the pointer rests on a trigger before its menu opens. */
const OPEN_DELAY = 90;
/** Grace after the pointer leaves, so a diagonal move toward the panel keeps it. */
const CLOSE_DELAY = 160;

/**
 * The menus beside the logo on wide screens: Product, Tools and Guides open
 * a panel of pages, each with an icon, its name and one line on what it's
 * for; Pricing is a plain link. Below lg the phone menu takes over.
 *
 * A menu opens when the pointer rests on its trigger, and on a click or a
 * key press. Moving across to the next trigger swaps the panels at once
 * (only the first one fades in). A click on a menu that hovering opened
 * pins it, rather than closing it under the cursor. Escape, a click
 * elsewhere or focus leaving the menu closes it.
 *
 * The panels are always in the HTML, so their links are real links for
 * search engines; closed, they are display:none (`.menu-panel` in
 * globals.css), which keeps them out of the tab order and stops Next from
 * prefetching fifteen pages on every visit. They prefetch once opened.
 */
export function SiteMenu({ onHome }: { onHome: boolean }) {
  const t = useTranslations("nav.marketing");
  const locale = asLocale(useLocale());
  const pathname = usePathname();
  const here = menuAt(pathname, locale);
  const pricing = onHome ? "#pricing" : marketingPath("pricing", locale);
  const onPricing = pathname === marketingPath("pricing", locale);

  const [open, setOpen] = useState<SiteMenuId | null>(null);
  const [instant, setInstant] = useState(false);
  // Event handlers and timers read these rather than state, so a timer set
  // a moment ago never acts on a stale menu.
  const openRef = useRef<SiteMenuId | null>(null);
  const hoverOpened = useRef(false);
  const timers = useRef({ open: 0, close: 0 });
  const navRef = useRef<HTMLElement>(null);
  const triggers = useRef<Partial<Record<SiteMenuId, HTMLButtonElement | null>>>({});
  const baseId = useId();

  const clearTimers = useCallback(() => {
    window.clearTimeout(timers.current.open);
    window.clearTimeout(timers.current.close);
  }, []);

  const show = useCallback(
    (id: SiteMenuId, byHover: boolean) => {
      clearTimers();
      hoverOpened.current = byHover;
      const current = openRef.current;
      openRef.current = id;
      setInstant(current !== null && current !== id);
      setOpen(id);
    },
    [clearTimers]
  );

  const hide = useCallback(() => {
    clearTimers();
    openRef.current = null;
    hoverOpened.current = false;
    setInstant(false);
    setOpen(null);
  }, [clearTimers]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.open);
      window.clearTimeout(pending.close);
    };
  }, []);

  // A panel hangs from its trigger's left edge. The two-column Guides panel,
  // in Spanish or Russian on a window just over lg, would run past the right
  // edge: slide it left by the difference, before it paints. Measured from
  // layout boxes, not the panel's own rect, which its entrance scales.
  useLayoutEffect(() => {
    if (!open) return;
    const panel = document.getElementById(`${baseId}-${open}`);
    const card = panel?.firstElementChild;
    if (!panel || !(card instanceof HTMLElement) || !panel.parentElement) return;
    const place = () => {
      const left = panel.parentElement!.getBoundingClientRect().left - 16;
      const overflow = left + card.offsetWidth - (document.documentElement.clientWidth - 16);
      panel.style.setProperty("--menu-shift", `${Math.min(0, -overflow)}px`);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, baseId]);

  // A tap or click anywhere else closes an open menu (touch screens have no
  // pointer to leave with).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) hide();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, hide]);

  return (
    <nav
      ref={navRef}
      aria-label={t("menu.label")}
      className="hidden lg:block"
      onKeyDown={(event) => {
        const id = openRef.current;
        if (event.key !== "Escape" || !id) return;
        hide();
        triggers.current[id]?.focus();
      }}
    >
      <ul data-instant={instant || undefined} className="flex items-center gap-0.5">
        {MENUS.map((menu) => {
          const isOpen = open === menu.id;
          const panelId = `${baseId}-${menu.id}`;
          return (
            <li
              key={menu.id}
              className="relative"
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                window.clearTimeout(timers.current.close);
                if (openRef.current === menu.id) return;
                if (openRef.current === null) {
                  window.clearTimeout(timers.current.open);
                  timers.current.open = window.setTimeout(
                    () => show(menu.id, true),
                    OPEN_DELAY
                  );
                } else {
                  show(menu.id, true);
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== "mouse") return;
                window.clearTimeout(timers.current.open);
                // A menu opened with a click stays until a click elsewhere.
                if (openRef.current !== menu.id || !hoverOpened.current) return;
                timers.current.close = window.setTimeout(hide, CLOSE_DELAY);
              }}
              onBlur={(event) => {
                if (
                  openRef.current === menu.id &&
                  !event.currentTarget.contains(event.relatedTarget as Node | null)
                ) {
                  hide();
                }
              }}
            >
              <Button
                ref={(node) => {
                  triggers.current[menu.id] = node;
                }}
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-state={isOpen ? "open" : "closed"}
                data-current={here === menu.id || undefined}
                onClick={(event) => {
                  if (openRef.current !== menu.id) {
                    show(menu.id, false);
                  } else if (hoverOpened.current && event.detail > 0) {
                    hoverOpened.current = false;
                  } else {
                    hide();
                  }
                }}
                className={cn(TRIGGER, "group/trigger gap-1 pr-2.5 pl-3 has-[>svg]:pr-2.5 has-[>svg]:pl-3")}
              >
                {t(`menu.${menu.id}`)}
                <ChevronDown
                  aria-hidden
                  className="size-3.5 opacity-50 transition-transform duration-200 ease-(--ease-out-quint) group-data-[state=open]/trigger:rotate-180"
                />
              </Button>

              <div
                id={panelId}
                data-open={isOpen || undefined}
                className="menu-panel absolute top-full left-[calc(-1rem+var(--menu-shift,0px))] z-10 pt-3"
                onClick={(event) => {
                  if ((event.target as Element).closest("a")) hide();
                }}
              >
                <MenuPanel menu={menu} onHome={onHome} pathname={pathname} />
              </div>
            </li>
          );
        })}
        <li>
          <Button asChild variant="ghost" size="sm" className={TRIGGER}>
            <Link href={pricing} aria-current={onPricing ? "page" : undefined}>
              {t("pricing")}
            </Link>
          </Button>
        </li>
      </ul>
    </nav>
  );
}

/** Regular weight and a shade under the ink until hovered, open or current. */
const TRIGGER =
  "text-foreground/75 hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground data-current:text-foreground aria-[current=page]:text-foreground rounded-full font-normal";

function MenuPanel({
  menu,
  onHome,
  pathname,
}: {
  menu: Menu;
  onHome: boolean;
  pathname: string;
}) {
  const t = useTranslations("nav.marketing.menu");
  const tNav = useTranslations("nav.marketing");
  const tRoutes = useTranslations("marketing.routes");
  const locale = asLocale(useLocale());
  const columns = menu.groups.length > 1;

  return (
    <div className="bg-popover text-popover-foreground w-max max-w-[min(44rem,calc(100vw-2rem))] rounded-[22px] p-2 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.22),0_2px_6px_-2px_rgb(0_0_0/0.06)] ring-1 ring-foreground/[0.07] dark:shadow-[0_20px_44px_-14px_rgb(0_0_0/0.65)] dark:ring-white/10">
      <div className={cn(columns && "grid grid-cols-2 gap-x-1")}>
        {menu.groups.map((group) => (
          <div key={group.key} className="min-w-0">
            <p className="text-muted-foreground px-2 pt-1.5 pb-1 text-xs">
              {t(`groups.${group.key}`)}
            </p>
            <ul className={cn("flex flex-col gap-0.5", columns ? "w-[20.5rem]" : "w-[21.5rem]")}>
              {group.items.map((item) => {
                const href = menuHref(item.key, locale, onHome);
                return (
                  <li key={item.key}>
                    <Link
                      href={href}
                      aria-current={href === pathname ? "page" : undefined}
                      className="group/item hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-ring/40 aria-[current=page]:bg-muted/70 flex items-center gap-3 rounded-[14px] p-2 pr-3 outline-none transition-colors duration-150 focus-visible:ring-[3px]"
                    >
                      <MenuTile icon={item.icon} />
                      <span className="min-w-0">
                        <span className="text-foreground block text-sm leading-5 font-medium">
                          {item.key === "howItWorks"
                            ? tNav("howItWorks")
                            : tRoutes(`${item.key}.label`)}
                        </span>
                        <span className="text-muted-foreground block text-[13px] leading-[18px] text-pretty">
                          {t(`items.${item.key}`)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {menu.more ? (
        <Link
          href={marketingPath(menu.more, locale)}
          aria-current={marketingPath(menu.more, locale) === pathname ? "page" : undefined}
          className="group/more bg-muted/60 hover:bg-muted focus-visible:ring-ring/40 text-foreground/80 hover:text-foreground mt-1 flex items-center justify-between rounded-[14px] px-3 py-2.5 text-[13px] outline-none transition-colors duration-150 focus-visible:ring-[3px]"
        >
          {tRoutes(`${menu.more}.label`)}
          <ArrowRight
            aria-hidden
            className="size-3.5 transition-transform duration-150 group-hover/more:translate-x-0.5"
          />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * The icon's tile: a raised square that turns its icon indigo when the row
 * is hovered. Shared with the phone menu, which sets a smaller size.
 */
export function MenuTile({ icon: Icon, className }: { icon: MenuIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-background text-foreground/70 group-hover/item:text-brand grid size-10 shrink-0 place-items-center rounded-[11px] shadow-[0_1px_2px_rgb(0_0_0/0.05)] ring-1 ring-foreground/[0.08] transition-colors duration-150 dark:bg-white/[0.04] dark:ring-white/10",
        className
      )}
    >
      <Icon className="size-[18px] stroke-[1.75]" />
    </span>
  );
}
