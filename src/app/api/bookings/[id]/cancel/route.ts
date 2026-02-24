/**
 * Booking Cancel API Route
 * POST /api/bookings/[id]/cancel - 예약 취소
 */

import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createBookingService } from "@/lib/api-core";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;

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

    const body = await request.json();
    const reason = body.cancellation_reason || undefined;

    const bookingService = createBookingService(supabase);
    const data = await bookingService.cancelBooking(id, user.id, reason);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
