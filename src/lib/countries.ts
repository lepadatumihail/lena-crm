import { intlTag } from "@/i18n/config";

export type Country = { name: string; iso: string; dial: string };

/** Default to Spain — the home market. */
export const DEFAULT_DIAL = "+34";

// Curated list — Europe-heavy (typical clientele of Spain-based agents) plus major markets.
export const COUNTRIES: Country[] = [
  { name: "Argentina", iso: "AR", dial: "+54" },
  { name: "Australia", iso: "AU", dial: "+61" },
  { name: "Austria", iso: "AT", dial: "+43" },
  { name: "Belgium", iso: "BE", dial: "+32" },
  { name: "Brazil", iso: "BR", dial: "+55" },
  { name: "Bulgaria", iso: "BG", dial: "+359" },
  { name: "Canada", iso: "CA", dial: "+1" },
  { name: "China", iso: "CN", dial: "+86" },
  { name: "Croatia", iso: "HR", dial: "+385" },
  { name: "Cyprus", iso: "CY", dial: "+357" },
  { name: "Czechia", iso: "CZ", dial: "+420" },
  { name: "Denmark", iso: "DK", dial: "+45" },
  { name: "Egypt", iso: "EG", dial: "+20" },
  { name: "Estonia", iso: "EE", dial: "+372" },
  { name: "Finland", iso: "FI", dial: "+358" },
  { name: "France", iso: "FR", dial: "+33" },
  { name: "Germany", iso: "DE", dial: "+49" },
  { name: "Gibraltar", iso: "GI", dial: "+350" },
  { name: "Greece", iso: "GR", dial: "+30" },
  { name: "Hong Kong", iso: "HK", dial: "+852" },
  { name: "Hungary", iso: "HU", dial: "+36" },
  { name: "Iceland", iso: "IS", dial: "+354" },
  { name: "India", iso: "IN", dial: "+91" },
  { name: "Indonesia", iso: "ID", dial: "+62" },
  { name: "Ireland", iso: "IE", dial: "+353" },
  { name: "Israel", iso: "IL", dial: "+972" },
  { name: "Italy", iso: "IT", dial: "+39" },
  { name: "Japan", iso: "JP", dial: "+81" },
  { name: "Kuwait", iso: "KW", dial: "+965" },
  { name: "Latvia", iso: "LV", dial: "+371" },
  { name: "Lithuania", iso: "LT", dial: "+370" },
  { name: "Luxembourg", iso: "LU", dial: "+352" },
  { name: "Malta", iso: "MT", dial: "+356" },
  { name: "Mexico", iso: "MX", dial: "+52" },
  { name: "Monaco", iso: "MC", dial: "+377" },
  { name: "Morocco", iso: "MA", dial: "+212" },
  { name: "Netherlands", iso: "NL", dial: "+31" },
  { name: "New Zealand", iso: "NZ", dial: "+64" },
  { name: "Norway", iso: "NO", dial: "+47" },
  { name: "Poland", iso: "PL", dial: "+48" },
  { name: "Portugal", iso: "PT", dial: "+351" },
  { name: "Qatar", iso: "QA", dial: "+974" },
  { name: "Romania", iso: "RO", dial: "+40" },
  { name: "Russia", iso: "RU", dial: "+7" },
  { name: "Saudi Arabia", iso: "SA", dial: "+966" },
  { name: "Singapore", iso: "SG", dial: "+65" },
  { name: "Slovakia", iso: "SK", dial: "+421" },
  { name: "Slovenia", iso: "SI", dial: "+386" },
  { name: "South Africa", iso: "ZA", dial: "+27" },
  { name: "South Korea", iso: "KR", dial: "+82" },
  { name: "Spain", iso: "ES", dial: "+34" },
  { name: "Sweden", iso: "SE", dial: "+46" },
  { name: "Switzerland", iso: "CH", dial: "+41" },
  { name: "Turkey", iso: "TR", dial: "+90" },
  { name: "Ukraine", iso: "UA", dial: "+380" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971" },
  { name: "United Kingdom", iso: "GB", dial: "+44" },
  { name: "United States", iso: "US", dial: "+1" },
];

/** Turn a 2-letter ISO code into its flag emoji. */
export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/** English names by ISO code — the reference copy, and the fallback below. */
const ENGLISH_NAMES = new Map(COUNTRIES.map((c) => [c.iso, c.name]));

const REGION_NAMES = new Map<string, Intl.DisplayNames | null>();

function regionNames(tag: string): Intl.DisplayNames | null {
  const cached = REGION_NAMES.get(tag);
  if (cached !== undefined) return cached;
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([tag], { type: "region" });
  } catch {
    names = null;
  }
  REGION_NAMES.set(tag, names);
  return names;
}

/**
 * A country's name in the agent's UI language. English keeps the curated names
 * above (the copy the UI shipped with, e.g. "Turkey" rather than CLDR's
 * "Türkiye"); other languages come from `Intl.DisplayNames`, falling back to
 * the English name where the runtime has no translation.
 */
export function countryName(iso: string, locale?: string | null): string {
  const code = iso.toUpperCase();
  const english = ENGLISH_NAMES.get(code) ?? code;
  const tag = intlTag(locale);
  if (tag.startsWith("en")) return english;
  return regionNames(tag)?.of(code) ?? english;
}

const DIAL_CODES = [...new Set(COUNTRIES.map((c) => c.dial))];

/** Split a stored phone string into a dial code + local number. */
export function parsePhone(value: string): { dial: string; number: string } {
  const v = (value || "").trim();
  if (!v) return { dial: DEFAULT_DIAL, number: "" };

  const s = v.startsWith("00") ? "+" + v.slice(2) : v;
  if (s.startsWith("+")) {
    const match = DIAL_CODES.filter((d) => s.startsWith(d)).sort(
      (a, b) => b.length - a.length
    )[0];
    if (match) return { dial: match, number: s.slice(match.length).trim() };
    return { dial: DEFAULT_DIAL, number: s };
  }
  return { dial: DEFAULT_DIAL, number: s };
}
