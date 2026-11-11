import { describe, expect, it } from "vitest";

import enNav from "../../../messages/en/nav.json";
import esNav from "../../../messages/es/nav.json";
import ruNav from "../../../messages/ru/nav.json";
import { LINKED_ROUTES, marketingPath } from "@/lib/routes";
import { MENUS, menuAt, menuHref, menuRoutes } from "./site-menu-items";

describe("the header's menus", () => {
  const listed = MENUS.flatMap(menuRoutes);

  // Pricing is a link of its own beside the menus. Anything else a footer
  // can link to belongs in a menu, so a new guide or tool can't be left out
  // of the header by accident.
  it("hold every linked page but pricing", () => {
    const missing = LINKED_ROUTES.filter((route) => route !== "pricing" && !listed.includes(route));
    expect(missing).toEqual([]);
  });

  it("list each page once", () => {
    expect(new Set(listed).size).toBe(listed.length);
  });

  // Read the catalogs as written: the merged messages would quietly fill a
  // missing translation with the English line.
  it.each([
    ["en", enNav],
    ["es", esNav],
    ["ru", ruNav],
  ] as const)("have a one-line description for every entry in %s", (_, nav) => {
    for (const menu of MENUS) {
      for (const group of menu.groups) {
        expect(nav.marketing.menu.groups[group.key]).toBeTruthy();
        for (const item of group.items) {
          expect(nav.marketing.menu.items[item.key]).toBeTruthy();
        }
      }
    }
  });

  it("point how it works at the home page's chapter, in the page's language", () => {
    expect(menuHref("howItWorks", "en", true)).toBe("#how-it-works");
    expect(menuHref("howItWorks", "es", false)).toBe("/es#how-it-works");
    expect(menuHref("guideIdealista", "ru", false)).toBe(marketingPath("guideIdealista", "ru"));
  });

  it("know which menu holds the current page", () => {
    expect(menuAt(marketingPath("guideFreeCrm", "ru"), "ru")).toBe("guides");
    expect(menuAt(marketingPath("tools", "es"), "es")).toBe("tools");
    expect(menuAt(marketingPath("about", "en"), "en")).toBe("product");
    expect(menuAt(marketingPath("pricing", "en"), "en")).toBeNull();
    expect(menuAt("/", "en")).toBeNull();
  });
});
