/**
 * Time zones for the agent's settings. Each agent stores an IANA name and the
 * app falls back to Spain, where it started. Pure, so the settings picker,
 * the server action and the shell all share it.
 */

export const DEFAULT_TIME_ZONE = "Europe/Madrid";

/** A short list for runtimes that cannot enumerate their zones. */
const FALLBACK_ZONES = [
  "Africa/Casablanca",
  "America/Argentina/Buenos_Aires",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Atlantic/Canary",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Helsinki",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Zurich",
];

/** True for a zone name this runtime can format dates in. */
export function isValidTimeZone(zone: unknown): zone is string {
  if (typeof zone !== "string" || zone.length === 0 || zone.length > 64) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The agent's zone when it is set and usable, else the default. */
export function resolveTimeZone(zone: string | null | undefined): string {
  return isValidTimeZone(zone) ? zone : DEFAULT_TIME_ZONE;
}

/** Every zone this runtime knows, UTC included, sorted by name. */
export function listTimeZones(): string[] {
  let zones: string[] = [];
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      zones = Intl.supportedValuesOf("timeZone");
    }
  } catch {
    zones = [];
  }
  const all = new Set(zones.length > 0 ? zones : FALLBACK_ZONES);
  all.add("UTC");
  return [...all].sort();
}

/**
 * "GMT+2" for a zone at an instant; plain "GMT" at a zero offset, which ICU 78
 * spells "GMT+0" and older ICU "GMT", so every runtime renders the same label.
 */
export function utcOffsetLabel(zone: string, at: Date = new Date()): string {
  try {
    const name = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")?.value;
    return name && name !== "GMT+0" ? name : "GMT";
  } catch {
    return "GMT";
  }
}

/** Minutes east of UTC at an instant: "GMT+5:30" is 330, "GMT-3" is -180. */
export function utcOffsetMinutes(zone: string, at: Date = new Date()): number {
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(utcOffsetLabel(zone, at));
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

/** The readable place in a zone name: "America/Argentina/Buenos_Aires" is "Buenos Aires". */
export function timeZoneCity(zone: string): string {
  return (zone.split("/").at(-1) ?? zone).replaceAll("_", " ");
}

/** The continent or ocean a zone name starts with ("Europe"); "UTC" for names without one. */
export function timeZoneRegion(zone: string): string {
  const slash = zone.indexOf("/");
  return slash === -1 ? "UTC" : zone.slice(0, slash);
}
