"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

import {
  formatEuro,
  formatEuroPrefix,
  formatRate,
  formatSignedPercent,
  formatSqm,
} from "@/lib/calculator/deal";
import type { DealView } from "@/components/calculator/deal-summary";

// Hex approximations of the app's oklch design tokens (@react-pdf takes no CSS vars).
const INK = "#1c1917";
const FAINT = "#a8a29e";
const GREEN = "#1a874f";
const RED = "#dc2626";
const BORDER = "#e7e5e4";
const HAIR = "#f0efed";
const HEADBG = "#f4f3f1";
const ZEBRA = "#faf9f8";
const BASEBG = "#fbf2ec";

const toneColor = (n: number) =>
  !Number.isFinite(n) ? INK : n >= 0 ? GREEN : RED;

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9.5, color: FAINT, marginTop: 5 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: INK, marginTop: 12 },

  kpiRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    marginTop: 20,
  },
  kpiCell: { flex: 1, paddingVertical: 11, paddingHorizontal: 12 },
  kpiDivider: { borderRightWidth: 1, borderRightColor: BORDER },
  kpiLabel: {
    fontSize: 7.5,
    color: FAINT,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  kpiValue: { fontSize: 13.5, fontFamily: "Helvetica-Bold", marginTop: 4 },

  columns: { flexDirection: "row", marginTop: 22 },
  col: { flex: 1 },
  colLeft: { flex: 1, marginRight: 26 },
  section: { marginTop: 22 },
  sectionLabel: {
    fontSize: 8,
    color: FAINT,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4.5,
    borderBottomWidth: 1,
    borderBottomColor: HAIR,
  },
  rowTop: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: "#d6d3d1",
    marginTop: 3,
    paddingTop: 6,
  },
  rowLabel: { color: "#57534e" },
  rowValue: { fontFamily: "Helvetica-Bold", color: INK },
  bold: { fontFamily: "Helvetica-Bold" },

  gap: { height: 8 },

  table: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
  },
  th: {
    flexDirection: "row",
    backgroundColor: HEADBG,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: HAIR,
  },
  thText: {
    fontSize: 7.5,
    color: FAINT,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  cExit: { width: "28%" },
  cNum: { width: "24%", textAlign: "right" },
  cExitBold: { width: "28%", fontFamily: "Helvetica-Bold" },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: FAINT },
});

function Row({
  label,
  value,
  bold,
  tone,
  top,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: string;
  top?: boolean;
}) {
  return (
    <View style={top ? [styles.row, styles.rowTop] : styles.row}>
      <Text style={bold ? [styles.rowLabel, styles.bold] : styles.rowLabel}>
        {label}
      </Text>
      <Text
        style={[styles.rowValue, tone ? { color: tone } : {}]}
      >
        {value}
      </Text>
    </View>
  );
}

function Kpi({
  label,
  value,
  tone,
  divider,
}: {
  label: string;
  value: string;
  tone?: string;
  divider?: boolean;
}) {
  return (
    <View style={divider ? [styles.kpiCell, styles.kpiDivider] : styles.kpiCell}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, tone ? { color: tone } : {}]}>{value}</Text>
    </View>
  );
}

export function DealPdfDocument({ title, dateLabel, input, result: r }: DealView) {
  return (
    <Document title={title || "Deal Analysis"}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title || "Untitled deal"}</Text>
        <Text style={styles.subtitle}>
          Deal Analysis · {dateLabel} · All-upfront model
        </Text>
        <View style={styles.rule} />

        <View style={styles.kpiRow}>
          <Kpi label="Net Profit" value={formatEuro(r.netProfit)} tone={toneColor(r.netProfit)} divider />
          <Kpi label="ROI" value={formatSignedPercent(r.roi)} tone={toneColor(r.roi)} divider />
          <Kpi
            label={`IRR (${input.durationMonths}M exit)`}
            value={formatSignedPercent(r.irr)}
            tone={toneColor(r.irr)}
            divider
          />
          <Kpi label="Capital Deployed" value={formatEuro(r.capitalDeployed)} />
        </View>

        <View style={styles.columns}>
          <View style={styles.colLeft}>
            <Text style={styles.sectionLabel}>Acquisition</Text>
            <Row label="Purchase Price" value={formatEuro(input.askingPrice)} />
            <Row
              label={`Transfer Tax (${formatRate(input.transferTaxPct)})`}
              value={formatEuro(r.transferTax)}
            />
            <View style={styles.gap} />
            <Row
              label={`Lawyer Fee (${formatRate(input.lawyerPct)})`}
              value={formatEuro(r.lawyerFee)}
            />
            <Row
              label={`Notary Fee (${formatRate(input.notaryPct)})`}
              value={formatEuro(r.notaryFee)}
            />
            <Row label="Total Acquisition" value={formatEuro(r.totalAcquisition)} bold top />
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Project</Text>
            <Row
              label="Type"
              value={`Renovation — ${formatEuroPrefix(input.renovationPerSqm)}/m²`}
            />
            <Row label="Surface" value={formatSqm(input.surfaceSqm)} />
            <Row label="Duration" value={`${input.durationMonths} months`} />
            <Row label="Base Build Cost" value={formatEuro(r.baseBuildCost)} />
            <Row
              label={`Contingency (${formatRate(input.contingencyPct)})`}
              value={formatEuro(r.contingency)}
            />
            <Row label="Total Project Cost" value={formatEuro(r.totalProjectCost)} bold top />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Exit &amp; Returns</Text>
          <Row label="Gross Sale Price" value={formatEuro(r.grossSalePrice)} />
          <Row
            label={`Agent Commission (${formatRate(input.agencyFeePct)})`}
            value={formatEuro(r.agentCommission)}
          />
          <Row label="Net Proceeds" value={formatEuro(r.netProceeds)} bold top />
          <Row
            label="Net Profit / (Loss)"
            value={formatEuro(r.netProfit)}
            bold
            tone={toneColor(r.netProfit)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Returns by Exit Timeline</Text>
          <View style={styles.table}>
            <View style={styles.th}>
              <Text style={[styles.thText, styles.cExit]}>Exit</Text>
              <Text style={[styles.thText, styles.cNum]}>Net Profit</Text>
              <Text style={[styles.thText, styles.cNum]}>ROI</Text>
              <Text style={[styles.thText, styles.cNum]}>IRR (ann.)</Text>
            </View>
            {r.exitTimeline.map((row, i) => {
              const isBase = row.months === input.durationMonths;
              const bg = isBase ? BASEBG : i % 2 === 1 ? ZEBRA : "#ffffff";
              return (
                <View key={row.months} style={[styles.tr, { backgroundColor: bg }]}>
                  <Text style={styles.cExitBold}>
                    {row.months} months{isBase ? " •" : ""}
                  </Text>
                  <Text style={[styles.cNum, { color: toneColor(row.netProfit) }]}>
                    {formatEuro(row.netProfit)}
                  </Text>
                  <Text style={[styles.cNum, { color: toneColor(row.roi) }]}>
                    {formatSignedPercent(row.roi)}
                  </Text>
                  <Text style={[styles.cNum, { color: toneColor(row.irr) }]}>
                    {formatSignedPercent(row.irr)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{dateLabel}</Text>
          <Text style={styles.footerText}>Confidential — for internal use only</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Build the PDF in the browser and trigger a download. Client-only. */
export async function downloadDealPdf(view: DealView, fileName: string) {
  const blob = await pdf(<DealPdfDocument {...view} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
