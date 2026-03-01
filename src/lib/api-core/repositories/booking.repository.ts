/**
 * Booking Repository
 * 예약 데이터 액세스 레이어 - 순수 Supabase 쿼리만 담당
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Booking, InsertTables, Json } from "@/lib/supabase/types";
import { BaseRepository } from "./base.repository";

/** RPC get_salon_availability 반환 타입 */
export interface AvailabilitySlot {
  artist_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
}

export class BookingRepository extends BaseRepository<"bookings"> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "bookings");
  }

  /**
   * 살롱의 특정 날짜 예약 가용성 조회 (RPC)
   * SECURITY DEFINER로 RLS를 우회하여 모든 예약의 시간 정보만 반환
   */
  async getSalonAvailability(
    salonId: string,
    bookingDate: string
  ): Promise<AvailabilitySlot[]> {
    const { data, error } = await this.supabase
      .rpc("get_salon_availability", {
        p_salon_id: salonId,
        p_booking_date: bookingDate,
      });

    if (error) throw error;
    return (data || []) as AvailabilitySlot[];
  }

  /**
   * 디자이너의 특정 날짜 예약 가용성 조회 (RPC)
   * SECURITY DEFINER로 RLS를 우회하여 시간 정보만 반환
   */
  async getDesignerAvailability(
    designerId: string,
    bookingDate: string
  ): Promise<AvailabilitySlot[]> {
    const { data, error } = await this.supabase
      .rpc("get_designer_availability", {
        p_artist_id: designerId,
        p_booking_date: bookingDate,
      });

    if (error) throw error;
    return (data || []) as AvailabilitySlot[];
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
      .eq("artist_id", designerId)
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
   * 사용자의 customer ID 목록으로 예약 조회 (관련 데이터 포함)
   */
  async findByCustomerIds(customerIds: string[]) {
    if (customerIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from("bookings")
      .select(`
        *,
        salons(id, name, address, phone, settings),
        services(id, name),
        designer:users!bookings_artist_id_fkey(id, name, profile_image)
      `)
      .in("customer_id", customerIds)
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
        designer:users!bookings_artist_id_fkey(id, name, profile_image)
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
   * 예약 일정 변경
   */
  async rescheduleBooking(
    bookingId: string,
    updates: {
      artist_id: string;
      booking_date: string;
      start_time: string;
      end_time: string;
      booking_meta?: Json;
    }
  ): Promise<Booking> {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        ...updates,
        status: "PENDING",
        updated_at: new Date().toISOString(),
      })
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
