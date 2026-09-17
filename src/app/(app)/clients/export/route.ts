import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { sideLabel } from "@/i18n/labels";
import { attachment, exportSession, isSameOrigin, jsonError } from "@/lib/export/http";
import { loadClientExport } from "@/lib/export/load";
import { dateKeyInTimeZone } from "@/lib/home";
import { buildCsv } from "@/lib/transfer/csv";
import { clientTable } from "@/lib/transfer/format";
import { buildWorkbook } from "@/lib/transfer/xlsx";

const bodySchema = z.object({
  side: z.enum(["buyer", "seller"]),
  format: z.enum(["xlsx", "csv"]),
  ids: z.array(z.uuid()).min(1).max(5000),
});

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * The client list as a file: the rows the agent has on screen (or ticked),
 * re-read in full on the server. The list holds headline figures only.
 */
export async function POST(request: Request) {
  const tt = await getTranslations("transfer");
  if (!isSameOrigin(request)) return jsonError(tt("errors.forbidden"), 403);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(tt("errors.invalid"), 400);

  const session = await exportSession();
  if (!session) return jsonError(tt("errors.signedOut"), 401);

  const { supabase, userId, ctx } = session;
  const { side, format, ids } = parsed.data;
  try {
    const records = await loadClientExport(supabase, userId, side, ids);
    const table = clientTable(side, records, ctx);
    const sideWord = sideLabel(ctx.t, side, true);
    const day = dateKeyInTimeZone(new Date().toISOString(), ctx.timeZone);
    const fileName = `leadwing-${sideWord.toLowerCase()}-${day}.${format}`;

    if (format === "csv") {
      return attachment(buildCsv({ ...table, locale: ctx.locale }), {
        fileName,
        contentType: "text/csv; charset=utf-8",
      });
    }
    const workbook = await buildWorkbook([{ name: sideWord, ...table }]);
    return attachment(workbook, { fileName, contentType: XLSX_TYPE });
  } catch (error) {
    console.error("[clients/export]", error);
    return jsonError(tt("errors.failed"), 500);
  }
}
