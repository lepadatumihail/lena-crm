"use client";

import { useState } from "react";
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
  Wallet,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  formatCurrency,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  type PropertyType,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import {
  DETAIL_LIST,
  DetailBlock,
  DetailRow,
} from "@/components/clients/detail-row";
import type { BuyerPreferences } from "@/lib/supabase/types";

function budgetText(min: number | null, max: number | null) {
  if (min != null && max != null) {
    // Guard against a swapped range so it never reads "€50,000 – €30,000".
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return `${formatCurrency(lo)} – ${formatCurrency(hi)}`;
  }
  if (min != null) return `From ${formatCurrency(min)}`;
  if (max != null) return `Up to ${formatCurrency(max)}`;
  return null;
}

export function PreferencesSection({
  clientId,
  prefs,
}: {
  clientId: string;
  prefs: BuyerPreferences | null;
}) {
  const [open, setOpen] = useState(false);
  const budget = prefs ? budgetText(prefs.budget_min, prefs.budget_max) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Preferences</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {prefs ? <Pencil /> : <Plus />}
          {prefs ? "Edit" : "Add"}
        </Button>
      </CardHeader>
      <CardContent className="@container">
        {prefs ? (
          <dl className={DETAIL_LIST}>
            <DetailBlock icon={Home} label="Property types">
              {prefs.property_types.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {prefs.property_types.map((t) => (
                    <Badge key={t} variant="secondary">
                      {PROPERTY_TYPE_LABELS[t as PropertyType] ?? t}
                    </Badge>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </DetailBlock>
            <DetailRow icon={Wallet} label="Budget" value={budget ?? "—"} />
            <DetailRow
              icon={BedDouble}
              label="Bedrooms"
              value={prefs.bedrooms ?? "—"}
            />
            <DetailRow
              icon={Bath}
              label="Bathrooms"
              value={prefs.bathrooms ?? "—"}
            />
            {prefs.area_notes && (
              <DetailBlock icon={MapPin} label="Area notes">
                <p className="whitespace-pre-wrap">{prefs.area_notes}</p>
              </DetailBlock>
            )}
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">
            No preferences captured yet. Add what this buyer is looking for.
          </p>
        )}
      </CardContent>

      <PreferencesDialog
        clientId={clientId}
        prefs={prefs}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
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

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
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
      toast.error("Couldn't save preferences", { description: error });
      return;
    }
    toast.success("Preferences saved");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buyer preferences</DialogTitle>
          <DialogDescription>
            Capture what this buyer is looking for.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="property_types"
              render={() => (
                <FormItem>
                  <FormLabel>Property types</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map((t) => {
                      const active = selectedTypes.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleType(t)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-sm transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          )}
                        >
                          {PROPERTY_TYPE_LABELS[t]}
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
                    <FormLabel>Budget min (€)</FormLabel>
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
                    <FormLabel>Budget max (€)</FormLabel>
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
                    <FormLabel>Bedrooms</FormLabel>
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
                    <FormLabel>Bathrooms</FormLabel>
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
                  <FormLabel>Area notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Preferred areas, must-haves…"
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
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
