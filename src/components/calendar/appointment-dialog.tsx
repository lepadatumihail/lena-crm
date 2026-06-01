"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const DURATIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

function reminderValue(minutes: number | null): string {
  return minutes == null ? "none" : String(minutes);
}

function toFormValues(
  appointment?: AppointmentWithRefs,
  defaultDateKey?: string
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
    time: "10:00",
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
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: AppointmentWithRefs;
  defaultDateKey?: string;
  clients: CalendarClientOption[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: toFormValues(appointment, defaultDateKey),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(appointment, defaultDateKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment?.id, defaultDateKey]);

  async function onSubmit(values: AppointmentFormValues) {
    const start = new Date(`${values.date}T${values.time}`);
    if (Number.isNaN(start.getTime())) {
      toast.error("Invalid date or time");
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
      toast.error("Couldn't save meeting", { description: error });
      return;
    }
    toast.success(appointment ? "Meeting updated" : "Meeting created");
    onOpenChange(false);
    router.refresh();
  }

  async function onDelete() {
    if (!appointment) return true;
    const { error } = await deleteAppointment(appointment.id);
    if (error) {
      toast.error("Couldn't delete", { description: error });
      return false;
    }
    toast.success("Meeting deleted");
    onOpenChange(false);
    router.refresh();
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Edit meeting" : "New meeting"}
          </DialogTitle>
          <DialogDescription>
            Schedule a meeting with a client and set an optional reminder.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a client…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <div className="text-muted-foreground px-2 py-1.5 text-sm">
                          No clients yet
                        </div>
                      ) : (
                        clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Defaults to client name" {...field} />
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
                  <FormLabel>Date</FormLabel>
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
                  <FormLabel>Time</FormLabel>
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
                  <FormLabel>Duration</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
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
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Office, address, video call…"
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
                  <FormLabel>Reminder</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REMINDER_PRESETS.map((p) => (
                        <SelectItem key={p.label} value={reminderValue(p.value)}>
                          {p.label}
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Anything to remember…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:justify-between">
              {appointment ? (
                <ConfirmDialog
                  title="Delete meeting?"
                  description="This meeting will be permanently deleted."
                  onConfirm={onDelete}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 /> Delete
                    </Button>
                  }
                />
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" />}
                  {appointment ? "Save" : "Create"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
