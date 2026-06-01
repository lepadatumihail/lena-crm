"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Loader2, Pencil, Plus } from "lucide-react";

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
import { upsertReservation } from "@/lib/actions/buyer";
import {
  reservationFormSchema,
  type ReservationFormValues,
} from "@/lib/validation/buyer";
import { formatCurrency } from "@/lib/crm";
import type { Reservation } from "@/lib/supabase/types";

function fmtDate(d: string | null) {
  if (!d) return null;
  try {
    return format(parseISO(d), "d MMM yyyy");
  } catch {
    return d;
  }
}

export function ReservationSection({
  clientId,
  reservation,
}: {
  clientId: string;
  reservation: Reservation | null;
}) {
  const [open, setOpen] = useState(false);
  const r = reservation;

  const rows: { label: string; value: string | null }[] = r
    ? [
        { label: "Down payment", value: formatCurrency(r.down_payment) },
        { label: "Down payment date", value: fmtDate(r.down_payment_date) },
        { label: "PPC", value: formatCurrency(r.ppc) },
        { label: "PPC date", value: fmtDate(r.ppc_date) },
        { label: "Notary", value: fmtDate(r.notary_date) },
        { label: "Commission", value: formatCurrency(r.commission) },
        { label: "Closed", value: fmtDate(r.closed_at) },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Reservation</CardTitle>
          {r?.closed_at && <Badge variant="success">Closed</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {r ? <Pencil /> : <Plus />}
          {r ? "Edit" : "Add"}
        </Button>
      </CardHeader>
      <CardContent>
        {r ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-muted-foreground text-xs">{row.label}</dt>
                <dd className="mt-1 text-sm font-medium">
                  {row.value ?? "—"}
                </dd>
              </div>
            ))}
            {r.notary_notes && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs">Notary notes</dt>
                <dd className="mt-1 text-sm">{r.notary_notes}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">
            Offer accepted? Record the reservation details here.
          </p>
        )}
      </CardContent>

      <ReservationDialog
        clientId={clientId}
        reservation={r}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  );
}

function ReservationDialog({
  clientId,
  reservation,
  open,
  onOpenChange,
}: {
  clientId: string;
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      down_payment:
        reservation?.down_payment != null
          ? String(reservation.down_payment)
          : "",
      down_payment_date: reservation?.down_payment_date ?? "",
      ppc: reservation?.ppc != null ? String(reservation.ppc) : "",
      ppc_date: reservation?.ppc_date ?? "",
      notary_date: reservation?.notary_date ?? "",
      notary_notes: reservation?.notary_notes ?? "",
      commission:
        reservation?.commission != null ? String(reservation.commission) : "",
      closed_at: reservation?.closed_at ?? "",
    },
  });

  async function onSubmit(values: ReservationFormValues) {
    setSubmitting(true);
    const { error } = await upsertReservation(clientId, values);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't save reservation", { description: error });
      return;
    }
    toast.success("Reservation saved");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reservation details</DialogTitle>
          <DialogDescription>
            Reservation, payment and completion details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="down_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Down payment (€)</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder="50.000"
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
                name="down_payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Down payment date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ppc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PPC (€)</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder="75.000"
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
                name="ppc_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PPC date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notary_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notary date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (€)</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder="18.000"
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
                name="closed_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closed date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notary_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notary notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Notary, completion notes…" {...field} />
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
