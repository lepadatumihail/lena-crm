/**
 * The colour tones behind every status surface: tags, dots, bars, meters,
 * notices, calendar events and avatars. A tone names a hue family; each
 * surface takes the shades it needs from the maps below, so a stage, an
 * event kind, a plan or an invoice status looks the same wherever it shows.
 *
 * Feedback colours that are not a status (a delete button's red hover, a
 * success check, the priority star) keep the semantic tokens in globals.css.
 */
export const TONES = [
  "neutral",
  "blue",
  "purple",
  "teal",
  "green",
  "amber",
  "orange",
  "red",
  "brand",
] as const;

export type Tone = (typeof TONES)[number];

/** Solid fills: dots, bar segments, meters. */
export const TONE_SOLID: Record<Tone, string> = {
  neutral: "bg-muted-foreground/50",
  blue: "bg-blue-500",
  purple: "bg-violet-500",
  teal: "bg-teal-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  brand: "bg-primary",
};

/** Pale fills: tags, notices, avatars, calendar events. */
export const TONE_BG: Record<Tone, string> = {
  neutral: "bg-muted",
  blue: "bg-blue-500/10 dark:bg-blue-400/15",
  purple: "bg-violet-500/10 dark:bg-violet-400/15",
  teal: "bg-teal-500/10 dark:bg-teal-400/15",
  green: "bg-emerald-500/10 dark:bg-emerald-400/15",
  amber: "bg-amber-500/12 dark:bg-amber-400/15",
  orange: "bg-orange-500/12 dark:bg-orange-400/15",
  red: "bg-red-500/10 dark:bg-red-400/15",
  brand: "bg-primary/10",
};

/** The pale fill one step darker, for pressable surfaces on hover. */
export const TONE_BG_HOVER: Record<Tone, string> = {
  neutral: "hover:bg-accent",
  blue: "hover:bg-blue-500/20 dark:hover:bg-blue-400/25",
  purple: "hover:bg-violet-500/20 dark:hover:bg-violet-400/25",
  teal: "hover:bg-teal-500/20 dark:hover:bg-teal-400/25",
  green: "hover:bg-emerald-500/20 dark:hover:bg-emerald-400/25",
  amber: "hover:bg-amber-500/22 dark:hover:bg-amber-400/25",
  orange: "hover:bg-orange-500/22 dark:hover:bg-orange-400/25",
  red: "hover:bg-red-500/20 dark:hover:bg-red-400/25",
  brand: "hover:bg-primary/20",
};

/** Hairline borders that sit on a pale fill. */
export const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-border",
  blue: "border-blue-500/25 dark:border-blue-300/20",
  purple: "border-violet-500/25 dark:border-violet-300/20",
  teal: "border-teal-500/25 dark:border-teal-300/20",
  green: "border-emerald-500/25 dark:border-emerald-300/20",
  amber: "border-amber-500/30 dark:border-amber-300/20",
  orange: "border-orange-500/30 dark:border-orange-300/20",
  red: "border-red-500/25 dark:border-red-300/20",
  brand: "border-primary/25",
};

/** Full-strength borders, for an accent edge such as a calendar event's. */
export const TONE_EDGE: Record<Tone, string> = {
  neutral: "border-muted-foreground/50",
  blue: "border-blue-500",
  purple: "border-violet-500",
  teal: "border-teal-500",
  green: "border-emerald-500",
  amber: "border-amber-500",
  orange: "border-orange-500",
  red: "border-red-500",
  brand: "border-primary",
};

/** Text and icons in the tone, readable on its pale fill and on the page. */
export const TONE_INK: Record<Tone, string> = {
  neutral: "text-foreground/75",
  blue: "text-blue-800 dark:text-blue-200",
  purple: "text-violet-800 dark:text-violet-200",
  teal: "text-teal-800 dark:text-teal-200",
  green: "text-emerald-800 dark:text-emerald-200",
  amber: "text-amber-900 dark:text-amber-200",
  orange: "text-orange-900 dark:text-orange-200",
  red: "text-red-800 dark:text-red-200",
  brand: "text-primary",
};

/** Glyphs drawn in the tone at full strength on the page: status icons, priority bars. */
export const TONE_ICON: Record<Tone, string> = {
  neutral: "text-muted-foreground/70",
  blue: "text-blue-500 dark:text-blue-400",
  purple: "text-violet-500 dark:text-violet-400",
  teal: "text-teal-500 dark:text-teal-400",
  green: "text-emerald-500 dark:text-emerald-400",
  amber: "text-amber-500 dark:text-amber-400",
  orange: "text-orange-500 dark:text-orange-400",
  red: "text-red-500 dark:text-red-400",
  brand: "text-primary",
};
