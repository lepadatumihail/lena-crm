import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { AgentPageView } from "@/components/agent-page/agent-page";
import { agentPath, isPageLang } from "@/lib/agent-pages/content";
import { AGENT_PAGE_VIEWPORT, agentPageMetadata } from "@/lib/agent-pages/seo";
import { findPublishedPage, getReplyBucket } from "@/lib/data/agent-pages";

export const dynamic = "force-dynamic";
export const viewport = AGENT_PAGE_VIEWPORT;

type Params = { params: Promise<{ slug: string; lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, lang } = await params;
  if (!isPageLang(lang)) return {};
  const found = await findPublishedPage(slug);
  if (!found || !found.page.langs.includes(lang)) return {};
  return agentPageMetadata(found.page, lang);
}

/**
 * /agent/<slug>/<lang>: the page in one of its other languages. The default
 * language lives at the bare /agent/<slug>, so asking for it here forwards
 * there; a language the page doesn't have is a 404.
 */
export default async function AgentPageLangRoute({ params }: Params) {
  const { slug, lang } = await params;
  if (!isPageLang(lang)) notFound();
  const found = await findPublishedPage(slug);
  if (!found) notFound();
  const { page } = found;
  if (!page.langs.includes(lang)) notFound();
  if (found.byOldSlug || lang === page.defaultLang) {
    permanentRedirect(agentPath(page.slug, lang, page.defaultLang));
  }
  const reply = await getReplyBucket(page.id);
  return <AgentPageView page={page} lang={lang} reply={reply} />;
}
