/**
 * From what the model returned to what the review cards show (plan 026):
 * - sanitizeExtraction() trims text to the app's limits, drops bad dates and
 *   unknown values, and turns an appointment without a usable time into a task;
 * - buildProposal() matches each person to the agent's clients and applies
 *   the "recorded on a client's page" rule.
 * Both are pure, so they're tested without a model or a database.
 */
import { PROPERTY_TYPES, type ClientSide } from "@/lib/crm";

import { dueDateOrNull, localDateTimeOrNull } from "./dates";
import { matchPerson, type MatchKind } from "./match";
import { STAGE_VALUES, VOICE_LIMITS, type VoiceExtraction, type VoiceExtractionGroup } from "./schema";

export type CandidatePreferences = {
  budget_min: number | null;
  budget_max: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_types: string[];
  area_notes: string | null;
};

export type ProposalCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  side: ClientSide;
  stage: string;
  phone: string | null;
  email: string | null;
  language: string | null;
  /** Current buyer preferences, so a card can show "€1.2M → €1.5M". */
  preferences: CandidatePreferences | null;
};

export type ProposalGroup = VoiceExtractionGroup & {
  key: string;
  match: { kind: MatchKind; candidates: ProposalCandidate[] };
  /** True when the group was tied to the client whose page the note was recorded on. */
  bound: boolean;
};

export type VoiceProposal = { summary: string; groups: ProposalGroup[]; unassigned: string[] };

const SPOKEN_MAX = 120;

/** Words a model writes when it means "nothing" (seen live: first_name "null"). */
const PLACEHOLDER = /^(null|none|n\/?a|undefined|unknown|-+)$/i;

function clip(value: string | null | undefined, max: number): string {
  const text = (value ?? "").trim();
  return PLACEHOLDER.test(text) ? "" : text.slice(0, max);
}

function clipOrNull(value: string | null | undefined, max: number): string | null {
  const v = clip(value, max);
  return v ? v : null;
}

function amount(value: number | null | undefined, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max
    ? Math.round(value)
    : null;
}

const PROPERTY_TYPE_SET = new Set<string>(PROPERTY_TYPES);
const STAGE_SET = new Set<string>(STAGE_VALUES);

function sanitizeGroup(g: VoiceExtractionGroup, todayKey: string): VoiceExtractionGroup {
  const tasks = g.tasks
    .map((t) => ({ title: clip(t.title, VOICE_LIMITS.taskTitle), due_on: dueDateOrNull(t.due_on, todayKey) }))
    .filter((t) => t.title);

  let appointment: VoiceExtractionGroup["appointment"] = null;
  if (g.appointment) {
    const title = clip(g.appointment.title, VOICE_LIMITS.title);
    const startsAt = localDateTimeOrNull(g.appointment.starts_at, todayKey);
    if (title && startsAt) {
      const duration = g.appointment.duration_minutes;
      appointment = {
        title,
        starts_at: startsAt,
        duration_minutes:
          typeof duration === "number" && duration >= 15 && duration <= 480 ? Math.round(duration) : 60,
        location: clipOrNull(g.appointment.location, VOICE_LIMITS.location),
      };
    } else if (title) {
      // no usable time: keep it as a to-do for that day rather than inventing a time
      tasks.push({
        title: clip(title, VOICE_LIMITS.taskTitle),
        due_on: dueDateOrNull(g.appointment.starts_at?.slice(0, 10), todayKey),
      });
    }
  }

  const viewing = g.viewing
    ? {
        property: clip(g.viewing.property, VOICE_LIMITS.property),
        feedback: clip(g.viewing.feedback, VOICE_LIMITS.feedback),
        had_offer: g.viewing.had_offer === true,
        offer_price: amount(g.viewing.offer_price, VOICE_LIMITS.euros),
        property_price: amount(g.viewing.property_price, VOICE_LIMITS.euros),
      }
    : null;

  let preferences: VoiceExtractionGroup["preferences"] = null;
  if (g.preferences) {
    const types = Array.from(
      new Set((g.preferences.property_types ?? []).filter((t) => PROPERTY_TYPE_SET.has(t)))
    );
    const p = {
      budget_min: amount(g.preferences.budget_min, VOICE_LIMITS.euros),
      budget_max: amount(g.preferences.budget_max, VOICE_LIMITS.euros),
      bedrooms: amount(g.preferences.bedrooms, VOICE_LIMITS.rooms),
      bathrooms: amount(g.preferences.bathrooms, VOICE_LIMITS.rooms),
      property_types: types.length ? types : null,
      area_notes: clipOrNull(g.preferences.area_notes, VOICE_LIMITS.areaNotes),
    };
    const said = Object.values(p).some((v) => v != null);
    preferences = said ? p : null;
  }

  let contactDetails: VoiceExtractionGroup["contact_details"] = null;
  if (g.contact_details) {
    const d = {
      phone: clipOrNull(g.contact_details.phone, VOICE_LIMITS.phone),
      email: clipOrNull(g.contact_details.email, VOICE_LIMITS.email),
      language: clipOrNull(g.contact_details.language, VOICE_LIMITS.language),
      nationality: clipOrNull(g.contact_details.nationality, VOICE_LIMITS.language),
    };
    contactDetails = Object.values(d).some((v) => v != null) ? d : null;
  }

  const firstName = clipOrNull(g.person.first_name, VOICE_LIMITS.name);
  const lastName = clipOrNull(g.person.last_name, VOICE_LIMITS.name);
  return {
    person: {
      spoken: clip(g.person.spoken, SPOKEN_MAX) || [firstName, lastName].filter(Boolean).join(" "),
      first_name: firstName,
      last_name: lastName,
      side: g.person.side === "buyer" || g.person.side === "seller" ? g.person.side : null,
    },
    note: clip(g.note, VOICE_LIMITS.note),
    spoke_with_them: g.spoke_with_them ?? null,
    viewing,
    preferences,
    stage: g.stage && STAGE_SET.has(g.stage) ? g.stage : null,
    tasks: tasks.slice(0, VOICE_LIMITS.tasks),
    appointment,
    follow_up: clipOrNull(g.follow_up, VOICE_LIMITS.followUp),
    contact_details: contactDetails,
  };
}

/** The model's output, cut down to what the app can store, with every date checked. */
export function sanitizeExtraction(raw: VoiceExtraction, todayKey: string): VoiceExtraction {
  return {
    summary: clip(raw.summary, VOICE_LIMITS.summary),
    groups: raw.groups
      .slice(0, VOICE_LIMITS.groups)
      .map((g) => sanitizeGroup(g, todayKey))
      .filter((g) => g.person.spoken),
    unassigned: raw.unassigned
      .map((u) => clip(u, VOICE_LIMITS.taskTitle))
      .filter(Boolean)
      .slice(0, VOICE_LIMITS.unassigned),
  };
}

/**
 * Matches each group to the agent's clients (newest first). When the note was
 * recorded on a client's page, a group naming that client, or the only group
 * in the note, belongs to them.
 */
export function buildProposal(
  clean: VoiceExtraction,
  opts: { clients: readonly ProposalCandidate[]; bound: ProposalCandidate | null }
): VoiceProposal {
  const groups = clean.groups.map((g, i): ProposalGroup => {
    if (opts.bound) {
      const namesBound = matchPerson(g.person, [opts.bound]).kind === "one";
      if (namesBound || clean.groups.length === 1) {
        return { ...g, key: `g${i}`, match: { kind: "one", candidates: [opts.bound] }, bound: true };
      }
    }
    return { ...g, key: `g${i}`, match: matchPerson(g.person, opts.clients), bound: false };
  });
  return { summary: clean.summary, groups, unassigned: clean.unassigned };
}
