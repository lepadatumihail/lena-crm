import { getClientRows } from "@/lib/data/clients";
import { getCommissionSummary } from "@/lib/data/buyer";
import { ClientsView } from "@/components/clients/clients-view";
import { stagesForSide, type ClientSide } from "@/lib/crm";

/** Shared list screen rendered by /clients/buyers and /clients/sellers. */
export async function ClientsScreen({
  side,
  view,
  includeInactive,
  stage,
}: {
  side: ClientSide;
  view: "table" | "kanban";
  includeInactive: boolean;
  /** Optional `?stage=` from the URL; ignored unless it belongs to this side. */
  stage?: string;
}) {
  const initialStage =
    stage && (stagesForSide(side) as readonly string[]).includes(stage)
      ? stage
      : "all";
  const [clients, commission] = await Promise.all([
    getClientRows(side, { includeInactive }),
    side === "buyer" ? getCommissionSummary() : Promise.resolve(null),
  ]);

  return (
    <ClientsView
      clients={clients}
      side={side}
      view={view}
      includeInactive={includeInactive}
      initialStage={initialStage}
      commission={commission}
    />
  );
}
