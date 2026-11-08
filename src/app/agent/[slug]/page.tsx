import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { AgentPageView } from "@/components/agent-page/agent-page";
import { agentPath } from "@/lib/agent-pages/content";
import { agentPageMetadata } from "@/lib/agent-pages/seo";
import { findPublishedPage, getReplyBucket } from "@/lib/data/agent-pages";

// Every request reads the live page: an agent's edit shows at once.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await findPublishedPage(slug);
  return found ? agentPageMetadata(found.page, found.page.defaultLang) : {};
}

/** /agent/<slug>: the page in its default language. */
export default async function AgentPageRoute({ params }: Params) {
  const { slug } = await params;
  const found = await findPublishedPage(slug);
  if (!found) notFound();
  const { page } = found;
  if (found.byOldSlug) permanentRedirect(agentPath(page.slug));
  const reply = await getReplyBucket(page.id);
  return <AgentPageView page={page} lang={page.defaultLang} reply={reply} />;
}
