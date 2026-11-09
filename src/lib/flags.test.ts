import { describe, expect, it } from "vitest";

import { voiceNotesEnabled } from "./flags";

const admin = { is_admin: true, email: "founder@example.com" };
const agent = { is_admin: false, email: "Agent@Example.com" };

describe("voiceNotesEnabled", () => {
  it("is off when the variable is missing or unknown", () => {
    expect(voiceNotesEnabled(admin, {})).toBe(false);
    expect(voiceNotesEnabled(admin, { VOICE_NOTES_ENABLED: "yes" })).toBe(false);
    expect(voiceNotesEnabled(admin, { VOICE_NOTES_ENABLED: "off" })).toBe(false);
  });

  it("admins: only admin accounts", () => {
    const env = { VOICE_NOTES_ENABLED: "admins" };
    expect(voiceNotesEnabled(admin, env)).toBe(true);
    expect(voiceNotesEnabled(agent, env)).toBe(false);
    expect(voiceNotesEnabled(null, env)).toBe(false);
  });

  it("pilot: admins plus listed emails, case-insensitive", () => {
    const env = { VOICE_NOTES_ENABLED: "Pilot", VOICE_NOTES_PILOT_EMAILS: " other@x.es, agent@example.com " };
    expect(voiceNotesEnabled(admin, env)).toBe(true);
    expect(voiceNotesEnabled(agent, env)).toBe(true);
    expect(voiceNotesEnabled({ is_admin: false, email: "stranger@x.es" }, env)).toBe(false);
    expect(voiceNotesEnabled({ is_admin: false, email: null }, env)).toBe(false);
  });

  it("all: everyone, even without a profile", () => {
    const env = { VOICE_NOTES_ENABLED: "all" };
    expect(voiceNotesEnabled(agent, env)).toBe(true);
    expect(voiceNotesEnabled(null, env)).toBe(true);
  });
});
