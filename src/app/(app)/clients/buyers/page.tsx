import { ClientsScreen } from "@/components/clients/clients-screen";

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; inactive?: string }>;
}) {
  const sp = await searchParams;
  return (
    <ClientsScreen
      side="buyer"
      view={sp.view === "kanban" ? "kanban" : "table"}
      includeInactive={sp.inactive === "1"}
    />
  );
}
