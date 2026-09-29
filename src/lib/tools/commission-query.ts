/**
 * The commission calculator's form as typed, and how it travels in a link.
 * The fields hold the text people type; commissionInput reads it into the
 * arithmetic's input (null until everything it needs is there). The query
 * string carries plain numbers, so a link reads the same in either language:
 *
 *   p    price in euros            ft   fee basis: "pct" or "eur"
 *   f    fee (a % or euros)        inc  "1" when the fee includes the tax
 *   tax  "igic" or a custom % (IVA when absent)
 *   o    the other agency's %      a    your share of our side, in %
 *   w    IRPF withheld: "7" or "15" (none when absent)
 *
 * Nothing in it identifies anyone. Bad values are ignored on the way in.
 */
import { parseMoney } from "@/lib/import/money";
import { parsePercent, type CommissionInput } from "@/lib/tools/commission";

export type FeeType = "pct" | "eur";
export type TaxChoice = "iva" | "igic" | "other";

/** In the order the chips show them: none, the general rate, the new-professional rate. */
export const WITHHOLDING_CHOICES = ["0", "15", "7"] as const;
export type WithholdingChoice = (typeof WITHHOLDING_CHOICES)[number];

/** The tax rates the calculator offers by name. Check them every January (plan 018). */
export const TAX_RATES = { iva: 0.21, igic: 0.07 } as const;

export const WITHHOLDING_RATES: Record<WithholdingChoice, CommissionInput["withholding"]> = {
  "0": 0,
  "15": 0.15,
  "7": 0.07,
};

export type CommissionFields = {
  price: string;
  feeType: FeeType;
  fee: string;
  includesTax: boolean;
  tax: TaxChoice;
  customTax: string;
  shared: boolean;
  otherShare: string;
  agentSplit: boolean;
  agentShare: string;
  withholding: WithholdingChoice;
};

/** The form as a first visit shows it: no fee, no split, no share. */
export const EMPTY_FIELDS: CommissionFields = {
  price: "",
  feeType: "pct",
  fee: "",
  includesTax: false,
  tax: "iva",
  customTax: "",
  shared: false,
  otherShare: "",
  agentSplit: false,
  agentShare: "",
  withholding: "0",
};

const moneyOrNull = (raw: string) => (raw.trim() ? parseMoney(raw) : null);

function feeValue(fields: CommissionFields): number | null {
  return fields.feeType === "pct" ? parsePercent(fields.fee) : moneyOrNull(fields.fee);
}

function taxRate(fields: CommissionFields): number | null {
  if (fields.tax !== "other") return TAX_RATES[fields.tax];
  const percent = parsePercent(fields.customTax);
  return percent == null ? null : percent / 100;
}

/** The arithmetic's input, or null while something it needs is missing or unreadable. */
export function commissionInput(fields: CommissionFields): CommissionInput | null {
  const price = moneyOrNull(fields.price);
  if (fields.price.trim() && price == null) return null;
  const fee = feeValue(fields);
  const tax = taxRate(fields);
  const other = fields.shared ? parsePercent(fields.otherShare) : null;
  const agent = fields.agentSplit ? parsePercent(fields.agentShare) : null;
  if (fee == null || tax == null) return null;
  if ((fields.shared && other == null) || (fields.agentSplit && agent == null)) return null;
  return {
    price,
    fee: fields.feeType === "pct" ? { kind: "percent", percent: fee } : { kind: "amount", amount: fee },
    feeIncludesTax: fields.includesTax,
    taxRate: tax,
    otherAgencyPercent: other,
    agentPercent: agent,
    withholding: WITHHOLDING_RATES[fields.withholding],
  };
}

/** The query string for a link that restores these fields; "" for an empty form. */
export function queryFromFields(fields: CommissionFields): string {
  const query = new URLSearchParams();
  const price = moneyOrNull(fields.price);
  if (price != null) query.set("p", String(price));
  const fee = feeValue(fields);
  if (fee != null) {
    query.set("ft", fields.feeType);
    query.set("f", String(fee));
  }
  if (fields.includesTax) query.set("inc", "1");
  if (fields.tax === "igic") query.set("tax", "igic");
  if (fields.tax === "other") {
    const custom = parsePercent(fields.customTax);
    if (custom != null) query.set("tax", String(custom));
  }
  const other = fields.shared ? parsePercent(fields.otherShare) : null;
  if (other != null) query.set("o", String(other));
  const agent = fields.agentSplit ? parsePercent(fields.agentShare) : null;
  if (agent != null) query.set("a", String(agent));
  if (fields.withholding !== "0") query.set("w", fields.withholding);
  return query.toString();
}

/**
 * The fields a link carries, written back as text in the page's language by
 * `format` ("437.500" in Spanish, "437,500" in English). Anything unreadable
 * is left at its empty value.
 */
export function fieldsFromQuery(
  search: string,
  format: (value: number, kind: "money" | "percent") => string
): CommissionFields {
  const query = new URLSearchParams(search);
  const fields: CommissionFields = { ...EMPTY_FIELDS };
  const read = (key: string) => query.get(key)?.trim() ?? "";

  const price = read("p") ? parseMoney(read("p")) : null;
  if (price != null && price > 0) fields.price = format(price, "money");

  const feeType: FeeType = read("ft") === "eur" ? "eur" : "pct";
  const fee = feeType === "pct" ? parsePercent(read("f")) : read("f") ? parseMoney(read("f")) : null;
  fields.feeType = feeType;
  if (fee != null) fields.fee = format(fee, feeType === "pct" ? "percent" : "money");

  fields.includesTax = read("inc") === "1";

  const tax = read("tax");
  const custom = parsePercent(tax);
  if (tax === "igic") fields.tax = "igic";
  else if (tax !== "iva" && custom != null) {
    fields.tax = "other";
    fields.customTax = format(custom, "percent");
  }

  const other = parsePercent(read("o"));
  if (other != null) {
    fields.shared = true;
    fields.otherShare = format(other, "percent");
  }
  const agent = parsePercent(read("a"));
  if (agent != null) {
    fields.agentSplit = true;
    fields.agentShare = format(agent, "percent");
  }

  const withholding = read("w");
  if ((WITHHOLDING_CHOICES as readonly string[]).includes(withholding)) {
    fields.withholding = withholding as WithholdingChoice;
  }
  return fields;
}
