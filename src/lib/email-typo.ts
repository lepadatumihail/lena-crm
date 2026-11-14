/**
 * Catches a mistyped email provider before a sign-in code goes to an address
 * that can never receive it ("nico@gmal.com" → "nico@gmail.com"). On 14 Nov
 * 2026 a visitor lost a sign-up attempt to exactly that, so the form now asks
 * "Did you mean …?" first.
 *
 * Deliberately conservative: it only ever suggests one of the provider
 * domains below, or swaps a ".con"-style ending for ".com". An agency's own
 * domain, or a real provider that isn't listed, is left alone.
 */

/** The domains each provider really uses, the usual one first. */
const PROVIDERS: Record<string, readonly string[]> = {
  gmail: ["gmail.com"],
  googlemail: ["googlemail.com"],
  hotmail: ["hotmail.com", "hotmail.es", "hotmail.co.uk", "hotmail.fr", "hotmail.it", "hotmail.de"],
  outlook: ["outlook.com", "outlook.es", "outlook.fr", "outlook.it", "outlook.de"],
  yahoo: ["yahoo.com", "yahoo.es", "yahoo.co.uk", "yahoo.fr", "yahoo.it", "yahoo.de"],
  icloud: ["icloud.com"],
  protonmail: ["protonmail.com"],
  yandex: ["yandex.ru", "yandex.com"],
  rambler: ["rambler.ru"],
  telefonica: ["telefonica.net"],
  movistar: ["movistar.es"],
};

/**
 * Real names a single slip away from a provider above ("mail.com" is one
 * letter from "gmail.com"), so they are never "corrected".
 */
const LEAVE_ALONE = new Set(["mail", "email", "ymail", "jmail", "cloud", "gmx", "live", "me", "mac", "aol", "msn"]);

/** Endings that are no real top-level domain, only a slip on ".com" or ".net". */
const ENDING_SLIPS: Record<string, string> = {
  con: "com",
  cmo: "com",
  ocm: "com",
  comm: "com",
  coom: "com",
  ccom: "com",
  vom: "com",
  xom: "com",
  cpm: "com",
  nte: "net",
  nett: "net",
};

/** Edits (insert, delete, swap a letter, swap two neighbours) to turn `a` into `b`. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** The provider a name was meant to be, allowing one slip (two on longer names). */
function providerFor(name: string): string | null {
  if (PROVIDERS[name]) return name;
  if (LEAVE_ALONE.has(name)) return null;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const provider of Object.keys(PROVIDERS)) {
    const allowed = provider.length <= 5 ? 1 : 2;
    const d = distance(name, provider);
    if (d <= allowed && d < bestDistance) {
      best = provider;
      bestDistance = d;
    }
  }
  return best;
}

/** The provider domain meant by `ending` (".con" for ".com", ".es" kept), or null when unsure. */
function providerDomain(provider: string, ending: string): string | null {
  const domains = PROVIDERS[provider];
  if (!ending) return domains[0];
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const domain of domains) {
    const d = distance(ending, domain.slice(provider.length + 1));
    if (d < bestDistance) {
      best = domain;
      bestDistance = d;
    }
  }
  if (bestDistance <= 1) return best;
  // Gmail and the like live on one domain only, so "gmail.es" can only mean gmail.com.
  if (domains.length === 1 && !ending.includes(".") && ending.length <= 4) return domains[0];
  return null;
}

/**
 * The address the visitor most likely meant, or null when `email` looks right
 * (or isn't an address at all). The part before the @ is kept as typed.
 */
export function suggestEmail(email: string): string | null {
  const value = email.trim();
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) return null;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();

  const dot = domain.indexOf(".");
  const name = dot === -1 ? domain : domain.slice(0, dot);
  const ending = dot === -1 ? "" : domain.slice(dot + 1);

  let suggestion: string | null = null;
  const provider = providerFor(name);
  if (provider) {
    suggestion = providerDomain(provider, ending);
  } else if (dot !== -1) {
    const lastDot = domain.lastIndexOf(".");
    const fixed = ENDING_SLIPS[domain.slice(lastDot + 1)];
    if (fixed) suggestion = `${domain.slice(0, lastDot)}.${fixed}`;
  }

  return suggestion && suggestion !== domain ? `${local}@${suggestion}` : null;
}
