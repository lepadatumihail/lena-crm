import { describe, expect, it } from "vitest";

import {
  agentPageInputSchema,
  agentPath,
  isIndexable,
  isSlug,
  pageFromRow,
  slugify,
  type AgentPageRecord,
} from "./content";

const row = (over: Partial<AgentPageRecord> = {}): AgentPageRecord => ({
  id: "p1",
  agent_id: "a1",
  slug: "elin-sandberg",
  published: true,
  is_example: false,
  display_name: "Elin Sandberg",
  photo_path: "a1/photo.jpg",
  default_lang: "sv",
  spoken_languages: ["sv", "en", "es"],
  native_language: "sv",
  areas: ["Estepona", "Casares"],
  helps: ["buying", "selling", "sailing"],
  since_year: 2016,
  works: "independent",
  agency_name: null,
  whatsapp: "+46701740605",
  content: {
    sv: { headline: "Svensk mäklare i Estepona.", bio: "x".repeat(120) },
    en: { headline: "Estate agent in Estepona.", bio: "short" },
    de: { headline: "Not a page language" },
    es: { headline: "" },
  },
  updated_at: "2026-11-08T12:00:00Z",
  ...over,
});

describe("slugs", () => {
  it("makes an address from a name", () => {
    expect(slugify("Elena Pantazi")).toBe("elena-pantazi");
    expect(slugify("  Åsa Öberg-Núñez ")).toBe("asa-oberg-nunez");
    expect(slugify("José María (Marbella)")).toBe("jose-maria-marbella");
  });

  it("accepts only lower-case words joined by single dashes", () => {
    expect(isSlug("elin-sandberg")).toBe(true);
    expect(isSlug("Elin")).toBe(false);
    expect(isSlug("elin--sandberg")).toBe(false);
    expect(isSlug("ab")).toBe(false);
    expect(isSlug("elin_sandberg")).toBe(false);
    // Only [a-z0-9-] survives, so a slug is safe inside a PostgREST filter.
    expect(isSlug("a,slug.eq.x")).toBe(false);
  });
});

describe("pageFromRow", () => {
  it("keeps only page languages with valid text, the default first", () => {
    const page = pageFromRow(row(), "https://x.supabase.co/storage/v1/object/public/agent-photos/");
    expect(page?.langs).toEqual(["sv", "en"]);
    expect(page?.photoUrl).toBe("https://x.supabase.co/storage/v1/object/public/agent-photos/a1/photo.jpg");
    expect(page?.helps).toEqual(["buying", "selling"]);
  });

  it("can't show a page whose default language has no text", () => {
    expect(pageFromRow(row({ default_lang: "es" }), "")).toBeNull();
    expect(pageFromRow(row({ default_lang: "de" }), "")).toBeNull();
  });
});

describe("isIndexable", () => {
  const page = pageFromRow(row(), "")!;

  it("indexes a live, real page with a photo, areas and a real bio", () => {
    expect(isIndexable(page, "sv")).toBe(true);
  });

  it("keeps thin, example and unpublished pages out of search", () => {
    expect(isIndexable(page, "en")).toBe(false); // bio too short
    expect(isIndexable({ ...page, photoUrl: null }, "sv")).toBe(false);
    expect(isIndexable({ ...page, isExample: true }, "sv")).toBe(false);
    expect(isIndexable({ ...page, published: false }, "sv")).toBe(false);
    expect(isIndexable({ ...page, areas: [] }, "sv")).toBe(false);
  });
});

describe("agentPath", () => {
  it("puts the default language at the bare address", () => {
    expect(agentPath("elin-sandberg")).toBe("/agent/elin-sandberg");
    expect(agentPath("elin-sandberg", "sv", "sv")).toBe("/agent/elin-sandberg");
    expect(agentPath("elin-sandberg", "en", "sv")).toBe("/agent/elin-sandberg/en");
  });
});

describe("agentPageInputSchema", () => {
  const input = {
    agentEmail: "elin@example.com",
    slug: "elin-sandberg",
    published: true,
    displayName: "Elin Sandberg",
    defaultLang: "sv",
    spokenLanguages: ["sv", "en"],
    areas: ["Estepona"],
    helps: ["buying"],
    works: "independent",
    content: { sv: { headline: "Svensk mäklare i Estepona." } },
  };

  it("accepts a minimal page", () => {
    expect(agentPageInputSchema.safeParse(input).success).toBe(true);
  });

  it("needs text in the default language and an agency name for agency pages", () => {
    expect(agentPageInputSchema.safeParse({ ...input, defaultLang: "en" }).success).toBe(false);
    expect(agentPageInputSchema.safeParse({ ...input, works: "agency" }).success).toBe(false);
    expect(
      agentPageInputSchema.safeParse({ ...input, works: "agency", agencyName: "Sol Homes" }).success
    ).toBe(true);
  });

  it("wants WhatsApp numbers with their country code", () => {
    expect(agentPageInputSchema.safeParse({ ...input, whatsapp: "0701740605" }).success).toBe(false);
    expect(agentPageInputSchema.safeParse({ ...input, whatsapp: "+46701740605" }).success).toBe(true);
  });
});
