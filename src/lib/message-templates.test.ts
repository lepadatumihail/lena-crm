import { describe, it, expect } from "vitest";
import {
  fillTemplate,
  buildVars,
  getTemplate,
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

describe("getTemplate", () => {
  it("returns a template by id", () => {
    const t = getTemplate("intro");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("intro");
  });

  it("returns null for a missing id or nullish input", () => {
    expect(getTemplate("missing")).toBeNull();
    expect(getTemplate(null)).toBeNull();
    expect(getTemplate(undefined)).toBeNull();
  });
});
