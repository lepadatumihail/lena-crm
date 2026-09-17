import { getClientRows } from "@/lib/data/clients";
import { ClientsView } from "@/components/clients/clients-view";
import { stagesForSide, type ClientSide } from "@/lib/crm";

/** Shared list screen rendered by /clients/buyers and /clients/sellers. */
export async function ClientsScreen({
  side,
  view,
  includeInactive,
  stage,
  agency,
}: {
  side: ClientSide;
  view: "table" | "kanban";
  includeInactive: boolean;
  /** Optional `?stage=` from the URL; ignored unless it belongs to this side. */
  stage?: string;
  /** Optional `?agency=` from the URL; the list checks it against its rows. */
  agency?: string;
}) {
  const initialStage =
    stage && (stagesForSide(side) as readonly string[]).includes(stage)
      ? stage
      : "all";
  const clients = await getClientRows(side, { includeInactive });

  return (
    <ClientsView
      clients={clients}
      side={side}
      view={view}
      includeInactive={includeInactive}
      initialStage={initialStage}
      initialAgency={agency}
    />
  );
}
