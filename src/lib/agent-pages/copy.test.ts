import { describe, expect, it } from "vitest";

import { PAGE_LANGS } from "./content";
import { PAGE_COPY, fill, languageName, type PageCopy } from "./copy";

/** Every string in a copy object, keyed by its path ("errors.name"). */
function strings(value: unknown, path = ""): Record<string, string> {
  if (typeof value === "string") return { [path]: value };
  if (Array.isArray(value)) {
    return Object.assign({}, ...value.map((v, i) => strings(v, `${path}[${i}]`)));
  }
  if (value && typeof value === "object") {
    return Object.assign(
      {},
      ...Object.entries(value).map(([k, v]) => strings(v, path ? `${path}.${k}` : k))
    );
  }
  return {};
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("page copy", () => {
  const english = strings(PAGE_COPY.en);

  it.each(PAGE_LANGS.filter((l) => l !== "en"))("%s has every string English has", (lang) => {
    const other = strings(PAGE_COPY[lang] satisfies PageCopy);
    expect(Object.keys(other).sort()).toEqual(Object.keys(english).sort());
    for (const [key, value] of Object.entries(other)) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it.each(PAGE_LANGS.filter((l) => l !== "en"))("%s keeps English's {placeholders}", (lang) => {
    const other = strings(PAGE_COPY[lang]);
    for (const [key, value] of Object.entries(english)) {
      expect(placeholders(other[key]), key).toEqual(placeholders(value));
    }
  });
});

describe("fill", () => {
  it("fills known placeholders and leaves unknown ones visible", () => {
    expect(fill("Send to {name}", { name: "Elin" })).toBe("Send to Elin");
    expect(fill("{name} at {agency}", { name: "Elin" })).toBe("Elin at {agency}");
  });
});

describe("languageName", () => {
  it("names a language in the page's language, capitalised", () => {
    expect(languageName("sv", "en")).toBe("Swedish");
    expect(languageName("sv", "es")).toBe("Sueco");
    expect(languageName("en", "sv")).toBe("Engelska");
  });
});
