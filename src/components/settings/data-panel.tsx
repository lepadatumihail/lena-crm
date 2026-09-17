"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DatabaseBackup, Download, Loader2 } from "lucide-react";

import { Panel } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { SessionEndedError, downloadFrom } from "@/lib/download";
import { SUPPORT_EMAIL } from "@/lib/site";

/**
 * "Your data": the whole account as one ZIP, on every plan. Uploaded files
 * aren't in it; the footnote says how to ask for those.
 */
export function DataPanel({ rowClassName }: { rowClassName: string }) {
  const t = useTranslations("settings.data");
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      await downloadFrom("/settings/export", {}, "leadwing-export.zip");
      toast.success(t("done"));
    } catch (error) {
      if (error instanceof SessionEndedError) toast.error(t("sessionEnded"));
      else {
        toast.error(t("failed"), {
          description: error instanceof Error && error.message ? error.message : undefined,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title={t("title")}
      icon={<DatabaseBackup className="size-3.5" />}
      footer={
        <span>
          {t.rich("footnote", {
            email: () => (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-foreground font-medium hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            ),
          })}
        </span>
      }
    >
      <div className={rowClassName}>
        <div className="space-y-1.5">
          <p className="text-sm leading-none font-medium">{t("download")}</p>
          <p className="text-muted-foreground text-[13px] text-pretty">{t("downloadHint")}</p>
        </div>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Download />}
            {busy ? t("preparing") : t("button")}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
