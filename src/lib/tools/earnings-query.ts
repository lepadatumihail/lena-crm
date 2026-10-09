/**
 * The earnings calculator's form as typed, and how it travels in a link. The
 * fields hold the text people type; earningsInput reads it into the
 * arithmetic's input (null until everything it needs is there). The query
 * string carries plain numbers, so a link reads the same in either language:
 *
 *   m    "need" for the sales a take-home needs (what you earn when absent)
 *   n    sales a year                t    take-home a month, in euros
 *   p    average sale price in euros
 *   ft   fee basis: "pct" or "eur"   f    fee: a % or euros, before IVA
 *   s    % of sales shared           o    the other agency's % of a shared fee
 *   a    your share of your agency's side, in %
 *   c    your cuota a month in euros (estimated from the table when absent)
 *   k    other costs a month in euros
 *   w    IRPF withheld: "7" or "15" (quarterly advances when absent)
 *
 * Nothing in it identifies anyone. Bad values are ignored on the way in.
 */
import { parseMoney } from "@/lib/import/money";
import { parsePercent } from "@/lib/tools/commission";
import {
  WITHHOLDING_CHOICES,
  WITHHOLDING_RATES,
  type WithholdingChoice,
} from "@/lib/tools/commission-query";
import { parseSales, type EarningsInput } from "@/lib/tools/earnings";

/** What the visitor wants to know: what a year of sales leaves, or how many sales a take-home needs. */
export type Mode = "earn" | "need";

/** How the fee on a sale is set: a % of the price or a fixed amount. */
export type EarningsFeeType = "pct" | "eur";
export const EARNINGS_FEE_TYPES: readonly EarningsFeeType[] = ["pct", "eur"];

export type CuotaMode = "estimate" | "own";

export type EarningsFields = {
  mode: Mode;
  sales: string;
  target: string;
  price: string;
  feeType: EarningsFeeType;
  fee: string;
  shared: boolean;
  sharedSales: string;
  otherShare: string;
  agentSplit: boolean;
  agentShare: string;
  cuotaMode: CuotaMode;
  cuota: string;
  costs: string;
  withholding: WithholdingChoice;
};

/** The form as a first visit shows it: no sales, no fee, no split, no share. */
export const EMPTY_EARNINGS_FIELDS: EarningsFields = {
  mode: "earn",
  sales: "",
  target: "",
  price: "",
  feeType: "pct",
  fee: "",
  shared: false,
  sharedSales: "",
  otherShare: "",
  agentSplit: false,
  agentShare: "",
  cuotaMode: "estimate",
  cuota: "",
  costs: "",
  withholding: "0",
};

const moneyOrNull = (raw: string) => (raw.trim() ? parseMoney(raw) : null);

function feeValue(fields: EarningsFields): number | null {
  return fields.feeType === "eur" ? moneyOrNull(fields.fee) : parsePercent(fields.fee);
}

/** The arithmetic's input, or null while something it needs is missing or unreadable. */
export function earningsInput(fields: EarningsFields): EarningsInput | null {
  const price = moneyOrNull(fields.price);
  if (fields.price.trim() && price == null) return null;
  const fee = feeValue(fields);
  if (fee == null) return null;

  let shared: EarningsInput["shared"] = null;
  if (fields.shared) {
    const salesPercent = parsePercent(fields.sharedSales);
    const otherAgencyPercent = parsePercent(fields.otherShare);
    if (salesPercent == null || otherAgencyPercent == null) return null;
    shared = { salesPercent, otherAgencyPercent };
  }
  const agent = fields.agentSplit ? parsePercent(fields.agentShare) : null;
  if (fields.agentSplit && agent == null) return null;

  const cuota = fields.cuotaMode === "own" ? moneyOrNull(fields.cuota) : null;
  if (fields.cuotaMode === "own" && cuota == null) return null;
  // Costs are optional: an empty field is none.
  const costs = fields.costs.trim() ? parseMoney(fields.costs) : 0;
  if (costs == null) return null;

  return {
    price,
    fee: fields.feeType === "eur" ? { kind: "amount", amount: fee } : { kind: "percent", percent: fee },
    shared,
    agentPercent: agent,
    cuota,
    costs,
    withholding: WITHHOLDING_RATES[fields.withholding],
  };
}

/** The number of sales the "what you earn" mode asks about; null until it reads. */
export function salesOf(fields: EarningsFields): number | null {
  return parseSales(fields.sales);
}

/** The take-home a month the "sales I need" mode asks about; null until it reads. */
export function targetOf(fields: EarningsFields): number | null {
  return moneyOrNull(fields.target);
}

/** The query string for a link that restores these fields; "" for an empty form. */
export function queryFromEarningsFields(fields: EarningsFields): string {
  const query = new URLSearchParams();
  if (fields.mode === "need") query.set("m", "need");
  const sales = parseSales(fields.sales);
  if (sales != null) query.set("n", String(sales));
  const target = moneyOrNull(fields.target);
  if (target != null) query.set("t", String(target));
  const price = moneyOrNull(fields.price);
  if (price != null) query.set("p", String(price));
  const fee = feeValue(fields);
  if (fee != null) {
    query.set("ft", fields.feeType);
    query.set("f", String(fee));
  }
  if (fields.shared) {
    const sharedSales = parsePercent(fields.sharedSales);
    const other = parsePercent(fields.otherShare);
    if (sharedSales != null) query.set("s", String(sharedSales));
    if (other != null) query.set("o", String(other));
  }
  const agent = fields.agentSplit ? parsePercent(fields.agentShare) : null;
  if (agent != null) query.set("a", String(agent));
  const cuota = fields.cuotaMode === "own" ? moneyOrNull(fields.cuota) : null;
  if (cuota != null) query.set("c", String(cuota));
  const costs = moneyOrNull(fields.costs);
  if (costs != null && costs > 0) query.set("k", String(costs));
  if (fields.withholding !== "0") query.set("w", fields.withholding);
  return query.toString();
}

/**
 * The fields a link carries, written back as text in the page's language by
 * `format` ("437.500" in Spanish, "437,500" in English; "number" is a plain
 * decimal such as a %). Anything unreadable is left at its empty value.
 */
export function earningsFieldsFromQuery(
  search: string,
  format: (value: number, kind: "money" | "number") => string
): EarningsFields {
  const query = new URLSearchParams(search);
  const fields: EarningsFields = { ...EMPTY_EARNINGS_FIELDS };
  const read = (key: string) => query.get(key)?.trim() ?? "";
  const money = (key: string) => (read(key) ? parseMoney(read(key)) : null);

  fields.mode = read("m") === "need" ? "need" : "earn";

  const sales = parseSales(read("n"));
  if (sales != null) fields.sales = String(sales);
  const target = money("t");
  if (target != null) fields.target = format(target, "money");

  const price = money("p");
  if (price != null && price > 0) fields.price = format(price, "money");

  fields.feeType = EARNINGS_FEE_TYPES.find((basis) => basis === read("ft")) ?? "pct";
  const fee = feeValue({ ...fields, fee: read("f") });
  if (fee != null) fields.fee = format(fee, fields.feeType === "eur" ? "money" : "number");

  const sharedSales = parsePercent(read("s"));
  const other = parsePercent(read("o"));
  if (sharedSales != null || other != null) {
    fields.shared = true;
    if (sharedSales != null) fields.sharedSales = format(sharedSales, "number");
    if (other != null) fields.otherShare = format(other, "number");
  }
  const agent = parsePercent(read("a"));
  if (agent != null) {
    fields.agentSplit = true;
    fields.agentShare = format(agent, "number");
  }

  const cuota = money("c");
  if (cuota != null) {
    fields.cuotaMode = "own";
    fields.cuota = format(cuota, "money");
  }
  const costs = money("k");
  if (costs != null && costs > 0) fields.costs = format(costs, "money");

  const withholding = read("w");
  if ((WITHHOLDING_CHOICES as readonly string[]).includes(withholding)) {
    fields.withholding = withholding as WithholdingChoice;
  }
  return fields;
}
