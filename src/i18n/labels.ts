/**
 * Translated labels for enum-like values (pipeline stages, property types…)
 * whose English fallbacks live in lib/crm.ts and lib/calendar.ts. Pass the
 * `crm` translator: `useTranslations("crm")` in components,
 * `await getTranslations("crm")` on the server.
 */
import type enCrm from "../../messages/en/crm.json";
import { BUYER_STAGES, PROPERTY_TYPES, SELLER_STAGES, LANGUAGES } from "@/lib/crm";
import type { TaskPriority, TaskStatus } from "@/lib/supabase/types";

type Crm = typeof enCrm;
type NestedKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : NestedKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type CrmKey = NestedKeys<Crm>;
export type CrmT = (key: CrmKey, values?: Record<string, string | number>) => string;

const STAGES: readonly string[] = [...BUYER_STAGES, ...SELLER_STAGES];
const PROPERTY: readonly string[] = PROPERTY_TYPES;
const LANGS: readonly string[] = LANGUAGES;

export function sideLabel(t: CrmT, side: "buyer" | "seller", plural = false): string {
  return t(plural ? `side.${side}s` : `side.${side}`);
}

export function stageLabel(t: CrmT, stage: string): string {
  return STAGES.includes(stage) ? t(`stages.${stage as keyof Crm["stages"]}`) : stage;
}

export function propertyTypeLabel(t: CrmT, type: string | null | undefined): string {
  if (!type) return "";
  return PROPERTY.includes(type)
    ? t(`propertyTypes.${type as keyof Crm["propertyTypes"]}`)
    : type;
}

export function dealTypeLabel(t: CrmT, type: "direct" | "collab"): string {
  return t(`dealTypes.${type}`);
}

export function sellerRoleLabel(t: CrmT, role: "owner" | "representative"): string {
  return t(`sellerRoles.${role}`);
}

export function appointmentTypeLabel(t: CrmT, type: "meeting" | "viewing"): string {
  return t(`appointmentTypes.${type}`);
}

/** Client languages are stored as their English names ("German"). */
export function languageLabel(t: CrmT, language: string | null | undefined): string {
  if (!language) return "";
  return LANGS.includes(language)
    ? t(`languages.${language as keyof Crm["languages"]}`)
    : language;
}

export function reminderLabel(t: CrmT, minutes: number | null): string {
  if (minutes == null) return t("reminders.none");
  if (minutes === 0) return t("reminders.atTime");
  if (minutes % 1440 === 0) return t("reminders.daysBefore", { count: minutes / 1440 });
  if (minutes % 60 === 0) return t("reminders.hoursBefore", { count: minutes / 60 });
  return t("reminders.minutesBefore", { count: minutes });
}

export function taskStatusLabel(t: CrmT, status: TaskStatus): string {
  return t(`taskStatuses.${status}`);
}

export function taskPriorityLabel(t: CrmT, priority: TaskPriority): string {
  return t(`taskPriorities.${priority}`);
}
