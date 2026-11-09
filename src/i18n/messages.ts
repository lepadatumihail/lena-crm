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
import enImports from "../../messages/en/imports.json";
import enLanding from "../../messages/en/landing.json";
import enLegal from "../../messages/en/legal.json";
import enMarketing from "../../messages/en/marketing.json";
import enNav from "../../messages/en/nav.json";
import enNotifications from "../../messages/en/notifications.json";
import enReferrals from "../../messages/en/referrals.json";
import enServer from "../../messages/en/server.json";
import enSettings from "../../messages/en/settings.json";
import enSite from "../../messages/en/site.json";
import enSupport from "../../messages/en/support.json";
import enTasks from "../../messages/en/tasks.json";
import enTemplates from "../../messages/en/templates.json";
import enTools from "../../messages/en/tools.json";
import enTransfer from "../../messages/en/transfer.json";
import enValidation from "../../messages/en/validation.json";
import enVoice from "../../messages/en/voice.json";

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
import esImports from "../../messages/es/imports.json";
import esLanding from "../../messages/es/landing.json";
import esLegal from "../../messages/es/legal.json";
import esMarketing from "../../messages/es/marketing.json";
import esNav from "../../messages/es/nav.json";
import esNotifications from "../../messages/es/notifications.json";
import esReferrals from "../../messages/es/referrals.json";
import esServer from "../../messages/es/server.json";
import esSettings from "../../messages/es/settings.json";
import esSite from "../../messages/es/site.json";
import esSupport from "../../messages/es/support.json";
import esTasks from "../../messages/es/tasks.json";
import esTemplates from "../../messages/es/templates.json";
import esTools from "../../messages/es/tools.json";
import esTransfer from "../../messages/es/transfer.json";
import esValidation from "../../messages/es/validation.json";
import esVoice from "../../messages/es/voice.json";

import ruAdmin from "../../messages/ru/admin.json";
import ruAuth from "../../messages/ru/auth.json";
import ruBilling from "../../messages/ru/billing.json";
import ruCalculator from "../../messages/ru/calculator.json";
import ruCalendar from "../../messages/ru/calendar.json";
import ruClientDetail from "../../messages/ru/clientDetail.json";
import ruClients from "../../messages/ru/clients.json";
import ruCommon from "../../messages/ru/common.json";
import ruCrm from "../../messages/ru/crm.json";
import ruHome from "../../messages/ru/home.json";
import ruImports from "../../messages/ru/imports.json";
import ruLanding from "../../messages/ru/landing.json";
import ruLegal from "../../messages/ru/legal.json";
import ruMarketing from "../../messages/ru/marketing.json";
import ruNav from "../../messages/ru/nav.json";
import ruNotifications from "../../messages/ru/notifications.json";
import ruReferrals from "../../messages/ru/referrals.json";
import ruServer from "../../messages/ru/server.json";
import ruSettings from "../../messages/ru/settings.json";
import ruSite from "../../messages/ru/site.json";
import ruSupport from "../../messages/ru/support.json";
import ruTasks from "../../messages/ru/tasks.json";
import ruTemplates from "../../messages/ru/templates.json";
import ruTools from "../../messages/ru/tools.json";
import ruTransfer from "../../messages/ru/transfer.json";
import ruValidation from "../../messages/ru/validation.json";
import ruVoice from "../../messages/ru/voice.json";

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
  imports: enImports,
  landing: enLanding,
  legal: enLegal,
  marketing: enMarketing,
  nav: enNav,
  notifications: enNotifications,
  referrals: enReferrals,
  server: enServer,
  settings: enSettings,
  site: enSite,
  support: enSupport,
  tasks: enTasks,
  templates: enTemplates,
  tools: enTools,
  transfer: enTransfer,
  validation: enValidation,
  voice: enVoice,
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
  imports: esImports,
  landing: esLanding,
  legal: esLegal,
  marketing: esMarketing,
  nav: esNav,
  notifications: esNotifications,
  referrals: esReferrals,
  server: esServer,
  settings: esSettings,
  site: esSite,
  support: esSupport,
  tasks: esTasks,
  templates: esTemplates,
  tools: esTools,
  transfer: esTransfer,
  validation: esValidation,
  voice: esVoice,
};

const ru = {
  admin: ruAdmin,
  auth: ruAuth,
  billing: ruBilling,
  calculator: ruCalculator,
  calendar: ruCalendar,
  clientDetail: ruClientDetail,
  clients: ruClients,
  common: ruCommon,
  crm: ruCrm,
  home: ruHome,
  imports: ruImports,
  landing: ruLanding,
  legal: ruLegal,
  marketing: ruMarketing,
  nav: ruNav,
  notifications: ruNotifications,
  referrals: ruReferrals,
  server: ruServer,
  settings: ruSettings,
  site: ruSite,
  support: ruSupport,
  tasks: ruTasks,
  templates: ruTemplates,
  tools: ruTools,
  transfer: ruTransfer,
  validation: ruValidation,
  voice: ruVoice,
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
  ru: deepMerge(en, ru),
};

export function messagesFor(locale: AppLocale): Messages {
  return CATALOGS[locale];
}
