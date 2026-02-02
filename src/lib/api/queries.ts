/**
 * API Queries
 * GET 요청을 담당하는 모듈
 */

import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Booking, Salon, Service, ServiceCategory, StaffWithProfile } from "@/lib/supabase/types";

/**
 * Booking Queries
 */
export const bookingQueries = {
  /**
   * 디자이너별 예약 조회
   */
  getByDesigner: async (designerId: string, date: string): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>(
      endpoints.bookings.byDesigner.path(designerId),
      { date }
    );
    return response.data ?? [];
  },

  /**
   * 살롱별 예약 조회
   */
  getBySalon: async (salonId: string, date: string): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>(
      endpoints.bookings.bySalon.path(salonId),
      { date }
    );
    return response.data ?? [];
  },

  /**
   * 예약 상세 조회
   */
  getById: async (bookingId: string) => {
    const response = await apiClient.get(
      endpoints.bookings.detail.path(bookingId)
    );
    return response.data;
  },
};

/**
 * Salon Queries
 */
export const salonQueries = {
  /**
   * 모든 살롱 조회
   */
  getAll: async (): Promise<Salon[]> => {
    const response = await apiClient.get<Salon[]>(endpoints.salons.all.path());
    return response.data ?? [];
  },

  /**
   * 살롱 상세 조회
   */
  getById: async (salonId: string): Promise<Salon | null> => {
    const response = await apiClient.get<Salon>(
      endpoints.salons.detail.path(salonId)
    );
    return response.data ?? null;
  },

  /**
   * 살롱 서비스 목록 조회
   */
  getServices: async (salonId: string): Promise<Service[]> => {
    const response = await apiClient.get<Service[]>(
      endpoints.salons.services.path(salonId)
    );
    return response.data ?? [];
  },

  /**
   * 살롱 서비스 카테고리 조회
   */
  getCategories: async (salonId: string): Promise<ServiceCategory[]> => {
    const response = await apiClient.get<ServiceCategory[]>(
      endpoints.salons.categories.path(salonId)
    );
    return response.data ?? [];
  },

  /**
   * 살롱 예약 가능 직원 조회
   */
  getStaff: async (salonId: string): Promise<StaffWithProfile[]> => {
    const response = await apiClient.get<StaffWithProfile[]>(
      endpoints.salons.staff.path(salonId)
    );
    return response.data ?? [];
  },
};
