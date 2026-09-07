"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  CalendarCheck,
  HandCoins,
  Handshake,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  ScrollText,
  Stamp,
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
import { upsertReservation } from "@/lib/actions/buyer";
import {
  reservationFormSchema,
  type ReservationFormValues,
} from "@/lib/validation/buyer";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { formatCurrency } from "@/lib/crm";
import { DETAIL_LIST, DetailRow } from "@/components/clients/detail-row";
import type { Reservation } from "@/lib/supabase/types";

function fmtDate(d: string | null, locale: string) {
  if (!d) return null;
  try {
    return format(parseISO(d), "d MMM yyyy", { locale: dateFnsLocale(locale) });
  } catch {
    return d;
  }
}

function money(value: number | null, tag: string) {
  return value != null ? formatCurrency(value, tag) : null;
}

/** Pair an amount with the date it happened, e.g. "€50,000 · 4 Jun 2026". */
function amountOn(
  amount: number | null,
  date: string | null,
  locale: string
) {
  const parts = [money(amount, intlTag(locale)), fmtDate(date, locale)].filter(
    Boolean
  );
  return parts.length ? parts.join(" · ") : null;
}

export function ReservationSection({
  clientId,
  reservation,
}: {
  clientId: string;
  reservation: Reservation | null;
}) {
  const t = useTranslations("clientDetail.reservation");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const r = reservation;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
          <Handshake className="text-primary size-4" />
          {t("title")}
        </CardTitle>
          {r?.closed_at && <Badge variant="success">{t("closedBadge")}</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {r ? <Pencil /> : <Plus />}
          {r ? tCommon("edit") : tCommon("add")}
        </Button>
      </CardHeader>
      <CardContent className="@container">
        {r ? (
          <dl className={DETAIL_LIST}>
            <DetailRow
              icon={Wallet}
              label={t("downPayment")}
              value={
                amountOn(r.down_payment, r.down_payment_date, locale) ?? "—"
              }
              className="@sm:col-span-2"
            />
            <DetailRow
              icon={Receipt}
              label={t("ppc")}
              value={amountOn(r.ppc, r.ppc_date, locale) ?? "—"}
              className="@sm:col-span-2"
            />
            <DetailRow
              icon={HandCoins}
              label={t("commission")}
              value={money(r.commission, intlTag(locale)) ?? "—"}
            />
            <DetailRow
              icon={Stamp}
              label={t("notary")}
              value={fmtDate(r.notary_date, locale) ?? "—"}
            />
            <DetailRow
              icon={CalendarCheck}
              label={t("closedRow")}
              value={fmtDate(r.closed_at, locale) ?? "—"}
            />
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        )}
      </CardContent>

      {r?.notary_notes && (
        <div className="bg-muted/30 -mb-6 border-t px-6 py-4">
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <ScrollText className="size-3.5 shrink-0 opacity-70" />
            {t("notaryNotes")}
          </p>
          <p className="mt-1.5 text-sm whitespace-pre-wrap">{r.notary_notes}</p>
        </div>
      )}

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

  const t = useTranslations("clientDetail.reservation");
  const tCommon = useTranslations("common");
  const tv = useTranslations("validation");
  const schema = useMemo(() => reservationFormSchema(tv), [tv]);
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(schema),
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="down_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("downPaymentAmount")}</FormLabel>
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
                    <FormLabel>{t("downPaymentDate")}</FormLabel>
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
                    <FormLabel>{t("ppcAmount")}</FormLabel>
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
                    <FormLabel>{t("ppcDate")}</FormLabel>
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
                    <FormLabel>{t("notaryDate")}</FormLabel>
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
                    <FormLabel>{t("commissionAmount")}</FormLabel>
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
                    <FormLabel>{t("closedDate")}</FormLabel>
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
                  <FormLabel>{t("notaryNotes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={t("notaryNotesPlaceholder")}
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
