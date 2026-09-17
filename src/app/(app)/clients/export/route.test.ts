// @vitest-environment node
import { createTranslator } from "next-intl";
import Papa from "papaparse";
import readExcelFile from "read-excel-file/node";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { messagesFor } from "@/i18n/messages";

import { POST } from "./route";

const USER = { id: "11111111-1111-4111-8111-111111111111", email: "agent@example.com" };
const BUYER_ID = "22222222-2222-4222-8222-222222222222";

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  locale: "en" as "en" | "es",
  clients: [] as Record<string, unknown>[],
  filters: [] as [string, string, unknown][],
}));

vi.mock("next-intl/server", () => ({
  getLocale: async () => state.locale,
  getTranslations: async (namespace: string) =>
    createTranslator({
      locale: state.locale,
      messages: messagesFor(state.locale),
      namespace: namespace as "transfer",
    }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          state.filters.push([table, column, value]);
          return query;
        },
        in: (column: string, value: unknown) => {
          state.filters.push([table, column, value]);
          return Promise.resolve({ data: state.clients, error: null });
        },
        maybeSingle: async () => ({ data: { time_zone: "Europe/Madrid" }, error: null }),
      };
      return query;
    },
  }),
}));

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://www.leadwing.app/clients/export", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

const valid = { side: "buyer", format: "xlsx", ids: [BUYER_ID] };

beforeEach(() => {
  state.user = USER;
  state.locale = "en";
  state.filters = [];
  state.clients = [
    {
      id: BUYER_ID,
      agent_id: USER.id,
      side: "buyer",
      first_name: "Anna",
      last_name: "Berg",
      phone: "+46 70 123 45 67",
      stage: "viewing",
      priority: false,
      is_active: true,
      created_at: "2026-09-01T08:00:00Z",
      updated_at: "2026-09-01T08:00:00Z",
      buyer_preferences: { budget_max: 900000, property_types: ["villa"] },
      reservations: null,
      viewings: [{ count: 2 }],
    },
  ];
});

describe("POST /clients/export", () => {
  it("refuses another site's request", async () => {
    const response = await post(valid, { origin: "https://evil.example" });
    expect(response.status).toBe(403);
    expect(await post(valid, { "sec-fetch-site": "cross-site" })).toHaveProperty("status", 403);
  });

  it("accepts this site's own origin", async () => {
    const response = await post(valid, { origin: "https://www.leadwing.app" });
    expect(response.status).toBe(200);
  });

  it.each([
    ["not json", "{"],
    ["an unknown side", { ...valid, side: "tenant" }],
    ["an unknown format", { ...valid, format: "pdf" }],
    ["no ids", { ...valid, ids: [] }],
    ["an id that isn't a uuid", { ...valid, ids: ["1 or 1=1"] }],
  ])("rejects %s", async (_label, body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.stringContaining("wasn't valid") });
  });

  it("asks a signed-out agent to sign in, in their language", async () => {
    state.user = null;
    state.locale = "es";
    const response = await post(valid);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Tu sesión ha terminado. Vuelve a iniciar sesión.",
    });
  });

  it("returns the workbook as a download", async () => {
    const response = await post(valid);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="leadwing-buyers-\d{4}-\d{2}-\d{2}\.xlsx"; filename\*=UTF-8''leadwing-buyers-/
    );
    expect(response.headers.get("cache-control")).toBe("no-store");

    const [sheet] = await readExcelFile(Buffer.from(await response.arrayBuffer()));
    expect(sheet.sheet).toBe("Buyers");
    const [headers, row] = sheet.data;
    expect(row[headers.indexOf("First name")]).toBe("Anna");
    expect(row[headers.indexOf("Budget max (€)")]).toBe(900000);
    expect(row[headers.indexOf("Viewings")]).toBe(2);
  });

  it("reads only the signed-in agent's clients on the asked side", async () => {
    await post(valid);
    expect(state.filters).toContainEqual(["clients", "agent_id", USER.id]);
    expect(state.filters).toContainEqual(["clients", "side", "buyer"]);
    expect(state.filters).toContainEqual(["clients", "id", [BUYER_ID]]);
  });

  it("writes a Spanish CSV with a Spanish file name", async () => {
    state.locale = "es";
    const response = await post({ ...valid, format: "csv" });
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("leadwing-compradores-");

    // Keep the byte-order mark: Response.text() would drop it.
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await response.arrayBuffer());
    expect(text.charCodeAt(0)).toBe(0xfeff);
    const [row] = Papa.parse<Record<string, string>>(text.slice(1), {
      delimiter: ";",
      header: true,
    }).data;
    expect(row).toMatchObject({ Nombre: "Anna", Etapa: "Visita", "Presupuesto máx. (€)": "900000" });
  });
});
