"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

import {
  formatEuro,
  formatSignedPercent,
  formatSqm,
} from "@/lib/calculator/deal";
import type { DealView } from "@/components/calculator/deal-summary";

// Hex approximations of the app's neutral (grey, chroma 0) design tokens:
// @react-pdf takes no CSS vars. Green and red are the profit/loss signals.
const INK = "#171717";
const MUTED = "#525252";
const FAINT = "#a3a3a3";
const GREEN = "#1a874f";
const RED = "#dc2626";
const RULE = "#d4d4d4";
const BORDER = "#e5e5e5";
const HAIR = "#f0f0f0";
const HEADBG = "#f5f5f5";
const BASEBG = "#fafafa";
const WHITE = "#ffffff";

// The same rules as the on-screen summary: profit green and loss red on the
// headline figures (zero stays ink), and only a loss coloured in the table.
const toneColor = (n: number) =>
  !Number.isFinite(n) || n === 0 ? INK : n > 0 ? GREEN : RED;
const lossColor = (n: number) => (Number.isFinite(n) && n < 0 ? RED : INK);

/**
 * The built-in Helvetica covers WinAnsi only: Latin letters, € and a few
 * marks. A document with any other letter (the Russian interface, or a
 * Cyrillic project name in any language) is set in Geist instead, the TTF
 * Next ships for OG images, copied to public/fonts. It has one weight, so
 * bold lines stay regular there.
 */
const UNICODE_FAMILY = "Geist";
const UNICODE_FONT = "/fonts/Geist-Regular.ttf";
const BEYOND_HELVETICA = /[^\u0000-\u00ff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/;

let unicodeRegistered = false;
function registerUnicodeFont() {
  if (unicodeRegistered) return;
  Font.register({
    family: UNICODE_FAMILY,
    fonts: [{ src: UNICODE_FONT }, { src: UNICODE_FONT, fontWeight: 700 }],
  });
  unicodeRegistered = true;
}

/** Whether any text the document prints needs more than Helvetica has. */
function needsUnicode(view: DealView): boolean {
  const texts = [view.title, view.dateLabel, ...Object.values(view.labels)];
  return texts.some((text) => typeof text === "string" && BEYOND_HELVETICA.test(text));
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  title: { fontSize: 22, fontWeight: 700 },
  subtitle: { fontSize: 9.5, color: FAINT, marginTop: 5 },
  rule: { borderBottomWidth: 1, borderBottomColor: INK, marginTop: 12 },

  kpiRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    marginTop: 20,
  },
  kpiCell: { flex: 1, paddingVertical: 11, paddingHorizontal: 12 },
  kpiDivider: { borderRightWidth: 1, borderRightColor: BORDER },
  // Labels are sentence case and regular, as in the app.
  kpiLabel: { fontSize: 8.5, color: MUTED },
  kpiValue: { fontSize: 13.5, fontWeight: 700, marginTop: 4 },

  columns: { flexDirection: "row", marginTop: 22 },
  col: { flex: 1 },
  colLeft: { flex: 1, marginRight: 26 },
  section: { marginTop: 22 },
  sectionLabel: { fontSize: 9, color: MUTED, marginBottom: 6 },

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
    borderTopColor: RULE,
    marginTop: 3,
    paddingTop: 6,
  },
  rowLabel: { color: MUTED },
  rowValue: { color: INK },
  bold: { fontWeight: 700 },

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
  thText: { fontSize: 8.5, color: MUTED },
  cExit: { width: "28%" },
  cNum: { width: "24%", textAlign: "right" },
  cExitBold: { width: "28%", fontWeight: 700 },

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
      <Text style={bold ? [styles.bold, { color: INK }] : styles.rowLabel}>
        {label}
      </Text>
      <Text
        style={[styles.rowValue, bold ? styles.bold : {}, tone ? { color: tone } : {}]}
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

export function DealPdfDocument({
  title,
  dateLabel,
  input,
  result: r,
  labels,
  unicode = false,
}: DealView & { unicode?: boolean }) {
  return (
    <Document title={title || labels.documentTitle}>
      <Page size="A4" style={unicode ? [styles.page, { fontFamily: UNICODE_FAMILY }] : styles.page}>
        <Text style={styles.title}>{title || labels.untitled}</Text>
        <Text style={styles.subtitle}>{labels.subtitle}</Text>
        <View style={styles.rule} />

        <View style={styles.kpiRow}>
          <Kpi label={labels.netProfit} value={formatEuro(r.netProfit)} tone={toneColor(r.netProfit)} divider />
          <Kpi label={labels.roi} value={formatSignedPercent(r.roi)} tone={toneColor(r.roi)} divider />
          <Kpi
            label={labels.irrExit}
            value={formatSignedPercent(r.irr)}
            tone={toneColor(r.irr)}
            divider
          />
          <Kpi label={labels.capitalDeployed} value={formatEuro(r.capitalDeployed)} />
        </View>

        <View style={styles.columns}>
          <View style={styles.colLeft}>
            <Text style={styles.sectionLabel}>{labels.acquisition}</Text>
            <Row label={labels.purchasePrice} value={formatEuro(input.askingPrice)} />
            <Row label={labels.transferTax} value={formatEuro(r.transferTax)} />
            <Row label={labels.lawyerFee} value={formatEuro(r.lawyerFee)} />
            <Row label={labels.notaryFee} value={formatEuro(r.notaryFee)} />
            <Row label={labels.totalAcquisition} value={formatEuro(r.totalAcquisition)} bold top />
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionLabel}>{labels.project}</Text>
            <Row label={labels.projectType} value={labels.projectTypeValue} />
            <Row label={labels.surface} value={formatSqm(input.surfaceSqm)} />
            <Row label={labels.duration} value={labels.durationValue} />
            <Row label={labels.baseBuildCost} value={formatEuro(r.baseBuildCost)} />
            <Row label={labels.contingency} value={formatEuro(r.contingency)} />
            <Row label={labels.totalProjectCost} value={formatEuro(r.totalProjectCost)} bold top />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{labels.exitAndReturns}</Text>
          <Row label={labels.grossSalePrice} value={formatEuro(r.grossSalePrice)} />
          <Row label={labels.agentCommission} value={formatEuro(r.agentCommission)} />
          <Row label={labels.netProceeds} value={formatEuro(r.netProceeds)} bold top />
          <Row
            label={labels.netProfitLoss}
            value={formatEuro(r.netProfit)}
            bold
            tone={toneColor(r.netProfit)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{labels.returnsByExit}</Text>
          <View style={styles.table}>
            <View style={styles.th}>
              <Text style={[styles.thText, styles.cExit]}>{labels.colExit}</Text>
              <Text style={[styles.thText, styles.cNum]}>{labels.colNetProfit}</Text>
              <Text style={[styles.thText, styles.cNum]}>{labels.colRoi}</Text>
              <Text style={[styles.thText, styles.cNum]}>{labels.colIrr}</Text>
            </View>
            {/* As on screen: hairlines, and only the plan's own exit shaded and bold. */}
            {r.exitTimeline.map((row) => {
              const isBase = row.months === input.durationMonths;
              return (
                <View
                  key={row.months}
                  style={[styles.tr, { backgroundColor: isBase ? BASEBG : WHITE }]}
                >
                  <Text style={isBase ? styles.cExitBold : styles.cExit}>
                    {labels.exitRow(row.months)}
                    {isBase ? " •" : ""}
                  </Text>
                  <Text style={[styles.cNum, { color: lossColor(row.netProfit) }]}>
                    {formatEuro(row.netProfit)}
                  </Text>
                  <Text style={[styles.cNum, { color: lossColor(row.roi) }]}>
                    {formatSignedPercent(row.roi)}
                  </Text>
                  <Text style={[styles.cNum, { color: lossColor(row.irr) }]}>
                    {formatSignedPercent(row.irr)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{dateLabel}</Text>
          <Text style={styles.footerText}>{labels.confidential}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Build the PDF in the browser and trigger a download. Client-only. */
export async function downloadDealPdf(view: DealView, fileName: string) {
  const unicode = needsUnicode(view);
  if (unicode) registerUnicodeFont();
  const blob = await pdf(<DealPdfDocument {...view} unicode={unicode} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
