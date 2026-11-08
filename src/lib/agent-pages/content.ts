import { z } from "zod";

/*
 * Public agent pages (/agent/<slug>): what a page holds and the rules both
 * the site and scripts/agent-page.ts check it against. No path aliases here,
 * because the script imports this file straight from Node.
 */

/** The languages a page's own words (labels, form, footer) exist in. */
export const PAGE_LANGS = ["en", "es", "sv"] as const;
export type PageLang = (typeof PAGE_LANGS)[number];

export function isPageLang(value: unknown): value is PageLang {
  return (PAGE_LANGS as readonly unknown[]).includes(value);
}

/** What an agent can say they help with; mirrors agent_pages_helps. */
export const HELPS = ["buying", "selling", "new_builds", "rentals"] as const;
export type Help = (typeof HELPS)[number];

export const WORKS = ["independent", "agency"] as const;
export type Works = (typeof WORKS)[number];

/** Mirrors agent_pages_slug_shape: lower-case words joined by single dashes. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 60 && SLUG_PATTERN.test(value);
}

/** "Elena Pantazi" → "elena-pantazi"; accents dropped, anything else a dash. */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

const languageCode = z.string().regex(/^[a-z]{2}$/);

/** The agent's own words in one page language. */
export const pageTextSchema = z.object({
  /** The short search title after the name ("svensk mäklare i Estepona"). */
  title: z.string().trim().min(1).max(70).optional(),
  /** One or two sentences under the name. */
  headline: z.string().trim().min(1).max(220),
  bio: z.string().trim().min(1).max(1500).optional(),
});
export type PageText = z.infer<typeof pageTextSchema>;

export const pageContentSchema = z.partialRecord(z.enum(PAGE_LANGS), pageTextSchema);
export type PageContent = z.infer<typeof pageContentSchema>;

/** What scripts/agent-page.ts accepts to create or update a page. */
export const agentPageInputSchema = z
  .object({
    agentEmail: z.email(),
    slug: z.string().refine(isSlug, "lower-case words joined by dashes, 3–60 characters"),
    published: z.boolean(),
    isExample: z.boolean().default(false),
    displayName: z.string().trim().min(1).max(80),
    /** A local image file the script uploads (jpg, png or webp, up to 5 MB). */
    photo: z.string().min(1).optional(),
    defaultLang: z.enum(PAGE_LANGS),
    spokenLanguages: z.array(languageCode).min(1).max(8),
    nativeLanguage: languageCode.optional(),
    areas: z.array(z.string().trim().min(1).max(60)).min(1).max(12),
    helps: z.array(z.enum(HELPS)).min(1),
    sinceYear: z.number().int().min(1950).max(2100).optional(),
    works: z.enum(WORKS),
    agencyName: z.string().trim().min(1).max(80).optional(),
    whatsapp: z
      .string()
      .regex(/^\+[0-9]{7,15}$/, "E.164, e.g. +34600111222")
      .optional(),
    content: pageContentSchema,
  })
  .refine((v) => v.content[v.defaultLang], {
    message: "content needs the default language",
    path: ["content"],
  })
  .refine((v) => v.works === "independent" || v.agencyName, {
    message: "an agency page needs agencyName",
    path: ["agencyName"],
  });
export type AgentPageInput = z.infer<typeof agentPageInputSchema>;

/** The page as the site renders it. */
export type AgentPage = {
  id: string;
  agentId: string;
  slug: string;
  published: boolean;
  isExample: boolean;
  displayName: string;
  photoUrl: string | null;
  defaultLang: PageLang;
  /** Languages the page exists in, the default first. */
  langs: PageLang[];
  spokenLanguages: string[];
  nativeLanguage: string | null;
  areas: string[];
  helps: Help[];
  sinceYear: number | null;
  works: Works;
  agencyName: string | null;
  whatsapp: string | null;
  content: PageContent;
  updatedAt: string;
};

/** The columns pageFromRow reads, as the database returns them. */
export type AgentPageRecord = {
  id: string;
  agent_id: string;
  slug: string;
  published: boolean;
  is_example: boolean;
  display_name: string;
  photo_path: string | null;
  default_lang: string;
  spoken_languages: string[];
  native_language: string | null;
  areas: string[];
  helps: string[];
  since_year: number | null;
  works: string;
  agency_name: string | null;
  whatsapp: string | null;
  content: unknown;
  updated_at: string;
};

/**
 * A database row as a renderable page, or null when the row can't be shown
 * (its default language has no text). Languages without valid text are left
 * out instead of breaking the whole page.
 */
export function pageFromRow(row: AgentPageRecord, photoBase: string): AgentPage | null {
  if (!isPageLang(row.default_lang)) return null;
  const content: PageContent = {};
  const raw =
    row.content && typeof row.content === "object"
      ? (row.content as Record<string, unknown>)
      : {};
  for (const lang of PAGE_LANGS) {
    const parsed = pageTextSchema.safeParse(raw[lang]);
    if (parsed.success) content[lang] = parsed.data;
  }
  if (!content[row.default_lang]) return null;

  const langs = [
    row.default_lang,
    ...PAGE_LANGS.filter((l) => l !== row.default_lang && content[l]),
  ];
  return {
    id: row.id,
    agentId: row.agent_id,
    slug: row.slug,
    published: row.published,
    isExample: row.is_example,
    displayName: row.display_name.trim(),
    photoUrl: row.photo_path ? `${photoBase.replace(/\/+$/, "")}/${row.photo_path}` : null,
    defaultLang: row.default_lang,
    langs,
    spokenLanguages: row.spoken_languages,
    nativeLanguage: row.native_language,
    areas: row.areas,
    helps: row.helps.filter((h): h is Help => (HELPS as readonly string[]).includes(h)),
    sinceYear: row.since_year,
    works: row.works === "agency" ? "agency" : "independent",
    agencyName: row.agency_name,
    whatsapp: row.whatsapp,
    content,
    updatedAt: row.updated_at,
  };
}

/** "Elin Sandberg" → "Elin": how the page speaks of the agent. */
export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

/**
 * Worth showing to search engines: live, real, and with enough on it to
 * answer "who is this agent" (a photo, words about them, where they work).
 * A thin page would only teach Google that these pages are empty.
 */
export function isIndexable(page: AgentPage, lang: PageLang): boolean {
  const text = page.content[lang];
  return (
    page.published &&
    !page.isExample &&
    page.photoUrl !== null &&
    page.areas.length > 0 &&
    Boolean(text?.bio && text.bio.length >= 80)
  );
}

/** /agent/<slug> in the default language, /agent/<slug>/<lang> otherwise. */
export function agentPath(slug: string, lang?: PageLang, defaultLang?: PageLang): string {
  return !lang || lang === defaultLang ? `/agent/${slug}` : `/agent/${slug}/${lang}`;
}
