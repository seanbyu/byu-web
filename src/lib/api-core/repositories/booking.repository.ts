/**
 * Booking Repository
 * 예약 데이터 액세스 레이어 - 순수 Supabase 쿼리만 담당
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Booking, InsertTables } from "@/lib/supabase/types";
import { BaseRepository } from "./base.repository";

export class BookingRepository extends BaseRepository<"bookings"> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "bookings");
  }

  /**
   * 특정 디자이너의 특정 날짜 예약 조회
   * 취소/노쇼 제외
   */
  async findByDesignerAndDate(
    designerId: string,
    bookingDate: string
  ): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("designer_id", designerId)
      .eq("booking_date", bookingDate)
      .not("status", "in", '("CANCELLED","NO_SHOW")');

    if (error) throw error;
    return data || [];
  }

  /**
   * 특정 살롱의 특정 날짜 예약 조회
   * 취소/노쇼 제외
   */
  async findBySalonAndDate(
    salonId: string,
    bookingDate: string
  ): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .eq("booking_date", bookingDate)
      .not("status", "in", '("CANCELLED","NO_SHOW")');

    if (error) throw error;
    return data || [];
  }

  /**
   * 특정 고객의 예약 목록 조회
   */
  async findByCustomer(customerId: string): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*, salons(*), services(*)")
      .eq("customer_id", customerId)
      .order("booking_date", { ascending: false })
      .order("start_time", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * 예약 상세 조회 (관련 데이터 포함)
   */
  async findByIdWithDetails(bookingId: string) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select(`
        *,
        salons(*),
        services(*),
        designer:users!bookings_designer_id_fkey(id, name, profile_image)
      `)
      .eq("id", bookingId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 예약 생성
   */
  async createBooking(bookingData: InsertTables<"bookings">): Promise<Booking> {
    const { data, error } = await this.supabase
      .from("bookings")
      .insert(bookingData as never)
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  }

  /**
   * 예약 상태 업데이트
   */
  async updateStatus(
    bookingId: string,
    status: Booking["status"]
  ): Promise<Booking> {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  }

  /**
   * 예약 취소
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<Booking> {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  }
}

/**
 * Repository 인스턴스 생성 헬퍼
 */
export const createBookingRepository = (supabase: SupabaseClient<Database>) => {
  return new BookingRepository(supabase);
};
