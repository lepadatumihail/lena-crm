import type { ContactChannel } from "@/lib/supabase/types";

/**
 * Contact logging: every message or call an agent starts from LeadWing is
 * logged against the client, and the log dialog then asks for the next step.
 * A logged contact is what "quiet for N days" counts from.
 */

/** The ways an agent reaches a client, in the order the log dialog offers them. */
export const CONTACT_CHANNELS = [
  "whatsapp",
  "call",
  "email",
  "meeting",
  "other",
] as const satisfies readonly ContactChannel[];

/** Follow-up presets after a contact, in days from the agent's today. */
const NEXT_STEP_DAYS = { tomorrow: 1, three_days: 3, week: 7 } as const;

export type NextStep = keyof typeof NEXT_STEP_DAYS | "none";

/** The presets in the order the dialog shows them. */
export const NEXT_STEPS = [
  "tomorrow",
  "three_days",
  "week",
  "none",
] as const satisfies readonly NextStep[];

/** The step the dialog starts on: soon enough that a lead doesn't cool off. */
export const DEFAULT_NEXT_STEP: NextStep = "three_days";

/**
 * The `yyyy-MM-dd` key `days` after `dayKey`. Pure UTC day arithmetic on the
 * keys, like calendarDaysFromToday, so it ignores the process zone and DST.
 */
export function addDaysToKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The due date a preset stands for, from the agent's `todayKey`; null for none. */
export function nextStepDueOn(step: NextStep, todayKey: string): string | null {
  return step === "none" ? null : addDaysToKey(todayKey, NEXT_STEP_DAYS[step]);
}

/**
 * The stage a logged contact moves a client to, if any: a buyer who is still
 * New has now been contacted. Sellers have no contacted stage.
 */
export function stageAfterContact(side: string, stage: string): "contacted" | null {
  return side === "buyer" && stage === "new" ? "contacted" : null;
}

/** When the agent last reached a client: the newest logged contact, else the last edit. */
export function lastTouchedAt(client: {
  last_contacted_at: string | null;
  updated_at: string;
}): string {
  return client.last_contacted_at ?? client.updated_at;
}
