export type Database = {
  public: {
    Tables: {
      salons: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          phone: string;
          email: string | null;
          address: string;
          city: string;
          state: string | null;
          postal_code: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          business_hours: {
            [key: string]: {
              open: string | null;
              close: string | null;
              enabled: boolean;
            };
          } | null;
          logo_url: string | null;
          cover_image_url: string | null;
          settings: {
            currency: string;
            timezone: string;
            booking_advance_days: number;
            slot_duration_minutes: number;
            booking_cancellation_hours: number;
          } | null;
          approval_status: "pending" | "approved" | "rejected";
          approved_at: string | null;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          plan_type: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          phone: string;
          email?: string | null;
          address?: string;
          city?: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          business_hours?: {
            [key: string]: {
              open: string | null;
              close: string | null;
              enabled: boolean;
            };
          } | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          settings?: {
            currency: string;
            timezone: string;
            booking_advance_days: number;
            slot_duration_minutes: number;
            booking_cancellation_hours: number;
          } | null;
          approval_status?: "pending" | "approved" | "rejected";
          approved_at?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          plan_type?: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
        };
        Update: {
          name?: string;
          description?: string | null;
          phone?: string;
          email?: string | null;
          address?: string;
          city?: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          business_hours?: {
            [key: string]: {
              open: string | null;
              close: string | null;
              enabled: boolean;
            };
          } | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          settings?: {
            currency: string;
            timezone: string;
            booking_advance_days: number;
            slot_duration_minutes: number;
            booking_cancellation_hours: number;
          } | null;
          approval_status?: "pending" | "approved" | "rejected";
          approved_at?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
          plan_type?: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
        };
      };
      users: {
        Row: {
          id: string;
          user_type: "ADMIN_USER" | "CUSTOMER";
          role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";
          email: string;
          name: string;
          phone: string | null;
          profile_image: string | null;
          salon_id: string | null;
          is_active: boolean;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_type: "ADMIN_USER" | "CUSTOMER";
          role?: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";
          email: string;
          name: string;
          phone?: string | null;
          profile_image?: string | null;
          salon_id?: string | null;
          is_active?: boolean;
          is_approved?: boolean;
        };
        Update: {
          name?: string;
          phone?: string | null;
          profile_image?: string | null;
          is_active?: boolean;
          is_approved?: boolean;
        };
      };
      staff_profiles: {
        Row: {
          user_id: string;
          user_type: "ADMIN_USER";
          position_id: string | null;
          permissions: Record<string, unknown>;
          work_schedule: Record<string, unknown> | null;
          bio: string | null;
          specialties: string[] | null;
          years_of_experience: number | null;
          social_links: {
            instagram?: string | null;
            youtube?: string | null;
            tiktok?: string | null;
            facebook?: string | null;
          } | null;
          is_booking_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          user_type?: "ADMIN_USER";
          position_id?: string | null;
          permissions?: Record<string, unknown>;
          work_schedule?: Record<string, unknown> | null;
          bio?: string | null;
          specialties?: string[] | null;
          years_of_experience?: number | null;
          social_links?: {
            instagram?: string | null;
            youtube?: string | null;
            tiktok?: string | null;
            facebook?: string | null;
          } | null;
          is_booking_enabled?: boolean;
        };
        Update: {
          position_id?: string | null;
          permissions?: Record<string, unknown>;
          work_schedule?: Record<string, unknown> | null;
          bio?: string | null;
          specialties?: string[] | null;
          years_of_experience?: number | null;
          social_links?: {
            instagram?: string | null;
            youtube?: string | null;
            tiktok?: string | null;
            facebook?: string | null;
          } | null;
          is_booking_enabled?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Salon = Tables<"salons">;
export type User = Tables<"users">;
export type StaffProfileRow = Tables<"staff_profiles">;

// 조인된 직원 정보 타입 (users + staff_profiles)
export type StaffWithProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  salon_id: string | null;
  role: string;
  is_active: boolean;
  staff_profiles: {
    is_booking_enabled: boolean;
    bio: string | null;
    specialties: string[] | null;
    years_of_experience: number | null;
    social_links: {
      instagram?: string | null;
      youtube?: string | null;
      tiktok?: string | null;
      facebook?: string | null;
    } | null;
  } | null;
};
