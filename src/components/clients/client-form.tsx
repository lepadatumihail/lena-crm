"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createClient as createClientAction,
  updateClient,
} from "@/lib/actions/clients";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validation/client";
import { LeadPaste } from "@/components/clients/lead-paste";
import { PhoneInput } from "@/components/phone-input";
import { SearchSelect } from "@/components/search-select";
import type { ExtractedLead } from "@/lib/actions/leads";
import { intlTag } from "@/i18n/config";
import {
  dealTypeLabel,
  languageLabel,
  nationalityLabel,
  sellerRoleLabel,
} from "@/i18n/labels";
import { agencyKey } from "@/lib/agencies";
import { countryName, flagEmoji } from "@/lib/countries";
import { LANGUAGES, clientsPath, type ClientSide } from "@/lib/crm";
import { NATIONALITIES } from "@/lib/nationalities";
import type { Enums } from "@/lib/supabase/types";

const DEAL_TYPES: readonly Enums<"deal_type">[] = ["direct", "collab"];
const SELLER_ROLES: readonly Enums<"seller_role">[] = [
  "owner",
  "representative",
];
const MAX_AGENCY_SUGGESTIONS = 8;

export function ClientForm({
  side,
  mode,
  clientId,
  defaultValues,
  agencyOptions,
  compose = null,
}: {
  side: ClientSide;
  mode: "create" | "edit";
  clientId?: string;
  defaultValues?: Partial<ClientFormValues>;
  /** Agency names the agent already uses, most used first. */
  agencyOptions?: { name: string; count: number }[];
  /** Template id to open in the composer right after the client is created. */
  compose?: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const t = useTranslations("clients.form");
  const tCommon = useTranslations("common");
  const tCrm = useTranslations("crm");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const schema = useMemo(() => clientFormSchema(tv), [tv]);
  // Both lists store the English name and show it in the UI language.
  const languageOptions = useMemo(
    () => LANGUAGES.map((l) => ({ value: l, label: languageLabel(tCrm, l) })),
    [tCrm]
  );
  const nationalityOptions = useMemo(() => {
    const collator = new Intl.Collator(intlTag(locale));
    return NATIONALITIES.map((n) => ({
      value: n.name,
      label: nationalityLabel(tCrm, n.name),
      // The country finds it too: "Spain" or "España" for Spanish.
      keywords: [
        countryName(n.iso, locale),
        countryName(n.iso, "en"),
        ...(n.aliases ?? []),
      ],
      prefix: <span className="text-base leading-none">{flagEmoji(n.iso)}</span>,
    })).sort((a, b) => collator.compare(a.label, b.label));
  }, [tCrm, locale]);
  const pickerLabels = {
    placeholder: t("selectPlaceholder"),
    none: t("noChoice"),
    useTyped: (typed: string) => t("useTyped", { value: typed }),
  };
  const agencyChoices = useMemo(
    () =>
      (agencyOptions ?? []).map((o) => ({
        name: o.name,
        key: agencyKey(o.name),
      })),
    [agencyOptions]
  );
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      side,
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      language: "",
      nationality: "",
      agency: "",
      notes: "",
      priority: false,
      deal_type: undefined,
      seller_role: undefined,
      ...defaultValues,
    },
  });

  async function onSubmit(values: ClientFormValues) {
    setSubmitting(true);
    if (mode === "create") {
      const res = await createClientAction(values);
      if (res.limitReached) {
        setSubmitting(false);
        toast.error(res.error ?? t("toasts.limitTitle"), {
          description: t("toasts.limitDescription"),
          action: {
            label: t("toasts.seePlans"),
            onClick: () => router.push("/pricing"),
          },
        });
        return;
      }
      if (res.error || !res.id) {
        setSubmitting(false);
        toast.error(t("toasts.createFailed"), {
          description: res.error ?? undefined,
        });
        return;
      }
      toast.success(t("toasts.created"));
      router.push(
        compose
          ? `/clients/${res.id}?compose=${encodeURIComponent(compose)}`
          : `/clients/${res.id}`,
      );
    } else {
      const res = await updateClient(clientId!, values);
      setSubmitting(false);
      if (res.error) {
        toast.error(t("toasts.saveFailed"), { description: res.error });
        return;
      }
      toast.success(t("toasts.saved"));
      router.push(`/clients/${clientId}`);
      router.refresh();
    }
  }

  const cancelHref =
    mode === "edit" && clientId ? `/clients/${clientId}` : clientsPath(side);

  function applyLead(data: ExtractedLead) {
    if (data.first_name)
      form.setValue("first_name", data.first_name, { shouldDirty: true });
    if (data.last_name)
      form.setValue("last_name", data.last_name, { shouldDirty: true });
    if (data.email) form.setValue("email", data.email, { shouldDirty: true });
    if (data.phone) form.setValue("phone", data.phone, { shouldDirty: true });
    if (data.language)
      form.setValue("language", data.language, { shouldDirty: true });
    if (data.nationality)
      form.setValue("nationality", data.nationality, { shouldDirty: true });
    if (data.notes) form.setValue("notes", data.notes, { shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {mode === "create" && <LeadPaste onApply={applyLead} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("firstName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("firstNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("lastName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("lastNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("phone")}</FormLabel>
                <PhoneInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("language")}</FormLabel>
                <FormControl>
                  <SearchSelect
                    value={field.value ?? ""}
                    onChange={(next) =>
                      form.setValue("language", next, { shouldDirty: true })
                    }
                    options={languageOptions}
                    labels={{ ...pickerLabels, search: t("languageSearch") }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nationality")}</FormLabel>
                <FormControl>
                  <SearchSelect
                    value={field.value ?? ""}
                    onChange={(next) =>
                      form.setValue("nationality", next, { shouldDirty: true })
                    }
                    options={nationalityOptions}
                    labels={{ ...pickerLabels, search: t("nationalitySearch") }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          {side === "buyer" ? (
            <FormField
              control={form.control}
              name="deal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dealType")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEAL_TYPES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {dealTypeLabel(tCrm, v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="seller_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("role")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SELLER_ROLES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {sellerRoleLabel(tCrm, v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="agency"
            render={({ field }) => {
              // Names already in use, narrowed by what is typed; the one
              // already in the field is not offered again.
              const typed = agencyKey(field.value);
              const suggestions = agencyChoices
                .filter((o) => o.key.includes(typed) && o.key !== typed)
                .slice(0, MAX_AGENCY_SUGGESTIONS);
              return (
                <FormItem>
                  <FormLabel>{t("agency")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("agencyPlaceholder")} {...field} />
                  </FormControl>
                  {suggestions.length > 0 ? (
                    <div
                      role="group"
                      aria-label={t("agencySuggestions")}
                      className="flex flex-wrap gap-1.5"
                    >
                      {suggestions.map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          aria-label={t("useAgency", { name: o.name })}
                          onClick={() =>
                            form.setValue("agency", o.name, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className="bg-primary/10 text-primary hover:bg-primary/15 focus-visible:ring-ring/50 inline-flex min-h-8 max-w-full items-center rounded-full px-2.5 text-xs font-medium outline-none focus-visible:ring-[3px]"
                        >
                          <span className="truncate">{o.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <FormDescription>{t("agencyDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("notes")}</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder={t("notesPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>{t("priority")}</FormLabel>
                <FormDescription>{t("priorityDescription")}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(cancelHref)}
            disabled={submitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {mode === "create" ? t("create") : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
