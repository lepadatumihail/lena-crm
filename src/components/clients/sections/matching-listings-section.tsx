import Link from "next/link";
import { ArrowRight, BedDouble } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCurrency,
  PROPERTY_TYPE_LABELS,
  type PropertyType,
} from "@/lib/crm";
import type { ListingMatch } from "@/lib/data/seller";

export function MatchingListingsSection({
  matches,
}: {
  matches: ListingMatch[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Matching listings{matches.length > 0 ? ` (${matches.length})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            None of your seller listings match this buyer&apos;s preferences
            yet.
          </p>
        ) : (
          <div className="space-y-2">
            {matches.map(({ property, sellerId, sellerName }) => {
              const title =
                property.address ||
                (property.property_type
                  ? PROPERTY_TYPE_LABELS[
                      property.property_type as PropertyType
                    ] ?? property.property_type
                  : "Property");
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
                          {formatCurrency(property.price)}
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
