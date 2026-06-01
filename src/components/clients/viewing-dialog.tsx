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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { deleteViewing, saveViewing } from "@/lib/actions/buyer";
import {
  viewingFormSchema,
  type ViewingFormValues,
} from "@/lib/validation/buyer";
import { REMINDER_PRESETS } from "@/lib/calendar";
import type { Viewing } from "@/lib/supabase/types";

export type ViewingBuyerOption = { id: string; name: string };

function reminderValue(minutes: number | null): string {
  return minutes == null ? "none" : String(minutes);
}

function toFormValues(
  viewing?: Viewing,
  clientId?: string,
  defaultDateKey?: string
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
    time: scheduled ? format(scheduled, "HH:mm") : "10:00",
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewing?: Viewing;
  /** Fixed buyer (buyer detail page). When omitted, a buyer selector is shown. */
  clientId?: string;
  /** Buyer options for the selector (calendar use). */
  buyers?: ViewingBuyerOption[];
  defaultDateKey?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const showBuyerSelect = !clientId;

  const form = useForm<ViewingFormValues>({
    resolver: zodResolver(viewingFormSchema),
    defaultValues: toFormValues(viewing, clientId, defaultDateKey),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(viewing, clientId, defaultDateKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viewing?.id, clientId, defaultDateKey]);

  const hadOffer = form.watch("had_offer");

  async function onSubmit(values: ViewingFormValues) {
    const targetClientId = clientId || values.client_id || "";
    if (!targetClientId) {
      toast.error("Choose a buyer");
      return;
    }
    let scheduledAt: string | null = null;
    if (values.date) {
      const dt = new Date(`${values.date}T${values.time || "10:00"}`);
      if (Number.isNaN(dt.getTime())) {
        toast.error("Invalid date or time");
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
      toast.error("Couldn't save viewing", { description: error });
      return;
    }
    toast.success(viewing ? "Viewing updated" : "Viewing added");
    onOpenChange(false);
    router.refresh();
  }

  async function onDelete() {
    if (!viewing) return true;
    const targetClientId = clientId || viewing.client_id;
    const { error } = await deleteViewing(targetClientId, viewing.id);
    if (error) {
      toast.error("Couldn't delete", { description: error });
      return false;
    }
    toast.success("Viewing deleted");
    onOpenChange(false);
    router.refresh();
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewing ? "Edit viewing" : "Add viewing"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showBuyerSelect && (
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a buyer…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(buyers ?? []).length === 0 ? (
                          <div className="text-muted-foreground px-2 py-1.5 text-sm">
                            No buyers yet
                          </div>
                        ) : (
                          (buyers ?? []).map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Property title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="3-bed apartment, Nueva Andalucía"
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Notes about the property…" {...field} />
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
                  <FormLabel>Asking price (€)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="750000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">
              Set a date to show this viewing on your calendar.
            </p>

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
              name="had_offer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="had_offer">Made an offer</Label>
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
                    <FormLabel>Offer price (€)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="710000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              {viewing ? (
                <ConfirmDialog
                  title="Delete viewing?"
                  description="This removes the viewing and its attachments. This can’t be undone."
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
                  {viewing ? "Save" : "Add viewing"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
