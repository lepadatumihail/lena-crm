import { cn } from "@/lib/utils";
import {
  formatEuro,
  formatSignedPercent,
  formatSqm,
  type DealInput,
  type DealResult,
} from "@/lib/calculator/deal";

/**
 * Every piece of prose the summary and the PDF render, already translated.
 * Built once in the calculator screen (where hooks are allowed) because the
 * @react-pdf renderer runs outside React's tree — no `useTranslations` there.
 * Labels that embed a computed value (rates, months, €/m²) arrive interpolated.
 */
export type DealLabels = {
  untitled: string;
  documentTitle: string;
  subtitle: string;
  netProfit: string;
  roi: string;
  irrExit: string;
  capitalDeployed: string;
  acquisition: string;
  purchasePrice: string;
  transferTax: string;
  lawyerFee: string;
  notaryFee: string;
  totalAcquisition: string;
  project: string;
  projectType: string;
  projectTypeValue: string;
  surface: string;
  duration: string;
  durationValue: string;
  baseBuildCost: string;
  contingency: string;
  totalProjectCost: string;
  exitAndReturns: string;
  grossSalePrice: string;
  agentCommission: string;
  netProceeds: string;
  netProfitLoss: string;
  returnsByExit: string;
  colExit: string;
  colNetProfit: string;
  colRoi: string;
  colIrr: string;
  confidential: string;
  /** "6 months" — one row of the exit-timeline table. */
  exitRow: (months: number) => string;
};

export type DealView = {
  title: string;
  dateLabel: string;
  input: DealInput;
  result: DealResult;
  labels: DealLabels;
};

const tone = (n: number) =>
  !Number.isFinite(n) ? "" : n >= 0 ? "text-success" : "text-destructive";

/** A label / value ledger line. */
function Line({
  label,
  value,
  bold,
  divider,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  divider?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-1.5 text-sm",
        divider && "border-border mt-1 border-t pt-2.5",
        bold && "font-semibold"
      )}
    >
      <span className={cn(!bold && "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
      {children}
    </h3>
  );
}

export function DealSummary({ title, input, result, labels }: DealView) {
  const r = result;
  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="border-foreground/80 border-b-2 pb-3">
        <h2 className="text-2xl font-bold tracking-tight">
          {title || labels.untitled}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">{labels.subtitle}</p>
      </div>

      {/* KPI row */}
      <div className="border-border mt-5 grid grid-cols-2 divide-x divide-y rounded-lg border sm:grid-cols-4 sm:divide-y-0">
        <Kpi
          label={labels.netProfit}
          value={formatEuro(r.netProfit)}
          valueClass={tone(r.netProfit)}
        />
        <Kpi label={labels.roi} value={formatSignedPercent(r.roi)} valueClass={tone(r.roi)} />
        <Kpi
          label={labels.irrExit}
          value={formatSignedPercent(r.irr)}
          valueClass={tone(r.irr)}
        />
        <Kpi label={labels.capitalDeployed} value={formatEuro(r.capitalDeployed)} />
      </div>

      {/* Acquisition + Project */}
      <div className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2">
        <div>
          <SectionLabel>{labels.acquisition}</SectionLabel>
          <Line label={labels.purchasePrice} value={formatEuro(input.askingPrice)} />
          <Line label={labels.transferTax} value={formatEuro(r.transferTax)} />
          <div className="mt-1.5" />
          <Line label={labels.lawyerFee} value={formatEuro(r.lawyerFee)} />
          <Line label={labels.notaryFee} value={formatEuro(r.notaryFee)} />
          <Line
            label={labels.totalAcquisition}
            value={formatEuro(r.totalAcquisition)}
            bold
            divider
          />
        </div>

        <div>
          <SectionLabel>{labels.project}</SectionLabel>
          <Line label={labels.projectType} value={labels.projectTypeValue} />
          <Line label={labels.surface} value={formatSqm(input.surfaceSqm)} />
          <Line label={labels.duration} value={labels.durationValue} />
          <Line label={labels.baseBuildCost} value={formatEuro(r.baseBuildCost)} />
          <Line label={labels.contingency} value={formatEuro(r.contingency)} />
          <Line
            label={labels.totalProjectCost}
            value={formatEuro(r.totalProjectCost)}
            bold
            divider
          />
        </div>
      </div>

      {/* Exit & returns */}
      <div className="mt-6">
        <SectionLabel>{labels.exitAndReturns}</SectionLabel>
        <Line label={labels.grossSalePrice} value={formatEuro(r.grossSalePrice)} />
        <Line label={labels.agentCommission} value={formatEuro(r.agentCommission)} />
        <Line
          label={labels.netProceeds}
          value={formatEuro(r.netProceeds)}
          bold
          divider
        />
        <Line
          label={labels.netProfitLoss}
          value={formatEuro(r.netProfit)}
          bold
          valueClass={tone(r.netProfit)}
        />
      </div>

      {/* Returns by exit timeline */}
      <div className="mt-6">
        <SectionLabel>{labels.returnsByExit}</SectionLabel>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-muted-foreground bg-muted/60 text-[11px] tracking-wide uppercase">
                <th className="px-3 py-2 text-left font-medium">{labels.colExit}</th>
                <th className="px-3 py-2 text-right font-medium">
                  {labels.colNetProfit}
                </th>
                <th className="px-3 py-2 text-right font-medium">{labels.colRoi}</th>
                <th className="px-3 py-2 text-right font-medium">{labels.colIrr}</th>
              </tr>
            </thead>
            <tbody>
              {r.exitTimeline.map((row, i) => {
                const isBase = row.months === input.durationMonths;
                return (
                  <tr
                    key={row.months}
                    className={cn(
                      i % 2 === 1 && "bg-muted/30",
                      isBase && "bg-primary/5"
                    )}
                  >
                    <td className="px-3 py-2 text-left font-medium">
                      {labels.exitRow(row.months)}
                      {isBase ? " •" : ""}
                    </td>
                    <td className={cn("px-3 py-2 text-right", tone(row.netProfit))}>
                      {formatEuro(row.netProfit)}
                    </td>
                    <td className={cn("px-3 py-2 text-right", tone(row.roi))}>
                      {formatSignedPercent(row.roi)}
                    </td>
                    <td className={cn("px-3 py-2 text-right", tone(row.irr))}>
                      {formatSignedPercent(row.irr)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="text-muted-foreground text-[10px] font-semibold tracking-[0.1em] uppercase">
        {label}
      </div>
      <div className={cn("mt-1 text-lg font-bold tabular-nums", valueClass)}>
        {value}
      </div>
    </div>
  );
}
