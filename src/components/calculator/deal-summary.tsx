import { cn } from "@/lib/utils";
import {
  formatEuro,
  formatEuroPrefix,
  formatRate,
  formatSignedPercent,
  formatSqm,
  type DealInput,
  type DealResult,
} from "@/lib/calculator/deal";

export type DealView = {
  title: string;
  dateLabel: string;
  input: DealInput;
  result: DealResult;
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

export function DealSummary({ title, dateLabel, input, result }: DealView) {
  const r = result;
  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="border-foreground/80 border-b-2 pb-3">
        <h2 className="text-2xl font-bold tracking-tight">
          {title || "Untitled deal"}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Deal Analysis · {dateLabel} · All-upfront model
        </p>
      </div>

      {/* KPI row */}
      <div className="border-border mt-5 grid grid-cols-2 divide-x divide-y rounded-lg border sm:grid-cols-4 sm:divide-y-0">
        <Kpi label="Net Profit" value={formatEuro(r.netProfit)} valueClass={tone(r.netProfit)} />
        <Kpi label="ROI" value={formatSignedPercent(r.roi)} valueClass={tone(r.roi)} />
        <Kpi
          label={`IRR (${input.durationMonths}M exit)`}
          value={formatSignedPercent(r.irr)}
          valueClass={tone(r.irr)}
        />
        <Kpi label="Capital Deployed" value={formatEuro(r.capitalDeployed)} />
      </div>

      {/* Acquisition + Project */}
      <div className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2">
        <div>
          <SectionLabel>Acquisition</SectionLabel>
          <Line label="Purchase Price" value={formatEuro(input.askingPrice)} />
          <Line
            label={`Transfer Tax (${formatRate(input.transferTaxPct)})`}
            value={formatEuro(r.transferTax)}
          />
          <div className="mt-1.5" />
          <Line
            label={`Lawyer Fee (${formatRate(input.lawyerPct)})`}
            value={formatEuro(r.lawyerFee)}
          />
          <Line
            label={`Notary Fee (${formatRate(input.notaryPct)})`}
            value={formatEuro(r.notaryFee)}
          />
          <Line
            label="Total Acquisition"
            value={formatEuro(r.totalAcquisition)}
            bold
            divider
          />
        </div>

        <div>
          <SectionLabel>Project</SectionLabel>
          <Line
            label="Type"
            value={`Renovation — ${formatEuroPrefix(input.renovationPerSqm)}/m²`}
          />
          <Line label="Surface" value={formatSqm(input.surfaceSqm)} />
          <Line label="Duration" value={`${input.durationMonths} months`} />
          <Line label="Base Build Cost" value={formatEuro(r.baseBuildCost)} />
          <Line
            label={`Contingency (${formatRate(input.contingencyPct)})`}
            value={formatEuro(r.contingency)}
          />
          <Line
            label="Total Project Cost"
            value={formatEuro(r.totalProjectCost)}
            bold
            divider
          />
        </div>
      </div>

      {/* Exit & returns */}
      <div className="mt-6">
        <SectionLabel>Exit &amp; Returns</SectionLabel>
        <Line label="Gross Sale Price" value={formatEuro(r.grossSalePrice)} />
        <Line
          label={`Agent Commission (${formatRate(input.agencyFeePct)})`}
          value={formatEuro(r.agentCommission)}
        />
        <Line label="Net Proceeds" value={formatEuro(r.netProceeds)} bold divider />
        <Line
          label="Net Profit / (Loss)"
          value={formatEuro(r.netProfit)}
          bold
          valueClass={tone(r.netProfit)}
        />
      </div>

      {/* Returns by exit timeline */}
      <div className="mt-6">
        <SectionLabel>Returns by Exit Timeline</SectionLabel>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-muted-foreground bg-muted/60 text-[11px] tracking-wide uppercase">
                <th className="px-3 py-2 text-left font-medium">Exit</th>
                <th className="px-3 py-2 text-right font-medium">Net Profit</th>
                <th className="px-3 py-2 text-right font-medium">ROI</th>
                <th className="px-3 py-2 text-right font-medium">IRR (ann.)</th>
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
                      {row.months} months{isBase ? " •" : ""}
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
