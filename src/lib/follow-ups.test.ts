import { describe, expect, it } from "vitest";

import { FOLLOW_UP_DIGEST_MIN, digestKey, followUpRows, perClientKeyPattern, type FollowUpCopy } from "./follow-ups";

const copy: FollowUpCopy = {
  followUp: (name) => `Follow up with ${name}`,
  followUpBody: (stage, days) => `${stage} · ${days} days`,
  followUpDigest: (count) => `${count} buyers have gone quiet`,
  followUpDigestMore: (count) => `and ${count} more`,
  stageName: (stage) => stage.toUpperCase(),
};
const buyers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ clientId: `c${i}`, name: `Buyer ${i}`, firstName: "Buyer", stage: "new", quietDays: 7 + i }));
const options = { agentId: "a1", weekKey: "2026-W38", nowISO: "2026-09-18T08:00:00.000Z", copy };

describe("followUpRows", () => {
  it("keeps one row per buyer under the threshold", () => {
    const { rows, digest } = followUpRows(buyers(FOLLOW_UP_DIGEST_MIN - 1), options);
    expect(digest).toBe(false);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({
      agent_id: "a1",
      type: "follow_up",
      title: "Follow up with Buyer 0",
      body: "NEW · 7 days",
      client_id: "c0",
      appointment_id: null,
      dedupe_key: "followup:c0:2026-W38",
      due_at: options.nowISO,
    });
  });

  it("folds a crowd into one row, quietest first", () => {
    const { rows, digest } = followUpRows(buyers(FOLLOW_UP_DIGEST_MIN), options);
    expect(digest).toBe(true);
    expect(rows).toEqual([
      {
        agent_id: "a1",
        type: "follow_up",
        title: "6 buyers have gone quiet",
        body: "Buyer 5, Buyer 4, Buyer 3 and 3 more",
        client_id: null,
        appointment_id: null,
        dedupe_key: "followup-digest:2026-W38",
        due_at: options.nowISO,
      },
    ]);
  });

  it("gives an empty week no rows", () => {
    expect(followUpRows([], options)).toEqual({ rows: [], digest: false });
  });

  it("keys the digest apart from the per-client rows", () => {
    expect(digestKey("2026-W38")).toBe("followup-digest:2026-W38");
    expect(perClientKeyPattern("2026-W38")).toBe("followup:%:2026-W38");
    // The per-client pattern must not catch the digest.
    expect("followup-digest:2026-W38".startsWith("followup:")).toBe(false);
  });
});
