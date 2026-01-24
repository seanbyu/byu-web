import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Salon, StaffWithProfile } from "@/lib/supabase/types";

// React.cache() for per-request deduplication (server-cache-react)
export const getSalons = cache(async (): Promise<Salon[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching salons:", error);
    return [];
  }

  return data ?? [];
});

export const getSalonById = cache(async (id: string): Promise<Salon | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching salon:", error);
    return null;
  }

  return data;
});

// For home page - fetch all data needed
export const getHomePageData = cache(async () => {
  const salons = await getSalons();
  return { salons };
});

// 예약 가능한 직원만 조회 (users + staff_profiles 조인, is_booking_enabled = true)
export const getBookableStaff = cache(async (salonId: string): Promise<StaffWithProfile[]> => {
  const supabase = await createClient();

  // users 테이블과 staff_profiles 테이블을 조인하여 조회
  const { data, error } = await supabase
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
        social_links
      )
    `)
    .eq("salon_id", salonId)
    .eq("user_type", "ADMIN_USER")   // 직원 타입
    .eq("is_active", true)           // 활성 상태인 직원
    .eq("staff_profiles.is_booking_enabled", true)  // 예약 허용된 직원만!
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching bookable staff:", error);
    return [];
  }

  return (data as StaffWithProfile[]) ?? [];
});

// 살롱 상세 + 예약 가능 직원 함께 조회
export const getSalonWithStaff = cache(async (id: string) => {
  const [salon, staff] = await Promise.all([
    getSalonById(id),
    getBookableStaff(id),
  ]);

  return { salon, staff };
});
