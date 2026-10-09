import { describe, expect, it } from "vitest";

import {
  EMPTY_EARNINGS_FIELDS,
  earningsFieldsFromQuery,
  earningsInput,
  queryFromEarningsFields,
  salesOf,
  targetOf,
  type EarningsFields,
} from "@/lib/tools/earnings-query";

/** Spanish formatting, as the page writes numbers back into its inputs. */
const es = (value: number, kind: "money" | "number") =>
  new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: kind === "money" && !Number.isInteger(value) ? 2 : 4,
    minimumFractionDigits: kind === "money" && !Number.isInteger(value) ? 2 : 0,
    useGrouping: kind === "money" ? "always" : false,
  }).format(value);

const FULL: EarningsFields = {
  ...EMPTY_EARNINGS_FIELDS,
  sales: "8",
  price: "350.000",
  fee: "3,5",
  shared: true,
  sharedSales: "40",
  otherShare: "50",
  agentSplit: true,
  agentShare: "70",
  cuotaMode: "own",
  cuota: "88,64",
  costs: "450",
  withholding: "15",
};

describe("earningsInput", () => {
  it("is null until the fee is there", () => {
    expect(earningsInput(EMPTY_EARNINGS_FIELDS)).toBeNull();
    expect(earningsInput({ ...EMPTY_EARNINGS_FIELDS, fee: "3" })).toEqual({
      price: null,
      fee: { kind: "percent", percent: 3 },
      shared: null,
      agentPercent: null,
      cuota: null,
      costs: 0,
      withholding: 0,
    });
  });

  it("reads every field", () => {
    expect(earningsInput(FULL)).toEqual({
      price: 350_000,
      fee: { kind: "percent", percent: 3.5 },
      shared: { salesPercent: 40, otherAgencyPercent: 50 },
      agentPercent: 70,
      cuota: 88.64,
      costs: 450,
      withholding: 0.15,
    });
  });

  it.each<[string, Partial<EarningsFields>]>([
    ["a shared switch without its numbers", { sharedSales: "" }],
    ["a share switch without a share", { agentShare: "" }],
    ["an own cuota left empty", { cuota: "" }],
    ["an unreadable price", { price: "lots" }],
    ["unreadable costs", { costs: "some" }],
  ])("waits on %s", (_, change) => {
    expect(earningsInput({ ...FULL, ...change })).toBeNull();
  });

  it("reads the sales and the target separately", () => {
    expect(salesOf({ ...FULL, sales: "12" })).toBe(12);
    expect(salesOf({ ...FULL, sales: "1,5" })).toBeNull();
    expect(targetOf({ ...FULL, target: "2.500" })).toBe(2500);
  });
});

describe("the link", () => {
  it("is empty for an empty form", () => {
    expect(queryFromEarningsFields(EMPTY_EARNINGS_FIELDS)).toBe("");
  });

  it("carries plain numbers", () => {
    expect(queryFromEarningsFields(FULL)).toBe(
      "n=8&p=350000&ft=pct&f=3.5&s=40&o=50&a=70&c=88.64&k=450&w=15"
    );
    expect(
      queryFromEarningsFields({ ...EMPTY_EARNINGS_FIELDS, mode: "need", target: "2.000", feeType: "eur", fee: "9.000" })
    ).toBe("m=need&t=2000&ft=eur&f=9000");
  });

  it("restores the form it came from", () => {
    expect(earningsFieldsFromQuery(queryFromEarningsFields(FULL), es)).toEqual(FULL);
    const need: EarningsFields = {
      ...EMPTY_EARNINGS_FIELDS,
      mode: "need",
      target: "2.500",
      feeType: "eur",
      fee: "9.000",
    };
    expect(earningsFieldsFromQuery(queryFromEarningsFields(need), es)).toEqual(need);
  });

  it("ignores what it can't read", () => {
    expect(earningsFieldsFromQuery("m=nope&n=2.5&ft=mo&f=abc&a=150&w=21&c=-3", es)).toEqual(
      EMPTY_EARNINGS_FIELDS
    );
  });
});
