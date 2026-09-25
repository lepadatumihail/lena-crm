/**
 * The colour tones behind every status surface: tags, dots, bars, meters,
 * notices, calendar events and avatars. Terracotta is the app's only hue, so
 * besides neutral a tone is either a step of the brand ramp or one of three
 * signals: green for done or paid, amber for due today, red for overdue or
 * failed. Each surface takes the shades it needs from the maps below, so a
 * stage, an event kind, a plan or an invoice status looks the same wherever
 * it shows.
 *
 * Feedback colours that are not a status (a delete button's red hover, a
 * success check) keep the semantic tokens in globals.css.
 */
export const TONES = [
  "neutral",
  "brand",
  "green",
  "amber",
  "red",
  "sand",
  "apricot",
  "clay",
  "terracotta",
] as const;

export type Tone = (typeof TONES)[number];

/**
 * The brand ramp, coolest first: for ordered things such as pipeline stages.
 * The fill warms as a deal gets closer, so the hot ones stand out without a
 * colour key. The last step is a solid terracotta pill.
 */
export const RAMP = [
  "neutral",
  "sand",
  "apricot",
  "clay",
  "terracotta",
] as const satisfies readonly Tone[];

/** Solid fills: dots, bar segments, meters. */
export const TONE_SOLID: Record<Tone, string> = {
  neutral: "bg-muted-foreground/50",
  brand: "bg-primary",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  sand: "bg-sand-dot",
  apricot: "bg-apricot-dot",
  clay: "bg-clay-dot",
  terracotta: "bg-primary",
};

/** Pale fills: tags, notices, avatars, calendar events. */
export const TONE_BG: Record<Tone, string> = {
  neutral: "bg-muted",
  brand: "bg-primary/10",
  green: "bg-emerald-500/10 dark:bg-emerald-400/15",
  amber: "bg-amber-500/12 dark:bg-amber-400/15",
  red: "bg-red-500/10 dark:bg-red-400/15",
  sand: "bg-sand",
  apricot: "bg-apricot",
  clay: "bg-clay",
  terracotta: "bg-primary",
};

/** The pale fill one step darker, for pressable surfaces on hover. */
export const TONE_BG_HOVER: Record<Tone, string> = {
  neutral: "hover:bg-accent",
  brand: "hover:bg-primary/20",
  green: "hover:bg-emerald-500/20 dark:hover:bg-emerald-400/25",
  amber: "hover:bg-amber-500/22 dark:hover:bg-amber-400/25",
  red: "hover:bg-red-500/20 dark:hover:bg-red-400/25",
  sand: "hover:bg-apricot",
  apricot: "hover:bg-clay",
  clay: "hover:bg-clay-line/60",
  terracotta: "hover:bg-primary/90",
};

/** Hairline borders that sit on a pale fill. */
export const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-border",
  brand: "border-primary/25",
  green: "border-emerald-500/25 dark:border-emerald-300/20",
  amber: "border-amber-500/30 dark:border-amber-300/20",
  red: "border-red-500/25 dark:border-red-300/20",
  sand: "border-sand-line",
  apricot: "border-apricot-line",
  clay: "border-clay-line",
  terracotta: "border-primary",
};

/** Full-strength borders, for an accent edge such as a calendar event's. */
export const TONE_EDGE: Record<Tone, string> = {
  neutral: "border-muted-foreground/50",
  brand: "border-primary",
  green: "border-emerald-500",
  amber: "border-amber-500",
  red: "border-red-500",
  sand: "border-sand-dot",
  apricot: "border-apricot-dot",
  clay: "border-clay-dot",
  terracotta: "border-primary",
};

/** Text and icons in the tone, readable on its pale fill and on the page. */
export const TONE_INK: Record<Tone, string> = {
  neutral: "text-foreground/75",
  brand: "text-brand-ink",
  green: "text-emerald-800 dark:text-emerald-200",
  amber: "text-amber-900 dark:text-amber-200",
  red: "text-red-800 dark:text-red-200",
  sand: "text-sand-ink",
  apricot: "text-apricot-ink",
  clay: "text-clay-ink",
  terracotta: "text-primary-foreground",
};

/** Glyphs drawn in the tone at full strength on the page: status icons, priority bars. */
export const TONE_ICON: Record<Tone, string> = {
  neutral: "text-muted-foreground/70",
  brand: "text-primary",
  green: "text-emerald-500 dark:text-emerald-400",
  amber: "text-amber-500 dark:text-amber-400",
  red: "text-red-500 dark:text-red-400",
  sand: "text-sand-dot",
  apricot: "text-apricot-dot",
  clay: "text-clay-dot",
  terracotta: "text-primary",
};

/** The dot a tag draws before its label: on the solid step it has to be light. */
export function tagDotClass(tone: Tone): string {
  return tone === "terracotta" ? "bg-primary-foreground/80" : TONE_SOLID[tone];
}
