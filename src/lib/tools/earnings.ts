/**
 * The arithmetic behind the agent earnings calculator, a free public tool: a
 * year of sales, their fees and splits, then the cuota de autónomos, other
 * costs and income tax, down to what a self-employed agent takes home a month;
 * or the other way round, how many sales a year a take-home figure needs.
 *
 * Each sale goes through computeCommission, so it splits to the cent exactly
 * as it does in the commission calculator. Money is whole cents inside and
 * euros at the edges. Nothing here supplies a fee, a split or a share (the
 * CNMC rule, plan 018): the only figures built in are the year's Social
 * Security table and rates and the IRPF advance rate, each from the BOE.
 */
import { PPM, computeCommission, mulDiv, type CommissionInput } from "@/lib/tools/commission";

/**
 * The year the table below describes. Each year's Orden de cotización brings
 * a new one (2026's was published in the BOE on 31 March): update the table,
 * the rate and this year together.
 */
export const COTIZACION_YEAR = 2026;

/**
 * Orden PJC/297/2026, article 18.1: the bands of monthly net earnings
 * (rendimientos netos) and each band's minimum contribution base, in cents. A
 * band holds earnings up to and including `upTo`; the third band of the
 * reduced table stops just below 1,166.70, where the general table starts.
 * https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296
 */
export const COTIZACION_BANDS: readonly { upTo: number | null; minBase: number }[] = [
  { upTo: 67_000, minBase: 65_359 },
  { upTo: 90_000, minBase: 71_895 },
  { upTo: 116_669, minBase: 84_967 },
  { upTo: 130_000, minBase: 95_098 },
  { upTo: 150_000, minBase: 96_078 },
  { upTo: 170_000, minBase: 96_078 },
  { upTo: 185_000, minBase: 114_379 },
  { upTo: 203_000, minBase: 120_915 },
  { upTo: 233_000, minBase: 127_451 },
  { upTo: 276_000, minBase: 135_621 },
  { upTo: 319_000, minBase: 143_791 },
  { upTo: 362_000, minBase: 151_961 },
  { upTo: 405_000, minBase: 160_131 },
  { upTo: 600_000, minBase: 173_203 },
  { upTo: null, minBase: 192_810 },
];

/**
 * The rate on the base, in parts per million (same Orden, articles 18.2 and
 * 37.5–6): common contingencies 28.30, professional 1.30, the
 * intergenerational equity mechanism 0.90, cessation of activity 0.90 and
 * vocational training 0.10, which make 31.50 per cent.
 */
export const COTIZACION_RATE = 315_000;

/**
 * Article 308.1.c of the Ley General de la Seguridad Social: earnings for the
 * table are the net earnings with the cuota added back (here: the fees less
 * the other costs), less a 7 per cent deduction for general expenses.
 */
const GENERIC_EXPENSES = 70_000;

/**
 * IRPF regulation, article 110.1.a: a professional whose income isn't
 * withheld pays 20 per cent of the year's net earnings in quarterly advances
 * (modelo 130). Article 109.2 waives them when at least 70 per cent of the
 * previous year's income was withheld.
 */
const QUARTERLY_ADVANCE = 200_000;

/** The most sales a year the calculator counts: anything above is a typo. */
export const MAX_SALES = 1000;

export type EarningsInput = {
  /** The average sale price in euros; required when the fee is a percentage of it. */
  price: number | null;
  /** The agency's fee on one sale, before IVA. */
  fee: { kind: "percent"; percent: number } | { kind: "amount"; amount: number };
  /**
   * The percent of the sales shared with another agency, and that agency's
   * percent of the fee on each of them; null when no sale is shared.
   */
  shared: { salesPercent: number; otherAgencyPercent: number } | null;
  /** Your percent of your agency's side; null when you keep all of it. */
  agentPercent: number | null;
  /** The cuota you pay a month, in euros; null to estimate it from the table. */
  cuota: number | null;
  /** Other business costs a month, in euros. */
  costs: number;
  /** IRPF withheld from your invoices; 0 means you pay quarterly advances instead. */
  withholding: 0 | 0.07 | 0.15;
};

export type EarningsBreakdown = {
  sales: number;
  /** Every sale's fee, before IVA. */
  feesNet: number;
  /** The other agencies' part of the shared sales; 0 when none are shared. */
  otherAgencies: number;
  /** Your agency's part of its side; null when agentPercent is null. */
  agencyKeeps: number | null;
  /** The fees after every split: your income before costs and tax. */
  yourFees: number;
  /** yourFees ÷ sales; null with no sales. */
  perSale: number | null;
  cuotaMonthly: number;
  /** The table band (1–15) the estimate fell in; null when the cuota was typed. */
  band: number | null;
  /** The cuota for the year. */
  cuota: number;
  /** The other costs for the year. */
  costs: number;
  /** IRPF for the year: withheld from your invoices, or paid in quarterly advances. */
  incomeTax: number;
  incomeTaxKind: "withheld" | "advance";
  /** yourFees − cuota − costs − incomeTax; negative when the year loses money. */
  takeHome: number;
  takeHomeMonthly: number;
};

/** One sale, in cents: its fee, and the parts that leave it on a shared sale and on one that isn't. */
type Unit = {
  feeNet: number;
  /** The other agency's part of a shared sale. */
  other: number;
  /** Your part of a sale that isn't shared, and of one that is. */
  you: number;
  youShared: number;
  /** The share of sales that are shared, in parts per million. */
  sharedPpm: number;
};

const cents = (euros: number) => Math.round(euros * 100);
const toEuros = (amount: number) => amount / 100;

/** Euros as whole cents; null when negative, not a number or too large to count exactly. */
function toCents(euros: number): number | null {
  if (!Number.isFinite(euros) || euros < 0) return null;
  const amount = cents(euros);
  return Number.isSafeInteger(amount) ? amount : null;
}

/** A percentage between 0 and 100 in parts per million; null outside that range. */
function percentPpm(percent: number): number | null {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  return Math.round((percent / 100) * PPM);
}

/** A signed amount ÷ 12, rounded half away from zero (mulDiv takes no negatives). */
function perMonth(amount: number): number {
  return Math.sign(amount) * mulDiv(Math.abs(amount), 1, 12);
}

function unitOf(input: EarningsInput): Unit | null {
  const sale: CommissionInput = {
    price: input.price,
    fee: input.fee,
    feeIncludesTax: false,
    // IVA passes through to the tax agency and never reaches the agent's
    // income, so the split is all this needs.
    taxRate: 0,
    otherAgencyPercent: null,
    agentPercent: input.agentPercent,
    withholding: 0,
  };
  const alone = computeCommission(sale);
  if (!alone) return null;
  if (!input.shared) {
    return { feeNet: cents(alone.feeNet), other: 0, you: cents(alone.yourNet), youShared: 0, sharedPpm: 0 };
  }
  const sharedPpm = percentPpm(input.shared.salesPercent);
  const shared = computeCommission({ ...sale, otherAgencyPercent: input.shared.otherAgencyPercent });
  if (sharedPpm == null || !shared || shared.otherAgencyNet == null) return null;
  return {
    feeNet: cents(alone.feeNet),
    other: cents(shared.otherAgencyNet),
    you: cents(alone.yourNet),
    youShared: cents(shared.yourNet),
    sharedPpm,
  };
}

/**
 * The cuota a year's net earnings (fees less other costs, in cents) put you on:
 * the minimum base of their band times the rate. Who has chosen a higher base
 * pays more; the Social Security settles the difference once the tax return
 * shows the real earnings.
 */
export function estimateCuota(netYear: number): { band: number; cuota: number } {
  const monthly = mulDiv(Math.max(0, netYear), PPM - GENERIC_EXPENSES, PPM * 12);
  const index = COTIZACION_BANDS.findIndex((band) => band.upTo == null || monthly <= band.upTo);
  return { band: index + 1, cuota: mulDiv(COTIZACION_BANDS[index].minBase, COTIZACION_RATE, PPM) };
}

/** The table as the page shows it, in euros: each band's lower and upper bound and its minimum cuota. */
export function cotizationRows(): { from: number | null; upTo: number | null; cuota: number }[] {
  return COTIZACION_BANDS.map((band, i) => ({
    from: i === 0 ? null : toEuros((COTIZACION_BANDS[i - 1].upTo ?? 0) + 1),
    upTo: band.upTo == null ? null : toEuros(band.upTo),
    cuota: toEuros(mulDiv(band.minBase, COTIZACION_RATE, PPM)),
  }));
}

function yearOf(unit: Unit, sales: number, input: EarningsInput): EarningsBreakdown | null {
  const costsMonthly = toCents(input.costs);
  const typed = input.cuota == null ? null : toCents(input.cuota);
  const withholding = percentPpm(input.withholding * 100);
  if (costsMonthly == null || withholding == null) return null;
  if (input.cuota != null && typed == null) return null;

  const feesNet = unit.feeNet * sales;
  if (!Number.isSafeInteger(feesNet)) return null;
  // The shared sales are a share of the year, so their parts are weighted by it.
  const otherAgencies = mulDiv(unit.other * sales, unit.sharedPpm, PPM);
  const ourSide = feesNet - otherAgencies;
  const yourFees =
    input.agentPercent == null
      ? ourSide
      : Math.min(
          ourSide,
          mulDiv(unit.you * sales, PPM - unit.sharedPpm, PPM) +
            mulDiv(unit.youShared * sales, unit.sharedPpm, PPM)
        );

  const costs = costsMonthly * 12;
  const estimate = typed == null ? estimateCuota(yourFees - costs) : null;
  const cuotaMonthly = estimate?.cuota ?? typed ?? 0;
  const cuota = cuotaMonthly * 12;
  // Withholding comes off the fees; the quarterly advances off the net earnings.
  const incomeTax =
    withholding > 0
      ? mulDiv(yourFees, withholding, PPM)
      : mulDiv(Math.max(0, yourFees - costs - cuota), QUARTERLY_ADVANCE, PPM);
  const takeHome = yourFees - costs - cuota - incomeTax;

  return {
    sales,
    feesNet: toEuros(feesNet),
    otherAgencies: toEuros(otherAgencies),
    agencyKeeps: input.agentPercent == null ? null : toEuros(ourSide - yourFees),
    yourFees: toEuros(yourFees),
    perSale: sales > 0 ? toEuros(yourFees) / sales : null,
    cuotaMonthly: toEuros(cuotaMonthly),
    band: estimate?.band ?? null,
    cuota: toEuros(cuota),
    costs: toEuros(costs),
    incomeTax: toEuros(incomeTax),
    incomeTaxKind: withholding > 0 ? "withheld" : "advance",
    takeHome: toEuros(takeHome),
    takeHomeMonthly: toEuros(perMonth(takeHome)),
  };
}

/** A year of `sales` sales, every line; null when an input is missing or out of range. */
export function computeEarnings(input: EarningsInput, sales: number): EarningsBreakdown | null {
  if (!Number.isInteger(sales) || sales < 0 || sales > MAX_SALES) return null;
  const unit = unitOf(input);
  return unit ? yearOf(unit, sales, input) : null;
}

/**
 * The fewest sales a year that take home at least `monthly` euros a month,
 * with that year's lines; null when the inputs are incomplete or no number up
 * to MAX_SALES gets there (a sale that leaves you nothing, say).
 */
export function salesNeeded(input: EarningsInput, monthly: number): EarningsBreakdown | null {
  const target = toCents(monthly);
  const unit = unitOf(input);
  if (target == null || !unit) return null;
  for (let sales = 0; sales <= MAX_SALES; sales++) {
    const year = yearOf(unit, sales, input);
    if (!year) return null;
    if (cents(year.takeHomeMonthly) >= target) return year;
  }
  return null;
}

/** A whole number of sales as typed: "12" → 12; "", text, decimals or more than MAX_SALES → null. */
export function parseSales(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value <= MAX_SALES ? value : null;
}
