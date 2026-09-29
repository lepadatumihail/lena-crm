import { tables } from "@joplin/turndown-plugin-gfm";
import { createDocument } from "@mixmark-io/domino";
import TurndownService from "turndown";

/**
 * What isn't the page's content: site chrome, code, and whatever the page
 * itself hides from assistive technology, such as decorative mockups and icons.
 * Headers and footers are only chrome as the site's own (see SECTIONING).
 */
const NOT_CONTENT =
  "script, style, noscript, template, svg, iframe, nav, [hidden], [aria-hidden='true']";

/**
 * HTML's rule for when a <header> or <footer> stops being the site's banner or
 * footer: inside one of these, it belongs to that part of the page, like the
 * title, lead and date a written page opens <main> with.
 */
const SECTIONING = "main, article, aside, nav, section";

/** Tailwind layouts whose children are separate boxes, spaced by gap rather than text. */
const BOX_LAYOUT = /(?:^|\s)(?:inline-)?(?:flex|grid)(?:\s|$)/;

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
}).use(tables);

/**
 * A page's HTML as markdown for agents, in the layout Cloudflare's Markdown for
 * Agents uses: YAML front matter from the meta tags, the page's main content,
 * then its JSON-LD in a fenced block. Links and images resolve against
 * `pageUrl`, so the document stands on its own.
 */
export function htmlToMarkdown(html: string, pageUrl: string): string {
  const doc = createDocument(html);
  const meta = (selector: string) =>
    doc.querySelector(selector)?.getAttribute("content") || undefined;

  const frontMatter = Object.entries({
    title: meta('meta[property="og:title"]') ?? (doc.title || undefined),
    description:
      meta('meta[name="description"]') ?? meta('meta[property="og:description"]'),
    image: meta('meta[property="og:image"]'),
  }).filter((entry): entry is [string, string] => entry[1] !== undefined);

  const jsonLd = all(doc, 'script[type="application/ld+json"]')
    .map((script) => script.textContent?.trim())
    .filter((text): text is string => Boolean(text));

  const content = doc.querySelector("main") ?? doc.body;
  for (const node of all(content, NOT_CONTENT)) node.remove();
  for (const node of all(content, "header, footer")) {
    if (!node.parentElement?.closest(SECTIONING)) node.remove();
  }
  // What a header keeps is the title block; its buttons are calls to action.
  for (const button of all(content, "header [data-slot='button']")) button.remove();
  // "€0" and "forever" sit side by side in a flex row; without a space between
  // the boxes they would run together as "€0forever".
  for (const box of all(content, "[class]")) {
    if (!BOX_LAYOUT.test(box.getAttribute("class") ?? "")) continue;
    for (const child of Array.from(box.childNodes).slice(1)) {
      box.insertBefore(doc.createTextNode(" "), child);
    }
  }
  for (const link of all(content, "a[href]")) {
    link.setAttribute("href", resolve(link.getAttribute("href") ?? "", pageUrl));
  }
  for (const image of all(content, "img")) {
    const src = image.getAttribute("src");
    if (src && image.getAttribute("alt")) image.setAttribute("src", resolve(src, pageUrl));
    else image.remove(); // decorative
  }

  const sections = [turndown.turndown(content)];
  if (frontMatter.length > 0) {
    const fields = frontMatter.map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
    sections.unshift(["---", ...fields, "---"].join("\n"));
  }
  if (jsonLd.length > 0) sections.push(["```json", ...jsonLd, "```"].join("\n"));
  return `${sections.join("\n\n")}\n`;
}

/** Roughly four characters to a token: the estimate sent as x-markdown-tokens. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** querySelectorAll as an array: domino's NodeList can't be spread. */
function all(root: ParentNode, selector: string): Element[] {
  return Array.from(root.querySelectorAll(selector));
}

/** A URL resolved against the page, or left as written if it doesn't parse. */
function resolve(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}
