import { describe, expect, it } from "vitest";

import { buildProposal, sanitizeExtraction, type ProposalCandidate } from "./proposal";
import type { VoiceExtraction, VoiceExtractionGroup } from "./schema";

const today = "2026-11-08";

function group(over: Partial<VoiceExtractionGroup>): VoiceExtractionGroup {
  return {
    person: { spoken: "the Johnsons", first_name: null, last_name: null, side: "buyer" },
    note: "Showed the villa in Benahavís.",
    spoke_with_them: { channel: "meeting" },
    viewing: null,
    preferences: null,
    stage: null,
    tasks: [],
    appointment: null,
    follow_up: null,
    contact_details: null,
    ...over,
  };
}

function extraction(groups: VoiceExtractionGroup[], over: Partial<VoiceExtraction> = {}): VoiceExtraction {
  return { summary: "Update", groups, unassigned: [], ...over };
}

const candidate = (id: string, first: string, last: string): ProposalCandidate => ({
  id,
  first_name: first,
  last_name: last,
  side: "buyer",
  stage: "viewing",
  phone: null,
  email: null,
  language: null,
  preferences: null,
});

describe("sanitizeExtraction", () => {
  it("keeps a clean group as it is", () => {
    const g = group({
      viewing: { property: "Villa in Benahavís", feedback: "Loved the view", had_offer: false, offer_price: null, property_price: null },
      preferences: { budget_min: null, budget_max: 1500000, bedrooms: null, bathrooms: null, property_types: null, area_notes: null },
      tasks: [{ title: "Call the Johnsons", due_on: "2026-11-13" }],
    });
    const out = sanitizeExtraction(extraction([g]), today);
    expect(out.groups[0].viewing?.property).toBe("Villa in Benahavís");
    expect(out.groups[0].preferences?.budget_max).toBe(1500000);
    expect(out.groups[0].tasks).toEqual([{ title: "Call the Johnsons", due_on: "2026-11-13" }]);
  });

  it("drops bad dates, unknown values and empty preferences", () => {
    const g = group({
      stage: "dreaming",
      tasks: [
        { title: "Call", due_on: "2026-02-30" },
        { title: "  ", due_on: null },
      ],
      preferences: { budget_min: -5, budget_max: null, bedrooms: null, bathrooms: null, property_types: ["castle" as never], area_notes: " " },
    });
    const out = sanitizeExtraction(extraction([g]), today).groups[0];
    expect(out.stage).toBeNull();
    expect(out.tasks).toEqual([{ title: "Call", due_on: null }]);
    expect(out.preferences).toBeNull();
  });

  it("turns an appointment without a usable time into a task for that day", () => {
    const g = group({ appointment: { title: "Viewing day", starts_at: "2026-11-20", duration_minutes: null, location: null } });
    const out = sanitizeExtraction(extraction([g]), today).groups[0];
    expect(out.appointment).toBeNull();
    expect(out.tasks).toEqual([{ title: "Viewing day", due_on: "2026-11-20" }]);
  });

  it("keeps a timed appointment and defaults its length to an hour", () => {
    const g = group({ appointment: { title: "Meet María", starts_at: "2026-11-12T11:00", duration_minutes: 5, location: "San Pedro" } });
    expect(sanitizeExtraction(extraction([g]), today).groups[0].appointment).toEqual({
      title: "Meet María",
      starts_at: "2026-11-12T11:00",
      duration_minutes: 60,
      location: "San Pedro",
    });
  });

  it("reads placeholder words as nothing, so matching falls back to the spoken name", () => {
    // seen live: the model wrote the string "null" for names it didn't hear separately
    const g = group({
      person: { spoken: "Anna Svensson", first_name: "null", last_name: "None", side: "buyer" },
      follow_up: "n/a",
      contact_details: { phone: "null", email: null, language: "unknown", nationality: null },
    });
    const out = sanitizeExtraction(extraction([g]), today).groups[0];
    expect(out.person).toMatchObject({ first_name: null, last_name: null, spoken: "Anna Svensson" });
    expect(out.follow_up).toBeNull();
    expect(out.contact_details).toBeNull();
    const p = buildProposal(sanitizeExtraction(extraction([g]), today), {
      clients: [candidate("anna", "Anna", "Svensson")],
      bound: null,
    });
    expect(p.groups[0].match.kind).toBe("one");
  });

  it("trims text to the app's limits and drops nameless groups", () => {
    const long = "x".repeat(5000);
    const out = sanitizeExtraction(
      extraction([group({ note: long }), group({ person: { spoken: " ", first_name: null, last_name: null, side: null } })], {
        summary: long,
        unassigned: ["Renew Idealista", ""],
      }),
      today
    );
    expect(out.groups).toHaveLength(1);
    expect(out.groups[0].note).toHaveLength(2000);
    expect(out.summary).toHaveLength(200);
    expect(out.unassigned).toEqual(["Renew Idealista"]);
  });
});

describe("buildProposal", () => {
  const clients = [candidate("mark", "Mark", "Johnson"), candidate("anna", "Anna", "Svensson")];

  it("matches each person to the agent's clients", () => {
    const clean = sanitizeExtraction(
      extraction([group({}), group({ person: { spoken: "Pieter", first_name: "Pieter", last_name: null, side: null } })]),
      today
    );
    const p = buildProposal(clean, { clients, bound: null });
    expect(p.groups.map((g) => [g.key, g.match.kind, g.bound])).toEqual([
      ["g0", "one", false],
      ["g1", "none", false],
    ]);
    expect(p.groups[0].match.candidates[0].id).toBe("mark");
  });

  it("ties the only person in a note recorded on a client's page to that client", () => {
    const clean = sanitizeExtraction(extraction([group({ person: { spoken: "she", first_name: null, last_name: null, side: null } })]), today);
    const p = buildProposal(clean, { clients, bound: clients[1] });
    expect(p.groups[0]).toMatchObject({ bound: true, match: { kind: "one" } });
    expect(p.groups[0].match.candidates[0].id).toBe("anna");
  });

  it("still matches other people named in a client-page note", () => {
    const clean = sanitizeExtraction(
      extraction([
        group({ person: { spoken: "Anna Svensson", first_name: "Anna", last_name: "Svensson", side: "buyer" } }),
        group({}),
      ]),
      today
    );
    const p = buildProposal(clean, { clients, bound: clients[1] });
    expect(p.groups.map((g) => [g.match.candidates[0]?.id, g.bound])).toEqual([
      ["anna", true],
      ["mark", false],
    ]);
  });
});
