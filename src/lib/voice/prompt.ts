/**
 * The instructions that sort a voice-note transcript into client updates
 * (plan 026). Rules 5 and 6 come from Phase 0: without them, a viewing went
 * only into the note, and an in-person viewing came back as channel "other".
 */
import { dateKeyInTimeZone } from "@/lib/home";

/** The agent reads notes and to-dos, so they're written in the UI language (same rule as extractLead). */
const UI_LANGUAGE: Record<string, string> = { en: "English", es: "Spanish", ru: "Russian" };

export function uiLanguageFor(locale: string | null | undefined): string {
  return UI_LANGUAGE[locale ?? ""] ?? "English";
}

/** The agent's today and weekday, in their own time zone. */
export function todayContext(now: Date, timeZone: string): { today: string; weekday: string } {
  const today = dateKeyInTimeZone(now.toISOString(), timeZone);
  let weekday: string;
  try {
    weekday = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long" }).format(now);
  } catch {
    weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" }).format(now);
  }
  return { today, weekday };
}

export type BoundClient = { first_name: string; last_name: string; side: "buyer" | "seller" };

export function buildInstructions(input: {
  today: string;
  weekday: string;
  timeZone: string;
  uiLanguage: string;
  boundClient?: BoundClient | null;
}): string {
  const lines = [
    "You sort an estate agent's voice note into updates for the people it mentions.",
    `Today is ${input.weekday} ${input.today} (time zone ${input.timeZone}). Turn relative dates such as "Friday", "tomorrow", "next week" or "the 20th" into dates in that zone. A weekday means its next occurrence; today's own weekday means today.`,
    `Write summary, note, feedback, task titles and appointment titles in ${input.uiLanguage}. Keep people's names and the names of properties and places exactly as spoken.`,
    "Use only what the agent said. Never invent names, phone numbers, emails, prices, dates or times; use JSON null (never the word \"null\") when something wasn't said.",
    "Make one group per person or couple ('the Johnsons' is one group). Don't guess which saved client it is: give the name as spoken, and fill first_name and last_name only with what was said.",
    "When the agent showed or visited a property with someone, fill viewing for that person with the property and what they thought.",
    "spoke_with_them: a viewing or any in-person meeting is \"meeting\", a phone call is \"call\", a WhatsApp chat is \"whatsapp\", an email is \"email\". Leave it null when the agent only mentions the person.",
    "preferences: only what the agent stated, with budgets in whole euros ('one and a half million' is 1500000). 'Up to', 'max', 'no more than' or a single budget figure is budget_max; only 'from' or 'at least' is budget_min.",
    "tasks: everything the agent says they must do, each with the day they gave, or null. Name the person in each title ('Call the Johnsons', not 'Call them'). Use appointment only for a meeting or viewing fixed at a day and a time; without a time, make it a task for that day.",
    "stage: only when the agent clearly says the person moved on (for example they reserved); otherwise null.",
    "unassigned: to-dos that belong to nobody (for example 'renew the Idealista plan').",
  ];
  if (input.boundClient) {
    const name = `${input.boundClient.first_name} ${input.boundClient.last_name}`.trim();
    lines.push(
      `This note was recorded on ${name}'s page (a ${input.boundClient.side}). Unless the agent clearly names someone else, everything is about ${name}: use one group with person.spoken "${name}".`
    );
  }
  return lines.join("\n");
}

/** The user message: the transcript, fenced so the model can't mistake it for instructions. */
export function buildPrompt(transcript: string): string {
  return `Voice note transcript:\n"""\n${transcript.replaceAll('"""', '"')}\n"""`;
}
