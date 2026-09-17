import { describe, expect, it } from "vitest";

import { foldHeader, matchHeader, targetFor } from "./synonyms";

describe("foldHeader", () => {
  it.each([
    ["E-mail 1 - Value", "e mail 1 value"],
    ["Dormitorios: mínimos", "dormitorios minimos"],
    ["  Presupuesto máx. (€) ", "presupuesto max"],
    ["Teléfono", "telefono"],
  ])("%s → %s", (header, folded) => {
    expect(foldHeader(header)).toBe(folded);
  });
});

describe("matchHeader: keywords, for headers the dictionary doesn't hold", () => {
  it.each([
    ["Correo del cliente", "email"],
    ["Email del cónyuge", "add_to_notes"],
    ["Teléfono de la pareja", "add_to_notes"],
    ["Número de móvil", "phone"],
    ["Tel. fijo", "phone"],
    ["Hotel preferido", "add_to_notes"],
    ["Consentimiento RGPD", "add_to_notes"],
    ["Nº pasaporte", "ignore"],
    ["Primer apellido del titular", "last_name"],
    ["Presupuesto de compra desde", "budget_min"],
    ["Precio hasta", "budget_max"],
    ["Precio orientativo", "price"],
    ["Precio alquiler mensual", "add_to_notes"],
    ["Nº dormitorios", "bedrooms"],
    ["Dormitorios máx", "add_to_notes"],
    ["Cuartos de baño", "bathrooms"],
    ["Comentarios internos", "notes"],
    ["Cómo nos conoció", "add_to_notes"],
  ])("%s → %s", (header, concept) => {
    const match = matchHeader(header);
    expect(match.concept).toBe(concept);
    expect(match.exact).toBe(false);
  });

  it("ranks phones and second emails", () => {
    expect(matchHeader("Móvil personal").rank).toBe(1);
    expect(matchHeader("Teléfono fijo").rank).toBe(2);
    expect(matchHeader("Teléfono trabajo 2").rank).toBe(3);
    expect(matchHeader("Correo 2").concept).toBe("add_to_notes");
  });

  it("ignores a column with no header", () => {
    expect(matchHeader("  ").concept).toBe("ignore");
  });
});

describe("targetFor", () => {
  it("reads a concept by the file's side", () => {
    expect(targetFor("price", "buyer")).toBe("budget");
    expect(targetFor("price", "seller")).toBe("price");
    expect(targetFor("bedrooms", "seller")).toBe("property_bedrooms");
    expect(targetFor("zone", "buyer")).toBe("area_notes");
    expect(targetFor("town", "buyer")).toBe("add_to_notes");
    expect(targetFor("deal_type", "seller")).toBe("add_to_notes");
    expect(targetFor("email", "seller")).toBe("email");
  });
});
