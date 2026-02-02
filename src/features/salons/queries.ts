/**
 * Salon Server Queries
 * SSR용 데이터 조회 함수 (React.cache 사용)
 *
 * 데이터 흐름: Page (SSR) → queries.ts → Service → Repository → Supabase
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createSalonService } from "@/lib/api-core";
import type { Salon, StaffWithProfile, Service, ServiceCategory } from "@/lib/supabase/types";

/**
 * Service 인스턴스 생성 헬퍼 (캐싱)
 */
const getService = cache(async () => {
  const supabase = await createClient();
  return createSalonService(supabase);
});

/**
 * 모든 활성 살롱 조회
 */
export const getSalons = cache(async (): Promise<Salon[]> => {
  try {
    const service = await getService();
    return service.getAllSalons();
  } catch (error) {
    console.error("Error fetching salons:", error);
    return [];
  }
});

/**
 * ID로 살롱 조회
 */
export const getSalonById = cache(async (id: string): Promise<Salon | null> => {
  try {
    const service = await getService();
    return service.getSalonById(id);
  } catch (error) {
    console.error("Error fetching salon:", error);
    return null;
  }
});

/**
 * 홈페이지용 데이터 조회
 */
export const getHomePageData = cache(async () => {
  try {
    const service = await getService();
    return service.getHomePageData();
  } catch (error) {
    console.error("Error fetching home page data:", error);
    return { salons: [] };
  }
});

/**
 * 예약 가능한 직원 조회
 */
export const getBookableStaff = cache(async (salonId: string): Promise<StaffWithProfile[]> => {
  try {
    const service = await getService();
    return service.getBookableStaff(salonId);
  } catch (error) {
    console.error("Error fetching bookable staff:", error);
    return [];
  }
});

/**
 * 살롱 상세 + 직원 정보 조회
 */
export const getSalonWithStaff = cache(async (id: string) => {
  try {
    const service = await getService();
    return service.getSalonWithStaff(id);
  } catch (error) {
    console.error("Error fetching salon with staff:", error);
    return { salon: null, staff: [] };
  }
});

/**
 * 서비스 카테고리 조회
 */
export const getServiceCategories = cache(async (salonId: string): Promise<ServiceCategory[]> => {
  try {
    const service = await getService();
    return service.getServiceCategories(salonId);
  } catch (error) {
    console.error("Error fetching service categories:", error);
    return [];
  }
});

/**
 * 살롱 서비스 목록 조회
 */
export const getServices = cache(async (salonId: string): Promise<Service[]> => {
  try {
    const service = await getService();
    return service.getServices(salonId);
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
});

/**
 * 예약 페이지용 전체 데이터 조회
 */
export const getSalonBookingData = cache(async (id: string) => {
  try {
    const service = await getService();
    return service.getSalonBookingData(id);
  } catch (error) {
    console.error("Error fetching salon booking data:", error);
    return { salon: null, staff: [], services: [], categories: [] };
  }
});
