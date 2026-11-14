import { describe, expect, it } from "vitest";

import { suggestEmail } from "@/lib/email-typo";

describe("suggestEmail", () => {
  it("catches the slip that cost a sign-up on 14 Nov 2026", () => {
    expect(suggestEmail("nico.elorduy@gmal.com")).toBe("nico.elorduy@gmail.com");
  });

  it("fixes the usual Gmail slips", () => {
    for (const domain of ["gamil.com", "gmial.com", "gnail.com", "gmai.com", "gmaill.com", "gmail.con", "gmail.cmo", "gmail.co", "gmail.comm"]) {
      expect(suggestEmail(`ana@${domain}`), domain).toBe("ana@gmail.com");
    }
  });

  it("sends a Gmail address with no ending, or a country ending, to gmail.com", () => {
    expect(suggestEmail("ana@gmail")).toBe("ana@gmail.com");
    expect(suggestEmail("ana@gmail.es")).toBe("ana@gmail.com");
  });

  it("keeps the country a provider really has", () => {
    expect(suggestEmail("ana@hotmial.com")).toBe("ana@hotmail.com");
    expect(suggestEmail("ana@hotmail.con")).toBe("ana@hotmail.com");
    expect(suggestEmail("ana@hotmal.es")).toBe("ana@hotmail.es");
    expect(suggestEmail("ana@outlok.es")).toBe("ana@outlook.es");
    expect(suggestEmail("ana@yahooo.es")).toBe("ana@yahoo.es");
    expect(suggestEmail("ana@icloud.co")).toBe("ana@icloud.com");
    expect(suggestEmail("ivan@yandx.ru")).toBe("ivan@yandex.ru");
  });

  it("fixes a .con ending on an agency's own domain", () => {
    expect(suggestEmail("info@costasolhomes.con")).toBe("info@costasolhomes.com");
  });

  it("keeps the part before the @ as typed and ignores case and spaces in the domain", () => {
    expect(suggestEmail("  Nico.E@GMAL.COM ")).toBe("Nico.E@gmail.com");
  });

  it("leaves real addresses alone", () => {
    for (const email of [
      "ana@gmail.com",
      "ana@hotmail.es",
      "ana@hotmail.co.uk",
      "ana@hotmail.nl",
      "ana@outlook.de",
      "ana@mail.com",
      "ana@email.com",
      "ana@ymail.com",
      "ana@gmx.es",
      "ana@me.com",
      "ana@live.com",
      "ivan@mail.ru",
      "ana@proton.me",
      "you@terramarbella.com",
      "mi@team.graph.swiss",
      "ana@agency.co",
    ]) {
      expect(suggestEmail(email), email).toBeNull();
    }
  });

  it("says nothing about input that isn't an address yet", () => {
    for (const value of ["", "nico", "@gmail.com", "nico@"]) {
      expect(suggestEmail(value), value).toBeNull();
    }
  });
});
