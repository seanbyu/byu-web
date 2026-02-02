/**
 * Designer Bookings API Routes
 * GET /api/bookings/designer/[designerId]?date=YYYY-MM-DD - 디자이너별 예약 조회
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBookingService } from "@/lib/api-core";
import type { DesignerIdParams } from "../../types";

// GET: 특정 디자이너의 특정 날짜 예약 조회
export async function GET(request: NextRequest, { params }: DesignerIdParams) {
  try {
    const { designerId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, message: "date 파라미터가 필요합니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const bookingService = createBookingService(supabase);

    const bookings = await bookingService.getDesignerBookings(designerId, date);

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Designer bookings API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
