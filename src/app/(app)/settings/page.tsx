import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SettingsView } from "@/components/settings/settings-view";
import { getSessionProfile, getSessionUser } from "@/lib/data/session";
import { resolveTimeZone } from "@/lib/time-zones";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("meta.title") };
}

/**
 * The agent's own settings. The layout has already read the user and the
 * profile for this request, so both come from its cache.
 */
export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getSessionUser(), getSessionProfile()]);
  return (
    <SettingsView
      email={user?.email ?? ""}
      fullName={profile?.full_name ?? ""}
      timeZone={resolveTimeZone(profile?.time_zone)}
    />
  );
}
