import { Children, Fragment, type ReactNode } from "react";

/** A sentence ends at . ! ? or … followed by a space. */
const SENTENCE_END = /(?<=[.!?…])\s+/;

/**
 * Keeps each sentence of a headline in one piece, so the line breaks between
 * "Free to start." and "One plan when you grow." instead of leaving "One" at
 * the end of the first line: every sentence is an inline block, and a sentence
 * wider than the line still wraps inside itself. Takes a plain string or
 * t.rich output (tags such as <nowrap> stay inside their sentence); a single
 * sentence comes back untouched.
 */
export function Sentences({ children }: { children: ReactNode }) {
  const groups: ReactNode[][] = [[]];
  for (const node of Children.toArray(children)) {
    if (typeof node !== "string") {
      groups[groups.length - 1].push(node);
      continue;
    }
    node.split(SENTENCE_END).forEach((part, i) => {
      if (i > 0) groups.push([]);
      if (part) groups[groups.length - 1].push(part);
    });
  }
  const sentences = groups.filter((group) => group.length > 0);
  if (sentences.length < 2) return children;
  return sentences.map((sentence, i) => (
    <Fragment key={i}>
      {i > 0 ? " " : null}
      <span className="inline-block">{sentence}</span>
    </Fragment>
  ));
}
