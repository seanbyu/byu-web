export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          additional_charges: number | null
          artist_id: string
          booking_date: string
          booking_meta: Json | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          deposit_amount: number | null
          deposit_exempt_by_membership: boolean
          deposit_expires_at: string | null
          deposit_forfeited_at: string | null
          deposit_notes: string | null
          deposit_paid_at: string | null
          deposit_payment_method:
            | Database["public"]["Enums"]["payment_method"]
            | null
          deposit_refund_amount: number | null
          deposit_refunded_at: string | null
          deposit_required: boolean
          deposit_status: Database["public"]["Enums"]["deposit_status"] | null
          deposit_transaction_id: string | null
          discount: number | null
          duration_minutes: number
          end_time: string
          id: string
          line_notification_sent: boolean
          line_notification_sent_at: string | null
          membership_id: string | null
          membership_usage_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          salon_id: string
          service_id: string
          service_price: number
          staff_notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          additional_charges?: number | null
          artist_id: string
          booking_date: string
          booking_meta?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          deposit_amount?: number | null
          deposit_exempt_by_membership?: boolean
          deposit_expires_at?: string | null
          deposit_forfeited_at?: string | null
          deposit_notes?: string | null
          deposit_paid_at?: string | null
          deposit_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          deposit_refund_amount?: number | null
          deposit_refunded_at?: string | null
          deposit_required?: boolean
          deposit_status?: Database["public"]["Enums"]["deposit_status"] | null
          deposit_transaction_id?: string | null
          discount?: number | null
          duration_minutes: number
          end_time: string
          id?: string
          line_notification_sent?: boolean
          line_notification_sent_at?: string | null
          membership_id?: string | null
          membership_usage_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salon_id: string
          service_id: string
          service_price: number
          staff_notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          additional_charges?: number | null
          artist_id?: string
          booking_date?: string
          booking_meta?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          deposit_amount?: number | null
          deposit_exempt_by_membership?: boolean
          deposit_expires_at?: string | null
          deposit_forfeited_at?: string | null
          deposit_notes?: string | null
          deposit_paid_at?: string | null
          deposit_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          deposit_refund_amount?: number | null
          deposit_refunded_at?: string | null
          deposit_required?: boolean
          deposit_status?: Database["public"]["Enums"]["deposit_status"] | null
          deposit_transaction_id?: string | null
          discount?: number | null
          duration_minutes?: number
          end_time?: string
          id?: string
          line_notification_sent?: boolean
          line_notification_sent_at?: string | null
          membership_id?: string | null
          membership_usage_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salon_id?: string
          service_id?: string
          service_price?: number
          staff_notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_membership_usage_id_fkey"
            columns: ["membership_usage_id"]
            isOneToOne: false
            referencedRelation: "membership_usages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_filters: {
        Row: {
          condition_logic: string
          conditions: Json
          created_at: string
          display_order: number
          filter_key: string
          id: string
          is_active: boolean
          is_system_filter: boolean
          label: string
          label_en: string | null
          label_th: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          condition_logic?: string
          conditions?: Json
          created_at?: string
          display_order?: number
          filter_key: string
          id?: string
          is_active?: boolean
          is_system_filter?: boolean
          label: string
          label_en?: string | null
          label_th?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          condition_logic?: string
          conditions?: Json
          created_at?: string
          display_order?: number
          filter_key?: string
          id?: string
          is_active?: boolean
          is_system_filter?: boolean
          label?: string
          label_en?: string | null
          label_th?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_filters_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_group_members: {
        Row: {
          added_at: string
          added_by: string | null
          customer_id: string
          group_id: string
          id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          customer_id: string
          group_id: string
          id?: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          customer_id?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_group_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_groups: {
        Row: {
          auto_assign_enabled: boolean
          auto_assign_rules: Json | null
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          group_type: Database["public"]["Enums"]["group_type"]
          icon: string | null
          id: string
          is_active: boolean
          last_auto_assigned_at: string | null
          name: string
          name_en: string | null
          name_th: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          auto_assign_enabled?: boolean
          auto_assign_rules?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          group_type?: Database["public"]["Enums"]["group_type"]
          icon?: string | null
          id?: string
          is_active?: boolean
          last_auto_assigned_at?: string | null
          name: string
          name_en?: string | null
          name_th?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          auto_assign_enabled?: boolean
          auto_assign_rules?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          group_type?: Database["public"]["Enums"]["group_type"]
          icon?: string | null
          id?: string
          is_active?: boolean
          last_auto_assigned_at?: string | null
          name?: string
          name_en?: string | null
          name_th?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_groups_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_memberships: {
        Row: {
          activation_type: Database["public"]["Enums"]["activation_type"]
          bundle_remaining: Json | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          currency: string
          customer_id: string
          expires_at: string | null
          id: string
          initial_amount: number | null
          initial_count: number | null
          membership_number: string
          notes: string | null
          payment_id: string | null
          plan_id: string
          purchase_price: number
          purchased_at: string
          purchased_by: string | null
          refund_amount: number | null
          refund_payment_id: string | null
          refund_reason: string | null
          refunded_at: string | null
          remaining_amount: number | null
          remaining_count: number | null
          salon_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["membership_status"]
          suspended_at: string | null
          suspended_until: string | null
          suspension_reason: string | null
          total_suspension_days: number
          updated_at: string
          used_amount: number
          used_count: number
        }
        Insert: {
          activation_type?: Database["public"]["Enums"]["activation_type"]
          bundle_remaining?: Json | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          initial_amount?: number | null
          initial_count?: number | null
          membership_number: string
          notes?: string | null
          payment_id?: string | null
          plan_id: string
          purchase_price: number
          purchased_at?: string
          purchased_by?: string | null
          refund_amount?: number | null
          refund_payment_id?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          remaining_amount?: number | null
          remaining_count?: number | null
          salon_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          total_suspension_days?: number
          updated_at?: string
          used_amount?: number
          used_count?: number
        }
        Update: {
          activation_type?: Database["public"]["Enums"]["activation_type"]
          bundle_remaining?: Json | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          initial_amount?: number | null
          initial_count?: number | null
          membership_number?: string
          notes?: string | null
          payment_id?: string | null
          plan_id?: string
          purchase_price?: number
          purchased_at?: string
          purchased_by?: string | null
          refund_amount?: number | null
          refund_payment_id?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          remaining_amount?: number | null
          remaining_count?: number | null
          salon_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          total_suspension_days?: number
          updated_at?: string
          used_amount?: number
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_memberships_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_refund_payment_id_fkey"
            columns: ["refund_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          acquisition_meta: Json | null
          address: string | null
          birth_date: string | null
          blacklist_reason: string | null
          blacklisted_at: string | null
          blacklisted_by: string | null
          created_at: string
          customer_number: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          email: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          grade: Database["public"]["Enums"]["customer_grade"] | null
          grade_updated_at: string | null
          id: string
          internal_notes: string | null
          is_blacklisted: boolean
          last_visit: string | null
          line_display_name: string | null
          line_picture_url: string | null
          line_user_id: string | null
          marketing_consent: boolean
          name: string
          no_show_count: number
          notes: string | null
          occupation: string | null
          phone: string | null
          preferences: Json | null
          primary_artist_id: string | null
          salon_id: string
          secondary_phone: string | null
          tags: Database["public"]["Enums"]["customer_tag"][] | null
          total_spent: number
          total_visits: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acquisition_meta?: Json | null
          address?: string | null
          birth_date?: string | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string
          customer_number?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          grade?: Database["public"]["Enums"]["customer_grade"] | null
          grade_updated_at?: string | null
          id?: string
          internal_notes?: string | null
          is_blacklisted?: boolean
          last_visit?: string | null
          line_display_name?: string | null
          line_picture_url?: string | null
          line_user_id?: string | null
          marketing_consent?: boolean
          name: string
          no_show_count?: number
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          preferences?: Json | null
          primary_artist_id?: string | null
          salon_id: string
          secondary_phone?: string | null
          tags?: Database["public"]["Enums"]["customer_tag"][] | null
          total_spent?: number
          total_visits?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acquisition_meta?: Json | null
          address?: string | null
          birth_date?: string | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string
          customer_number?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          grade?: Database["public"]["Enums"]["customer_grade"] | null
          grade_updated_at?: string | null
          id?: string
          internal_notes?: string | null
          is_blacklisted?: boolean
          last_visit?: string | null
          line_display_name?: string | null
          line_picture_url?: string | null
          line_user_id?: string | null
          marketing_consent?: boolean
          name?: string
          no_show_count?: number
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          preferences?: Json | null
          primary_artist_id?: string | null
          salon_id?: string
          secondary_phone?: string | null
          tags?: Database["public"]["Enums"]["customer_tag"][] | null
          total_spent?: number
          total_visits?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_blacklisted_by_fkey"
            columns: ["blacklisted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_primary_artist_id_fkey"
            columns: ["primary_artist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_instagram_tokens: {
        Row: {
          access_token: string
          created_at: string
          designer_id: string
          expires_at: string
          id: string
          instagram_user_id: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          designer_id: string
          expires_at: string
          id?: string
          instagram_user_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          designer_id?: string
          expires_at?: string
          id?: string
          instagram_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "designer_instagram_tokens_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          activation_type: Database["public"]["Enums"]["activation_type"]
          all_services: boolean
          applicable_category_ids: string[] | null
          applicable_service_ids: string[] | null
          bonus_amount: number | null
          bonus_count: number | null
          bundle_items: Json | null
          created_at: string
          currency: string
          deposit_exempt: boolean
          description: string | null
          display_order: number
          duration_days: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_limited_quantity: boolean
          max_per_customer: number | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          name: string
          name_en: string | null
          name_th: string | null
          original_price: number | null
          price: number
          sale_end_date: string | null
          sale_start_date: string | null
          salon_id: string
          shareable: boolean
          sold_quantity: number
          total_amount: number | null
          total_count: number | null
          total_quantity: number | null
          transferable: boolean
          updated_at: string
          usage_limit: number | null
          validity_days: number | null
        }
        Insert: {
          activation_type?: Database["public"]["Enums"]["activation_type"]
          all_services?: boolean
          applicable_category_ids?: string[] | null
          applicable_service_ids?: string[] | null
          bonus_amount?: number | null
          bonus_count?: number | null
          bundle_items?: Json | null
          created_at?: string
          currency?: string
          deposit_exempt?: boolean
          description?: string | null
          display_order?: number
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_limited_quantity?: boolean
          max_per_customer?: number | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          name: string
          name_en?: string | null
          name_th?: string | null
          original_price?: number | null
          price: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          salon_id: string
          shareable?: boolean
          sold_quantity?: number
          total_amount?: number | null
          total_count?: number | null
          total_quantity?: number | null
          transferable?: boolean
          updated_at?: string
          usage_limit?: number | null
          validity_days?: number | null
        }
        Update: {
          activation_type?: Database["public"]["Enums"]["activation_type"]
          all_services?: boolean
          applicable_category_ids?: string[] | null
          applicable_service_ids?: string[] | null
          bonus_amount?: number | null
          bonus_count?: number | null
          bundle_items?: Json | null
          created_at?: string
          currency?: string
          deposit_exempt?: boolean
          description?: string | null
          display_order?: number
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_limited_quantity?: boolean
          max_per_customer?: number | null
          membership_type?: Database["public"]["Enums"]["membership_type"]
          name?: string
          name_en?: string | null
          name_th?: string | null
          original_price?: number | null
          price?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          salon_id?: string
          shareable?: boolean
          sold_quantity?: number
          total_amount?: number | null
          total_count?: number | null
          total_quantity?: number | null
          transferable?: boolean
          updated_at?: string
          usage_limit?: number | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_usages: {
        Row: {
          amount_used: number | null
          booking_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          count_used: number | null
          created_at: string
          id: string
          is_cancelled: boolean
          membership_id: string
          notes: string | null
          processed_by: string | null
          remaining_amount_after: number | null
          remaining_count_after: number | null
          service_id: string | null
          used_at: string
        }
        Insert: {
          amount_used?: number | null
          booking_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          count_used?: number | null
          created_at?: string
          id?: string
          is_cancelled?: boolean
          membership_id: string
          notes?: string | null
          processed_by?: string | null
          remaining_amount_after?: number | null
          remaining_count_after?: number | null
          service_id?: string | null
          used_at?: string
        }
        Update: {
          amount_used?: number | null
          booking_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          count_used?: number | null
          created_at?: string
          id?: string
          is_cancelled?: boolean
          membership_id?: string
          notes?: string | null
          processed_by?: string | null
          remaining_amount_after?: number | null
          remaining_count_after?: number | null
          service_id?: string | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_usages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_usages_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_usages_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_usages_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_usages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          booking_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          external_message_id: string | null
          external_response: Json | null
          id: string
          max_retries: number
          metadata: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          recipient_customer_id: string | null
          recipient_type: Database["public"]["Enums"]["recipient_type"]
          recipient_user_id: string | null
          retry_count: number
          salon_id: string
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          external_message_id?: string | null
          external_response?: Json | null
          id?: string
          max_retries?: number
          metadata?: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          recipient_customer_id?: string | null
          recipient_type: Database["public"]["Enums"]["recipient_type"]
          recipient_user_id?: string | null
          retry_count?: number
          salon_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          external_message_id?: string | null
          external_response?: Json | null
          id?: string
          max_retries?: number
          metadata?: Json | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          recipient_customer_id?: string | null
          recipient_type?: Database["public"]["Enums"]["recipient_type"]
          recipient_user_id?: string | null
          retry_count?: number
          salon_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_customer_id_fkey"
            columns: ["recipient_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          error_code: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          processed_at: string | null
          processed_by: string | null
          promptpay_qr_code: string | null
          promptpay_ref_id: string | null
          provider: string | null
          provider_response: Json | null
          provider_transaction_id: string | null
          refund_of: string | null
          refund_reason: string | null
          salon_id: string
          status: Database["public"]["Enums"]["payment_transaction_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          processed_at?: string | null
          processed_by?: string | null
          promptpay_qr_code?: string | null
          promptpay_ref_id?: string | null
          provider?: string | null
          provider_response?: Json | null
          provider_transaction_id?: string | null
          refund_of?: string | null
          refund_reason?: string | null
          salon_id: string
          status?: Database["public"]["Enums"]["payment_transaction_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          processed_at?: string | null
          processed_by?: string | null
          promptpay_qr_code?: string | null
          promptpay_ref_id?: string | null
          provider?: string | null
          provider_response?: Json | null
          provider_transaction_id?: string | null
          refund_of?: string | null
          refund_reason?: string | null
          salon_id?: string
          status?: Database["public"]["Enums"]["payment_transaction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_refund_of_fkey"
            columns: ["refund_of"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          caption: string | null
          created_at: string
          designer_id: string
          display_order: number
          id: string
          image_url: string
          instagram_permalink: string | null
          is_public: boolean
          source_id: string | null
          source_type: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          designer_id: string
          display_order?: number
          id?: string
          image_url: string
          instagram_permalink?: string | null
          is_public?: boolean
          source_id?: string | null
          source_type?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          designer_id?: string
          display_order?: number
          id?: string
          image_url?: string
          instagram_permalink?: string | null
          is_public?: boolean
          source_id?: string | null
          source_type?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_likes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reason_detail: string | null
          reported_by: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          review_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reason_detail?: string | null
          reported_by: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reason_detail?: string | null
          reported_by?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          artist_id: string
          booking_id: string
          cleanliness_rating: number | null
          comment: string | null
          created_at: string
          customer_id: string
          edited_at: string | null
          id: string
          images: string[] | null
          is_edited: boolean
          is_reported: boolean
          is_visible: boolean
          likes_count: number
          original_comment: string | null
          rating: number
          report_count: number
          responded_at: string | null
          response: string | null
          response_by: string | null
          salon_id: string
          service_rating: number | null
          staff_rating: number | null
          tags: string[] | null
          updated_at: string
          value_rating: number | null
        }
        Insert: {
          artist_id: string
          booking_id: string
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string
          customer_id: string
          edited_at?: string | null
          id?: string
          images?: string[] | null
          is_edited?: boolean
          is_reported?: boolean
          is_visible?: boolean
          likes_count?: number
          original_comment?: string | null
          rating: number
          report_count?: number
          responded_at?: string | null
          response?: string | null
          response_by?: string | null
          salon_id: string
          service_rating?: number | null
          staff_rating?: number | null
          tags?: string[] | null
          updated_at?: string
          value_rating?: number | null
        }
        Update: {
          artist_id?: string
          booking_id?: string
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string
          customer_id?: string
          edited_at?: string | null
          id?: string
          images?: string[] | null
          is_edited?: boolean
          is_reported?: boolean
          is_visible?: boolean
          likes_count?: number
          original_comment?: string | null
          rating?: number
          report_count?: number
          responded_at?: string | null
          response?: string | null
          response_by?: string | null
          salon_id?: string
          service_rating?: number | null
          staff_rating?: number | null
          tags?: string[] | null
          updated_at?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_response_by_fkey"
            columns: ["response_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          salon_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          salon_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_images_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_industries: {
        Row: {
          display_order: number | null
          id: string
          industry_id: string | null
          salon_id: string | null
        }
        Insert: {
          display_order?: number | null
          id?: string
          industry_id?: string | null
          salon_id?: string | null
        }
        Update: {
          display_order?: number | null
          id?: string
          industry_id?: string | null
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_industries_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_industries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_line_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_verified: boolean
          last_verified_at: string | null
          liff_id: string | null
          line_channel_access_token: string
          line_channel_id: string
          line_channel_secret: string
          salon_id: string
          updated_at: string
          verification_error: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          liff_id?: string | null
          line_channel_access_token: string
          line_channel_id: string
          line_channel_secret: string
          salon_id: string
          updated_at?: string
          verification_error?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          liff_id?: string | null
          line_channel_access_token?: string
          line_channel_id?: string
          line_channel_secret?: string
          salon_id?: string
          updated_at?: string
          verification_error?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_line_settings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_promptpay_settings: {
        Row: {
          account_name: string
          bank_account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          is_active: boolean
          is_verified: boolean
          promptpay_id: string
          promptpay_type: string
          qr_code_image: string | null
          salon_id: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          account_name: string
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          promptpay_id: string
          promptpay_type: string
          qr_code_image?: string | null
          salon_id: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          account_name?: string
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          promptpay_id?: string
          promptpay_type?: string
          qr_code_image?: string | null
          salon_id?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_promptpay_settings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string
          approval_status: Database["public"]["Enums"]["approval_status_type"]
          approved_at: string | null
          business_hours: Json | null
          city: string
          country: string
          cover_image_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          email: string | null
          holidays: Json | null
          id: string
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string
          plan_type: string
          postal_code: string | null
          rejected_reason: string | null
          settings: Json | null
          state: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address: string
          approval_status?: Database["public"]["Enums"]["approval_status_type"]
          approved_at?: string | null
          business_hours?: Json | null
          city: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          holidays?: Json | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone: string
          plan_type?: string
          postal_code?: string | null
          rejected_reason?: string | null
          settings?: Json | null
          state?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          approval_status?: Database["public"]["Enums"]["approval_status_type"]
          approved_at?: string | null
          business_hours?: Json | null
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          holidays?: Json | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string
          plan_type?: string
          postal_code?: string | null
          rejected_reason?: string | null
          settings?: Json | null
          state?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          display_order: number
          id: string
          industry_id: string | null
          is_active: boolean
          name: string
          name_en: string | null
          name_th: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          industry_id?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          name_th?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          industry_id?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          name_th?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_categories_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      service_position_prices: {
        Row: {
          created_at: string
          id: string
          position_id: string
          price: number
          pricing_type: string
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_id: string
          price: number
          pricing_type?: string
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position_id?: string
          price?: number
          pricing_type?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_position_prices_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_position_prices_service_id_pricing_type_fkey"
            columns: ["service_id", "pricing_type"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "pricing_type"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          category_id: string | null
          created_at: string
          deleted_at: string | null
          deposit_override: Json | null
          description: string | null
          display_order: number
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_en: string | null
          name_th: string | null
          pricing_type: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deposit_override?: Json | null
          description?: string | null
          display_order?: number
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          name_th?: string | null
          pricing_type?: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deposit_override?: Json | null
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          name_th?: string | null
          pricing_type?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_positions: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          level: number
          name: string
          name_en: string | null
          name_th: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level?: number
          name: string
          name_en?: string | null
          name_th?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          name_en?: string | null
          name_th?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_positions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          created_at: string
          created_by: string | null
          display_order: number
          holidays: Json | null
          is_approved: boolean
          is_booking_enabled: boolean
          is_owner: boolean
          permissions: Json
          position_id: string | null
          salon_id: string
          social_links: Json | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          work_schedule: Json | null
          years_of_experience: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          holidays?: Json | null
          is_approved?: boolean
          is_booking_enabled?: boolean
          is_owner?: boolean
          permissions?: Json
          position_id?: string | null
          salon_id: string
          social_links?: Json | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          work_schedule?: Json | null
          years_of_experience?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          holidays?: Json | null
          is_approved?: boolean
          is_booking_enabled?: boolean
          is_owner?: boolean
          permissions?: Json
          position_id?: string | null
          salon_id?: string
          social_links?: Json | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          work_schedule?: Json | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_artists: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_artists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_salons: {
        Row: {
          created_at: string
          id: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_salons_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_salons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identities: {
        Row: {
          auth_id: string
          connected_at: string
          created_at: string
          id: string
          is_primary: boolean
          last_used_at: string | null
          profile: Json | null
          provider: Database["public"]["Enums"]["auth_provider"]
          provider_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_id: string
          connected_at?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          profile?: Json | null
          provider: Database["public"]["Enums"]["auth_provider"]
          provider_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_id?: string
          connected_at?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          profile?: Json | null
          provider?: Database["public"]["Enums"]["auth_provider"]
          provider_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          primary_identity_id: string | null
          profile_image: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          email: string
          id: string
          is_active?: boolean
          name: string
          phone?: string | null
          primary_identity_id?: string | null
          profile_image?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          primary_identity_id?: string | null
          profile_image?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_primary_identity_id_fkey"
            columns: ["primary_identity_id"]
            isOneToOne: false
            referencedRelation: "user_identities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_membership_usage: {
        Args: { p_cancelled_by?: string; p_reason?: string; p_usage_id: string }
        Returns: boolean
      }
      check_deposit_exempt_by_membership: {
        Args: {
          p_customer_id: string
          p_salon_id: string
          p_service_id?: string
        }
        Returns: {
          is_exempt: boolean
          membership_id: string
          membership_name: string
          remaining_amount: number
          remaining_count: number
        }[]
      }
      create_booking_notification: {
        Args: {
          p_body: string
          p_booking_id: string
          p_channel: Database["public"]["Enums"]["notification_channel"]
          p_metadata?: Json
          p_notification_type: Database["public"]["Enums"]["notification_type"]
          p_recipient_type: Database["public"]["Enums"]["recipient_type"]
          p_title: string
        }
        Returns: string
      }
      expire_memberships: { Args: never; Returns: number }
      find_customer_by_phone: {
        Args: { p_phone: string; p_salon_id: string }
        Returns: string
      }
      find_or_create_user_by_identity: {
        Args: {
          p_auth_id: string
          p_email?: string
          p_name?: string
          p_phone?: string
          p_profile: Json
          p_provider: Database["public"]["Enums"]["auth_provider"]
          p_provider_user_id: string
        }
        Returns: {
          is_new_identity: boolean
          is_new_user: boolean
          user_id: string
        }[]
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_my_salon_id: { Args: never; Returns: string }
      get_next_customer_number: {
        Args: { p_salon_id: string }
        Returns: string
      }
      get_user_identities: {
        Args: { p_user_id: string }
        Returns: {
          connected_at: string
          is_primary: boolean
          last_used_at: string
          profile: Json
          provider: Database["public"]["Enums"]["auth_provider"]
          provider_user_id: string
        }[]
      }
      link_identity: {
        Args: {
          p_auth_id: string
          p_profile?: Json
          p_provider: Database["public"]["Enums"]["auth_provider"]
          p_provider_user_id: string
          p_user_id: string
        }
        Returns: string
      }
      link_line_user_to_customer: {
        Args: {
          p_acquisition_meta?: Json
          p_name?: string
          p_phone: string
          p_salon_id: string
          p_user_id: string
        }
        Returns: {
          customer_id: string
          customer_name: string
          is_new_customer: boolean
        }[]
      }
      seed_default_customer_filters: {
        Args: { p_salon_id: string }
        Returns: undefined
      }
      unlink_identity: {
        Args: {
          p_provider: Database["public"]["Enums"]["auth_provider"]
          p_user_id: string
        }
        Returns: boolean
      }
      use_membership: {
        Args: {
          p_amount_to_use?: number
          p_booking_id: string
          p_count_to_use?: number
          p_membership_id: string
          p_processed_by?: string
          p_service_id: string
        }
        Returns: string
      }
    }
    Enums: {
      activation_type: "IMMEDIATE" | "FIRST_USE"
      approval_status_type: "pending" | "approved" | "rejected"
      auth_provider: "EMAIL" | "LINE" | "GOOGLE" | "KAKAO"
      booking_status:
        | "PENDING"
        | "CONFIRMED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      customer_grade: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND"
      customer_tag:
        | "VIP"
        | "REGULAR"
        | "NEW"
        | "RETURNING"
        | "DORMANT"
        | "CHURNED"
        | "POTENTIAL_VIP"
      customer_type: "local" | "foreign"
      deposit_status:
        | "NOT_REQUIRED"
        | "PENDING"
        | "PAID"
        | "PARTIALLY_REFUNDED"
        | "REFUNDED"
        | "FORFEITED"
      gender_type: "male" | "female" | "other" | "unknown"
      group_type: "MANUAL" | "AUTO" | "HYBRID"
      membership_status:
        | "ACTIVE"
        | "EXPIRED"
        | "EXHAUSTED"
        | "SUSPENDED"
        | "CANCELLED"
        | "REFUNDED"
      membership_type: "COUNT_BASED" | "TIME_BASED" | "AMOUNT_BASED" | "BUNDLE"
      notification_channel: "LINE" | "EMAIL" | "SMS" | "PUSH" | "IN_APP"
      notification_status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"
      notification_type:
        | "BOOKING_REQUEST"
        | "BOOKING_CONFIRMED"
        | "BOOKING_CANCELLED"
        | "BOOKING_REMINDER"
        | "BOOKING_COMPLETED"
        | "BOOKING_NO_SHOW"
        | "BOOKING_MODIFIED"
        | "REVIEW_RECEIVED"
        | "GENERAL"
      payment_method:
        | "CASH"
        | "CREDIT_CARD"
        | "DEBIT_CARD"
        | "BANK_TRANSFER"
        | "PROMPTPAY"
        | "LINE_PAY"
        | "TRUE_MONEY"
        | "RABBIT_LINE_PAY"
        | "SHOPEE_PAY"
        | "OTHER"
      payment_status: "PENDING" | "PAID" | "REFUNDED" | "FAILED"
      payment_transaction_status:
        | "PENDING"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
        | "REFUNDED"
      payment_type:
        | "DEPOSIT"
        | "FULL_PAYMENT"
        | "PARTIAL_PAYMENT"
        | "REFUND"
        | "ADDITIONAL"
      recipient_type: "CUSTOMER" | "ADMIN" | "ARTIST" | "STAFF"
      report_status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED"
      user_role:
        | "SUPER_ADMIN"
        | "ADMIN"
        | "MANAGER"
        | "ARTIST"
        | "STAFF"
        | "CUSTOMER"
      user_type: "SALON" | "CUSTOMER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activation_type: ["IMMEDIATE", "FIRST_USE"],
      approval_status_type: ["pending", "approved", "rejected"],
      auth_provider: ["EMAIL", "LINE", "GOOGLE", "KAKAO"],
      booking_status: [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      customer_grade: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"],
      customer_tag: [
        "VIP",
        "REGULAR",
        "NEW",
        "RETURNING",
        "DORMANT",
        "CHURNED",
        "POTENTIAL_VIP",
      ],
      customer_type: ["local", "foreign"],
      deposit_status: [
        "NOT_REQUIRED",
        "PENDING",
        "PAID",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
        "FORFEITED",
      ],
      gender_type: ["male", "female", "other", "unknown"],
      group_type: ["MANUAL", "AUTO", "HYBRID"],
      membership_status: [
        "ACTIVE",
        "EXPIRED",
        "EXHAUSTED",
        "SUSPENDED",
        "CANCELLED",
        "REFUNDED",
      ],
      membership_type: ["COUNT_BASED", "TIME_BASED", "AMOUNT_BASED", "BUNDLE"],
      notification_channel: ["LINE", "EMAIL", "SMS", "PUSH", "IN_APP"],
      notification_status: ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"],
      notification_type: [
        "BOOKING_REQUEST",
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "BOOKING_REMINDER",
        "BOOKING_COMPLETED",
        "BOOKING_NO_SHOW",
        "BOOKING_MODIFIED",
        "REVIEW_RECEIVED",
        "GENERAL",
      ],
      payment_method: [
        "CASH",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "BANK_TRANSFER",
        "PROMPTPAY",
        "LINE_PAY",
        "TRUE_MONEY",
        "RABBIT_LINE_PAY",
        "SHOPEE_PAY",
        "OTHER",
      ],
      payment_status: ["PENDING", "PAID", "REFUNDED", "FAILED"],
      payment_transaction_status: [
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ],
      payment_type: [
        "DEPOSIT",
        "FULL_PAYMENT",
        "PARTIAL_PAYMENT",
        "REFUND",
        "ADDITIONAL",
      ],
      recipient_type: ["CUSTOMER", "ADMIN", "ARTIST", "STAFF"],
      report_status: ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"],
      user_role: [
        "SUPER_ADMIN",
        "ADMIN",
        "MANAGER",
        "ARTIST",
        "STAFF",
        "CUSTOMER",
      ],
      user_type: ["SALON", "CUSTOMER"],
    },
  },
} as const

// Export helper types for easier imports
export type Salon = Tables<"salons">
export type User = Tables<"users">
export type Customer = Tables<"customers">
export type Booking = Tables<"bookings">
export type Service = Tables<"services">
export type ServiceCategory = Tables<"service_categories">
export type StaffProfile = Tables<"staff_profiles">
export type Notification = Tables<"notifications">

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  TablesInsert<T>
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  TablesUpdate<T>

// Work schedule type
export type WorkSchedule = {
  [key: string]: {
    enabled: boolean
    start: string | null
    end: string | null
  }
}

// Holiday entry type
export type HolidayEntry =
  | string
  | { date: string; reason?: string }
  | { id: string; startDate: string; endDate: string; reason?: string }

// Staff with profile (joined type)
export type StaffWithProfile = {
  id: string
  name: string
  email: string
  phone: string | null
  profile_image: string | null
  role: Database["public"]["Enums"]["user_role"]
  is_active: boolean
  staff_profiles: {
    salon_id: string
    is_owner: boolean
    is_booking_enabled: boolean
    bio: string | null
    specialties: string[] | null
    years_of_experience: number | null
    work_schedule: WorkSchedule | null
    holidays: HolidayEntry[] | null
    social_links: {
      instagram?: string | null
      youtube?: string | null
      tiktok?: string | null
      facebook?: string | null
    } | null
  } | null
}
