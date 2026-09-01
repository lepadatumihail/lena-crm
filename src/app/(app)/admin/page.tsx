import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAdminOverview } from "@/lib/data/referrals";
import { AdminView } from "@/components/admin/admin-view";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) redirect("/home");

  const overview = await getAdminOverview();
  return <AdminView overview={overview} />;
}
