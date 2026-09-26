"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stageLabel } from "@/i18n/labels";
import { agencyOptions } from "@/lib/agencies";
import { COUNTRIES, countryName, flagEmoji } from "@/lib/countries";
import { stagesForSide, type ClientSide, type Stage } from "@/lib/crm";
import { autoMap } from "@/lib/import/auto-map";
import { NAME_TARGETS, SHARED_TARGETS, targetGroups, type ImportTarget } from "@/lib/import/fields";
import type { ImportSheet } from "@/lib/import/read";
import { IMPORT_MAX_ROWS } from "@/lib/validation/import";
import { cn } from "@/lib/utils";

import { dataRows, type Choices } from "./wizard-state";

const EXAMPLES = 3;
const FILTER_VALUES = 30;
const NONE = "__none__";

export function ColumnsStep({
  side,
  sheets,
  sheetIndex,
  onSheetChange,
  choices,
  agencies,
  rowsOver,
  onBack,
  onContinue,
}: {
  side: ClientSide;
  sheets: ImportSheet[];
  sheetIndex: number;
  onSheetChange: (index: number) => void;
  choices: Choices;
  agencies: readonly string[];
  /** Data rows under the header when there are too many, else null. */
  rowsOver: number | null;
  onBack: () => void;
  onContinue: (choices: Choices) => void;
}) {
  const t = useTranslations("imports.columns");
  const tAll = useTranslations("imports");
  const tTargets = useTranslations("imports.targets");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const ids = useId();
  const sheet = sheets[sheetIndex];
  const [draft, setDraft] = useState<Choices>(choices);

  const headers = sheet.grid[draft.headerRow] ?? [];
  const rows = useMemo(() => dataRows(sheet, draft.headerRow), [sheet, draft.headerRow]);

  function moveHeader(delta: number) {
    const headerRow = Math.min(Math.max(0, draft.headerRow + delta), sheet.grid.length - 1);
    const nextHeaders = sheet.grid[headerRow] ?? [];
    setDraft({
      ...draft,
      headerRow,
      mapping: autoMap(nextHeaders, dataRows(sheet, headerRow), side),
      settings: { ...draft.settings, filter: null },
    });
  }

  function setTarget(column: number, target: ImportTarget) {
    const mapping = draft.mapping.map((choice, i) => {
      if (i === column) return { target };
      // A field one column can hold moves: the previous holder becomes a note.
      if (choice.target === target && !SHARED_TARGETS.includes(target)) return { target: "add_to_notes" as const };
      return choice;
    });
    setDraft({ ...draft, mapping });
  }

  const examples = (column: number) => {
    const seen: string[] = [];
    for (const row of rows) {
      const value = row[column];
      if (value && !seen.includes(value)) seen.push(value);
      if (seen.length === EXAMPLES) break;
    }
    return seen;
  };

  const hasName = draft.mapping.some((c) => NAME_TARGETS.includes(c.target));
  const groups = targetGroups(side);

  /* Row filter: the distinct values of one column, most common first. */
  const filterColumn = draft.settings.filter?.column ?? null;
  const filterValues = useMemo(() => {
    if (filterColumn === null) return [];
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = row[filterColumn] ?? "";
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale));
  }, [rows, filterColumn, locale]);

  function setFilterColumn(value: string) {
    const column = value === NONE ? null : Number(value);
    setDraft({
      ...draft,
      settings: { ...draft.settings, filter: column === null ? null : { column, values: [] } },
    });
  }

  function toggleFilterValue(value: string, checked: boolean) {
    if (!draft.settings.filter) return;
    const values = checked
      ? [...draft.settings.filter.values, value]
      : draft.settings.filter.values.filter((v) => v !== value);
    setDraft({ ...draft, settings: { ...draft.settings, filter: { ...draft.settings.filter, values } } });
  }

  const agencyNames = useMemo(() => agencyOptions(agencies).map((a) => a.name), [agencies]);
  const canContinue = hasName && rowsOver === null && (draft.settings.filter?.values.length ?? 1) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        {sheets.length > 1 ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-sheet`}>{t("sheet")}</Label>
            <Select value={String(sheetIndex)} onValueChange={(v) => onSheetChange(Number(v))}>
              <SelectTrigger id={`${ids}-sheet`} className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((s, i) => (
                  <SelectItem key={s.name + i} value={String(i)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <span className="block text-sm leading-none">{t("headerRow")}</span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon-sm" onClick={() => moveHeader(-1)} disabled={draft.headerRow === 0} aria-label="−1">
              <Minus />
            </Button>
            <span className="min-w-8 text-center text-sm tabular-nums">{sheet.rowNumbers[draft.headerRow]}</span>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => moveHeader(1)} disabled={draft.headerRow >= sheet.grid.length - 1} aria-label="+1">
              <Plus />
            </Button>
          </div>
        </div>
      </div>

      {rowsOver !== null ? (
        <Notice tone="red">{tAll("file.errors.tooManyRows", { count: rowsOver, max: IMPORT_MAX_ROWS })}</Notice>
      ) : null}

      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="text-muted-foreground section-label hidden grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_14rem] gap-4 border-b px-4 py-2 md:grid">
          <span>{t("header")}</span>
          <span>{t("examples")}</span>
          <span>{t("importAs")}</span>
        </div>
        <ul className="divide-y">
          {headers.map((header, column) => {
            const choice = draft.mapping[column];
            const sample = examples(column);
            return (
              <li key={column} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_14rem] md:items-center md:gap-4">
                <div className="min-w-0 truncate text-sm font-medium" title={header}>
                  {header || <span className="text-muted-foreground font-normal">{tAll("notesLabels.column", { n: column + 1 })}</span>}
                </div>
                <div className="text-muted-foreground min-w-0 truncate text-[13px]" title={sample.join(" · ")}>
                  {sample.length ? sample.join(" · ") : t("noExamples")}
                </div>
                <Select value={choice?.target ?? "ignore"} onValueChange={(v) => setTarget(column, v as ImportTarget)}>
                  <SelectTrigger
                    size="sm"
                    aria-label={`${t("importAs")}: ${header}`}
                    className={cn("w-full", (choice?.target === "ignore" || choice?.target === "add_to_notes") && "text-muted-foreground")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectGroup key={group.group}>
                        <SelectLabel>{t(`groups.${group.group}`, { side })}</SelectLabel>
                        {group.targets.map((target) => (
                          <SelectItem key={target} value={target}>
                            {tTargets(target)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            );
          })}
        </ul>
      </div>
      {(["email", "phone"] as const).some((target) => draft.mapping.filter((c) => c.target === target).length > 1) ? (
        <p className="text-muted-foreground -mt-3 text-xs">{t("shared")}</p>
      ) : null}
      {!hasName ? <Notice tone="amber">{t("needName")}</Notice> : null}

      <section className="bg-card space-y-4 rounded-xl border p-4">
        <h3 className="section-label text-muted-foreground">{t("settings")}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-agency`}>{t("agency")}</Label>
            <Input
              id={`${ids}-agency`}
              list={`${ids}-agencies`}
              value={draft.settings.agency}
              placeholder={t("agencyPlaceholder")}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, agency: e.target.value } })}
            />
            <datalist id={`${ids}-agencies`}>
              {agencyNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-dial`}>{t("country")}</Label>
            <Select
              value={draft.settings.defaultDial}
              onValueChange={(defaultDial) => setDraft({ ...draft, settings: { ...draft.settings, defaultDial } })}
            >
              <SelectTrigger id={`${ids}-dial`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.iso} value={c.dial}>
                    {flagEmoji(c.iso)} {countryName(c.iso, locale)} <span className="text-muted-foreground">{c.dial}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-stage`}>{t("stage")}</Label>
            <Select
              value={draft.settings.stage}
              onValueChange={(stage) => setDraft({ ...draft, settings: { ...draft.settings, stage: stage as Stage } })}
            >
              <SelectTrigger id={`${ids}-stage`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stagesForSide(side).map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stageLabel(tCrm, stage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor={`${ids}-filter`}>{t("filter")}</Label>
            <span className="text-muted-foreground text-sm">{t("filterColumn")}</span>
            <Select value={filterColumn === null ? NONE : String(filterColumn)} onValueChange={setFilterColumn}>
              <SelectTrigger id={`${ids}-filter`} size="sm" className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("filterAny")}</SelectItem>
                {headers.map((header, column) => (
                  <SelectItem key={column} value={String(column)}>
                    {header || tAll("notesLabels.column", { n: column + 1 })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterColumn !== null ? <span className="text-muted-foreground text-sm">{t("filterValues")}</span> : null}
          </div>
          {filterColumn !== null ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {filterValues.slice(0, FILTER_VALUES).map(([value, count]) => {
                const id = `${ids}-fv-${value}`;
                return (
                  <label key={value} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      id={id}
                      checked={draft.settings.filter?.values.includes(value) ?? false}
                      onCheckedChange={(checked) => toggleFilterValue(value, checked === true)}
                    />
                    <span className={cn(!value && "text-muted-foreground")}>{value || t("filterEmpty")}</span>
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                  </label>
                );
              })}
              {filterValues.length > FILTER_VALUES ? (
                <span className="text-muted-foreground text-xs">{t("filterMore", { count: filterValues.length - FILTER_VALUES })}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft /> {tAll("steps.file")}
        </Button>
        <Button type="button" onClick={() => onContinue(draft)} disabled={!canContinue}>
          {t("continue")} <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
