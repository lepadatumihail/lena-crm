import { redirect } from "next/navigation";

// Redirect the old /clients (and legacy ?side=) to the path-based lists.
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>;
}) {
  const sp = await searchParams;
  redirect(sp.side === "seller" ? "/clients/sellers" : "/clients/buyers");
}
