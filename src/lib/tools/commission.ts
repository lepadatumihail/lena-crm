/**
 * The arithmetic behind the commission calculator, a free public tool: the
 * fee and its tax (on a sale or a rental), the split with another agency, the
 * agent's share of their agency's side, and the agent's own invoice with IRPF
 * withheld.
 *
 * Pure functions, no React. Money is whole cents inside and euros at the
 * edges; percentages and rates become parts per million, so every line is
 * integer arithmetic (rounded half up) and the two halves of each split add up
 * to the cent. Nothing here supplies a commission rate or a split: those come
 * from the person using the tool (see plan 018 on the CNMC).
 */

export type FeeBasis =
  | { kind: "percent"; percent: number }
  | { kind: "amount"; amount: number }
  /** A rental: the monthly rent (`price`) times a number of months. */
  | { kind: "months"; months: number }
  /** A rental: a percentage of a year's rent (twelve times `price`). */
  | { kind: "annualPercent"; percent: number };

export type CommissionInput = {
  /**
   * In euros: the sale price, or the monthly rent when the fee is counted in
   * months of rent or as a percentage of a year's rent. Required whenever the
   * fee depends on it.
   */
  price: number | null;
  fee: FeeBasis;
  /** The fee as entered already includes the tax. */
  feeIncludesTax: boolean;
  /** 0.21 for IVA, 0.07 for IGIC, or a custom rate between 0 and 1. */
  taxRate: number;
  /** Percent of the fee that goes to the other agency; null when not shared. */
  otherAgencyPercent: number | null;
  /** Your percent of your agency's side; null when you keep all of it. */
  agentPercent: number | null;
  /** IRPF withheld from your invoice. */
  withholding: 0 | 0.07 | 0.15;
};

export type CommissionBreakdown = {
  feeNet: number;
  feeTax: number;
  feeGross: number;
  /** feeNet ÷ price when a sale price is known; for display only. */
  feeShareOfPrice: number | null;
  /** null when the fee isn't shared. */
  otherAgencyNet: number | null;
  ourSideNet: number;
  /** null when agentPercent is null. */
  agencyKeepsNet: number | null;
  /** Your base: our whole side, or your share of it. */
  yourNet: number;
  yourTax: number;
  yourWithholding: number;
  /** yourNet + yourTax − yourWithholding */
  yourInvoiceTotal: number;
};

export const PPM = 1_000_000;

/** The most months of rent a fee can be counted in: anything above is a typo. */
const MAX_MONTHS = 120;

/**
 * amount × num ÷ den, rounded half up, for amounts of zero or more. BigInt, so
 * no product ever loses a digit.
 */
export function mulDiv(amount: number, num: number, den: number): number {
  const two = BigInt(2);
  const d = BigInt(den);
  return Number((BigInt(amount) * BigInt(num) * two + d) / (d * two));
}

/** Euros as whole cents; null when negative, not a number or too large to count exactly. */
function toCents(euros: number): number | null {
  if (!Number.isFinite(euros) || euros < 0) return null;
  const cents = Math.round(euros * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

/** A fraction between 0 and 1 in parts per million; null outside that range. */
function toPpm(fraction: number): number | null {
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) return null;
  return Math.round(fraction * PPM);
}

/** A percentage between 0 and 100 in parts per million; null outside that range. */
const percentPpm = (percent: number) => toPpm(percent / 100);

const toEuros = (cents: number) => cents / 100;

/**
 * Every line of the calculation, or null (never zeros) when anything the
 * calculation needs is missing or out of range.
 */
export function computeCommission(input: CommissionInput): CommissionBreakdown | null {
  const tax = toPpm(input.taxRate);
  const withholding = toPpm(input.withholding);
  const other = input.otherAgencyPercent == null ? null : percentPpm(input.otherAgencyPercent);
  const agent = input.agentPercent == null ? null : percentPpm(input.agentPercent);
  const price = input.price == null ? null : toCents(input.price);
  if (tax == null || withholding == null) return null;
  if (input.otherAgencyPercent != null && other == null) return null;
  if (input.agentPercent != null && agent == null) return null;
  if (input.price != null && price == null) return null;

  const { fee } = input;
  let entered: number;
  if (fee.kind === "amount") {
    const amount = toCents(fee.amount);
    if (amount == null) return null;
    entered = amount;
  } else {
    // Every other basis is worked out of the price (or the monthly rent).
    if (price == null || price <= 0) return null;
    if (fee.kind === "months") {
      const { months } = fee;
      if (!Number.isFinite(months) || months < 0 || months > MAX_MONTHS) return null;
      entered = mulDiv(price, Math.round(months * PPM), PPM);
    } else {
      const rate = percentPpm(fee.percent);
      if (rate == null) return null;
      entered = mulDiv(fee.kind === "annualPercent" ? price * 12 : price, rate, PPM);
    }
  }
  if (!Number.isSafeInteger(entered)) return null;

  // Tax included: the base is what, taxed, gives the amount entered.
  const feeNet = input.feeIncludesTax ? mulDiv(entered, PPM, PPM + tax) : entered;
  const feeTax = input.feeIncludesTax ? entered - feeNet : mulDiv(feeNet, tax, PPM);

  // Each split rounds one side and gives the other the rest, so they add up.
  const otherAgency = other == null ? null : mulDiv(feeNet, other, PPM);
  const ourSide = feeNet - (otherAgency ?? 0);
  const you = agent == null ? ourSide : mulDiv(ourSide, agent, PPM);
  const agencyKeeps = agent == null ? null : ourSide - you;

  // A freelance agent's invoice carries the same tax as the fee; IRPF is
  // withheld from the base, never from the tax.
  const yourTax = mulDiv(you, tax, PPM);
  const yourWithholding = mulDiv(you, withholding, PPM);

  return {
    feeNet: toEuros(feeNet),
    feeTax: toEuros(feeTax),
    feeGross: toEuros(feeNet + feeTax),
    feeShareOfPrice:
      price != null && price > 0 && (fee.kind === "percent" || fee.kind === "amount")
        ? feeNet / price
        : null,
    otherAgencyNet: otherAgency == null ? null : toEuros(otherAgency),
    ourSideNet: toEuros(ourSide),
    agencyKeepsNet: agencyKeeps == null ? null : toEuros(agencyKeeps),
    yourNet: toEuros(you),
    yourTax: toEuros(yourTax),
    yourWithholding: toEuros(yourWithholding),
    yourInvoiceTotal: toEuros(you + yourTax - yourWithholding),
  };
}

/** A plain decimal as typed, "1,5" or "1.5"; null for "", text, a sign, or more than `max`. */
function parseDecimal(text: string, max: number): number | null {
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return null;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && value <= max ? value : null;
}

/** "3,5" → 3.5, "3.5 %" → 3.5; "" and anything outside 0–100 → null. */
export function parsePercent(raw: string): number | null {
  return parseDecimal(raw.trim().replace(/\s*%$/, ""), 100);
}

/** A number of months of rent: "1,5" → 1.5; "" and anything outside 0–120 → null. */
export function parseMonths(raw: string): number | null {
  return parseDecimal(raw.trim(), MAX_MONTHS);
}
