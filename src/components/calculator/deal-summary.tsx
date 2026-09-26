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

/** Profit green, loss red; zero (an empty form) and "—" stay ink. */
const tone = (n: number) =>
  !Number.isFinite(n) || n === 0 ? "" : n > 0 ? "text-success" : "text-destructive";

/** The exit table is a grid of figures: only a loss is coloured, so it stands out. */
const lossTone = (n: number) => (Number.isFinite(n) && n < 0 ? "text-destructive" : "");

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
        bold && "font-medium"
      )}
    >
      <span className={cn(!bold && "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="section-label text-muted-foreground mb-1">
      {children}
    </h3>
  );
}

export function DealSummary({ title, input, result, labels }: DealView) {
  const r = result;
  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="border-foreground/70 border-b pb-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          {title || labels.untitled}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">{labels.subtitle}</p>
      </div>

      {/* KPI row: 2 x 2 on a phone, 4 across from sm. Each tile draws only its
          inner edges, so no line doubles up on the outer border or runs past
          its rounded corners. */}
      <div className="border-border mt-5 grid grid-cols-2 rounded-lg border sm:grid-cols-4">
        <Kpi
          label={labels.netProfit}
          value={formatEuro(r.netProfit)}
          valueClass={tone(r.netProfit)}
          className="border-r border-b sm:border-b-0"
        />
        <Kpi
          label={labels.roi}
          value={formatSignedPercent(r.roi)}
          valueClass={tone(r.roi)}
          className="border-b sm:border-r sm:border-b-0"
        />
        <Kpi
          label={labels.irrExit}
          value={formatSignedPercent(r.irr)}
          valueClass={tone(r.irr)}
          className="border-r"
        />
        <Kpi label={labels.capitalDeployed} value={formatEuro(r.capitalDeployed)} />
      </div>

      {/* Acquisition + Project */}
      <div className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2">
        <div>
          <SectionLabel>{labels.acquisition}</SectionLabel>
          <Line label={labels.purchasePrice} value={formatEuro(input.askingPrice)} />
          <Line label={labels.transferTax} value={formatEuro(r.transferTax)} />
          {/* No spacer here: the rows line up with the Project column beside them. */}
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
              <tr className="text-muted-foreground bg-muted/60 border-b text-xs">
                <th className="px-2 py-2 text-left font-normal sm:px-3">{labels.colExit}</th>
                <th className="px-2 py-2 text-right font-normal sm:px-3">
                  {labels.colNetProfit}
                </th>
                <th className="px-2 py-2 text-right font-normal sm:px-3">{labels.colRoi}</th>
                <th className="px-2 py-2 text-right font-normal sm:px-3">{labels.colIrr}</th>
              </tr>
            </thead>
            {/* Hairlines between rows, not stripes; the plan's own exit is the one
                shaded, medium-weight row. */}
            <tbody className="divide-y">
              {r.exitTimeline.map((row) => {
                const isBase = row.months === input.durationMonths;
                return (
                  <tr key={row.months} className={cn(isBase && "bg-muted/40")}>
                    <td
                      className={cn(
                        "px-2 py-2 text-left whitespace-nowrap sm:px-3",
                        isBase && "font-medium"
                      )}
                    >
                      {labels.exitRow(row.months)}
                      {isBase ? " •" : ""}
                    </td>
                    <td className={cn("px-2 py-2 text-right sm:px-3", lossTone(row.netProfit))}>
                      {formatEuro(row.netProfit)}
                    </td>
                    <td className={cn("px-2 py-2 text-right sm:px-3", lossTone(row.roi))}>
                      {formatSignedPercent(row.roi)}
                    </td>
                    <td className={cn("px-2 py-2 text-right sm:px-3", lossTone(row.irr))}>
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
  className,
}: {
  label: string;
  value: string;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-border px-4 py-3", className)}>
      <div className="section-label text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-lg font-medium tabular-nums", valueClass)}>
        {value}
      </div>
    </div>
  );
}
