import { getTranslations } from "next-intl/server";

import { buildAccountZip } from "@/lib/export/archive";
import { attachment, exportSession, isSameOrigin, jsonError } from "@/lib/export/http";
import { loadAccountExport } from "@/lib/export/load";
import { dateKeyInTimeZone } from "@/lib/home";

/**
 * Everything the agent owns as one ZIP. A solo agent's account runs from
 * kilobytes to a few MB, so it is built in memory; if a real export ever
 * passes about 50 MB, move to fflate's streaming `Zip`.
 */
export async function GET(request: Request) {
  const tt = await getTranslations("transfer");
  if (!isSameOrigin(request)) return jsonError(tt("errors.forbidden"), 403);

  const session = await exportSession();
  if (!session) return jsonError(tt("errors.signedOut"), 401);

  const { supabase, userId, email, ctx } = session;
  try {
    const data = await loadAccountExport(supabase, userId, email);
    const zip = await buildAccountZip(data, ctx);
    const day = dateKeyInTimeZone(new Date().toISOString(), ctx.timeZone);
    // The name stays English in both languages, like the files inside.
    return attachment(zip, {
      fileName: `leadwing-export-${day}.zip`,
      contentType: "application/zip",
    });
  } catch (error) {
    console.error("[settings/export]", error);
    return jsonError(tt("errors.failed"), 500);
  }
}
