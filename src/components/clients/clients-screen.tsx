import { getClients } from "@/lib/data/clients";
import { getCommissionSummary } from "@/lib/data/buyer";
import { ClientsView } from "@/components/clients/clients-view";
import type { ClientSide } from "@/lib/crm";

/** Shared list screen rendered by /clients/buyers and /clients/sellers. */
export async function ClientsScreen({
  side,
  view,
  includeInactive,
}: {
  side: ClientSide;
  view: "table" | "kanban";
  includeInactive: boolean;
}) {
  const [clients, commission] = await Promise.all([
    getClients(side, { includeInactive }),
    side === "buyer" ? getCommissionSummary() : Promise.resolve(null),
  ]);

  return (
    <ClientsView
      clients={clients}
      side={side}
      view={view}
      includeInactive={includeInactive}
      commission={commission}
    />
  );
}
