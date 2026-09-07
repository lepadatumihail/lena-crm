import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BedDouble, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { intlTag } from "@/i18n/config";
import { propertyTypeLabel } from "@/i18n/labels";
import { formatCurrency } from "@/lib/crm";
import type { ListingMatch } from "@/lib/data/seller";

export function MatchingListingsSection({
  matches,
}: {
  matches: ListingMatch[];
}) {
  const t = useTranslations("clientDetail.matches");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="text-primary size-4" />
          {t("title", { count: matches.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <div className="space-y-2">
            {matches.map(({ property, sellerId, sellerName }) => {
              const title =
                property.address ||
                (property.property_type
                  ? propertyTypeLabel(tCrm, property.property_type)
                  : t("propertyFallback"));
              return (
                <Link
                  key={property.id}
                  href={`/clients/${sellerId}`}
                  className="bg-muted/40 hover:bg-muted flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                      {property.city && <span>{property.city}</span>}
                      {property.price != null && (
                        <span className="text-foreground font-medium">
                          {formatCurrency(property.price, tag)}
                        </span>
                      )}
                      {property.bedrooms != null && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="size-3" />
                          {property.bedrooms}
                        </span>
                      )}
                      <span>· {sellerName}</span>
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground/50 size-4 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
