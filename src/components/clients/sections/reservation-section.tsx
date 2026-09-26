"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  HandCoins,
  Handshake,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  ScrollText,
  Wallet,
} from "lucide-react";

import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
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
import { upsertReservation } from "@/lib/actions/buyer";
import {
  reservationFormSchema,
  type ReservationFormValues,
} from "@/lib/validation/buyer";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { formatCurrency } from "@/lib/crm";
import { calendarDaysFromToday } from "@/lib/attention";
import { cn } from "@/lib/utils";
import { KeyValueList, KeyValueRow } from "@/components/shell/key-value";
import type { Reservation } from "@/lib/supabase/types";
import { TONE_SOLID } from "@/lib/tones";

function money(value: number | null, tag: string) {
  return value != null ? formatCurrency(value, tag) : null;
}

type Milestone = { key: string; label: string; date: string | null };

/**
 * Down payment → PPC → notary → closed as a four-step track. Passed dates
 * are filled green, the next dated step is an ink dot with a halo and how
 * far off it is, later steps stay hollow.
 */
function MilestoneTrack({
  reservation: r,
  todayKey,
}: {
  reservation: Reservation;
  todayKey: string;
}) {
  const t = useTranslations("clientDetail.reservation");
  const tRelative = useTranslations("home.attention.relative");
  const locale = useLocale();

  const steps: Milestone[] = [
    { key: "down", label: t("downPayment"), date: r.down_payment_date },
    { key: "ppc", label: t("ppc"), date: r.ppc_date },
    { key: "notary", label: t("notary"), date: r.notary_date },
    { key: "closed", label: t("closedRow"), date: r.closed_at },
  ];
  // A closed deal completed every step, dated or not.
  const done = steps.map((s) =>
    r.closed_at ? true : s.date != null && s.date <= todayKey
  );
  const next = r.closed_at
    ? -1
    : steps.findIndex((s, i) => !done[i] && s.date != null);

  function relative(date: string) {
    const days = calendarDaysFromToday(date, todayKey);
    if (days <= 0) return tRelative("today");
    if (days === 1) return tRelative("tomorrow");
    return tRelative("inDays", { count: days });
  }

  return (
    <ol className="grid grid-cols-4 px-4 pt-4 pb-3.5">
      {steps.map((step, i) => {
        const state = done[i] ? "done" : i === next ? "next" : "todo";
        return (
          <li
            key={step.key}
            aria-current={state === "next" ? "step" : undefined}
            className="min-w-0"
          >
            <div aria-hidden className="flex h-3.5 items-center">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  state === "done" && TONE_SOLID.green,
                  state === "next" && cn(TONE_SOLID.ink, "ring-foreground/10 ring-4"),
                  state === "todo" && "border-muted-foreground/35 border-2"
                )}
              />
              {i < steps.length - 1 ? (
                <span
                  className={cn(
                    "mx-2 h-px flex-1",
                    done[i + 1] ? cn(TONE_SOLID.green, "opacity-50") : "bg-border"
                  )}
                />
              ) : null}
            </div>
            <p className="text-muted-foreground mt-2 pr-2 text-xs leading-tight break-words">
              {step.label}
            </p>
            <p className="mt-0.5 truncate pr-2 text-[13px] tabular-nums">
              {step.date ? fmtShort(step.date, locale) : "—"}
            </p>
            {state === "next" && step.date ? (
              <p className="text-foreground truncate pr-2 text-xs">
                {relative(step.date)}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function fmtShort(d: string, locale: string) {
  try {
    return format(parseISO(d), "d MMM", { locale: dateFnsLocale(locale) });
  } catch {
    return d;
  }
}

export function ReservationSection({
  clientId,
  reservation,
  todayKey,
}: {
  clientId: string;
  reservation: Reservation | null;
  /** Today in the agent's time zone ("yyyy-MM-dd"), from the server. */
  todayKey: string;
}) {
  const t = useTranslations("clientDetail.reservation");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const r = reservation;

  return (
    <Panel
      title={t("title")}
      icon={<Handshake className="size-3.5" />}
      action={
        <div className="flex items-center gap-2">
          {r?.closed_at ? (
            <Tag tone="green">
              {t("closedBadge")}
            </Tag>
          ) : null}
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground -mr-1.5"
            onClick={() => setOpen(true)}
          >
            {r ? <Pencil /> : <Plus />}
            {r ? tCommon("edit") : tCommon("add")}
          </Button>
        </div>
      }
    >
      {r ? (
        <>
          <MilestoneTrack reservation={r} todayKey={todayKey} />
          <KeyValueList className="border-t">
            <KeyValueRow icon={Wallet} label={t("downPayment")}>
              {money(r.down_payment, intlTag(locale)) ?? "—"}
            </KeyValueRow>
            <KeyValueRow icon={Receipt} label={t("ppc")}>
              {money(r.ppc, intlTag(locale)) ?? "—"}
            </KeyValueRow>
            <KeyValueRow icon={HandCoins} label={t("commission")}>
              {money(r.commission, intlTag(locale)) ?? "—"}
            </KeyValueRow>
          </KeyValueList>
        </>
      ) : (
        <PanelEmpty>{t("empty")}</PanelEmpty>
      )}

      {r?.notary_notes ? (
        <div className="bg-muted/30 border-t px-4 py-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ScrollText className="size-3.5 shrink-0" strokeWidth={1.75} />
            {t("notaryNotes")}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{r.notary_notes}</p>
        </div>
      ) : null}

      <ReservationDialog
        clientId={clientId}
        reservation={r}
        open={open}
        onOpenChange={setOpen}
      />
    </Panel>
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
