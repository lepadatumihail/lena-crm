import { AGENT_OG_SIZE, agentOgImage } from "@/lib/agent-pages/og";
import { findPublishedPage } from "@/lib/data/agent-pages";

export const alt = "An estate agent's page on LeadWing";
export const size = AGENT_OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await findPublishedPage(slug).catch(() => null);
  return agentOgImage(found?.page ?? null, found?.page.defaultLang ?? null);
}
