import type { ComponentType } from "react";

import type { MarketingRoute } from "@/lib/routes";

/**
 * The shape of a written marketing page: everything the shared shell
 * (components/marketing/marketing-page.tsx) needs to render the page, its
 * head tags and its structured data. One module per language lives at
 * src/content/pages/<file>.<lang>.tsx and default-exports nothing — it
 * exports `content` typed as MarketingPageContent.
 *
 * The type lives here rather than next to the component so lib/seo.ts can
 * read it without importing the component (and pulling the whole React tree
 * into the metadata path); marketing-page.tsx re-exports it, which is the
 * import content modules should use.
 */
export type MarketingFaq = {
  /** The question, exactly as a person would ask it. */
  q: string;
  /** One to three sentences. Plain text: it is also emitted as JSON-LD. */
  a: string;
};

export type MarketingPageContent = {
  /**
   * <title>, ≤ 60 chars, primary keyword first. Leave the brand out (the
   * template appends " · LeadWing") unless the page is about the brand itself:
   * a title that names LeadWing is used as it is.
   */
  title: string;
  /** Meta description, 140–160 characters. */
  description: string;
  /**
   * "article" → Article structured data (guides); "page" → WebPage (product
   * pages); "about" → AboutPage carrying the Organization node (the About page);
   * "tool" → WebPage about a WebApplication (the free tools, which set `tool`).
   */
  kind: "article" | "page" | "about" | "tool";
  /** ISO date; shown as "Updated …", and used for datePublished/dateModified and sitemap lastmod. */
  published: string;
  /** Short badge above the H1 ("Guide", "Real estate CRM · Spain", …). */
  eyebrow: string;
  /** The H1. */
  heading: string;
  /** One paragraph under the H1, plain text. */
  lead: string;
  /** The article itself: plain HTML elements, optionally <Callout> and <TemplateBlock>. */
  Body: ComponentType;
  /** 3–6 page-specific entries, rendered as <details> and emitted as FAQPage JSON-LD. */
  faq: MarketingFaq[];
  /**
   * What the page is about, for structured data, when that is neither the
   * product nor the company: a guide to a law names the law. A plain
   * schema.org node; without it, pageJsonLd picks the subject itself.
   */
  topic?: { "@type": string; name: string } & Record<string, unknown>;
  /** 2–4 sibling routes shown as cards at the end; labels and blurbs come from marketing.json. */
  related: MarketingRoute[];
  /**
   * Tool pages only: the interactive part, rendered between the header and
   * the article, and how structured data describes it.
   */
  tool?: {
    Component: ComponentType;
    schema: { "@type": "WebApplication"; applicationCategory: string };
  };
};
