/**
 * Bookings API
 *
 * 데이터 흐름: View → Hooks → API → API Routes → Service → Repository → Supabase
 */

import { bookingQueries, bookingMutations } from "@/lib/api";
import type { Booking, InsertTables } from "@/lib/supabase/types";

export const bookingsApi = {
  /**
   * 특정 디자이너의 특정 날짜 예약 조회
   */
  getExistingBookings: (designerId: string, bookingDate: string): Promise<Booking[]> => {
    return bookingQueries.getByDesigner(designerId, bookingDate);
  },

  /**
   * 특정 살롱의 특정 날짜 예약 조회
   */
  getBookingsBySalon: (salonId: string, bookingDate: string): Promise<Booking[]> => {
    return bookingQueries.getBySalon(salonId, bookingDate);
  },

  /**
   * 예약 생성
   */
  createBooking: (bookingData: InsertTables<"bookings">): Promise<Booking> => {
    return bookingMutations.create({
      salon_id: bookingData.salon_id,
      customer_id: bookingData.customer_id,
      customer_user_type: "CUSTOMER",
      designer_id: bookingData.designer_id,
      designer_user_type: "SALON",
      service_id: bookingData.service_id,
      booking_date: bookingData.booking_date,
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
      duration_minutes: bookingData.duration_minutes,
      status: "PENDING",
      service_price: bookingData.service_price || 0,
      total_price: bookingData.total_price || bookingData.service_price || 0,
      customer_notes: bookingData.customer_notes,
    });
  },
};

/**
 * @deprecated createBookingsApi 대신 bookingsApi를 직접 사용하세요
 * 기존 코드 호환성을 위해 유지
 */
export const createBookingsApi = () => bookingsApi;
