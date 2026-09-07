# Plan 010 — Feature pages for search and AI answer engines

> Status: TODO. Written 2026-09-07 after the SEO audit that added `/es`,
> hreflang, `llms.txt`, the FAQ and the legal pages. Nothing here is built yet.

## Why

The site has one indexable page per language. It can rank for the brand name
and little else. Agents search for what they need ("CRM inmobiliario WhatsApp",
"CRM for independent estate agents", "Idealista leads CRM"), and AI answer
engines cite pages that answer one question well. Feature pages give each
question a URL, in English and Spanish, that the home page can link to.

## What to build

One page per feature, one per language, under a `features` route in English
and `funciones` in Spanish. Start with the five features the landing already
sells; add comparison pages once those index.

| Slug (en / es) | Working title | Target queries |
|---|---|---|
| `whatsapp-crm` / `crm-whatsapp` | WhatsApp CRM for estate agents | crm inmobiliario whatsapp, whatsapp crm real estate |
| `multi-agency` / `multi-agencia` | One CRM for every agency you work with | crm agente inmobiliario autónomo, crm for freelance estate agents |
| `portal-leads` / `leads-portales` | Idealista, Fotocasa and Kyero leads in one tap | leads idealista crm, fotocasa leads gestión |
| `ai-follow-ups` / `seguimiento-ia` | Follow-ups that write themselves | crm inmobiliario ia, real estate follow up automation |
| `viewing-scheduler` / `agenda-visitas` | Viewings, reminders and Google Calendar | agenda visitas inmobiliaria, real estate showing scheduler |

Later, comparison pages: `vs-spreadsheets`, `vs-inmovilla`, `vs-witei`,
`vs-follow-up-boss`. Only after the feature pages have impressions in Search
Console; comparison pages need the domain to have some authority first.

## Page template

- One H1 with the feature and the audience ("WhatsApp CRM for independent
  estate agents"). 600 to 900 words of real explanation, not the landing
  blurb repeated.
- A screenshot or the existing landing visual for that feature, with alt text.
- "How it works" in three steps, matching the product exactly (no features
  that don't exist: check `src/lib/actions` before claiming anything).
- A three to five question FAQ specific to the feature, rendered with the same
  `<details>` component as the home page and emitted as FAQPage JSON-LD.
- BreadcrumbList JSON-LD (Home › Features › Page) and a WebPage node that
  points at the SoftwareApplication `@id` from the home page.
- Internal links: from the matching landing section to the page, and from each
  feature page to two others and to pricing. Footer gets a "Features" column.
- CTA to `/login` with the same "no card" note as the home page.

## Implementation notes

- Add each page to `MARKETING_ROUTES` in `src/lib/routes.ts`. That alone gives
  it hreflang, sitemap entries, the language toggle and the redirect rules;
  `routes.test.ts` will fail until both language files exist.
- Use `marketingMetadata(route, locale, { title, description })` from
  `src/lib/seo.ts` for the head, and `JsonLd` for structured data.
- Copy goes in a new `features` message namespace (add it to
  `src/i18n/messages.ts` for both languages); long prose can live in per-locale
  TSX content files the way the legal pages do if JSON gets unwieldy.
- Reuse `MarketingNav` (minimal variant) and `LandingFooter`.
- One OG image per feature is optional; the default image is fine to start.

## Measure

Search Console, per page, four weeks after indexing: impressions, top queries,
average position. A page with impressions but a low CTR needs a better title;
a page with none needs links or a different query. Vercel Analytics shows
which pages send traffic to `/login`.

## Order and effort

1. Route plumbing + the WhatsApp page in both languages (S). Proves the template.
2. The other four feature pages (M). Copy is the work, not code.
3. Footer column + landing section links (S).
4. Comparison pages, one at a time, when the data says so (M).

Stop if: a page needs a feature the product doesn't have (write the feature or
drop the page), or the Spanish copy has not been reviewed by a native speaker
before publishing.
