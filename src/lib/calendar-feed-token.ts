import { createHmac, timingSafeEqual } from "crypto";

// The feed token is a signed agent id (HMAC), so no DB storage is needed.
// Reuses the service-role key as a stable, secret signing key.
function secret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return s;
}

/** Signed, URL-safe token encoding an agent id: "<b64url id>.<hmac>". */
export function feedToken(agentId: string): string {
  const sig = createHmac("sha256", secret()).update(agentId).digest("base64url");
  const id = Buffer.from(agentId).toString("base64url");
  return `${id}.${sig}`;
}

/** Verify a feed token and return the agent id, or null if invalid. */
export function verifyFeedToken(token: string): string | null {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const idPart = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let agentId: string;
  try {
    agentId = Buffer.from(idPart, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!agentId) return null;

  const expected = createHmac("sha256", secret())
    .update(agentId)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? agentId : null;
}
