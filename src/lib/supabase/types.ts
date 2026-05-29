// Hand-written to mirror supabase/migrations/20260529120000_init.sql.
// Regenerate from the live database once linked:
//   npx supabase gen types typescript --linked > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          agent_id: string;
          side: Database["public"]["Enums"]["client_side"];
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          language: string | null;
          nationality: string | null;
          notes: string | null;
          priority: boolean;
          is_active: boolean;
          agency: string | null;
          stage: string;
          deal_type: Database["public"]["Enums"]["deal_type"] | null;
          seller_role: Database["public"]["Enums"]["seller_role"] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          side: Database["public"]["Enums"]["client_side"];
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          language?: string | null;
          nationality?: string | null;
          notes?: string | null;
          priority?: boolean;
          is_active?: boolean;
          agency?: string | null;
          stage: string;
          deal_type?: Database["public"]["Enums"]["deal_type"] | null;
          seller_role?: Database["public"]["Enums"]["seller_role"] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          side?: Database["public"]["Enums"]["client_side"];
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          language?: string | null;
          nationality?: string | null;
          notes?: string | null;
          priority?: boolean;
          is_active?: boolean;
          agency?: string | null;
          stage?: string;
          deal_type?: Database["public"]["Enums"]["deal_type"] | null;
          seller_role?: Database["public"]["Enums"]["seller_role"] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      buyer_preferences: {
        Row: {
          client_id: string;
          agent_id: string;
          property_types: string[];
          budget_min: number | null;
          budget_max: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          area_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          agent_id?: string;
          property_types?: string[];
          budget_min?: number | null;
          budget_max?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          area_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          agent_id?: string;
          property_types?: string[];
          budget_min?: number | null;
          budget_max?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          area_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      viewings: {
        Row: {
          id: string;
          client_id: string;
          agent_id: string;
          title: string | null;
          description: string | null;
          had_offer: boolean;
          offer_price: number | null;
          property_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          agent_id?: string;
          title?: string | null;
          description?: string | null;
          had_offer?: boolean;
          offer_price?: number | null;
          property_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          agent_id?: string;
          title?: string | null;
          description?: string | null;
          had_offer?: boolean;
          offer_price?: number | null;
          property_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      viewing_attachments: {
        Row: {
          id: string;
          viewing_id: string;
          agent_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          size: number | null;
          kind: Database["public"]["Enums"]["viewing_attachment_kind"];
          created_at: string;
        };
        Insert: {
          id?: string;
          viewing_id: string;
          agent_id?: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          size?: number | null;
          kind: Database["public"]["Enums"]["viewing_attachment_kind"];
          created_at?: string;
        };
        Update: {
          id?: string;
          viewing_id?: string;
          agent_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
          size?: number | null;
          kind?: Database["public"]["Enums"]["viewing_attachment_kind"];
          created_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          client_id: string;
          agent_id: string;
          down_payment: number | null;
          down_payment_date: string | null;
          ppc: number | null;
          ppc_date: string | null;
          notary_date: string | null;
          notary_notes: string | null;
          commission: number | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          agent_id?: string;
          down_payment?: number | null;
          down_payment_date?: string | null;
          ppc?: number | null;
          ppc_date?: string | null;
          notary_date?: string | null;
          notary_notes?: string | null;
          commission?: number | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          agent_id?: string;
          down_payment?: number | null;
          down_payment_date?: string | null;
          ppc?: number | null;
          ppc_date?: string | null;
          notary_date?: string | null;
          notary_notes?: string | null;
          commission?: number | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          client_id: string;
          agent_id: string;
          price: number | null;
          bedrooms: number | null;
          property_type: string | null;
          address: string | null;
          city: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          agent_id?: string;
          price?: number | null;
          bedrooms?: number | null;
          property_type?: string | null;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          agent_id?: string;
          price?: number | null;
          bedrooms?: number | null;
          property_type?: string | null;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          agent_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          agent_id?: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          agent_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_accounts: {
        Row: {
          id: string;
          agent_id: string;
          provider: Database["public"]["Enums"]["email_provider"];
          from_address: string;
          reply_to: string | null;
          token_ref: string | null;
          status: Database["public"]["Enums"]["email_account_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          provider: Database["public"]["Enums"]["email_provider"];
          from_address: string;
          reply_to?: string | null;
          token_ref?: string | null;
          status?: Database["public"]["Enums"]["email_account_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          provider?: Database["public"]["Enums"]["email_provider"];
          from_address?: string;
          reply_to?: string | null;
          token_ref?: string | null;
          status?: Database["public"]["Enums"]["email_account_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          subject: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          name: string;
          subject: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          name?: string;
          subject?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheduled_emails: {
        Row: {
          id: string;
          agent_id: string;
          client_id: string;
          template_id: string | null;
          email_account_id: string | null;
          send_at: string;
          status: Database["public"]["Enums"]["scheduled_email_status"];
          sent_at: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          client_id: string;
          template_id?: string | null;
          email_account_id?: string | null;
          send_at: string;
          status?: Database["public"]["Enums"]["scheduled_email_status"];
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          client_id?: string;
          template_id?: string | null;
          email_account_id?: string | null;
          send_at?: string;
          status?: Database["public"]["Enums"]["scheduled_email_status"];
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      client_side: "buyer" | "seller";
      deal_type: "direct" | "collab";
      seller_role: "owner" | "representative";
      viewing_attachment_kind: "window_card" | "image";
      email_provider: "google" | "microsoft" | "resend";
      email_account_status: "connected" | "disconnected" | "error";
      scheduled_email_status: "pending" | "sent" | "failed" | "cancelled";
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

// Convenience row aliases
export type Client = Tables<"clients">;
export type BuyerPreferences = Tables<"buyer_preferences">;
export type Viewing = Tables<"viewings">;
export type ViewingAttachment = Tables<"viewing_attachments">;
export type Reservation = Tables<"reservations">;
export type Property = Tables<"properties">;
export type DocumentRow = Tables<"documents">;
export type EmailAccount = Tables<"email_accounts">;
export type EmailTemplate = Tables<"email_templates">;
export type ScheduledEmail = Tables<"scheduled_emails">;
