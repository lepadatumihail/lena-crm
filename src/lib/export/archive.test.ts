// @vitest-environment node
import { unzipSync } from "fflate";
import Papa from "papaparse";
import readExcelFile from "read-excel-file/node";
import { describe, expect, it } from "vitest";

import type { Client, Profile, Property } from "@/lib/supabase/types";
import { CSV_BOM } from "@/lib/transfer/csv";
import { contextFor } from "@/lib/transfer/testing";

import { README_FILE, WORKBOOK_FILE, buildAccountZip } from "./archive";
import { buyerRecord, sellerRecords, type AccountExport } from "./load";

const NOW = new Date("2026-09-16T10:00:00Z");
const AGENT = "00000000-0000-4000-8000-000000000001";

function client(id: string, overrides: Partial<Client>): Client {
  return {
    id,
    agent_id: AGENT,
    side: "buyer",
    first_name: "Anna",
    last_name: "Berg",
    email: "anna@example.com",
    phone: "+46 70 123 45 67",
    language: "Swedish",
    nationality: "Swedish",
    notes: "=HYPERLINK(\"http://evil.test\")\nSecond line; with a semicolon",
    priority: true,
    is_active: true,
    agency: "Marbella Homes",
    stage: "viewing",
    deal_type: "collab",
    seller_role: null,
    import_id: null,
    last_contacted_at: null,
    created_at: "2026-09-01T08:00:00Z",
    updated_at: "2026-09-10T16:45:00Z",
    ...overrides,
  };
}

const buyer = client("b1", {});
const seller = client("s1", {
  side: "seller",
  first_name: "José",
  last_name: "Peña",
  stage: "pending",
  deal_type: null,
  seller_role: "owner",
  notes: null,
  created_at: "2026-09-02T08:00:00Z",
});

function property(id: string, created_at: string, price: number): Property {
  return {
    id,
    client_id: seller.id,
    agent_id: AGENT,
    price,
    bedrooms: 4,
    property_type: "villa",
    address: "Calle Mayor 1",
    city: "Mijas",
    notes: null,
    created_at,
    updated_at: created_at,
  };
}

const properties = [
  property("p2", "2026-09-05T08:00:00Z", 1500000),
  property("p1", "2026-09-03T08:00:00Z", 950000.5),
];

const profile: Profile = {
  id: AGENT,
  email: "agent@example.com",
  full_name: "María Agente",
  locale: "es",
  time_zone: "Europe/Madrid",
  is_admin: false,
  cohort: "founding",
  founding_number: 3,
  referral_code: "abc",
  referred_by: null,
  stripe_customer_id: null,
  subscription_status: "none",
  plan: null,
  plan_monthly_eur: null,
  pro_until: null,
  signup_source: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
};

const data: AccountExport = {
  profile,
  email: "agent@example.com",
  clients: [buyer, seller],
  buyers: [
    buyerRecord(
      buyer,
      {
        client_id: buyer.id,
        agent_id: AGENT,
        property_types: ["villa", "apartment"],
        budget_min: 800000,
        budget_max: 1250000.5,
        bedrooms: 3,
        bathrooms: 2,
        area_notes: "Nueva Andalucía",
        created_at: buyer.created_at,
        updated_at: buyer.updated_at,
      },
      null,
      1
    ),
  ],
  sellers: sellerRecords(seller, properties),
  properties,
  viewings: [
    {
      id: "v1",
      client_id: buyer.id,
      agent_id: AGENT,
      title: "Villa in Mijas",
      description: null,
      had_offer: true,
      offer_price: 900000,
      property_price: 950000,
      scheduled_at: "2026-09-12T09:30:00Z",
      reminder_minutes: 60,
      created_at: "2026-09-08T08:00:00Z",
      updated_at: "2026-09-08T08:00:00Z",
    },
  ],
  appointments: [
    {
      id: "a1",
      agent_id: AGENT,
      type: "meeting",
      title: null,
      client_id: seller.id,
      property_id: "p1",
      property_label: null,
      starts_at: "2026-09-20T15:00:00Z",
      ends_at: null,
      location: "Office",
      notes: null,
      reminder_minutes: 30,
      created_at: "2026-09-09T08:00:00Z",
      updated_at: "2026-09-09T08:00:00Z",
    },
  ],
  tasks: [
    {
      id: "t1",
      agent_id: AGENT,
      client_id: buyer.id,
      title: "Send floor plans",
      description: null,
      status: "in_progress",
      priority: "high",
      due_on: "2026-09-18",
      completed_at: null,
      created_at: "2026-09-09T08:00:00Z",
      updated_at: "2026-09-09T08:00:00Z",
    },
  ],
  taskNotes: [
    { id: "n1", agent_id: AGENT, task_id: "t1", body: "Asked the developer", created_at: "2026-09-10T08:00:00Z" },
  ],
  templates: [],
  dealAnalyses: [],
  files: [
    {
      id: "f1",
      client_id: seller.id,
      attached_to: "property",
      parent_id: "p1",
      file_name: "nota-simple.pdf",
      mime_type: "application/pdf",
      size: 120034,
      created_at: "2026-09-04T08:00:00Z",
    },
  ],
};

const CSV_FILES = [
  "buyers.csv",
  "sellers.csv",
  "viewings.csv",
  "appointments.csv",
  "tasks.csv",
  "task-notes.csv",
  "templates.csv",
  "deal-analyses.csv",
  "files.csv",
  "account.csv",
];

/** The file's text with its byte-order mark kept (fflate's strFromU8 drops it). */
function read(file: Uint8Array): string {
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(file);
}

function rows(file: Uint8Array, delimiter: string): Record<string, string>[] {
  const text = read(file);
  expect(text.startsWith(CSV_BOM)).toBe(true);
  return Papa.parse<Record<string, string>>(text.slice(CSV_BOM.length), {
    delimiter,
    header: true,
  }).data;
}

describe("buildAccountZip", () => {
  it("holds every file", async () => {
    const zip = unzipSync(await buildAccountZip(data, contextFor("en"), NOW));
    expect(Object.keys(zip).sort()).toEqual([...CSV_FILES, README_FILE, WORKBOOK_FILE].sort());
  });

  it("round-trips a buyer through the English CSV", async () => {
    const zip = unzipSync(await buildAccountZip(data, contextFor("en"), NOW));
    const [row] = rows(zip["buyers.csv"], ",");
    expect(row).toMatchObject({
      "First name": "Anna",
      Phone: "+46 70 123 45 67",
      Language: "Swedish",
      Stage: "Viewing",
      "Deal type": "Collaboration",
      Priority: "Yes",
      "Budget max (€)": "1250000.5",
      "Property types": "Villa, Apartment",
      Viewings: "1",
      Created: "2026-09-01 10:00",
      "LeadWing ID": "b1",
    });
    // The pasted formula is defused, and the line break and semicolon survive.
    expect(row.Notes).toBe(`'${buyer.notes}`);
  });

  it("writes Spanish headers, semicolons and decimal commas", async () => {
    const zip = unzipSync(await buildAccountZip(data, contextFor("es"), NOW));
    const [row] = rows(zip["buyers.csv"], ";");
    expect(row).toMatchObject({
      Nombre: "Anna",
      Idioma: "Sueco",
      Nacionalidad: "Sueca",
      Etapa: "Visita",
      "Presupuesto máx. (€)": "1250000,5",
      Prioridad: "Sí",
    });
  });

  it("gives a seller one row per property, oldest first", async () => {
    const zip = unzipSync(await buildAccountZip(data, contextFor("en"), NOW));
    const sellers = rows(zip["sellers.csv"], ",");
    expect(sellers.map((r) => [r["First name"], r["Price (€)"]])).toEqual([
      ["José", "950000.5"],
      ["José", "1500000"],
    ]);
  });

  it("links the other tables to their client", async () => {
    const zip = unzipSync(await buildAccountZip(data, contextFor("en"), NOW));
    expect(rows(zip["viewings.csv"], ",")[0]).toMatchObject({
      Client: "Anna Berg",
      "Client ID": "b1",
      "Made an offer": "Yes",
      "Scheduled at": "2026-09-12 11:30",
    });
    expect(rows(zip["appointments.csv"], ",")[0]).toMatchObject({
      Type: "Meeting",
      Client: "José Peña",
      Property: "Calle Mayor 1",
    });
    expect(rows(zip["tasks.csv"], ",")[0]).toMatchObject({
      Status: "In progress",
      Priority: "High",
      "Due date": "2026-09-18",
    });
    expect(rows(zip["task-notes.csv"], ",")[0]).toMatchObject({ Task: "Send floor plans" });
    expect(rows(zip["files.csv"], ",")[0]).toMatchObject({
      Client: "José Peña",
      "Attached to": "Property",
      "File name": "nota-simple.pdf",
      "Size (bytes)": "120034",
    });
    expect(rows(zip["account.csv"], ",")[0]).toMatchObject({
      Name: "María Agente",
      Email: "agent@example.com",
      Language: "Español",
      Plan: "Free",
      "Founding number": "3",
    });
  });

  it("keeps an empty table as a header row", async () => {
    const zip = unzipSync(await buildAccountZip(data, contextFor("en"), NOW));
    expect(read(zip["templates.csv"])).toBe(
      `${CSV_BOM}Name,Subject,Message,Created,Updated,ID`
    );
  });

  it("puts the same tables in the workbook, a sheet each", async () => {
    const zip = unzipSync(await buildAccountZip(data, contextFor("es"), NOW));
    const sheets = await readExcelFile(Buffer.from(zip[WORKBOOK_FILE]));
    expect(sheets.map((s) => s.sheet)).toEqual([
      "Compradores",
      "Vendedores",
      "Visitas",
      "Calendario",
      "Tareas",
      "Notas de tareas",
      "Plantillas",
      "Análisis de operaciones",
      "Archivos",
      "Cuenta",
    ]);
    const [headers, first] = sheets[0].data;
    expect(first[headers.indexOf("Presupuesto máx. (€)")]).toBe(1250000.5);
    expect(first[headers.indexOf("Teléfono")]).toBe("+46 70 123 45 67");
  });

  it("explains itself in the README", async () => {
    const en = read(unzipSync(await buildAccountZip(data, contextFor("en"), NOW))[README_FILE]);
    expect(en).toContain("Europe/Madrid");
    expect(en).toContain("2026-09-16");
    expect(en).toContain("agent@example.com");
    expect(en).toContain("info@leadwing.app");
    expect(en).toContain('separated by ","');
    for (const file of [...CSV_FILES, WORKBOOK_FILE]) expect(en).toContain(file);

    const es = read(
      unzipSync(await buildAccountZip(data, contextFor("es", "Atlantic/Canary"), NOW))[README_FILE]
    );
    expect(es).toContain("Atlantic/Canary");
    expect(es).toContain("se separan con «;»");
  });
});
