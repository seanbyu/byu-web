/**
 * Salon Service
 * 살롱 비즈니스 로직 레이어
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Salon, Service, ServiceCategory, StaffWithProfile } from "@/lib/supabase/types";
import { SalonRepository } from "../repositories/salon.repository";

export interface SalonWithStaff {
  salon: Salon | null;
  staff: StaffWithProfile[];
}

export interface SalonBookingData {
  salon: Salon | null;
  staff: StaffWithProfile[];
  services: Service[];
  categories: ServiceCategory[];
}

export class SalonService {
  private repository: SalonRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new SalonRepository(supabase);
  }

  /**
   * 모든 활성 살롱 조회
   */
  async getAllSalons(): Promise<Salon[]> {
    return this.repository.findAllActive();
  }

  /**
   * ID로 살롱 조회
   */
  async getSalonById(salonId: string): Promise<Salon | null> {
    return this.repository.findByIdOrNull(salonId);
  }

  /**
   * 살롱의 서비스 목록 조회
   */
  async getServices(salonId: string): Promise<Service[]> {
    return this.repository.findServices(salonId);
  }

  /**
   * 살롱의 서비스 카테고리 조회
   */
  async getServiceCategories(salonId: string): Promise<ServiceCategory[]> {
    return this.repository.findServiceCategories(salonId);
  }

  /**
   * 살롱의 예약 가능한 직원 조회
   */
  async getBookableStaff(salonId: string): Promise<StaffWithProfile[]> {
    return this.repository.findBookableStaff(salonId);
  }

  /**
   * 살롱 상세 + 직원 정보 조회
   */
  async getSalonWithStaff(salonId: string): Promise<SalonWithStaff> {
    const [salon, staff] = await Promise.all([
      this.repository.findByIdOrNull(salonId),
      this.repository.findBookableStaff(salonId),
    ]);

    return { salon, staff };
  }

  /**
   * 예약 페이지용 전체 데이터 조회
   */
  async getSalonBookingData(salonId: string): Promise<SalonBookingData> {
    const [salon, staff, services, categories] = await Promise.all([
      this.repository.findByIdOrNull(salonId),
      this.repository.findBookableStaff(salonId),
      this.repository.findServices(salonId),
      this.repository.findServiceCategories(salonId),
    ]);

    return { salon, staff, services, categories };
  }

  /**
   * 홈페이지용 데이터 조회
   */
  async getHomePageData() {
    const salons = await this.repository.findAllActive();
    return { salons };
  }
}

/**
 * Service 인스턴스 생성 헬퍼
 */
export const createSalonService = (supabase: SupabaseClient<Database>) => {
  return new SalonService(supabase);
};
