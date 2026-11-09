/**
 * Match a person named in a voice note to the agent's saved clients (plan
 * 026). This runs on the server, so the agent's client list never goes to the
 * model. A sure match is "one"; a close or partial one is "many", and the
 * review card asks the agent to pick.
 */
import { fold } from "@/lib/utils";

export type MatchableClient = { id: string; first_name: string; last_name: string };
export type MatchKind = "one" | "many" | "none";
export type MatchResult<C> = { kind: MatchKind; candidates: C[] };

export const MAX_CANDIDATES = 5;

/** Words that start a spoken reference without being part of the name. */
const LEADING = new Set(["the", "los", "las", "la", "el", "die", "der", "les"]);
const HONORIFICS = new Set(["mr", "mrs", "ms", "miss", "dr", "sr", "sra", "srta", "don", "dona", "herr", "frau"]);
const JOINERS = new Set(["and", "y", "e", "und", "et", "&", "family", "familia", "famille"]);

function words(value: string | null | undefined): string[] {
  return fold(value ?? "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function nameKey(value: string | null | undefined): string {
  return words(value).join(" ");
}

/** The first and last name to look for, from what the model returned. */
export function personNames(person: {
  spoken: string;
  first_name: string | null;
  last_name: string | null;
}): { first: string | null; last: string | null } {
  const first = nameKey(person.first_name);
  const last = nameKey(person.last_name);
  if (first || last) return { first: first || null, last: last || null };
  const tokens = words(person.spoken).filter(
    (w) => !LEADING.has(w) && !HONORIFICS.has(w) && !JOINERS.has(w)
  );
  if (tokens.length === 0) return { first: null, last: null };
  // a single word ("Anna", "the Johnsons") is tried as a last name, then a first name
  if (tokens.length === 1) return { first: null, last: tokens[0] };
  return { first: tokens[0], last: tokens[tokens.length - 1] };
}

/** "johnsons" also tries "johnson": agents talk about families in the plural. */
function lastVariants(last: string): string[] {
  const out = [last];
  if (last.length > 3 && last.endsWith("s")) out.push(last.slice(0, -1));
  return out;
}

/** Edit distance, stopping early once it exceeds `max`. */
function distanceWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      best = Math.min(best, row[j]);
    }
    if (best > max) return false;
    prev = row;
  }
  return prev[b.length] <= max;
}

/**
 * Transcription misspells surnames ("Svensson" heard as "Svenson"): one wrong
 * letter is forgiven from 5 letters, two from 9. Short names must match exactly.
 */
function closeSurname(saved: string, wanted: string): boolean {
  if (wanted.length < 5) return false;
  const max = wanted.length >= 9 ? 2 : 1;
  return saved.split(" ").some((part) => part.length >= 4 && distanceWithin(part, wanted, max));
}

function firstMatches(saved: string, wanted: string): boolean {
  return saved === wanted || saved.split(" ")[0] === wanted;
}

function lastMatches(saved: string, wanted: string): boolean {
  // compound surnames: "lopez garcia" matches "lopez"
  return saved === wanted || saved.split(" ").includes(wanted);
}

/**
 * Clients should come newest first (by updated_at): when several match,
 * the most recently touched ones are offered first.
 */
export function matchPerson<C extends MatchableClient>(
  person: { spoken: string; first_name: string | null; last_name: string | null },
  clients: readonly C[]
): MatchResult<C> {
  const { first, last } = personNames(person);
  const keyed = clients.map((c) => ({ c, first: nameKey(c.first_name), last: nameKey(c.last_name) }));
  type K = (typeof keyed)[number];
  const result = (list: K[], weak = false): MatchResult<C> => {
    if (list.length === 0) return { kind: "none", candidates: [] };
    const candidates = list.slice(0, MAX_CANDIDATES).map((k) => k.c);
    return { kind: list.length === 1 && !weak ? "one" : "many", candidates };
  };

  if (first && last) {
    const exact = keyed.filter((k) => k.first === first && k.last === last);
    if (exact.length) return result(exact);
  }

  if (last) {
    for (const variant of lastVariants(last)) {
      const byLast = keyed.filter((k) => lastMatches(k.last, variant));
      if (!byLast.length) continue;
      if (!first) return result(byLast);
      const both = byLast.filter((k) => firstMatches(k.first, first));
      // a different first name with the same surname may be a relative: ask
      return both.length ? result(both) : result(byLast, true);
    }
    // no exact surname: try a misspelt one. Sure only when the first name agrees.
    const byClose = keyed.filter((k) => lastVariants(last).some((variant) => closeSurname(k.last, variant)));
    if (byClose.length) {
      const both = first ? byClose.filter((k) => firstMatches(k.first, first)) : [];
      if (both.length) return result(both);
      if (!first) return result(byClose, true);
    }
    if (!first) {
      const byFirst = keyed.filter((k) => firstMatches(k.first, last));
      return result(byFirst);
    }
  }

  if (first) {
    const byFirst = keyed.filter((k) => firstMatches(k.first, first));
    // the surname said didn't match anyone, so a first-name match is only a guess
    return result(byFirst, Boolean(last));
  }

  return { kind: "none", candidates: [] };
}
