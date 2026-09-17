/**
 * Quiet-buyer nudges. A few buyers each get their own bell row; a crowd of
 * them, as after an import, becomes one row, or the bell would fill with
 * hundreds of "Follow up with…" a week later.
 */
import type { StaleBuyer } from "@/lib/data/attention";

/** From this many quiet buyers, the bell shows one digest row. */
export const FOLLOW_UP_DIGEST_MIN = 6;
const DIGEST_NAMES = 3;

export type FollowUpRow = {
  agent_id: string;
  type: "follow_up";
  title: string;
  body: string | null;
  client_id: string | null;
  appointment_id: null;
  dedupe_key: string;
  due_at: string;
};

export type FollowUpCopy = {
  followUp: (name: string) => string;
  followUpBody: (stage: string, days: number) => string;
  followUpDigest: (count: number) => string;
  followUpDigestMore: (count: number) => string;
  stageName: (stage: string) => string;
};

export function digestKey(weekKey: string): string {
  return `followup-digest:${weekKey}`;
}

/** The pattern of one week's per-client keys, for a `like` filter. */
export function perClientKeyPattern(weekKey: string): string {
  return `followup:%:${weekKey}`;
}

export function followUpRows(
  staleBuyers: readonly StaleBuyer[],
  { agentId, weekKey, nowISO, copy }: { agentId: string; weekKey: string; nowISO: string; copy: FollowUpCopy }
): { rows: FollowUpRow[]; digest: boolean } {
  const base = { agent_id: agentId, type: "follow_up" as const, appointment_id: null, due_at: nowISO };

  if (staleBuyers.length < FOLLOW_UP_DIGEST_MIN) {
    return {
      digest: false,
      rows: staleBuyers.map((b) => ({
        ...base,
        title: copy.followUp(b.name),
        body: copy.followUpBody(copy.stageName(b.stage), b.quietDays),
        client_id: b.clientId,
        dedupe_key: `followup:${b.clientId}:${weekKey}`,
      })),
    };
  }

  const quietest = [...staleBuyers].sort((a, b) => b.quietDays - a.quietDays);
  const names = quietest.slice(0, DIGEST_NAMES).map((b) => b.name);
  const rest = quietest.length - names.length;
  return {
    digest: true,
    rows: [
      {
        ...base,
        title: copy.followUpDigest(quietest.length),
        body: rest > 0 ? `${names.join(", ")} ${copy.followUpDigestMore(rest)}` : names.join(", "),
        client_id: null,
        dedupe_key: digestKey(weekKey),
      },
    ],
  };
}
