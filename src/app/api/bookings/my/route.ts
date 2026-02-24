/**
 * My Bookings API Route
 * GET /api/bookings/my - 인증된 사용자의 예약 목록 조회
 */

import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createBookingService } from "@/lib/api-core";

export async function GET() {
  try {
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

    const bookingService = createBookingService(supabase);
    const data = await bookingService.getUserBookings(user.id);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
