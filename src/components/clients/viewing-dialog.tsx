"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SearchSelect } from "@/components/search-select";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker, TimePicker } from "@/components/date-time-picker";
import { PriceInput } from "@/components/price-input";
import { deleteViewing, saveViewing } from "@/lib/actions/buyer";
import {
  viewingFormSchema,
  type ViewingFormValues,
} from "@/lib/validation/buyer";
import { reminderLabel } from "@/i18n/labels";
import { REMINDER_PRESETS } from "@/lib/calendar";
import type { Viewing } from "@/lib/supabase/types";

export type ViewingBuyerOption = { id: string; name: string };

function reminderValue(minutes: number | null): string {
  return minutes == null ? "none" : String(minutes);
}

function toFormValues(
  viewing?: Viewing,
  clientId?: string,
  defaultDateKey?: string,
  defaultTime?: string
): ViewingFormValues {
  const scheduled = viewing?.scheduled_at ? new Date(viewing.scheduled_at) : null;
  return {
    title: viewing?.title ?? "",
    description: viewing?.description ?? "",
    property_price:
      viewing?.property_price != null ? String(viewing.property_price) : "",
    had_offer: viewing?.had_offer ?? false,
    offer_price:
      viewing?.offer_price != null ? String(viewing.offer_price) : "",
    client_id: clientId ?? viewing?.client_id ?? "",
    date: scheduled ? format(scheduled, "yyyy-MM-dd") : defaultDateKey ?? "",
    time: scheduled ? format(scheduled, "HH:mm") : (defaultTime ?? "10:00"),
    reminder: viewing
      ? reminderValue(viewing.reminder_minutes)
      : defaultDateKey
        ? "30"
        : "none",
  };
}

export function ViewingDialog({
  open,
  onOpenChange,
  viewing,
  clientId,
  buyers,
  defaultDateKey,
  defaultTime,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewing?: Viewing;
  /** Fixed buyer (buyer detail page). When omitted, a buyer selector is shown. */
  clientId?: string;
  /** Buyer options for the selector (calendar use). */
  buyers?: ViewingBuyerOption[];
  defaultDateKey?: string;
  /** "HH:mm" to start from, e.g. the slot clicked on the week grid. */
  defaultTime?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const showBuyerSelect = !clientId;

  const t = useTranslations("clientDetail.viewingDialog");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const tv = useTranslations("validation");
  const schema = useMemo(() => viewingFormSchema(tv), [tv]);
  const form = useForm<ViewingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(viewing, clientId, defaultDateKey, defaultTime),
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(viewing, clientId, defaultDateKey, defaultTime));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viewing?.id, clientId, defaultDateKey, defaultTime]);

  const hadOffer = form.watch("had_offer");

  async function onSubmit(values: ViewingFormValues) {
    const targetClientId = clientId || values.client_id || "";
    if (!targetClientId) {
      toast.error(t("chooseBuyer"));
      return;
    }
    let scheduledAt: string | null = null;
    if (values.date) {
      const dt = new Date(`${values.date}T${values.time || "10:00"}`);
      if (Number.isNaN(dt.getTime())) {
        toast.error(t("invalidDateTime"));
        return;
      }
      scheduledAt = dt.toISOString();
    }
    const reminderMinutes =
      scheduledAt && values.reminder !== "none" ? Number(values.reminder) : null;

    setSubmitting(true);
    const { error } = await saveViewing(targetClientId, viewing?.id ?? null, values, {
      scheduled_at: scheduledAt,
      reminder_minutes: reminderMinutes,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t("saveError"), { description: error });
      return;
    }
    toast.success(viewing ? t("updated") : t("added"));
    onOpenChange(false);
    router.refresh();
  }

  async function onDelete() {
    if (!viewing) return true;
    const targetClientId = clientId || viewing.client_id;
    const { error } = await deleteViewing(targetClientId, viewing.id);
    if (error) {
      toast.error(t("deleteError"), { description: error });
      return false;
    }
    toast.success(t("deleted"));
    onOpenChange(false);
    router.refresh();
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewing ? t("edit") : t("add")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showBuyerSelect && (
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("buyer")}</FormLabel>
                    <FormControl>
                      <SearchSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        options={(buyers ?? []).map((b) => ({ value: b.id, label: b.name }))}
                        labels={{
                          placeholder: t("buyerPlaceholder"),
                          search: t("buyerSearch"),
                          none: t("buyerPlaceholder"),
                          empty: (buyers ?? []).length === 0 ? t("noBuyers") : tCommon("noMatch"),
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("propertyTitle")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("propertyTitlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={t("descriptionPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="property_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("askingPrice")}</FormLabel>
                  <FormControl>
                    <PriceInput
                      placeholder="750.000"
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("date")}</FormLabel>
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("time")}</FormLabel>
                  <TimePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-muted-foreground -mt-2 text-xs">
              {t("calendarHint")}
            </p>

            <FormField
              control={form.control}
              name="reminder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reminder")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REMINDER_PRESETS.map((p) => (
                        <SelectItem
                          key={reminderValue(p.value)}
                          value={reminderValue(p.value)}
                        >
                          {reminderLabel(tCrm, p.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="had_offer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="had_offer">{t("madeOffer")}</Label>
                  <FormControl>
                    <Switch
                      id="had_offer"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {hadOffer && (
              <FormField
                control={form.control}
                name="offer_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("offerPrice")}</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder="710.000"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              {viewing ? (
                <ConfirmDialog
                  title={t("deleteConfirmTitle")}
                  description={t("deleteConfirmDescription")}
                  onConfirm={onDelete}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 /> {tCommon("delete")}
                    </Button>
                  }
                />
              ) : (
                <span className="hidden sm:block" />
              )}
              {/* Stacked and full width on a phone, like the other dialogs' footers. */}
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" />}
                  {viewing ? tCommon("save") : t("add")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
