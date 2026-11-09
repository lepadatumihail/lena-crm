import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Sentences } from "@/components/marketing/sentences";

afterEach(cleanup);

function blocks(container: HTMLElement): string[] {
  return [...container.querySelectorAll("h2 > span.inline-block")].map((s) => s.textContent ?? "");
}

describe("Sentences", () => {
  it("puts each sentence of a headline in its own block", () => {
    const { container } = render(
      <h2>
        <Sentences>Free to start. One plan when you grow.</Sentences>
      </h2>
    );
    expect(blocks(container)).toEqual(["Free to start.", "One plan when you grow."]);
    expect(container.querySelector("h2")?.textContent).toBe("Free to start. One plan when you grow.");
  });

  it("splits after a question mark too, in any language", () => {
    const { container } = render(
      <h2>
        <Sentences>¿Busca casa? Cuéntenos qué necesita.</Sentences>
      </h2>
    );
    expect(blocks(container)).toEqual(["¿Busca casa?", "Cuéntenos qué necesita."]);
  });

  it("leaves a single sentence alone", () => {
    const { container } = render(
      <h2>
        <Sentences>The best CRM for an independent agent: it depends</Sentences>
      </h2>
    );
    expect(blocks(container)).toEqual([]);
    expect(container.querySelector("h2")?.innerHTML).toBe(
      "The best CRM for an independent agent: it depends"
    );
  });

  it("keeps rich tags inside the sentence they belong to", () => {
    const rich = ["Stop chasing. Let LeadWing do the ", <span key="n" className="whitespace-nowrap">follow-ups.</span>];
    const { container } = render(
      <h2>
        <Sentences>{rich}</Sentences>
      </h2>
    );
    expect(blocks(container)).toEqual(["Stop chasing.", "Let LeadWing do the follow-ups."]);
    const second = container.querySelectorAll("h2 > span.inline-block")[1];
    expect(second.querySelector(".whitespace-nowrap")?.textContent).toBe("follow-ups.");
  });
});
