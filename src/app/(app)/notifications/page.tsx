import { getNotificationHistory } from "@/lib/data/notifications";
import { NotificationsView } from "@/components/notifications/notifications-view";

export default async function NotificationsPage() {
  const initial = await getNotificationHistory();
  return <NotificationsView initial={initial} />;
}
