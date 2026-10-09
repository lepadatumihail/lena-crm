import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { ToolCards } from "@/components/tools/tool-cards";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { marketingPath } from "@/lib/routes";
import { CHECKED } from "@/lib/seo";

function Body() {
  return (
    <>
      <ToolCards locale="en" />
      <p>
        Need the words for your follow-ups as well? The{" "}
        <Link href={marketingPath("guideFollowUp", "en")}>follow-up guide</Link> has a cadence for
        buyers and messages you can send as they are, in English, Spanish and German.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Free tools for estate agents in Spain",
  description:
    "Free tools for estate agents in Spain: a commission calculator with VAT and splits, an earnings calculator and a client tracker spreadsheet for LeadWing.",
  kind: "page",
  published: "2026-09-29",
  modified: CHECKED.tools,
  eyebrow: "Free tools",
  heading: "Free tools for estate agents",
  lead: "Calculators for the fee on your next sale and for what a year of sales leaves you, and a spreadsheet for your clients. No account and no email: open them and use them.",
  Body,
  faq: [
    {
      q: "Are the tools free?",
      a: "Yes. All three work without an account or an email address: the calculators run in your browser and the spreadsheet downloads straight away.",
    },
    {
      q: "Do I need LeadWing to use them?",
      a: `No, they work on their own. LeadWing is the CRM they lead to: the spreadsheet's columns import into it as they are, and it's free for up to ${FREE_CLIENT_LIMIT} clients.`,
    },
    {
      q: "Who are they for?",
      a: "Independent estate agents in Spain, including agents who work with several agencies. The commission calculator handles the fee, VAT or IGIC, splits and IRPF; the earnings calculator turns a year of sales into your take-home; the spreadsheet keeps track of buyers and sellers.",
    },
  ],
  related: ["guideFollowUp", "guideIdealista", "pricing"],
};
