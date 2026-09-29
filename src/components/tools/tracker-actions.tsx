"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Download, FileSpreadsheet } from "lucide-react";

import { LOCALES, type AppLocale } from "@/i18n/config";
import { trackSiteEvent } from "@/lib/site-events";
import { TRACKER_FILES, TRACKER_SHEETS_COPY_URL, trackerPath } from "@/lib/tools/tracker-files";
import { Button } from "@/components/ui/button";
import { SignUpDialog } from "@/components/marketing/sign-up-dialog";

/** Each download or copy counts as the tool being used. */
const used = () => trackSiteEvent("tool_use");

/**
 * The client tracker's downloads: the workbook in the page's language, the
 * other language's as a small link, and a Google Sheets copy once one exists
 * (TRACKER_SHEETS_COPY_URL). Free and without an email wall.
 */
export function TrackerDownloads({ locale }: { locale: AppLocale }) {
  const t = useTranslations("tools.tracker.page");
  const other = LOCALES.find((l) => l !== locale) ?? locale;
  const copyUrl = TRACKER_SHEETS_COPY_URL[locale];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild size="pill">
          <a href={trackerPath(locale)} download={TRACKER_FILES[locale]} onClick={used}>
            <Download /> {t("download")}
          </a>
        </Button>
        {copyUrl ? (
          <Button asChild size="pill" variant="outline">
            <a href={copyUrl} target="_blank" rel="noreferrer" onClick={used}>
              <FileSpreadsheet /> {t("sheetsCopy")}
            </a>
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-sm text-pretty">
        {t("note")}{" "}
        <a
          href={trackerPath(other)}
          download={TRACKER_FILES[other]}
          hrefLang={other}
          onClick={used}
          className="text-foreground underline decoration-current/30 underline-offset-4 transition-colors hover:decoration-current"
        >
          {t("otherLanguage")}
        </a>
      </p>
    </div>
  );
}

/**
 * "Outgrown it?": sign up, then land straight on the import. The label wraps
 * rather than pushing a 320 px phone sideways.
 */
export function TrackerImport() {
  const t = useTranslations("tools.tracker.page");
  return (
    <SignUpDialog
      variant="outline"
      next="/clients/import"
      className="h-auto min-h-11 max-w-full py-2.5 text-center leading-snug text-balance whitespace-normal"
    >
      {t("import")} <ArrowRight />
    </SignUpDialog>
  );
}
