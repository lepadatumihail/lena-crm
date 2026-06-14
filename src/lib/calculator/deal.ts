import type { DealAnalysis } from "@/lib/supabase/types";
import type { DealFormValues } from "@/lib/validation/deal";
import { toNumber } from "@/lib/validation/deal";

/**
 * Underwriting model for a buy-renovate-sell deal. Pure + deterministic — the
 * single source of truth shared by the on-screen summary and the PDF document.
 *
 *   acquisition cost = asking price + transfer tax + lawyer + notary
 *   project cost     = (€/m² × m²) + contingency
 *   capital deployed = acquisition cost + project cost
 *   net proceeds     = expected sale price − agency fee
 *   net profit       = net proceeds − capital deployed
 *   ROI              = net profit / capital deployed
 *   IRR (annualised) = (1 + ROI) ^ (12 / holding months) − 1   ["all-upfront" model]
 */

export type DealInput = {
  askingPrice: number;
  transferTaxPct: number;
  lawyerPct: number;
  notaryPct: number;
  renovationPerSqm: number;
  surfaceSqm: number;
  contingencyPct: number;
  durationMonths: number;
  expectedSalePrice: number;
  agencyFeePct: number;
};

export type ExitRow = {
  months: number;
  netProfit: number;
  roi: number;
  irr: number;
};

export type DealResult = {
  // acquisition
  transferTax: number;
  lawyerFee: number;
  notaryFee: number;
  totalAcquisition: number;
  // project
  baseBuildCost: number;
  contingency: number;
  totalProjectCost: number;
  // headline
  capitalDeployed: number;
  // exit
  grossSalePrice: number;
  agentCommission: number;
  netProceeds: number;
  netProfit: number;
  roi: number;
  irr: number;
  exitTimeline: ExitRow[];
};

/** Exit horizons shown in the returns table, in months. */
export const EXIT_MONTHS = [6, 12, 18, 24, 36] as const;

const pct = (value: number, percent: number) => value * (percent / 100);

/** Annualised return of a single all-upfront cash flow held for `months`. */
export function irrForMonths(roi: number, months: number): number {
  if (months <= 0) return 0;
  return Math.pow(1 + roi, 12 / months) - 1;
}

/**
 * Holding period in whole months. Blank defaults to 12; anything entered is
 * clamped to a sane >= 1 integer. Shared by preview and persistence so the two
 * never diverge.
 */
export function normalizeMonths(raw: string | number | null | undefined): number {
  const t = typeof raw === "number" ? String(raw) : (raw ?? "").trim();
  if (t === "") return 12;
  const n = Math.round(Number(t));
  if (!Number.isFinite(n)) return 12;
  return n >= 1 ? n : 1;
}

export function computeDeal(input: DealInput): DealResult {
  const transferTax = pct(input.askingPrice, input.transferTaxPct);
  const lawyerFee = pct(input.askingPrice, input.lawyerPct);
  const notaryFee = pct(input.askingPrice, input.notaryPct);
  const totalAcquisition =
    input.askingPrice + transferTax + lawyerFee + notaryFee;

  const baseBuildCost = input.renovationPerSqm * input.surfaceSqm;
  const contingency = pct(baseBuildCost, input.contingencyPct);
  const totalProjectCost = baseBuildCost + contingency;

  const capitalDeployed = totalAcquisition + totalProjectCost;

  const grossSalePrice = input.expectedSalePrice;
  const agentCommission = pct(grossSalePrice, input.agencyFeePct);
  const netProceeds = grossSalePrice - agentCommission;
  const netProfit = netProceeds - capitalDeployed;

  // ROI is undefined with no capital at risk — keep it NaN so the formatters
  // render "—" rather than a misleading 0%.
  const roi = capitalDeployed > 0 ? netProfit / capitalDeployed : NaN;
  const irr = irrForMonths(roi, input.durationMonths);

  const exitTimeline: ExitRow[] = EXIT_MONTHS.map((months) => ({
    months,
    netProfit,
    roi,
    irr: irrForMonths(roi, months),
  }));

  return {
    transferTax,
    lawyerFee,
    notaryFee,
    totalAcquisition,
    baseBuildCost,
    contingency,
    totalProjectCost,
    capitalDeployed,
    grossSalePrice,
    agentCommission,
    netProceeds,
    netProfit,
    roi,
    irr,
    exitTimeline,
  };
}

/** Map raw form strings to a typed numeric input for the calculator. */
export function inputFromForm(values: DealFormValues): DealInput {
  return {
    askingPrice: toNumber(values.asking_price),
    transferTaxPct: toNumber(values.transfer_tax_pct),
    lawyerPct: toNumber(values.lawyer_pct),
    notaryPct: toNumber(values.notary_pct),
    renovationPerSqm: toNumber(values.renovation_price_per_sqm),
    surfaceSqm: toNumber(values.surface_sqm),
    contingencyPct: toNumber(values.contingency_pct),
    durationMonths: normalizeMonths(values.duration_months),
    expectedSalePrice: toNumber(values.expected_sale_price),
    agencyFeePct: toNumber(values.agency_fee_pct),
  };
}

/** Map a saved row to a typed numeric input for the calculator. */
export function inputFromRow(row: DealAnalysis): DealInput {
  return {
    askingPrice: Number(row.asking_price),
    transferTaxPct: Number(row.transfer_tax_pct),
    lawyerPct: Number(row.lawyer_pct),
    notaryPct: Number(row.notary_pct),
    renovationPerSqm: Number(row.renovation_price_per_sqm),
    surfaceSqm: Number(row.surface_sqm),
    contingencyPct: Number(row.contingency_pct),
    durationMonths: normalizeMonths(row.duration_months),
    expectedSalePrice: Number(row.expected_sale_price),
    agencyFeePct: Number(row.agency_fee_pct),
  };
}

// ---------- formatting (European style, matching the reference PDF) ----------

const euro = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

/** "1.018.960 €" — whole euros, dot-grouped, trailing symbol. */
export function formatEuro(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${euro.format(Math.round(value))} €`;
}

/** "+22.9%" / "−5.0%" — signed, one decimal. */
export function formatSignedPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return "—";
  const value = fraction * 100;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

/** "7%" / "0.5%" — a rate label, trimmed of trailing zeros. */
export function formatRate(percent: number): string {
  if (!Number.isFinite(percent)) return "—";
  return `${parseFloat(percent.toFixed(2))}%`;
}

/** "128 m²" — whole-number surface with unit. */
export function formatSqm(value: number): string {
  return `${euro.format(Math.round(value))} m²`;
}

/** "€2.000" — leading symbol, used inline (e.g. "Renovation — €2.000/m²"). */
export function formatEuroPrefix(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `€${euro.format(Math.round(value))}`;
}
