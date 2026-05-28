import { getClients } from "@/lib/data/clients";
import { ClientsView } from "@/components/clients/clients-view";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string; view?: string; inactive?: string }>;
}) {
  const sp = await searchParams;
  const side = sp.side === "seller" ? "seller" : "buyer";
  const includeInactive = sp.inactive === "1";
  const view = sp.view === "kanban" ? "kanban" : "table";
  const clients = await getClients(side, { includeInactive });

  return (
    <ClientsView
      clients={clients}
      side={side}
      view={view}
      includeInactive={includeInactive}
    />
  );
}
