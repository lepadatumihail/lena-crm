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
          scheduled_at: string | null;
          reminder_minutes: number | null;
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
          scheduled_at?: string | null;
          reminder_minutes?: number | null;
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
          scheduled_at?: string | null;
          reminder_minutes?: number | null;
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
      property_attachments: {
        Row: {
          id: string;
          agent_id: string;
          property_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          size: number | null;
          kind: Database["public"]["Enums"]["property_attachment_kind"];
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          property_id: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          size?: number | null;
          kind: Database["public"]["Enums"]["property_attachment_kind"];
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          property_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
          size?: number | null;
          kind?: Database["public"]["Enums"]["property_attachment_kind"];
          created_at?: string;
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
      appointments: {
        Row: {
          id: string;
          agent_id: string;
          type: Database["public"]["Enums"]["appointment_type"];
          title: string | null;
          client_id: string | null;
          property_id: string | null;
          property_label: string | null;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          notes: string | null;
          reminder_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          type: Database["public"]["Enums"]["appointment_type"];
          title?: string | null;
          client_id?: string | null;
          property_id?: string | null;
          property_label?: string | null;
          starts_at: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          reminder_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          type?: Database["public"]["Enums"]["appointment_type"];
          title?: string | null;
          client_id?: string | null;
          property_id?: string | null;
          property_label?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          reminder_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          agent_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string | null;
          client_id: string | null;
          appointment_id: string | null;
          task_id: string | null;
          dedupe_key: string;
          due_at: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body?: string | null;
          client_id?: string | null;
          appointment_id?: string | null;
          task_id?: string | null;
          dedupe_key: string;
          due_at?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          body?: string | null;
          client_id?: string | null;
          appointment_id?: string | null;
          task_id?: string | null;
          dedupe_key?: string;
          due_at?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          agent_id: string;
          client_id: string | null;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["task_status"];
          priority: Database["public"]["Enums"]["task_priority"];
          due_on: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          client_id?: string | null;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          priority?: Database["public"]["Enums"]["task_priority"];
          due_on?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          client_id?: string | null;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          priority?: Database["public"]["Enums"]["task_priority"];
          due_on?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_notes: {
        Row: {
          id: string;
          agent_id: string;
          task_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          task_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          task_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      deal_analyses: {
        Row: {
          id: string;
          agent_id: string;
          title: string;
          analysis_date: string;
          property_type: Database["public"]["Enums"]["deal_property_type"];
          asking_price: number;
          transfer_tax_pct: number;
          lawyer_pct: number;
          notary_pct: number;
          renovation_price_per_sqm: number;
          surface_sqm: number;
          contingency_pct: number;
          duration_months: number;
          expected_sale_price: number;
          agency_fee_pct: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string;
          title: string;
          analysis_date?: string;
          property_type?: Database["public"]["Enums"]["deal_property_type"];
          asking_price?: number;
          transfer_tax_pct?: number;
          lawyer_pct?: number;
          notary_pct?: number;
          renovation_price_per_sqm?: number;
          surface_sqm?: number;
          contingency_pct?: number;
          duration_months?: number;
          expected_sale_price?: number;
          agency_fee_pct?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          title?: string;
          analysis_date?: string;
          property_type?: Database["public"]["Enums"]["deal_property_type"];
          asking_price?: number;
          transfer_tax_pct?: number;
          lawyer_pct?: number;
          notary_pct?: number;
          renovation_price_per_sqm?: number;
          surface_sqm?: number;
          contingency_pct?: number;
          duration_months?: number;
          expected_sale_price?: number;
          agency_fee_pct?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          locale: string;
          time_zone: string | null;
          is_admin: boolean;
          cohort: Database["public"]["Enums"]["cohort"];
          founding_number: number | null;
          referral_code: string;
          referred_by: string | null;
          stripe_customer_id: string | null;
          subscription_status: Database["public"]["Enums"]["sub_status"];
          plan: Database["public"]["Enums"]["billing_plan"] | null;
          plan_monthly_eur: number | null;
          pro_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          locale?: string;
          time_zone?: string | null;
          is_admin?: boolean;
          cohort?: Database["public"]["Enums"]["cohort"];
          founding_number?: number | null;
          referral_code?: string;
          referred_by?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: Database["public"]["Enums"]["sub_status"];
          plan?: Database["public"]["Enums"]["billing_plan"] | null;
          plan_monthly_eur?: number | null;
          pro_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          locale?: string;
          time_zone?: string | null;
          is_admin?: boolean;
          cohort?: Database["public"]["Enums"]["cohort"];
          founding_number?: number | null;
          referral_code?: string;
          referred_by?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: Database["public"]["Enums"]["sub_status"];
          plan?: Database["public"]["Enums"]["billing_plan"] | null;
          plan_monthly_eur?: number | null;
          pro_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          inviter_id: string;
          invitee_id: string;
          status: Database["public"]["Enums"]["referral_status"];
          paid_invoice_count: number;
          qualified_at: string | null;
          rewarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          invitee_id: string;
          status?: Database["public"]["Enums"]["referral_status"];
          paid_invoice_count?: number;
          qualified_at?: string | null;
          rewarded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inviter_id?: string;
          invitee_id?: string;
          status?: Database["public"]["Enums"]["referral_status"];
          paid_invoice_count?: number;
          qualified_at?: string | null;
          rewarded_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      referral_credits: {
        Row: {
          id: string;
          agent_id: string;
          kind: Database["public"]["Enums"]["credit_kind"];
          amount_eur: number;
          months: number;
          reason: string;
          referral_id: string | null;
          applied_to_stripe: boolean;
          stripe_balance_txn_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          kind: Database["public"]["Enums"]["credit_kind"];
          amount_eur?: number;
          months?: number;
          reason: string;
          referral_id?: string | null;
          applied_to_stripe?: boolean;
          stripe_balance_txn_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          kind?: Database["public"]["Enums"]["credit_kind"];
          amount_eur?: number;
          months?: number;
          reason?: string;
          referral_id?: string | null;
          applied_to_stripe?: boolean;
          stripe_balance_txn_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stripe_events: {
        Row: { id: string; type: string; received_at: string };
        Insert: { id: string; type: string; received_at?: string };
        Update: { id?: string; type?: string; received_at?: string };
        Relationships: [];
      };
      support_messages: {
        Row: {
          id: string;
          agent_id: string;
          kind: Database["public"]["Enums"]["support_kind"];
          reply_to: string;
          account_email: string | null;
          subject: string | null;
          message: string;
          page: string | null;
          locale: string | null;
          plan: string | null;
          user_agent: string | null;
          delivered_at: string | null;
          delivery_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          kind: Database["public"]["Enums"]["support_kind"];
          reply_to: string;
          account_email?: string | null;
          subject?: string | null;
          message: string;
          page?: string | null;
          locale?: string | null;
          plan?: string | null;
          user_agent?: string | null;
          delivered_at?: string | null;
          delivery_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          kind?: Database["public"]["Enums"]["support_kind"];
          reply_to?: string;
          account_email?: string | null;
          subject?: string | null;
          message?: string;
          page?: string | null;
          locale?: string | null;
          plan?: string | null;
          user_agent?: string | null;
          delivered_at?: string | null;
          delivery_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_pro: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      claim_referral: {
        Args: { p_code: string; p_user_id: string };
        Returns: string;
      };
      allocate_founding_number: {
        Args: { p_user_id: string };
        Returns: number | null;
      };
      grant_pro_time: {
        Args: { p_user_id: string; p_months: number; p_reason: string; p_referral_id?: string | null };
        Returns: string;
      };
      grant_free_month: {
        Args: { p_user_id: string; p_reason: string; p_referral_id: string | null };
        Returns: undefined;
      };
      record_paid_invoice: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      void_referral: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      set_locale: {
        Args: { p_locale: string };
        Returns: undefined;
      };
      update_my_settings: {
        Args: { p_full_name: string | null; p_time_zone: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      client_side: "buyer" | "seller";
      deal_property_type: "resale" | "new_build";
      deal_type: "direct" | "collab";
      seller_role: "owner" | "representative";
      viewing_attachment_kind: "window_card" | "image";
      property_attachment_kind: "pdf" | "image";
      email_provider: "google" | "microsoft" | "resend";
      email_account_status: "connected" | "disconnected" | "error";
      scheduled_email_status: "pending" | "sent" | "failed" | "cancelled";
      appointment_type: "meeting" | "viewing";
      notification_type:
        | "appointment_reminder"
        | "appointment_today"
        | "follow_up"
        | "reservation_date"
        | "stalled_offer"
        | "task_due";
      task_status: "todo" | "in_progress" | "waiting" | "done";
      task_priority: "none" | "low" | "medium" | "high" | "urgent";
      cohort: "founding" | "standard";
      referral_status: "pending" | "qualified" | "rewarded" | "void";
      sub_status: "none" | "active" | "past_due" | "canceled";
      billing_plan: "founding_monthly" | "founding_yearly" | "standard_monthly" | "standard_yearly";
      credit_kind: "stripe_balance" | "pro_time";
      support_kind: "bug" | "feedback" | "feature" | "billing" | "question";
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
export type PropertyAttachment = Tables<"property_attachments">;
export type PropertyAttachmentKind = Enums<"property_attachment_kind">;
export type DocumentRow = Tables<"documents">;
export type EmailAccount = Tables<"email_accounts">;
export type EmailTemplate = Tables<"email_templates">;
export type ScheduledEmail = Tables<"scheduled_emails">;
export type Appointment = Tables<"appointments">;
export type Notification = Tables<"notifications">;
export type DealAnalysis = Tables<"deal_analyses">;
export type Profile = Tables<"profiles">;
export type Referral = Tables<"referrals">;
export type ReferralCredit = Tables<"referral_credits">;
export type SupportMessage = Tables<"support_messages">;
export type Task = Tables<"tasks">;
export type TaskStatus = Enums<"task_status">;
export type TaskPriority = Enums<"task_priority">;
export type TaskNote = Tables<"task_notes">;
