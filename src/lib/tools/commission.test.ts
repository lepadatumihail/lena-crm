import { describe, expect, it } from "vitest";

import {
  computeCommission,
  parseMonths,
  parsePercent,
  type CommissionBreakdown,
  type CommissionInput,
} from "./commission";

/** A fixed fee before tax, not shared, no IRPF: override what a case needs. */
function input(overrides: Partial<CommissionInput> = {}): CommissionInput {
  return {
    price: null,
    fee: { kind: "amount", amount: 18_000 },
    feeIncludesTax: false,
    taxRate: 0.21,
    otherAgencyPercent: null,
    agentPercent: null,
    withholding: 0,
    ...overrides,
  };
}

function compute(overrides: Partial<CommissionInput> = {}): CommissionBreakdown {
  const result = computeCommission(input(overrides));
  if (!result) throw new Error("expected a breakdown");
  return result;
}

describe("computeCommission: the fee and its tax", () => {
  it("adds 21% to a fixed fee entered before tax", () => {
    const r = compute();
    expect([r.feeNet, r.feeTax, r.feeGross]).toEqual([18_000, 3_780, 21_780]);
  });

  it("takes the tax back out of a fee entered with tax included", () => {
    const r = compute({ fee: { kind: "amount", amount: 21_780 }, feeIncludesTax: true });
    expect([r.feeNet, r.feeTax, r.feeGross]).toEqual([18_000, 3_780, 21_780]);
  });

  it("uses IGIC at 7%", () => {
    const r = compute({ taxRate: 0.07 });
    expect([r.feeNet, r.feeTax, r.feeGross]).toEqual([18_000, 1_260, 19_260]);
  });

  it("works a percentage fee out of the price", () => {
    const r = compute({ price: 437_500, fee: { kind: "percent", percent: 3.5 } });
    expect(r.feeNet).toBe(15_312.5);
    expect(r.feeTax).toBe(3_215.63);
    expect(r.feeShareOfPrice).toBeCloseTo(0.035, 10);
  });

  it("reports the fee's share of the price only when the price is known", () => {
    expect(compute().feeShareOfPrice).toBeNull();
    expect(compute({ price: 0 }).feeShareOfPrice).toBeNull();
    expect(compute({ price: 360_000 }).feeShareOfPrice).toBeCloseTo(0.05, 10);
  });

  it("rounds a half cent of tax up", () => {
    // 150 cents × 21% is exactly 31.5 cents; floating point would make it 31.4999…
    expect(compute({ fee: { kind: "amount", amount: 1.5 } }).feeTax).toBe(0.32);
  });
});

describe("computeCommission: a rental", () => {
  it("counts the fee in months of the monthly rent, to the cent", () => {
    expect(compute({ price: 1_500, fee: { kind: "months", months: 1 } }).feeNet).toBe(1_500);
    expect(compute({ price: 1_850, fee: { kind: "months", months: 1.5 } }).feeNet).toBe(2_775);
    expect(compute({ price: 1_333.33, fee: { kind: "months", months: 2 } }).feeNet).toBe(2_666.66);
  });

  it("takes a percentage of a year's rent", () => {
    const r = compute({ price: 1_850, fee: { kind: "annualPercent", percent: 10 } });
    expect([r.feeNet, r.feeTax, r.feeGross]).toEqual([2_220, 466.2, 2_686.2]);
  });

  it("gives no share of the price for a rent-based fee", () => {
    expect(compute({ price: 1_850, fee: { kind: "months", months: 1 } }).feeShareOfPrice).toBeNull();
    expect(
      compute({ price: 1_850, fee: { kind: "annualPercent", percent: 10 } }).feeShareOfPrice
    ).toBeNull();
  });

  it.each<[string, Partial<CommissionInput>]>([
    ["months without a rent", { fee: { kind: "months", months: 1 } }],
    ["a negative number of months", { price: 1_000, fee: { kind: "months", months: -1 } }],
    ["more than 120 months", { price: 1_000, fee: { kind: "months", months: 121 } }],
    ["an annual percentage over 100", { price: 1_000, fee: { kind: "annualPercent", percent: 101 } }],
  ])("returns null for %s", (_, overrides) => {
    expect(computeCommission(input(overrides))).toBeNull();
  });
});

describe("computeCommission: the split", () => {
  it("splits the fee with the other agency", () => {
    const r = compute({ otherAgencyPercent: 50 });
    expect([r.otherAgencyNet, r.ourSideNet]).toEqual([9_000, 9_000]);
  });

  it("keeps an odd cent on one side so the halves still add up", () => {
    const r = compute({ fee: { kind: "amount", amount: 10_000.01 }, otherAgencyPercent: 50 });
    expect(r.otherAgencyNet! + r.ourSideNet).toBeCloseTo(10_000.01, 10);
    expect(Math.round(r.otherAgencyNet! * 100) + Math.round(r.ourSideNet * 100)).toBe(1_000_001);
  });

  it("gives the agent their share of our side and the agency the rest", () => {
    const r = compute({ otherAgencyPercent: 50, agentPercent: 70, withholding: 0.15 });
    expect(r.yourNet).toBe(6_300);
    expect(r.agencyKeepsNet).toBe(2_700);
    expect(r.yourTax).toBe(1_323);
    expect(r.yourWithholding).toBe(945);
    expect(r.yourInvoiceTotal).toBe(6_678);
  });

  it("leaves the whole fee to you when nothing is shared", () => {
    const r = compute();
    expect(r.otherAgencyNet).toBeNull();
    expect(r.agencyKeepsNet).toBeNull();
    expect([r.ourSideNet, r.yourNet]).toEqual([18_000, 18_000]);
  });
});

describe("computeCommission: IRPF on your invoice", () => {
  it("withholds 7% from the base, not from the tax", () => {
    const r = compute({ fee: { kind: "amount", amount: 10_000 }, withholding: 0.07 });
    expect(r.yourTax).toBe(2_100);
    expect(r.yourWithholding).toBe(700);
    expect(r.yourInvoiceTotal).toBe(11_400);
  });

  it("withholds with a custom tax rate of 0", () => {
    const r = compute({ fee: { kind: "amount", amount: 10_000 }, taxRate: 0, withholding: 0.15 });
    expect([r.feeTax, r.yourTax]).toEqual([0, 0]);
    expect(r.yourWithholding).toBe(1_500);
    expect(r.yourInvoiceTotal).toBe(8_500);
  });
});

describe("computeCommission: incomplete or out-of-range input", () => {
  it.each<[string, Partial<CommissionInput>]>([
    ["a percentage fee without a price", { fee: { kind: "percent", percent: 3 } }],
    ["a percentage fee with a price of 0", { price: 0, fee: { kind: "percent", percent: 3 } }],
    ["a fee percentage over 100", { price: 100_000, fee: { kind: "percent", percent: 101 } }],
    ["a negative fee percentage", { price: 100_000, fee: { kind: "percent", percent: -1 } }],
    ["a negative amount", { fee: { kind: "amount", amount: -1 } }],
    ["a negative price", { price: -1 }],
    ["a tax rate over 1", { taxRate: 1.21 }],
    ["a negative tax rate", { taxRate: -0.21 }],
    ["an other-agency share over 100", { otherAgencyPercent: 150 }],
    ["a negative agent share", { agentPercent: -5 }],
    ["an amount too large to count in cents", { fee: { kind: "amount", amount: 1e20 } }],
    ["a fee that is not a number", { fee: { kind: "amount", amount: Number.NaN } }],
  ])("returns null for %s", (_, overrides) => {
    expect(computeCommission(input(overrides))).toBeNull();
  });
});

describe("parseMonths", () => {
  it.each<[string, number | null]>([
    ["1", 1],
    ["1,5", 1.5],
    [" 2 ", 2],
    ["120", 120],
    ["121", null],
    ["", null],
    ["-1", null],
    ["un mes", null],
  ])("reads %j as %s", (raw, value) => {
    expect(parseMonths(raw)).toBe(value);
  });
});

describe("parsePercent", () => {
  it.each<[string, number | null]>([
    ["3,5", 3.5],
    ["3.5%", 3.5],
    ["3,5 %", 3.5],
    [" 3 ", 3],
    ["0", 0],
    ["100", 100],
    [",5", 0.5],
    ["", null],
    ["%", null],
    ["abc", null],
    ["101", null],
    ["-1", null],
    ["3 5", null],
  ])("reads %j as %s", (raw, value) => {
    expect(parsePercent(raw)).toBe(value);
  });
});

/** mulberry32: a tiny seeded generator, so a failing case can be replayed. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

describe("computeCommission: every breakdown adds up to the cent", () => {
  it("holds for 500 random inputs", () => {
    const random = seeded(18);
    const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
    const money = (max: number) => Math.round(random() * max * 100) / 100;
    const percent = () => Math.round(random() * 100 * 100) / 100;
    const cents = (euros: number) => Math.round(euros * 100);
    let checked = 0;

    for (let i = 0; i < 500; i++) {
      const basis = pick(["percent", "amount", "months", "annualPercent"] as const);
      const fee: CommissionInput["fee"] =
        basis === "amount"
          ? { kind: "amount", amount: money(500_000) }
          : basis === "months"
            ? { kind: "months", months: Math.round(random() * 1200) / 100 }
            : { kind: basis, percent: percent() };
      const case_: CommissionInput = {
        price: basis !== "amount" || random() < 0.5 ? money(5_000_000) + 1 : null,
        fee,
        feeIncludesTax: random() < 0.5,
        taxRate: pick([0.21, 0.07, 0, Math.round(random() * 3000) / 10_000]),
        otherAgencyPercent: random() < 0.5 ? percent() : null,
        agentPercent: random() < 0.5 ? percent() : null,
        withholding: pick([0, 0.07, 0.15] as const),
      };
      const r = computeCommission(case_);
      expect(r, JSON.stringify(case_)).not.toBeNull();
      if (!r) continue;

      const all = [
        r.feeNet, r.feeTax, r.feeGross, r.ourSideNet, r.yourNet, r.yourTax,
        r.yourWithholding, r.yourInvoiceTotal, r.otherAgencyNet ?? 0, r.agencyKeepsNet ?? 0,
      ];
      for (const value of all) {
        expect(Math.abs(value * 100 - Math.round(value * 100))).toBeLessThan(1e-6);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      expect(cents(r.feeNet) + cents(r.feeTax)).toBe(cents(r.feeGross));
      expect(cents(r.otherAgencyNet ?? 0) + cents(r.ourSideNet)).toBe(cents(r.feeNet));
      expect(cents(r.agencyKeepsNet ?? 0) + cents(r.yourNet)).toBe(cents(r.ourSideNet));
      expect(cents(r.yourNet) + cents(r.yourTax) - cents(r.yourWithholding)).toBe(
        cents(r.yourInvoiceTotal)
      );
      checked++;
    }
    expect(checked).toBe(500);
  });
});
