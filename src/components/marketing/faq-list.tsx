import { ChevronDown } from "lucide-react";

export type FaqListEntry = {
  key: string;
  question: string;
  /** Usually a string; a node so an answer can carry a link (see the landing FAQ). */
  answer: React.ReactNode;
};

/**
 * Card classes for the wrapper around a FaqList. The wrapper belongs to the
 * caller so it can be a `Reveal`, a plain div or a section — only the styling
 * is shared.
 */
export const FAQ_CARD = "bg-card divide-y rounded-2xl border shadow-xs";

/**
 * Plain <details> so every answer is in the HTML for crawlers and works with
 * no JavaScript. Shared by the landing FAQ, the pricing page and the written
 * pages, whose entries also feed the FAQPage structured data.
 */
export function FaqList({ entries }: { entries: FaqListEntry[] }) {
  return (
    <>
      {entries.map(({ key, question, answer }) => (
        <details key={key} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="font-medium">{question}</h3>
            <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{answer}</p>
        </details>
      ))}
    </>
  );
}
