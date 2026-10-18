import { describe, expect, it } from "vitest";

import { cleanHost, parseSignupSource, readReferrer, readSignupSource, readUtm } from "@/lib/signup-source";

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

  it("adds the site that linked to the page", () => {
    expect(readSignupSource("", "/tools/client-spreadsheet", "perplexity.ai")).toEqual({
      landing: "/tools/client-spreadsheet",
      referrer: "perplexity.ai",
    });
  });

  it("keeps a referrer next to the tags that also name the source", () => {
    expect(readSignupSource("?utm_source=chatgpt.com", "/tools/client-spreadsheet", "chatgpt.com")).toEqual({
      utm_source: "chatgpt.com",
      landing: "/tools/client-spreadsheet",
      referrer: "chatgpt.com",
    });
  });

  it("leaves out a referrer that is not a bare hostname", () => {
    expect(readSignupSource("", "/quiet", "https://google.com/search?q=crm")).toEqual({ landing: "/quiet" });
  });
});

describe("readReferrer", () => {
  it.each([
    ["https://www.google.com/", "google.com"],
    ["https://chatgpt.com/", "chatgpt.com"],
    ["https://www.perplexity.ai/search/abc?q=real+estate+crm", "perplexity.ai"],
    ["https://L.Facebook.com/l.php?u=https%3A%2F%2Fleadwing.app", "l.facebook.com"],
    ["android-app://com.google.android.gm/", "com.google.android.gm"],
  ])("keeps only the hostname of %s", (referrer, host) => {
    expect(readReferrer(referrer, "leadwing.app")).toBe(host);
  });

  it.each([
    ["no referrer", ""],
    ["our own page", "https://leadwing.app/pricing"],
    ["our own page on www", "https://www.leadwing.app/"],
    ["something unreadable", "not a url"],
  ])("is null for %s", (_, referrer) => {
    expect(readReferrer(referrer, "leadwing.app")).toBeNull();
  });

  it("treats every port of the same host as this site", () => {
    expect(readReferrer("http://localhost:4000/", "localhost")).toBeNull();
  });
});

describe("cleanHost", () => {
  it("lowercases, trims and drops www.", () => {
    expect(cleanHost("  WWW.Bing.com ")).toBe("bing.com");
  });

  it.each(["https://google.com", "google.com/search", "a b.com", "me@example.com", "", 3, null])(
    "rejects %j",
    (value) => {
      expect(cleanHost(value)).toBeNull();
    }
  );
});

describe("parseSignupSource", () => {
  it("round-trips what readSignupSource produced", () => {
    const source = readSignupSource("?utm_source=facebook&utm_content=film", "/quiet", "l.facebook.com");
    expect(parseSignupSource(JSON.stringify(source))).toEqual(source);
  });

  it("drops unknown keys and non-strings", () => {
    expect(parseSignupSource(JSON.stringify({ utm_source: "facebook", email: "a@b.c", utm_medium: 3 }))).toEqual({
      utm_source: "facebook",
    });
  });

  it("keeps a referrer only as a hostname", () => {
    expect(parseSignupSource(JSON.stringify({ landing: "/", referrer: "https://mail.google.com/mail/u/0/#inbox" }))).toEqual({
      landing: "/",
    });
    expect(parseSignupSource(JSON.stringify({ referrer: "www.Google.com" }))).toEqual({ referrer: "google.com" });
  });

  it("rejects anything that is not a JSON object", () => {
    expect(parseSignupSource(null)).toBeNull();
    expect(parseSignupSource("not json")).toBeNull();
    expect(parseSignupSource("[1,2]")).toBeNull();
    expect(parseSignupSource("{}")).toBeNull();
  });
});
