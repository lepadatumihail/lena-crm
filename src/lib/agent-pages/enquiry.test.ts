import { describe, expect, it } from "vitest";

import {
  MIN_FILL_MS,
  REPLY_MIN_SAMPLES,
  bedroomCount,
  budgetRange,
  enquiryDetails,
  enquiryInputSchema,
  looksLikeBot,
  parseContact,
  pickAreas,
  replyBucket,
  splitName,
} from "./enquiry";

describe("splitName", () => {
  it("splits on the first space and tidies whitespace", () => {
    expect(splitName("  Anna   Berg Lind ")).toEqual({ first: "Anna", last: "Berg Lind" });
    expect(splitName("Anna")).toEqual({ first: "Anna", last: "" });
  });
});

describe("parseContact", () => {
  it("reads an email", () => {
    expect(parseContact(" Anna@Example.SE ")).toEqual({ email: "anna@example.se" });
    expect(parseContact("anna@")).toBeNull();
  });

  it("reads a phone number, keeping the country code", () => {
    expect(parseContact("+46 70 174 06 05")).toEqual({ phone: "+46701740605" });
    expect(parseContact("0046 70 174 06 05")).toEqual({ phone: "+46701740605" });
    expect(parseContact("070-174 06 05")).toEqual({ phone: "0701740605" });
  });

  it("refuses what is neither", () => {
    expect(parseContact("call me")).toBeNull();
    expect(parseContact("123")).toBeNull();
  });
});

describe("the form's answers", () => {
  it("turns a budget band into a range and bedrooms into a number", () => {
    expect(budgetRange("400-800")).toEqual({ min: 400_000, max: 800_000 });
    expect(budgetRange("u400")).toEqual({ min: null, max: 400_000 });
    expect(budgetRange("1500+")).toEqual({ min: 1_500_000, max: null });
    expect(budgetRange(undefined)).toEqual({ min: null, max: null });
    expect(bedroomCount("4+")).toBe(4);
    expect(bedroomCount(undefined)).toBeNull();
  });

  it("keeps only the areas the page offers, in the page's spelling", () => {
    expect(pickAreas(["estepona ", "Narnia", "Estepona"], ["Estepona", "Casares"])).toEqual(["Estepona"]);
    expect(pickAreas(undefined, ["Estepona"])).toEqual([]);
  });

  it("stores only the answers that belong to the side", () => {
    const base = {
      slug: "elin-sandberg",
      lang: "sv" as const,
      name: "Anna",
      contact: "+46701740605",
      elapsedMs: 9000,
      budget: "400-800" as const,
      where: "El Paraíso",
    };
    expect(enquiryDetails({ ...base, kind: "buy" }, ["Estepona"])).toEqual({
      budget: "400-800",
      areas: ["Estepona"],
    });
    expect(enquiryDetails({ ...base, kind: "sell", homeType: "villa" }, [])).toEqual({
      where: "El Paraíso",
      homeType: "villa",
    });
  });
});

describe("enquiryInputSchema", () => {
  const ok = {
    slug: "elin-sandberg",
    lang: "sv",
    kind: "buy",
    name: "Anna Berg",
    contact: "+46701740605",
    elapsedMs: 8000,
  };

  it("accepts a plain enquiry and refuses unknown choices", () => {
    expect(enquiryInputSchema.safeParse(ok).success).toBe(true);
    expect(enquiryInputSchema.safeParse({ ...ok, lang: "de" }).success).toBe(false);
    expect(enquiryInputSchema.safeParse({ ...ok, budget: "cheap" }).success).toBe(false);
    expect(enquiryInputSchema.safeParse({ ...ok, name: "   " }).success).toBe(false);
  });
});

describe("looksLikeBot", () => {
  it("drops forms with the hidden field filled or sent too fast", () => {
    expect(looksLikeBot({ company: "ACME", elapsedMs: 20_000 })).toBe(true);
    expect(looksLikeBot({ elapsedMs: MIN_FILL_MS - 1 })).toBe(true);
    expect(looksLikeBot({ company: " ", elapsedMs: MIN_FILL_MS })).toBe(false);
  });
});

describe("replyBucket", () => {
  const now = new Date("2026-11-08T12:00:00Z");
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();
  const answered = (receivedAgo: number, waitMinutes: number) => ({
    received_at: at(receivedAgo),
    first_reply_at: at(receivedAgo - waitMinutes),
  });

  it("says nothing until there are enough enquiries", () => {
    const four = Array.from({ length: REPLY_MIN_SAMPLES - 1 }, () => answered(3000, 5));
    expect(replyBucket(four, now)).toBeNull();
  });

  it("bands the median wait", () => {
    const fast = Array.from({ length: 5 }, (_, i) => answered(3000 + i, 10 + i));
    expect(replyBucket(fast, now)).toBe("hour");
    const slower = Array.from({ length: 5 }, (_, i) => answered(5000 + i, 120 + i));
    expect(replyBucket(slower, now)).toBe("fewHours");
    const day = Array.from({ length: 5 }, (_, i) => answered(5000 + i, 600 + i));
    expect(replyBucket(day, now)).toBe("day");
  });

  it("counts a message left unanswered for a day against the line", () => {
    const enquiries = [
      ...Array.from({ length: 3 }, (_, i) => answered(5000 + i, 10)),
      { received_at: at(2000), first_reply_at: null },
      { received_at: at(3000), first_reply_at: null },
      { received_at: at(4000), first_reply_at: null },
    ];
    // Three fast, three never: the slower middle value is "never".
    expect(replyBucket(enquiries, now)).toBeNull();
  });

  it("doesn't count a fresh enquiry that may still get its answer", () => {
    const enquiries = [
      ...Array.from({ length: 5 }, (_, i) => answered(5000 + i, 10)),
      { received_at: at(30), first_reply_at: null },
    ];
    expect(replyBucket(enquiries, now)).toBe("hour");
  });
});
