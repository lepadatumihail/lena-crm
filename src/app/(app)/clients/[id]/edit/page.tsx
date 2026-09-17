import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { getAgencyNames, getClientById } from "@/lib/data/clients";
import { ClientForm } from "@/components/clients/client-form";
import { ShellCrumb } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { clientFullName, type ClientSide } from "@/lib/crm";
import type { ClientFormValues } from "@/lib/validation/client";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const [t, tCommon, agencyOptions] = await Promise.all([
    getTranslations("clients.edit"),
    getTranslations("common"),
    getAgencyNames(),
  ]);
  const side = client.side as ClientSide;
  const defaultValues: Partial<ClientFormValues> = {
    side,
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    language: client.language ?? "",
    nationality: client.nationality ?? "",
    agency: client.agency ?? "",
    notes: client.notes ?? "",
    priority: client.priority,
    deal_type: client.deal_type ?? undefined,
    seller_role: client.seller_role ?? undefined,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ShellCrumb side={side} label={clientFullName(client)} />
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href={`/clients/${id}`}>
            <ArrowLeft /> {tCommon("back")}
          </Link>
        </Button>
        <h2 className="text-xl font-semibold tracking-tight">
          {t("title", { name: clientFullName(client) })}
        </h2>
      </div>
      <ClientForm
        side={side}
        mode="edit"
        clientId={id}
        defaultValues={defaultValues}
        agencyOptions={agencyOptions}
      />
    </div>
  );
}
