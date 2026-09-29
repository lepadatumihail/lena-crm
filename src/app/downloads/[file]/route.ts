import { LOCALES } from "@/i18n/config";
import { buildTracker } from "@/lib/tools/tracker";
import { TRACKER_FILES, XLSX_TYPE, trackerLocale } from "@/lib/tools/tracker-files";

/**
 * The free client tracker, one workbook per language (plan 019). Both are
 * built once, at build time, from the import template's headers
 * (lib/tools/tracker.ts), so the file can never drift from what the importer
 * reads; any other name is a 404. Free, no sign-in: the tool page counts the
 * download itself (tool_use).
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ file: TRACKER_FILES[locale] }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const locale = trackerLocale(file);
  if (!locale) return new Response("Not found", { status: 404 });

  const workbook = await buildTracker(locale);
  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}
