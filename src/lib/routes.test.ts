import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import {
  MARKETING_ROUTES,
  PROTECTED_PREFIXES,
  isProtectedPath,
  marketingAlternates,
  marketingCounterpart,
  marketingRouteAt,
  pathLocale,
} from "./routes";

const APP_DIR = join(process.cwd(), "src/app");

/** Route segments in a directory: real folders, not groups, slots or private dirs. */
function routeSegments(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !/^[(@_[]/.test(entry.name))
    .map((entry) => entry.name);
}

describe("isProtectedPath", () => {
  it.each([
    "/home",
    "/clients",
    "/clients/abc/edit",
    "/calendar",
    "/tasks",
    "/tasks/anything",
    "/billing",
    "/admin",
  ])("guards %s", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/es",
    "/es/privacidad",
    "/pricing",
    "/es/precios",
    "/real-estate-crm-spain",
    "/guides/idealista-lead-management",
    "/guides/andalusia-agent-register",
    "/es/guias/registro-agentes-inmobiliarios-andalucia",
    "/login",
    "/auth/callback",
    "/join/abc",
    "/api/calendar/token",
    "/api/stripe/webhook",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/does-not-exist",
    "/clientsx",
    "/homepage",
  ])("lets %s through", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(false);
  });
});

describe("PROTECTED_PREFIXES", () => {
  it("covers every route in the (app) group", () => {
    const missing = routeSegments(join(APP_DIR, "(app)"))
      .map((segment) => `/${segment}`)
      .filter((prefix) => !isProtectedPath(prefix));
    expect(missing).toEqual([]);
  });

  it("names only routes that exist", () => {
    const stale = PROTECTED_PREFIXES.filter(
      (prefix) =>
        !existsSync(join(APP_DIR, "(app)", prefix)) &&
        !existsSync(join(APP_DIR, prefix))
    );
    expect(stale).toEqual([]);
  });
});

describe("pathLocale", () => {
  it.each([
    ["/es", "es"],
    ["/es/", "es"],
    ["/es/privacidad", "es"],
    ["/es/nope", "es"],
  ])("pins %s to %s", (pathname, locale) => {
    expect(pathLocale(pathname)).toBe(locale);
  });

  it.each(["/", "/en", "/estate", "/clients", "/login", "/privacy"])(
    "leaves %s to the cookie",
    (pathname) => {
      expect(pathLocale(pathname)).toBeNull();
    }
  );
});

describe("marketing routes", () => {
  it("identifies each page and its language", () => {
    expect(marketingRouteAt("/")).toEqual({ route: "home", locale: "en" });
    expect(marketingRouteAt("/es")).toEqual({ route: "home", locale: "es" });
    expect(marketingRouteAt("/es/")).toEqual({ route: "home", locale: "es" });
    expect(marketingRouteAt("/privacy")).toEqual({ route: "privacy", locale: "en" });
    expect(marketingRouteAt("/es/aviso-legal")).toEqual({
      route: "legalNotice",
      locale: "es",
    });
    expect(marketingRouteAt("/pricing")).toEqual({ route: "pricing", locale: "en" });
    expect(marketingRouteAt("/es/precios")).toEqual({ route: "pricing", locale: "es" });
    expect(marketingRouteAt("/guides/idealista-lead-management")).toEqual({
      route: "guideIdealista",
      locale: "en",
    });
    expect(marketingRouteAt("/about")).toEqual({ route: "about", locale: "en" });
    expect(marketingRouteAt("/es/sobre-nosotros")).toEqual({ route: "about", locale: "es" });
    expect(marketingRouteAt("/start")).toEqual({ route: "start", locale: "en" });
    expect(marketingRouteAt("/quiet")).toEqual({ route: "quiet", locale: "en" });
    expect(marketingRouteAt("/es/seguimiento")).toEqual({ route: "quiet", locale: "es" });
    expect(marketingRouteAt("/tools/commission-calculator")).toEqual({
      route: "toolCommission",
      locale: "en",
    });
    expect(marketingRouteAt("/es/herramientas/calculadora-comision-inmobiliaria")).toEqual({
      route: "toolCommission",
      locale: "es",
    });
  });

  it.each(["/login", "/es/nope", "/clients", "/privacy/x", "/join/abc"])(
    "knows %s is not a marketing page",
    (pathname) => {
      expect(marketingRouteAt(pathname)).toBeNull();
      expect(marketingCounterpart(pathname, "es")).toBeNull();
    }
  );

  it("finds the same page in the other language", () => {
    expect(marketingCounterpart("/", "es")).toBe("/es");
    expect(marketingCounterpart("/es", "en")).toBe("/");
    expect(marketingCounterpart("/es/terminos", "en")).toBe("/terms");
    expect(marketingCounterpart("/legal", "es")).toBe("/es/aviso-legal");
    expect(marketingCounterpart("/pricing", "es")).toBe("/es/precios");
    expect(marketingCounterpart("/es/precios", "en")).toBe("/pricing");
    expect(marketingCounterpart("/about", "es")).toBe("/es/sobre-nosotros");
    expect(marketingCounterpart("/es/sobre-nosotros", "en")).toBe("/about");
    expect(marketingCounterpart("/guides/andalusia-agent-register", "es")).toBe(
      "/es/guias/registro-agentes-inmobiliarios-andalucia"
    );
    expect(
      marketingCounterpart("/es/guias/registro-agentes-inmobiliarios-andalucia", "en")
    ).toBe("/guides/andalusia-agent-register");
  });

  it("lists hreflang alternates with English as x-default", () => {
    expect(marketingAlternates("home")).toEqual({
      en: "/",
      es: "/es",
      "x-default": "/",
    });
  });

  it("has a page file for every language of every route", () => {
    const missing: string[] = [];
    for (const paths of Object.values(MARKETING_ROUTES)) {
      for (const locale of LOCALES) {
        const path = paths[locale];
        const file = join(APP_DIR, path === "/" ? "" : path, "page.tsx");
        if (!existsSync(file)) missing.push(path);
      }
    }
    expect(missing).toEqual([]);
  });

  it("never sits behind sign-in", () => {
    for (const paths of Object.values(MARKETING_ROUTES)) {
      for (const locale of LOCALES) {
        expect(isProtectedPath(paths[locale])).toBe(false);
      }
    }
  });
});
