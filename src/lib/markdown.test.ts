import { describe, expect, it } from "vitest";

import { markdownRoute, prefersMarkdown } from "./markdown";

describe("prefersMarkdown", () => {
  it.each([
    "text/markdown",
    "text/markdown; charset=utf-8",
    "TEXT/Markdown",
    "text/markdown, text/html;q=0.9",
    "text/html;q=0.5, text/markdown",
    "text/html, text/markdown",
    "text/markdown, */*",
  ])("serves markdown for %s", (accept) => {
    expect(prefersMarkdown(accept)).toBe(true);
  });

  it.each([
    null,
    "",
    "*/*",
    "text/*",
    "application/json",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "text/html, text/markdown;q=0.5",
    "text/markdown;q=0.5, */*",
    "text/markdown;q=0",
  ])("keeps HTML for %s", (accept) => {
    expect(prefersMarkdown(accept)).toBe(false);
  });
});

describe("markdownRoute", () => {
  it("nests every page under /markdown", () => {
    expect(markdownRoute("/")).toBe("/markdown");
    expect(markdownRoute("/es")).toBe("/markdown/es");
    expect(markdownRoute("/es/privacidad")).toBe("/markdown/es/privacidad");
  });
});
