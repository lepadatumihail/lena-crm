import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { sideLabel } from "@/i18n/labels";
import { attachment, exportSession, isSameOrigin, jsonError } from "@/lib/export/http";
import { templateTable } from "@/lib/import/template";
import { buildCsv } from "@/lib/transfer/csv";
import { buildWorkbook } from "@/lib/transfer/xlsx";

const querySchema = z.object({
  side: z.enum(["buyer", "seller"]),
  format: z.enum(["xlsx", "csv"]),
});

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** GET ?side=buyer|seller&format=xlsx|csv: a file with LeadWing's headers and two sample rows. */
export async function GET(request: Request) {
  const tt = await getTranslations("transfer");
  if (!isSameOrigin(request)) return jsonError(tt("errors.forbidden"), 403);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ side: url.searchParams.get("side"), format: url.searchParams.get("format") });
  if (!parsed.success) return jsonError(tt("errors.invalid"), 400);

  const session = await exportSession();
  if (!session) return jsonError(tt("errors.signedOut"), 401);

  const { side, format } = parsed.data;
  const { ctx } = session;
  try {
    const table = templateTable(side, ctx);
    const sideWord = sideLabel(ctx.t, side, true);
    const fileName = `leadwing-import-template-${sideWord.toLowerCase()}.${format}`;
    if (format === "csv") {
      return attachment(buildCsv({ ...table, locale: ctx.locale }), {
        fileName,
        contentType: "text/csv; charset=utf-8",
      });
    }
    const workbook = await buildWorkbook([{ name: sideWord, ...table }]);
    return attachment(workbook, { fileName, contentType: XLSX_TYPE });
  } catch (error) {
    console.error("[clients/import/template]", error);
    return jsonError(tt("errors.failed"), 500);
  }
}
