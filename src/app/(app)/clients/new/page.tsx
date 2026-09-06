import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { canAddClient } from "@/lib/access";
import { ClientForm } from "@/components/clients/client-form";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { Button } from "@/components/ui/button";
import { clientsPath, type ClientSide } from "@/lib/crm";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>;
}) {
  const sp = await searchParams;
  const side: ClientSide = sp.side === "seller" ? "seller" : "buyer";

  // Free agents hold FREE_CLIENT_LIMIT clients. Show the prompt instead of a
  // form that would only fail on submit. No profile row = let the form try;
  // the database trigger is the backstop either way.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status, pro_until, is_admin")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);
  const blocked = profile ? !canAddClient(profile, count ?? 0) : false;

  if (blocked) {
    return <UpgradePrompt backHref={clientsPath(side)} backLabel={`Back to ${side}s`} />;
  }

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
