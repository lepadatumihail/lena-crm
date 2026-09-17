import { describe, expect, it } from "vitest";

import enTransfer from "../../../messages/en/transfer.json";
import esTransfer from "../../../messages/es/transfer.json";
import type { ClientSide } from "@/lib/crm";
import { columnsForSide } from "@/lib/transfer/columns";

import { autoMap, mappingSignature } from "./auto-map";
import type { ImportTarget } from "./fields";

/** header → target, for a readable assertion. */
function mapped(headers: string[], side: ClientSide = "buyer", rows: string[][] = []) {
  const mapping = autoMap(headers, rows, side);
  return Object.fromEntries(headers.map((h, i) => [h, mapping[i].target])) as Record<string, ImportTarget>;
}

describe("autoMap: real header sets", () => {
  it("Google Contacts, current export", () => {
    const headers = [
      "First Name", "Middle Name", "Last Name", "Phonetic First Name", "Name Prefix", "Nickname", "File As",
      "Organization Name", "Organization Title", "Birthday", "Notes", "Photo", "Labels",
      "E-mail 1 - Label", "E-mail 1 - Value", "E-mail 2 - Label", "E-mail 2 - Value",
      "Phone 1 - Label", "Phone 1 - Value", "Phone 2 - Label", "Phone 2 - Value", "Address 1 - Formatted",
    ];
    const m = mapped(headers);
    expect(m["First Name"]).toBe("first_name");
    expect(m["Middle Name"]).toBe("middle_name");
    expect(m["Last Name"]).toBe("last_name");
    expect(m["E-mail 1 - Value"]).toBe("email");
    expect(m["E-mail 2 - Value"]).toBe("add_to_notes");
    expect(m["Phone 1 - Value"]).toBe("phone");
    expect(m["Phone 2 - Value"]).toBe("phone");
    expect(m["Notes"]).toBe("notes");
    expect(m["Labels"]).toBe("add_to_notes");
    for (const ignored of ["E-mail 1 - Label", "Phone 2 - Label", "Phonetic First Name", "Photo", "Nickname"]) {
      expect(m[ignored]).toBe("ignore");
    }
  });

  it("Google Contacts, older export: Name repeats Given and Family Name", () => {
    const m = mapped([
      "Name", "Given Name", "Additional Name", "Family Name", "Group Membership",
      "E-mail 1 - Type", "E-mail 1 - Value", "Phone 1 - Type", "Phone 1 - Value", "Organization 1 - Name",
    ]);
    expect(m["Name"]).toBe("ignore");
    expect(m["Given Name"]).toBe("first_name");
    expect(m["Family Name"]).toBe("last_name");
    expect(m["E-mail 1 - Value"]).toBe("email");
    expect(m["Phone 1 - Value"]).toBe("phone");
    expect(m["E-mail 1 - Type"]).toBe("ignore");
    expect(m["Group Membership"]).toBe("add_to_notes");
  });

  it("Outlook: the mobile outranks the home phone", () => {
    const headers = [
      "First Name", "Last Name", "Company", "E-mail Address", "E-mail 2 Address",
      "Home Phone", "Mobile Phone", "Business Phone", "Notes", "Categories",
    ];
    const mapping = autoMap(headers, [], "buyer");
    const rank = (h: string) => mapping[headers.indexOf(h)].rank;
    expect(mapping[headers.indexOf("Mobile Phone")].target).toBe("phone");
    expect(rank("Mobile Phone")).toBeLessThan(rank("Home Phone")!);
    expect(mapped(headers)["E-mail 2 Address"]).toBe("add_to_notes");
    expect(mapped(headers)["Company"]).toBe("add_to_notes");
  });

  it("Inmoweb", () => {
    const headers = [
      "Nombre", "Apellidos", "Idioma", "Tipo de contacto", "NIF", "IBAN", "Nacionalidad", "Dirección", "Población",
      "Email principal", "Email secundario", "Teléfono principal", "Móvil principal", "WhatsApp", "GDPR", "Observaciones",
    ];
    const mapping = autoMap(headers, [], "buyer");
    const m = mapped(headers);
    expect(m["Nombre"]).toBe("first_name");
    expect(m["Apellidos"]).toBe("last_name");
    expect(m["Idioma"]).toBe("language");
    expect(m["Nacionalidad"]).toBe("nationality");
    expect(m["NIF"]).toBe("ignore");
    expect(m["IBAN"]).toBe("ignore");
    expect(m["Email principal"]).toBe("email");
    expect(m["Email secundario"]).toBe("add_to_notes");
    expect(m["GDPR"]).toBe("add_to_notes");
    expect(m["Observaciones"]).toBe("notes");
    expect(m["Población"]).toBe("add_to_notes");
    expect(mapping[headers.indexOf("Móvil principal")].rank).toBeLessThan(
      mapping[headers.indexOf("Teléfono principal")].rank!
    );
    // For a seller the same columns describe the property.
    expect(mapped(headers, "seller")["Dirección"]).toBe("address");
    expect(mapped(headers, "seller")["Población"]).toBe("city");
  });

  it("Witei", () => {
    const headers = [
      "Alias", "Nombre", "Email", "Email. alternativo", "Email dado de baja", "Teléfono", "Teléfono alternativo",
      "NIF", "Notas", "Tipo", "Dormitorios: mínimos", "Dormitorios: máximo", "Precio mínimo de Venta",
      "Precio máximo de Venta", "Precio máximo de Alquiler", "Superficie mínima",
    ];
    const rows = [["", "Ana Ruiz", "", "", "No", "", "", "", "", "Comprador"]];
    const m = mapped(headers, "buyer", rows);
    expect(m["Nombre"]).toBe("full_name");
    expect(m["Email"]).toBe("email");
    expect(m["Email. alternativo"]).toBe("add_to_notes");
    expect(m["Email dado de baja"]).toBe("add_to_notes");
    expect(m["Precio mínimo de Venta"]).toBe("budget_min");
    expect(m["Precio máximo de Venta"]).toBe("budget_max");
    expect(m["Precio máximo de Alquiler"]).toBe("add_to_notes");
    expect(m["Superficie mínima"]).toBe("add_to_notes");
    expect(m["Dormitorios: mínimos"]).toBe("bedrooms");
    expect(m["Dormitorios: máximo"]).toBe("add_to_notes");
    // "Tipo" holds "Comprador", not a property type.
    expect(m["Tipo"]).toBe("add_to_notes");
    expect(mapped(headers, "buyer", [["", "", "", "", "", "", "", "", "", "Piso"]])["Tipo"]).toBe("property_types");
  });

  it("Inmovilla: the client's email, not the spouse's", () => {
    const m = mapped(["Conyuge Email", "Conyuge Nombre", "Apellidos", "Email Cliente", "DNI/NIE", "Ciudad Cli"]);
    expect(m["Conyuge Email"]).toBe("add_to_notes");
    expect(m["Email Cliente"]).toBe("email");
    expect(m["DNI/NIE"]).toBe("ignore");
    expect(m["Ciudad Cli"]).toBe("add_to_notes");
  });

  it("keeps one column per field and turns the rest into notes", () => {
    const m = mapped(["Agencia", "Agency", "Notas", "Comments"]);
    expect(m).toEqual({ Agencia: "agency", Agency: "add_to_notes", Notas: "notes", Comments: "notes" });
  });

  it("downgrades a custom status column", () => {
    const rows = [["Caliente"], ["Frío"], ["Caliente"]];
    expect(mapped(["Estado"], "buyer", rows)["Estado"]).toBe("add_to_notes");
    expect(mapped(["Estado"], "buyer", [["Nuevo"], ["Visita"]])["Estado"]).toBe("stage");
  });
});

describe("autoMap: LeadWing's own files", () => {
  const notImported = new Set(["viewing_count", "created_at", "updated_at", "id"]);
  const reservation = new Set([
    "down_payment", "down_payment_date", "ppc", "ppc_date", "notary_date", "notary_notes", "commission", "closed_at",
  ]);
  const cases = (["buyer", "seller"] as const).flatMap((side) =>
    ([["en", enTransfer], ["es", esTransfer]] as const).map(([locale, catalog]) => ({ side, locale, catalog }))
  );

  it.each(cases)("maps every $locale $side column back to its key", ({ side, catalog }) => {
    const keys = columnsForSide(side).map((c) => c.key);
    const mapping = autoMap(keys.map((key) => catalog.columns[key]), [], side);
    keys.forEach((key, i) => {
      const expected = notImported.has(key) ? "ignore" : reservation.has(key) ? "add_to_notes" : key;
      expect(mapping[i].target, key).toBe(expected);
    });
  });
});

describe("mappingSignature", () => {
  it("ignores case, accents and punctuation", () => {
    expect(mappingSignature(["Teléfono ", "E-mail"])).toBe(mappingSignature(["telefono", "e mail"]));
  });
});
