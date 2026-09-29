import { createTranslator } from "next-intl";

import { intlTag, type AppLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { STALE_AFTER_DAYS } from "@/lib/attention";
import { templateTable } from "@/lib/import/template";
import type { Cell, TransferContext } from "@/lib/transfer/format";
import { cn } from "@/lib/utils";
import { TrackerDownloads, TrackerImport } from "@/components/tools/tracker-actions";

const CAPTION_ID = "tracker-preview";

/** The calendar day `days` before an ISO date. */
function daysBefore(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
}

/**
 * The client tracker's slot on its page (plan 019): the downloads, then the
 * Buyers sheet as a real table (it scrolls sideways in its own box on a
 * phone, never the page), then the way into LeadWing. The two rows are the
 * import template's sample clients painted as the file would paint them: a
 * follow-up due today in amber, a client quiet for longer than
 * STALE_AFTER_DAYS in grey. They date from `asOf`, the page's own date, so
 * the page stays the same between revisions. A server component: only the
 * buttons ship JavaScript.
 */
export function TrackerDownload({ locale, asOf }: { locale: AppLocale; asOf: string }) {
  const messages = messagesFor(locale);
  const ctx: TransferContext = {
    locale,
    timeZone: "Europe/Madrid",
    t: createTranslator({ locale, messages, namespace: "crm" }),
    tt: createTranslator({ locale, messages, namespace: "transfer" }),
  };
  const t = createTranslator({ locale, messages, namespace: "tools.tracker" });

  const sample = templateTable("buyer", ctx);
  const headers = [
    ...sample.headers,
    t("columns.lastContact"),
    t("columns.nextFollowUp"),
    t("columns.daysSince"),
  ];
  const quietFor = STALE_AFTER_DAYS + 5;
  const rows: { tone: "due" | "quiet"; cells: Cell[] }[] = [
    {
      tone: "due",
      cells: [
        ...sample.rows[0],
        { type: "date", value: daysBefore(asOf, 2) },
        { type: "date", value: asOf },
        { type: "integer", value: 2 },
      ],
    },
    {
      tone: "quiet",
      cells: [
        ...sample.rows[1],
        { type: "date", value: daysBefore(asOf, quietFor) },
        null,
        { type: "integer", value: quietFor },
      ],
    },
  ];

  const caption = t("page.caption", { sheet: ctx.tt("sheets.buyers") });
  const number = new Intl.NumberFormat(intlTag(locale), { maximumFractionDigits: 2 });
  const shown = (cell: Cell) =>
    cell == null ? "" : cell.type === "number" ? number.format(cell.value) : String(cell.value);
  const numeric = (cell: Cell) => cell?.type === "number" || cell?.type === "integer";
  const edge = "first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6";

  return (
    <div className="space-y-6">
      <div className="bg-card overflow-hidden rounded-2xl border shadow-xs">
        <div className="p-5 sm:p-6">
          <TrackerDownloads locale={locale} />
        </div>
        <figure className="border-t">
          {/* Shown outside the scrolling box so it stays put; the table's own
              caption names it for screen readers. */}
          <p aria-hidden className="text-muted-foreground px-5 pt-4 pb-2 text-xs sm:px-6">
            {caption}
          </p>
          <div
            role="region"
            aria-labelledby={CAPTION_ID}
            tabIndex={0}
            className="focus-visible:ring-ring/50 relative overflow-x-auto outline-none focus-visible:ring-[3px] focus-visible:ring-inset"
          >
            <table className="w-max min-w-full border-collapse text-sm">
              <caption id={CAPTION_ID} className="sr-only">
                {caption}
              </caption>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className={cn("border-b px-3 py-2 text-left font-medium whitespace-nowrap", edge)}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ tone, cells }) => (
                  <tr key={tone} className={tone === "due" ? "bg-tone-amber-soft" : "bg-muted"}>
                    {cells.map((cell, i) => (
                      <td
                        key={i}
                        className={cn(
                          "border-b px-3 py-2 whitespace-nowrap",
                          numeric(cell) && "text-right tabular-nums",
                          edge
                        )}
                      >
                        {shown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 px-5 py-4 text-xs sm:px-6">
            <span className="flex items-center gap-2">
              <span aria-hidden className="bg-tone-amber-soft size-3 shrink-0 rounded-[3px] border" />
              {t("page.legend.due")}
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden className="bg-muted size-3 shrink-0 rounded-[3px] border" />
              {t("page.legend.quiet", { days: STALE_AFTER_DAYS })}
            </span>
          </figcaption>
        </figure>
      </div>
      <TrackerImport />
    </div>
  );
}
