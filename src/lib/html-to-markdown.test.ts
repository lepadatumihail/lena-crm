// @vitest-environment node
import { describe, expect, it } from "vitest";

import { estimateTokens, htmlToMarkdown } from "./html-to-markdown";

const PAGE_URL = "https://www.leadwing.app/privacy";

function page(head: string, body: string): string {
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}

describe("htmlToMarkdown", () => {
  const markdown = htmlToMarkdown(
    page(
      `<title>Privacy Policy · LeadWing</title>
       <meta name="description" content="What we do: with your data.">
       <meta property="og:title" content="Privacy Policy">
       <meta property="og:image" content="https://www.leadwing.app/og.png">`,
      `<div hidden>streamed chunk</div>
       <header><nav><a href="/">Site nav</a></nav></header>
       <main>
         <h1>Privacy Policy</h1>
         <div aria-hidden="true">Sofia Müller mockup</div>
         <div class="flex items-baseline gap-2"><span>€29</span><span>per month</span></div>
         <p>Read the <a href="/terms">terms</a> or <a href="mailto:info@leadwing.app">write to us</a>.</p>
         <table><tbody><tr><th scope="row">Controller</th><td>LeadWing</td></tr></tbody></table>
         <img src="/decor.png" alt=""><img src="/team.png" alt="The team">
         <svg><text>icon</text></svg>
         <script>self.__next_f.push([1,"payload"])</script>
         <script type="application/ld+json">{"@type":"Organization","name":"LeadWing"}</script>
       </main>
       <footer><a href="/legal">Footer link</a></footer>`
    ),
    PAGE_URL
  );

  it("opens with front matter from the meta tags", () => {
    expect(markdown.split("\n\n")[0]).toBe(
      '---\ntitle: "Privacy Policy"\ndescription: "What we do: with your data."\nimage: "https://www.leadwing.app/og.png"\n---'
    );
  });

  it("keeps the main content, resolving links and images against the page", () => {
    expect(markdown).toContain("# Privacy Policy");
    expect(markdown).toContain("€29 per month");
    expect(markdown).toContain(
      "Read the [terms](https://www.leadwing.app/terms) or [write to us](mailto:info@leadwing.app)."
    );
    expect(markdown).toContain("| Controller | LeadWing |");
    expect(markdown).toContain("![The team](https://www.leadwing.app/team.png)");
  });

  it("drops chrome, code, decoration and whatever the page hides", () => {
    for (const text of ["streamed chunk", "Site nav", "Sofia", "icon", "__next_f", "Footer link", "decor.png"]) {
      expect(markdown).not.toContain(text);
    }
  });

  it("ends with the page's JSON-LD", () => {
    expect(markdown.slice(markdown.indexOf("```json"))).toBe(
      '```json\n{"@type":"Organization","name":"LeadWing"}\n```\n'
    );
  });

  it("falls back to the body without a <main>, and skips empty front matter", () => {
    expect(
      htmlToMarkdown(page("", "<section><h2>Pricing</h2><p>Free forever</p></section>"), PAGE_URL)
    ).toBe("## Pricing\n\nFree forever\n");
  });
});

describe("estimateTokens", () => {
  it("counts about four characters to a token", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcdefgh")).toBe(2);
    expect(estimateTokens("abcdefghi")).toBe(3);
  });
});
