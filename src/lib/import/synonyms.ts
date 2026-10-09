/**
 * What a column header means. Headers match a *concept*; the file's side then
 * picks the target ("Bedrooms" is a buyer's search on one side and a
 * property's bedrooms on the other). Pass 1 is an exact dictionary of headers
 * seen in LeadWing's own files, Google Contacts, Outlook and the Spanish CRMs;
 * pass 2 reads keywords. Anything unknown is kept as a note.
 */
import enTransfer from "../../../messages/en/transfer.json";
import esTransfer from "../../../messages/es/transfer.json";
import ruTransfer from "../../../messages/ru/transfer.json";
import type { ClientSide } from "@/lib/crm";
import type { TransferColumnKey } from "@/lib/transfer/columns";
import { fold } from "@/lib/utils";

import type { CONTACT_TARGETS, ImportTarget } from "./fields";

/** Concepts that already name their target. */
type DirectConcept =
  | (typeof CONTACT_TARGETS)[number]
  | "deal_type"
  | "seller_role"
  | "budget_min"
  | "budget_max"
  | "add_to_notes"
  | "ignore";

export type Concept =
  | DirectConcept
  /** "Nombre", "Name": a first name or a whole name, decided by its neighbours. */
  | "name"
  | "price"
  | "bedrooms"
  | "bathrooms"
  | "property_type"
  | "zone"
  | "town"
  | "address"
  | "description";

export type HeaderMatch = {
  concept: Concept;
  /** Orders email and phone columns; 1 is the best. */
  rank?: number;
  /** Found in the dictionary, not guessed from a keyword. */
  exact: boolean;
};

/** "E-mail 1 - Value" → "e mail 1 value"; "Dormitorios: mínimos" → "dormitorios minimos". */
export function foldHeader(header: string): string {
  return fold(header)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const SIDE_TARGETS: Partial<Record<Concept, Record<ClientSide, ImportTarget>>> = {
  bedrooms: { buyer: "bedrooms", seller: "property_bedrooms" },
  property_type: { buyer: "property_types", seller: "property_type" },
  price: { buyer: "budget", seller: "price" },
  zone: { buyer: "area_notes", seller: "city" },
  // On a buyer's row a town or an address is usually where the client lives.
  town: { buyer: "add_to_notes", seller: "city" },
  address: { buyer: "add_to_notes", seller: "address" },
  bathrooms: { buyer: "bathrooms", seller: "add_to_notes" },
  description: { buyer: "add_to_notes", seller: "property_notes" },
  budget_min: { buyer: "budget_min", seller: "add_to_notes" },
  budget_max: { buyer: "budget_max", seller: "add_to_notes" },
  deal_type: { buyer: "deal_type", seller: "add_to_notes" },
  seller_role: { buyer: "add_to_notes", seller: "seller_role" },
};

/** The target a concept lands on for this side. `name` is settled by auto-map first. */
export function targetFor(concept: Exclude<Concept, "name">, side: ClientSide): ImportTarget {
  return SIDE_TARGETS[concept]?.[side] ?? (concept as ImportTarget);
}

type Entry = Concept | { concept: Concept; rank: number };

const DICTIONARY: [Entry, string[]][] = [
  ["name", ["Nombre", "Name", "Nom", "Naam"]],
  ["first_name", ["First Name", "Given Name", "Forename", "Nombre de pila", "Vorname", "Prénom", "Voornaam"]],
  [
    "last_name",
    ["Apellidos", "Apellido", "Primer apellido", "Last Name", "Family Name", "Surname", "Nachname", "Nom de famille", "Achternaam"],
  ],
  ["second_last_name", ["Segundo apellido"]],
  ["middle_name", ["Middle Name", "Additional Name"]],
  [
    "full_name",
    ["Nombre completo", "Nombre y apellidos", "Full name", "Contact name", "Client name", "Cliente", "Contacto"],
  ],
  [
    { concept: "email", rank: 1 },
    [
      "Email",
      "E-mail",
      "Email Address",
      "E-mail Address",
      "E-mail 1 - Value",
      "Email 1 - Value",
      "Email principal",
      "Email Cliente",
      "Correo",
      "Correo electrónico",
    ],
  ],
  [
    "add_to_notes",
    ["E-mail 2 Address", "E-mail 3 Address", "E-mail 2 - Value", "Email 2 - Value", "Email secundario", "Email. alternativo"],
  ],
  [
    { concept: "phone", rank: 1 },
    ["Móvil", "Móvil principal", "Mobile", "Mobile Phone", "Cell", "Celular", "WhatsApp", "Handy"],
  ],
  [
    { concept: "phone", rank: 2 },
    ["Teléfono", "Teléfono principal", "Phone", "Telephone", "Tel", "Phone 1 - Value", "Primary Phone", "Telefon"],
  ],
  [
    { concept: "phone", rank: 3 },
    [
      "Teléfono secundario",
      "Móvil secundario",
      "Teléfono alternativo",
      "Home Phone",
      "Business Phone",
      "Other Phone",
      "Phone 2 - Value",
    ],
  ],
  ["language", ["Idioma", "Language", "Sprache", "Langue", "Taal"]],
  ["nationality", ["Nacionalidad", "Nationality", "Nationalität", "Nationalité"]],
  ["agency", ["Agencia", "Agency", "Inmobiliaria", "Oficina", "Office"]],
  ["notes", ["Notas", "Notes", "Observaciones", "Comentarios", "Comments", "Remarks"]],
  ["priority", ["Prioridad", "Priority", "Starred", "VIP"]],
  ["is_active", ["Activo", "Active"]],
  ["is_inactive", ["Oculto", "Archivado", "Inactivo", "Hidden", "Archived", "Inactive"]],
  ["stage", ["Etapa", "Estado", "Fase", "Stage", "Status"]],
  ["deal_type", ["Tipo de operación", "Deal type"]],
  ["seller_role", ["Rol", "Role", "Seller role"]],
  [
    "budget_min",
    ["Precio mínimo de Venta", "Presupuesto mínimo", "Presupuesto mín. (€)", "Presupuesto desde", "Budget min", "Min budget", "Price from"],
  ],
  [
    "budget_max",
    ["Precio máximo de Venta", "Presupuesto máximo", "Presupuesto máx. (€)", "Presupuesto hasta", "Budget max", "Max budget", "Price to"],
  ],
  ["price", ["Precio", "Presupuesto", "Price", "Budget", "Asking price", "Precio de venta", "Precio pedido"]],
  ["bedrooms", ["Dormitorios", "Dormitorios: mínimos", "Habitaciones", "Bedrooms", "Beds"]],
  ["bathrooms", ["Baños", "Baños: mínimos", "Bathrooms", "Baths"]],
  [
    "property_type",
    ["Tipo", "Tipo de inmueble", "Tipo de propiedad", "Tipos de propiedad", "Tipología", "Property type", "Property types"],
  ],
  ["zone", ["Zona", "Zonas", "Area", "Areas", "Ubicación", "Location"]],
  ["town", ["Ciudad", "Población", "Localidad", "Municipio", "City", "Town"]],
  ["address", ["Dirección", "Calle", "Address", "Street"]],
  ["description", ["Descripción", "Description"]],
  // LeadWing has no rentals or surfaces, and a search has one bedroom count.
  [
    "add_to_notes",
    [
      "Precio máximo de Alquiler",
      "Precio mínimo de Alquiler",
      "Alquiler",
      "Venta",
      "Dormitorios: máximo",
      "Baños: máximo",
      "Superficie máxima",
      "Superficie mínima",
      "Altura máxima",
      "Altura mínima",
    ],
  ],
  // The client's own address.
  [
    "add_to_notes",
    ["Calle Cli", "Ciudad Cli", "CP Cli", "Calle Numero Cliente", "Provincia", "Código Postal", "País", "Address 1 - Formatted"],
  ],
  [
    "add_to_notes",
    [
      "Procedencia",
      "Tipo de contacto",
      "Agente",
      "Responsable comercial",
      "Captado por",
      "Colaborador",
      "Creador",
      "Empresa",
      "Company",
      "Organization Name",
      "Organization Title",
      "Organization 1 - Name",
      "Labels",
      "Categories",
      "Group Membership",
      "Alias",
      "Birthday",
      "Aviso Importante Cliente",
    ],
  ],
  // Consent flags. Never an email address, whatever the header says.
  ["add_to_notes", ["Email dado de baja", "GDPR"]],
  // The free client tracker's own columns (lib/tools/tracker.ts). Its dates stay
  // readable in the notes; its day count is a formula over them.
  ["add_to_notes", ["Last contact", "Último contacto", "Next follow-up", "Próximo seguimiento"]],
  ["ignore", ["Days since contact", "Días sin contacto"]],
  // ID, bank and personal data stays out unless the agent asks for it.
  ["ignore", ["NIF", "DNI", "DNI/NIE", "IBAN", "Pasaporte", "Passport", "Sexo", "Estado Civil", "Fecha de nacimiento"]],
  ["ignore", ["Photo", "Name Prefix", "Name Suffix", "Nickname", "File As", "Title"]],
];

/* LeadWing's own columns, so an export maps back in either language. */
const OWN_COLUMNS: Record<TransferColumnKey, Concept> = {
  first_name: "first_name",
  last_name: "last_name",
  email: "email",
  phone: "phone",
  language: "language",
  nationality: "nationality",
  agency: "agency",
  stage: "stage",
  deal_type: "deal_type",
  seller_role: "seller_role",
  priority: "priority",
  is_active: "is_active",
  budget_min: "budget_min",
  budget_max: "budget_max",
  property_types: "property_type",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  area_notes: "zone",
  property_type: "property_type",
  price: "price",
  property_bedrooms: "bedrooms",
  address: "address",
  city: "town",
  property_notes: "description",
  notes: "notes",
  // A reservation isn't imported; its values stay readable in the notes.
  down_payment: "add_to_notes",
  down_payment_date: "add_to_notes",
  ppc: "add_to_notes",
  ppc_date: "add_to_notes",
  notary_date: "add_to_notes",
  notary_notes: "add_to_notes",
  commission: "add_to_notes",
  closed_at: "add_to_notes",
  viewing_count: "ignore",
  created_at: "ignore",
  updated_at: "ignore",
  id: "ignore",
};

const EXACT = new Map<string, HeaderMatch>();
for (const [entry, headers] of DICTIONARY) {
  const match: HeaderMatch =
    typeof entry === "string"
      ? { concept: entry, exact: true }
      : { concept: entry.concept, rank: entry.rank, exact: true };
  for (const header of headers) EXACT.set(foldHeader(header), match);
}
for (const catalog of [enTransfer, esTransfer, ruTransfer]) {
  for (const [key, header] of Object.entries(catalog.columns)) {
    const folded = foldHeader(header);
    // The dictionary above wins: es "Nombre" stays ambiguous, "Teléfono" keeps its rank.
    if (!EXACT.has(folded)) {
      EXACT.set(folded, { concept: OWN_COLUMNS[key as TransferColumnKey], exact: true });
    }
  }
}

type Tokens = readonly string[];
const has = (tokens: Tokens, ...words: string[]) => words.some((w) => tokens.includes(w));
const hasStem = (tokens: Tokens, ...stems: string[]) =>
  stems.some((stem) => tokens.some((token) => token.startsWith(stem)));

/* Pass 2: the first rule that fits wins. */
function byKeyword(tokens: Tokens): HeaderMatch {
  const guess = (concept: Concept, rank?: number): HeaderMatch => ({ concept, rank, exact: false });

  // Inmovilla lists "Conyuge Email" before "Email Cliente".
  if (hasStem(tokens, "conyuge", "spouse", "pareja", "partner")) return guess("add_to_notes");
  if (has(tokens, "baja", "gdpr", "rgpd") || hasStem(tokens, "unsubscrib", "consent")) {
    return guess("add_to_notes");
  }
  if (has(tokens, "nif", "dni", "nie", "iban") || hasStem(tokens, "pasaporte", "passport")) {
    return guess("ignore");
  }
  if (hasStem(tokens, "alquiler", "rent", "superficie", "surface", "altura")) {
    return guess("add_to_notes");
  }
  if (hasStem(tokens, "email", "correo") || has(tokens, "mail")) {
    const second = has(tokens, "2", "3", "other") || hasStem(tokens, "secundari", "alternativ");
    return second ? guess("add_to_notes") : guess("email", 2);
  }
  if (hasStem(tokens, "movil", "mobile", "whatsapp", "celular") || has(tokens, "cell")) {
    return guess("phone", 1);
  }
  if (hasStem(tokens, "telefon", "phone") || has(tokens, "tel")) {
    const second =
      has(tokens, "2", "3", "home", "business", "work", "other") ||
      hasStem(tokens, "secundari", "alternativ");
    return guess("phone", second ? 3 : 2);
  }
  if (hasStem(tokens, "apellido", "surname")) return guess("last_name");
  if (hasStem(tokens, "presupuesto", "budget", "precio", "price")) {
    if (hasStem(tokens, "min") || has(tokens, "desde", "from")) return guess("budget_min");
    if (hasStem(tokens, "max") || has(tokens, "hasta", "to")) return guess("budget_max");
    return guess("price");
  }
  if (hasStem(tokens, "dormitorio", "bedroom", "habitacion")) {
    return hasStem(tokens, "max") ? guess("add_to_notes") : guess("bedrooms");
  }
  if (hasStem(tokens, "bano", "bathroom")) {
    return hasStem(tokens, "max") ? guess("add_to_notes") : guess("bathrooms");
  }
  if (hasStem(tokens, "nota", "note", "observacion", "comentario", "comment")) return guess("notes");
  return guess("add_to_notes");
}

export function matchHeader(header: string): HeaderMatch {
  const folded = foldHeader(header);
  if (!folded) return { concept: "ignore", exact: false };
  const exact = EXACT.get(folded);
  if (exact) return exact;

  const tokens = folded.split(" ");
  // Google's "E-mail 1 - Label", "Phone 1 - Type", and its phonetic names.
  const last = tokens[tokens.length - 1];
  if ((last === "label" || last === "type") && tokens.some((t) => /^\d+$/.test(t))) {
    return { concept: "ignore", exact: true };
  }
  if (tokens[0].startsWith("phonetic")) return { concept: "ignore", exact: true };

  return byKeyword(tokens);
}
