import type { ImportRow } from "@/lib/validation/import";

import type { RowOutcome } from "./build";

/** A phone's digits, so "+34 600123456" and "0034 600 123 456" are one number. */
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^00/, "");
}

/**
 * What marks two rows, or a row and a saved client, as the same person. The
 * server builds the same keys from the agent's clients and sends only these.
 */
export function contactKeys(contact: Pick<ImportRow, "email" | "phone">): string[] {
  const keys: string[] = [];
  if (contact.email) keys.push(`e:${contact.email.trim().toLowerCase()}`);
  const digits = contact.phone ? phoneKey(contact.phone) : "";
  if (digits) keys.push(`p:${digits}`);
  return keys;
}

/**
 * A row that repeats an earlier row is always skipped. A row that matches a
 * saved client is skipped while `skipExisting` is on; otherwise it stays, with
 * a warning. Returns new outcomes, so the review step can flip the switch.
 */
export function markDuplicates(
  outcomes: RowOutcome[],
  existingKeys: ReadonlySet<string>,
  skipExisting: boolean
): RowOutcome[] {
  const seen = new Set<string>();
  return outcomes.map((outcome) => {
    if (outcome.status !== "ready") return outcome;
    const keys = contactKeys(outcome.row);
    const { lines, source } = outcome;
    const repeated = keys.some((key) => seen.has(key));
    for (const key of keys) seen.add(key);

    if (repeated) return { lines, source, status: "skipped", reason: "duplicateInFile" };
    if (!keys.some((key) => existingKeys.has(key))) return outcome;
    if (skipExisting) return { lines, source, status: "skipped", reason: "duplicateExisting" };
    return { ...outcome, warnings: [...outcome.warnings, "mayDuplicate"] };
  });
}

/** On Free, the first rows that fit under the plan's cap stay; `null` is no cap. */
export function applyCapacity(outcomes: RowOutcome[], capacity: number | null): RowOutcome[] {
  if (capacity === null) return outcomes;
  let room = capacity;
  return outcomes.map((outcome) => {
    if (outcome.status !== "ready") return outcome;
    if (room > 0) {
      room--;
      return outcome;
    }
    return { lines: outcome.lines, source: outcome.source, status: "skipped", reason: "overCap" };
  });
}
