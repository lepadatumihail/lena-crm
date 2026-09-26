"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import { stageLabel } from "@/i18n/labels";
import { clientFullName, formatCurrency, type ClientSide } from "@/lib/crm";
import type { RowOutcome, WarningCode } from "@/lib/import/build";
import { cn } from "@/lib/utils";

import { countOutcomes, readyRows } from "./wizard-state";

const PREVIEW_ROWS = 50;

function budgetText(min: number | null, max: number | null, locale: string): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${formatCurrency(min, locale)} – ${formatCurrency(max, locale)}`;
  return min != null ? `≥ ${formatCurrency(min, locale)}` : `≤ ${formatCurrency(max, locale)}`;
}

export function ReviewStep({
  side,
  outcomes,
  skipExisting,
  onSkipExistingChange,
  capacity,
  limit,
  clientCount,
  onBack,
  onImport,
}: {
  side: ClientSide;
  outcomes: RowOutcome[];
  skipExisting: boolean;
  onSkipExistingChange: (value: boolean) => void;
  capacity: number | null;
  limit: number | null;
  clientCount: number;
  onBack: () => void;
  onImport: () => void;
}) {
  const t = useTranslations("imports.review");
  const tWarnings = useTranslations("imports.warnings");
  const tSkips = useTranslations("imports.skips");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const ids = useId();
  const [showAll, setShowAll] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);

  const counts = useMemo(() => countOutcomes(outcomes), [outcomes]);
  const ready = useMemo(() => readyRows(outcomes), [outcomes]);
  const needALook = useMemo(
    () =>
      outcomes.filter(
        (o) => (o.status === "skipped" && o.reason !== "filteredOut") || (o.status === "ready" && o.warnings.length > 0)
      ),
    [outcomes]
  );
  /* The rows the Free plan couldn't take, before the cap turned them away. */
  const wanted = counts.ready + counts.skipped.overCap;
  const capped = capacity !== null && limit !== null && counts.skipped.overCap > 0;
  const shown = showAll ? ready : ready.slice(0, PREVIEW_ROWS);

  const tiles: { label: string; value: number }[] = [
    { label: t("counts.ready"), value: counts.ready },
    { label: t("counts.withNotes"), value: counts.withNotes },
    { label: t("counts.existing"), value: counts.skipped.duplicateExisting },
    { label: t("counts.repeated"), value: counts.skipped.duplicateInFile },
    { label: t("counts.filteredOut"), value: counts.skipped.filteredOut },
    { label: t("counts.noName"), value: counts.skipped.noName },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-card rounded-xl border px-3 py-2.5">
            <dt className="text-muted-foreground truncate text-xs">{tile.label}</dt>
            <dd className={cn("text-xl font-medium tabular-nums", tile.value === 0 && "text-muted-foreground/60")}>{tile.value}</dd>
          </div>
        ))}
      </dl>

      <label htmlFor={`${ids}-skip`} className="bg-card flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3">
        <Switch id={`${ids}-skip`} checked={skipExisting} onCheckedChange={onSkipExistingChange} className="mt-0.5" />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium">{t("skipExisting")}</span>
          <span className="text-muted-foreground block text-[13px]">{t("skipExistingHint")}</span>
        </span>
      </label>

      {ready.length === 0 ? (
        <Notice tone="amber">{t("nothingReady")}</Notice>
      ) : (
        <section className="bg-card overflow-hidden rounded-xl border">
          <header className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
            <h3 className="text-[13px] font-medium">
              {showAll || ready.length <= PREVIEW_ROWS ? t("previewAll") : t("preview", { count: PREVIEW_ROWS })}
            </h3>
            {ready.length > PREVIEW_ROWS ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-muted-foreground -mr-1.5"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? t("preview", { count: PREVIEW_ROWS }) : t("previewAll")}
              </Button>
            ) : null}
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground section-label">
                <tr className="border-b [&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-normal">
                  <th className="w-12">{t("line")}</th>
                  <th>{t("name")}</th>
                  {side === "buyer" ? (
                    <>
                      <th>{t("email")}</th>
                      <th>{t("phone")}</th>
                      <th>{t("agency")}</th>
                      <th>{t("stage")}</th>
                      <th>{t("budget")}</th>
                    </>
                  ) : (
                    <>
                      <th>{t("phone")}</th>
                      <th>{t("properties")}</th>
                      <th>{t("city")}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {shown.map((outcome) => {
                  const { row } = outcome;
                  return (
                    <tr key={outcome.lines[0]} className="[&>td]:px-3 [&>td]:py-2 [&>td]:align-top">
                      <td className="text-muted-foreground tabular-nums">{outcome.lines[0]}</td>
                      <td>
                        <div className="font-medium">{clientFullName(row)}</div>
                        {outcome.warnings.length ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {outcome.warnings.map((code: WarningCode) => (
                              <Tag key={code} tone="amber">
                                {tWarnings(code)}
                              </Tag>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      {side === "buyer" ? (
                        <>
                          <td className="text-muted-foreground">{row.email ?? "—"}</td>
                          <td className="whitespace-nowrap tabular-nums">{row.phone ?? "—"}</td>
                          <td className="text-muted-foreground">{row.agency ?? "—"}</td>
                          <td>{stageLabel(tCrm, row.stage)}</td>
                          <td className="whitespace-nowrap tabular-nums">
                            {budgetText(row.preferences?.budget_min ?? null, row.preferences?.budget_max ?? null, locale)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="whitespace-nowrap tabular-nums">{row.phone ?? "—"}</td>
                          <td className="tabular-nums">{row.properties.length}</td>
                          <td className="text-muted-foreground">{row.properties[0]?.city ?? "—"}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {needALook.length > 0 ? (
        <section className="bg-card overflow-hidden rounded-xl border">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium"
            aria-expanded={lookOpen}
            onClick={() => setLookOpen((v) => !v)}
          >
            {t("needALook", { count: needALook.length })}
            <ChevronDown className={cn("text-muted-foreground size-4 transition-transform", lookOpen && "rotate-180")} />
          </button>
          {lookOpen ? (
            <div className="overflow-x-auto border-t">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground section-label">
                  <tr className="border-b [&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-normal">
                    <th className="w-12">{t("line")}</th>
                    <th>{t("reason")}</th>
                    <th>{t("cells")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {needALook.map((outcome) => (
                    <tr key={`${outcome.status}-${outcome.lines[0]}`} className="[&>td]:px-3 [&>td]:py-2 [&>td]:align-top">
                      <td className="text-muted-foreground tabular-nums">{outcome.lines.join(", ")}</td>
                      <td className="whitespace-nowrap">
                        {outcome.status === "skipped"
                          ? tSkips(outcome.reason)
                          : outcome.warnings.map((code) => tWarnings(code)).join(" · ")}
                      </td>
                      <td className="text-muted-foreground max-w-xl truncate" title={outcome.source[0]?.filter(Boolean).join(" · ")}>
                        {outcome.source[0]?.filter(Boolean).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {capped ? (
        <Notice tone="amber">
          {t("freeNotice", { limit, count: clientCount, capacity, ready: wanted })}
        </Notice>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft /> {t("back")}
        </Button>
        <div className="flex flex-wrap gap-2">
          {capped ? (
            <>
              <Button type="button" variant="outline" onClick={onImport} disabled={counts.ready === 0}>
                {t("importSome", { count: counts.ready })}
              </Button>
              <Button asChild>
                <Link href="/pricing">
                  {t("upgrade", { count: wanted })} <ArrowRight />
                </Link>
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onImport} disabled={counts.ready === 0}>
              {t("import", { count: counts.ready })} <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
