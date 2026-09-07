import { getCalendarEvents } from "@/lib/data/calendar";
import { getCommissionSummary } from "@/lib/data/buyer";
import { getHomeOverview, getNeedsAttention } from "@/lib/data/dashboard";
import { HomeView } from "@/components/home/home-view";

const DAY = 24 * 60 * 60 * 1000;

export default async function HomePage() {
  const now = new Date();
  const [events, commission, attention, overview] = await Promise.all([
    getCalendarEvents(
      new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      new Date(now.getTime() + 30 * DAY).toISOString()
    ),
    getCommissionSummary(),
    getNeedsAttention(),
    getHomeOverview(),
  ]);

  return (
    <HomeView
      events={events}
      commission={commission}
      attention={attention}
      overview={overview}
      now={now}
    />
  );
}
