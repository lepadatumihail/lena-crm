/**
 * The wizard's first guess at what each column is. The agent can change any
 * of it; a good guess is what saves them matching twenty columns by hand.
 */
import type { ClientSide } from "@/lib/crm";

import { SHARED_TARGETS, type ColumnChoice, type ImportTarget, type Mapping } from "./fields";
import {
  knownLanguage,
  normalizeDealType,
  normalizeSellerRole,
  normalizeStage,
  parsePropertyTypes,
  parseYesNo,
} from "./normalize";
import { foldHeader, matchHeader, targetFor, type HeaderMatch } from "./synonyms";

const SAMPLE_SIZE = 50;

/* Targets whose values must be words LeadWing knows; a custom "Estado" ("Caliente") is a note. */
function recognizer(target: ImportTarget, side: ClientSide): ((value: string) => boolean) | null {
  switch (target) {
    case "stage":
      return (value) => normalizeStage(value, side) !== null;
    case "deal_type":
      return (value) => normalizeDealType(value) !== null;
    case "seller_role":
      return (value) => normalizeSellerRole(value) !== null;
    case "property_types":
    case "property_type":
      return (value) => parsePropertyTypes(value).types.length > 0;
    case "language":
      return (value) => knownLanguage(value) !== null;
    case "priority":
    case "is_active":
    case "is_inactive":
      return (value) => parseYesNo(value) !== null;
    default:
      return null;
  }
}

function mostlyRecognized(
  column: number,
  rows: string[][],
  recognize: (value: string) => boolean
): boolean {
  let seen = 0;
  let known = 0;
  for (const row of rows) {
    const value = row[column];
    if (!value) continue;
    seen++;
    if (recognize(value)) known++;
    if (seen === SAMPLE_SIZE) break;
  }
  return seen === 0 || known * 2 >= seen;
}

/** One choice per column. `rows` are the lines under the header. */
export function autoMap(headers: string[], rows: string[][], side: ClientSide): Mapping {
  const matches: HeaderMatch[] = headers.map(matchHeader);
  const hasFirst = matches.some((m) => m.concept === "first_name");
  const hasLast = matches.some((m) => m.concept === "last_name");

  const choices: ColumnChoice[] = matches.map(({ concept, rank }) => {
    if (concept !== "name") return { target: targetFor(concept, side), rank };
    // Beside "Apellidos" it is a first name; beside both (Google's old "Name") it repeats them.
    if (!hasLast) return { target: "full_name" };
    return { target: hasFirst ? "ignore" : "first_name" };
  });

  choices.forEach((choice, column) => {
    const recognize = recognizer(choice.target, side);
    if (recognize && !mostlyRecognized(column, rows, recognize)) {
      choices[column] = { target: "add_to_notes" };
    }
  });

  // One column per field: a dictionary match beats a keyword guess, then the leftmost wins.
  const winners = new Map<ImportTarget, number>();
  choices.forEach(({ target }, column) => {
    if (SHARED_TARGETS.includes(target)) return;
    const holder = winners.get(target);
    if (holder === undefined || (matches[column].exact && !matches[holder].exact)) {
      winners.set(target, column);
    }
  });
  return choices.map((choice, column) => {
    if (SHARED_TARGETS.includes(choice.target)) return choice;
    return winners.get(choice.target) === column ? choice : { target: "add_to_notes" };
  });
}

/** Identifies a file layout, so the wizard can bring back the agent's choices for it. */
export function mappingSignature(headers: string[]): string {
  return headers.map(foldHeader).join("|");
}
