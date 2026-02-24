/**
 * Booking Detail API Route
 * GET /api/bookings/[id] - 예약 상세 조회 (LINE 연동 상태 포함)
 */

import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createBookingService } from "@/lib/api-core";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
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

    const bookingService = createBookingService(supabase);
    const data = await bookingService.getBookingDetailsWithLineStatus(id);

    if (!data) {
      return NextResponse.json(
        { success: false, message: "예약을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
