import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

import { BUYER_COLUMNS, SELLER_COLUMNS } from "./columns";

const SIDES = [
  ["buyers", BUYER_COLUMNS],
  ["sellers", SELLER_COLUMNS],
] as const;

describe("transfer columns", () => {
  it("lists the buyer columns in file order", () => {
    expect(BUYER_COLUMNS.map((c) => c.key)).toEqual([
      "first_name",
      "last_name",
      "email",
      "phone",
      "language",
      "nationality",
      "agency",
      "stage",
      "deal_type",
      "priority",
      "is_active",
      "budget_min",
      "budget_max",
      "property_types",
      "bedrooms",
      "bathrooms",
      "area_notes",
      "notes",
      "down_payment",
      "down_payment_date",
      "ppc",
      "ppc_date",
      "notary_date",
      "notary_notes",
      "commission",
      "closed_at",
      "viewing_count",
      "created_at",
      "updated_at",
      "id",
    ]);
  });

  it("lists the seller columns in file order", () => {
    expect(SELLER_COLUMNS.map((c) => c.key)).toEqual([
      "first_name",
      "last_name",
      "email",
      "phone",
      "language",
      "nationality",
      "agency",
      "stage",
      "seller_role",
      "priority",
      "is_active",
      "property_type",
      "price",
      "property_bedrooms",
      "address",
      "city",
      "property_notes",
      "notes",
      "created_at",
      "updated_at",
      "id",
    ]);
  });

  it.each(LOCALES)("has a header for every column in %s", (locale) => {
    const headers: Record<string, string> = messagesFor(locale).transfer.columns;
    for (const [, columns] of SIDES) {
      for (const { key } of columns) expect(headers[key], key).toBeTruthy();
    }
  });

  it("translates every header into Spanish rather than falling back", () => {
    const en: Record<string, string> = messagesFor("en").transfer.columns;
    const es: Record<string, string> = messagesFor("es").transfer.columns;
    // "Email" reads the same in both, as it does in the client form.
    const same = Object.keys(en).filter((key) => en[key] === es[key]);
    expect(same).toEqual(["email"]);
  });

  it.each(LOCALES)("never repeats a header on one side in %s", (locale) => {
    const headers: Record<string, string> = messagesFor(locale).transfer.columns;
    for (const [side, columns] of SIDES) {
      const seen = columns.map((c) => headers[c.key]);
      expect(new Set(seen).size, side).toBe(seen.length);
    }
  });

  it.each(LOCALES)("names its sheets the way the sidebar does in %s", (locale) => {
    const { transfer, nav } = messagesFor(locale);
    expect(transfer.sheets.buyers).toBe(nav.buyers);
    expect(transfer.sheets.sellers).toBe(nav.sellers);
    expect(transfer.sheets.appointments).toBe(nav.calendar);
    expect(transfer.sheets.tasks).toBe(nav.tasks);
    expect(transfer.sheets.templates).toBe(nav.templates);
  });
});
