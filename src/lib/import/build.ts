/**
 * Turns a sheet, the agent's column choices and their settings into rows
 * ready for `import_clients()`. Pure: the review step shows exactly what this
 * returns, and nothing is sent until the agent has seen it.
 */
import { agencyKey, agencyOptions, cleanAgencyName } from "@/lib/agencies";
import type { ClientSide, Stage } from "@/lib/crm";
import { fold } from "@/lib/utils";
import {
  IMPORT_MAX_PROPERTIES,
  type ImportPreferences,
  type ImportProperty,
  type ImportRow,
} from "@/lib/validation/import";

import { contactKeys } from "./dedupe";
import type { ImportTarget, Mapping } from "./fields";
import {
  cleanPhone,
  normalizeDealType,
  normalizeLanguage,
  normalizeNationality,
  normalizeSellerRole,
  normalizeStage,
  parseBudget,
  parseCount,
  parseMoney,
  parsePropertyTypes,
  parseYesNo,
  pickEmail,
  splitFullName,
  tidyName,
} from "./normalize";
import type { ImportSheet } from "./read";

export type ImportSettings = {
  side: ClientSide;
  /** Index of the header line in the sheet's grid. */
  headerRow: number;
  /** Used when a row has no agency of its own. */
  agency: string | null;
  /** For numbers written without a country code, e.g. "+34". */
  defaultDial: string;
  /** Must belong to `side`. */
  stage: Stage;
  /** Keep only rows whose cell in `column` is one of `values`. */
  filter: { column: number; values: string[] } | null;
};

export type WarningCode =
  | "emailUnreadable"
  | "phoneUnreadable"
  | "phoneNoCountry"
  | "valueToNotes"
  | "notesTruncated"
  | "textTruncated"
  | "propertiesCapped"
  | "mayDuplicate";

export type SkipCode = "noName" | "filteredOut" | "duplicateInFile" | "duplicateExisting" | "overCap";

type Source = {
  /** Row numbers in the agent's own file, counting from 1. */
  lines: number[];
  /** The file's cells for those rows, for the "rows not imported" download. */
  source: string[][];
};

export type RowOutcome =
  | (Source & { status: "ready"; row: ImportRow; warnings: WarningCode[] })
  | (Source & { status: "skipped"; reason: SkipCode });

export type BuildOptions = {
  /** Every agency spelling the agent already uses. */
  agencies: readonly string[];
  labels: {
    /** Marks a value kept in the notes because it couldn't be read: "Phone (not recognised): …". */
    unreadable: string;
    /** Names a column that has no header. */
    column: (position: number) => string;
  };
};

const NOTES_MAX = 5000;

/* Plan 011's CSV writer puts "'" before a cell that would start a formula. */
const FORMULA_GUARD = /^'(?=[=@+\-\t\r])/;

function clip(value: string, max: number): { value: string; cut: boolean } {
  const chars = Array.from(value);
  return chars.length > max
    ? { value: chars.slice(0, max).join("").trimEnd(), cut: true }
    : { value, cut: false };
}

const sameWord = (a: string, b: string) => fold(a) === fold(b);
const hasContent = (value: string) => /[\p{L}\p{N}]/u.test(value);

export function buildImport(
  sheet: ImportSheet,
  mapping: Mapping,
  settings: ImportSettings,
  { agencies, labels }: BuildOptions
): RowOutcome[] {
  const { side } = settings;
  const headers = sheet.grid[settings.headerRow] ?? [];
  const label = (column: number) => headers[column] || labels.column(column + 1);

  const columnsOf = (target: ImportTarget) =>
    mapping
      .map((choice, column) => ({ choice, column }))
      .filter(({ choice }) => choice.target === target)
      .sort((a, b) => (a.choice.rank ?? 9) - (b.choice.rank ?? 9) || a.column - b.column)
      .map(({ column }) => column);
  const columns = new Map<ImportTarget, number[]>();
  for (const { target } of mapping) {
    if (!columns.has(target)) columns.set(target, columnsOf(target));
  }
  const firstColumn = (target: ImportTarget) => columns.get(target)?.[0];
  const keptColumns = mapping
    .map(({ target }, column) => ({ target, column }))
    .filter(({ target }) => target === "notes" || target === "add_to_notes")
    .map(({ column }) => column);

  // One spelling per agency, as the client form keeps it.
  const spellings = new Map(agencyOptions(agencies).map((a) => [a.key, a.name]));
  const agencyFor = (raw: string | null): string | null => {
    const name = cleanAgencyName(raw);
    if (!name) return null;
    const key = agencyKey(name);
    const spelling = spellings.get(key) ?? name;
    spellings.set(key, spelling);
    return spelling;
  };

  const outcomes: RowOutcome[] = [];
  /* Sellers: rows for the same person are one seller with several properties. */
  const sellers = new Map<string, number>();

  for (let r = settings.headerRow + 1; r < sheet.grid.length; r++) {
    const cells = sheet.grid[r].map((cell) => cell.replace(FORMULA_GUARD, ""));
    const source: Source = { lines: [sheet.rowNumbers[r]], source: [sheet.grid[r]] };
    const cell = (target: ImportTarget) => {
      const column = firstColumn(target);
      return column === undefined ? "" : (cells[column] ?? "");
    };

    if (settings.filter && !settings.filter.values.includes(cells[settings.filter.column] ?? "")) {
      outcomes.push({ ...source, status: "skipped", reason: "filteredOut" });
      continue;
    }

    const warnings = new Set<WarningCode>();
    const unusable: string[] = [];
    /** Keeps a value LeadWing couldn't read, in the agent's own words. */
    const keepRaw = (target: ImportTarget, raw: string, code: WarningCode = "valueToNotes") => {
      if (!hasContent(raw)) return;
      const column = firstColumn(target);
      unusable.push(`${label(column ?? 0)} (${labels.unreadable}): ${raw}`);
      warnings.add(code);
    };
    const clipped = (value: string, max: number): string | null => {
      const { value: text, cut } = clip(value.trim(), max);
      if (cut) warnings.add("textTruncated");
      return text || null;
    };

    // ---- name
    let first = [cell("first_name"), cell("middle_name")].filter(Boolean).map(tidyName).join(" ");
    let last = [cell("last_name"), cell("second_last_name")].filter(Boolean).map(tidyName).join(" ");
    const full = cell("full_name");
    if (full) {
      const split = splitFullName(full);
      if (!first && !last) ({ first, last } = split);
      else if (!last && sameWord(split.first, first)) last = split.last;
      else if (!first && sameWord(split.last, last)) first = split.first;
    }
    if (!first && !last) {
      outcomes.push({ ...source, status: "skipped", reason: "noName" });
      continue;
    }
    // The database wants a first name; a lone surname moves there.
    if (!first) [first, last] = [last, ""];

    // ---- email and phone: the first column with a usable value wins
    let email: string | null = null;
    for (const column of columns.get("email") ?? []) {
      const raw = cells[column];
      if (!raw) continue;
      const picked = pickEmail(raw);
      const spare = email ? [picked.email, ...picked.extra] : picked.extra;
      if (!email) email = picked.email;
      for (const other of spare) if (other) unusable.push(`${label(column)}: ${other}`);
      if (!picked.email && hasContent(raw)) {
        unusable.push(`${label(column)} (${labels.unreadable}): ${raw}`);
        warnings.add("emailUnreadable");
      }
    }

    let phone: string | null = null;
    for (const column of columns.get("phone") ?? []) {
      const raw = cells[column];
      if (!raw) continue;
      if (phone) {
        unusable.push(`${label(column)}: ${raw}`);
        continue;
      }
      const cleaned = cleanPhone(raw, settings.defaultDial);
      phone = cleaned.phone;
      if (cleaned.warning === "phoneNoCountry") warnings.add("phoneNoCountry");
      if (cleaned.warning === "phoneUnreadable") {
        unusable.push(`${label(column)} (${labels.unreadable}): ${raw}`);
        warnings.add("phoneUnreadable");
      }
      for (const other of cleaned.extra) unusable.push(`${label(column)}: ${other}`);
    }

    // ---- flags
    const stageRaw = cell("stage");
    const stage = stageRaw ? normalizeStage(stageRaw, side) : null;
    if (stageRaw && !stage) keepRaw("stage", stageRaw);

    const yesNo = (target: ImportTarget): boolean | null => {
      const raw = cell(target);
      const value = raw ? parseYesNo(raw) : null;
      if (raw && value === null) keepRaw(target, raw);
      return value;
    };
    const priority = yesNo("priority") ?? false;
    const active = yesNo("is_active");
    const inactive = yesNo("is_inactive");
    const isActive = active ?? (inactive === null ? true : !inactive);

    const dealRaw = side === "buyer" ? cell("deal_type") : "";
    const dealType = dealRaw ? normalizeDealType(dealRaw) : null;
    if (dealRaw && !dealType) keepRaw("deal_type", dealRaw);
    const roleRaw = side === "seller" ? cell("seller_role") : "";
    const sellerRole = roleRaw ? normalizeSellerRole(roleRaw) : null;
    if (roleRaw && !sellerRole) keepRaw("seller_role", roleRaw);

    // ---- numbers that may not parse
    const money = (target: ImportTarget): number | null => {
      const raw = cell(target);
      const value = raw ? parseMoney(raw) : null;
      if (raw && value === null) keepRaw(target, raw);
      return value;
    };
    const count = (target: ImportTarget): number | null => {
      const raw = cell(target);
      const value = raw ? parseCount(raw) : null;
      if (raw && value === null) keepRaw(target, raw);
      return value;
    };
    const propertyTypes = (target: ImportTarget) => {
      const raw = cell(target);
      const parsed = parsePropertyTypes(raw);
      for (const part of parsed.unknown) keepRaw(target, part);
      return parsed.types;
    };

    let preferences: ImportPreferences | null = null;
    let property: ImportProperty | null = null;
    if (side === "buyer") {
      let min = money("budget_min");
      let max = money("budget_max");
      const budgetRaw = cell("budget");
      if (budgetRaw) {
        // An explicit min or max column wins over the same bound of a range.
        const range = parseBudget(budgetRaw);
        if (range.min === null && range.max === null) keepRaw("budget", budgetRaw);
        min ??= range.min;
        max ??= range.max;
      }
      if (min !== null && max !== null && min > max) [min, max] = [max, min];
      const search: ImportPreferences = {
        property_types: propertyTypes("property_types"),
        budget_min: min,
        budget_max: max,
        bedrooms: count("bedrooms"),
        bathrooms: count("bathrooms"),
        area_notes: clipped(cell("area_notes"), 2000),
      };
      const empty =
        search.property_types.length === 0 &&
        [search.budget_min, search.budget_max, search.bedrooms, search.bathrooms, search.area_notes].every(
          (v) => v === null
        );
      preferences = empty ? null : search;
    } else {
      const details: ImportProperty = {
        property_type: propertyTypes("property_type")[0] ?? null,
        price: money("price"),
        bedrooms: count("property_bedrooms"),
        address: clipped(cell("address"), 300),
        city: clipped(cell("city"), 120),
        notes: clipped(cell("property_notes"), 2000),
      };
      property = Object.values(details).every((v) => v === null) ? null : details;
    }

    // ---- notes: the agent's own, then kept columns, then what couldn't be read
    const noteLines: string[] = [];
    const plainNotes = firstColumn("notes");
    if (plainNotes !== undefined && cells[plainNotes]) noteLines.push(cells[plainNotes]);
    for (const column of keptColumns) {
      if (column === plainNotes) continue;
      if (cells[column]) noteLines.push(`${label(column)}: ${cells[column]}`);
    }
    noteLines.push(...unusable);
    let notes: string | null = noteLines.join("\n") || null;
    if (notes && Array.from(notes).length > NOTES_MAX) {
      notes = `${clip(notes, NOTES_MAX - 1).value}…`;
      warnings.add("notesTruncated");
    }

    const row: ImportRow = {
      first_name: clipped(first, 100) ?? first,
      last_name: clipped(last, 100) ?? "",
      email,
      phone,
      language: normalizeLanguage(cell("language")),
      nationality: normalizeNationality(cell("nationality")),
      agency: agencyFor(cell("agency") || settings.agency),
      notes,
      priority,
      is_active: isActive,
      stage: stage ?? settings.stage,
      deal_type: dealType,
      seller_role: sellerRole,
      preferences,
      properties: property ? [property] : [],
    };

    if (side === "seller") {
      const keys = contactKeys(row);
      if (keys.length === 0) keys.push(`n:${fold(`${row.first_name} ${row.last_name}`)}`);

      const holder = keys.map((k) => sellers.get(k)).find((i) => i !== undefined);
      if (holder !== undefined) {
        const seller = outcomes[holder];
        if (seller.status === "ready") {
          mergeSeller(seller, row, source, warnings);
          for (const k of keys) sellers.set(k, holder);
          continue;
        }
      }
      for (const k of keys) sellers.set(k, outcomes.length);
    }

    outcomes.push({ ...source, status: "ready", row, warnings: [...warnings] });
  }
  return outcomes;
}

/** The first row's contact details win; a later row fills what is empty and adds its property. */
function mergeSeller(
  seller: Extract<RowOutcome, { status: "ready" }>,
  row: ImportRow,
  source: Source,
  warnings: Set<WarningCode>
) {
  const into = seller.row;
  into.last_name ||= row.last_name;
  into.email ??= row.email;
  into.phone ??= row.phone;
  into.language ??= row.language;
  into.nationality ??= row.nationality;
  into.agency ??= row.agency;
  into.notes ??= row.notes;
  into.seller_role ??= row.seller_role;

  seller.lines.push(...source.lines);
  seller.source.push(...source.source);
  for (const property of row.properties) {
    if (into.properties.length < IMPORT_MAX_PROPERTIES) into.properties.push(property);
    else warnings.add("propertiesCapped");
  }
  for (const code of warnings) {
    if (!seller.warnings.includes(code)) seller.warnings.push(code);
  }
}
