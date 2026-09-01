import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFeedToken } from "@/lib/calendar-feed-token";
import { buildICS, type ICSEvent } from "@/lib/ics";

type Embedded<T> = T | T[] | null;
function one<T>(v: Embedded<T>): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}
function fullName(c: { first_name: string; last_name: string } | null): string | null {
  return c ? `${c.first_name} ${c.last_name}`.trim() : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: raw } = await params;
  const agentId = verifyFeedToken(raw.replace(/\.ics$/i, ""));
  if (!agentId) return new Response("Not found", { status: 404 });

  const admin = createAdminClient();
  const since = new Date(
    new Date().getTime() - 60 * 24 * 60 * 60 * 1000
  ).toISOString();

  type ApptRow = {
    id: string;
    title: string | null;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    notes: string | null;
    client: Embedded<{ first_name: string; last_name: string }>;
  };
  type ViewRow = {
    id: string;
    title: string | null;
    description: string | null;
    scheduled_at: string;
    client: Embedded<{ first_name: string; last_name: string }>;
  };

  const [apptRes, viewRes] = await Promise.all([
    admin
      .from("appointments")
      .select(
        "id, title, starts_at, ends_at, location, notes, client:clients(first_name, last_name)"
      )
      .eq("agent_id", agentId)
      .gte("starts_at", since),
    admin
      .from("viewings")
      .select(
        "id, title, description, scheduled_at, client:clients(first_name, last_name)"
      )
      .eq("agent_id", agentId)
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", since),
  ]);

  const events: ICSEvent[] = [];

  for (const a of (apptRes.data ?? []) as unknown as ApptRow[]) {
    const start = new Date(a.starts_at);
    const cn = fullName(one(a.client));
    events.push({
      uid: `leadwing-appt-${a.id}@leadwing.app`,
      start,
      end: a.ends_at ? new Date(a.ends_at) : new Date(start.getTime() + 3600000),
      summary: a.title?.trim() || (cn ? `Meeting with ${cn}` : "Meeting"),
      description: a.notes,
      location: a.location,
    });
  }

  for (const v of (viewRes.data ?? []) as unknown as ViewRow[]) {
    const start = new Date(v.scheduled_at);
    const cn = fullName(one(v.client));
    events.push({
      uid: `leadwing-view-${v.id}@leadwing.app`,
      start,
      end: new Date(start.getTime() + 3600000),
      summary: v.title?.trim() || (cn ? `Viewing with ${cn}` : "Viewing"),
      description: v.description,
    });
  }

  const ics = buildICS("LeadWing", events);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": 'inline; filename="leadwing.ics"',
    },
  });
}
