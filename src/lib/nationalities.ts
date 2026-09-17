import { fold } from "@/lib/utils";

/*
  Nationalities a client can be given. A client's nationality is stored as the
  English name ("British"), like languages are; `nationalityLabel` in
  i18n/labels.ts shows it in the agent's UI language. One entry per country in
  lib/countries.ts.
*/
export type Nationality = {
  iso: string;
  name: string;
  /** Other words agents type for it; they only help the search. */
  aliases?: string[];
};

export const NATIONALITIES: Nationality[] = [
  { iso: "AR", name: "Argentinian" },
  { iso: "AU", name: "Australian" },
  { iso: "AT", name: "Austrian" },
  { iso: "BE", name: "Belgian" },
  { iso: "BR", name: "Brazilian" },
  { iso: "BG", name: "Bulgarian" },
  { iso: "CA", name: "Canadian" },
  { iso: "CN", name: "Chinese" },
  { iso: "HR", name: "Croatian" },
  { iso: "CY", name: "Cypriot" },
  { iso: "CZ", name: "Czech" },
  { iso: "DK", name: "Danish" },
  { iso: "EG", name: "Egyptian" },
  { iso: "EE", name: "Estonian" },
  { iso: "FI", name: "Finnish" },
  { iso: "FR", name: "French" },
  { iso: "DE", name: "German" },
  { iso: "GI", name: "Gibraltarian" },
  { iso: "GR", name: "Greek" },
  { iso: "HK", name: "Hong Konger" },
  { iso: "HU", name: "Hungarian" },
  { iso: "IS", name: "Icelandic" },
  { iso: "IN", name: "Indian" },
  { iso: "ID", name: "Indonesian" },
  { iso: "IE", name: "Irish" },
  { iso: "IL", name: "Israeli" },
  { iso: "IT", name: "Italian" },
  { iso: "JP", name: "Japanese" },
  { iso: "KW", name: "Kuwaiti" },
  { iso: "LV", name: "Latvian" },
  { iso: "LT", name: "Lithuanian" },
  { iso: "LU", name: "Luxembourgish" },
  { iso: "MT", name: "Maltese" },
  { iso: "MX", name: "Mexican" },
  { iso: "MC", name: "Monegasque" },
  { iso: "MA", name: "Moroccan" },
  { iso: "NL", name: "Dutch", aliases: ["Holland", "Holandesa"] },
  { iso: "NZ", name: "New Zealander" },
  { iso: "NO", name: "Norwegian" },
  { iso: "PL", name: "Polish" },
  { iso: "PT", name: "Portuguese" },
  { iso: "QA", name: "Qatari" },
  { iso: "RO", name: "Romanian" },
  { iso: "RU", name: "Russian" },
  { iso: "SA", name: "Saudi" },
  { iso: "SG", name: "Singaporean" },
  { iso: "SK", name: "Slovak" },
  { iso: "SI", name: "Slovenian" },
  { iso: "ZA", name: "South African" },
  { iso: "KR", name: "South Korean" },
  { iso: "ES", name: "Spanish" },
  { iso: "SE", name: "Swedish" },
  { iso: "CH", name: "Swiss" },
  { iso: "TR", name: "Turkish" },
  { iso: "UA", name: "Ukrainian" },
  { iso: "AE", name: "Emirati", aliases: ["UAE", "EAU"] },
  { iso: "GB", name: "British", aliases: ["UK", "Reino Unido"] },
  { iso: "US", name: "American", aliases: ["USA", "EE. UU.", "EEUU"] },
];

const BY_NAME = new Map(NATIONALITIES.map((n) => [fold(n.name), n]));

/** The listed nationality a stored value names, whatever its casing. */
export function findNationality(
  value: string | null | undefined
): Nationality | null {
  return value ? (BY_NAME.get(fold(value)) ?? null) : null;
}
