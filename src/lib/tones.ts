/**
 * The colour tones shared by tags, dots, bars and avatars. A tone names a hue
 * family; each component decides how to tint it (a pale pill, a solid dot).
 * Stage colours in lib/crm.ts pick from this list, so a stage looks the same
 * in the sidebar, in a table pill and in a stacked bar.
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

/** Solid fills, for dots and bar segments. */
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
