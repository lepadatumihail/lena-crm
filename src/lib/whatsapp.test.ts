import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  whatsappGreeting,
  whatsappLink,
  reminderMessage,
} from "./whatsapp";

describe("normalizePhone", () => {
  it("strips a leading 00 and non-digits", () => {
    expect(normalizePhone("0034 612-345-678")).toBe("34612345678");
  });

  it("strips a leading + and non-digits", () => {
    expect(normalizePhone("+34 612 345 678")).toBe("34612345678");
  });

  it("returns null for too-few digits", () => {
    expect(normalizePhone("123")).toBeNull();
  });

  it("returns null for null/undefined/empty", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
});

describe("whatsappGreeting", () => {
  it("uses the localized greeting", () => {
    expect(whatsappGreeting("Anna", "German")).toBe("Hallo Anna, ");
  });

  it("falls back to English for unknown/missing language", () => {
    expect(whatsappGreeting("Anna", "Klingon")).toBe("Hi Anna, ");
    expect(whatsappGreeting("Anna", null)).toBe("Hi Anna, ");
  });
});

describe("whatsappLink", () => {
  it("returns null for an unusable phone", () => {
    expect(whatsappLink(null)).toBeNull();
    expect(whatsappLink("123")).toBeNull();
  });

  it("builds a wa.me URL with URL-encoded text", () => {
    const link = whatsappLink("+34612345678", "Hola ¿qué tal?");
    expect(link).not.toBeNull();
    expect(link!.startsWith("https://wa.me/34612345678?text=")).toBe(true);
    expect(link).toBe(
      "https://wa.me/34612345678?text=" + encodeURIComponent("Hola ¿qué tal?")
    );
    // raw spaces/special chars must not survive un-encoded
    expect(link).not.toContain(" ");
    expect(link).not.toContain("¿");
  });

  it("omits the query string when no text is given", () => {
    expect(whatsappLink("+34612345678")).toBe("https://wa.me/34612345678");
  });
});

describe("reminderMessage", () => {
  it("uses the German body and the localized fallback noun when 'what' is empty", () => {
    const msg = reminderMessage("Anna", "German", "", "Mo 1 Jan");
    expect(msg.startsWith("Hallo Anna, ")).toBe(true);
    expect(msg).toContain("unseren Termin"); // localized fallback noun
    expect(msg).toContain("Mo 1 Jan");
  });

  it("includes the given 'what' when present", () => {
    const msg = reminderMessage("Anna", "German", "Villa Sol", "Mo 1 Jan");
    expect(msg).toContain("Villa Sol");
    expect(msg).not.toContain("unseren Termin");
  });

  it("falls back to the English body for an unknown language", () => {
    const msg = reminderMessage("Anna", "Klingon", "", "Mon 1 Jan");
    expect(msg.startsWith("Hi Anna, ")).toBe(true);
    expect(msg).toContain("our appointment");
  });
});
