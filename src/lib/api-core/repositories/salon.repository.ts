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
   * staff_profiles 테이블에서 시작하여 users와 조인 (user_id FK 사용)
   */
  async findBookableStaff(salonId: string): Promise<StaffWithProfile[]> {
    const { data, error } = await this.supabase
      .from("staff_profiles")
      .select(`
        salon_id,
        is_owner,
        is_booking_enabled,
        staff_positions:staff_positions!staff_profiles_position_id_fkey (
          name,
          name_en,
          name_th
        ),
        bio,
        specialties,
        years_of_experience,
        work_schedule,
        holidays,
        social_links,
        users!staff_profiles_user_id_fkey (
          id,
          name,
          email,
          phone,
          profile_image,
          role,
          is_active,
          user_type
        )
      `)
      .eq("salon_id", salonId)
      .eq("is_booking_enabled", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    // Transform and filter data to StaffWithProfile format
    const transformed = (data ?? [])
      .filter((profile: Record<string, unknown>) => {
        const user = profile.users as Record<string, unknown>;
        return user && user.user_type === "SALON" && user.is_active === true;
      })
      .map((profile: Record<string, unknown>) => {
        const user = profile.users as Record<string, unknown>;
        const position = profile.staff_positions as Record<string, unknown> | null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profile_image: user.profile_image,
          role: user.role,
          is_active: user.is_active,
          staff_profiles: {
            salon_id: profile.salon_id,
            is_owner: profile.is_owner,
            is_booking_enabled: profile.is_booking_enabled,
            position_name: position?.name as string | null,
            position_name_en: position?.name_en as string | null,
            position_name_th: position?.name_th as string | null,
            bio: profile.bio,
            specialties: profile.specialties,
            years_of_experience: profile.years_of_experience,
            work_schedule: profile.work_schedule,
            holidays: profile.holidays,
            social_links: profile.social_links,
          },
        };
      });

    return transformed as StaffWithProfile[];
  }
}

/**
 * Repository 인스턴스 생성 헬퍼
 */
export const createSalonRepository = (supabase: SupabaseClient<Database>) => {
  return new SalonRepository(supabase);
};
