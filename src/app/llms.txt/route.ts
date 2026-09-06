import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { PRICES } from "@/lib/billing";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// llms.txt (https://llmstxt.org): a plain-text brief for AI crawlers and
// answer engines. Prerendered at build time. The copy mirrors the landing
// page and its JSON-LD, so keep the three in step.
export const dynamic = "force-static";

export function GET() {
  const pro = PRICES.standard;
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is a web app for solo and independent real-estate agents, including agents who work with several agencies at once. It is built around how these agents actually work: WhatsApp, property portals and clients who speak different languages. The interface is available in English and Spanish, and it installs on a phone's home screen. Sales pipelines are live today; long and short-term rentals are planned.

## What it does

- Pipeline: drag every buyer and seller through clear stages (new, contacted, qualified, viewing, reserved); sellers get their own flow with every listing attached
- Clients: names, languages, nationalities and notes; flag hot leads and hide cold ones
- Properties and viewings: log every property a buyer views, with photos and the window card
- Offers: record each offer against the asking price
- Documents: contracts, IDs and reservation papers filed against the right client
- Multi-agency: tag each lead by agency so one book covers every agency an agent works with
- AI follow-ups: drafts warm, personal WhatsApp messages and emails in the client's language; the agent reads and approves before anything is sent
- Auto-engage: spots clients going quiet and surfaces them with a ready-to-send nudge
- Buyer-to-listing matching: shows which of the agent's own listings fit a buyer's budget, property type and bedrooms
- Portal lead capture: paste an enquiry from Idealista, Fotocasa, Kyero, an email or a WhatsApp and it becomes a ready-to-save lead
- Viewing scheduler: month calendar with reminders, Google Calendar sync and one-tap WhatsApp confirmations
- Privacy: every agent's clients are isolated; nobody else sees their book

## Pricing

- Free: up to ${FREE_CLIENT_LIMIT} clients (buyers and sellers together), every feature included, no card and no time limit
- Pro: €${pro.monthly} per month or €${pro.yearly} per year, plus VAT (IVA), for unlimited clients
- Referrals: refer another agent and, once you are both on Pro, you each get a free month

## Links

- [Home](${SITE_URL}): product overview, features and pricing
- [Sign in](${SITE_URL}/login): Google or a one-time email code, no password
- [Sitemap](${SITE_URL}/sitemap.xml)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
