/**
 * Turns the text agents keep in spreadsheets into LeadWing's values. Every
 * function is pure; what it can't read comes back as `null`, and the caller
 * keeps the raw text in the client's notes.
 */
import { z } from "zod";

import enCrm from "../../../messages/en/crm.json";
import esCrm from "../../../messages/es/crm.json";
import ruCrm from "../../../messages/ru/crm.json";
import { COUNTRIES, countryName, parsePhone } from "@/lib/countries";
import {
  BUYER_STAGES,
  LANGUAGES,
  PROPERTY_TYPES,
  SELLER_STAGES,
  type ClientSide,
  type PropertyType,
  type Stage,
} from "@/lib/crm";
import { NATIONALITIES } from "@/lib/nationalities";

import { foldHeader as key } from "./synonyms";

/* ---------------------------------------------------------------- names */

const HONORIFICS = new Set([
  "mr", "mrs", "ms", "miss", "dr", "dra", "sr", "sra", "srta", "don", "dona", "dna", "herr", "frau", "mme",
]);
/** One letter only counts with its dot: "D. Juan", "M. Dupont". */
const DOTTED_HONORIFICS = new Set(["d.", "m."]);
const PARTICLES = new Set(["de", "del", "la", "las", "los", "y", "van", "von", "der", "den", "du", "da", "di"]);

function capitalize(word: string): string {
  // "o'brien" → "O'Brien", "jean-pierre" → "Jean-Pierre"
  return word.replace(/(^|[-'’])(\p{L})/gu, (_, mark: string, letter: string) =>
    mark + letter.toLocaleUpperCase("es")
  );
}

/** Collapses spaces, and turns an ALL CAPS value into title case. */
export function tidyName(raw: string): string {
  const value = raw.replace(/\s+/g, " ").trim();
  const letters = value.replace(/[^\p{L}]/gu, "");
  const shouting = letters.length > 3 && value === value.toLocaleUpperCase("es");
  if (!shouting) return value;
  return value
    .toLocaleLowerCase("es")
    .split(" ")
    .map((word, i) => (i > 0 && PARTICLES.has(word) ? word : capitalize(word)))
    .join(" ");
}

function isHonorific(word: string): boolean {
  const lower = word.toLowerCase();
  return DOTTED_HONORIFICS.has(lower) || HONORIFICS.has(key(lower));
}

/**
 * "García López, María" and "María García López" both give María / García
 * López: after the first word everything is the last name, which keeps
 * Spanish double surnames together.
 */
export function splitFullName(raw: string): { first: string; last: string } {
  let value = tidyName(raw);
  const words = value.split(" ");
  if (words.length > 1 && isHonorific(words[0])) value = words.slice(1).join(" ");

  const comma = value.split(",").map((part) => part.trim());
  if (comma.length === 2 && comma[0] && comma[1]) return { first: comma[1], last: comma[0] };

  const [first = "", ...rest] = value.replace(/,/g, " ").split(" ").filter(Boolean);
  return { first, last: rest.join(" ") };
}

/* ---------------------------------------------------------------- email */

const emailSchema = z.email().max(254);

/** The first address in the cell, and any others: `Juan <juan@x.es>; otro@y.com`. */
export function pickEmail(raw: string): { email: string | null; extra: string[] } {
  const found = raw
    .split(/[\s,;<>()]+/)
    .map((token) => token.replace(/^mailto:/i, "").replace(/[.]+$/, ""))
    .filter((token) => emailSchema.safeParse(token).success);
  const [email = null, ...extra] = [...new Set(found)];
  return { email, extra };
}

/* ---------------------------------------------------------------- phone */

export type PhoneWarning = "phoneUnreadable" | "phoneNoCountry";
export type CleanPhone = { phone: string | null; warning?: PhoneWarning; extra: string[] };

const EXPONENT = /^(\d)(?:[.,](\d+))?e\+?(\d+)$/i;
const MAX_PHONE_LENGTH = 50;

/** Excel's "3.46001E+10": readable only when no digit was rounded away. */
function fromExponent(text: string): string | null | undefined {
  const match = EXPONENT.exec(text.replace(/\s/g, ""));
  if (!match) return undefined;
  const [, lead, decimals = "", exponent] = match;
  const shift = Number(exponent);
  if (decimals.length > shift || shift > 15) return null;
  // Trailing zeros are dropped by Excel, so "3.46E+10" could be any number near it.
  return decimals.length === shift ? lead + decimals : null;
}

function withDial(dial: string, digits: string): string {
  return `${dial} ${digits}`;
}

/**
 * A phone in the form the app stores, "+34 600123456". A number with no
 * country code gets `defaultDial` when it fits that country; a Spanish default
 * never guesses for a number that doesn't look Spanish, because a wrong code
 * is worse than a missing one.
 */
export function cleanPhone(raw: string, defaultDial: string): CleanPhone {
  const parts = raw
    .split(/[/,;]|\s+o\s+|\s+or\s+/i)
    .map((part) => part.trim())
    .filter((part) => part.replace(/\D/g, "").length >= 6);
  const [first = raw.trim(), ...extra] = parts;

  const text = first.replace(/^'/, "").replace(/^tel:/i, "").trim();
  const exponent = fromExponent(text);
  if (exponent === null) return { phone: null, warning: "phoneUnreadable", extra };

  let digits = exponent ?? text.replace(/\D/g, "");
  if (!digits) return { phone: null, extra };
  let international = exponent === undefined && /^\(?\s*\+/.test(text);
  if (!international && digits.startsWith("00")) {
    international = true;
    digits = digits.slice(2);
  }

  const fits = (count: number) => count >= 6 && count <= 15;
  const flagged = (): CleanPhone => ({
    phone: digits.slice(0, MAX_PHONE_LENGTH),
    warning: "phoneNoCountry",
    extra,
  });

  if (international) {
    if (!fits(digits.length)) return flagged();
    const { dial, number } = parsePhone(`+${digits}`);
    // A code the app doesn't list is kept as typed.
    return { phone: number.startsWith("+") ? number : withDial(dial, number), extra };
  }

  const code = defaultDial.replace(/\D/g, "");
  if (code === "34") {
    if (/^[6-9]\d{8}$/.test(digits)) return { phone: withDial("+34", digits), extra };
    if (/^34[6-9]\d{8}$/.test(digits)) return { phone: withDial("+34", digits.slice(2)), extra };
    // A leading 0 is never Spanish: a foreign number, country unknown.
    return flagged();
  }

  let national = digits;
  if (digits.startsWith(code) && digits.length >= code.length + 8) {
    national = digits.slice(code.length);
  } else if (code !== "39" && digits.startsWith("0")) {
    // Italy keeps its leading 0 after the country code.
    national = digits.slice(1);
  }
  if (!fits(code.length + national.length)) return flagged();
  return { phone: withDial(`+${code}`, national), extra };
}

/* ---------------------------------------------------------------- money */

export { parseBudget, parseMoney } from "./money";

/* ------------------------------------------------------- counts, yes/no */

const MAX_COUNT = 50;

/** "3", "3+", "3-4" (the lower one), "3 dormitorios". Words give `null`. */
export function parseCount(raw: string): number | null {
  const numbers = (raw.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Math.floor(Number(n.replace(",", "."))));
  if (numbers.length === 0) return null;
  const value = /^\s*\d+\s*[-–]\s*\d+/.test(raw) ? Math.min(numbers[0], numbers[1]) : numbers[0];
  return value <= MAX_COUNT ? value : null;
}

const YES = new Set(["yes", "y", "true", "1", "x", "si", "s", "ja", "oui", "verdadero", "да", "✓", "✔", "*"]);
const NO = new Set(["no", "n", "false", "0", "nein", "non", "falso", "нет"]);

export function parseYesNo(raw: string): boolean | null {
  const value = raw.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (YES.has(value)) return true;
  if (NO.has(value)) return false;
  return null;
}

/* ---------------------------------------------------------- vocabularies */

function vocabulary<T>(entries: Iterable<readonly [T, Iterable<string>]>): Map<string, T> {
  const words = new Map<string, T>();
  for (const [value, names] of entries) {
    for (const name of names) {
      const folded = key(name);
      if (folded && !words.has(folded)) words.set(folded, value);
    }
  }
  return words;
}

const PROPERTY_WORDS: Record<PropertyType, string[]> = {
  apartment: ["piso", "apartamento", "flat", "ático", "penthouse", "estudio", "studio", "dúplex", "loft", "wohnung"],
  house: ["casa", "finca", "cortijo", "bungalow", "country house", "haus", "maison"],
  villa: ["chalet", "chalé", "detached", "independiente"],
  townhouse: ["adosado", "adosada", "casa adosada", "pareado", "semi-detached", "town house", "reihenhaus"],
  new_development: ["obra nueva", "promoción", "new build", "off plan"],
  plot: ["parcela", "solar", "terreno", "land", "grundstück"],
  commercial: ["local", "local comercial", "oficina", "office", "shop", "tienda", "nave", "warehouse", "negocio", "hotel"],
};

const PROPERTY_VOCABULARY = vocabulary(
  PROPERTY_TYPES.map(
    (type) =>
      [type, [type, enCrm.propertyTypes[type], esCrm.propertyTypes[type], ruCrm.propertyTypes[type], ...PROPERTY_WORDS[type]]] as const
  )
);
/* Longest first, so "casa adosada" is a townhouse before "casa" is a house. */
const PROPERTY_PHRASES = [...PROPERTY_VOCABULARY.keys()].sort((a, b) => b.length - a.length);

function propertyTypeOf(part: string): PropertyType | null {
  const folded = key(part);
  if (!folded) return null;
  const exact = PROPERTY_VOCABULARY.get(folded);
  if (exact) return exact;
  // "Villa de lujo", "Piso en Marbella"
  const phrase = PROPERTY_PHRASES.find((p) => ` ${folded} `.includes(` ${p} `));
  return phrase ? (PROPERTY_VOCABULARY.get(phrase) ?? null) : null;
}

/** "Villa, Piso / Solar" → the listed types, and the parts that aren't one. */
export function parsePropertyTypes(raw: string): { types: PropertyType[]; unknown: string[] } {
  const types: PropertyType[] = [];
  const unknown: string[] = [];
  for (const part of raw.split(/[,;/+]|\s+y\s+|\s+and\s+/i)) {
    const text = part.trim();
    if (!text) continue;
    const type = propertyTypeOf(text);
    if (!type) unknown.push(text);
    else if (!types.includes(type)) types.push(type);
  }
  return { types, unknown };
}

type Language = (typeof LANGUAGES)[number];

/* Native names and codes, on top of the English and Spanish labels. */
const LANGUAGE_WORDS: Record<Language, string[]> = {
  English: ["en", "eng"],
  Spanish: ["castellano", "es", "esp", "spa"],
  German: ["deutsch", "de", "deu", "ger"],
  French: ["français", "fr", "fra", "fre"],
  Dutch: ["holandés", "nederlands", "nl", "nld", "dut"],
  Swedish: ["svenska", "sv", "swe"],
  Russian: ["русский", "ru", "rus"],
  Arabic: ["العربية", "ar", "ara"],
  Italian: ["it", "ita"],
  Polish: ["polski", "pl", "pol"],
  Norwegian: ["norsk", "nb", "nor"],
  Danish: ["dansk", "da", "dan"],
  Finnish: ["finlandés", "suomi", "fi", "fin"],
  Portuguese: ["português", "pt", "por"],
  Ukrainian: ["українська", "uk", "ukr"],
  Chinese: ["中文", "mandarin", "mandarín", "zh", "zho", "chi"],
  Turkish: ["türkçe", "tr", "tur"],
  Romanian: ["română", "ro", "ron", "rum"],
  Czech: ["čeština", "cs", "ces", "cze"],
  Hebrew: ["עברית", "he", "heb"],
};

const LANGUAGE_VOCABULARY = vocabulary(
  LANGUAGES.map(
    (language) =>
      [language, [language, enCrm.languages[language], esCrm.languages[language], ruCrm.languages[language], ...LANGUAGE_WORDS[language]]] as const
  )
);

const MAX_LABEL_LENGTH = 50;

function firstKnown<T>(raw: string, words: Map<string, T>): T | null {
  for (const part of [raw, ...raw.split(/[,;/+&]|\s+y\s+|\s+and\s+/i)]) {
    const value = words.get(key(part));
    if (value !== undefined) return value;
  }
  return null;
}

export function knownLanguage(raw: string): Language | null {
  return firstKnown(raw, LANGUAGE_VOCABULARY);
}

/** A listed language ("Alemán", "de" → "German"), else the text as typed. */
export function normalizeLanguage(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  return knownLanguage(text) ?? text.slice(0, MAX_LABEL_LENGTH).trim();
}

/** Spanish labels are feminine ("Alemana"); agents also type "Alemán", "Británico". */
function masculine(label: string): string[] {
  const folded = key(label);
  if (!folded.endsWith("a")) return [];
  const stem = folded.slice(0, -1);
  // "francesa" → "frances", "alemana" → "aleman", "espanola" → "espanol"; else "rusa" → "ruso".
  return /(es|an|ol)$/.test(stem) ? [stem, `${stem}o`] : [`${stem}o`];
}

const NATIONALITY_VOCABULARY = vocabulary(
  NATIONALITIES.map((n) => {
    const iso = n.iso as keyof typeof enCrm.nationalities;
    const es = esCrm.nationalities[iso];
    const country = COUNTRIES.find((c) => c.iso === n.iso);
    return [
      n.name,
      [
        n.name,
        enCrm.nationalities[iso],
        es,
        ...masculine(es),
        ruCrm.nationalities[iso],
        ...(n.aliases ?? []),
        ...(country ? [country.name, countryName(country.iso, "es")] : []),
        n.iso,
      ],
    ] as const;
  })
);

/** A listed nationality ("Británica", "UK" → "British"), else the text as typed. */
export function normalizeNationality(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  return firstKnown(text, NATIONALITY_VOCABULARY) ?? text.slice(0, MAX_LABEL_LENGTH).trim();
}

const STAGE_WORDS: Record<Stage, string[]> = {
  new: ["nueva", "lead"],
  contacted: ["contactada"],
  qualified: ["calificado", "cualificada", "calificada"],
  viewing: ["visitas", "viewings"],
  reserved: ["reservada", "reserva", "arras"],
  pending: [],
};

const STAGE_VOCABULARY = vocabulary(
  ([...BUYER_STAGES, ...SELLER_STAGES] as Stage[]).map(
    (stage) => [stage, [stage, enCrm.stages[stage], esCrm.stages[stage], ruCrm.stages[stage], ...STAGE_WORDS[stage]]] as const
  )
);

/** `null` for a stage the file's side doesn't have; "qualified" exists on both. */
export function normalizeStage(raw: string, side: ClientSide): Stage | null {
  const stage = STAGE_VOCABULARY.get(key(raw));
  if (!stage) return null;
  const stages: readonly string[] = side === "buyer" ? BUYER_STAGES : SELLER_STAGES;
  return stages.includes(stage) ? stage : null;
}

const DEAL_TYPE_VOCABULARY = vocabulary<"direct" | "collab">([
  ["direct", ["direct", enCrm.dealTypes.direct, esCrm.dealTypes.direct, ruCrm.dealTypes.direct, "directa"]],
  ["collab", ["collab", enCrm.dealTypes.collab, esCrm.dealTypes.collab, ruCrm.dealTypes.collab, "compartida", "compartido", "shared"]],
]);

export function normalizeDealType(raw: string): "direct" | "collab" | null {
  return DEAL_TYPE_VOCABULARY.get(key(raw)) ?? null;
}

const SELLER_ROLE_VOCABULARY = vocabulary<"owner" | "representative">([
  ["owner", ["owner", enCrm.sellerRoles.owner, esCrm.sellerRoles.owner, ruCrm.sellerRoles.owner, "propietaria", "dueño", "dueña"]],
  [
    "representative",
    ["representative", enCrm.sellerRoles.representative, esCrm.sellerRoles.representative, ruCrm.sellerRoles.representative, "apoderado", "apoderada"],
  ],
]);

export function normalizeSellerRole(raw: string): "owner" | "representative" | null {
  return SELLER_ROLE_VOCABULARY.get(key(raw)) ?? null;
}
