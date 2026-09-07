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
import { formatCurrency, PROPERTY_TYPES } from "@/lib/crm";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="text-primary size-4" />
          {t("title")}
        </CardTitle>
          {properties.length > 0 && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {t("listed", { count: properties.length })}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus /> {t("add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {properties.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          properties.map((p) => (
            <PropertyCard key={p.id} clientId={clientId} property={p} />
          ))
        )}
      </CardContent>

      <PropertyDialog
        clientId={clientId}
        open={adding}
        onOpenChange={setAdding}
      />
    </Card>
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
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          {property.city && (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-sm">
              <MapPin className="size-3.5" /> {property.city}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setEditing(true)}
            aria-label={t("editAria")}
          >
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            title={t("confirmTitle")}
            description={t("confirmDescription", { title })}
            onConfirm={onDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                aria-label={t("deleteAria")}
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {property.property_type && (
          <Badge variant="secondary">
            {propertyTypeLabel(tCrm, property.property_type)}
          </Badge>
        )}
        {property.price != null && (
          <span className="font-medium">
            {formatCurrency(property.price, tag)}
          </span>
        )}
        {property.bedrooms != null && (
          <span className="text-muted-foreground flex items-center gap-1">
            <BedDouble className="size-3.5" /> {property.bedrooms}
          </span>
        )}
      </div>

      {property.notes && (
        <p className="text-muted-foreground mt-2 text-sm">{property.notes}</p>
      )}

      <PropertyDialog
        clientId={clientId}
        property={property}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
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
