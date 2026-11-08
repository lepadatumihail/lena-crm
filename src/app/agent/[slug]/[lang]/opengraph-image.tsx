import { isPageLang } from "@/lib/agent-pages/content";
import { AGENT_OG_SIZE, agentOgImage } from "@/lib/agent-pages/og";
import { findPublishedPage } from "@/lib/data/agent-pages";

export const alt = "An estate agent's page on LeadWing";
export const size = AGENT_OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  const { slug, lang } = await params;
  const found = isPageLang(lang) ? await findPublishedPage(slug).catch(() => null) : null;
  const page = found && isPageLang(lang) && found.page.langs.includes(lang) ? found.page : null;
  return agentOgImage(page, page && isPageLang(lang) ? lang : null);
}
