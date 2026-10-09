"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Link2 } from "lucide-react";

import { asLocale, intlTag } from "@/i18n/config";
import { parseMoney } from "@/lib/import/money";
import { trackSiteEvent } from "@/lib/site-events";
import {
  WITHHOLDING_CHOICES,
  WITHHOLDING_RATES,
  type WithholdingChoice,
} from "@/lib/tools/commission-query";
import {
  COTIZACION_YEAR,
  computeEarnings,
  salesNeeded,
  type EarningsBreakdown,
} from "@/lib/tools/earnings";
import {
  EARNINGS_FEE_TYPES,
  EMPTY_EARNINGS_FIELDS,
  earningsFieldsFromQuery,
  earningsInput,
  queryFromEarningsFields,
  salesOf,
  targetOf,
  type CuotaMode,
  type EarningsFeeType,
  type EarningsFields,
  type Mode,
} from "@/lib/tools/earnings-query";
import { cn } from "@/lib/utils";
import {
  Block,
  CHIPS,
  Field,
  INPUT,
  Money,
  Row,
  SwitchRow,
  formatters,
  type Formatters,
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

type MoneyField = "price" | "fee" | "target" | "cuota" | "costs";

/**
 * The agent earnings calculator on /tools/agent-earnings-calculator: a year of
 * sales, their splits, the cuota de autónomos, costs and IRPF, down to the
 * take-home a month; or how many sales a take-home needs. Every input starts
 * empty (no fee or split is ever suggested) and the inputs live in the URL,
 * so a calculation can be sent as a link.
 */
export function EarningsCalculator() {
  const t = useTranslations("tools.earnings");
  const locale = asLocale(useLocale());
  const tag = intlTag(locale);
  const format = useMemo(() => formatters(tag), [tag]);
  const oneDecimal = useMemo(() => new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }), [tag]);
  const [fields, setFields] = useState<EarningsFields>(EMPTY_EARNINGS_FIELDS);
  const [copied, setCopied] = useState(false);
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
    if (search) setFields(earningsFieldsFromQuery(search, format.text));
  }

  const result = useMemo(() => {
    const input = earningsInput(fields);
    if (!input) return { year: null, unreachable: false };
    if (fields.mode === "earn") {
      const sales = salesOf(fields);
      return { year: sales == null ? null : computeEarnings(input, sales), unreachable: false };
    }
    const target = targetOf(fields);
    if (target == null) return { year: null, unreachable: false };
    const year = salesNeeded(input, target);
    return { year, unreachable: year == null };
  }, [fields]);
  const { year, unreachable } = result;
  const query = queryFromEarningsFields(fields);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next !== current) window.history.replaceState(null, "", next);
    }, URL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, query]);

  const complete = year !== null;
  useEffect(() => {
    if (!hydrated || !complete || used) return;
    used = true;
    trackSiteEvent("tool_use");
  }, [hydrated, complete]);

  function set<K extends keyof EarningsFields>(key: K, value: EarningsFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  /** On blur, an amount is rewritten the way the page's language writes it. */
  function tidyMoney(key: MoneyField) {
    setFields((current) => {
      const value = current[key].trim() ? parseMoney(current[key]) : null;
      return value == null ? current : { ...current, [key]: format.text(value, "money") };
    });
  }

  async function copyLink() {
    const link = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // No clipboard (permission, or not a secure context): nothing to do.
      return;
    }
    trackSiteEvent("tool_share");
    toast.success(t("actions.copiedLink"));
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  const modes: { value: Mode; label: string }[] = [
    { value: "earn", label: t("form.modeEarn") },
    { value: "need", label: t("form.modeNeed") },
  ];
  const basisLabels: Record<EarningsFeeType, string> = {
    pct: t("form.feeBasisPercent"),
    eur: t("form.feeBasisAmount"),
  };
  const feeTypes = EARNINGS_FEE_TYPES.map((value) => ({ value, label: basisLabels[value] }));
  const cuotaModes: { value: CuotaMode; label: string }[] = [
    { value: "estimate", label: t("form.cuotaEstimate", { year: COTIZACION_YEAR }) },
    { value: "own", label: t("form.cuotaOwn") },
  ];
  const withholding = WITHHOLDING_RATES[fields.withholding];
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
          <p className="text-sm leading-none">{t("form.mode")}</p>
          <ChoiceChips
            label={t("form.mode")}
            items={modes}
            value={fields.mode}
            onChange={(mode) => set("mode", mode)}
            className={CHIPS}
          />
        </div>

        {fields.mode === "earn" ? (
          <Field id={`${id}-sales`} label={t("form.sales")}>
            <Input
              id={`${id}-sales`}
              inputMode="numeric"
              autoComplete="off"
              value={fields.sales}
              onChange={(e) => set("sales", e.target.value)}
              className={INPUT}
            />
          </Field>
        ) : (
          <Field id={`${id}-target`} label={t("form.target")}>
            <Input
              id={`${id}-target`}
              inputMode="decimal"
              autoComplete="off"
              value={fields.target}
              onChange={(e) => set("target", e.target.value)}
              onBlur={() => tidyMoney("target")}
              className={INPUT}
            />
          </Field>
        )}

        <Field
          id={`${id}-price`}
          label={t("form.price")}
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
          <Label htmlFor={`${id}-fee`}>
            {t("form.fee", { unit: fields.feeType === "eur" ? "€" : "%" })}
          </Label>
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
        </div>

        <div className="space-y-2.5">
          <SwitchRow
            id={`${id}-shared`}
            label={t("form.shared")}
            checked={fields.shared}
            onCheckedChange={(checked) => set("shared", checked)}
          />
          {fields.shared ? (
            <>
              <Field id={`${id}-shared-sales`} label={t("form.sharedSales")}>
                <Input
                  id={`${id}-shared-sales`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={fields.sharedSales}
                  onChange={(e) => set("sharedSales", e.target.value)}
                  className={INPUT}
                />
              </Field>
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
            </>
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
          <p className="text-sm leading-none">{t("form.cuota")}</p>
          <ChoiceChips
            label={t("form.cuota")}
            items={cuotaModes}
            value={fields.cuotaMode}
            onChange={(cuotaMode) => set("cuotaMode", cuotaMode)}
            className={CHIPS}
          />
          {fields.cuotaMode === "own" ? (
            <Field id={`${id}-cuota`} label={t("form.cuotaAmount")}>
              <Input
                id={`${id}-cuota`}
                inputMode="decimal"
                autoComplete="off"
                value={fields.cuota}
                onChange={(e) => set("cuota", e.target.value)}
                onBlur={() => tidyMoney("cuota")}
                className={INPUT}
              />
            </Field>
          ) : null}
          <p className="text-muted-foreground text-xs leading-relaxed">{t("form.cuotaHelp")}</p>
        </div>

        <div className="space-y-2.5">
          <Field id={`${id}-costs`} label={t("form.costs")} aside={t("form.optional")}>
            <Input
              id={`${id}-costs`}
              inputMode="decimal"
              autoComplete="off"
              value={fields.costs}
              onChange={(e) => set("costs", e.target.value)}
              onBlur={() => tidyMoney("costs")}
              className={INPUT}
            />
          </Field>
          <p className="text-muted-foreground text-xs leading-relaxed">{t("form.costsHelp")}</p>
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
        <Headline
          mode={fields.mode}
          year={year}
          unreachable={unreachable}
          format={format}
          oneDecimal={oneDecimal}
        />

        {year ? (
          <EarningsBar
            year={year}
            labels={{
              otherAgencies: t("results.legend.otherAgencies"),
              agency: t("results.legend.agency"),
              costs: t("results.legend.costs"),
              tax: t("results.legend.tax"),
              you: t("results.legend.you"),
            }}
          />
        ) : null}

        <Block title={t("results.year")}>
          <Row label={t("results.fees")} value={year?.feesNet} format={format} />
          {fields.shared ? (
            <Row label={t("results.otherAgencies")} value={year?.otherAgencies} format={format} />
          ) : null}
          {fields.agentSplit ? (
            <Row label={t("results.agencyKeeps")} value={year?.agencyKeeps} format={format} />
          ) : null}
          <Row label={t("results.yourFees")} value={year?.yourFees} format={format} total />
          {year?.perSale != null ? (
            <p className="text-muted-foreground pt-1 text-xs">
              {t("results.perSale", { amount: format.money.format(year.perSale) })}
            </p>
          ) : null}
        </Block>

        <Block title={t("results.comesOff")}>
          <Row label={t("results.cuota")} value={year?.cuota} format={format} />
          {year ? (
            <p className="text-muted-foreground pb-1 pl-3 text-xs">
              {year.band == null
                ? t("results.cuotaTyped", { amount: format.money.format(year.cuotaMonthly) })
                : t("results.cuotaBand", {
                    band: year.band,
                    year: COTIZACION_YEAR,
                    amount: format.money.format(year.cuotaMonthly),
                  })}
            </p>
          ) : null}
          {fields.costs.trim() ? (
            <Row label={t("results.costs")} value={year?.costs} format={format} />
          ) : null}
          <Row
            label={
              withholding > 0
                ? t("results.irpfWithheld", { rate: format.percent(withholding) })
                : t("results.irpfAdvance")
            }
            value={year?.incomeTax}
            format={format}
          />
          <Row label={t("results.takeHomeYear")} value={year?.takeHome} format={format} total />
          <Row label={t("results.takeHomeMonth")} value={year?.takeHomeMonthly} format={format} />
          <p className="text-muted-foreground pt-1 text-xs leading-relaxed">{t("results.irpfNote")}</p>
        </Block>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className={INPUT} onClick={copyLink}>
            {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
            {t("actions.copyLink")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The answer in one line: the take-home a month, or the sales a year it takes. */
function Headline({
  mode,
  year,
  unreachable,
  format,
  oneDecimal,
}: {
  mode: Mode;
  year: EarningsBreakdown | null;
  unreachable: boolean;
  format: Formatters;
  oneDecimal: Intl.NumberFormat;
}) {
  const t = useTranslations("tools.earnings.results");
  if (unreachable) return <p className="text-muted-foreground text-sm">{t("unreachable")}</p>;
  if (!year) return <p className="text-muted-foreground text-sm">{t("hint")}</p>;

  if (mode === "need") {
    return (
      <div>
        <p className="text-muted-foreground text-sm">{t("need")}</p>
        <p className="mt-1 text-3xl tracking-tight tabular-nums">
          {t("salesYear", { count: year.sales })}
        </p>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {t("salesMonth", {
            count: oneDecimal.format(year.sales / 12),
            amount: format.money.format(year.takeHomeMonthly),
          })}
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-muted-foreground text-sm">{t("takeHome")}</p>
      <p className="mt-1 text-3xl tracking-tight tabular-nums">
        <Money value={year.takeHomeMonthly} format={format} />{" "}
        <span className="text-muted-foreground text-base tracking-normal">{t("perMonth")}</span>
      </p>
      <p className="text-muted-foreground mt-1.5 text-sm tabular-nums">
        {t("perYear", { amount: format.money.format(year.takeHome) })}
      </p>
    </div>
  );
}

/**
 * Where a year's fees go, as one thin bar: the other agencies, your agency,
 * the cuota and costs, IRPF and you, in ink at rising strengths. Decoration
 * only, and only when the year leaves something; the rows say it in words.
 */
function EarningsBar({
  year,
  labels,
}: {
  year: EarningsBreakdown;
  labels: Record<"otherAgencies" | "agency" | "costs" | "tax" | "you", string>;
}) {
  if (year.feesNet <= 0 || year.takeHome <= 0) return null;
  const parts = [
    { key: "otherAgencies", value: year.otherAgencies, tone: "bg-foreground/15" },
    { key: "agency", value: year.agencyKeeps ?? 0, tone: "bg-foreground/25" },
    { key: "costs", value: year.cuota + year.costs, tone: "bg-foreground/40" },
    { key: "tax", value: year.incomeTax, tone: "bg-foreground/60" },
    { key: "you", value: year.takeHome, tone: "bg-foreground" },
  ] as const;
  const shown = parts.filter((part) => part.value > 0);
  return (
    <div aria-hidden>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {shown.map((part) => (
          <span
            key={part.key}
            className={part.tone}
            style={{ width: `${(part.value / year.feesNet) * 100}%` }}
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
