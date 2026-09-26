"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

import { reminderLabel } from "@/i18n/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { saveAppointment, deleteAppointment } from "@/lib/actions/calendar";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/lib/validation/calendar";
import { REMINDER_PRESETS } from "@/lib/calendar";
import type {
  AppointmentWithRefs,
  CalendarClientOption,
} from "@/lib/data/calendar";

const DURATIONS = ["30", "45", "60", "90", "120"] as const;
const REMINDER_VALUES = REMINDER_PRESETS.map((p) => p.value);

function reminderValue(minutes: number | null): string {
  return minutes == null ? "none" : String(minutes);
}

function toFormValues(
  appointment?: AppointmentWithRefs,
  defaultDateKey?: string,
  defaultTime?: string
): AppointmentFormValues {
  if (appointment) {
    const start = new Date(appointment.starts_at);
    const duration = appointment.ends_at
      ? Math.max(
          15,
          Math.round(
            (new Date(appointment.ends_at).getTime() - start.getTime()) / 60000
          )
        )
      : 60;
    return {
      type: "meeting",
      title: appointment.title ?? "",
      client_id: appointment.client_id ?? "",
      property_id: "",
      property_label: "",
      date: format(start, "yyyy-MM-dd"),
      time: format(start, "HH:mm"),
      duration_minutes: String(duration),
      location: appointment.location ?? "",
      notes: appointment.notes ?? "",
      reminder: reminderValue(appointment.reminder_minutes),
    };
  }
  return {
    type: "meeting",
    title: "",
    client_id: "",
    property_id: "",
    property_label: "",
    date: defaultDateKey ?? format(new Date(), "yyyy-MM-dd"),
    time: defaultTime ?? "10:00",
    duration_minutes: "60",
    location: "",
    notes: "",
    reminder: "30",
  };
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  defaultDateKey,
  defaultTime,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: AppointmentWithRefs;
  defaultDateKey?: string;
  /** "HH:mm" to start from, e.g. the slot clicked on the week grid. */
  defaultTime?: string;
  clients: CalendarClientOption[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const tCrm = useTranslations("crm");
  const tv = useTranslations("validation");
  const schema = useMemo(() => appointmentFormSchema(tv), [tv]);
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(appointment, defaultDateKey, defaultTime),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(appointment, defaultDateKey, defaultTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment?.id, defaultDateKey, defaultTime]);

  async function onSubmit(values: AppointmentFormValues) {
    const start = new Date(`${values.date}T${values.time}`);
    if (Number.isNaN(start.getTime())) {
      toast.error(t("toasts.invalidDateTime"));
      return;
    }
    const duration = Number(values.duration_minutes) || 60;
    const ends = new Date(start.getTime() + duration * 60000);

    setSubmitting(true);
    const { error } = await saveAppointment(appointment?.id ?? null, {
      type: "meeting",
      title: values.title?.trim() || null,
      client_id: values.client_id || null,
      property_id: null,
      property_label: null,
      starts_at: start.toISOString(),
      ends_at: ends.toISOString(),
      location: values.location?.trim() || null,
      notes: values.notes?.trim() || null,
      reminder_minutes: values.reminder === "none" ? null : Number(values.reminder),
    });
    setSubmitting(false);
    if (error) {
      toast.error(t("toasts.saveFailed"), { description: error });
      return;
    }
    toast.success(t(appointment ? "toasts.updated" : "toasts.created"));
    onOpenChange(false);
    router.refresh();
  }

  async function onDelete() {
    if (!appointment) return true;
    const { error } = await deleteAppointment(appointment.id);
    if (error) {
      toast.error(t("toasts.deleteFailed"), { description: error });
      return false;
    }
    toast.success(t("toasts.deleted"));
    onOpenChange(false);
    router.refresh();
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(appointment ? "form.editTitle" : "form.newTitle")}
          </DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.client")}</FormLabel>
                  <FormControl>
                    <SearchSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={clients.map((c) => ({ value: c.id, label: c.name }))}
                      labels={{
                        placeholder: t("form.clientPlaceholder"),
                        search: t("form.clientSearch"),
                        none: t("form.clientPlaceholder"),
                        empty: clients.length === 0 ? t("form.noClients") : tCommon("noMatch"),
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.titlePlaceholder")} {...field} />
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
                  <FormLabel>{t("form.date")}</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.time")}</FormLabel>
                  <TimePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.duration")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("form.duration")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {t(`durations.${d}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.location")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.locationPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.reminder")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REMINDER_VALUES.map((minutes) => (
                        <SelectItem
                          key={reminderValue(minutes)}
                          value={reminderValue(minutes)}
                        >
                          {reminderLabel(tCrm, minutes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.notes")}</FormLabel>
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

            <DialogFooter className="gap-2 sm:justify-between">
              {appointment ? (
                <ConfirmDialog
                  title={t("form.deleteTitle")}
                  description={t("form.deleteDescription")}
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
                <span />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" />}
                  {appointment ? tCommon("save") : t("actions.create")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
