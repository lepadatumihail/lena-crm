import { describe, expect, it } from "vitest";

import {
  MAX_SALES,
  computeEarnings,
  cotizationRows,
  estimateCuota,
  parseSales,
  salesNeeded,
  type EarningsInput,
} from "@/lib/tools/earnings";

/** €5,000 of fee per sale, all yours, €500 a month of costs, 15% withheld, the cuota estimated. */
const BASE: EarningsInput = {
  price: null,
  fee: { kind: "amount", amount: 5000 },
  shared: null,
  agentPercent: null,
  cuota: null,
  costs: 500,
  withholding: 0.15,
};

describe("estimateCuota", () => {
  it("puts no earnings in the first band, at its minimum", () => {
    expect(estimateCuota(0)).toEqual({ band: 1, cuota: 20_588 });
    expect(estimateCuota(-500_000)).toEqual({ band: 1, cuota: 20_588 });
  });

  it("takes 7% for general expenses before finding the band", () => {
    // €34,000 a year → €2,635 a month after the deduction: 2,330 < x ≤ 2,760.
    expect(estimateCuota(3_400_000)).toEqual({ band: 10, cuota: 42_721 });
  });

  it("splits the reduced and the general table at €1,166.70", () => {
    const yearFor = (monthlyCents: number) => Math.ceil((monthlyCents * 12) / 0.93);
    expect(estimateCuota(yearFor(116_669)).band).toBe(3);
    expect(estimateCuota(yearFor(116_670)).band).toBe(4);
  });

  it("ends at the top band", () => {
    expect(estimateCuota(1_000_000_000)).toEqual({ band: 15, cuota: 60_735 });
  });
});

describe("cotizationRows", () => {
  it("lists every band with its bounds and minimum cuota in euros", () => {
    const rows = cotizationRows();
    expect(rows).toHaveLength(15);
    expect(rows[0]).toEqual({ from: null, upTo: 670, cuota: 205.88 });
    expect(rows[1]).toEqual({ from: 670.01, upTo: 900, cuota: 226.47 });
    expect(rows[3]).toEqual({ from: 1166.7, upTo: 1300, cuota: 299.56 });
    expect(rows[14]).toEqual({ from: 6000.01, upTo: null, cuota: 607.35 });
  });
});

describe("computeEarnings", () => {
  // The page's worked example, in both languages.
  it("works a year down to the take-home a month", () => {
    expect(computeEarnings(BASE, 8)).toEqual({
      sales: 8,
      feesNet: 40_000,
      otherAgencies: 0,
      agencyKeeps: null,
      yourFees: 40_000,
      perSale: 5000,
      cuotaMonthly: 427.21,
      band: 10,
      cuota: 5126.52,
      costs: 6000,
      incomeTax: 6000,
      incomeTaxKind: "withheld",
      takeHome: 22_873.48,
      takeHomeMonthly: 1906.12,
    });
  });

  it("splits the shared share of the sales and your agency's part, adding up to the cent", () => {
    const year = computeEarnings(
      {
        ...BASE,
        price: 300_000,
        fee: { kind: "percent", percent: 4 },
        shared: { salesPercent: 50, otherAgencyPercent: 50 },
        agentPercent: 70,
      },
      10
    );
    expect(year).toMatchObject({
      feesNet: 120_000,
      otherAgencies: 30_000,
      agencyKeeps: 27_000,
      yourFees: 63_000,
      perSale: 6300,
    });
    expect(year!.otherAgencies + year!.agencyKeeps! + year!.yourFees).toBe(year!.feesNet);
  });

  it("keeps the lines whole when a share doesn't divide evenly", () => {
    const year = computeEarnings(
      {
        ...BASE,
        fee: { kind: "amount", amount: 3333.33 },
        shared: { salesPercent: 33.3, otherAgencyPercent: 41.7 },
        agentPercent: 63.3,
      },
      7
    );
    const total = Math.round((year!.otherAgencies + year!.agencyKeeps! + year!.yourFees) * 100);
    expect(total).toBe(Math.round(year!.feesNet * 100));
  });

  it("sets aside quarterly advances on the net earnings when nothing is withheld", () => {
    const year = computeEarnings({ ...BASE, withholding: 0 }, 8)!;
    expect(year.incomeTaxKind).toBe("advance");
    // 20% of 40,000 − 6,000 − 5,126.52
    expect(year.incomeTax).toBe(5774.7);
    expect(year.takeHome).toBe(23_098.78);
  });

  it("uses the cuota you typed instead of the table", () => {
    const year = computeEarnings({ ...BASE, cuota: 88.64 }, 8)!;
    expect(year.band).toBeNull();
    expect(year.cuota).toBe(1063.68);
  });

  it("shows a year without sales as a loss", () => {
    const year = computeEarnings({ ...BASE, costs: 0 }, 0)!;
    expect(year.perSale).toBeNull();
    expect(year.takeHome).toBe(-2470.56);
    expect(year.takeHomeMonthly).toBe(-205.88);
  });

  it("needs the price for a percentage fee", () => {
    expect(computeEarnings({ ...BASE, fee: { kind: "percent", percent: 3 } }, 8)).toBeNull();
  });

  it.each<[string, Partial<EarningsInput>, number]>([
    ["too many sales", {}, MAX_SALES + 1],
    ["a fraction of a sale", {}, 2.5],
    ["a share over 100", { agentPercent: 101 }, 8],
    ["shared sales over 100", { shared: { salesPercent: 120, otherAgencyPercent: 50 } }, 8],
    ["negative costs", { costs: -1 }, 8],
    ["a negative cuota", { cuota: -1 }, 8],
  ])("refuses %s", (_, change, sales) => {
    expect(computeEarnings({ ...BASE, ...change }, sales)).toBeNull();
  });
});

describe("salesNeeded", () => {
  it("finds the fewest sales that reach the take-home", () => {
    expect(salesNeeded(BASE, 1906.12)?.sales).toBe(8);
    expect(salesNeeded(BASE, 1906.13)?.sales).toBe(9);
  });

  // The tool pages quote this example in both languages: keep them in step.
  it("answers the page's worked example", () => {
    expect(computeEarnings(BASE, 9)?.takeHomeMonthly).toBe(2234.56);
    expect(salesNeeded(BASE, 2500)).toMatchObject({ sales: 10, band: 12, takeHomeMonthly: 2562.99 });
  });

  it("says so when no number of sales gets there", () => {
    expect(salesNeeded({ ...BASE, fee: { kind: "amount", amount: 0 } }, 1000)).toBeNull();
    expect(salesNeeded(BASE, 1_000_000)).toBeNull();
  });
});

describe("parseSales", () => {
  it.each([
    ["12", 12],
    [" 0 ", 0],
    ["1000", 1000],
    ["1001", null],
    ["2.5", null],
    ["", null],
    ["ten", null],
  ])("reads %j as %j", (raw, expected) => {
    expect(parseSales(raw)).toBe(expected);
  });
});
