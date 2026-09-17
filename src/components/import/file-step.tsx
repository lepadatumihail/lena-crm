"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { ClientSide } from "@/lib/crm";
import { SessionEndedError, downloadFrom } from "@/lib/download";
import { readImportFile, type ReadFailure } from "@/lib/import/read";
import { cn } from "@/lib/utils";

import type { Loaded } from "./wizard-state";

const ACCEPT = ".csv,.tsv,.txt,.xlsx,.xls";

export function FileStep({
  side,
  onLoaded,
}: {
  side: ClientSide;
  onLoaded: (file: File, result: Loaded) => void;
}) {
  const t = useTranslations("imports.file");
  const tErrors = useTranslations("imports.errors");
  const tCrm = useTranslations("crm");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<ReadFailure | null>(null);
  const [over, setOver] = useState(false);
  const [template, setTemplate] = useState<"xlsx" | "csv" | null>(null);

  async function read(file: File | undefined) {
    if (!file) return;
    setError(null);
    setReading(file.name);
    try {
      const result = await readImportFile(file);
      if (result.ok) onLoaded(file, result);
      else setError(result.reason);
    } finally {
      setReading(null);
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    void read(event.dataTransfer.files[0]);
  }

  async function downloadTemplate(format: "xlsx" | "csv") {
    setTemplate(format);
    try {
      await downloadFrom(
        `/clients/import/template?side=${side}&format=${format}`,
        {},
        `leadwing-import-template-${side}s.${format}`
      );
    } catch (err) {
      toast.error(err instanceof SessionEndedError ? tErrors("signedOut") : t("errors.templateFailed"));
    } finally {
      setTemplate(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm">{t("side")}</span>
          <div role="group" className="bg-muted inline-flex rounded-lg p-0.5 text-sm">
            {(["buyer", "seller"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={side === option}
                onClick={() => router.replace(`/clients/import?side=${option}`)}
                className={cn(
                  "rounded-md px-3 py-1 transition-colors",
                  side === option ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tCrm(`side.${option}s`)}
              </button>
            ))}
          </div>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={cn(
            "bg-card flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center transition-colors",
            over && "border-primary bg-primary/5"
          )}
        >
          <div className="bg-muted text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-full">
            {reading ? <Loader2 className="size-6 animate-spin" strokeWidth={1.5} /> : <Upload className="size-6" strokeWidth={1.5} />}
          </div>
          {reading ? (
            <p className="text-sm">{t("reading", { name: reading })}</p>
          ) : (
            <p className="text-sm">
              {t("drop")}{" "}
              <button
                type="button"
                className="text-primary font-medium underline-offset-4 hover:underline"
                onClick={() => input.current?.click()}
              >
                {t("browse")}
              </button>
            </p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">{t("types")}</p>
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => void read(event.target.files?.[0])}
            disabled={reading !== null}
          />
        </div>

        {error ? <Notice tone="red">{t(`errors.${error}`)}</Notice> : null}

        <p className="text-muted-foreground text-xs text-pretty">{t("lawful")}</p>
      </div>

      <aside className="space-y-5 text-sm">
        <div className="space-y-2">
          <p className="font-medium">{t("template")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => downloadTemplate("xlsx")} disabled={template !== null}>
              {template === "xlsx" ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
              {t("templateExcel")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => downloadTemplate("csv")} disabled={template !== null}>
              {template === "csv" ? <Loader2 className="animate-spin" /> : <FileText />}
              {t("templateCsv")}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">{t("templateHint")}</p>
        </div>
        <div className="space-y-1.5">
          <p className="font-medium">{t("howTo")}</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-[13px]">
            <li>{t("howToExcel")}</li>
            <li>{t("howToSheets")}</li>
            <li>{t("howToContacts")}</li>
            <li>{t("howToCrm")}</li>
          </ul>
          <p className="text-muted-foreground text-xs">{t("colours")}</p>
        </div>
      </aside>
    </div>
  );
}
