import { describe, expect, it } from "vitest";

import { calculatorHref } from "@/lib/tools/calculator-url";

const at = (search: string, hash = "") => ({ pathname: "/tools/commission-calculator", search, hash });

describe("calculatorHref", () => {
  it("writes the inputs after the path", () => {
    expect(calculatorHref(at(""), "d=sale&p=450000")).toBe("/tools/commission-calculator?d=sale&p=450000");
  });

  it("keeps the utm tags the visit arrived with, after the inputs", () => {
    expect(calculatorHref(at("?utm_source=chatgpt.com"), "d=sale&p=450000")).toBe(
      "/tools/commission-calculator?d=sale&p=450000&utm_source=chatgpt.com"
    );
  });

  it("keeps the tags while the form is still empty", () => {
    expect(calculatorHref(at("?utm_source=facebook&utm_campaign=free10-sep26"), "")).toBe(
      "/tools/commission-calculator?utm_source=facebook&utm_campaign=free10-sep26"
    );
  });

  it("reads its own address back unchanged, so it rewrites nothing twice", () => {
    const first = calculatorHref(at("?utm_source=chatgpt.com&fbclid=abc"), "d=rent");
    const search = first.slice(first.indexOf("?"));
    expect(calculatorHref(at(search), "d=rent")).toBe(first);
  });

  it("drops other parameters and the previous inputs", () => {
    expect(calculatorHref(at("?p=1&fbclid=abc&gclid=x"), "p=2")).toBe("/tools/commission-calculator?p=2");
  });

  it("keeps the hash", () => {
    expect(calculatorHref(at("?utm_source=chatgpt.com", "#faq"), "")).toBe(
      "/tools/commission-calculator?utm_source=chatgpt.com#faq"
    );
  });

  it("is the bare path with neither inputs nor tags", () => {
    expect(calculatorHref(at("?fbclid=abc"), "")).toBe("/tools/commission-calculator");
  });
});
