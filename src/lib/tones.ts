/**
 * The colour tones behind every status surface: tags, dots, bars, meters,
 * notices, calendar events and avatars. The app is mono, so a tone is either
 * a shade of grey or a colour that means something: blue for new or in
 * motion, violet for viewing, green for won or done, amber (a yellow) for
 * waiting or due today, red for overdue or failed. Ink is a solid dark pill,
 * kept for the plan badge. Each surface takes the shades it needs from the
 * maps below, so a stage, an event kind, a plan or an invoice status looks
 * the same wherever it shows.
 *
 * The colours themselves are tokens in globals.css (--tone-*), with dark
 * variants there. Feedback colours that are not a status (a delete button's
 * red hover, a success check) keep the semantic tokens.
 */
export const TONES = [
  "neutral",
  "grey",
  "blue",
  "green",
  "amber",
  "red",
  "violet",
  "ink",
] as const;

export type Tone = (typeof TONES)[number];

/**
 * Pills, Structurely-style: a coloured tone is a pale fill with dark text
 * and no visible edge; neutral is an outline on the page; grey a quiet fill;
 * ink a solid dark pill. The border stays on every tone (transparent where
 * it isn't drawn) so all pills are the same size.
 */
export const TONE_TAG: Record<Tone, string> = {
  neutral: "border-border bg-background text-foreground/80",
  grey: "border-transparent bg-muted text-foreground/80",
  blue: "border-transparent bg-tone-blue-soft text-tone-blue-ink",
  green: "border-transparent bg-tone-green-soft text-tone-green-ink",
  amber: "border-transparent bg-tone-amber-soft text-tone-amber-ink",
  red: "border-transparent bg-tone-red-soft text-tone-red-ink",
  violet: "border-transparent bg-tone-violet-soft text-tone-violet-ink",
  ink: "border-transparent bg-foreground text-background",
};

/** Solid fills: dots, bar segments, meters. Neutral and grey are light and dark grey. */
export const TONE_SOLID: Record<Tone, string> = {
  neutral: "bg-foreground/20",
  grey: "bg-foreground/45",
  blue: "bg-tone-blue",
  green: "bg-tone-green",
  amber: "bg-tone-amber",
  red: "bg-tone-red",
  violet: "bg-tone-violet",
  ink: "bg-foreground",
};

/** Pale fills behind content: notices, avatars, calendar events, icon discs. */
export const TONE_BG: Record<Tone, string> = {
  neutral: "bg-muted",
  grey: "bg-muted",
  blue: "bg-tone-blue-soft",
  green: "bg-tone-green-soft",
  amber: "bg-tone-amber-soft",
  red: "bg-tone-red-soft",
  violet: "bg-tone-violet-soft",
  ink: "bg-foreground/10",
};

/** The pale fill one step darker, for pressable surfaces on hover. */
export const TONE_BG_HOVER: Record<Tone, string> = {
  neutral: "hover:bg-accent",
  grey: "hover:bg-accent",
  blue: "hover:bg-tone-blue/20",
  green: "hover:bg-tone-green/20",
  amber: "hover:bg-tone-amber/25",
  red: "hover:bg-tone-red/20",
  violet: "hover:bg-tone-violet/20",
  ink: "hover:bg-foreground/15",
};

/** Hairline borders that sit on a pale fill (notices, calendar blocks). */
export const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-border",
  grey: "border-border",
  blue: "border-tone-blue/25",
  green: "border-tone-green/25",
  amber: "border-tone-amber/35",
  red: "border-tone-red/25",
  violet: "border-tone-violet/25",
  ink: "border-foreground/20",
};

/** Full-strength borders, for an accent edge such as a calendar event's. */
export const TONE_EDGE: Record<Tone, string> = {
  neutral: "border-foreground/25",
  grey: "border-foreground/45",
  blue: "border-tone-blue",
  green: "border-tone-green",
  amber: "border-tone-amber",
  red: "border-tone-red",
  violet: "border-tone-violet",
  ink: "border-foreground",
};

/** Text and icons in the tone, readable on its pale fill and on the page. */
export const TONE_INK: Record<Tone, string> = {
  neutral: "text-foreground/75",
  grey: "text-foreground/80",
  blue: "text-tone-blue-ink",
  green: "text-tone-green-ink",
  amber: "text-tone-amber-ink",
  red: "text-tone-red-ink",
  violet: "text-tone-violet-ink",
  ink: "text-foreground",
};

/** Glyphs drawn in the tone at full strength on the page: status icons, priority bars. */
export const TONE_ICON: Record<Tone, string> = {
  neutral: "text-muted-foreground/70",
  grey: "text-foreground/55",
  blue: "text-tone-blue",
  green: "text-tone-green",
  amber: "text-tone-amber",
  red: "text-tone-red",
  violet: "text-tone-violet",
  ink: "text-foreground",
};

/** The dot a tag draws before its label: on the solid ink pill it has to be light. */
export function tagDotClass(tone: Tone): string {
  return tone === "ink" ? "bg-background/80" : TONE_SOLID[tone];
}
