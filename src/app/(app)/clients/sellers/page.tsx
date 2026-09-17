import { ClientsScreen } from "@/components/clients/clients-screen";

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    inactive?: string;
    stage?: string;
    agency?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <ClientsScreen
      side="seller"
      view={sp.view === "kanban" ? "kanban" : "table"}
      includeInactive={sp.inactive === "1"}
      stage={sp.stage}
      agency={sp.agency}
    />
  );
}
