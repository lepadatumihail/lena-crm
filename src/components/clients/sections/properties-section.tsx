"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  BedDouble,
  Building2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { RowIcon } from "@/components/clients/detail-row";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteProperty, saveProperty } from "@/lib/actions/seller";
import {
  propertyFormSchema,
  type PropertyFormValues,
} from "@/lib/validation/seller";
import { intlTag } from "@/i18n/config";
import { propertyTypeLabel } from "@/i18n/labels";
import { PROPERTY_TYPES } from "@/lib/crm";
import type { Property } from "@/lib/supabase/types";

export function PropertiesSection({
  clientId,
  properties,
}: {
  clientId: string;
  properties: Property[];
}) {
  const t = useTranslations("clientDetail.properties");
  const [adding, setAdding] = useState(false);

  return (
    <Panel
      title={t("title")}
      icon={<Building2 className="size-3.5" />}
      count={properties.length}
      action={
        <Button variant="outline" size="xs" onClick={() => setAdding(true)}>
          <Plus /> {t("add")}
        </Button>
      }
    >
      {properties.length === 0 ? (
        <PanelEmpty>{t("empty")}</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {properties.map((p) => (
            <PropertyCard key={p.id} clientId={clientId} property={p} />
          ))}
        </ul>
      )}

      <PropertyDialog
        clientId={clientId}
        open={adding}
        onOpenChange={setAdding}
      />
    </Panel>
  );
}

function PropertyCard({
  clientId,
  property,
}: {
  clientId: string;
  property: Property;
}) {
  const t = useTranslations("clientDetail.properties");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function onDelete() {
    const { error } = await deleteProperty(clientId, property.id);
    if (error) {
      toast.error(t("deleteError"), { description: error });
      return false;
    }
    toast.success(t("deleted"));
    router.refresh();
    return true;
  }

  const title =
    property.address ||
    (property.property_type
      ? propertyTypeLabel(tCrm, property.property_type)
      : t("fallbackTitle"));

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <RowIcon icon={Building2} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm leading-6 font-medium">{title}</p>
            {property.property_type ? (
              <Tag>{propertyTypeLabel(tCrm, property.property_type)}</Tag>
            ) : null}
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {property.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" strokeWidth={1.75} /> {property.city}
              </span>
            ) : null}
            {property.bedrooms != null ? (
              <span className="inline-flex items-center gap-1">
                <BedDouble className="size-3.5" strokeWidth={1.75} /> {property.bedrooms}
              </span>
            ) : null}
          </p>
          {property.notes ? (
            <p className="text-muted-foreground mt-1 text-[13px]">{property.notes}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-sm font-medium">
          <Money value={property.price} locale={tag} />
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setEditing(true)}
            aria-label={t("editAria")}
          >
            <Pencil />
          </Button>
          <ConfirmDialog
            title={t("confirmTitle")}
            description={t("confirmDescription", { title })}
            onConfirm={onDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("deleteAria")}
              >
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>

      <PropertyDialog
        clientId={clientId}
        property={property}
        open={editing}
        onOpenChange={setEditing}
      />
    </li>
  );
}

function PropertyDialog({
  clientId,
  property,
  open,
  onOpenChange,
}: {
  clientId: string;
  property?: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const t = useTranslations("clientDetail.properties");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const tv = useTranslations("validation");
  const schema = useMemo(() => propertyFormSchema(tv), [tv]);
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      property_type: property?.property_type ?? "",
      price: property?.price != null ? String(property.price) : "",
      bedrooms: property?.bedrooms != null ? String(property.bedrooms) : "",
      address: property?.address ?? "",
      city: property?.city ?? "",
      notes: property?.notes ?? "",
    },
  });

  async function onSubmit(values: PropertyFormValues) {
    setSubmitting(true);
    const { error } = await saveProperty(
      clientId,
      property?.id ?? null,
      values
    );
    setSubmitting(false);
    if (error) {
      toast.error(t("saveError"), { description: error });
      return;
    }
    toast.success(property ? t("updated") : t("added"));
    onOpenChange(false);
    if (!property) form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {property ? t("dialogTitleEdit") : t("add")}
          </DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("typePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {propertyTypeLabel(tCrm, type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price")}</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder="950.000"
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
                      <Input inputMode="numeric" placeholder="4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Marbella" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("addressPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={t("notesPlaceholder")}
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
                {property ? tCommon("save") : t("add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
