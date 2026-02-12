/**
 * API Mutations
 * POST/PUT/DELETE 요청을 담당하는 모듈
 */

import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Booking } from "@/lib/supabase/types";

/**
 * Customer 응답 타입
 */
export interface Customer {
  id: string;
  salon_id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  line_user_id: string | null;
  line_display_name: string | null;
  line_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Customer 찾기/생성 파라미터
 */
export interface FindOrCreateCustomerParams {
  salon_id: string;
  name: string;
  phone?: string;
}

/**
 * Booking 생성 파라미터
 */
export interface CreateBookingParams {
  salon_id: string;
  customer_id: string;
  artist_id: string;
  service_id?: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: "PENDING";
  service_price: number;
  total_price: number;
  customer_notes?: string | null;
}

/**
 * Booking 취소 파라미터
 */
export interface CancelBookingParams {
  cancelled_by: string;
  cancellation_reason?: string;
}

/**
 * Booking Mutations
 */
export const bookingMutations = {
  /**
   * 예약 생성
   */
  create: async (params: CreateBookingParams): Promise<Booking> => {
    const response = await apiClient.post<Booking>(
      endpoints.bookings.create.path(),
      params
    );
    if (!response.data) {
      throw new Error(response.message || "예약 생성에 실패했습니다");
    }
    return response.data;
  },

  /**
   * 예약 취소
   */
  cancel: async (bookingId: string, params: CancelBookingParams): Promise<Booking> => {
    const response = await apiClient.post<Booking>(
      endpoints.bookings.cancel.path(bookingId),
      params
    );
    if (!response.data) {
      throw new Error(response.message || "예약 취소에 실패했습니다");
    }
    return response.data;
  },
};

/**
 * Customer Mutations
 */
export const customerMutations = {
  /**
   * 고객 찾기 또는 생성
   */
  findOrCreate: async (params: FindOrCreateCustomerParams): Promise<Customer> => {
    const response = await apiClient.post<Customer>(
      endpoints.customers.findOrCreate.path(),
      params
    );
    if (!response.data) {
      throw new Error(response.message || "고객 정보 처리에 실패했습니다");
    }
    return response.data;
  },
};
