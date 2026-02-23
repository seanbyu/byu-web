/**
 * Bookings API Routes
 * POST /api/bookings - 예약 생성
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createBookingService } from "@/lib/api-core";
import type { Database } from "@/lib/supabase/types";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST: 예약 생성
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // RLS를 우회하기 위해 service_role 클라이언트 사용
    const supabaseAdmin = getSupabaseAdmin();
    const bookingService = createBookingService(supabaseAdmin);
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
      bookingMeta: body.booking_meta || null,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error("Booking API error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "서버 오류가 발생했습니다";
    const status = message.includes("이미 예약") ? 409 : 500;

    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
