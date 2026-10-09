import { describe, expect, it } from "vitest";

import {
  cleanPhone,
  normalizeDealType,
  normalizeLanguage,
  normalizeNationality,
  normalizeSellerRole,
  normalizeStage,
  parseBudget,
  parseCount,
  parseMoney,
  parsePropertyTypes,
  parseYesNo,
  pickEmail,
  splitFullName,
  tidyName,
} from "./normalize";

describe("names", () => {
  it.each([
    ["María García López", "María", "García López"],
    ["García López, María", "María", "García López"],
    ["Sr. Juan Pérez", "Juan", "Pérez"],
    ["D. Juan Pérez", "Juan", "Pérez"],
    ["Doña Carmen Ruiz", "Carmen", "Ruiz"],
    ["Hans", "Hans", ""],
    ["Dr", "Dr", ""],
    ["MARÍA DE LA CRUZ", "María", "de la Cruz"],
    ["  Anna   Karlsson ", "Anna", "Karlsson"],
  ])("%s", (raw, first, last) => {
    expect(splitFullName(raw)).toEqual({ first, last });
  });

  it("title-cases only what is shouted", () => {
    expect(tidyName("O'BRIEN-SMITH")).toBe("O'Brien-Smith");
    expect(tidyName("VAN DER BERG")).toBe("Van der Berg");
    expect(tidyName("McDonald")).toBe("McDonald");
    expect(tidyName("ANA")).toBe("ANA");
  });
});

describe("pickEmail", () => {
  it("takes the first address and keeps the others", () => {
    expect(pickEmail("Juan <juan@x.es>; otro@y.com")).toEqual({ email: "juan@x.es", extra: ["otro@y.com"] });
    expect(pickEmail("mailto:ana@example.com")).toEqual({ email: "ana@example.com", extra: [] });
    expect(pickEmail("no tiene")).toEqual({ email: null, extra: [] });
  });
});

describe("cleanPhone", () => {
  it.each([
    ["600 123 456", "+34", "+34 600123456", undefined],
    ["34600123456", "+34", "+34 600123456", undefined],
    ["0034 600-123-456", "+34", "+34 600123456", undefined],
    ["(+34) 952 12 34 56", "+34", "+34 952123456", undefined],
    ["'+34 600 123 456", "+34", "+34 600123456", undefined],
    ["tel:+34600123456", "+34", "+34 600123456", undefined],
    ["+44 7700 900123", "+34", "+44 7700900123", undefined],
    ["+355 69 123 4567", "+34", "+355691234567", undefined],
    ["07700 900123", "+34", "07700900123", "phoneNoCountry"],
    ["07700 900123", "+44", "+44 7700900123", undefined],
    ["447700900123", "+44", "+44 7700900123", undefined],
    ["06 1234 5678", "+39", "+39 0612345678", undefined],
    ["3.46001E+10", "+34", null, "phoneUnreadable"],
    ["3.4600123456E+10", "+34", "+34 600123456", undefined],
    ["12345", "+34", "12345", "phoneNoCountry"],
    ["n/a", "+34", null, undefined],
  ])("%s with %s", (raw, dial, phone, warning) => {
    const cleaned = cleanPhone(raw, dial);
    expect(cleaned.phone).toBe(phone);
    expect(cleaned.warning).toBe(warning);
  });

  it("keeps a second number for the notes", () => {
    expect(cleanPhone("600123456 / 952123456", "+34")).toEqual({ phone: "+34 600123456", extra: ["952123456"] });
    expect(cleanPhone("600123456 o 611222333", "+34").extra).toEqual(["611222333"]);
  });
});

describe("parseMoney", () => {
  it.each([
    ["250000", 250000],
    ["250.000", 250000],
    ["250,000", 250000],
    ["€ 250.000", 250000],
    ["250.000 €", 250000],
    ["250.000,50", 250000.5],
    ["250,000.50", 250000.5],
    ["1.250.000", 1250000],
    ["1,5M", 1500000],
    ["1.5m", 1500000],
    ["450k", 450000],
    ["12,5", 12.5],
    ["450000.09999999998", 450000.1],
    ["450000 max", 450000],
    ["5 000", 5000],
    ["5\u00a0000", 5000],
    ["1\u202f250\u202f000,50", 1250000.5],
    ["250 000 €", 250000],
    ["3 bedrooms", 3],
    ["", null],
    ["-", null],
    ["n/a", null],
    ["consultar", null],
    ["-5000", null],
  ])("%s → %s", (raw, value) => {
    expect(parseMoney(raw)).toBe(value);
  });
});

describe("parseBudget", () => {
  it.each([
    ["300 000 – 450 000", 300000, 450000],
    ["300.000 - 450.000", 300000, 450000],
    ["300k–450k", 300000, 450000],
    ["de 300.000 a 450.000", 300000, 450000],
    ["between 300,000 and 450,000", 300000, 450000],
    ["450.000 - 300.000", 300000, 450000],
    ["hasta 450.000", null, 450000],
    ["up to 450k", null, 450000],
    ["max 450000", null, 450000],
    ["< 450.000", null, 450000],
    ["desde 300.000", 300000, null],
    ["from 300k", 300000, null],
    ["mín. 300000", 300000, null],
    ["300.000+", 300000, null],
    ["> 300.000", 300000, null],
    ["450.000", null, 450000],
    ["consultar", null, null],
  ])("%s", (raw, min, max) => {
    expect(parseBudget(raw)).toEqual({ min, max });
  });
});

describe("parseCount and parseYesNo", () => {
  it.each([
    ["3", 3],
    ["3+", 3],
    ["3-4", 3],
    ["3 dormitorios", 3],
    ["2.5", 2],
    ["tres", null],
    ["120", null],
    ["", null],
  ])("count %s → %s", (raw, value) => {
    expect(parseCount(raw)).toBe(value);
  });

  it.each([
    ["Sí", true],
    ["si", true],
    ["YES", true],
    ["x", true],
    ["✓", true],
    ["1", true],
    ["No", false],
    ["false", false],
    ["0", false],
    ["", null],
    ["quizás", null],
  ])("yes/no %s → %s", (raw, value) => {
    expect(parseYesNo(raw)).toBe(value);
  });
});

describe("parsePropertyTypes", () => {
  it("reads labels, synonyms and lists", () => {
    expect(parsePropertyTypes("Villa, Piso / Solar")).toEqual({ types: ["villa", "apartment", "plot"], unknown: [] });
    expect(parsePropertyTypes("Obra nueva y ático")).toEqual({ types: ["new_development", "apartment"], unknown: [] });
    expect(parsePropertyTypes("Casa adosada")).toEqual({ types: ["townhouse"], unknown: [] });
    expect(parsePropertyTypes("Villa de lujo")).toEqual({ types: ["villa"], unknown: [] });
    expect(parsePropertyTypes("New development")).toEqual({ types: ["new_development"], unknown: [] });
  });

  it("hands back what it doesn't know", () => {
    expect(parsePropertyTypes("Villa; Castillo")).toEqual({ types: ["villa"], unknown: ["Castillo"] });
    expect(parsePropertyTypes("Localidad")).toEqual({ types: [], unknown: ["Localidad"] });
  });
});

describe("languages and nationalities", () => {
  it.each([
    ["Inglés", "English"],
    ["alemán", "German"],
    ["DE", "German"],
    ["Deutsch", "German"],
    ["Neerlandés", "Dutch"],
    ["holandés", "Dutch"],
    ["Noruego", "Norwegian"],
    ["Português", "Portuguese"],
    ["Українська", "Ukrainian"],
    ["Hebreo", "Hebrew"],
    ["English, Spanish", "English"],
    ["Klingon", "Klingon"],
  ])("language %s → %s", (raw, value) => {
    expect(normalizeLanguage(raw)).toBe(value);
  });

  it.each([
    ["British", "British"],
    ["Británica", "British"],
    ["británico", "British"],
    ["UK", "British"],
    ["Reino Unido", "British"],
    ["Alemana", "German"],
    ["Alemán", "German"],
    ["Alemania", "German"],
    ["Francés", "French"],
    ["Española", "Spanish"],
    ["español", "Spanish"],
    ["SE", "Swedish"],
    ["Holandesa", "Dutch"],
    ["Escocesa", "Escocesa"],
  ])("nationality %s → %s", (raw, value) => {
    expect(normalizeNationality(raw)).toBe(value);
  });

  it("treats an empty cell as nothing", () => {
    expect(normalizeLanguage("  ")).toBeNull();
    expect(normalizeNationality("")).toBeNull();
  });
});

describe("stages, deal types and seller roles", () => {
  it("reads labels in both languages", () => {
    expect(normalizeStage("Nuevo", "buyer")).toBe("new");
    expect(normalizeStage("Visita", "buyer")).toBe("viewing");
    expect(normalizeStage("arras", "buyer")).toBe("reserved");
    expect(normalizeStage("Qualified", "seller")).toBe("qualified");
    expect(normalizeStage("Pendiente", "seller")).toBe("pending");
  });

  it("refuses a stage from the other side", () => {
    expect(normalizeStage("Pendiente", "buyer")).toBeNull();
    expect(normalizeStage("Reservado", "seller")).toBeNull();
    expect(normalizeStage("Caliente", "buyer")).toBeNull();
  });

  it("reads deal types and roles", () => {
    expect(normalizeDealType("Colaboración")).toBe("collab");
    expect(normalizeDealType("Directo")).toBe("direct");
    expect(normalizeDealType("otra")).toBeNull();
    expect(normalizeSellerRole("Propietaria")).toBe("owner");
    expect(normalizeSellerRole("Representante")).toBe("representative");
  });
});
