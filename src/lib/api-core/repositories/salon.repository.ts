/**
 * Salon Repository
 * 살롱 데이터 액세스 레이어 - 순수 Supabase 쿼리만 담당
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Salon, Service, ServiceCategory, StaffWithProfile } from "@/lib/supabase/types";
import { BaseRepository } from "./base.repository";

export class SalonRepository extends BaseRepository<"salons"> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "salons");
  }

  /**
   * 모든 활성 살롱 조회
   */
  async findAllActive(): Promise<Salon[]> {
    const { data, error } = await this.supabase
      .from("salons")
      .select("*")
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * ID로 살롱 조회 (없으면 null 반환)
   */
  async findByIdOrNull(id: string): Promise<Salon | null> {
    const { data, error } = await this.supabase
      .from("salons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * 살롱의 서비스 목록 조회
   */
  async findServices(salonId: string): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from("services")
      .select("*")
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * 살롱의 서비스 카테고리 조회
   */
  async findServiceCategories(salonId: string): Promise<ServiceCategory[]> {
    const { data, error } = await this.supabase
      .from("service_categories")
      .select("*")
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * 살롱의 예약 가능한 직원 조회
   */
  async findBookableStaff(salonId: string): Promise<StaffWithProfile[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        phone,
        profile_image,
        salon_id,
        role,
        is_active,
        staff_profiles!inner (
          is_booking_enabled,
          bio,
          specialties,
          years_of_experience,
          work_schedule,
          holidays,
          social_links
        )
      `)
      .eq("salon_id", salonId)
      .eq("user_type", "ADMIN_USER")
      .eq("is_active", true)
      .eq("staff_profiles.is_booking_enabled", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Normalize staff_profiles from array to single object
    const normalized = (data ?? []).map((user: Record<string, unknown>) => {
      const profiles = user.staff_profiles;
      return {
        ...user,
        staff_profiles: Array.isArray(profiles) ? profiles[0] ?? null : profiles,
      };
    });

    return normalized as StaffWithProfile[];
  }
}

/**
 * Repository 인스턴스 생성 헬퍼
 */
export const createSalonRepository = (supabase: SupabaseClient<Database>) => {
  return new SalonRepository(supabase);
};
