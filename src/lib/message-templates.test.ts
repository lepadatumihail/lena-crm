import { describe, it, expect } from "vitest";
import {
  fillTemplate,
  buildVars,
  getTemplate,
  templateCopy,
  type MessageVars,
} from "./message-templates";

const baseVars: MessageVars = {
  first_name: "Anna",
  full_name: "Anna Schmidt",
  budget: "",
  property: "",
  agency: "",
};

describe("fillTemplate", () => {
  it("replaces known vars and collapses an empty () + double spaces", () => {
    const out = fillTemplate("Hi {{first_name}}, ({{budget}})", {
      ...baseVars,
      budget: "",
    });
    expect(out).toBe("Hi Anna,");
    expect(out).not.toContain("()");
    expect(out).not.toContain("  ");
  });

  it("keeps the parenthesized value when the var is set", () => {
    const out = fillTemplate("Hi {{first_name}}, ({{budget}})", {
      ...baseVars,
      budget: "from €250,000",
    });
    expect(out).toBe("Hi Anna, (from €250,000)");
  });

  it("removes unknown placeholders", () => {
    const out = fillTemplate("Hello {{nope}} world", baseVars);
    expect(out).toBe("Hello world");
    expect(out).not.toContain("{{");
  });

  it("treats a whitespace-only var as empty", () => {
    const out = fillTemplate("Hi {{first_name}}", {
      ...baseVars,
      first_name: "   ",
    });
    expect(out).toBe("Hi");
  });
});

describe("buildVars", () => {
  it("formats both min and max as a range", () => {
    const v = buildVars({
      first_name: "Anna",
      last_name: "Schmidt",
      budgetMin: 250_000,
      budgetMax: 400_000,
    });
    expect(v.budget).toContain("–"); // en dash between the two amounts
    expect(v.budget).toContain("€");
    expect(v.budget).toMatch(/250/);
    expect(v.budget).toMatch(/400/);
  });

  it("formats a min-only budget as 'from …'", () => {
    const v = buildVars({
      first_name: "Anna",
      last_name: "Schmidt",
      budgetMin: 250_000,
    });
    expect(v.budget.startsWith("from ")).toBe(true);
    expect(v.budget).toContain("€");
  });

  it("formats a max-only budget as 'up to …'", () => {
    const v = buildVars({
      first_name: "Anna",
      last_name: "Schmidt",
      budgetMax: 400_000,
    });
    expect(v.budget.startsWith("up to ")).toBe(true);
    expect(v.budget).toContain("€");
  });

  it("leaves the budget empty when neither bound is set", () => {
    const v = buildVars({ first_name: "Anna", last_name: "Schmidt" });
    expect(v.budget).toBe("");
  });

  it("builds full_name and passes through property/agency defaults", () => {
    const v = buildVars({ first_name: "Anna", last_name: "Schmidt" });
    expect(v.full_name).toBe("Anna Schmidt");
    expect(v.property).toBe("");
    expect(v.agency).toBe("");
  });
});

describe("buildVars in the client's language", () => {
  it("phrases and formats a Spanish budget in Spanish", () => {
    const min = buildVars({ first_name: "Ana", last_name: "Ruiz", budgetMin: 250_000 }, "Spanish");
    const max = buildVars({ first_name: "Ana", last_name: "Ruiz", budgetMax: 400_000 }, "Spanish");
    expect(min.budget.startsWith("desde ")).toBe(true);
    expect(max.budget.startsWith("hasta ")).toBe(true);
    expect(min.budget).toContain("€");
    expect(min.budget).toMatch(/250\.000/); // es-ES grouping
  });

  it("keeps English phrasing for languages without native copy", () => {
    const v = buildVars({ first_name: "Anna", last_name: "Schmidt", budgetMin: 250_000 }, "German");
    expect(v.budget.startsWith("from ")).toBe(true);
  });
});

describe("templateCopy", () => {
  it("returns the Spanish copy for Spanish clients", () => {
    const es = templateCopy("intro", "Spanish");
    expect(es?.body.startsWith("Hola {{first_name}}")).toBe(true);
    expect(es?.subject).toContain("{{first_name}}");
  });

  it("falls back to English for other languages and when none is given", () => {
    expect(templateCopy("intro", "German")).toEqual(templateCopy("intro", "English"));
    expect(templateCopy("intro")).toEqual(templateCopy("intro", "English"));
  });

  it("returns null for unknown ids", () => {
    expect(templateCopy("missing", "Spanish")).toBeNull();
    expect(templateCopy(null)).toBeNull();
  });

  it("keeps every placeholder identical between languages", () => {
    for (const id of ["intro", "new_matches", "viewing_confirm", "offer_followup", "reservation_next", "check_in"]) {
      const vars = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort();
      const en = templateCopy(id, "English")!;
      const es = templateCopy(id, "Spanish")!;
      expect(vars(es.body)).toEqual(vars(en.body));
      expect(vars(es.subject)).toEqual(vars(en.subject));
    }
  });
});

describe("getTemplate", () => {
  it("returns a template by id", () => {
    const t = getTemplate("intro");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("intro");
  });

  it("swaps subject and body for the client's language, keeping the agent-facing copy", () => {
    const en = getTemplate("intro")!;
    const es = getTemplate("intro", "Spanish")!;
    expect(es.label).toBe(en.label);
    expect(es.body).not.toBe(en.body);
    expect(es.body.startsWith("Hola ")).toBe(true);
  });

  it("returns null for a missing id or nullish input", () => {
    expect(getTemplate("missing")).toBeNull();
    expect(getTemplate(null)).toBeNull();
    expect(getTemplate(undefined)).toBeNull();
  });
});
