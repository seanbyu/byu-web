import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Salon, StaffWithProfile, Service, ServiceCategory } from "@/lib/supabase/types";

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
        work_schedule,
        holidays,
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

  // Supabase !inner join returns staff_profiles as an array — normalize to single object
  const normalized = (data ?? []).map((user: Record<string, unknown>) => {
    const profiles = user.staff_profiles;
    return {
      ...user,
      staff_profiles: Array.isArray(profiles) ? profiles[0] ?? null : profiles,
    };
  });

  return normalized as StaffWithProfile[];
});

// 살롱 상세 + 예약 가능 직원 함께 조회
export const getSalonWithStaff = cache(async (id: string) => {
  const [salon, staff] = await Promise.all([
    getSalonById(id),
    getBookableStaff(id),
  ]);

  return { salon, staff };
});

// 서비스 카테고리 조회
export const getServiceCategories = cache(async (salonId: string): Promise<ServiceCategory[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching service categories:", error);
    return [];
  }

  return data ?? [];
});

// 살롱의 서비스 목록 조회
export const getServices = cache(async (salonId: string): Promise<Service[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return data ?? [];
});

// 살롱 상세 + 직원 + 서비스 함께 조회 (예약 페이지용)
export const getSalonBookingData = cache(async (id: string) => {
  const [salon, staff, services, categories] = await Promise.all([
    getSalonById(id),
    getBookableStaff(id),
    getServices(id),
    getServiceCategories(id),
  ]);

  return { salon, staff, services, categories };
});
