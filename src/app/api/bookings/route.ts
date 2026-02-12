/**
 * Bookings API Routes
 * POST /api/bookings - 예약 생성
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBookingService } from "@/lib/api-core";

// POST: 예약 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const bookingService = createBookingService(supabase);
    const body = await request.json();

    // Service에서 검증 및 생성 처리
    const booking = await bookingService.createBooking({
      salonId: body.salon_id,
      customerId: body.customer_id,
      designerId: body.artist_id,
      serviceId: body.service_id,
      bookingDate: body.booking_date,
      startTime: body.start_time,
      endTime: body.end_time,
      durationMinutes: body.duration_minutes,
      servicePrice: body.service_price || 0,
      customerNotes: body.customer_notes,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("Booking API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    const status = message.includes("이미 예약") ? 409 : 500;

    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
