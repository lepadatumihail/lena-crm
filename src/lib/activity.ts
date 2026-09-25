import { STALE_AFTER_DAYS } from "@/lib/attention";
import { defaultStageForSide, type ClientSide } from "@/lib/crm";
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

/** The lists' Needs follow-up tab; it shares `?stage=` with the stage tabs. */
export const FOLLOW_UP_TAB = "follow-up";

/**
 * Whether a client belongs in a list's Needs follow-up tab: Home's Needs
 * attention rules applied to one row. An active buyer who isn't reserved
 * and has been quiet for STALE_AFTER_DAYS (from lastTouchedAt, as in
 * getAttentionSignals), or a new lead nobody has contacted yet: a buyer
 * still New, a seller still Pending.
 */
export function needsFollowUp(
  client: {
    side: ClientSide;
    stage: string;
    is_active: boolean;
    last_contacted_at: string | null;
    updated_at: string;
  },
  nowMs: number
): boolean {
  if (!client.is_active) return false;
  if (client.stage === defaultStageForSide(client.side) && client.last_contacted_at == null) {
    return true;
  }
  if (client.side !== "buyer" || client.stage === "reserved") return false;
  return Date.parse(lastTouchedAt(client)) <= nowMs - STALE_AFTER_DAYS * 86_400_000;
}
