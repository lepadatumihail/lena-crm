import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BedDouble, Building2, Target } from "lucide-react";

import { RowIcon } from "@/components/shell/key-value";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Money } from "@/components/ui/money";
import { intlTag } from "@/i18n/config";
import { propertyTypeLabel } from "@/i18n/labels";
import type { ListingMatch } from "@/lib/data/seller";

/** The agent's own listings that fit this buyer, each a row to the seller. */
export function MatchingListingsSection({
  matches,
}: {
  matches: ListingMatch[];
}) {
  const t = useTranslations("clientDetail.matches");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());

  return (
    <Panel
      title={t("title")}
      icon={<Target className="size-3.5" />}
      count={matches.length}
    >
      {matches.length === 0 ? (
        <PanelEmpty>{t("empty")}</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {matches.map(({ property, sellerId, sellerName }) => {
            const title =
              property.address ||
              (property.property_type
                ? propertyTypeLabel(tCrm, property.property_type)
                : t("propertyFallback"));
            return (
              <li key={property.id}>
                <Link
                  href={`/clients/${sellerId}`}
                  className="hover:bg-muted/40 flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                >
                  <RowIcon icon={Building2} className="mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                      {property.city ? <span>{property.city}</span> : null}
                      {property.bedrooms != null ? (
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="size-3" strokeWidth={1.75} />
                          {property.bedrooms}
                        </span>
                      ) : null}
                      <span>{sellerName}</span>
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
                    <Money value={property.price} locale={tag} />
                  </span>
                  <ArrowRight className="text-muted-foreground/50 size-4 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
