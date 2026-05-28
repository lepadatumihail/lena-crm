import type { Enums } from "@/lib/supabase/types";

export type ClientSide = Enums<"client_side">;

export const BUYER_STAGES = [
  "new",
  "contacted",
  "qualified",
  "viewing",
  "reserved",
] as const;
export const SELLER_STAGES = ["pending", "qualified"] as const;

export type BuyerStage = (typeof BUYER_STAGES)[number];
export type SellerStage = (typeof SELLER_STAGES)[number];
export type Stage = BuyerStage | SellerStage;

export const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  viewing: "Viewing",
  reserved: "Reserved",
  pending: "Pending",
};

export type BadgeTone =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning";

export const STAGE_TONES: Record<Stage, BadgeTone> = {
  new: "outline",
  contacted: "secondary",
  qualified: "default",
  viewing: "warning",
  reserved: "success",
  pending: "outline",
};

export function stagesForSide(side: ClientSide): readonly Stage[] {
  return side === "buyer" ? BUYER_STAGES : SELLER_STAGES;
}

export function defaultStageForSide(side: ClientSide): Stage {
  return side === "buyer" ? "new" : "pending";
}

export function stageIndex(side: ClientSide, stage: string): number {
  return (stagesForSide(side) as readonly string[]).indexOf(stage);
}

/** True when a buyer client has reached `min` or a later stage. */
export function buyerStageAtLeast(stage: string, min: BuyerStage): boolean {
  const order = BUYER_STAGES as readonly string[];
  return order.indexOf(stage) >= order.indexOf(min);
}

export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "townhouse",
  "plot",
  "commercial",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  villa: "Villa",
  townhouse: "Townhouse",
  plot: "Plot",
  commercial: "Commercial",
};

export const DEAL_TYPE_LABELS: Record<Enums<"deal_type">, string> = {
  direct: "Direct",
  collab: "Collaboration",
};

export const SELLER_ROLE_LABELS: Record<Enums<"seller_role">, string> = {
  owner: "Owner",
  representative: "Representative",
};

/** Common languages spoken by clients on the Costa del Sol. */
export const LANGUAGES = [
  "English",
  "Spanish",
  "German",
  "French",
  "Dutch",
  "Swedish",
  "Russian",
  "Arabic",
  "Italian",
  "Polish",
] as const;

export function clientFullName(c: {
  first_name: string;
  last_name: string;
}): string {
  return `${c.first_name} ${c.last_name}`.trim();
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
