import { createTranslator } from "next-intl";

import { intlTag, type AppLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { cotizationRows } from "@/lib/tools/earnings";

/**
 * The year's cuota table on the earnings calculator's page, read from the
 * same constants as the calculator, so the page and the results can never
 * disagree. A plain table: the article's own styles dress it.
 */
export function CuotaTable({ locale }: { locale: AppLocale }) {
  const t = createTranslator({ locale, messages: messagesFor(locale), namespace: "tools.earnings.table" });
  const money = new Intl.NumberFormat(intlTag(locale), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const whole = new Intl.NumberFormat(intlTag(locale), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const bound = (value: number) => (Number.isInteger(value) ? whole : money).format(value);

  return (
    <table>
      <thead>
        <tr>
          <th scope="col">{t("band")}</th>
          <th scope="col">{t("earnings")}</th>
          {/* The article's own th style aligns left; the amounts below align right. */}
          <th scope="col" className="text-right!">
            {t("cuota")}
          </th>
        </tr>
      </thead>
      <tbody>
        {cotizationRows().map((row, i) => (
          <tr key={i}>
            <td className="tabular-nums">{i + 1}</td>
            <td className="tabular-nums">
              {row.from == null
                ? t("upTo", { amount: bound(row.upTo ?? 0) })
                : row.upTo == null
                  ? t("over", { amount: bound(Math.round(row.from * 100 - 1) / 100) })
                  : t("between", { from: bound(row.from), to: bound(row.upTo) })}
            </td>
            <td className="text-right tabular-nums">{money.format(row.cuota)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
