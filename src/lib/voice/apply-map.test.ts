import { describe, expect, it } from "vitest";

import { activityNoteSchema, logContactSchema } from "@/lib/validation/activity";
import { preferencesFormSchema, viewingFormSchema } from "@/lib/validation/buyer";
import { appointmentInputSchema } from "@/lib/validation/calendar";
import { clientFormSchema } from "@/lib/validation/client";
import type { ValidationT } from "@/lib/validation/i18n";
import { taskInputSchema } from "@/lib/validation/task";

import {
  mergePreferences,
  stageChange,
  toAppointmentInput,
  toClientValues,
  toTaskInputs,
  toTimelineEntry,
  toViewingValues,
} from "./apply-map";
import { voiceApplySchema } from "./schema";

const t: ValidationT = (key) => key;
const clientId = "0a1b2c3d-4e5f-4061-8172-839405a6b7c8";

describe("toClientValues", () => {
  it("passes the client form's own schema", () => {
    const values = toClientValues({
      kind: "new",
      side: "buyer",
      first_name: "Anna",
      last_name: "Svensson",
      phone: "+46 70 123 45 67",
      email: "",
      language: "Swedish",
    });
    expect(clientFormSchema(t).safeParse(values).success).toBe(true);
  });
});

describe("toTimelineEntry", () => {
  it("logs a contact when the agent spoke to them, with the note as its body", () => {
    const entry = toTimelineEntry(clientId, { note: "Loved the view", contact_channel: "meeting" });
    expect(entry).toEqual({ kind: "contact", input: { clientId, channel: "meeting", body: "Loved the view" } });
    expect(logContactSchema.safeParse(entry?.input).success).toBe(true);
  });

  it("adds a plain note otherwise, and nothing when both are empty", () => {
    const entry = toTimelineEntry(clientId, { note: "Flying in on the 20th", contact_channel: null });
    expect(entry?.kind).toBe("note");
    expect(activityNoteSchema.safeParse(entry?.input).success).toBe(true);
    expect(toTimelineEntry(clientId, { note: "  ", contact_channel: null })).toBeNull();
  });
});

describe("toViewingValues", () => {
  it("passes the viewing form's schema, and drops an offer price without an offer", () => {
    const { values, schedule } = toViewingValues({
      property: "Villa in Benahavís",
      feedback: "Loved the view; over budget",
      had_offer: false,
      offer_price: 1400000,
      property_price: 1950000,
    });
    expect(values.offer_price).toBe("");
    expect(values.property_price).toBe("1950000");
    expect(schedule).toEqual({ scheduled_at: null, reminder_minutes: null });
    expect(viewingFormSchema(t).safeParse(values).success).toBe(true);
  });
});

describe("mergePreferences", () => {
  it("overwrites only what the note said", () => {
    const merged = mergePreferences(
      { budget_min: 800000, budget_max: 1200000, bedrooms: 3, bathrooms: null, property_types: ["villa"], area_notes: "Benahavís" },
      { budget_min: null, budget_max: 1500000, bedrooms: null, bathrooms: null, property_types: null, area_notes: null }
    );
    expect(merged).toEqual({
      property_types: ["villa"],
      budget_min: "800000",
      budget_max: "1500000",
      bedrooms: "3",
      bathrooms: "",
      area_notes: "Benahavís",
    });
    expect(preferencesFormSchema(t).safeParse(merged).success).toBe(true);
  });

  it("starts from nothing for a client with no preferences yet", () => {
    const merged = mergePreferences(null, {
      budget_min: null,
      budget_max: null,
      bedrooms: 3,
      bathrooms: null,
      property_types: ["apartment"],
      area_notes: "Puerto Banús",
    });
    expect(merged.bedrooms).toBe("3");
    expect(merged.budget_max).toBe("");
    expect(preferencesFormSchema(t).safeParse(merged).success).toBe(true);
  });
});

describe("toTaskInputs and toAppointmentInput", () => {
  it("makes open tasks the task actions accept, with or without a client", () => {
    const inputs = toTaskInputs(clientId, [{ title: "Call the Johnsons", due_on: "2026-11-13" }]);
    expect(taskInputSchema.safeParse(inputs[0]).success).toBe(true);
    expect(taskInputSchema.safeParse(toTaskInputs(null, [{ title: "Renew Idealista", due_on: null }])[0]).success).toBe(true);
  });

  it("ends an appointment after its length", () => {
    const input = toAppointmentInput(clientId, {
      title: "Meet María",
      starts_at: "2026-11-12T10:00:00.000Z",
      duration_minutes: 90,
      location: "San Pedro",
    });
    expect(input.ends_at).toBe("2026-11-12T11:30:00.000Z");
    expect(appointmentInputSchema.safeParse(input).success).toBe(true);
  });
});

describe("stageChange", () => {
  it("moves only to a valid, different stage for the side", () => {
    expect(stageChange("buyer", "viewing", "reserved")).toBe("reserved");
    expect(stageChange("buyer", "viewing", "viewing")).toBeNull();
    expect(stageChange("seller", "pending", "reserved")).toBeNull();
    expect(stageChange("seller", null, "qualified")).toBe("qualified");
    expect(stageChange("buyer", "new", null)).toBeNull();
  });
});

describe("voiceApplySchema", () => {
  const base = {
    noteId: clientId,
    groups: [
      {
        client: { kind: "existing", id: clientId },
        note: "Loved the view",
        contact_channel: "meeting",
        viewing: null,
        preferences: null,
        stage: null,
        tasks: [{ title: "Call them", due_on: "2026-11-13" }],
        appointment: null,
      },
    ],
    looseTasks: [],
  };

  it("accepts a clean payload", () => {
    expect(voiceApplySchema.safeParse(base).success).toBe(true);
  });

  it("refuses bad ids, unknown channels and oversized text", () => {
    const g = base.groups[0];
    expect(voiceApplySchema.safeParse({ ...base, noteId: "x" }).success).toBe(false);
    expect(voiceApplySchema.safeParse({ ...base, groups: [{ ...g, contact_channel: "fax" }] }).success).toBe(false);
    expect(voiceApplySchema.safeParse({ ...base, groups: [{ ...g, note: "x".repeat(3000) }] }).success).toBe(false);
    expect(
      voiceApplySchema.safeParse({ ...base, groups: [{ ...g, client: { kind: "new", side: "buyer", first_name: "", last_name: "", phone: "", email: "", language: "" } }] })
        .success
    ).toBe(false);
  });
});
