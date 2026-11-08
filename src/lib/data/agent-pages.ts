import { cache } from "react";

import {
  isSlug,
  pageFromRow,
  type AgentPage,
} from "@/lib/agent-pages/content";
import type { ReplyBucket } from "@/lib/agent-pages/copy";
import { replyBucket } from "@/lib/agent-pages/enquiry";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { PageEnquiry } from "@/lib/supabase/types";

/** Where agent photos are served from (a public bucket). */
export const AGENT_PHOTO_BASE = `${SUPABASE_URL}/storage/v1/object/public/agent-photos`;

/** How far back the reply-time line looks. */
const REPLY_WINDOW_DAYS = 90;

export type FoundPage = {
  page: AgentPage;
  /** Reached through an earlier slug: the caller forwards to the current one. */
  byOldSlug: boolean;
};

/**
 * A published page by its slug or one of its earlier slugs. Public pages are
 * read with the service role and filtered to published rows here, so the
 * table needs no anonymous policy. A database error is thrown, not reported
 * as "no such page": a 404 for a live page could get it dropped from search.
 */
export const findPublishedPage = cache(async (slug: string): Promise<FoundPage | null> => {
  if (!isSlug(slug)) return null;
  const { data, error } = await createAdminClient()
    .from("agent_pages")
    .select("*")
    .eq("published", true)
    // The slug passed isSlug, so it is only [a-z0-9-] and safe in a filter.
    .or(`slug.eq.${slug},previous_slugs.cs.{${slug}}`)
    .limit(2);
  if (error) throw new Error(`agent page lookup failed: ${error.message}`);
  const row = data.find((r) => r.slug === slug) ?? data[0];
  if (!row) return null;
  const page = pageFromRow(row, AGENT_PHOTO_BASE);
  return page ? { page, byOldSlug: row.slug !== slug } : null;
});

/**
 * The page's reply-time band from its recent enquiries, or null when there
 * isn't enough to say (or the read fails: no line is better than a wrong one).
 */
export const getReplyBucket = cache(async (pageId: string): Promise<ReplyBucket | null> => {
  const now = new Date();
  const since = new Date(now.getTime() - REPLY_WINDOW_DAYS * 86_400_000).toISOString();
  const { data, error } = await createAdminClient()
    .from("page_enquiries")
    .select("received_at, first_reply_at")
    .eq("page_id", pageId)
    .gte("received_at", since)
    .order("received_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("reply-time read failed:", error.message);
    return null;
  }
  return replyBucket(data, now);
});

/** Pages for the sitemap: live, real ones. Errors leave them out, never break it. */
export async function listLivePages(): Promise<AgentPage[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("agent_pages")
      .select("*")
      .eq("published", true)
      .eq("is_example", false)
      .order("updated_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    return data.flatMap((row) => pageFromRow(row, AGENT_PHOTO_BASE) ?? []);
  } catch (error) {
    console.error("agent pages for the sitemap:", error instanceof Error ? error.message : error);
    return [];
  }
}

export type ClientPageEnquiry = Pick<
  PageEnquiry,
  "received_at" | "first_reply_at" | "lang" | "kind"
>;

/**
 * The enquiry that brought a client in, for the client screen; the signed-in
 * agent's own rows only (RLS). A missing table or a failed read shows nothing.
 */
export async function getClientPageEnquiry(clientId: string): Promise<ClientPageEnquiry | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_enquiries")
    .select("received_at, first_reply_at, lang, kind")
    .eq("client_id", clientId)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}
