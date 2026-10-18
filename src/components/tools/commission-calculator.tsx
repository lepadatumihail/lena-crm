"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, Link2 } from "lucide-react";

import { asLocale, intlTag } from "@/i18n/config";
import { parseMoney } from "@/lib/import/money";
import { marketingPath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";
import { trackSiteEvent } from "@/lib/site-events";
import { calculatorHref } from "@/lib/tools/calculator-url";
import { computeCommission, parsePercent, type CommissionBreakdown } from "@/lib/tools/commission";
import {
  EMPTY_FIELDS,
  FEE_TYPES,
  TAX_RATES,
  WITHHOLDING_CHOICES,
  WITHHOLDING_RATES,
  commissionInput,
  fieldsFromQuery,
  queryFromFields,
  type CommissionFields,
  type Deal,
  type FeeType,
  type TaxChoice,
  type WithholdingChoice,
} from "@/lib/tools/commission-query";
import { cn } from "@/lib/utils";
import {
  Block,
  CHIPS,
  Field,
  INPUT,
  Row,
  SwitchRow,
  formatters,
} from "@/components/tools/tool-parts";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const URL_DELAY_MS = 400;

const noSubscribe = () => () => {};
const readSearch = () => window.location.search;
const noSearch = () => null;

let used = false;

/**
 * The commission calculator on /tools/commission-calculator: a fee on a sale
 * or a rental, its tax, the split with another agency, the agent's share and
 * their own invoice.
 * Every input starts empty (no rate is ever suggested) and the inputs live in
 * the URL, so a calculation can be sent as a link.
 */
export function CommissionCalculator() {
  const t = useTranslations("tools.commission");
  const locale = asLocale(useLocale());
  const format = useMemo(() => formatters(intlTag(locale)), [locale]);
  const [fields, setFields] = useState<CommissionFields>(EMPTY_FIELDS);
  const [copied, setCopied] = useState<"split" | "link" | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  // The server has no query string, so the page hydrates with an empty form
  // (search is null until then); the first client render fills in whatever a
  // link carried, once. Later URL changes are this form's own writes.
  const search = useSyncExternalStore(noSubscribe, readSearch, noSearch);
  const hydrated = search !== null;
  const [restored, setRestored] = useState(false);
  if (hydrated && !restored) {
    setRestored(true);
    if (search) setFields(fieldsFromQuery(search, format.text));
  }

  const input = commissionInput(fields);
  const result = input ? computeCommission(input) : null;
  const query = queryFromFields(fields);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const next = calculatorHref(window.location, query);
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next !== current) window.history.replaceState(null, "", next);
    }, URL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, query]);

  const complete = result !== null;
  useEffect(() => {
    if (!hydrated || !complete || used) return;
    used = true;
    trackSiteEvent("tool_use");
  }, [hydrated, complete]);

  function set<K extends keyof CommissionFields>(key: K, value: CommissionFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  /** On blur, an amount is rewritten the way the page's language writes it. */
  function tidyMoney(key: "price" | "fee") {
    setFields((current) => {
      const value = current[key].trim() ? parseMoney(current[key]) : null;
      return value == null ? current : { ...current, [key]: format.text(value, "money") };
    });
  }

  const taxRate =
    fields.tax === "other"
      ? (() => {
          const percent = parsePercent(fields.customTax);
          return percent == null ? null : percent / 100;
        })()
      : TAX_RATES[fields.tax];
  const taxLabel = t("taxLabel", {
    tax: fields.tax,
    rate: taxRate == null ? "" : format.percent(taxRate),
  }).trim();
  const withholding = WITHHOLDING_RATES[fields.withholding];
  // The share of the price only says something new on a sale, for a fixed
  // fee or a percentage that included the tax.
  const showShare = fields.deal === "sale" && (fields.feeType === "eur" || fields.includesTax);

  /** Rent and sale price mean different things: a new deal starts from scratch. */
  function changeDeal(deal: Deal) {
    setFields((current) =>
      current.deal === deal
        ? current
        : { ...current, deal, price: "", feeType: FEE_TYPES[deal][0], fee: "" }
    );
  }

  async function copy(kind: "split" | "link") {
    const text = kind === "split" ? splitText() : linkText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // No clipboard (permission, or not a secure context): nothing to do.
      return;
    }
    trackSiteEvent("tool_share");
    toast.success(t(kind === "split" ? "actions.copiedSplit" : "actions.copiedLink"));
    setCopied(kind);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(null), 1500);
  }

  /** For the other agency: the fee and each agency's side, never your own share. */
  function splitText(): string | null {
    if (!input || !result || result.otherAgencyNet == null) return null;
    const lines = [
      input.price != null && input.price > 0
        ? t(fields.deal === "rent" ? "copy.rent" : "copy.price", {
            price: format.money.format(input.price),
          })
        : null,
      t("copy.fee", {
        net: format.money.format(result.feeNet),
        tax: taxLabel,
        gross: format.money.format(result.feeGross),
      }),
      t("copy.split", {
        other: format.money.format(result.otherAgencyNet),
        ours: format.money.format(result.ourSideNet),
        taxName: t("taxName", { tax: fields.tax }),
      }),
      t("copy.link", { url: absoluteUrl(marketingPath("toolCommission", locale)) }),
    ];
    return lines.filter(Boolean).join("\n");
  }

  function linkText(): string {
    return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
  }

  const deals: { value: Deal; label: string }[] = [
    { value: "sale", label: t("form.dealSale") },
    { value: "rent", label: t("form.dealRent") },
  ];
  const basisLabels: Record<FeeType, string> = {
    pct: t("form.feeBasisPercent"),
    eur: t("form.feeBasisAmount"),
    mo: t("form.feeBasisMonths"),
    yr: t("form.feeBasisAnnual"),
  };
  const feeTypes = FEE_TYPES[fields.deal].map((value) => ({ value, label: basisLabels[value] }));
  const feeUnit = { pct: "%", yr: "%", eur: "€", mo: t("form.months") }[fields.feeType];
  const taxes: { value: TaxChoice; label: string }[] = [
    { value: "iva", label: t("taxLabel", { tax: "iva", rate: format.percent(TAX_RATES.iva) }) },
    { value: "igic", label: t("form.igic", { rate: format.percent(TAX_RATES.igic) }) },
    { value: "other", label: t("form.taxOther") },
  ];
  const withholdings = WITHHOLDING_CHOICES.map((choice) => ({
    value: choice,
    label:
      choice === "0"
        ? t("form.irpfNone")
        : choice === "7"
          ? t("form.irpfNew", { rate: format.percent(WITHHOLDING_RATES[choice]) })
          : format.percent(WITHHOLDING_RATES[choice]),
  }));

  return (
    <div className="bg-card overflow-hidden rounded-2xl border shadow-xs md:grid md:grid-cols-2">
      <div className="space-y-6 p-5 sm:p-6">
        <div className="space-y-2.5">
          <p className="text-sm leading-none">{t("form.deal")}</p>
          <ChoiceChips
            label={t("form.deal")}
            items={deals}
            value={fields.deal}
            onChange={changeDeal}
            className={CHIPS}
          />
        </div>

        <Field
          id={`${id}-price`}
          label={t(fields.deal === "rent" ? "form.rent" : "form.price")}
          aside={fields.feeType === "eur" ? t("form.optional") : null}
        >
          <Input
            id={`${id}-price`}
            inputMode="decimal"
            autoComplete="off"
            value={fields.price}
            onChange={(e) => set("price", e.target.value)}
            onBlur={() => tidyMoney("price")}
            className={INPUT}
          />
        </Field>

        <div className="space-y-2.5">
          <Label htmlFor={`${id}-fee`}>{t("form.fee", { unit: feeUnit })}</Label>
          <ChoiceChips
            label={t("form.feeBasis")}
            items={feeTypes}
            value={fields.feeType}
            // The number means something else in the other basis: start again.
            onChange={(feeType) => setFields((current) => ({ ...current, feeType, fee: "" }))}
            className={CHIPS}
          />
          <Input
            id={`${id}-fee`}
            inputMode="decimal"
            autoComplete="off"
            value={fields.fee}
            onChange={(e) => set("fee", e.target.value)}
            onBlur={fields.feeType === "eur" ? () => tidyMoney("fee") : undefined}
            className={INPUT}
          />
          <SwitchRow
            id={`${id}-includes-tax`}
            label={t("form.includesTax", { tax: fields.tax })}
            checked={fields.includesTax}
            onCheckedChange={(checked) => set("includesTax", checked)}
          />
        </div>

        <div className="space-y-2.5">
          <p className="text-sm leading-none">{t("form.tax")}</p>
          <ChoiceChips
            label={t("form.tax")}
            items={taxes}
            value={fields.tax}
            onChange={(tax) => set("tax", tax)}
            className={CHIPS}
          />
          {fields.tax === "other" ? (
            <Field id={`${id}-custom-tax`} label={t("form.customTax")}>
              <Input
                id={`${id}-custom-tax`}
                inputMode="decimal"
                autoComplete="off"
                value={fields.customTax}
                onChange={(e) => set("customTax", e.target.value)}
                className={INPUT}
              />
            </Field>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <SwitchRow
            id={`${id}-shared`}
            label={t("form.shared")}
            checked={fields.shared}
            onCheckedChange={(checked) => set("shared", checked)}
          />
          {fields.shared ? (
            <Field id={`${id}-other`} label={t("form.otherShare")}>
              <Input
                id={`${id}-other`}
                inputMode="decimal"
                autoComplete="off"
                value={fields.otherShare}
                onChange={(e) => set("otherShare", e.target.value)}
                className={INPUT}
              />
            </Field>
          ) : null}
          <SwitchRow
            id={`${id}-agent`}
            label={t("form.agentSplit")}
            checked={fields.agentSplit}
            onCheckedChange={(checked) => set("agentSplit", checked)}
          />
          {fields.agentSplit ? (
            <Field id={`${id}-agent-share`} label={t("form.agentShare")}>
              <Input
                id={`${id}-agent-share`}
                inputMode="decimal"
                autoComplete="off"
                value={fields.agentShare}
                onChange={(e) => set("agentShare", e.target.value)}
                className={INPUT}
              />
            </Field>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <p className="text-sm leading-none">{t("form.irpf")}</p>
          <ChoiceChips<WithholdingChoice>
            label={t("form.irpf")}
            items={withholdings}
            value={fields.withholding}
            onChange={(choice) => set("withholding", choice)}
            className={CHIPS}
          />
          <p className="text-muted-foreground text-xs leading-relaxed">{t("form.irpfHelp")}</p>
        </div>
      </div>

      <div
        aria-live="polite"
        className="bg-muted/40 space-y-6 border-t p-5 sm:p-6 md:border-t-0 md:border-l"
      >
        {result ? null : <p className="text-muted-foreground text-sm">{t("results.hint")}</p>}

        <Block title={t("results.client")}>
          <Row label={t("results.fee")} value={result?.feeNet} format={format} />
          <Row label={t("results.plusTax", { tax: taxLabel })} value={result?.feeTax} format={format} />
          <Row label={t("results.total")} value={result?.feeGross} format={format} total />
          {showShare && result?.feeShareOfPrice != null ? (
            <p className="text-muted-foreground pt-1 text-xs">
              {t("results.shareOfPrice", { share: format.percent(result.feeShareOfPrice) })}
            </p>
          ) : null}
        </Block>

        {result ? (
          <SplitBar
            result={result}
            labels={{
              tax: t("results.legend.tax"),
              otherAgency: t("results.legend.otherAgency"),
              yourAgency: t("results.legend.yourAgency"),
              you: t("results.legend.you"),
            }}
          />
        ) : null}

        {fields.shared || fields.agentSplit ? (
          <Block title={t("results.split")}>
            {fields.shared ? (
              <>
                <Row label={t("results.otherAgency")} value={result?.otherAgencyNet} format={format} />
                <Row label={t("results.ourSide")} value={result?.ourSideNet} format={format} />
              </>
            ) : null}
            {fields.agentSplit ? (
              <>
                {/* Under "Our agency" when the fee is shared: they divide our side. */}
                <Row
                  label={t("results.agencyKeeps")}
                  value={result?.agencyKeepsNet}
                  format={format}
                  indent={fields.shared}
                />
                <Row label={t("results.you")} value={result?.yourNet} format={format} indent={fields.shared} />
              </>
            ) : null}
          </Block>
        ) : null}

        <Block title={t("results.invoice")}>
          <Row label={t("results.base")} value={result?.yourNet} format={format} />
          <Row label={t("results.plusTax", { tax: taxLabel })} value={result?.yourTax} format={format} />
          {withholding > 0 ? (
            <Row
              label={t("results.minusIrpf", { rate: format.percent(withholding) })}
              value={result?.yourWithholding}
              format={format}
            />
          ) : null}
          <Row label={t("results.receive")} value={result?.yourInvoiceTotal} format={format} total />
          {withholding > 0 ? (
            <p className="text-muted-foreground pt-1 text-xs leading-relaxed">{t("results.irpfNote")}</p>
          ) : null}
        </Block>

        <div className="flex flex-wrap gap-2">
          {fields.shared ? (
            <Button
              type="button"
              variant="outline"
              className={INPUT}
              disabled={!result}
              onClick={() => copy("split")}
            >
              {copied === "split" ? <Check aria-hidden /> : <Copy aria-hidden />}
              {t("actions.copySplit")}
            </Button>
          ) : null}
          <Button type="button" variant="outline" className={INPUT} onClick={() => copy("link")}>
            {copied === "link" ? <Check aria-hidden /> : <Link2 aria-hidden />}
            {t("actions.copyLink")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Where the client's money goes, as one thin bar: the tax, the other
 * agency, your agency and you, in ink at falling strengths. Decoration only;
 * the rows above say the same in words.
 */
function SplitBar({
  result,
  labels,
}: {
  result: CommissionBreakdown;
  labels: Record<"tax" | "otherAgency" | "yourAgency" | "you", string>;
}) {
  if (result.feeGross <= 0) return null;
  const parts = [
    { key: "tax", value: result.feeTax, tone: "bg-foreground/15" },
    { key: "otherAgency", value: result.otherAgencyNet ?? 0, tone: "bg-foreground/30" },
    { key: "yourAgency", value: result.agencyKeepsNet ?? 0, tone: "bg-foreground/55" },
    { key: "you", value: result.yourNet, tone: "bg-foreground" },
  ] as const;
  const shown = parts.filter((part) => part.value > 0);
  return (
    <div aria-hidden>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {shown.map((part) => (
          <span
            key={part.key}
            className={part.tone}
            style={{ width: `${(part.value / result.feeGross) * 100}%` }}
          />
        ))}
      </div>
      <ul className="text-muted-foreground mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {shown.map((part) => (
          <li key={part.key} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", part.tone)} />
            {labels[part.key]}
          </li>
        ))}
      </ul>
    </div>
  );
}
