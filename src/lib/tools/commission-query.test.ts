import { describe, expect, it } from "vitest";

import {
  EMPTY_FIELDS,
  commissionInput,
  fieldsFromQuery,
  queryFromFields,
  type CommissionFields,
} from "./commission-query";

/** Numbers back to text the way the Spanish page writes them. */
const spanish = (value: number, kind: "money" | "percent") =>
  new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: kind === "money" ? 2 : 4,
    useGrouping: kind === "money",
  }).format(value);

const filled: CommissionFields = {
  price: "437.500",
  feeType: "pct",
  fee: "3,5",
  includesTax: true,
  tax: "igic",
  customTax: "",
  shared: true,
  otherShare: "40",
  agentSplit: true,
  agentShare: "62,5",
  withholding: "15",
};

describe("commissionInput", () => {
  it("is null until there is a fee", () => {
    expect(commissionInput(EMPTY_FIELDS)).toBeNull();
    expect(commissionInput({ ...EMPTY_FIELDS, fee: "abc" })).toBeNull();
    expect(commissionInput({ ...EMPTY_FIELDS, feeType: "eur", fee: "12.000" })).not.toBeNull();
  });

  it("is null while a switched-on share is empty", () => {
    const base = { ...EMPTY_FIELDS, feeType: "eur" as const, fee: "12.000" };
    expect(commissionInput({ ...base, shared: true })).toBeNull();
    expect(commissionInput({ ...base, agentSplit: true, agentShare: "abc" })).toBeNull();
    expect(commissionInput({ ...base, shared: true, otherShare: "30" })).not.toBeNull();
  });

  it("is null for an unreadable price or custom tax rate", () => {
    const base = { ...EMPTY_FIELDS, feeType: "eur" as const, fee: "12.000" };
    expect(commissionInput({ ...base, price: "consultar" })).toBeNull();
    expect(commissionInput({ ...base, tax: "other" })).toBeNull();
    expect(commissionInput({ ...base, tax: "other", customTax: "10" })?.taxRate).toBe(0.1);
  });

  it("reads every field", () => {
    expect(commissionInput(filled)).toEqual({
      price: 437_500,
      fee: { kind: "percent", percent: 3.5 },
      feeIncludesTax: true,
      taxRate: 0.07,
      otherAgencyPercent: 40,
      agentPercent: 62.5,
      withholding: 0.15,
    });
  });
});

describe("the link", () => {
  it("is empty for an empty form", () => {
    expect(queryFromFields(EMPTY_FIELDS)).toBe("");
  });

  it("carries plain numbers", () => {
    expect(queryFromFields(filled)).toBe("p=437500&ft=pct&f=3.5&inc=1&tax=igic&o=40&a=62.5&w=15");
  });

  it("leaves out a share whose switch is off", () => {
    expect(queryFromFields({ ...filled, shared: false, agentSplit: false })).toBe(
      "p=437500&ft=pct&f=3.5&inc=1&tax=igic&w=15"
    );
  });

  it("restores every field", () => {
    expect(fieldsFromQuery(`?${queryFromFields(filled)}`, spanish)).toEqual(filled);
  });

  it("restores a fixed fee and a custom tax rate", () => {
    const fields: CommissionFields = {
      ...EMPTY_FIELDS,
      feeType: "eur",
      fee: "16.250,5",
      tax: "other",
      customTax: "9,5",
      withholding: "7",
    };
    expect(queryFromFields(fields)).toBe("ft=eur&f=16250.5&tax=9.5&w=7");
    expect(fieldsFromQuery("ft=eur&f=16250.5&tax=9.5&w=7", spanish)).toEqual(fields);
  });

  it("ignores values it can't read", () => {
    expect(fieldsFromQuery("?p=abc&ft=usd&f=-3&tax=vat&o=150&a=&w=20&inc=yes", spanish)).toEqual(
      EMPTY_FIELDS
    );
  });
});
