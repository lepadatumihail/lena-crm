import type { ComponentType } from "react";
import {
  ArrowLeftRight,
  Calculator,
  Compass,
  FileSpreadsheet,
  Gift,
  Inbox,
  KeyRound,
  Landmark,
  MapPinned,
  MessageCircleReply,
  ReceiptEuro,
  Route,
  TreePalm,
  TrendingUp,
} from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { TOOL_ROUTES, marketingPath, type LinkedRoute, type ToolRoute } from "@/lib/routes";
import { LogoMark } from "@/components/brand/logo";

/**
 * What the public header's menus hold: the desktop dropdowns (SiteMenu) and
 * the phone menu (PhoneMenu) both read this list, so a page added here shows
 * up in both. Labels come from the `marketing.routes` catalog, the same as
 * the footer's; the one-line descriptions are the menu's own
 * (nav.marketing.menu.items), short enough to read at a glance.
 */

export type MenuIcon = ComponentType<{ className?: string }>;

/** A marketing page, or the home page's how-it-works chapter (an anchor). */
export type MenuItemKey = LinkedRoute | "howItWorks";

type MenuItem = { key: MenuItemKey; icon: MenuIcon };

type MenuGroup = {
  /** Names the small label above the group (nav.marketing.menu.groups). */
  key: "product" | "tools" | "work" | "portals";
  items: readonly MenuItem[];
};

type Menu = {
  id: "product" | "tools" | "guides";
  groups: readonly MenuGroup[];
  /** A hub page that lists everything in the menu, linked at its foot. */
  more?: LinkedRoute;
};

/** Every tool needs an icon here before it can join the menu by itself. */
const TOOL_ICONS = {
  toolCommission: Calculator,
  toolSpreadsheet: FileSpreadsheet,
  toolEarnings: TrendingUp,
} satisfies Record<ToolRoute, MenuIcon>;

export const SITE_MENUS = [
  {
    id: "product",
    groups: [
      {
        key: "product",
        items: [
          { key: "howItWorks", icon: Route },
          { key: "crmSpain", icon: MapPinned },
          { key: "crmMarbella", icon: TreePalm },
          // The brand's own wing, in its indigo: the one entry about us.
          { key: "about", icon: LogoMark },
        ],
      },
    ],
  },
  {
    id: "tools",
    groups: [
      {
        key: "tools",
        items: TOOL_ROUTES.map((key) => ({ key, icon: TOOL_ICONS[key] })),
      },
    ],
    more: "tools",
  },
  {
    // Two columns: the work itself, then what an agent pays for.
    id: "guides",
    groups: [
      {
        key: "work",
        items: [
          { key: "guideBecomeAgent", icon: KeyRound },
          { key: "guideAndaluciaRegister", icon: Landmark },
          { key: "guideIdealista", icon: Inbox },
          { key: "guideFollowUp", icon: MessageCircleReply },
        ],
      },
      {
        key: "portals",
        items: [
          { key: "guidePortalPrices", icon: ReceiptEuro },
          { key: "guideFreeCrm", icon: Gift },
          { key: "guideBestCrm", icon: Compass },
          { key: "guideCrmAlternatives", icon: ArrowLeftRight },
        ],
      },
    ],
  },
] as const satisfies readonly Menu[];

export type SiteMenuId = (typeof SITE_MENUS)[number]["id"];

/** Any entry of any menu; its key names its description in the catalog. */
export type SiteMenuEntry =
  (typeof SITE_MENUS)[number]["groups"][number]["items"][number];

export type SiteMenu = {
  id: SiteMenuId;
  groups: readonly { key: MenuGroup["key"]; items: readonly SiteMenuEntry[] }[];
  more?: LinkedRoute;
};

/** The same menus, typed for looping over. */
export const MENUS: readonly SiteMenu[] = SITE_MENUS;

/**
 * Where an entry leads. How it works is a chapter of the home page: on the
 * home page itself the link only scrolls.
 */
export function menuHref(key: MenuItemKey, locale: AppLocale, onHome: boolean): string {
  if (key === "howItWorks") {
    return onHome ? "#how-it-works" : `${marketingPath("home", locale)}#how-it-works`;
  }
  return marketingPath(key, locale);
}

/** The pages a menu links to, its hub included. */
export function menuRoutes(menu: SiteMenu): LinkedRoute[] {
  const routes: LinkedRoute[] = [];
  for (const group of menu.groups) {
    for (const item of group.items) {
      if (item.key !== "howItWorks") routes.push(item.key);
    }
  }
  if (menu.more) routes.push(menu.more);
  return routes;
}

/** The menu that holds the page at `pathname`, so it can be marked as where the visitor is. */
export function menuAt(pathname: string, locale: AppLocale): SiteMenuId | null {
  for (const menu of MENUS) {
    if (menuRoutes(menu).some((route) => marketingPath(route, locale) === pathname)) {
      return menu.id;
    }
  }
  return null;
}
