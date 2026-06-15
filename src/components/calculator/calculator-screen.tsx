"use client";

import { useState, useTransition } from "react";
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
import { DealSummary } from "@/components/calculator/deal-summary";
import { computeDeal, inputFromForm } from "@/lib/calculator/deal";
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

function dateLabelFrom(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
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

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: blankDefaults(today),
    mode: "onChange",
  });

  const values = form.watch();
  const input = inputFromForm(values);
  const view = {
    title: values.title,
    dateLabel: dateLabelFrom(values.analysis_date),
    input,
    result: computeDeal(input),
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
        toast.success("Analysis saved");
        router.refresh();
      } else {
        const res = await createDealAnalysis(data);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setCurrentId(res.id ?? null);
        toast.success("Analysis saved");
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
    toast.success("Analysis deleted");
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
      toast.error("Could not generate the PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Profit calculator
          </h1>
          <p className="text-muted-foreground text-sm">
            Underwrite a buy-renovate-sell deal and export a one-page PDF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Transient picker: value stays "" so re-selecting the same saved
              analysis still fires onValueChange and reloads (reverting edits). */}
          <Select value="" onValueChange={loadAnalysis}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Saved analyses…" />
            </SelectTrigger>
            <SelectContent>
              {analyses.length === 0 ? (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                  No saved analyses yet
                </div>
              ) : (
                analyses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title || "Untitled deal"}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={newAnalysis}>
            <Plus /> New
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Inputs */}
        <Form {...form}>
          <form
            onSubmit={onSave}
            className="bg-card @container h-fit space-y-5 rounded-xl border p-4"
          >
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                {currentId ? "Save" : "Save analysis"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                PDF
              </Button>
              {currentId && (
                <ConfirmDialog
                  title="Delete analysis?"
                  description={`“${view.title || "Untitled deal"}” will be removed.`}
                  onConfirm={onDelete}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete analysis"
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              )}
            </div>

            <FieldGroup label="Deal">
              <TextField
                control={form.control}
                name="title"
                label="Title"
                placeholder="Renovation Project Coto Real"
              />
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="analysis_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="min-w-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Property type</FormLabel>
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
                      <SelectItem value="resale">Resale</SelectItem>
                      <SelectItem value="new_build">New build</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>
            </FieldGroup>

            <FieldGroup label="Acquisition">
              <MoneyField
                control={form.control}
                name="asking_price"
                label="Asking price (€)"
              />
              <div className="grid grid-cols-3 gap-3">
                <NumField
                  control={form.control}
                  name="transfer_tax_pct"
                  label="Transfer (%)"
                />
                <NumField
                  control={form.control}
                  name="lawyer_pct"
                  label="Lawyer (%)"
                />
                <NumField
                  control={form.control}
                  name="notary_pct"
                  label="Notary (%)"
                />
              </div>
            </FieldGroup>

            <FieldGroup label="Renovation / project">
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  control={form.control}
                  name="renovation_price_per_sqm"
                  label="Reno (€/m²)"
                />
                <NumField
                  control={form.control}
                  name="surface_sqm"
                  label="Surface (m²)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  control={form.control}
                  name="contingency_pct"
                  label="Contingency (%)"
                />
                <NumField
                  control={form.control}
                  name="duration_months"
                  label="Duration (months)"
                />
              </div>
            </FieldGroup>

            <FieldGroup label="Exit">
              <MoneyField
                control={form.control}
                name="expected_sale_price"
                label="Expected sale price (€)"
              />
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  control={form.control}
                  name="agency_fee_pct"
                  label="Agency fee (%)"
                />
              </div>
            </FieldGroup>

            <FieldGroup label="Notes">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Internal notes (not shown on the PDF)…"
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
        <div className="bg-card overflow-x-auto rounded-xl border p-6">
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
      <h3 className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">
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
