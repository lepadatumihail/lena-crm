/**
 * Money amounts as people type them into spreadsheets and forms. A leaf
 * module with no imports, so a public page (the commission calculator) can
 * parse a price without pulling the whole import normalizer into its bundle;
 * normalize.ts re-exports both functions for the importer.
 */

const MONEY_TOKEN = /(\d[\d.,]*)\s*([km])?(?![\p{L}])/giu;

function moneyValue(run: string, suffix: string | undefined): number | null {
  let digits = run.replace(/[.,]+$/, "");
  const dots = (digits.match(/\./g) ?? []).length;
  const commas = (digits.match(/,/g) ?? []).length;

  if (dots && commas) {
    // The last mark is the decimal one: "250.000,50", "250,000.50".
    const decimal = digits.lastIndexOf(".") > digits.lastIndexOf(",") ? "." : ",";
    digits = digits.split(decimal === "." ? "," : ".").join("").replace(decimal, ".");
  } else if (dots + commas > 1) {
    digits = digits.replace(/[.,]/g, "");
  } else if (dots + commas === 1) {
    const thousands = !suffix && /[.,]\d{3}$/.test(digits);
    digits = thousands ? digits.replace(/[.,]/, "") : digits.replace(",", ".");
  }

  const value = Number(digits) * (suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

/**
 * Russian and French write thousands with a space: "5 000", "1 250 000", and
 * Intl's ru-RU formatting uses a no-break space (U+00A0, or U+202F). A space
 * between a digit and exactly three more is a thousands mark; joining them
 * first keeps "5 000" one number instead of a 5 and a 0.
 */
const SPACED_THOUSANDS = /(\d)[ \u00a0\u202f\u2009](?=\d{3}(?!\d))/g;

function moneyTokens(raw: string): number[] {
  const values: number[] = [];
  const text = raw.toLowerCase().replace(SPACED_THOUSANDS, "$1");
  for (const match of text.matchAll(MONEY_TOKEN)) {
    const value = moneyValue(match[1], match[2]);
    if (value != null) values.push(value);
  }
  return values;
}

/** "€ 250.000", "250,000.50", "1,5M", "450k". `null` for "", "-", "n/a", "consultar". */
export function parseMoney(raw: string): number | null {
  if (/^[^\d]*-\s*\d/.test(raw)) return null;
  return moneyTokens(raw)[0] ?? null;
}

const UPPER_BOUND = /\b(hasta|up to|max|maximo|menos de|under|below)\b|[<≤]/;
const LOWER_BOUND = /\b(desde|from|min|minimo|a partir de|mas de|over|above)\b|[>≥]|\+\s*$/;

/** A budget cell: a range, one bound, or a single value, which is the most they'll pay. */
export function parseBudget(raw: string): { min: number | null; max: number | null } {
  const [a, b] = moneyTokens(raw);
  if (a == null) return { min: null, max: null };
  if (b != null) return { min: Math.min(a, b), max: Math.max(a, b) };
  const text = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (LOWER_BOUND.test(text) && !UPPER_BOUND.test(text)) return { min: a, max: null };
  return { min: null, max: a };
}
