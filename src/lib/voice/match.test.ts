import { describe, expect, it } from "vitest";

import { matchPerson, personNames } from "./match";

const clients = [
  { id: "mark", first_name: "Mark", last_name: "Johnson" },
  { id: "anna-s", first_name: "Anna", last_name: "Svensson" },
  { id: "anna-m", first_name: "Anna", last_name: "Müller" },
  { id: "carlos", first_name: "Carlos", last_name: "Ruiz López" },
  { id: "maria", first_name: "María José", last_name: "López" },
];
const person = (spoken: string, first_name: string | null = null, last_name: string | null = null) => ({
  spoken,
  first_name,
  last_name,
});
const ids = (r: { candidates: { id: string }[] }) => r.candidates.map((c) => c.id);

describe("personNames", () => {
  it("reads names from the spoken reference when the model gave none", () => {
    expect(personNames(person("the Johnsons"))).toEqual({ first: null, last: "johnsons" });
    expect(personNames(person("Mark and Sarah Johnson"))).toEqual({ first: "mark", last: "johnson" });
    expect(personNames(person("Sra. López"))).toEqual({ first: null, last: "lopez" });
    expect(personNames(person("Anna Svensson", "Anna", "Svensson"))).toEqual({ first: "anna", last: "svensson" });
  });
});

describe("matchPerson", () => {
  it("finds a family by its plural surname", () => {
    const r = matchPerson(person("the Johnsons"), clients);
    expect(r.kind).toBe("one");
    expect(ids(r)).toEqual(["mark"]);
  });

  it("matches a full name exactly, accents ignored", () => {
    expect(ids(matchPerson(person("Anna Muller", "Anna", "Muller"), clients))).toEqual(["anna-m"]);
    expect(matchPerson(person("Anna Svensson", "Anna", "Svensson"), clients).kind).toBe("one");
  });

  it("asks when a first name alone fits two clients", () => {
    const r = matchPerson(person("Anna"), clients);
    expect(r.kind).toBe("many");
    expect(ids(r)).toEqual(["anna-s", "anna-m"]);
  });

  it("matches one part of a compound surname or first name", () => {
    expect(ids(matchPerson(person("Carlos Ruiz", "Carlos", "Ruiz"), clients))).toEqual(["carlos"]);
    expect(ids(matchPerson(person("María López", "María", "López"), clients))).toEqual(["maria"]);
  });

  it("only suggests, never decides, when the names half match", () => {
    const sameSurname = matchPerson(person("Sarah Johnson", "Sarah", "Johnson"), clients);
    expect(sameSurname.kind).toBe("many");
    expect(ids(sameSurname)).toEqual(["mark"]);

    const sameFirst = matchPerson(person("Anna Lindqvist", "Anna", "Lindqvist"), clients);
    expect(sameFirst.kind).toBe("many");
  });

  it("forgives a misspelt surname when the first name agrees (seen live: Svenson)", () => {
    const r = matchPerson(person("Anna Svenson", "Anna", "Svenson"), clients);
    expect(r.kind).toBe("one");
    expect(ids(r)).toEqual(["anna-s"]);
  });

  it("only suggests a misspelt surname heard on its own", () => {
    const r = matchPerson(person("the Jonsons"), clients);
    expect(r.kind).toBe("many");
    expect(ids(r)).toEqual(["mark"]);
  });

  it("never stretches short or very different surnames", () => {
    expect(matchPerson(person("Ana Ruis", "Ana", "Ruis"), clients).kind).toBe("none");
    expect(matchPerson(person("Anna Svensen-Berg", "Anna", "Lindqvist"), clients).kind).toBe("many");
  });

  it("returns none for a stranger", () => {
    expect(matchPerson(person("Pieter de Vries", "Pieter", "de Vries"), clients)).toEqual({ kind: "none", candidates: [] });
    expect(matchPerson(person("the"), clients).kind).toBe("none");
  });
});
