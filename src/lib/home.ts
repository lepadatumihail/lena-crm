/**
 * Pure helpers for the Home cockpit: greeting, relative times, the pipeline
 * bar and the onboarding checklist. No I/O, so the data module and the page
 * stay thin and this file is unit-tested.
 */
import { BUYER_STAGES, SELLER_STAGES, type Stage } from "@/lib/crm";

export type GreetingPeriod = "morning" | "afternoon" | "evening";

/** 05:00–11:59 morning, 12:00–17:59 afternoon, otherwise evening. */
export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

/** The wall-clock hour (0–23) of an instant in an IANA time zone. */
export function hourInTimeZone(isoInstant: string, timeZone: string): number {
  try {
    const hour = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hour12: false,
    })
      .formatToParts(new Date(isoInstant))
      .find((p) => p.type === "hour")?.value;
    // en-GB renders midnight as "24" with hour12: false.
    return hour ? Number(hour) % 24 : new Date(isoInstant).getUTCHours();
  } catch {
    return new Date(isoInstant).getUTCHours();
  }
}

/** "Maria" from "Maria García", else the mailbox name, else null. */
export function firstNameFrom(
  fullName: string | null | undefined,
  email: string | null | undefined
): string | null {
  const name = fullName?.trim();
  if (name) return name.split(/\s+/)[0];
  const local = email?.split("@")[0]?.trim();
  if (!local) return null;
  const word = local.split(/[._\-+]/)[0];
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : null;
}

/** "MG" from "Maria García"; a single word gives its first two letters. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const second =
    parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : (parts[0][1] ?? "");
  return (first + second).toUpperCase();
}

/**
 * The UTC instants where a calendar day starts and ends in a time zone, for
 * the day that contains `nowISO` there. Good to the minute; a DST switch at
 * midnight itself would be off by the hour, which no Spanish zone does.
 */
export function dayRangeInTimeZone(
  nowISO: string,
  timeZone: string
): { start: string; end: string } {
  const now = new Date(nowISO);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  const year = Number(parts.year);
  const month = Number(parts.month) - 1;
  const day = Number(parts.day);
  // The wall clock read as if it were UTC, minus the true instant, is the offset.
  const wall = Date.UTC(
    year,
    month,
    day,
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  const offset = wall - now.getTime();
  const start = Date.UTC(year, month, day) - offset;
  return {
    start: new Date(start).toISOString(),
    end: new Date(start + 86_400_000).toISOString(),
  };
}

/** The calendar day ("yyyy-MM-dd") an instant falls on in an IANA time zone. */
export function dateKeyInTimeZone(isoInstant: string, timeZone: string): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(isoInstant));
  try {
    return format(timeZone);
  } catch {
    return format("UTC");
  }
}

export type RelativeUnit = "now" | "minute" | "hour" | "day" | "week" | "month";

/**
 * Coarse "how long ago" bucket for a list row. Anything under a minute is
 * "now"; beyond ~10 weeks it counts months. The page renders the label
 * through Intl.RelativeTimeFormat, so this stays locale-free.
 */
export function relativeAgo(
  iso: string,
  nowISO: string
): { unit: RelativeUnit; value: number } {
  const ms = Math.max(0, new Date(nowISO).getTime() - new Date(iso).getTime());
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return { unit: "now", value: 0 };
  if (minutes < 60) return { unit: "minute", value: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: "hour", value: hours };
  const days = Math.floor(hours / 24);
  if (days < 14) return { unit: "day", value: days };
  const weeks = Math.floor(days / 7);
  if (weeks < 10) return { unit: "week", value: weeks };
  return { unit: "month", value: Math.floor(days / 30) };
}

export type BarSegment = { stage: Stage; count: number; percent: number };

/**
 * Segment widths for a stacked pipeline bar. Zero-count stages are kept (so
 * the chips below can list them dimmed) with a 0% width; a side with no
 * clients returns every stage at 0%.
 */
export function pipelineSegments(
  stages: { stage: Stage; count: number }[]
): BarSegment[] {
  const total = stages.reduce((sum, s) => sum + s.count, 0);
  return stages.map((s) => ({
    stage: s.stage,
    count: s.count,
    percent: total === 0 ? 0 : (s.count / total) * 100,
  }));
}

/** Buyers who have not reached the viewing stage yet. */
export function buyersBeforeViewing(
  buyer: { stage: Stage; count: number }[]
): number {
  const before = BUYER_STAGES.slice(0, BUYER_STAGES.indexOf("viewing"));
  return buyer
    .filter((s) => (before as readonly Stage[]).includes(s.stage))
    .reduce((sum, s) => sum + s.count, 0);
}

export const ONBOARDING_STEPS = [
  "addName",
  "addClient",
  "scheduleAppointment",
  "createTemplate",
  "inviteColleague",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingInput = {
  /** The profile carries a name: Google fills it in, an email code does not. */
  hasName: boolean;
  clientCount: number;
  appointmentCount: number;
  templateCount: number;
  referralCount: number;
};

export type OnboardingStepState = {
  step: OnboardingStep;
  done: boolean;
  /** Not worth doing yet: listed, but not offered. */
  locked: boolean;
  /** Listed, but the checklist is complete without it. */
  optional: boolean;
};

/** Referrals wait until the book has this many clients: the ask comes after the value. */
export const INVITE_UNLOCK_CLIENTS = 3;

/**
 * Steps the checklist lists but does not wait for. An invite only counts
 * once a colleague has signed up, which the agent cannot make happen, so
 * it never holds the checklist open.
 */
export const OPTIONAL_ONBOARDING_STEPS: readonly OnboardingStep[] = ["inviteColleague"];

/** Which getting-started steps are done, in display order. */
export function onboardingSteps(input: OnboardingInput): OnboardingStepState[] {
  const invited = input.referralCount > 0;
  const states: Omit<OnboardingStepState, "optional">[] = [
    { step: "addName", done: input.hasName, locked: false },
    { step: "addClient", done: input.clientCount > 0, locked: false },
    { step: "scheduleAppointment", done: input.appointmentCount > 0, locked: false },
    { step: "createTemplate", done: input.templateCount > 0, locked: false },
    {
      step: "inviteColleague",
      done: invited,
      locked: !invited && input.clientCount < INVITE_UNLOCK_CLIENTS,
    },
  ];
  return states.map((s) => ({ ...s, optional: OPTIONAL_ONBOARDING_STEPS.includes(s.step) }));
}

/** The required steps done so far and in all: the strip's "2 of 4". */
export function onboardingProgress(input: OnboardingInput): { done: number; total: number } {
  const required = onboardingSteps(input).filter((s) => !s.optional);
  return { done: required.filter((s) => s.done).length, total: required.length };
}

/** The first step still to do that can be done now, for the strip's "Next:" link. */
export function nextOnboardingStep(input: OnboardingInput): OnboardingStep | null {
  return onboardingSteps(input).find((s) => !s.done && !s.locked)?.step ?? null;
}

/**
 * Accounts still finding their feet: fewer than this many active clients.
 * It happens to equal the Free plan's client limit; the two are unrelated.
 */
export const ONBOARDING_CLIENT_CAP = 10;

/**
 * Show the checklist while the account is young and a required step is left.
 * An agent who imports a full book of clients on day one never sees it.
 */
export function showOnboarding(input: OnboardingInput): boolean {
  if (input.clientCount >= ONBOARDING_CLIENT_CAP) return false;
  return onboardingSteps(input).some((s) => !s.done && !s.optional);
}

/**
 * The cookie that remembers, per device and agent, whether Home still makes
 * room for Getting started. Its value names the agent ("done.<user id>"), so
 * on a shared device one account's choice never hides the strip from another.
 */
export const HOME_ONBOARDING_COOKIE = "home_onboarding";
export const HOME_ONBOARDING_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * What the cookie can say. "hidden": the agent closed the strip, and the
 * account menu can bring it back. "done": the steps are finished or the book
 * outgrew them. Either way Home stops holding a place for the strip, so
 * neither the page nor its loading skeleton draws one that then vanishes.
 */
export type OnboardingCookieValue = "hidden" | "done";

/**
 * What the cookie says for this agent. A value written by another agent, or
 * in the old unnamed form, counts as nothing. Without an agent id (a page
 * outside the signed-in shell) any valid value counts.
 */
export function onboardingState(
  cookieValue: string | undefined,
  agentId: string | null | undefined
): OnboardingCookieValue | undefined {
  if (!cookieValue) return undefined;
  const [state, owner] = cookieValue.split(".");
  if (state !== "hidden" && state !== "done") return undefined;
  if (agentId && owner !== agentId) return undefined;
  return state;
}

/** Whether Home should hold a place for the strip before its data loads. */
export function onboardingExpected(state: OnboardingCookieValue | undefined): boolean {
  return state === undefined;
}

/** The onboarding cookie's value in a `document.cookie` string. */
export function readOnboardingCookie(cookies: string): string | undefined {
  for (const part of cookies.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === HOME_ONBOARDING_COOKIE) return value.join("=");
  }
  return undefined;
}

/** A `document.cookie` assignment that stores `value` for this agent, or clears the cookie for null. */
export function onboardingCookie(
  value: OnboardingCookieValue | null,
  agentId?: string | null
): string {
  return value
    ? `${HOME_ONBOARDING_COOKIE}=${value}.${agentId ?? ""}; path=/; max-age=${HOME_ONBOARDING_COOKIE_MAX_AGE}; samesite=lax`
    : `${HOME_ONBOARDING_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/**
 * An account with no clients yet is in its first session: Home shows the
 * ways to bring clients in instead of figures that would all read zero.
 */
export function isFirstSession(clientCount: number): boolean {
  return clientCount === 0;
}

export { BUYER_STAGES, SELLER_STAGES };

/** The calendar day `days` after a "yyyy-MM-dd" day, in the same form. */
export function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

type EventLike = {
  kind: "meeting" | "viewing";
  starts_at: string;
  appointment?: { type: string };
};

/** A dated viewing, or an appointment booked as a viewing. */
export function isViewing(event: EventLike): boolean {
  return event.kind === "viewing" || event.appointment?.type === "viewing";
}

/**
 * The `days` calendar days from `todayKey` in the agent's zone, each with how
 * many of `events` are viewings on it: the figures' week of bars and their
 * total. Events outside those days are left out.
 */
export function viewingsByDay(
  events: EventLike[],
  todayKey: string,
  timeZone: string,
  days: number
): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) counts.set(addDaysToKey(todayKey, i), 0);
  for (const event of events) {
    if (!isViewing(event)) continue;
    const key = dateKeyInTimeZone(event.starts_at, timeZone);
    const count = counts.get(key);
    if (count !== undefined) counts.set(key, count + 1);
  }
  return [...counts].map(([key, count]) => ({ key, count }));
}

/** Events in start order, grouped under the agent's calendar day each one falls on. */
export function groupByDay<T extends { starts_at: string }>(
  events: T[],
  timeZone: string
): { key: string; events: T[] }[] {
  const groups: { key: string; events: T[] }[] = [];
  const sorted = [...events].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  for (const event of sorted) {
    const key = dateKeyInTimeZone(event.starts_at, timeZone);
    const last = groups.at(-1);
    if (last?.key === key) last.events.push(event);
    else groups.push({ key, events: [event] });
  }
  return groups;
}

/** Clients per side added in the `days` before `nowISO`: the figures' "+2 in 30 days". */
export function countAddedWithin(
  clients: { side: string; created_at: string }[],
  nowISO: string,
  days: number
): { buyer: number; seller: number } {
  const now = Date.parse(nowISO);
  const since = now - days * 86_400_000;
  const added = { buyer: 0, seller: 0 };
  for (const client of clients) {
    if (client.side !== "buyer" && client.side !== "seller") continue;
    const at = Date.parse(client.created_at);
    if (at > since && at <= now) added[client.side] += 1;
  }
  return added;
}
