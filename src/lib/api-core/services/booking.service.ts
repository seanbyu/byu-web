/**
 * Booking Service
 * 예약 비즈니스 로직 레이어
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Booking, InsertTables } from "@/lib/supabase/types";
import { BookingRepository } from "../repositories/booking.repository";

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface BookingConflictResult {
  hasConflict: boolean;
  conflictingBooking?: Booking;
}

export interface CreateBookingParams {
  salonId: string;
  customerId: string;
  designerId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  servicePrice: number;
  customerNotes?: string;
}

export class BookingService {
  private repository: BookingRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new BookingRepository(supabase);
  }

  /**
   * 디자이너의 특정 날짜 예약 조회
   */
  async getDesignerBookings(
    designerId: string,
    bookingDate: string
  ): Promise<Booking[]> {
    return this.repository.findByDesignerAndDate(designerId, bookingDate);
  }

  /**
   * 살롱의 특정 날짜 예약 조회
   */
  async getSalonBookings(
    salonId: string,
    bookingDate: string
  ): Promise<Booking[]> {
    return this.repository.findBySalonAndDate(salonId, bookingDate);
  }

  /**
   * 예약 상세 조회
   */
  async getBookingDetails(bookingId: string) {
    return this.repository.findByIdWithDetails(bookingId);
  }

  /**
   * 고객의 예약 목록 조회
   */
  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    return this.repository.findByCustomer(customerId);
  }

  /**
   * 시간 충돌 확인
   * 새 예약 시간이 기존 예약과 겹치는지 확인
   */
  async checkTimeConflict(
    designerId: string,
    bookingDate: string,
    newSlot: TimeSlot
  ): Promise<BookingConflictResult> {
    const existingBookings = await this.repository.findByDesignerAndDate(
      designerId,
      bookingDate
    );

    const newStart = this.timeToMinutes(newSlot.startTime);
    const newEnd = this.timeToMinutes(newSlot.endTime);

    for (const booking of existingBookings) {
      const existingStart = this.timeToMinutes(booking.start_time);
      const existingEnd = this.timeToMinutes(booking.end_time);

      // 시간 겹침 확인
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * 예약 생성
   * 비즈니스 규칙 검증 후 생성
   */
  async createBooking(params: CreateBookingParams): Promise<Booking> {
    // 1. 필수 값 검증
    this.validateBookingParams(params);

    // 2. 시간 충돌 확인
    const conflictResult = await this.checkTimeConflict(
      params.designerId,
      params.bookingDate,
      { startTime: params.startTime, endTime: params.endTime }
    );

    if (conflictResult.hasConflict) {
      throw new Error("선택한 시간에 이미 예약이 있습니다");
    }

    // 3. 예약 데이터 구성
    const bookingData: InsertTables<"bookings"> = {
      salon_id: params.salonId,
      customer_id: params.customerId,
      customer_user_type: "CUSTOMER",
      designer_id: params.designerId,
      designer_user_type: "ADMIN_USER",
      service_id: params.serviceId,
      booking_date: params.bookingDate,
      start_time: params.startTime,
      end_time: params.endTime,
      duration_minutes: params.durationMinutes,
      status: "PENDING",
      service_price: params.servicePrice,
      total_price: params.servicePrice,
      customer_notes: params.customerNotes || null,
    };

    // 4. 예약 생성
    return this.repository.createBooking(bookingData);
  }

  /**
   * 예약 취소
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<Booking> {
    // 예약 존재 확인
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new Error("예약을 찾을 수 없습니다");
    }

    // 이미 취소된 예약인지 확인
    if (booking.status === "CANCELLED") {
      throw new Error("이미 취소된 예약입니다");
    }

    // 완료된 예약은 취소 불가
    if (booking.status === "COMPLETED") {
      throw new Error("완료된 예약은 취소할 수 없습니다");
    }

    return this.repository.cancelBooking(bookingId, cancelledBy, reason);
  }

  /**
   * 예약 상태 업데이트
   */
  async updateBookingStatus(
    bookingId: string,
    status: Booking["status"]
  ): Promise<Booking> {
    return this.repository.updateStatus(bookingId, status);
  }

  /**
   * 시간 문자열을 분으로 변환 (HH:MM -> minutes)
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 예약 파라미터 검증
   */
  private validateBookingParams(params: CreateBookingParams): void {
    if (!params.salonId) throw new Error("살롱 ID가 필요합니다");
    if (!params.customerId) throw new Error("고객 ID가 필요합니다");
    if (!params.designerId) throw new Error("디자이너 ID가 필요합니다");
    if (!params.serviceId) throw new Error("서비스 ID가 필요합니다");
    if (!params.bookingDate) throw new Error("예약 날짜가 필요합니다");
    if (!params.startTime) throw new Error("시작 시간이 필요합니다");
    if (!params.endTime) throw new Error("종료 시간이 필요합니다");
  }
}

/**
 * Service 인스턴스 생성 헬퍼
 */
export const createBookingService = (supabase: SupabaseClient<Database>) => {
  return new BookingService(supabase);
};
