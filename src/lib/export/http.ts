/**
 * What the two export routes share: the request checks, the signed-in agent's
 * context and the download response. The proxy already sends anonymous
 * requests to /login, but a route handler checks the session itself.
 */
import { getLocale, getTranslations } from "next-intl/server";

import { asLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { resolveTimeZone } from "@/lib/time-zones";
import type { TransferContext } from "@/lib/transfer/format";

export function jsonError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/** False for a request another site made with the agent's cookies. */
export function isSameOrigin(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export type ExportSession = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
  ctx: TransferContext;
};

/**
 * The signed-in agent and their language and time zone, or null when there is
 * no session. getUser() asks Supabase Auth, so a session ended on another
 * device stops exporting at once rather than when its token expires.
 */
export async function exportSession(): Promise<ExportSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [locale, t, tt, profile] = await Promise.all([
    getLocale(),
    getTranslations("crm"),
    getTranslations("transfer"),
    supabase.from("profiles").select("time_zone").eq("id", user.id).maybeSingle(),
  ]);
  return {
    supabase,
    userId: user.id,
    email: user.email ?? null,
    ctx: {
      locale: asLocale(locale),
      timeZone: resolveTimeZone(profile.data?.time_zone),
      t,
      tt,
    },
  };
}

/** A file the browser saves rather than shows, never cached. */
export function attachment(
  body: string | Uint8Array,
  { fileName, contentType }: { fileName: string; contentType: string }
): Response {
  // `filename` must be ASCII; `filename*` carries the real name for browsers that read it.
  const ascii = fileName.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "");
  return new Response(typeof body === "string" ? body : new Uint8Array(body), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
