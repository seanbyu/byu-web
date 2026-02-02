/**
 * API Mutations
 * POST/PUT/DELETE 요청을 담당하는 모듈
 */

import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Booking } from "@/lib/supabase/types";

/**
 * Booking 생성 파라미터
 */
export interface CreateBookingParams {
  salon_id: string;
  customer_id: string;
  customer_user_type: "CUSTOMER";
  designer_id: string;
  designer_user_type: "ADMIN_USER";
  service_id: string;
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
