import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { ImportWizard } from "@/components/import/import-wizard";
import { Button } from "@/components/ui/button";
import { getImportContext } from "@/lib/actions/import";
import { clientsPath, type ClientSide } from "@/lib/crm";

export async function generateMetadata() {
  const t = await getTranslations("imports.meta");
  return { title: t("title") };
}

export default async function ImportClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>;
}) {
  const sp = await searchParams;
  const side: ClientSide = sp.side === "seller" ? "seller" : "buyer";
  const [t, context] = await Promise.all([getTranslations("imports.page"), getImportContext(side)]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href={clientsPath(side)}>
            <ArrowLeft /> {t("back", { side })}
          </Link>
        </Button>
        <h2 className="text-xl font-semibold tracking-tight">{t("title", { side })}</h2>
        <p className="text-muted-foreground text-sm text-pretty">{t("description")}</p>
      </div>
      <ImportWizard side={side} context={context} />
    </div>
  );
}
