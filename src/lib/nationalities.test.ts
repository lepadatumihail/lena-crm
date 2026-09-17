import { describe, it, expect } from "vitest";
import enCrm from "../../messages/en/crm.json";
import esCrm from "../../messages/es/crm.json";
import { COUNTRIES } from "./countries";
import { LANGUAGES } from "./crm";
import { NATIONALITIES, findNationality } from "./nationalities";

describe("NATIONALITIES", () => {
  it("has one entry per country, with no repeated name", () => {
    expect(NATIONALITIES.map((n) => n.iso).sort()).toEqual(
      COUNTRIES.map((c) => c.iso).sort()
    );
    expect(new Set(NATIONALITIES.map((n) => n.name)).size).toBe(
      NATIONALITIES.length
    );
  });

  it("is labelled in English and Spanish", () => {
    const en: Record<string, string> = enCrm.nationalities;
    const es: Record<string, string> = esCrm.nationalities;
    for (const n of NATIONALITIES) {
      // English is the stored value, so its label must be the same word.
      expect(en[n.iso]).toBe(n.name);
      expect(es[n.iso]).toBeTruthy();
    }
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });
});

describe("findNationality", () => {
  it("matches a stored value whatever its casing or spacing", () => {
    expect(findNationality("British")?.iso).toBe("GB");
    expect(findNationality(" british ")?.iso).toBe("GB");
    expect(findNationality("SWEDISH")?.iso).toBe("SE");
  });

  it("leaves unknown and empty values alone", () => {
    expect(findNationality("Martian")).toBeNull();
    expect(findNationality("")).toBeNull();
    expect(findNationality(null)).toBeNull();
  });
});

describe("LANGUAGES", () => {
  it("lists 20 languages, each labelled in English and Spanish", () => {
    expect(LANGUAGES).toHaveLength(20);
    const en: Record<string, string> = enCrm.languages;
    const es: Record<string, string> = esCrm.languages;
    for (const l of LANGUAGES) {
      expect(en[l]).toBe(l);
      expect(es[l]).toBeTruthy();
    }
  });
});
