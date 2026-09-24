import { describe, expect, it } from "vitest";

import { parseSignupSource, readSignupSource, readUtm } from "@/lib/signup-source";

describe("readSignupSource", () => {
  it("keeps the ad's tags and the landing page", () => {
    expect(
      readSignupSource(
        "?utm_source=facebook&utm_medium=paid&utm_campaign=quiet-leads-sep26&fbclid=abc",
        "/quiet"
      )
    ).toEqual({ utm_source: "facebook", utm_medium: "paid", utm_campaign: "quiet-leads-sep26", landing: "/quiet" });
  });

  it("records the landing page even without tags", () => {
    expect(readSignupSource("", "/es/seguimiento")).toEqual({ landing: "/es/seguimiento" });
  });

  it("has nothing to say about a bare visit to /login", () => {
    expect(readSignupSource("?next=%2Fhome", "/login")).toBeNull();
  });

  it("caps long values and drops empty ones", () => {
    const utm = readUtm(`?utm_source=${"x".repeat(300)}&utm_medium=%20%20`);
    expect(utm.utm_source).toHaveLength(100);
    expect(utm).not.toHaveProperty("utm_medium");
  });
});

describe("parseSignupSource", () => {
  it("round-trips what readSignupSource produced", () => {
    const source = readSignupSource("?utm_source=facebook&utm_content=film", "/quiet");
    expect(parseSignupSource(JSON.stringify(source))).toEqual(source);
  });

  it("drops unknown keys and non-strings", () => {
    expect(parseSignupSource(JSON.stringify({ utm_source: "facebook", email: "a@b.c", utm_medium: 3 }))).toEqual({
      utm_source: "facebook",
    });
  });

  it("rejects anything that is not a JSON object", () => {
    expect(parseSignupSource(null)).toBeNull();
    expect(parseSignupSource("not json")).toBeNull();
    expect(parseSignupSource("[1,2]")).toBeNull();
    expect(parseSignupSource("{}")).toBeNull();
  });
});
