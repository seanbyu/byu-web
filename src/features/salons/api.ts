/**
 * Salons API
 *
 * 데이터 흐름: View → Hooks → API → API Routes → Service → Repository → Supabase
 */

import { salonQueries } from "@/lib/api";
import type { Salon, Service, ServiceCategory, StaffWithProfile } from "@/lib/supabase/types";

export const salonsApi = {
  /**
   * 모든 살롱 조회
   */
  getAll: (): Promise<Salon[]> => {
    return salonQueries.getAll();
  },

  /**
   * 살롱 상세 조회
   */
  getById: (salonId: string): Promise<Salon | null> => {
    return salonQueries.getById(salonId);
  },

  /**
   * 살롱 서비스 목록 조회
   */
  getServices: (salonId: string): Promise<Service[]> => {
    return salonQueries.getServices(salonId);
  },

  /**
   * 살롱 서비스 카테고리 조회
   */
  getServiceCategories: (salonId: string): Promise<ServiceCategory[]> => {
    return salonQueries.getCategories(salonId);
  },

  /**
   * 살롱 예약 가능 직원 조회
   */
  getBookableStaff: (salonId: string): Promise<StaffWithProfile[]> => {
    return salonQueries.getStaff(salonId);
  },
};

/**
 * @deprecated createSalonsApi 대신 salonsApi를 직접 사용하세요
 * 기존 코드 호환성을 위해 유지
 */
export const createSalonsApi = () => salonsApi;
