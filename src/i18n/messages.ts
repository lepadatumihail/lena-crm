/**
 * Message catalogs, one JSON file per namespace and language under /messages.
 * English is the reference: its shape types every `t()` call (see
 * next-intl.d.ts). Other languages are deep-merged over English so a key that
 * is not translated yet falls back to English instead of rendering its path.
 */
import type { AppLocale } from "./config";

import enAdmin from "../../messages/en/admin.json";
import enAuth from "../../messages/en/auth.json";
import enBilling from "../../messages/en/billing.json";
import enCalculator from "../../messages/en/calculator.json";
import enCalendar from "../../messages/en/calendar.json";
import enClientDetail from "../../messages/en/clientDetail.json";
import enClients from "../../messages/en/clients.json";
import enCommon from "../../messages/en/common.json";
import enCrm from "../../messages/en/crm.json";
import enHome from "../../messages/en/home.json";
import enLanding from "../../messages/en/landing.json";
import enLegal from "../../messages/en/legal.json";
import enMarketing from "../../messages/en/marketing.json";
import enNav from "../../messages/en/nav.json";
import enNotifications from "../../messages/en/notifications.json";
import enReferrals from "../../messages/en/referrals.json";
import enServer from "../../messages/en/server.json";
import enSite from "../../messages/en/site.json";
import enSupport from "../../messages/en/support.json";
import enTemplates from "../../messages/en/templates.json";
import enValidation from "../../messages/en/validation.json";

import esAdmin from "../../messages/es/admin.json";
import esAuth from "../../messages/es/auth.json";
import esBilling from "../../messages/es/billing.json";
import esCalculator from "../../messages/es/calculator.json";
import esCalendar from "../../messages/es/calendar.json";
import esClientDetail from "../../messages/es/clientDetail.json";
import esClients from "../../messages/es/clients.json";
import esCommon from "../../messages/es/common.json";
import esCrm from "../../messages/es/crm.json";
import esHome from "../../messages/es/home.json";
import esLanding from "../../messages/es/landing.json";
import esLegal from "../../messages/es/legal.json";
import esMarketing from "../../messages/es/marketing.json";
import esNav from "../../messages/es/nav.json";
import esNotifications from "../../messages/es/notifications.json";
import esReferrals from "../../messages/es/referrals.json";
import esServer from "../../messages/es/server.json";
import esSite from "../../messages/es/site.json";
import esSupport from "../../messages/es/support.json";
import esTemplates from "../../messages/es/templates.json";
import esValidation from "../../messages/es/validation.json";

export const en = {
  admin: enAdmin,
  auth: enAuth,
  billing: enBilling,
  calculator: enCalculator,
  calendar: enCalendar,
  clientDetail: enClientDetail,
  clients: enClients,
  common: enCommon,
  crm: enCrm,
  home: enHome,
  landing: enLanding,
  legal: enLegal,
  marketing: enMarketing,
  nav: enNav,
  notifications: enNotifications,
  referrals: enReferrals,
  server: enServer,
  site: enSite,
  support: enSupport,
  templates: enTemplates,
  validation: enValidation,
};

export type Messages = typeof en;

const es = {
  admin: esAdmin,
  auth: esAuth,
  billing: esBilling,
  calculator: esCalculator,
  calendar: esCalendar,
  clientDetail: esClientDetail,
  clients: esClients,
  common: esCommon,
  crm: esCrm,
  home: esHome,
  landing: esLanding,
  legal: esLegal,
  marketing: esMarketing,
  nav: esNav,
  notifications: esNotifications,
  referrals: esReferrals,
  server: esServer,
  site: esSite,
  support: esSupport,
  templates: esTemplates,
  validation: esValidation,
};

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Dict>(base: T, override: Dict): T {
  const out: Dict = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    out[key] = isDict(existing) && isDict(value) ? deepMerge(existing, value) : value;
  }
  return out as T;
}

const CATALOGS: Record<AppLocale, Messages> = {
  en,
  es: deepMerge(en, es),
};

export function messagesFor(locale: AppLocale): Messages {
  return CATALOGS[locale];
}
