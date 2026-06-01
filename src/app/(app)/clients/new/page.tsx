import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { clientsPath, type ClientSide } from "@/lib/crm";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>;
}) {
  const sp = await searchParams;
  const side: ClientSide = sp.side === "seller" ? "seller" : "buyer";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href={clientsPath(side)}>
            <ArrowLeft /> Back to {side}s
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          New {side}
        </h1>
        <p className="text-muted-foreground text-sm">
          Add a new {side} to your pipeline.
        </p>
      </div>
      <ClientForm side={side} mode="create" />
    </div>
  );
}
