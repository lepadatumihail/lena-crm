/*
  Agency names are free text on a client. These helpers keep one spelling per
  agency and turn the values into list-filter options. Pure and client-safe.
*/

export type AgencyOption = { key: string; name: string; count: number };

const MAX_NAME_LENGTH = 120;

/**
 * Collapse every whitespace run, trim, cap at 120 characters, trim again.
 * U+FEFF is removed first: JavaScript's `\s` matches it and PostgreSQL's
 * doesn't, so dropping it keeps both sides in agreement.
 */
export function cleanAgencyName(raw: string | null | undefined): string {
  if (!raw) return "";
  return Array.from(
    raw.normalize("NFC").replace(/﻿/g, "").replace(/\s+/g, " ").trim()
  )
    .slice(0, MAX_NAME_LENGTH)
    .join("")
    .trimEnd();
}

/** What two spellings of the same agency share: "Solvilla" and " SOLVILLA". */
export function agencyKey(raw: string | null | undefined): string {
  return cleanAgencyName(raw).toLowerCase();
}

/** Cleaned spellings per key, each with how often it is used. */
function spellingsByKey(
  values: readonly (string | null | undefined)[]
): Map<string, Map<string, number>> {
  const groups = new Map<string, Map<string, number>>();
  for (const value of values) {
    const name = cleanAgencyName(value);
    if (!name) continue;
    const key = name.toLowerCase();
    const spellings = groups.get(key) ?? new Map<string, number>();
    spellings.set(name, (spellings.get(name) ?? 0) + 1);
    groups.set(key, spellings);
  }
  return groups;
}

/** The most-used spelling; ties go to the first in alphabetical order. */
function topSpelling(spellings: Map<string, number>): string {
  return [...spellings.entries()].sort(
    ([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, "en")
  )[0][0];
}

/**
 * The spelling to save for `raw`: the one the agent already uses most for the
 * same agency, else the cleaned input. `null` when the input is empty.
 */
export function pickSpelling(
  existing: readonly (string | null | undefined)[],
  raw: string | null | undefined
): string | null {
  const name = cleanAgencyName(raw);
  if (!name) return null;
  const spellings = spellingsByKey(existing).get(name.toLowerCase());
  return spellings ? topSpelling(spellings) : name;
}

/** One option per agency, most used first, then by name. */
export function agencyOptions(
  values: readonly (string | null | undefined)[]
): AgencyOption[] {
  return [...spellingsByKey(values).entries()]
    .map(([key, spellings]) => ({
      key,
      name: topSpelling(spellings),
      count: [...spellings.values()].reduce((sum, n) => sum + n, 0),
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
}

/*
  Filter values. Agency keys are namespaced ("k:solvilla") so an agency called
  "All" or "None" can't collide with a sentinel.
*/
export const ALL_AGENCIES = "all";
export const NO_AGENCY = "none";

export function agencyOptionValue(key: string): string {
  return `k:${key}`;
}

export type AgencyParam =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "key"; key: string }
  | { kind: "id"; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read an `?agency=` value. Anything unrecognised counts as "all". */
export function parseAgencyParam(value: string | null | undefined): AgencyParam {
  if (!value || value === ALL_AGENCIES) return { kind: "all" };
  if (value === NO_AGENCY) return { kind: "none" };
  if (value.startsWith("k:")) {
    const key = agencyKey(value.slice(2));
    return key ? { kind: "key", key } : { kind: "all" };
  }
  if (UUID.test(value)) return { kind: "id", id: value.toLowerCase() };
  return { kind: "all" };
}
