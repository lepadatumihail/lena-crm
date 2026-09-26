"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Download, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriceInput } from "@/components/price-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DealSummary,
  type DealLabels,
  type DealView,
} from "@/components/calculator/deal-summary";
import {
  computeDeal,
  formatEuroPrefix,
  formatRate,
  inputFromForm,
} from "@/lib/calculator/deal";
import { intlTag } from "@/i18n/config";
import {
  createDealAnalysis,
  deleteDealAnalysis,
  updateDealAnalysis,
} from "@/lib/actions/deals";
import { dealFormSchema, type DealFormValues } from "@/lib/validation/deal";
import type { DealAnalysis } from "@/lib/supabase/types";

function blankDefaults(today: string): DealFormValues {
  return {
    title: "",
    analysis_date: today,
    property_type: "resale",
    asking_price: "",
    transfer_tax_pct: "7",
    lawyer_pct: "1",
    notary_pct: "0.5",
    renovation_price_per_sqm: "",
    surface_sqm: "",
    contingency_pct: "0",
    duration_months: "12",
    expected_sale_price: "",
    agency_fee_pct: "5",
    notes: "",
  };
}

function rowToForm(row: DealAnalysis): DealFormValues {
  return {
    title: row.title,
    analysis_date: row.analysis_date,
    property_type: row.property_type,
    asking_price: String(Math.round(Number(row.asking_price))),
    transfer_tax_pct: String(row.transfer_tax_pct),
    lawyer_pct: String(row.lawyer_pct),
    notary_pct: String(row.notary_pct),
    renovation_price_per_sqm: String(row.renovation_price_per_sqm),
    surface_sqm: String(row.surface_sqm),
    contingency_pct: String(row.contingency_pct),
    duration_months: String(row.duration_months),
    expected_sale_price: String(Math.round(Number(row.expected_sale_price))),
    agency_fee_pct: String(row.agency_fee_pct),
    notes: row.notes ?? "",
  };
}

function dateLabelFrom(iso: string, tag: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "deal-analysis"
  );
}

export function CalculatorScreen({
  analyses,
  today,
}: {
  analyses: DealAnalysis[];
  today: string;
}) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);

  const t = useTranslations("calculator");
  const tc = useTranslations("common");
  const locale = useLocale();

  const tv = useTranslations("validation");
  const schema = useMemo(() => dealFormSchema(tv), [tv]);
  const form = useForm<DealFormValues>({
    resolver: zodResolver(schema),
    defaultValues: blankDefaults(today),
    mode: "onChange",
  });

  const values = form.watch();
  const input = inputFromForm(values);
  const dateLabel = dateLabelFrom(values.analysis_date, intlTag(locale));
  // Built here, not inside the summary/PDF: @react-pdf renders outside React's
  // tree, so the document can only ever receive already-translated strings.
  const labels: DealLabels = {
    untitled: t("untitled"),
    documentTitle: t("summary.documentTitle"),
    subtitle: t("summary.subtitle", { date: dateLabel }),
    netProfit: t("summary.netProfit"),
    roi: t("summary.roi"),
    irrExit: t("summary.irrExit", { months: input.durationMonths }),
    capitalDeployed: t("summary.capitalDeployed"),
    acquisition: t("summary.acquisition"),
    purchasePrice: t("summary.purchasePrice"),
    transferTax: t("summary.transferTax", { rate: formatRate(input.transferTaxPct) }),
    lawyerFee: t("summary.lawyerFee", { rate: formatRate(input.lawyerPct) }),
    notaryFee: t("summary.notaryFee", { rate: formatRate(input.notaryPct) }),
    totalAcquisition: t("summary.totalAcquisition"),
    project: t("summary.project"),
    projectType: t("summary.projectType"),
    projectTypeValue: t("summary.projectTypeValue", {
      price: formatEuroPrefix(input.renovationPerSqm),
    }),
    surface: t("summary.surface"),
    duration: t("summary.duration"),
    durationValue: t("summary.months", { count: input.durationMonths }),
    baseBuildCost: t("summary.baseBuildCost"),
    contingency: t("summary.contingency", { rate: formatRate(input.contingencyPct) }),
    totalProjectCost: t("summary.totalProjectCost"),
    exitAndReturns: t("summary.exitAndReturns"),
    grossSalePrice: t("summary.grossSalePrice"),
    agentCommission: t("summary.agentCommission", {
      rate: formatRate(input.agencyFeePct),
    }),
    netProceeds: t("summary.netProceeds"),
    netProfitLoss: t("summary.netProfitLoss"),
    returnsByExit: t("summary.returnsByExit"),
    colExit: t("summary.colExit"),
    colNetProfit: t("summary.colNetProfit"),
    colRoi: t("summary.colRoi"),
    colIrr: t("summary.colIrr"),
    confidential: t("summary.confidential"),
    exitRow: (months) => t("summary.months", { count: months }),
  };
  const view: DealView = {
    title: values.title,
    dateLabel,
    input,
    result: computeDeal(input),
    labels,
  };

  function newAnalysis() {
    setCurrentId(null);
    form.reset(blankDefaults(today));
  }

  function loadAnalysis(id: string) {
    const row = analyses.find((a) => a.id === id);
    if (!row) return;
    setCurrentId(id);
    form.reset(rowToForm(row));
  }

  /** Switching property type nudges the default transfer-tax rate (7% / 10%). */
  function onPropertyTypeChange(next: "resale" | "new_build") {
    form.setValue("property_type", next, { shouldDirty: true });
    const tax = form.getValues("transfer_tax_pct").trim();
    if (next === "new_build" && (tax === "7" || tax === "")) {
      form.setValue("transfer_tax_pct", "10", { shouldDirty: true });
    } else if (next === "resale" && (tax === "10" || tax === "")) {
      form.setValue("transfer_tax_pct", "7", { shouldDirty: true });
    }
  }

  const onSave = form.handleSubmit((data) => {
    startTransition(async () => {
      if (currentId) {
        const res = await updateDealAnalysis(currentId, data);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(t("toasts.saved"));
        router.refresh();
      } else {
        const res = await createDealAnalysis(data);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setCurrentId(res.id ?? null);
        toast.success(t("toasts.saved"));
        router.refresh();
      }
    });
  });

  async function onDelete() {
    if (!currentId) return false;
    const res = await deleteDealAnalysis(currentId);
    if (res.error) {
      toast.error(res.error);
      return false;
    }
    toast.success(t("toasts.deleted"));
    setCurrentId(null);
    form.reset(blankDefaults(today));
    router.refresh();
  }

  async function onDownload() {
    setDownloading(true);
    try {
      const { downloadDealPdf } = await import(
        "@/components/calculator/deal-pdf-document"
      );
      await downloadDealPdf(view, `${slugify(view.title)}.pdf`);
    } catch {
      toast.error(t("toasts.pdfFailed"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* The app bar names the page; this line says what it is for, as on Templates. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">{t("subheading")}</p>
        <div className="flex items-center gap-2">
          {/* Transient picker: value stays "" so re-selecting the same saved
              analysis still fires onValueChange and reloads (reverting edits). */}
          <Select value="" onValueChange={loadAnalysis}>
            <SelectTrigger size="sm" className="w-[200px]">
              <SelectValue placeholder={t("savedPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {analyses.length === 0 ? (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                  {t("noSaved")}
                </div>
              ) : (
                analyses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title || t("untitled")}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={newAnalysis}>
            <Plus /> {t("new")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Inputs */}
        <Form {...form}>
          <form
            onSubmit={onSave}
            className="bg-card @container h-fit space-y-5 rounded-xl border p-4 shadow-xs"
          >
            {/* The form's own toolbar, at the page's button size: save is the
                one ink action, the PDF an outline, delete a quiet icon. */}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                {currentId ? tc("save") : t("saveAnalysis")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                {t("pdf")}
              </Button>
              {currentId && (
                <ConfirmDialog
                  title={t("deleteTitle")}
                  description={t("deleteDescription", {
                    title: view.title || t("untitled"),
                  })}
                  onConfirm={onDelete}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive ml-auto"
                      aria-label={t("deleteAria")}
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              )}
            </div>

            <FieldGroup label={t("form.deal")}>
              <TextField
                control={form.control}
                name="title"
                label={t("form.title")}
                placeholder={t("form.titlePlaceholder")}
              />
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="analysis_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.date")}</FormLabel>
                      <FormControl>
                        <Input type="date" className="min-w-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>{t("form.propertyType")}</FormLabel>
                  <Select
                    value={values.property_type}
                    onValueChange={(v) =>
                      onPropertyTypeChange(v as "resale" | "new_build")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resale">{t("form.resale")}</SelectItem>
                      <SelectItem value="new_build">{t("form.newBuild")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>
            </FieldGroup>

            <FieldGroup label={t("form.acquisition")}>
              <MoneyField
                control={form.control}
                name="asking_price"
                label={t("form.askingPrice")}
              />
              <div className="grid grid-cols-3 gap-3">
                <NumField
                  control={form.control}
                  name="transfer_tax_pct"
                  label={t("form.transferPct")}
                />
                <NumField
                  control={form.control}
                  name="lawyer_pct"
                  label={t("form.lawyerPct")}
                />
                <NumField
                  control={form.control}
                  name="notary_pct"
                  label={t("form.notaryPct")}
                />
              </div>
            </FieldGroup>

            <FieldGroup label={t("form.renovation")}>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  control={form.control}
                  name="renovation_price_per_sqm"
                  label={t("form.renoPerSqm")}
                />
                <NumField
                  control={form.control}
                  name="surface_sqm"
                  label={t("form.surfaceSqm")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  control={form.control}
                  name="contingency_pct"
                  label={t("form.contingencyPct")}
                />
                <NumField
                  control={form.control}
                  name="duration_months"
                  label={t("form.durationMonths")}
                />
              </div>
            </FieldGroup>

            <FieldGroup label={t("form.exit")}>
              <MoneyField
                control={form.control}
                name="expected_sale_price"
                label={t("form.expectedSalePrice")}
              />
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  control={form.control}
                  name="agency_fee_pct"
                  label={t("form.agencyFeePct")}
                />
              </div>
            </FieldGroup>

            <FieldGroup label={t("form.notes")}>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder={t("form.notesPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>
          </form>
        </Form>

        {/* Live preview = exactly what the PDF exports */}
        <div className="bg-card overflow-x-auto rounded-xl border p-4 shadow-xs sm:p-6">
          <DealSummary {...view} />
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="section-label text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  );
}

type Ctrl = Control<DealFormValues>;
type Name = FieldPath<DealFormValues>;

function TextField({
  control,
  name,
  label,
  placeholder,
}: {
  control: Ctrl;
  name: Name;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function MoneyField({
  control,
  name,
  label,
}: {
  control: Ctrl;
  name: Name;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <PriceInput
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="0"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function NumField({
  control,
  name,
  label,
}: {
  control: Ctrl;
  name: Name;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input inputMode="decimal" placeholder="0" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
