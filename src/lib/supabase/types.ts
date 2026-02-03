// Auth Provider Enum
export type AuthProvider = "EMAIL" | "LINE" | "GOOGLE" | "KAKAO";

// User Type Enum
export type UserType = "ADMIN_USER" | "CUSTOMER";

// User Role Enum
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";

// Approval Status Enum
export type ApprovalStatus = "pending" | "approved" | "rejected";

// Booking Status Enum
export type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

// Payment Status Enum
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

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
          holidays: unknown[] | null;
          logo_url: string | null;
          cover_image_url: string | null;
          settings: {
            currency: string;
            timezone: string;
            booking_advance_days: number;
            slot_duration_minutes: number;
            booking_cancellation_hours: number;
            interpreter_enabled?: boolean;
            supported_languages?: string[];
          } | null;
          plan_type: string;
          approval_status: ApprovalStatus;
          rejected_reason: string | null;
          approved_at: string | null;
          trial_ends_at: string | null;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
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
          holidays?: unknown[] | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          settings?: {
            currency: string;
            timezone: string;
            booking_advance_days: number;
            slot_duration_minutes: number;
            booking_cancellation_hours: number;
            interpreter_enabled?: boolean;
            supported_languages?: string[];
          } | null;
          plan_type?: string;
          approval_status?: ApprovalStatus;
          rejected_reason?: string | null;
          approved_at?: string | null;
          trial_ends_at?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          holidays?: unknown[] | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          settings?: {
            currency: string;
            timezone: string;
            booking_advance_days: number;
            slot_duration_minutes: number;
            booking_cancellation_hours: number;
            interpreter_enabled?: boolean;
            supported_languages?: string[];
          } | null;
          plan_type?: string;
          approval_status?: ApprovalStatus;
          rejected_reason?: string | null;
          approved_at?: string | null;
          trial_ends_at?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          user_type: UserType;
          role: UserRole;
          email: string;
          name: string;
          phone: string | null;
          profile_image: string | null;
          auth_provider: AuthProvider;
          provider_user_id: string | null;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_type: UserType;
          role?: UserRole;
          email: string;
          name: string;
          phone?: string | null;
          profile_image?: string | null;
          auth_provider?: AuthProvider;
          provider_user_id?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_type?: UserType;
          role?: UserRole;
          email?: string;
          name?: string;
          phone?: string | null;
          profile_image?: string | null;
          auth_provider?: AuthProvider;
          provider_user_id?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_profiles: {
        Row: {
          user_id: string;
          line_user_id: string | null;
          line_display_name: string | null;
          line_picture_url: string | null;
          line_status_message: string | null;
          preferred_salon_id: string | null;
          preferred_designer_id: string | null;
          preferences: Record<string, unknown> | null;
          total_bookings: number;
          total_spent: number;
          last_visit_at: string | null;
          marketing_consent: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          line_user_id?: string | null;
          line_display_name?: string | null;
          line_picture_url?: string | null;
          line_status_message?: string | null;
          preferred_salon_id?: string | null;
          preferred_designer_id?: string | null;
          preferences?: Record<string, unknown> | null;
          total_bookings?: number;
          total_spent?: number;
          last_visit_at?: string | null;
          marketing_consent?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          line_user_id?: string | null;
          line_display_name?: string | null;
          line_picture_url?: string | null;
          line_status_message?: string | null;
          preferred_salon_id?: string | null;
          preferred_designer_id?: string | null;
          preferences?: Record<string, unknown> | null;
          total_bookings?: number;
          total_spent?: number;
          last_visit_at?: string | null;
          marketing_consent?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_profiles: {
        Row: {
          user_id: string;
          salon_id: string;
          is_owner: boolean;
          is_approved: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string | null;
          position_id: string | null;
          is_booking_enabled: boolean;
          permissions: Record<string, unknown>;
          work_schedule: Record<string, unknown> | null;
          holidays: unknown[] | null;
          bio: string | null;
          specialties: string[] | null;
          years_of_experience: number | null;
          social_links: {
            instagram?: string | null;
            youtube?: string | null;
            tiktok?: string | null;
            facebook?: string | null;
            twitter?: string | null;
            website?: string | null;
          } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          salon_id: string;
          is_owner?: boolean;
          is_approved?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by?: string | null;
          position_id?: string | null;
          is_booking_enabled?: boolean;
          permissions?: Record<string, unknown>;
          work_schedule?: Record<string, unknown> | null;
          holidays?: unknown[] | null;
          bio?: string | null;
          specialties?: string[] | null;
          years_of_experience?: number | null;
          social_links?: {
            instagram?: string | null;
            youtube?: string | null;
            tiktok?: string | null;
            facebook?: string | null;
            twitter?: string | null;
            website?: string | null;
          } | null;
        };
        Update: {
          salon_id?: string;
          is_owner?: boolean;
          is_approved?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by?: string | null;
          position_id?: string | null;
          is_booking_enabled?: boolean;
          permissions?: Record<string, unknown>;
          work_schedule?: Record<string, unknown> | null;
          holidays?: unknown[] | null;
          bio?: string | null;
          specialties?: string[] | null;
          years_of_experience?: number | null;
          social_links?: {
            instagram?: string | null;
            youtube?: string | null;
            tiktok?: string | null;
            facebook?: string | null;
            twitter?: string | null;
            website?: string | null;
          } | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          salon_id: string;
          category_id: string | null;
          name: string;
          name_en: string | null;
          name_th: string | null;
          description: string | null;
          pricing_type: "FIXED" | "POSITION_BASED";
          base_price: number | null;
          duration_minutes: number;
          image_url: string | null;
          is_active: boolean;
          deleted_at: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          category_id?: string | null;
          name: string;
          name_en?: string | null;
          name_th?: string | null;
          description?: string | null;
          pricing_type?: "FIXED" | "POSITION_BASED";
          base_price?: number | null;
          duration_minutes: number;
          image_url?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          salon_id?: string;
          category_id?: string | null;
          name?: string;
          name_en?: string | null;
          name_th?: string | null;
          description?: string | null;
          pricing_type?: "FIXED" | "POSITION_BASED";
          base_price?: number | null;
          duration_minutes?: number;
          image_url?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          display_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: string;
          salon_id: string;
          industry_id: string | null;
          name: string;
          name_en: string | null;
          name_th: string | null;
          description: string | null;
          display_order: number;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          industry_id?: string | null;
          name: string;
          name_en?: string | null;
          name_th?: string | null;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          salon_id?: string;
          industry_id?: string | null;
          name?: string;
          name_en?: string | null;
          name_th?: string | null;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string;
          designer_id: string;
          service_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          status: BookingStatus;
          service_price: number;
          additional_charges: number;
          discount: number;
          total_price: number;
          payment_status: PaymentStatus;
          payment_method: string | null;
          paid_at: string | null;
          customer_notes: string | null;
          staff_notes: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          cancelled_by: string | null;
          line_notification_sent: boolean;
          line_notification_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id: string;
          designer_id: string;
          service_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          status?: BookingStatus;
          service_price: number;
          additional_charges?: number;
          discount?: number;
          total_price: number;
          payment_status?: PaymentStatus;
          payment_method?: string | null;
          paid_at?: string | null;
          customer_notes?: string | null;
          staff_notes?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          line_notification_sent?: boolean;
          line_notification_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          salon_id?: string;
          customer_id?: string;
          designer_id?: string;
          service_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          duration_minutes?: number;
          status?: BookingStatus;
          service_price?: number;
          additional_charges?: number;
          discount?: number;
          total_price?: number;
          payment_status?: PaymentStatus;
          payment_method?: string | null;
          paid_at?: string | null;
          customer_notes?: string | null;
          staff_notes?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          line_notification_sent?: boolean;
          line_notification_sent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_type: UserType;
      user_role: UserRole;
      auth_provider: AuthProvider;
      approval_status_type: ApprovalStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
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
export type CustomerProfile = Tables<"customer_profiles">;
export type StaffProfile = Tables<"staff_profiles">;
export type Service = Tables<"services">;
export type ServiceCategory = Tables<"service_categories">;
export type Booking = Tables<"bookings">;

// 디자이너 근무 스케줄 타입
export type WorkSchedule = {
  [key: string]: {
    enabled: boolean;
    start: string | null;
    end: string | null;
  };
};

// 휴무일 타입 (날짜 문자열 배열 또는 휴무일 객체 배열)
export type HolidayEntry =
  | string
  | { date: string; reason?: string }
  | { id: string; startDate: string; endDate: string; reason?: string };

// 조인된 직원 정보 타입 (users + staff_profiles)
export type StaffWithProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  role: UserRole;
  is_active: boolean;
  staff_profiles: {
    salon_id: string;
    is_owner: boolean;
    is_booking_enabled: boolean;
    bio: string | null;
    specialties: string[] | null;
    years_of_experience: number | null;
    work_schedule: WorkSchedule | null;
    holidays: HolidayEntry[] | null;
    social_links: {
      instagram?: string | null;
      youtube?: string | null;
      tiktok?: string | null;
      facebook?: string | null;
    } | null;
  } | null;
};

// 조인된 고객 정보 타입 (users + customer_profiles)
export type CustomerWithProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  is_active: boolean;
  customer_profiles: {
    line_user_id: string | null;
    line_display_name: string | null;
    line_picture_url: string | null;
    preferred_salon_id: string | null;
    total_bookings: number;
    total_spent: number;
    last_visit_at: string | null;
  } | null;
};
