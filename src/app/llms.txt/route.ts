import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { PRICES } from "@/lib/billing";
import { TOOL_ROUTES, marketingPath, type MarketingRoute, type ToolRoute } from "@/lib/routes";
import { COTIZACION_YEAR } from "@/lib/tools/earnings";
import { trackerPath } from "@/lib/tools/tracker-files";
import {
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_DISAMBIGUATION,
  SITE_FOUNDED,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  absoluteUrl,
} from "@/lib/site";

// llms.txt (https://llmstxt.org): a plain-text brief for AI crawlers and
// answer engines. Prerendered at build time. The copy mirrors the landing
// page, the About page and their JSON-LD, so keep them in step.
export const dynamic = "force-static";

/** The English URL of a marketing page; this file is English only. */
const en = (route: MarketingRoute) => absoluteUrl(marketingPath(route, "en"));

/** One line per free tool: TypeScript asks for a line whenever a tool route is added. */
const TOOL_LINES: Record<ToolRoute, string> = {
  toolCommission: `[Real estate commission calculator](${en("toolCommission")}): fee, VAT or IGIC, the split between two agencies, your share and IRPF withholding, on sales and rentals in Spain`,
  toolSpreadsheet: `[Client tracker spreadsheet](${en("toolSpreadsheet")}): a free Excel workbook for buyers and sellers, with follow-ups that are due in amber, quiet clients in grey and columns that import into ${SITE_NAME} as they are; in English (${absoluteUrl(trackerPath("en"))}), Spanish (${absoluteUrl(trackerPath("es"))}) and Russian (${absoluteUrl(trackerPath("ru"))})`,
  toolEarnings: `[Agent earnings calculator](${en("toolEarnings")}): what a self-employed estate agent in Spain takes home a month from a year of sales, after splits, the cuota de autónomos (estimated from the ${COTIZACION_YEAR} table), costs and IRPF; or how many sales a take-home figure needs`,
};

export function GET() {
  const pro = PRICES.standard;
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is a web app for solo and independent real-estate agents, including agents who work with several agencies at once. It is built around how these agents actually work: WhatsApp, property portals and clients who speak different languages. The interface is available in English, Spanish and Russian, and it installs on a phone's home screen. Sales pipelines are live today; long and short-term rentals are planned.

## About ${SITE_NAME}

- Name: ${SITE_NAME} (also known as ${SITE_ALTERNATE_NAMES.join(", ")})
- Website: ${SITE_URL}
- Launched: ${SITE_FOUNDED}
- Languages: English, Spanish and Russian
- Contact: ${SUPPORT_EMAIL}
- ${SITE_DISAMBIGUATION}

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
- Viewing scheduler: month calendar with reminders, a read-only calendar feed to subscribe to in Google Calendar, and one-tap WhatsApp confirmations
- Import and export: bring clients in from Excel or CSV files (Google Contacts, Outlook, other CRMs), with a preview and one-click undo; export any list as Excel or CSV and the whole account as a ZIP, on every plan
- Privacy: every agent's clients are isolated; nobody else sees their book

## Pricing

- Free: up to ${FREE_CLIENT_LIMIT} clients (buyers and sellers together), every feature included, no card and no time limit
- Pro: €${pro.monthly} per month or €${pro.yearly} per year, plus VAT (IVA), for unlimited clients
- Referrals: refer another agent and, once you are both on Pro, you each get a free month

## Links

- [Home](${SITE_URL}): product overview, features and pricing
- [About ${SITE_NAME}](${en("about")}): what ${SITE_NAME} is, who it is for, key facts, the name and how to get in touch
- [Pricing](${en("pricing")}): both plans side by side, the founding price and what happens if you cancel
- [Real estate CRM for Spain](${en("crmSpain")}): what a CRM has to handle in the Spanish market, and how ${SITE_NAME} handles it
- [CRM for Marbella and Costa del Sol agents](${en("crmMarbella")}): international buyers, multi-agency listings and viewing days
- [Guide: managing Idealista leads](${en("guideIdealista")}): how to answer and qualify portal enquiries from Idealista, Fotocasa and Kyero
- [Guide: real estate lead follow-up](${en("guideFollowUp")}): a follow-up cadence and message templates in English, Spanish and German
- [Guide: Andalusia's estate agent register](${en("guideAndaluciaRegister")}): a dated summary of what Ley 5/2025 says about registering as an estate agent in Andalusia and of the change the Junta announced on 18 September 2026, with links to the BOE and BOJA
- [Guide: how to become an estate agent in Spain](${en("guideBecomeAgent")}): a dated, sourced summary of what Spanish law requires to work as an estate agent (no title or professional association nationally), which regions have a register and whether it is mandatory, and the steps to register as self-employed (modelo 036, IAE heading, RETA, invoicing), with links to the BOE and regional bulletins
- [Guide: what property portals charge agents in Spain](${en("guidePortalPrices")}): a dated table of what Idealista, Fotocasa, habitaclia, pisos.com, yaencontre, Kyero, ThinkSpain, Properstar, Spainhouses, FINN.no and other portals publish about their prices for agencies, separating official prices from unverified reported figures, with links to each source
- [Guide: free real estate CRMs in Spain](${en("guideFreeCrm")}): a dated comparison of the free plans of inmoGesco, Witei, InmoProCRM, PropertyList, Fincta, ${SITE_NAME}, HubSpot and Zoho CRM (each plan's limit in clients, properties, users or credits, what costs extra and the cheapest paid plan), plus the CRMs that offer only a trial, with links to each vendor's own pages
- [Guide: the best CRM for an independent estate agent in Spain](${en("guideBestCrm")}): which kind of CRM fits each way of working (selling other agencies' listings, listing your own properties on the portals, the Costa del Sol's shared-listings networks, WhatsApp, clients who don't speak Spanish), with each vendor's cheapest plan for one agent and links to their own pages
- [Guide: Witei and Inmovilla alternatives](${en("guideCrmAlternatives")}): what Witei and Inmovilla cost and include (owner, free plan, users, idealista, WhatsApp, sharing with other agencies), the alternatives and what each is best for, and how to export your clients from either, with links to each vendor's help centre
- [Sign in](${SITE_URL}/login): Google or a one-time email code, no password
- [Sitemap](${SITE_URL}/sitemap.xml)

## Free tools

- [Free tools for estate agents](${en("tools")}): every tool below on one page
${TOOL_ROUTES.map((route) => `- ${TOOL_LINES[route]}`).join("\n")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
