"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Bath,
  BedDouble,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";

import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { SteadyLabel } from "@/components/ui/steady-label";
import { Tag } from "@/components/ui/tag";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/price-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { upsertPreferences } from "@/lib/actions/buyer";
import {
  preferencesFormSchema,
  type PreferencesFormValues,
} from "@/lib/validation/buyer";
import { intlTag } from "@/i18n/config";
import { propertyTypeLabel } from "@/i18n/labels";
import {
  formatCurrency,
  PROPERTY_TYPES,
  type PropertyType,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import { KeyValueList, KeyValueRow } from "@/components/shell/key-value";
import type { BuyerPreferences } from "@/lib/supabase/types";

export function PreferencesSection({
  clientId,
  prefs,
}: {
  clientId: string;
  prefs: BuyerPreferences | null;
}) {
  const t = useTranslations("clientDetail.preferences");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const tag = intlTag(useLocale());
  const [open, setOpen] = useState(false);

  function budgetText(min: number | null, max: number | null) {
    if (min != null && max != null) {
      // Guard against a swapped range so it never reads "€50,000 – €30,000".
      return t("budgetRange", {
        min: formatCurrency(Math.min(min, max), tag),
        max: formatCurrency(Math.max(min, max), tag),
      });
    }
    if (min != null) return t("budgetFrom", { amount: formatCurrency(min, tag) });
    if (max != null) return t("budgetUpTo", { amount: formatCurrency(max, tag) });
    return null;
  }

  const budget = prefs ? budgetText(prefs.budget_min, prefs.budget_max) : null;

  return (
    <Panel
      title={t("title")}
      icon={<SlidersHorizontal className="size-3.5" />}
      action={
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground -mr-1.5"
          onClick={() => setOpen(true)}
        >
          {prefs ? <Pencil /> : <Plus />}
          {prefs ? tCommon("edit") : tCommon("add")}
        </Button>
      }
    >
      {prefs ? (
        <KeyValueList>
          <KeyValueRow icon={Home} label={t("propertyTypes")} wrap>
            {prefs.property_types.length ? (
              prefs.property_types.map((type) => (
                <Tag key={type}>{propertyTypeLabel(tCrm, type)}</Tag>
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </KeyValueRow>
          <KeyValueRow icon={Wallet} label={t("budget")}>
            {budget ?? "—"}
          </KeyValueRow>
          <KeyValueRow icon={BedDouble} label={t("bedrooms")}>
            {prefs.bedrooms ?? "—"}
          </KeyValueRow>
          <KeyValueRow icon={Bath} label={t("bathrooms")}>
            {prefs.bathrooms ?? "—"}
          </KeyValueRow>
        </KeyValueList>
      ) : (
        <PanelEmpty>{t("empty")}</PanelEmpty>
      )}

      {prefs?.area_notes ? (
        <div className="bg-muted/30 border-t px-4 py-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} />
            {t("areaNotes")}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{prefs.area_notes}</p>
        </div>
      ) : null}

      <PreferencesDialog
        clientId={clientId}
        prefs={prefs}
        open={open}
        onOpenChange={setOpen}
      />
    </Panel>
  );
}

function PreferencesDialog({
  clientId,
  prefs,
  open,
  onOpenChange,
}: {
  clientId: string;
  prefs: BuyerPreferences | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const t = useTranslations("clientDetail.preferences");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const tv = useTranslations("validation");
  const schema = useMemo(() => preferencesFormSchema(tv), [tv]);
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      property_types: prefs?.property_types ?? [],
      budget_min: prefs?.budget_min != null ? String(prefs.budget_min) : "",
      budget_max: prefs?.budget_max != null ? String(prefs.budget_max) : "",
      bedrooms: prefs?.bedrooms != null ? String(prefs.bedrooms) : "",
      bathrooms: prefs?.bathrooms != null ? String(prefs.bathrooms) : "",
      area_notes: prefs?.area_notes ?? "",
    },
  });

  const selectedTypes = form.watch("property_types");

  function toggleType(type: PropertyType) {
    const set = new Set(selectedTypes);
    if (set.has(type)) set.delete(type);
    else set.add(type);
    form.setValue("property_types", Array.from(set), { shouldDirty: true });
  }

  async function onSubmit(values: PreferencesFormValues) {
    setSubmitting(true);
    const { error } = await upsertPreferences(clientId, values);
    setSubmitting(false);
    if (error) {
      toast.error(t("saveError"), { description: error });
      return;
    }
    toast.success(t("saved"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="property_types"
              render={() => (
                <FormItem>
                  <FormLabel>{t("propertyTypes")}</FormLabel>
                  {/* ChoiceChips' look, with more than one allowed. */}
                  <div className="flex flex-wrap gap-1.5">
                    {PROPERTY_TYPES.map((type) => {
                      const active = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleType(type)}
                          className={cn(
                            "inline-flex h-8 items-center rounded-lg border px-3 text-[13px] whitespace-nowrap outline-none transition-[color,background-color,border-color,scale] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97]",
                            active
                              ? "border-foreground/20 bg-muted text-foreground font-medium"
                              : "bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <SteadyLabel>{propertyTypeLabel(tCrm, type)}</SteadyLabel>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budgetMin")}</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder="500.000"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budgetMax")}</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder="800.000"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bedrooms")}</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bathrooms")}</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="area_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("areaNotes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t("areaNotesPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
