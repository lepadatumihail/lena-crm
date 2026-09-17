/**
 * The import template: LeadWing's own headers for a side, with two sample
 * rows, so an agent can fill it in and every column matches by itself.
 */
import type { ClientSide } from "@/lib/crm";
import { columnsForSide, type ClientRecord, type TransferColumnKey } from "@/lib/transfer/columns";
import { clientTable, type Table, type TransferContext } from "@/lib/transfer/format";

/* Filled in by LeadWing, never by an agent's file. */
const NOT_IN_TEMPLATE = new Set<TransferColumnKey>([
  "id",
  "created_at",
  "updated_at",
  "viewing_count",
  "down_payment",
  "down_payment_date",
  "ppc",
  "ppc_date",
  "notary_date",
  "notary_notes",
  "commission",
  "closed_at",
]);

/* The same made-up people as the OG image, so nobody real is in a sample. */
const SAMPLES: Record<ClientSide, ClientRecord[]> = {
  buyer: [
    {
      first_name: "Anna",
      last_name: "Karlsson",
      email: "anna.karlsson@example.com",
      phone: "+46 701234567",
      language: "Swedish",
      nationality: "Swedish",
      agency: "Nordic Homes",
      stage: "viewing",
      deal_type: "direct",
      priority: true,
      is_active: true,
      budget_min: 400000,
      budget_max: 650000,
      property_types: ["villa", "townhouse"],
      bedrooms: 3,
      bathrooms: 2,
      area_notes: "Nueva Andalucía, Benahavís",
      notes: "Wants a view; visiting in October.",
    },
    {
      first_name: "James",
      last_name: "Holt",
      email: "james.holt@example.com",
      phone: "+44 7700900123",
      language: "English",
      nationality: "British",
      agency: null,
      stage: "qualified",
      deal_type: "collab",
      priority: false,
      is_active: true,
      budget_min: null,
      budget_max: 350000,
      property_types: ["apartment"],
      bedrooms: 2,
      bathrooms: null,
      area_notes: "Estepona, near the beach",
      notes: null,
    },
  ],
  seller: [
    {
      first_name: "Sofía",
      last_name: "Martín",
      email: "sofia.martin@example.com",
      phone: "+34 600123456",
      language: "Spanish",
      nationality: "Spanish",
      agency: null,
      stage: "qualified",
      seller_role: "owner",
      priority: true,
      is_active: true,
      property_type: "villa",
      price: 1250000,
      property_bedrooms: 4,
      address: "Calle Ejemplo 12",
      city: "Marbella",
      property_notes: "Sea views, renovated in 2024.",
      notes: "Prefers viewings in the morning.",
    },
    {
      first_name: "Sofía",
      last_name: "Martín",
      email: "sofia.martin@example.com",
      phone: "+34 600123456",
      language: "Spanish",
      nationality: "Spanish",
      agency: null,
      stage: "qualified",
      seller_role: "owner",
      priority: true,
      is_active: true,
      property_type: "plot",
      price: 400000,
      property_bedrooms: null,
      address: null,
      city: "Benahavís",
      property_notes: "Second row: the same seller with another property.",
      notes: "Prefers viewings in the morning.",
    },
  ],
};

/** The template as a table: the export's headers minus what LeadWing fills in itself. */
export function templateTable(side: ClientSide, ctx: TransferContext): Table {
  const keep = columnsForSide(side).map((c) => !NOT_IN_TEMPLATE.has(c.key));
  const full = clientTable(side, SAMPLES[side], ctx);
  return {
    headers: full.headers.filter((_, i) => keep[i]),
    rows: full.rows.map((row) => row.filter((_, i) => keep[i])),
  };
}
